from __future__ import annotations

import re
from typing import Any, Callable

from . import protocol as P

Validator = Callable[[str], tuple[bool, str]]

BUILTINS: dict[str, Validator] = {
    "send_payload": P.validate_send_payload,
    "tconf": P.validate_tconf,
    "tth": P.validate_tth,
}

def _parts(value: str, count: int, sep: str, message: str) -> tuple[bool, str]:
    got = str(value or "").split(sep)
    if len(got) != count:
        return False, message or f"应为 {count} 段（以 “{sep}” 分隔）"
    return True, ""

def build(spec: Any) -> Validator | None:
    if not spec:
        return None
    if callable(spec):
        return spec
    if isinstance(spec, str):
        spec = {"type": spec}
    if not isinstance(spec, dict):
        return None

    kind = str(spec.get("type") or "").lower()
    message = str(spec.get("message") or "")

    if kind == "range":
        low = int(spec.get("low", 0))
        high = int(spec.get("high", 0))
        return lambda v: P.validate_range(v, low, high)
    if kind == "hex":
        size = int(spec.get("size", 16))
        return lambda v: P.validate_hex_bytes(v, size)
    if kind == "choice":
        choices = [str(c) for c in (spec.get("choices") or [])]
        return lambda v: P.validate_choice(v, choices)
    if kind == "nonempty":
        def _nonempty(v: str) -> tuple[bool, str]:
            if str(v or "").strip():
                return True, ""
            return False, message or "不能为空"
        return _nonempty
    if kind == "regex":
        pattern = str(spec.get("pattern") or "")
        try:
            rx = re.compile(pattern)
        except re.error:
            return None

        def _regex(v: str) -> tuple[bool, str]:
            if rx.search(str(v or "")):
                return True, ""
            return False, message or f"格式不符合 {pattern}"
        return _regex
    if kind == "parts":
        count = int(spec.get("count", 0))
        sep = str(spec.get("sep") or ":")
        if count <= 0:
            return None
        return lambda v: _parts(v, count, sep, message)
    if kind == "builtin":
        name = str(spec.get("name") or "")
        return BUILTINS.get(name)
    if kind in ("any", "all"):
        children = [build(s) for s in (spec.get("of") or [])]
        children = [c for c in children if c]
        if not children:
            return None
        if kind == "any":
            def _any(v: str) -> tuple[bool, str]:
                last = ""
                for child in children:
                    ok, msg = child(v)
                    if ok:
                        return True, ""
                    last = msg
                return False, message or last
            return _any

        def _all(v: str) -> tuple[bool, str]:
            for child in children:
                ok, msg = child(v)
                if not ok:
                    return False, message or msg
            return True, ""
        return _all
    return None
