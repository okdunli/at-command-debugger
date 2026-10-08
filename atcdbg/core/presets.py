from __future__ import annotations

import re
from typing import Any

from . import commands as C
from . import protocol as P

PRESETS: list[dict] = []
PRESET_MAP: dict[str, dict] = {}

_TOKEN_RE = re.compile(r"\{([^{}]+)\}")


def refresh(profile: dict) -> None:
    global PRESETS, PRESET_MAP
    PRESETS = [dict(p) for p in (profile.get("presets") or [])]
    for preset in PRESETS:
        preset.setdefault("id", "")
        preset.setdefault("name", preset["id"])
        preset.setdefault("icon", "bolt")
        preset.setdefault("accent", "blue")
        preset.setdefault("desc", "")
        preset.setdefault("steps", [])
        preset["fields"] = [_resolve_field(f) for f in (preset.get("fields") or [])]
    PRESET_MAP = {p["id"]: p for p in PRESETS}


def _resolve_field(field: dict) -> dict:
    out = dict(field or {})
    options = out.get("options")
    if options == "bands":
        out["options"] = C.band_options()
    elif options == "classes":
        out["options"] = [{"value": c, "label": c} for c in C.CLASSES]
    elif options == "verbose":
        out["options"] = [{"value": v.get("value"), "label": v.get("name")}
                           for v in C.VERBOSE_LEVELS]
    elif isinstance(options, list):
        out["options"] = [
            o if isinstance(o, dict) else {"value": o, "label": str(o)}
            for o in options
        ]
    return out



def _truthy(value: Any) -> bool:
    if value is None or value is False:
        return False
    if isinstance(value, str):
        text = value.strip().lower()
        if text in ("", "0", "false", "no", "off", "none"):
            return False
        return True
    return bool(value)


def _eval_when(expr: str, params: dict) -> bool:
    expr = str(expr or "").strip()
    if not expr:
        return True

    if "||" in expr:
        return any(_eval_when(part, params) for part in expr.split("||"))
    if "&&" in expr:
        return all(_eval_when(part, params) for part in expr.split("&&"))
    if expr.startswith("!"):
        return not _eval_when(expr[1:], params)
    for op in ("!=", "=="):
        if op in expr:
            key, _, needle = expr.partition(op)
            got = str(params.get(key.strip(), "") or "").strip()
            return (got != needle.strip()) if op == "!=" else (got == needle.strip())
    return _truthy(params.get(expr))


def _resolve_token(spec: str, params: dict) -> str:
    parts = [p.strip() for p in spec.split("|")]
    key = parts[0]
    raw = params.get(key)

    for mod in parts[1:]:
        name, _, arg = mod.partition(":")
        name = name.lower()
        if name == "key":
            raw = P.normalize_key(str(raw or ""), int(arg or 16))
        elif name == "hex":
            raw = P.text_to_hex(str(raw or ""))
        elif name == "hexraw":
            raw = P.normalize_hex_input(str(raw or ""))
        elif name == "upper":
            raw = str(raw or "").upper()
        elif name == "rx2":
            band = str(params.get("band", ""))
            table = C.BAND_RX2.get(band) or {}
            fallback = {"freq": "486900000", "dr": "1"}
            raw = (table or fallback).get(arg or "freq", "")
        elif name == "default":
            if raw in (None, ""):
                raw = arg
        elif name == "band_name":
            raw = C.band_name(str(raw or ""))
    if raw is None:
        return ""
    return str(raw)


def interpolate(text: str, params: dict) -> str:
    if not text:
        return ""
    return _TOKEN_RE.sub(lambda m: _resolve_token(m.group(1), params), str(text))



def default_params(preset_id: str) -> dict:
    preset = PRESET_MAP.get(preset_id)
    if not preset:
        return {}
    return {f["key"]: f.get("default") for f in preset.get("fields", [])}


def build_steps(preset_id: str, params: dict | None = None) -> list[dict]:
    preset = PRESET_MAP.get(preset_id)
    if not preset:
        return []
    merged = default_params(preset_id)
    merged.update(params or {})
    steps: list[dict] = []
    for raw in (preset.get("steps") or []):
        if not isinstance(raw, dict):
            continue
        if not _eval_when(raw.get("when"), merged):
            continue
        cmd = interpolate(raw.get("cmd", ""), merged)
        if not cmd:
            continue
        label = interpolate(raw.get("label", ""), merged) or cmd
        step = {
            "cmd": cmd,
            "label": label,
            "delay": float(raw.get("delay") or 0.3),
            "wait_event": float(raw.get("wait_event") or 0),
            "expect": str(raw.get("expect", "OK") or ""),
            "note": interpolate(raw.get("note", ""), merged),
        }
        # 透传可选字段：步骤级超时 / 无状态判定
        if raw.get("timeout"):
            step["timeout"] = float(raw["timeout"])
        if raw.get("no_status"):
            step["no_status"] = True
        steps.append(step)
    return steps
