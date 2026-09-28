from __future__ import annotations

from . import commands as C

SUITES: list[dict] = []
SUITE_MAP: dict[str, dict] = {}

def _normalize_case(raw: dict, index: int) -> dict:
    case = dict(raw or {})
    cmd = case.get("cmd") or ""
    case["cmd"] = cmd
    case.setdefault("name", case.get("title") or cmd or f"用例 {index + 1}")
    case["title"] = case.get("title") or case["name"]
    case["id"] = case.get("id") or cmd or f"case{index + 1}"
    case.setdefault("skip", False)
    case.setdefault("dangerous", False)
    case.setdefault("expect", "OK")
    case.setdefault("note", "")
    return case

def refresh(profile: dict) -> None:
    global SUITES, SUITE_MAP
    SUITES = [dict(s) for s in (profile.get("suites") or [])]
    for suite in SUITES:
        suite.setdefault("id", "")
        suite.setdefault("name", suite["id"])
        suite.setdefault("icon", "check")
        suite.setdefault("desc", "")
        suite["cases"] = [_normalize_case(c, i)
                          for i, c in enumerate(suite.get("cases") or [])]
    SUITE_MAP = {s["id"]: s for s in SUITES}

def all_cases() -> list[dict]:
    out = []
    for suite in SUITES:
        for case in suite["cases"]:
            item = dict(case)
            item["suite"] = suite["id"]
            item["suite_name"] = suite["name"]
            out.append(item)
    return out

def suite_cases(suite_id: str) -> list[dict]:
    suite = SUITE_MAP.get(suite_id)
    if not suite:
        return []
    return [dict(c, suite=suite_id, suite_name=suite["name"])
            for c in suite["cases"]]

def total_count() -> int:
    return sum(len(s["cases"]) for s in SUITES)

def category_of(cmd: str) -> str:
    base = (cmd or "").split("=")[0].split("?")[0]
    info = C.COMMAND_MAP.get(base)
    return info["category"] if info else "general"
