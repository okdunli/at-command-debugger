from __future__ import annotations

import threading
from typing import Any

from . import profiles
from . import protocol as P
from . import validators

_LOCK = threading.RLock()

CATEGORIES: list[dict] = []
CATEGORY_MAP: dict[str, dict] = {}
BANDS: list[dict] = []
CLASSES: list[str] = []
VERBOSE_LEVELS: list[dict] = []
COMMANDS: list[dict] = []
COMMAND_MAP: dict[str, dict] = {}
DEFAULTS: dict[str, Any] = {}
BAND_RX2: dict[str, dict] = {}
PROFILE_ID: str = profiles.DEFAULT_PROFILE_ID
PROFILE_META: dict[str, Any] = {}

def _normalize_command(raw: dict) -> dict:
    cmd = dict(raw or {})
    cmd.setdefault("id", "")
    cmd.setdefault("name", cmd["id"])
    cmd.setdefault("category", "general")
    cmd.setdefault("summary", "")
    cmd.setdefault("desc", "")
    cmd.setdefault("modes", ["run"])
    cmd.setdefault("params", [])
    cmd.setdefault("results", [])
    cmd.setdefault("example", [])
    cmd.setdefault("delay", 0.3)
    spec = cmd.get("validate")
    cmd["validate"] = validators.build(spec)
    cmd["_validate_spec"] = spec
    return cmd

def refresh(profile: dict, profile_id: str = "") -> None:
    with _LOCK:
        global CATEGORIES, CATEGORY_MAP, BANDS, CLASSES, VERBOSE_LEVELS
        global COMMANDS, COMMAND_MAP, DEFAULTS, BAND_RX2, PROFILE_ID
        global PROFILE_META

        PROFILE_ID = profile_id or str(profile.get("id") or "")
        PROFILE_META = profile

        CATEGORIES = [dict(c) for c in (profile.get("categories") or [])]
        CATEGORY_MAP = {c.get("id"): c for c in CATEGORIES}
        BANDS = [dict(b) for b in (profile.get("bands") or [])]
        CLASSES = [str(c) for c in (profile.get("classes") or ["A", "B", "C"])]
        VERBOSE_LEVELS = [dict(v) for v in (profile.get("verbose_levels") or [])]
        DEFAULTS = dict(profile.get("defaults") or {})
        BAND_RX2 = {str(k): dict(v)
                    for k, v in (profile.get("band_rx2") or {}).items()}

        COMMANDS = [_normalize_command(c) for c in (profile.get("commands") or [])]
        COMMAND_MAP = {c["id"]: c for c in COMMANDS if c.get("id")}

def load_profile(profile_id: str) -> dict:
    profile = profiles.load(profile_id)
    refresh(profile, profile_id)
    return profile

def by_category(cat_id: str) -> list[dict]:
    return [c for c in COMMANDS if c["category"] == cat_id]

def search(keyword: str) -> list[dict]:
    kw = (keyword or "").strip().upper()
    if not kw:
        return list(COMMANDS)
    results = []
    for cmd in COMMANDS:
        haystack = " ".join([
            cmd["id"], cmd.get("summary", ""), cmd.get("desc", ""),
            cmd.get("category", ""),
        ]).upper()
        if kw in haystack:
            results.append(cmd)
    return results

def validate_value(cmd_id: str, value: str) -> tuple[bool, str]:
    cmd = COMMAND_MAP.get(cmd_id)
    if cmd is None:
        return False, "未知指令"
    validator = cmd.get("validate")
    if validator is None:
        return True, ""
    try:
        return validator(value)
    except Exception as exc:
        return False, f"校验异常：{exc}"

def build(cmd_id: str, value: str | None = None, query: bool = False,
          help_: bool = False) -> str:
    cmd = COMMAND_MAP.get(cmd_id)
    if cmd is None:
        return cmd_id
    # 查询/帮助操作符按协议风格区分：
    #   aithinker（安信可 combo/Ra-08/ESP-AT/TG 等）：查询为 "?"，帮助为 "=?"
    #   an5481（STM32CubeWL AT）：查询用户设置为 "=?"，帮助为 "?"
    aithinker = P.get_style() == "aithinker"
    if help_:
        op = "=?" if aithinker else "?"
        return f"{cmd_id}{op}"
    if query:
        op = "?" if aithinker else "=?"
        return f"{cmd_id}{op}"
    if value not in (None, ""):
        return f"{cmd_id}={value}"
    return cmd_id

def default_value(cmd_id: str) -> str:
    cmd = COMMAND_MAP.get(cmd_id)
    if not cmd:
        return ""
    params = cmd.get("params") or []
    if not params:
        return ""
    return str(params[0].get("default", ""))

def suggestion_for(cmd_id: str) -> str:
    cmd = COMMAND_MAP.get(cmd_id)
    if not cmd:
        return cmd_id
    modes = cmd.get("modes") or []
    if "set" in modes:
        return build(cmd_id, default_value(cmd_id))
    if "get" in modes:
        return build(cmd_id, query=True)
    return cmd_id

def normalize_param_value(cmd_id: str, value: str) -> str:
    cmd = COMMAND_MAP.get(cmd_id)
    if not cmd:
        return value
    params = cmd.get("params") or []
    if not params:
        return value
    ptype = params[0].get("type")
    if ptype == "hex":
        return P.normalize_key(value, int(params[0].get("size", 16)))
    if ptype == "class":
        return str(value).strip().upper()
    return str(value).strip()

def band_options() -> list[dict]:
    return [{"value": b.get("value"), "label": f'{b.get("value")} · {b.get("name")}'}
            for b in BANDS]

def band_name(value: str) -> str:
    for b in BANDS:
        if str(b.get("value")) == str(value):
            return str(b.get("name") or value)
    return str(value)
