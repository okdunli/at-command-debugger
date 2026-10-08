from __future__ import annotations

import json
import queue
import re
import threading
import time
from collections import deque
from typing import Any

from ..core import (commands, errorcodes, exporter, paths, presets, profiles,
                    quick, sessionlog, suites, winnative)
from ..core import device_sim
from ..core.buttons import ButtonsStore, replace_vars
from ..core.config import AppConfig, DEFAULTS
from ..core.device_sim import DeviceSimulator
from ..core.protocol import text_to_hex
from ..core import protocol as P
from ..core.runner import Runner
from ..core.serial_mgr import SerialManager

APP_VERSION = "1.0.1"
APP_NAME = "AT指令调试台"


_FIX_POINTS = {
    "n": ("SOUTH", "WEST"),
    "s": ("NORTH", "WEST"),
    "e": ("NORTH", "WEST"),
    "w": ("NORTH", "EAST"),
    "se": ("NORTH", "WEST"),
    "sw": ("NORTH", "EAST"),
    "ne": ("SOUTH", "WEST"),
    "nw": ("SOUTH", "EAST"),
}

WIN_MIN_W = 1120
WIN_MIN_H = 640
WIN_MAX = 12000


def _fix_point(name: str):
    try:
        from webview.window import FixPoint
    except Exception:
        return None
    keys = _FIX_POINTS.get(str(name or "se").lower(), ("NORTH", "WEST"))
    flag = None
    for key in keys:
        value = getattr(FixPoint, key, None)
        if value is None:
            continue
        flag = value if flag is None else (flag | value)
    return flag


