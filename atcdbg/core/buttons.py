from __future__ import annotations

import json
import re
import time
from typing import Any

from . import paths
from .store import JsonStore, new_id


DEFAULT_BUTTONS: list[dict] = []


def set_defaults(items: list[dict]) -> None:
    global DEFAULT_BUTTONS
    DEFAULT_BUTTONS = [dict(b) for b in (items or [])]

_VAR_RE = re.compile(r"\{([A-Za-z0-9_]+)\}")


def replace_vars(text: str, ctx: dict[str, Any] | None) -> str:
    if not text or not ctx:
        return text
    return _VAR_RE.sub(lambda m: str(ctx.get(m.group(1), m.group(0))), text)


def extract_vars(commands: list[str]) -> list[str]:
    found: list[str] = []
    for cmd in commands or []:
        for name in _VAR_RE.findall(cmd or ""):
            if name not in found:
                found.append(name)
    return found


class ButtonsStore:
    def __init__(self, profile_id: str = "") -> None:
        self.profile_id = profile_id
        self._store: JsonStore | None = None
        if profile_id:
            self._open(profile_id, load_defaults=False)

    def _file(self):
        return paths.buttons_file(self.profile_id)

    def _open(self, profile_id: str, load_defaults: bool = True) -> None:
        self.profile_id = profile_id
        target = self._file()
        fresh = not target.exists()
        self._store = JsonStore(target,
                                {"profile": profile_id, "buttons": []})
        data = self._store.data
        if not isinstance(data, dict) or not isinstance(data.get("buttons"), list):
            self._store._data = {"profile": profile_id,
                                 "buttons": [dict(b) for b in DEFAULT_BUTTONS]}
            self._store.save()
        elif fresh and load_defaults and DEFAULT_BUTTONS:
            # 首次打开该配置集：播种内置按钮（避免常用功能页空白）
            self._store._data = {"profile": profile_id,
                                 "buttons": [dict(b) for b in DEFAULT_BUTTONS]}
            self._store.save()
        self._sync_builtin_icons()

    def switch_profile(self, profile_id: str, defaults: list[dict]) -> None:
        set_defaults(defaults)
        self._migrate_legacy(profile_id)
        self._open(profile_id)

    def _migrate_legacy(self, profile_id: str) -> None:
        legacy = paths.buttons_file("")
        target_dir = paths.user_dir() / profile_id
        target = target_dir / "buttons.json"
        if not legacy.exists() or legacy == target:
            return
        try:
            data = json.loads(legacy.read_text(encoding="utf-8"))
        except Exception:
            return
        items = data.get("buttons") if isinstance(data, dict) else None
        custom = [b for b in (items or [])
                  if isinstance(b, dict)
                  and not str(b.get("id", "")).startswith("btn-builtin-")]
        if custom:
            store = JsonStore(target, {"profile": profile_id, "buttons": []})
            existing = store.data.get("buttons", [])
            seen = {b.get("id") for b in existing}
            for btn in custom:
                if btn.get("id") not in seen:
                    existing.append(btn)
                    seen.add(btn.get("id"))
            store.data["buttons"] = existing
            store.data["migrated_from"] = "legacy-global"
            store.save()
        try:
            legacy.rename(legacy.with_suffix(".json.migrated"))
        except OSError:
            pass

    def _sync_builtin_icons(self) -> None:
        buttons = self._store.data.get("buttons", [])
        defaults = {b.get("id"): b.get("icon") for b in DEFAULT_BUTTONS}
        changed = False
        for btn in buttons:
            bid = btn.get("id") or ""
            if bid.startswith("btn-builtin-") and bid in defaults \
                    and btn.get("icon") != defaults[bid] and defaults[bid]:
                btn["icon"] = defaults[bid]
                changed = True
        if changed:
            self._store.save()

    def all(self) -> list[dict]:
        buttons = self._store.data.get("buttons", [])
        return sorted(buttons, key=lambda b: (b.get("group", ""),
                                              b.get("order", 0),
                                              b.get("name", "")))

    def groups(self) -> list[str]:
        seen: list[str] = []
        for btn in self.all():
            group = btn.get("group", "未分组") or "未分组"
            if group not in seen:
                seen.append(group)
        return seen

    def get(self, button_id: str) -> dict | None:
        for btn in self._store.data.get("buttons", []):
            if btn.get("id") == button_id:
                return btn
        return None

    def add(self, payload: dict) -> dict:
        now = time.time()
        button = {
            "id": new_id("btn"),
            "name": str(payload.get("name") or "自定义按钮").strip(),
            "icon": str(payload.get("icon") or "bolt"),
            "color": str(payload.get("color") or "blue"),
            "group": str(payload.get("group") or "自定义").strip(),
            "commands": self._clean_commands(payload.get("commands")),
            "delay": float(payload.get("delay") or 0.35),
            "note": str(payload.get("note") or ""),
            "order": int(payload.get("order") or 0),
            "enabled": bool(payload.get("enabled", True)),
            "builtin": False,
            "created_at": now,
            "updated_at": now,
        }
        self._store.data.setdefault("buttons", []).append(button)
        self._store.save()
        return button

    def update(self, button_id: str, payload: dict) -> dict | None:
        button = self.get(button_id)
        if button is None:
            return None
        for key in ("name", "icon", "color", "group", "note"):
            if key in payload:
                button[key] = str(payload[key])
        if "commands" in payload:
            button["commands"] = self._clean_commands(payload["commands"])
        if "delay" in payload:
            try:
                button["delay"] = float(payload["delay"])
            except Exception:
                pass
        if "order" in payload:
            try:
                button["order"] = int(payload["order"])
            except Exception:
                pass
        if "enabled" in payload:
            button["enabled"] = bool(payload["enabled"])
        button["updated_at"] = time.time()
        self._store.save()
        return button

    def delete(self, button_id: str) -> bool:
        buttons = self._store.data.get("buttons", [])
        before = len(buttons)
        self._store.data["buttons"] = [
            b for b in buttons if b.get("id") != button_id]
        if len(self._store.data["buttons"]) != before:
            self._store.save()
            return True
        return False

    def duplicate(self, button_id: str) -> dict | None:
        source = self.get(button_id)
        if source is None:
            return None
        clone = dict(source)
        clone["id"] = new_id("btn")
        clone["name"] = f'{source.get("name", "")} 副本'
        clone["builtin"] = False
        clone["created_at"] = time.time()
        clone["updated_at"] = time.time()
        self._store.data.setdefault("buttons", []).append(clone)
        self._store.save()
        return clone

    def move(self, button_id: str, direction: int) -> bool:
        buttons = self._store.data.get("buttons", [])
        ordered = sorted(buttons, key=lambda b: (b.get("group", ""),
                                                 b.get("order", 0),
                                                 b.get("name", "")))
        index = next((i for i, b in enumerate(ordered)
                      if b.get("id") == button_id), None)
        if index is None:
            return False
        target = index + direction
        if target < 0 or target >= len(ordered):
            return False
        for i, btn in enumerate(ordered):
            btn["order"] = i * 10
        ordered[index], ordered[target] = ordered[target], ordered[index]
        for i, btn in enumerate(ordered):
            btn["order"] = i * 10
        self._store.save()
        return True

    def reorder(self, order: dict | None = None) -> bool:
        buttons = self._store.data.get("buttons", [])
        for btn in buttons:
            key = str(btn.get("id") or "")
            if key in order:
                btn["order"] = int(order[key])
        self._store.save()
        return True

    def set_group(self, button_id: str, group: str) -> bool:
        for btn in self._store.data.get("buttons", []):
            if btn.get("id") == button_id:
                btn["group"] = str(group or "").strip() or "未分组"
                btn["order"] = int(time.time() * 1000 % 10 ** 9)
                self._store.save()
                return True
        return False

    def export_data(self) -> dict:
        return {
            "app": "AT指令调试台",
            "version": 1,
            "profile": self.profile_id,
            "exported_at": time.time(),
            "buttons": self.all(),
        }

    def import_data(self, data: dict, merge: bool = True) -> int:
        items = (data or {}).get("buttons") or []
        if not isinstance(items, list):
            return 0
        if not merge:
            self._store.data["buttons"] = []
        count = 0
        seen = {b.get("id") for b in self._store.data.get("buttons", [])}
        for item in items:
            if not isinstance(item, dict):
                continue
            payload = {
                "name": item.get("name", "导入按钮"),
                "icon": item.get("icon", "bolt"),
                "color": item.get("color", "blue"),
                "group": item.get("group", "导入"),
                "commands": item.get("commands", []),
                "delay": item.get("delay", 0.35),
                "note": item.get("note", ""),
            }
            source_id = item.get("id")
            if source_id and source_id in seen:
                continue
            button = self.add(payload)
            if source_id:
                seen.add(source_id)
            if source_id:
                button["source_id"] = source_id
            count += 1
        self._store.save()
        return count

    def reset_defaults(self) -> int:
        self._store.data["buttons"] = [dict(b) for b in DEFAULT_BUTTONS]
        self._store.save()
        return len(DEFAULT_BUTTONS)

    @staticmethod
    def _clean_commands(value: Any) -> list[str]:
        if isinstance(value, str):
            value = value.replace("\r", "\n").split("\n")
        out: list[str] = []
        for item in value or []:
            text = str(item).strip()
            if text:
                out.append(text)
        return out or ["AT"]
