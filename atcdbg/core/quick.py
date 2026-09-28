from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from . import commands as C
from . import paths
from . import protocol as P
from .store import load as load_json
from .store import save as save_json

ACTIONS: list[dict] = []
ACTION_MAP: dict[str, dict] = {}
PROFILE_ID: str = ""

_TOKEN_RE = re.compile(r"\{([^{}]+)\}")

def refresh(profile: dict, profile_id: str = "") -> None:
    global ACTIONS, ACTION_MAP, PROFILE_ID
    PROFILE_ID = profile_id or str(profile.get("id") or "")
    ACTIONS = [_normalize(a) for a in (profile.get("quick_actions") or [])]
    ACTION_MAP = {a["id"]: a for a in ACTIONS if a.get("id")}

def _normalize(raw: dict) -> dict:
    item = dict(raw or {})
    item.setdefault("id", "")
    item.setdefault("name", item["id"])
    item.setdefault("icon", "bolt")
    item.setdefault("sub", "")
    item.setdefault("kind", "steps")
    item.setdefault("confirm", False)
    item.setdefault("params", [])
    if not item.get("steps"):
        cmd = item.get("cmd")
        item["steps"] = ([{"cmd": c} for c in cmd]
                         if isinstance(cmd, list)
                         else ([{"cmd": str(cmd)}] if cmd else []))
    item["params"] = [_resolve_param(p) for p in (item.get("params") or [])]
    return item

def _resolve_param(param: dict) -> dict:
    out = dict(param or {})
    out.setdefault("key", "")
    out.setdefault("label", out["key"])
    out.setdefault("type", "text")
    options = out.get("options")
    if options == "bands":
        out["options"] = C.band_options()
    elif options == "classes":
        out["options"] = [{"value": c, "label": c} for c in C.CLASSES]
    elif isinstance(options, list):
        out["options"] = [
            o if isinstance(o, dict) else {"value": o, "label": str(o)}
            for o in options
        ]
    else:
        out.pop("options", None)
    return out

def get(action_id: str) -> dict | None:
    return ACTION_MAP.get(str(action_id or ""))

def values_path() -> Path:
    return paths.quick_params_file()

def _load_all() -> dict:
    data = load_json(values_path(), {})
    return data if isinstance(data, dict) else {}

def save_values(action_id: str, values: dict | None) -> dict:
    data = _load_all()
    slot = data.setdefault(PROFILE_ID or "default", {})
    slot[str(action_id)] = dict(values or {})
    save_json(values_path(), data)
    return {"ok": True, "action_id": action_id, "values": dict(values or {})}

def merged() -> list[dict]:
    slot = _load_all().get(PROFILE_ID or "default") or {}
    out: list[dict] = []
    for action in ACTIONS:
        item = dict(action)
        saved = slot.get(action["id"]) or {}
        params = []
        for p in action["params"]:
            pp = dict(p)
            value = saved.get(p["key"], p.get("default"))
            pp["value"] = "" if value is None else str(value)
            params.append(pp)
        item["params"] = params
        out.append(item)
    return out

def normalize_values(action: dict, values: dict | None) -> dict:
    values = dict(values or {})
    out: dict[str, Any] = {}
    for p in (action.get("params") or []):
        key = p.get("key")
        raw = values.get(key, p.get("default"))
        text = "" if raw is None else str(raw).strip()
        ptype = p.get("type")
        if ptype == "hex":
            cleaned = re.sub(r"[^0-9A-Fa-f]", "", text).upper()
            size = p.get("size")
            if size and len(cleaned) != int(size) * 2:
                raise ValueError(
                    f"{p.get('label') or key} 应为 {size} 字节"
                    f"（{int(size) * 2} 个十六进制字符），当前 {len(cleaned)} 个")
            if not cleaned:
                raise ValueError(f"{p.get('label') or key} 不能为空")
            text = P.normalize_key(cleaned, int(size)) if size else cleaned
        elif ptype == "int":
            if text == "":
                raise ValueError(f"{p.get('label') or key} 不能为空")
            try:
                num = int(str(text).split(".")[0])
            except ValueError:
                raise ValueError(f"{p.get('label') or key} 必须是整数")
            lo, hi = p.get("min"), p.get("max")
            if lo is not None and num < int(lo):
                raise ValueError(f"{p.get('label') or key} 不能小于 {lo}")
            if hi is not None and num > int(hi):
                raise ValueError(f"{p.get('label') or key} 不能大于 {hi}")
            text = str(num)
        elif ptype == "bool":
            text = "1" if str(text).lower() in ("1", "true", "on", "yes") else "0"
        if not text and ptype != "bool":
            raise ValueError(f"{p.get('label') or key} 不能为空")
        out[key] = text
    return out

def build_steps(action_id: str, values: dict | None = None) -> list[dict]:
    action = get(action_id)
    if not action:
        raise ValueError("未知快捷操作")
    params = normalize_values(action, values)
    steps = []
    for raw in (action.get("steps") or []):
        step = dict(raw or {})
        cmd = str(step.get("cmd") or "")
        step["cmd"] = _TOKEN_RE.sub(
            lambda m: str(params.get(m.group(1).strip(), "")), cmd)
        step.setdefault("label", "")
        steps.append(step)
    if not steps:
        raise ValueError("该快捷操作没有可执行的指令")
    return steps