class Api:
    def __init__(self) -> None:
        self.cfg = AppConfig()
        self.profile: dict = {}
        self.simulator = DeviceSimulator()
        self.mgr = SerialManager(self.cfg, self.simulator)
        self.runner = Runner(self.mgr, self.cfg)
        self.buttons = ButtonsStore(self.cfg.profile.get("active") or "")
        self._loop_send: dict | None = None
        self._auto_reply: dict | None = None
        self.http_url = ""
        self._win = None
        self._maximized = False
        self._restore_rect = None
        self._event_log: "deque[dict]" = deque(maxlen=4000)
        self._event_seq = 0  # 事件/JS 共用单调递增序号，各 UI 持游标独立拉取
        self._js_log: "deque[dict]" = deque(maxlen=1000)

        self._js_results: dict[str, dict] = {}
        self._sub = self.mgr.subscribe()
        self._pump_thread = threading.Thread(target=self._pump, daemon=True)
        self._pump_thread.start()
        self._progress: dict[str, Any] = {
            "active": False, "kind": "", "label": "",
            "done": 0, "total": 0, "items": [], "finished": False,
            "summary": None,
        }
        self._worker: threading.Thread | None = None
        self._last_result: dict[str, Any] | None = None
        self._history: list[str] = self._load_history()
        self._ports_cache: dict[str, Any] = {"devices": None, "list": [],
                                             "t": 0.0}
        self._rx_warned = False
        self.runner.on_send = self.log_tx

        try:
            # 初始化：生成/补全 config.json（缺一补全，已有值不覆盖）
            self.cfg.ensure_defaults()
        except Exception:
            pass
        try:
            profiles.seed_builtin()
        except Exception:
            pass
        self.activate_profile(self.cfg.profile.get("active") or "",
                              persist=False)


    def _resolve_profile(self, wanted: str) -> str:
        available = [p["id"] for p in profiles.list_profiles()]
        if wanted and wanted in available:
            return wanted
        if profiles.DEFAULT_PROFILE_ID in available:
            return profiles.DEFAULT_PROFILE_ID
        return available[0] if available else ""

    def activate_profile(self, profile_id: str, persist: bool = True) -> dict:
        target = self._resolve_profile(profile_id)
        self.profile = commands.load_profile(target) if target else {}
        presets.refresh(self.profile)
        quick.refresh(self.profile, target)
        suites.refresh(self.profile)
        device_sim.refresh(self.profile)
        P.set_style((self.profile.get("device") or {}).get("style", "an5481"))

        errorcodes.set_active(target,
                              (self.profile.get("device") or {})
                              .get("style", "an5481"),
                              self.profile.get("error_codes"))
        self.simulator._reset_state()
        self.buttons.switch_profile(target, self.profile.get("buttons") or [])
        if persist and target:
            self.cfg.set("profile", "active", target)
        return {"ok": True, "profile": self.profile_meta(target)}

    @staticmethod
    def profile_meta(profile_id: str) -> dict:
        for item in profiles.list_profiles():
            if item["id"] == profile_id:
                return item
        return {"id": profile_id, "name": profile_id, "source": "missing"}

    def list_profiles(self) -> dict:
        items = profiles.list_profiles()
        return {
            "ok": True,
            "profiles": items,
            "active": commands.PROFILE_ID,
            "show_in_titlebar": bool(self.cfg.profile.get("window", True)),
        }

    def switch_profile(self, profile_id: str) -> dict:
        if self.runner.running:
            return {"ok": False, "error": "任务执行中，暂不能切换配置集"}
        result = self.activate_profile(profile_id)
        name = result["profile"].get("name") or profile_id
        self.log_sys(f"已切换到配置集：{name}")
        return result

    def new_profile(self, profile_id: str, name: str = "", base: str = "",
                    brand: str = "", subtitle: str = "") -> dict:
        try:
            meta = profiles.create(profile_id, name or profile_id, base=base,
                                   brand=brand, subtitle=subtitle)
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True, "profile": meta,
                "profiles": profiles.list_profiles()}

    def duplicate_profile(self, profile_id: str, new_id: str,
                          new_name: str = "") -> dict:
        try:
            meta = profiles.duplicate(profile_id, new_id, new_name)
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True, "profile": meta,
                "profiles": profiles.list_profiles()}

    def delete_profile(self, profile_id: str) -> dict:
        if profile_id == commands.PROFILE_ID:
            return {"ok": False, "error": "不能删除当前正在使用的配置集"}
        if not profiles.is_writable(profile_id):
            return {"ok": False, "error": "该配置集为内置模板，请先「复制为自定义配置」后再删除"}
        ok = profiles.delete(profile_id)
        return {"ok": ok, "profiles": profiles.list_profiles(),
                "error": "" if ok else "删除失败"}

    def export_profile(self, profile_id: str = "") -> dict:
        target = profile_id or commands.PROFILE_ID
        try:
            package = profiles.export(target)
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        path = exporter.export_json(package, f"profile-{target}")
        return {"ok": True, "path": str(path)}

    def import_profile(self, data: dict | str, override_id: str = "") -> dict:
        try:
            meta = profiles.import_package(data, override_id)
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True, "profile": meta,
                "profiles": profiles.list_profiles()}

    def open_profiles_dir(self) -> dict:
        target = paths.builtin_profiles_dir()
        if not target.exists():
            target = profiles.user_profiles_dir()
        ok = exporter.open_in_explorer(target)
        return {"ok": ok, "path": str(target)}

    def get_profile(self, profile_id: str = "") -> dict:
        target = profile_id or commands.PROFILE_ID
        try:
            return {"ok": True, "id": target, "profile": profiles.load(target)}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def save_profile(self, data: dict, profile_id: str = "") -> dict:
        target = profile_id or commands.PROFILE_ID
        if not target:
            return {"ok": False, "error": "缺少配置集标识"}
        profiles.save_in_place(target, data or {})
        if target == commands.PROFILE_ID:
            self.activate_profile(target, persist=False)
        return {"ok": True, "profiles": profiles.list_profiles()}

    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    def _persist_profile(self) -> dict:
        target = commands.PROFILE_ID
        profiles.save_in_place(target, self.profile)
        commands.refresh(self.profile, target)
        presets.refresh(self.profile)
        suites.refresh(self.profile)
        quick.refresh(self.profile, target)
        return {"ok": True}

    def _preset_list(self) -> list:
        return [
            {"id": p["id"], "name": p["name"], "desc": p["desc"],
             "icon": p.get("icon", "bolt"), "accent": p.get("accent", "blue"),
             "danger": bool(p.get("danger")),
             "fields": [dict(f) for f in p["fields"]]}
            for p in presets.PRESETS
        ]

    def _suite_list(self) -> list:
        return [
            {"id": s["id"], "name": s["name"], "desc": s["desc"],
             "icon": s.get("icon", "check"),
             "cases": [
                 {"id": c.get("id") or c.get("cmd", ""),
                  "name": c.get("name") or c.get("title") or c.get("cmd", ""),
                  "cmd": c["cmd"], "skip": bool(c.get("skip")),
                  "dangerous": bool(c.get("dangerous")),
                  "expect": c.get("expect", "OK"),
                  "note": c.get("note", "")}
                 for c in s.get("cases", [])
             ]}
            for s in suites.SUITES
        ]

    def _command_list(self) -> list:
        return [
            {"id": c["id"], "name": c["id"], "category": c["category"],
             "summary": c["summary"], "desc": c.get("desc", ""),
             "modes": c.get("modes", []), "params": c.get("params", []),
             "results": c.get("results", []), "example": c.get("example", []),
             "dangerous": bool(c.get("danger")) or bool(c.get("no_status")),
             "suggest": commands.suggestion_for(c["id"])}
            for c in commands.COMMANDS
        ]

    def update_profile_meta(self, meta: dict) -> dict:
        meta = meta or {}
        for key in ("name", "brand", "subtitle", "icon", "version",
                    "author", "release_date", "website", "intro", "doc"):
            if key in meta:
                self.profile[key] = meta[key]
        self._persist_profile()
        return {"ok": True, "profiles": profiles.list_profiles()}


    def get_home(self) -> dict:
        home = self.profile.get("home") or {}
        pinned_raw = home.get("pinned") or []
        resolved = []
        for ref in pinned_raw:
            kind = ref.get("kind")
            rid = ref.get("id")
            entry = {"ref": f"{kind}:{rid}", "kind": kind, "id": rid}
            if kind == "preset":
                p = presets.PRESET_MAP.get(rid)
                if not p:
                    continue
                entry.update(name=p["name"], icon=p.get("icon", "bolt"),
                             sub=p.get("desc", ""), accent=p.get("accent", "blue"),
                             has_params=bool(p.get("fields")))
            elif kind == "button":
                b = self.buttons.get(rid)
                if not b:
                    continue
                entry.update(name=b["name"], icon=b.get("icon", "bolt"),
                             sub=b.get("note", "") or "常用功能",
                             accent=b.get("color", "blue"), has_params=False)
            elif kind == "suite":
                s = suites.SUITE_MAP.get(rid)
                if not s:
                    continue
                entry.update(name=s["name"], icon=s.get("icon", "check"),
                             sub=f'{len(s.get("cases", []))} 个用例',
                             accent="blue", has_params=False)
            else:
                continue
            resolved.append(entry)
        return {"ok": True, "intro": home.get("intro", ""),
                "pinned": resolved, "edit_mode": self._edit_mode()}

    def _edit_mode(self) -> bool:
        return bool(self.cfg.get("profile", "edit_mode", True))

    def pin_item(self, kind: str, item_id: str) -> dict:
        if kind not in ("preset", "button", "suite"):
            return {"ok": False, "error": "不支持的收藏类型"}
        home = self.profile.setdefault("home", {})
        pinned = home.setdefault("pinned", [])
        if any(p.get("kind") == kind and p.get("id") == item_id for p in pinned):
            return {"ok": True, "already": True, **self.get_home()}
        pinned.append({"kind": kind, "id": item_id})
        self._persist_profile()
        return {"ok": True, **self.get_home()}

    def unpin_item(self, kind: str, item_id: str) -> dict:
        home = self.profile.setdefault("home", {})
        home["pinned"] = [p for p in (home.get("pinned") or [])
                          if not (p.get("kind") == kind and p.get("id") == item_id)]
        self._persist_profile()
        return {"ok": True, **self.get_home()}

    def reorder_pinned(self, refs: list) -> dict:
        home = self.profile.setdefault("home", {})
        home["pinned"] = [
            {"kind": str(r).split(":", 1)[0], "id": str(r).split(":", 1)[1]}
            for r in (refs or []) if ":" in str(r)
        ]
        self._persist_profile()
        return {"ok": True, **self.get_home()}

    def run_pinned(self, ref: str) -> dict:
        if ":" not in (ref or ""):
            return {"ok": False, "error": "格式错误"}
        kind, item_id = ref.split(":", 1)
        if kind == "preset":
            p = presets.PRESET_MAP.get(item_id)
            if not p:
                return {"ok": False, "error": "场景不存在"}
            if p.get("fields"):
                return {"ok": False, "need_params": True, "ref": ref}
            return self.run_preset(item_id, {})
        if kind == "button":
            return self.run_button(item_id)
        if kind == "suite":
            return self.run_suite([item_id])
        return {"ok": False, "error": "未知类型"}


    def add_preset(self, payload: dict) -> dict:
        arr = self.profile.setdefault("presets", [])
        pid = str(payload.get("id") or "").strip()
        if not pid:
            pid = "p" + str(int(time.time()))[4:]
        payload = dict(payload)
        payload["id"] = pid
        arr.append(payload)
        self._persist_profile()
        return {"ok": True, "presets": self._preset_list()}

    def update_preset(self, preset_id: str, payload: dict) -> dict:
        for p in self.profile.setdefault("presets", []):
            if p.get("id") == preset_id:
                for k, v in payload.items():
                    if k != "id":
                        p[k] = v
                break
        else:
            return {"ok": False, "error": "场景不存在"}
        self._persist_profile()
        return {"ok": True, "presets": self._preset_list()}

    def delete_preset(self, preset_id: str) -> dict:
        arr = self.profile.setdefault("presets", [])
        self.profile["presets"] = [p for p in arr if p.get("id") != preset_id]
        self._persist_profile()
        return {"ok": True, "presets": self._preset_list()}


    def add_suite(self, payload: dict) -> dict:
        arr = self.profile.setdefault("suites", [])
        sid = str(payload.get("id") or "").strip() or "s" + str(int(time.time()))[4:]
        payload = dict(payload)
        payload["id"] = sid
        payload.setdefault("cases", [])
        arr.append(payload)
        self._persist_profile()
        return {"ok": True, "suites": self._suite_list()}

    def update_suite(self, suite_id: str, payload: dict) -> dict:
        for s in self.profile.setdefault("suites", []):
            if s.get("id") == suite_id:
                for k, v in payload.items():
                    if k != "id":
                        s[k] = v
                break
        else:
            return {"ok": False, "error": "套件不存在"}
        self._persist_profile()
        return {"ok": True, "suites": self._suite_list()}

    def delete_suite(self, suite_id: str) -> dict:
        arr = self.profile.setdefault("suites", [])
        self.profile["suites"] = [s for s in arr if s.get("id") != suite_id]
        self._persist_profile()
        return {"ok": True, "suites": self._suite_list()}

    def set_suite_cases(self, suite_id: str, cases: list) -> dict:
        for s in self.profile.setdefault("suites", []):
            if s.get("id") == suite_id:
                s["cases"] = cases
                break
        else:
            return {"ok": False, "error": "套件不存在"}
        self._persist_profile()
        return {"ok": True, "suites": self._suite_list()}


    def add_command(self, payload: dict) -> dict:
        arr = self.profile.setdefault("commands", [])
        cid = str(payload.get("id") or "").strip().upper()
        if not cid:
            return {"ok": False, "error": "指令 id 不能为空"}
        payload = dict(payload)
        payload["id"] = cid
        arr.append(payload)
        self._persist_profile()
        return {"ok": True, "commands": self._command_list()}

    def update_command(self, cmd_id: str, payload: dict) -> dict:
        for c in self.profile.setdefault("commands", []):
            if c.get("id") == cmd_id:
                for k, v in payload.items():
                    if k != "id":
                        c[k] = v
                break
        else:
            return {"ok": False, "error": "指令不存在"}
        self._persist_profile()
        return {"ok": True, "commands": self._command_list()}

    def delete_command(self, cmd_id: str) -> dict:
        arr = self.profile.setdefault("commands", [])
        self.profile["commands"] = [c for c in arr if c.get("id") != cmd_id]
        self._persist_profile()
        return {"ok": True, "commands": self._command_list()}



    def get_error_codes(self) -> dict:
        return {"ok": True, "codes": errorcodes.all_codes(),
                "policies": list(errorcodes.POLICIES),
                "info": errorcodes.active_info()}

    def save_error_codes(self, codes: list) -> dict:
        r = errorcodes.save_active(codes)
        if not r.get("ok"):
            return r
        return {"ok": True, "info": r["info"],
                "codes": errorcodes.all_codes()}

    def reset_error_codes(self) -> dict:
        r = errorcodes.reset_active()
        if not r.get("ok"):
            return r
        return {"ok": True, "info": r["info"],
                "codes": errorcodes.all_codes()}


    def list_session_logs(self) -> dict:
        return {"ok": True, "sessions": sessionlog.list_sessions(),
                "current": sessionlog.current_session()}

    def read_session_log(self, name: str = "") -> dict:
        events = sessionlog.read_session(name or "")
        if not events:
            return {"ok": False, "error": "日志不存在或为空"}
        return {"ok": True, "events": events, "count": len(events)}

    def delete_session_log(self, name: str = "") -> dict:
        ok = sessionlog.delete_session(name or "")
        return {"ok": ok, "error": "" if ok else "删除失败"}

    def export_session_log(self, name: str = "", fmt: str = "txt") -> dict:
        path = sessionlog.export_session(name or "", fmt or "txt")
        if not path:
            return {"ok": False, "error": "导出失败（日志不存在或为空）"}
        return {"ok": True, "path": path}

    def import_log_file(self, path: str = "") -> dict:
        r = sessionlog.import_external(path or "")
        return r

    def open_logs_folder(self) -> dict:
        try:
            import os
            os.startfile(str(sessionlog.logs_dir()))  # type: ignore[attr-defined]
            return {"ok": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}


    def reorder_presets(self, ids: list) -> dict:
        arr = self.profile.setdefault("presets", [])
        pos = {str(i): n for n, i in enumerate(ids or [])}
        arr.sort(key=lambda p: pos.get(str(p.get("id")), 10 ** 9))
        self._persist_profile()
        return {"ok": True, "presets": self._preset_list()}

    def reorder_buttons(self, ids: list) -> dict:
        order = {str(i): n for n, i in enumerate(ids or [])}
        self.buttons.reorder(order)
        self._persist_profile()
        return {"ok": True, "buttons": self.buttons.all()}

    def set_button_group(self, button_id: str = "", group: str = "") -> dict:
        ok = self.buttons.set_group(button_id or "", group or "")
        return {"ok": ok, "error": "" if ok else "按钮不存在",
                "buttons": self.buttons.all()}

    def reorder_commands(self, ids: list) -> dict:
        arr = self.profile.setdefault("commands", [])
        order = {str(i): n for n, i in enumerate(ids or [])}
        arr.sort(key=lambda c: order.get(str(c.get("id")), 10 ** 9))
        self._persist_profile()
        return {"ok": True, "commands": self._command_list()}

    def reorder_suites(self, ids: list) -> dict:
        arr = self.profile.setdefault("suites", [])
        order = {str(i): n for n, i in enumerate(ids or [])}
        arr.sort(key=lambda s: order.get(str(s.get("id")), 10 ** 9))
        self._persist_profile()
        return {"ok": True, "suites": self._suite_list()}


    def call(self, params: dict | None = None) -> dict:
        params = params or {}
        if not isinstance(params, dict):
            return {"ok": False, "error": "参数格式错误"}
        name = str(params.get("method") or "")
        args = params.get("args") or {}
        if not isinstance(args, dict):
            args = {}
        method = getattr(self, name, None)
        if method is None or name.startswith("_"):
            return {"ok": False, "error": f"未知接口：{name}"}
        try:
            result = method(**args)
        except TypeError as exc:
            return {"ok": False, "error": f"参数错误：{exc}"}
        except Exception as exc:
            return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
        if isinstance(result, dict):
            return result
        return {"ok": True, "result": result}


    def start_window_drag(self) -> dict:
        if self._win is None:
            return {"ok": False, "error": "浏览器模式下不可用"}
        if not winnative.available():
            return {"ok": False, "native": False, "error": "非 Windows 平台"}
        if self._maximized:
            try:
                self._win.restore()
                self._maximized = False
            except Exception:
                pass
            time.sleep(0.05)
        ok = winnative.drag_loop(self._win)

        rect = self.get_window_rect()
        if rect.get("ok"):
            self.save_window_state({
                "width": rect["width"],
                "height": rect["height"],
                "x": rect["x"],
                "y": rect["y"],
                "maximized": False,
            })
        return {"ok": bool(ok), "native": True, "rect": rect}

    def window_system_menu(self) -> dict:
        if self._win is None:
            return {"ok": False, "error": "浏览器模式下不可用"}
        if not winnative.available():
            return {"ok": False, "error": "非 Windows 平台"}
        threading.Thread(target=winnative.show_system_menu,
                         args=(self._win,), daemon=True).start()
        return {"ok": True}

    def window_system_command(self, command: str) -> dict:
        if self._win is None:
            return {"ok": False, "error": "浏览器模式下不可用"}
        name = str(command or "").lower()

        if winnative.available() and name in (
                "minimize", "maximize", "restore", "close", "size", "menu"):
            if name == "menu":
                return self._win_system_menu()
            ok = winnative.system_command(self._win, name)
            if ok:
                if name in ("maximize", "restore"):
                    self._maximized = name == "maximize"
                return {"ok": True}
        try:
            if name == "minimize":
                self._win.minimize()
            elif name == "maximize":
                self._do_maximize()
            elif name == "restore":
                self._do_restore()
            else:
                return {"ok": False, "error": f"未知窗口命令：{command}"}
            return {"ok": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def minimize_window(self) -> dict:
        try:
            self._win.minimize()
            return {"ok": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def toggle_fullscreen(self) -> dict:
        try:
            self._win.toggle_fullscreen()
            return {"ok": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def resize_window(self, width: float, height: float,
                      fix_point: str = "se") -> dict:
        if self._win is None:
            return {"ok": False, "error": "浏览器模式下无法调整窗口"}
        try:
            w = int(round(float(width)))
            h = int(round(float(height)))
        except (TypeError, ValueError):
            return {"ok": False, "error": "尺寸参数无效"}
        w = max(WIN_MIN_W, min(w, WIN_MAX))
        h = max(WIN_MIN_H, min(h, WIN_MAX))
        try:
            self._win.resize(w, h, _fix_point(fix_point))
            return {"ok": True, "width": w, "height": h}
        except Exception as exc:
            return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}

    def get_window_rect(self) -> dict:
        if self._win is None:
            return {"ok": False, "error": "浏览器模式下无窗口信息"}
        try:
            geometry = winnative.logical_geometry(self._win)
            if geometry is not None:
                return {"ok": True, **geometry}
        except Exception:
            pass
        try:
            return {
                "ok": True,
                "x": int(self._win.x),
                "y": int(self._win.y),
                "width": int(self._win.width),
                "height": int(self._win.height),
            }
        except Exception as exc:
            return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}

    def commit_window_state(self) -> dict:
        rect = self.get_window_rect()
        if rect.get("ok"):
            self.save_window_state({
                "width": rect["width"],
                "height": rect["height"],
                "x": rect["x"],
                "y": rect["y"],
                "maximized": bool(self._maximized),
            })
        return {"ok": True}

    def toggle_maximize(self) -> dict:
        if self._win is None:
            return {"ok": False, "error": "浏览器模式下无法最大化"}
        try:
            if self._maximized:
                self._do_restore()
            else:
                self._do_maximize()
            return {"ok": True, "maximized": self._maximized}
        except Exception as exc:
            return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}

    def _do_maximize(self) -> None:
        """最大化到显示器的工作区（不含任务栏）。无边框窗口用系统 maximize 会
        盖住任务栏，这里改为直接用工作区物理坐标 SetWindowPos。"""
        if self._maximized or self._win is None:
            return
        rect = self.get_window_rect()
        if rect.get("ok"):
            self._restore_rect = rect
        wa = winnative.work_area_physical(self._win)
        if not wa or not winnative.set_rect_physical(
                self._win, wa["x"], wa["y"], wa["width"], wa["height"]):
            try:
                self._win.maximize()
            except Exception:
                pass
        self._maximized = True

    def _do_restore(self) -> None:
        if not self._maximized or self._win is None:
            return
        self._maximized = False
        rr = getattr(self, "_restore_rect", None)
        if rr and rr.get("ok"):
            try:
                self._win.move(int(rr["x"]), int(rr["y"]))
                self._win.resize(int(rr["width"]), int(rr["height"]), "nw")
                return
            except Exception:
                pass
        try:
            self._win.restore()
        except Exception:
            pass

    def reset_window_size(self) -> dict:
        default = dict(DEFAULTS.get("window") or {})
        width = int(default.get("width") or 1120)
        height = int(default.get("height") or 720)
        result = self.resize_window(width, height, "nw")
        if result.get("ok"):
            self._win.move(int(self._win.x), int(self._win.y))
            self.commit_window_state()
        return result

    def close_window(self) -> dict:
        try:
            self._win.destroy()
            return {"ok": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}


    def _pump(self) -> None:
        while True:
            try:
                item = self._sub.get(timeout=0.2)
            except queue.Empty:
                continue
            if item.get("type") != "rx":
                continue
            self._push_event({
                "dir": "rx",
                "text": item.get("text", ""),
                "hex": item.get("hex", ""),
                "ts": item.get("ts", time.time()),
                "sim": bool(item.get("sim")),
            })

            rule = self._auto_reply
            if rule and rule["keyword"].upper() in str(item.get("text", "")).upper():
                def send_reply(rule=rule):
                    try:
                        time.sleep(rule["delay_ms"] / 1000.0)
                        if rule["mode"] == "hex":
                            data = bytes.fromhex(
                                "".join(rule["reply"].split()))
                            label = "[HEX] " + data.hex(" ").upper()
                        else:
                            data = (rule["reply"].encode("utf-8")
                                    + self._line_ending_bytes())
                            label = rule["reply"]
                        self._raw_tx(data, label)
                    except Exception:
                        pass
                threading.Thread(target=send_reply, name="AutoReply",
                                 daemon=True).start()

    def _push_event(self, event: dict) -> None:

        try:
            sessionlog.record(event)
        except Exception:
            pass

        if event.get("dir") == "rx" and not event.get("err"):
            try:
                hits = [h for h in errorcodes.scan(str(event.get("text") or ""))
                        if h["severity"] in ("err", "fatal", "warn")]
                if hits:
                    event["err"] = hits
            except Exception:
                pass
        try:
            event = dict(event)
            self._event_seq += 1
            event["seq"] = self._event_seq
            self._event_log.append(event)
        except Exception:
            pass

    def log_tx(self, cmd: str) -> None:
        self._push_event({
            "dir": "tx",
            "text": cmd,
            "hex": cmd.encode("utf-8", errors="replace").hex(" ").upper(),
            "ts": time.time(),
        })

    def log_sys(self, text: str) -> None:
        self._push_event({"dir": "sys", "text": text, "hex": "",
                          "ts": time.time()})


    def get_boot(self) -> dict:
        profile = self.profile or {}
        brand = profile.get("brand") or profile.get("name") or APP_NAME
        return {
            "app": APP_NAME,
            "brand": brand,
            "subtitle": profile.get("subtitle") or "",
            "profile_id": commands.PROFILE_ID,
            "profile_name": profile.get("name") or commands.PROFILE_ID,
            "profile_icon": profile.get("icon") or "terminal",
            "profile_version": profile.get("version") or "",
            "profile_author": profile.get("author") or "",
            "profile_release_date": profile.get("release_date") or "",
            "profile_website": profile.get("website") or "",
            "profile_intro": profile.get("intro") or "",
            "edit_mode": self._edit_mode(),
            "profiles": profiles.list_profiles(),
            "show_profile_picker": bool(self.cfg.profile.get("window", True)),
            "defaults": dict(commands.DEFAULTS),
            "version": str(profile.get("app_version") or APP_VERSION),
            "platform": paths.platform_label(),
            "python_platform": __import__("sys").platform,
            "frozen": paths.is_frozen(),
            "instance": paths.instance_name(),
            "data_dir": str(paths.runtime_dir()),
            "profiles_dir": str(paths.builtin_profiles_dir()),
            "config": self.cfg.to_dict(),
            "ports": SerialManager.list_ports(),
            "categories": commands.CATEGORIES,
            "presets": [
                {"id": p["id"], "name": p["name"], "desc": p["desc"],
                 "icon": p.get("icon", "bolt"), "accent": p.get("accent", "blue"),
                 "danger": bool(p.get("danger")),
                 "fields": p["fields"]}
                for p in presets.PRESETS
            ],
            "suites": [
                {"id": s["id"], "name": s["name"], "desc": s["desc"],
                 "icon": s.get("icon", "check"),
                 "cases": [
                     {"id": c.get("id") or c.get("cmd", ""),
                      "name": c.get("name") or c.get("title") or c.get("cmd", ""),
                      "cmd": c["cmd"],
                      "skip": bool(c.get("skip")),
                      "dangerous": bool(c.get("dangerous")),
                      "expect": c.get("expect", "OK"),
                      "note": c.get("note", "")}
                     for c in s.get("cases", [])
                 ]}
                for s in suites.SUITES
            ],
            "buttons": self.buttons.all(),
            "home": self.get_home(),
            "status": self.mgr.status(),
            "history": self.get_history(),
            "http_url": self.http_url,
            "session_log": sessionlog.current_session(),
            "error_code_count": len(errorcodes.CODES),
            "command_count": len(commands.COMMANDS),
            "case_count": suites.total_count(),
        }

    def list_ports(self) -> list[dict]:
        return SerialManager.list_ports()

    def get_status(self) -> dict:
        return self.mgr.status()

    def poll(self, last_seq: int | None = None) -> dict:
        """游标式拉取：各 UI 界面持自己的 last_seq 独立读取事件日志，
        互不消费，多个界面（软件窗口 + 浏览器）可同步看到完整串口输出。"""
        events: list[dict] = []
        js: list[dict] = []
        seq = self._event_seq
        if last_seq is not None:
            try:
                cursor = int(last_seq)
            except (TypeError, ValueError):
                cursor = 0
            for ev in self._event_log:
                if ev.get("seq", 0) > cursor:
                    if len(events) < 400:
                        events.append(ev)
                    seq = max(seq, ev.get("seq", 0))
            for item in self._js_log:
                if item.get("seq", 0) > cursor:
                    if len(js) < 40:
                        js.append(item)
                    seq = max(seq, item.get("seq", 0))
        return {
            "events": events,
            "status": self.mgr.status(),
            "progress": self._progress,
            "running": self.runner.running,
            "busy": bool(self._busy_reason()),
            "loop_send": self.loop_send_status(),
            "js": js,
            "ports": self._check_ports(),
            "rx_silent": self._check_rx_silence(),
            "seq": seq,
        }

    def _check_rx_silence(self) -> bool:
        status = self.mgr.status()
        if not status.get("connected") or status.get("virtual"):
            self._rx_warned = False
            return False
        if self._rx_warned or status.get("bytes_in"):
            return False
        cat = status.get("connected_at")
        if not cat or time.time() - cat < 10.0:
            return False
        self._rx_warned = True
        flow = str(self.cfg.serial.get("flowcontrol", "none"))
        base = ("已连接 {:.0f} 秒未收到任何数据。".format(time.time() - cat))
        if status.get("bytes_out"):
            base += ("已发出 {} 字节但毫无回应——大概率是波特率或流控不匹配："
                     "当前 {}bps / 流控 {}，模组常见 9600 或 115200、"
                     "8N1 无流控；可点波特率旁的雷达按钮自动探测波特率。"
                     ).format(status["bytes_out"],
                              status.get("baudrate"), flow)
        else:
            base += ("模组可能未上电、TX/RX 未接或波特率不匹配"
                     "（当前 {}bps / 流控 {}）。").format(
                         status.get("baudrate"), flow)
        self.log_sys(base)
        return True

    def _check_ports(self) -> dict | None:
        now = time.time()
        c = self._ports_cache
        if c["devices"] is not None and now - c["t"] < 2.0:
            return None
        try:
            ports = SerialManager.list_ports()
        except Exception:
            return None
        devices = [str(p.get("device") or "") for p in ports]
        prev = c["devices"]
        c["list"] = ports
        c["devices"] = devices
        c["t"] = now
        if prev is None or devices == prev:
            return None
        added = [d for d in devices if prev and d not in prev]
        removed = [d for d in prev if d not in devices]
        for d in added:
            self.log_sys(f"检测到新串口：{d}")
        for d in removed:
            self.log_sys(f"串口已移除：{d}")
            if self.mgr.is_open and self.mgr.port_name == d:
                self.log_sys("当前连接的串口已被拔出，连接可能中断")
        return {"changed": True, "list": ports,
                "added": added, "removed": removed}

    def set_topmost(self, on: bool = True, save: bool = True) -> dict:
        try:
            from ..core import winnative
            ok = winnative.set_topmost(self._win, bool(on))
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        if save and ok:
            self.cfg.set("window", "topmost", bool(on))
        return {"ok": ok, "topmost": bool(on)}


    def _push_js(self, script: str, tag: str = "") -> None:
        self._event_seq += 1
        self._js_log.append({"tag": tag, "script": script,
                             "seq": self._event_seq})

    def _wait_js(self, tag: str, timeout: float = 8.0):
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                item = self._js_results.pop(tag, None)
            except Exception:
                item = None
            if item is not None:
                return item
            time.sleep(0.05)
        return None

    def js_eval(self, script: str, timeout: float = 8.0):
        tag = f"t{int(time.time() * 1000) % 100000000}{len(script)}"
        self._push_js(script, tag)
        return self._wait_js(tag, timeout)

    def report_js(self, tag: str, value: Any = None,
                  error: str = "") -> dict:
        self._js_results[tag] = {"tag": tag, "value": value, "error": error}
        return {"ok": True}

    def js_click(self, selector: str, timeout: float = 6.0):
        script = (
            "(() => { const el = document.querySelector(%s);"
            " if (!el) return 'ERR:no-el';"
            " ['pointerdown','mousedown','pointerup','mouseup','click']"
            ".forEach(t => el.dispatchEvent(new MouseEvent(t,"
            " {bubbles:true,cancelable:true,view:window,button:0})));"
            " return 'OK'; })()"
        ) % json.dumps(selector)
        return self.js_eval(script, timeout)

    def js_text(self, selector: str, timeout: float = 6.0):
        script = (
            "(() => { const el = document.querySelector(%s);"
            " return el ? (el.textContent || '').trim() : 'ERR:no-el'; })()"
        ) % json.dumps(selector)
        return self.js_eval(script, timeout)

    def js_rect(self, selector: str, timeout: float = 6.0):
        script = (
            "(() => { const el = document.querySelector(%s);"
            " if (!el) return null; const r = el.getBoundingClientRect();"
            " return {left:r.left, top:r.top, width:r.width, height:r.height}; })()"
        ) % json.dumps(selector)
        return self.js_eval(script, timeout)

    def js_drag_mouse(self, selector: str, dx: int, dy: int,
                      timeout: float = 8.0):
        script = (
            "(function(){ const h = document.querySelector(%s);"
            " if (!h) return 'ERR:no-handle';"
            " const r = h.getBoundingClientRect();"
            " const cx = r.left + r.width/2, cy = r.top + r.height/2;"
            " const mk = (t,sx,sy) => new MouseEvent(t,{bubbles:true,"
            " cancelable:true,view:window,button:0,buttons:1,clientX:cx,"
            " clientY:cy,screenX:sx,screenY:sy});"
            " setTimeout(function(){ h.dispatchEvent(mk('mousedown',500,400));"
            " setTimeout(()=>window.dispatchEvent(mk('mousemove',"
            " 500+%d/2,400+%d/2)),40);"
            " setTimeout(()=>window.dispatchEvent(mk('mousemove',"
            " 500+%d,400+%d)),80);"
            " setTimeout(()=>window.dispatchEvent(mk('mouseup',"
            " 500+%d,400+%d)),160); },0);"
            " return 'OK'; })()"
        ) % (json.dumps(selector), dx, dy, dx, dy, dx, dy)
        return self.js_eval(script, timeout)


    def connect(self, port: str = "", baudrate: int | None = None,
                **kwargs) -> dict:
        overrides: dict[str, Any] = {}
        if baudrate:
            overrides["baudrate"] = int(baudrate)
        for key in ("bytesize", "parity", "stopbits", "flowcontrol", "timeout"):
            if key in kwargs and kwargs[key] not in (None, ""):
                overrides[key] = kwargs[key]
        result = self.mgr.connect(port, **overrides)
        if result.get("ok"):
            self.cfg.set("serial", "port", result.get("port", port))
            st = self.mgr.status()
            self._rx_warned = False
            pins = st.get("pins") or {}
            dtr = pins.get("dtr") if pins else "?"
            rts = pins.get("rts") if pins else "?"
            cts = pins.get("cts") if pins else "?"
            dsr = pins.get("dsr") if pins else "?"
            self.log_sys("已连接 {} @ {}bps / 流控 {} / DTR {} RTS {} / CTS {} DSR {}".format(
                st.get("port"), st.get("baudrate"),
                self.cfg.serial.get("flowcontrol", "none"),
                dtr, rts, cts, dsr))
            sess = sessionlog.start_session(str(result.get("port", port)))
            if sess:
                self.log_sys("本会话日志：" + sess["path"])
        else:
            self.log_sys("连接失败：" + str(result.get("error")))
        return result

    def disconnect(self) -> dict:
        self.stop_loop_send(silent=True)
        result = self.mgr.disconnect()
        sess = sessionlog.stop_session()
        if sess and sess.get("count"):
            self.log_sys("会话日志已保存：" + sess["path"] +
                         "（" + str(sess["count"]) + " 行）")
        self.log_sys("已断开串口")
        return result

    def auto_connect_last(self) -> dict:
        if not self.cfg.behavior.get("auto_connect", False):
            return {"ok": False, "skipped": True, "reason": "未开启自动连接"}
        port = str(self.cfg.serial.get("port") or "").strip()
        if not port:
            return {"ok": False, "skipped": True, "reason": "没有记录上次端口"}
        return self.connect(port)


    def _busy_reason(self) -> str:
        if self.runner.running:
            return "批量任务执行中"
        if self._loop_send:
            return "循环发送进行中"
        return ""

    def send_command(self, cmd: str, wait_event: float = 0.0,
                     expect: str = "OK", timeout: float | None = None,
                     no_status: bool = False, line_ending: str = "") -> dict:
        cmd = (cmd or "").strip()
        if not cmd:
            return {"ok": False, "error": "指令为空"}
        busy = self._busy_reason()
        if busy:
            return {"ok": False,
                    "error": busy + "，已拦截下发（等执行完毕或点「停止」）"}
        self._remember(cmd)
        if timeout is None:
            # 未显式指定超时时，套用指令库中该指令的专属超时（配网/扫描等慢指令）
            try:
                base = cmd.split("=")[0].split("?")[0].strip().upper()
                entry = commands.COMMAND_MAP.get(base) or {}
                if entry.get("timeout"):
                    timeout = float(entry["timeout"])
            except Exception:
                timeout = None
        result = self.runner.send(cmd, timeout=timeout,
                                  wait_event=float(wait_event or 0),
                                  expect=expect, no_status=no_status,
                                  line_ending=str(line_ending or ""))
        if not result.get("ok") and not result.get("hint"):
            try:
                if self.mgr.status().get("bytes_in", 0) == 0:
                    flow = str(self.cfg.serial.get("flowcontrol", "none")).lower()
                    flow_tip = ""
                    if flow != "none":
                        flow_tip = ("；当前流控为 " + flow +
                                    "，若 USB 转串口板未接 CTS/RTS，模组会被硬件流控挡住不发数据，"
                                    "建议在「设置 → 串口」改为「无」")
                    port = self.mgr.port_name or "该端口"
                    result["hint"] = (
                        "模组未返回任何数据（已下发但 0 字节回包）。先看状态栏的"
                        "「↓X B」计数器："
                        "• 若 ↓ 一直是 0：说明串口根本没收到字节——不是软件问题，按序排查："
                        "① 确认「串口」下拉里选的是真实模组端口，不是 COM1 等占位口；"
                        "② TX↔RX 必须交叉（开发板 TX 接 USB 板 RX、开发板 RX 接 USB 板 TX）且共地；"
                        "③ 模组已上电、未处于复位态；"
                        "④ 波特率是否与该模组一致（常用 115200，部分模组 9600）；"
                        "⑤ 若曾进入透传模式，先发 +++（不带回车、前后各留 1 秒静默）退出再试 AT。"
                        + flow_tip + "。"
                        "• 若 ↓ 在涨但终端看不到文字：说明设备发的是「不带换行符的连续流」，"
                        "已自动刷新显示；可切「十六进制」视图查看原始字节。"
                    )
            except Exception:
                pass
        return result

    def send_raw_hex(self, hex_str: str) -> dict:
        busy = self._busy_reason()
        if busy:
            return {"ok": False,
                    "error": busy + "，已拦截下发（等执行完毕或点「停止」）"}
        try:
            data = bytes.fromhex("".join((hex_str or "").split()))
        except Exception as exc:
            return {"ok": False, "error": f"HEX 解析失败：{exc}"}
        written = self.mgr.write(data)
        return {"ok": written > 0, "written": written}



    def _line_ending_bytes(self) -> bytes:



        le = str(self.cfg.protocol.get("line_ending", "CRLF")).upper()
        return {"CRLF": b"\r\n", "CR": b"\r", "LF": b"\n",
                "NONE": b""}.get(le, b"\r\n")

    def _raw_tx(self, data: bytes, label: str) -> int:
        written = self.mgr.write(data)
        if written > 0:
            self.log_tx(label)
        return written

    def start_loop_send(self, cmd: str, interval_ms: int = 1000,
                        repeat: int = 0, mode: str = "text") -> dict:
        cmd = str(cmd or "").strip()
        if not cmd:
            return {"ok": False, "error": "发送内容为空"}
        if not self.mgr.status().get("connected"):
            return {"ok": False, "error": "串口未连接"}
        interval = max(50, int(interval_ms or 1000))
        mode = "hex" if str(mode).lower() == "hex" else "text"
        if mode == "hex":
            try:
                payload = bytes.fromhex("".join(cmd.split()))
            except Exception as exc:
                return {"ok": False, "error": f"HEX 解析失败：{exc}"}
            label = "[HEX] " + payload.hex(" ").upper()
        else:
            payload = cmd.encode("utf-8") + self._line_ending_bytes()
            label = cmd

        self.stop_loop_send(silent=True)
        state = {"count": 0, "stop": threading.Event()}
        self._loop_send = state

        def worker() -> None:
            while not state["stop"].is_set():
                self._raw_tx(payload, label)
                state["count"] += 1
                if repeat and state["count"] >= int(repeat):
                    break
                state["stop"].wait(interval / 1000.0)
            if self._loop_send is state:
                self._loop_send = None
                self.log_sys(f"循环发送已结束（共 {state['count']} 次）")

        threading.Thread(target=worker, name="LoopSend", daemon=True).start()
        self.log_sys(f"循环发送已启动：间隔 {interval}ms，"
                     + (f"共 {repeat} 次" if repeat else "无限循环"))
        return {"ok": True, "interval_ms": interval, "repeat": repeat}

    def stop_loop_send(self, silent: bool = False) -> dict:
        state = getattr(self, "_loop_send", None)
        if state is not None:
            state["stop"].set()
            self._loop_send = None
            if not silent:
                self.log_sys(f"循环发送已停止（已发 {state['count']} 次）")
        return {"ok": True, "was_running": state is not None}

    def loop_send_status(self) -> dict:
        state = getattr(self, "_loop_send", None)
        if state is None:
            return {"running": False}
        return {"running": True, "count": state["count"]}

    def set_auto_reply(self, keyword: str = "", reply: str = "",
                       delay_ms: int = 100, mode: str = "text") -> dict:
        keyword = str(keyword or "").strip()
        if not keyword:
            self._auto_reply = None
            return {"ok": True, "enabled": False}
        self._auto_reply = {
            "keyword": keyword,
            "reply": str(reply or ""),
            "delay_ms": max(0, int(delay_ms or 100)),
            "mode": "hex" if str(mode).lower() == "hex" else "text",
        }
        return {"ok": True, "enabled": True, "keyword": keyword}

    def get_auto_reply(self) -> dict:
        rule = getattr(self, "_auto_reply", None)
        return {"ok": True, "rule": rule}

    def set_dtr(self, state: bool) -> dict:
        result = self.mgr.set_dtr(bool(state))
        if result.get("ok"):
            self.log_sys(f"DTR → {'高' if state else '低'}")
        return result

    def set_rts(self, state: bool) -> dict:
        result = self.mgr.set_rts(bool(state))
        if result.get("ok"):
            self.log_sys(f"RTS → {'高' if state else '低'}")
        return result

    def reset_counters(self) -> dict:
        return self.mgr.reset_counters()


    @staticmethod
    def _baseline_snapshot(result: dict) -> list[dict]:
        cases = []
        for item in result.get("results") or []:
            cases.append({
                "id": item.get("id", ""),
                "name": item.get("name", ""),
                "cmd": item.get("cmd", ""),
                "ok": item.get("ok"),
                "status": item.get("status", ""),
                "lines": [str(x) for x in (item.get("lines") or [])],
                "events": [str(x) for x in (item.get("events") or [])],
            })
        return cases

    def save_baseline(self, name: str = "") -> dict:
        result = self._last_result
        if not result or not result.get("results"):
            return {"ok": False, "error": "还没有可保存的套件结果，请先运行一次"}
        safe = re.sub(r'[\\/:*?"<>| ]+', "_",
                      (name or "").strip() or
                      time.strftime("base-%Y%m%d-%H%M%S"))
        data = {
            "name": safe,
            "profile": self.profile.get("id") or "",
            "profile_name": self.profile.get("name") or "",
            "created": time.strftime("%Y-%m-%d %H:%M:%S"),
            "cases": self._baseline_snapshot(result),
        }
        path = paths.baselines_dir() / (safe + ".json")
        try:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=1),
                            encoding="utf-8")
        except Exception as exc:
            return {"ok": False, "error": f"保存失败：{exc}"}
        self.log_sys("已保存基线：" + str(path) +
                     "（" + str(len(data["cases"])) + " 用例）")
        return {"ok": True, "name": safe, "path": str(path),
                "count": len(data["cases"])}

    def list_baselines(self) -> dict:
        out = []
        for f in sorted(paths.baselines_dir().glob("*.json"),
                        key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                d = json.loads(f.read_text(encoding="utf-8"))
                out.append({"name": d.get("name") or f.stem,
                            "profile": d.get("profile") or "",
                            "profile_name": d.get("profile_name") or "",
                            "created": d.get("created") or "",
                            "count": len(d.get("cases") or []),
                            "path": str(f)})
            except Exception:
                continue
        return {"ok": True, "baselines": out}

    def delete_baseline(self, name: str) -> dict:
        safe = re.sub(r'[\\/:*?"<>| ]+', "_", name or "")
        path = paths.baselines_dir() / (safe + ".json")
        if path.exists():
            path.unlink()
            return {"ok": True}
        return {"ok": False, "error": "基线不存在"}

    @staticmethod
    def _diff_baseline(baseline: dict, result: dict) -> dict:
        old = {c.get("id"): c for c in baseline.get("cases") or []}
        diffs: list[dict] = []
        same = changed = missing = 0
        for item in result.get("results") or []:
            cid = item.get("id", "")
            b = old.pop(cid, None)
            if b is None:
                missing += 1
                continue
            n_lines = [str(x).strip() for x in (item.get("lines") or []) if str(x).strip()]
            b_lines = [str(x).strip() for x in (b.get("lines") or []) if str(x).strip()]
            removed = [x for x in b_lines if x not in n_lines]
            added = [x for x in n_lines if x not in b_lines]
            is_changed = bool(item.get("ok") != b.get("ok") or
                              item.get("status", "") != b.get("status", "") or
                              removed or added)
            if is_changed:
                changed += 1
                diffs.append({
                    "id": cid, "name": item.get("name", ""),
                    "cmd": item.get("cmd", ""),
                    "b_ok": b.get("ok"), "n_ok": item.get("ok"),
                    "b_status": b.get("status", ""),
                    "n_status": item.get("status", ""),
                    "removed": removed[:8], "added": added[:8],
                })
            else:
                same += 1
        extra = len(old)
        return {"name": baseline.get("name", ""),
                "same": same, "changed": changed,
                "missing": missing, "extra": extra,
                "diffs": diffs}

    def detect_baud(self, port: str = "", baudrates=None) -> dict:
        target = str(port or self.cfg.serial.get("port") or "").strip()
        if not target:
            return {"ok": False, "error": "请先选择串口"}
        if baudrates:
            try:
                baudrates = [int(b) for b in baudrates]
            except Exception:
                baudrates = None

        sniff = self.mgr.sniff_baud(target, baudrates=baudrates, window=0.4)
        best = sniff.get("best")
        if sniff.get("ok") and best and best.get("printable_ratio", 0) >= 0.6:
            baud = int(best["baud"])
            self.cfg.set("serial", "baudrate", baud)


            fc = str(self.cfg.serial.get("flowcontrol", "none") or "none").lower()
            if fc not in ("none", ""):
                self.cfg.set("serial", "flowcontrol", "none")
                self.log_sys("已自动关闭硬件流控（flowcontrol=none）：被动嗅探在无流控下即命中，"
                             "设备无需流控，带流控反而卡死接收")
            self.log_sys("被动嗅探命中波特率：" + target + " @ " + str(baud) +
                         " baud（已写入配置，可重新连接）")
            return {"ok": True, "baudrate": baud, "passive": True,
                    "sample": best.get("sample", ""), "samples": sniff["samples"]}

        result = self.mgr.detect_baud(target, baudrates=baudrates)
        if result.get("ok"):
            self.cfg.set("serial", "baudrate", result["baudrate"])
            self.log_sys("波特率探测成功：" + target + " @ " +
                         str(result["baudrate"]) + " baud（已写入配置）")
        else:


            result["passive_samples"] = sniff.get("samples", [])
            self.log_sys("波特率探测失败：" + str(result.get("error")))
        return result

    def read_signal(self) -> dict:
        if not self.mgr.status().get("connected"):
            return {"ok": False, "error": "串口未连接"}
        style = (self.profile.get("device") or {}).get("style", "an5481")
        try:
            if style == "aithinker":
                r = self.runner.send("AT+CRSSI?", timeout=2.0)
                if not r.get("ok"):
                    return {"ok": False,
                            "error": r.get("status") or r.get("error") or "无响应"}
                nums = [int(v) for v in
                        re.findall(r"\d+:(-?\d+)", "\n".join(r.get("lines", [])))]
                if nums:
                    return {"ok": True, "rssi": min(nums), "raw": nums}
                return {"ok": False, "error": "未解析到 RSSI"}

            r = self.runner.send("AT+TRSSI", timeout=2.0)
            text = "\n".join(r.get("lines", []))
            m = re.search(r"RSSI Value=\s*(-?\d+)", text)
            snr = None
            if r.get("ok") and m:
                self.runner.send("AT+TOFF", timeout=1.0)
                r2 = self.runner.send("AT+TSNR", timeout=2.0)
                m2 = re.search(r"SNR Value=\s*(-?\d+(?:\.\d+)?)",
                               "\n".join(r2.get("lines", [])))
                if r2.get("ok") and m2:
                    snr = float(m2.group(1))
                self.runner.send("AT+TOFF", timeout=1.0)
                out: dict = {"ok": True, "rssi": int(m.group(1))}
                if snr is not None:
                    out["snr"] = snr
                return out
            self.runner.send("AT+TOFF", timeout=1.0)
            return {"ok": False,
                    "error": r.get("status") or r.get("error") or "未解析到 RSSI"}
        except Exception as exc:
            return {"ok": False, "error": f"读取失败：{exc}"}

    # ---- 发送历史：按天分文件 history/YYYY-MM-DD.json，自动清理过期 ----

    @staticmethod
    def _day_key(ts: float | None = None) -> str:
        return time.strftime("%Y-%m-%d", time.localtime(ts or time.time()))

    def _history_limit(self) -> int:
        return int(self.cfg.behavior.get("history_limit", 200) or 200)

    def _read_day(self, day: str) -> list[str]:
        try:
            data = json.loads(
                (paths.history_dir() / f"{day}.json")
                .read_text(encoding="utf-8"))
            return [str(x) for x in data if str(x).strip()] \
                if isinstance(data, list) else []
        except Exception:
            return []

    def _write_day(self, day: str, items: list[str]) -> None:
        limit = self._history_limit()
        try:
            path = paths.history_dir() / f"{day}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(
                json.dumps(items[:limit], ensure_ascii=False),
                encoding="utf-8")
        except Exception:
            pass

    def _load_history(self) -> list[str]:
        base = paths.history_dir()
        merged: list[str] = []
        cutoff = time.time() - 30 * 86400  # 只保留最近 30 天
        try:
            if base.is_dir():
                for f in sorted(base.glob("*.json")):
                    try:
                        day_ts = time.mktime(
                            time.strptime(f.stem, "%Y-%m-%d"))
                    except Exception:
                        continue
                    if day_ts < cutoff:
                        try:
                            f.unlink()
                        except OSError:
                            pass
                        continue
                    for item in reversed(self._read_day(f.stem)):
                        if item not in merged:
                            merged.append(item)
        except Exception:
            pass
        # 兼容迁移：旧单文件 history.json 并入当天，然后归档
        legacy = paths.history_file()
        if legacy.exists():
            try:
                data = json.loads(legacy.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    today_items: list[str] = []
                    for item in reversed([str(x) for x in data]):
                        if not item.strip():
                            continue
                        if item not in merged:
                            merged.insert(0, item)
                        if item not in today_items:
                            today_items.insert(0, item)
                    self._write_day(self._day_key(), today_items)
                legacy.rename(legacy.with_suffix(".json.migrated"))
            except Exception:
                pass
        return merged[: self._history_limit()]

    def _remember(self, cmd: str) -> None:
        if not self.cfg.behavior.get("save_history", True):
            return
        today = self._day_key()
        day_items = self._read_day(today)
        if cmd in day_items:
            day_items.remove(cmd)
        day_items.append(cmd)
        self._write_day(today, day_items)
        if cmd in self._history:
            self._history.remove(cmd)
        self._history.insert(0, cmd)
        del self._history[self._history_limit():]

    def _save_history(self) -> None:
        """占位保持兼容：按天写入在 _remember 中完成。"""

    def get_history(self) -> list[str]:
        return list(self._history)

    def clear_history(self) -> dict:
        self._history = []
        try:
            base = paths.history_dir()
            if base.is_dir():
                for f in base.glob("*.json"):
                    try:
                        f.unlink()
                    except OSError:
                        pass
        except Exception:
            pass
        return {"ok": True}


    def get_commands(self, category: str = "", keyword: str = "") -> list[dict]:
        items = commands.by_category(category) if category else list(commands.COMMANDS)
        kw = (keyword or "").strip().upper()
        if kw:
            items = [c for c in items
                     if kw in (c["id"] + c["summary"] + c.get("desc", "")).upper()]
        return [
            {
                "id": c["id"],
                "name": c["id"],
                "category": c["category"],
                "summary": c["summary"],
                "desc": c.get("desc", ""),
                "modes": c.get("modes", []),
                "params": c.get("params", []),
                "results": c.get("results", []),
                "example": c.get("example", []),
                "dangerous": bool(c.get("danger")) or bool(c.get("no_status")),
                "suggest": commands.suggestion_for(c["id"]),
            }
            for c in items
        ]

    def validate_command(self, cmd_id: str, value: str) -> dict:
        ok, message = commands.validate_value(cmd_id, value)
        normalized = commands.normalize_param_value(cmd_id, value)
        return {"ok": ok, "message": message, "normalized": normalized}

    def build_command_preview(self, cmd_id: str, value: str = "",
                              mode: str = "auto") -> dict:
        if mode == "get":
            cmd = commands.build(cmd_id, query=True)
        elif mode == "help":
            cmd = commands.build(cmd_id, help_=True)
        elif mode == "run":
            cmd = commands.build(cmd_id)
        else:
            cmd = commands.build(cmd_id, value) if value else \
                commands.suggestion_for(cmd_id)
        return {"cmd": cmd}


    def save_quick_params(self, action_id: str, values: dict | None = None) -> dict:
        try:
            result = quick.save_values(action_id, values or {})
            self.log_sys(f"已保存快捷操作参数：{action_id}")
            return result
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def run_quick_action(self, action_id: str,
                         values: dict | None = None) -> dict:
        action = quick.get(action_id)
        if not action:
            return {"ok": False, "error": "未知快捷操作"}
        if action.get("kind") == "preset":
            return self.run_preset(action.get("preset_id", ""), values or {})

        try:
            steps = quick.build_steps(action_id, values or {})
        except ValueError as exc:
            return {"ok": False, "error": str(exc)}
        if self.runner.running:
            return {"ok": False, "error": "已有任务在执行"}
        if not self.mgr.is_open:
            return {"ok": False, "error": "请先连接串口"}
        if values:
            quick.save_values(action_id, values)
        return self.run_steps(steps, label=action.get("name") or action_id)

    def preview_preset(self, preset_id: str, params: dict | None = None) -> dict:
        steps = presets.build_steps(preset_id, params or {})
        return {"ok": True, "steps": steps, "count": len(steps)}

    def run_preset(self, preset_id: str, params: dict | None = None) -> dict:
        if self.runner.running:
            return {"ok": False, "error": "已有任务在执行"}
        if not self.mgr.is_open:
            return {"ok": False, "error": "请先连接串口"}
        steps = presets.build_steps(preset_id, params or {})
        if not steps:
            return {"ok": False, "error": "该场景没有可执行的步骤"}
        preset = presets.PRESET_MAP.get(preset_id, {})
        self._start_progress("preset", preset.get("name", preset_id), len(steps))

        def work() -> None:
            result = self.runner.run_steps(
                steps, on_progress=self._on_progress_item)
            self._last_result = result
            self._finish_progress(result)

        self._spawn(work)
        return {"ok": True, "started": True, "count": len(steps)}

    def run_steps(self, steps: list[dict], label: str = "自定义序列") -> dict:
        if self.runner.running:
            return {"ok": False, "error": "已有任务在执行"}
        if not self.mgr.is_open:
            return {"ok": False, "error": "请先连接串口"}
        self._start_progress("steps", label, len(steps))

        def work() -> None:
            result = self.runner.run_steps(
                steps, on_progress=self._on_progress_item)
            self._last_result = result
            self._finish_progress(result)

        self._spawn(work)
        return {"ok": True, "started": True, "count": len(steps)}


    def run_suite(self, suite_ids: list[str] | None = None,
                  case_ids: list[str] | None = None,
                  baseline: str = "") -> dict:
        if self.runner.running:
            return {"ok": False, "error": "已有任务在执行"}
        if not self.mgr.is_open:
            return {"ok": False, "error": "请先连接串口"}
        cases: list[dict] = []
        if case_ids:
            wanted = set(case_ids)
            cases = [c for c in suites.all_cases() if c["id"] in wanted]
        elif suite_ids:
            wanted_suites = set(suite_ids)
            for suite in suites.SUITES:
                if suite["id"] in wanted_suites:
                    cases.extend(suites.suite_cases(suite["id"]))
        else:
            cases = suites.all_cases()
        if not cases:
            return {"ok": False, "error": "没有选中任何用例"}
        self._start_progress("suite", "测试套件", len(cases))

        def work() -> None:
            result = self.runner.run_suite(
                cases, on_progress=self._on_progress_item)
            if baseline:
                bpath = paths.baselines_dir() / (
                    re.sub(r'[\\/:*?"<>| ]+', "_", baseline) + ".json")
                try:
                    bdata = json.loads(bpath.read_text(encoding="utf-8"))
                    result["baseline"] = self._diff_baseline(bdata, result)
                except Exception as exc:
                    self.log_sys("基线对比失败：" + str(exc))
            self._last_result = result
            self._finish_progress(result)

        self._spawn(work)
        return {"ok": True, "started": True, "count": len(cases),
                "baseline": baseline or ""}

    def cancel_run(self) -> dict:
        self.runner.cancel()
        self.log_sys("已请求停止当前任务")
        return {"ok": True}

    def get_last_result(self) -> dict | None:
        return self._last_result


    def get_buttons(self) -> list[dict]:
        return self.buttons.all()

    def add_button(self, payload: dict) -> dict:
        button = self.buttons.add(payload or {})
        return {"ok": True, "button": button}

    def update_button(self, button_id: str, payload: dict) -> dict:
        button = self.buttons.update(button_id, payload or {})
        return {"ok": button is not None, "button": button}

    def delete_button(self, button_id: str) -> dict:
        return {"ok": self.buttons.delete(button_id)}

    def duplicate_button(self, button_id: str) -> dict:
        button = self.buttons.duplicate(button_id)
        return {"ok": button is not None, "button": button}

    def move_button(self, button_id: str, direction: int) -> dict:
        return {"ok": self.buttons.move(button_id, int(direction))}

    def run_button(self, button_id: str, ctx: dict | None = None) -> dict:
        if self.runner.running:
            return {"ok": False, "error": "已有任务在执行"}
        if not self.mgr.is_open:
            return {"ok": False, "error": "请先连接串口"}
        button = self.buttons.get(button_id)
        if button is None:
            return {"ok": False, "error": "按钮不存在"}
        raw_commands = button.get("commands") or []
        delay = float(button.get("delay") or 0.35)
        steps = []
        for cmd in raw_commands:
            final = replace_vars(cmd, ctx or {})
            steps.append({"cmd": final, "label": final, "delay": delay,
                          "expect": "OK"})
        if not steps:
            return {"ok": False, "error": "按钮没有配置指令"}
        self._start_progress("button", button.get("name", ""), len(steps))

        def work() -> None:
            result = self.runner.run_steps(
                steps, on_progress=self._on_progress_item)
            self._last_result = result
            self._finish_progress(result)

        self._spawn(work)
        return {"ok": True, "started": True, "count": len(steps)}

    def export_buttons(self) -> dict:
        path = exporter.export_buttons(self.buttons.export_data())
        return {"ok": True, "path": str(path)}

    def import_buttons(self, data: dict | str) -> dict:
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except Exception as exc:
                return {"ok": False, "error": f"JSON 解析失败：{exc}"}
        count = self.buttons.import_data(data or {})
        return {"ok": True, "count": count, "buttons": self.buttons.all()}

    def reset_buttons(self) -> dict:
        return {"ok": True, "count": self.buttons.reset_defaults(),
                "buttons": self.buttons.all()}


    def invoke(self, name: Any = None, params: Any = None) -> dict:

        try:
            import logging
            logging.getLogger("atcdbg").debug("invoke <- %s", name)
        except Exception:
            pass
        if isinstance(name, (list, tuple)):
            seq = list(name)
            name = seq[0] if seq else ""
            if len(seq) > 1 and params is None:
                params = seq[1]
        if isinstance(name, dict):
            payload = name
            if params in (None, {}):
                params = payload.get("args") if "args" in payload else payload
            name = payload.get("method") or payload.get("name") or ""
        if isinstance(params, (list, tuple)) and len(params) == 1 \
                and isinstance(params[0], dict):
            params = params[0]
        name = str(name or "")
        method = getattr(self, name, None)
        if not callable(method) or name.startswith("_"):
            return {"ok": False, "error": f"未知方法: {name}"}
        try:
            return method(**(params or {}))
        except TypeError:
            try:
                return method(params)
            except Exception as exc:
                return {"ok": False, "error": str(exc)}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def save_config(self, patch: dict) -> dict:
        old = self.cfg.to_dict()
        self.cfg.update(patch or {})
        result = {"ok": True, "config": self.cfg.to_dict()}
        # 串口参数变化时静默重连：断开当前连接，立即用新参数重新打开，
        # 用户无需手动断开重连（热应用 apply_params 在此场景不可靠）
        try:
            new_serial = result["config"].get("serial") or {}
            old_serial = (old or {}).get("serial") or {}
            changed = [k for k, v in new_serial.items()
                       if old_serial.get(k) != v]
            if changed and self.mgr.is_open:
                # connect() 内部先静默断开，再按更新后的 cfg.serial 重连
                r = self.mgr.connect()
                result["serial_applied"] = {
                    "ok": bool(r.get("ok")),
                    "reconnected": True,
                    "error": r.get("error"),
                    "applied": changed,
                }
        except Exception as exc:
            result["serial_applied"] = {"ok": False, "error": str(exc)}
        return result

    def reset_config(self) -> dict:
        return {"ok": True, "config": self.cfg.reset()}

    def get_config(self) -> dict:
        return self.cfg.to_dict()


    def export_report(self, fmt: str = "md", name: str = "AT测试报告") -> dict:
        result = self._last_result
        if not result:
            return {"ok": False, "error": "还没有可导出的测试结果"}
        try:
            path = exporter.export_result(result, fmt, name)
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        return {"ok": True, "path": str(path)}

    def export_logs(self, logs: list[dict]) -> dict:
        path = exporter.export_logs(logs or [])
        return {"ok": True, "path": str(path)}

    def open_data_folder(self) -> dict:
        ok = exporter.open_in_explorer(paths.runtime_dir())
        return {"ok": ok, "path": str(paths.runtime_dir())}

    def open_path(self, path: str) -> dict:
        from pathlib import Path
        return {"ok": exporter.open_in_explorer(Path(path))}

    def save_window_state(self, state: dict) -> dict:
        self.cfg.update({"window": state or {}})
        return {"ok": True}

    def set_window_opacity(self, percent: int | float = 100) -> dict:
        try:
            from ..core import winnative
            ok = winnative.set_opacity(self._win, percent)
            return {"ok": bool(ok), "percent": percent}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}


    def sim_set(self, joined: bool | None = None,
                join_success: bool | None = None,
                join_delay: float | None = None,
                battery: int | None = None) -> dict:
        if joined is not None:
            self.simulator.joined = bool(joined)
        if join_success is not None:
            self.simulator.join_success = bool(join_success)
        if join_delay is not None:
            self.simulator.join_delay = float(join_delay)
        if battery is not None:
            self.simulator.battery_mv = int(battery)
        return {"ok": True, "joined": self.simulator.joined,
                "join_success": self.simulator.join_success}

    def sim_status(self) -> dict:
        return {"ok": True, "joined": self.simulator.joined,
                "join_success": self.simulator.join_success,
                "state": self.simulator.state,
                "fcnt": self.simulator.fcnt}


    def selftest(self) -> dict:
        checks: list[dict] = []
        original = self.mgr.status()

        def add(name: str, ok: bool, detail: str = "") -> None:
            checks.append({"name": name, "ok": ok, "detail": detail})

        add("指令库", len(commands.COMMANDS) > 20,
            f"{len(commands.COMMANDS)} 条指令（配置集 {commands.PROFILE_ID}）")
        add("测试套件", suites.total_count() > 20,
            f"{suites.total_count()} 个用例")
        add("场景模板", len(presets.PRESETS) >= 8,
            f"{len(presets.PRESETS)} 个场景")
        add("配置集", bool(self.profile),
            f'{len(profiles.list_profiles())} 个可用')
        add("自定义按钮", len(self.buttons.all()) >= 1,
            f"{len(self.buttons.all())} 个按钮")
        add("数据目录", paths.runtime_dir().exists(), str(paths.runtime_dir()))
        add("界面资源", paths.ui_dir().exists() and
            (paths.ui_dir() / "index.html").exists(), str(paths.ui_dir()))

        connected = self.mgr.connect("SIM")
        add("虚拟设备连接", bool(connected.get("ok")),
            str(connected.get("error", "")))

        if connected.get("ok"):
            res = self.runner.send("AT", timeout=3.0)
            add("AT 链路自检", res["ok"], res.get("status", ""))
            res = self.runner.send("AT+DEUI=?", timeout=3.0)
            lines = res.get("lines") or [""]
            add("读取 DevEUI", res["ok"], str(lines[0])[:40])
            res = self.runner.send("AT+VER=?", timeout=3.0)
            add("读取版本", res["ok"], "")
            res = self.runner.send("AT+JOIN=1", timeout=4.0, wait_event=8.0,
                                   expect="+EVT:JOINED")
            events = res.get("events") or [""]
            add("OTAA 入网事件", res["ok"], str(events[0])[:40])
            res = self.runner.send("AT+SEND=2:0:ABCD", timeout=4.0)
            add("发送上行", res["ok"], res.get("status", ""))
            steps = presets.build_steps("otaa", presets.default_params("otaa"))
            outcome = self.runner.run_steps(steps)
            add("一键配置全流程", outcome["ok"],
                f'{outcome["passed"]}/{outcome["total"]} 步通过')
            self._last_result = outcome
            suite_cases = suites.suite_cases("general")
            outcome = self.runner.run_suite(suite_cases)
            add("套件执行（通用类）", outcome["failed"] == 0,
                f'{outcome["passed"]}/{outcome["executed"]} 通过')
            self.mgr.disconnect(silent=True)
            if original.get("connected") and original.get("port"):
                self.mgr.connect(original["port"])
        return {
            "ok": all(c["ok"] for c in checks),
            "checks": checks,
            "platform": paths.platform_label(),
        }


    def _start_progress(self, kind: str, label: str, total: int) -> None:
        self._progress = {
            "active": True, "kind": kind, "label": label,
            "done": 0, "total": total, "items": [], "finished": False,
            "summary": None, "started_at": time.time(),
        }
        self.log_sys(f"开始执行：{label}（共 {total} 步）")

    def _on_progress_item(self, item: dict) -> None:
        self._progress["done"] = item.get("index", 0)
        self._progress["items"].append(item)

    def _finish_progress(self, result: dict) -> None:
        self._progress["active"] = False
        self._progress["finished"] = True
        self._progress["summary"] = {
            "total": result.get("total", 0),
            "passed": result.get("passed", 0),
            "failed": result.get("failed", 0),
            "skipped": result.get("skipped", 0),
            "duration": result.get("duration", 0),
        }
        if result.get("baseline"):
            self._progress["summary"]["baseline"] = result["baseline"]
        self.log_sys(
            f'执行结束：通过 {result.get("passed", 0)} / '
            f'{result.get("total", 0)}，耗时 {result.get("duration", 0)} 秒')

    def _spawn(self, target) -> None:
        self._worker = threading.Thread(target=target, daemon=True)
        self._worker.start()


    def text_to_hex(self, text: str) -> dict:
        return {"ok": True, "hex": text_to_hex(text)}

    def open_file_dialog(self) -> dict:
        try:
            import webview  # type: ignore
        except Exception:
            return {"ok": False, "error": "当前模式不支持文件对话框"}
        try:
            result = self._win.create_file_dialog(
                webview.OPEN_DIALOG,
                file_types=("JSON 文件 (*.json)",))
        except Exception as exc:
            return {"ok": False, "error": str(exc)}
        if not result:
            return {"ok": False, "cancelled": True}
        try:
            with open(result[0], "r", encoding="utf-8") as fh:
                return {"ok": True, "data": json.load(fh)}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def shutdown(self) -> None:
        try:
            self.mgr.close()
        except Exception:
            pass


def start_http_server(api: Api, host: str = "127.0.0.1",
                      port: int = 0):
    import http.server
    from socketserver import ThreadingMixIn

    ui_root = paths.ui_dir()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs) -> None:
            super().__init__(*args, directory=str(ui_root), **kwargs)

        def log_message(self, fmt: str, *args) -> None:
            pass

        def end_headers(self) -> None:

            self.send_header("Cache-Control", "no-store, must-revalidate")
            super().end_headers()

        def _cors(self) -> None:

            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

        def do_OPTIONS(self) -> None:  # noqa: N802
            self.send_response(204)
            self._cors()
            self.send_header("Content-Length", "0")
            self.end_headers()

        def _json(self, payload: dict, code: int = 200) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self._cors()
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self) -> None:  # noqa: N802
            name = self.path.rstrip("/").split("/")[-1]
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            try:
                params = json.loads(raw.decode("utf-8"))
            except Exception:
                params = {}
            if name == "call":
                target = params.get("method")
                args = params.get("args")
            else:
                target = name
                args = params
            return self._json(api.invoke(target, args))

    class Server(ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    server = Server((host, int(port or 0)), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, server.server_address[1]
