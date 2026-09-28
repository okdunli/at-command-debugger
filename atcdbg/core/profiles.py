from __future__ import annotations

import json
import re
import shutil
import time
from pathlib import Path
from typing import Any

from . import paths
from .store import save as save_json

PROFILE_FILE = "profile.json"
DEFAULT_PROFILE_ID = "example"

_ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")


MINIMAL: dict[str, Any] = {
    "id": "blank",
    "name": "空白配置",
    "brand": "AT指令调试台",
    "subtitle": "跨平台 AT 指令测试上位机",
    "icon": "terminal",
    "version": "",
    "app_version": "1.0.0",
    "doc": "",
    "categories": [{"id": "general", "name": "通用指令", "icon": "sparkles",
                    "desc": "通用 AT 指令"}],
    "bands": [],
    "classes": ["A", "B", "C"],
    "verbose_levels": [],
    "defaults": {},
    "band_rx2": {},
    "commands": [],
    "presets": [],
    "quick_actions": [],
    "suites": [],
    "buttons": [],
    "home": {"intro": "", "pinned": []},
    "author": "",
    "release_date": "",
    "website": "",
    "intro": "",
    "device": {},
}




def builtin_dir() -> Path:
    return paths.builtin_profiles_dir()


def user_profiles_dir() -> Path:
    path = paths.user_dir() / "profiles"
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass
    return path


def profile_dir(profile_id: str, writable: bool = False) -> Path:
    if writable:
        return user_profiles_dir() / profile_id
    for base in (user_profiles_dir(), builtin_dir()):
        candidate = base / profile_id
        if (candidate / PROFILE_FILE).exists():
            return candidate
    return builtin_dir() / profile_id


def profile_file(profile_id: str, writable: bool = False) -> Path:
    return profile_dir(profile_id, writable) / PROFILE_FILE


def is_writable(profile_id: str) -> bool:
    try:
        return profile_dir(profile_id).parent == user_profiles_dir()
    except Exception:
        return False




def _read_json(path: Path) -> dict | None:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def _meta(profile_id: str, directory: Path) -> dict:
    raw = _read_json(directory / PROFILE_FILE) or {}
    return {
        "id": profile_id,
        "name": str(raw.get("name") or profile_id),
        "brand": str(raw.get("brand") or raw.get("name") or profile_id),
        "subtitle": str(raw.get("subtitle") or ""),
        "icon": str(raw.get("icon") or "terminal"),
        "version": str(raw.get("version") or ""),
        "doc": str(raw.get("doc") or ""),
        "source": "user" if directory.parent == user_profiles_dir() else "builtin",
        "dir": str(directory),
        "command_count": len(raw.get("commands") or []),
        "preset_count": len(raw.get("presets") or []),
        "suite_count": sum(len(s.get("cases") or [])
                           for s in (raw.get("suites") or [])),
    }


def _scan(base: Path) -> list[Path]:
    if not base.exists():
        return []
    try:
        return [c for c in sorted(base.iterdir())
                if c.is_dir() and (c / PROFILE_FILE).exists()]
    except OSError:
        return []


def list_profiles() -> list[dict]:
    found: dict[str, dict] = {}
    for base in (builtin_dir(), user_profiles_dir()):
        for child in _scan(base):
            found[child.name] = _meta(child.name, child)
    items = list(found.values())
    items.sort(key=lambda m: (m["id"] != DEFAULT_PROFILE_ID, m["name"]))
    return items


def load(profile_id: str) -> dict:
    directory = profile_dir(profile_id)
    raw = _read_json(directory / PROFILE_FILE)
    if raw is None:
        raw = dict(MINIMAL, id=profile_id, name=profile_id)
    raw.setdefault("id", profile_id)
    for key, default in MINIMAL.items():
        if key not in raw or raw[key] is None:
            raw[key] = json.loads(json.dumps(default, ensure_ascii=False))
    return raw


def save(profile_id: str, data: dict) -> bool:
    directory = user_profiles_dir() / profile_id
    directory.mkdir(parents=True, exist_ok=True)
    data = dict(data or {})
    data["id"] = profile_id
    return save_json(directory / PROFILE_FILE, data)


def save_in_place(profile_id: str, data: dict) -> bool:
    directory = profile_dir(profile_id)
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        directory = user_profiles_dir() / profile_id
        directory.mkdir(parents=True, exist_ok=True)
    data = dict(data or {})
    data["id"] = profile_id
    return save_json(directory / PROFILE_FILE, data)


def valid_id(profile_id: str) -> bool:
    return bool(_ID_RE.match(profile_id or ""))


def create(profile_id: str, name: str, base: str = "",
           brand: str = "", subtitle: str = "") -> dict:
    if not valid_id(profile_id):
        raise ValueError("标识只能是小写字母/数字/-/_，且以字母数字开头")
    target = user_profiles_dir() / profile_id
    if (target / PROFILE_FILE).exists():
        raise ValueError(f"配置集 {profile_id} 已存在")
    if base:
        data = load(base)
    else:
        data = json.loads(json.dumps(MINIMAL, ensure_ascii=False))
    data["id"] = profile_id
    data["name"] = name or profile_id
    data["brand"] = brand or name or profile_id
    if subtitle:
        data["subtitle"] = subtitle
    save(profile_id, data)
    return _meta(profile_id, target)


def duplicate(profile_id: str, new_id: str, new_name: str = "") -> dict:
    return create(new_id, new_name or new_id, base=profile_id)


def delete(profile_id: str) -> bool:
    target = user_profiles_dir() / profile_id
    if not (target / PROFILE_FILE).exists():
        return False
    try:
        shutil.rmtree(target)
        return True
    except OSError:
        return False


def export(profile_id: str) -> dict:
    data = load(profile_id)
    return {
        "kind": "at-command-debugger-profile",
        "format": 1,
        "exported_at": time.time(),
        "profile": data,
    }


def import_package(package: dict | str, override_id: str = "") -> dict:
    if isinstance(package, str):
        package = json.loads(package)
    if not isinstance(package, dict):
        raise ValueError("配置包格式错误")
    data = package.get("profile") if "profile" in package else package
    if not isinstance(data, dict):
        raise ValueError("配置包缺少 profile 字段")
    profile_id = override_id or str(data.get("id") or "").strip()
    if not valid_id(profile_id):
        raise ValueError("配置包缺少合法 id，请指定标识")
    if (user_profiles_dir() / profile_id / PROFILE_FILE).exists() and not override_id:
        suffix = 2
        while (user_profiles_dir() / f"{profile_id}{suffix}"
               / PROFILE_FILE).exists():
            suffix += 1
        profile_id = f"{profile_id}{suffix}"
    save(profile_id, data)
    return _meta(profile_id, user_profiles_dir() / profile_id)


def seed_builtin() -> None:
    base = builtin_dir()
    if base.exists():
        try:
            for child in base.iterdir():
                if child.is_dir() and (child / PROFILE_FILE).exists():
                    return
        except OSError:
            pass
    else:
        try:
            base.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass


    if _scan(user_profiles_dir()):
        return
    fallback_id = "default"
    data = json.loads(json.dumps(MINIMAL, ensure_ascii=False))
    data.update(id=fallback_id, name="默认配置", brand="AT指令调试台",
                subtitle="请导入或新建一个配置集")
    try:
        save(fallback_id, data)
    except OSError:
        pass
