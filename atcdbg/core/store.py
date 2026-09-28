from __future__ import annotations

import json
import shutil
import threading
import time
from pathlib import Path
from typing import Any

from . import paths

MAX_BACKUPS = 5
_LOCK = threading.RLock()

def _now_tag() -> str:
    return time.strftime("%Y%m%d-%H%M%S")

def _backup(file_path: Path) -> None:
    try:
        if not file_path.exists():
            return
        backup_dir = paths.backup_dir()
        target = backup_dir / f"{file_path.stem}-{_now_tag()}{file_path.suffix}"
        shutil.copy2(file_path, target)
        _trim_backups(file_path.stem, file_path.suffix)
    except OSError:
        pass

def _trim_backups(stem: str, suffix: str) -> None:
    try:
        items = sorted(
            paths.backup_dir().glob(f"{stem}-*{suffix}"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        for old in items[MAX_BACKUPS:]:
            try:
                old.unlink()
            except OSError:
                pass
    except OSError:
        pass

def load(file_path: Path, default: Any) -> Any:
    with _LOCK:
        try:
            if not file_path.exists():
                return default
            with open(file_path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            return default

def _replace_with_retry(tmp: Path, target: Path, attempts: int = 8) -> bool:
    import os
    import time as _time
    for i in range(attempts):
        try:
            os.replace(str(tmp), str(target))
            return True
        except PermissionError:
            if i == attempts - 1:
                return False
            _time.sleep(0.03 * (i + 1))
        except OSError:
            return False
    return False

def save(file_path: Path, data: Any) -> bool:
    with _LOCK:
        tmp = None
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            _backup(file_path)
            tmp = file_path.with_suffix(file_path.suffix + ".tmp")
            text = json.dumps(data, ensure_ascii=False, indent=2)
            with open(tmp, "w", encoding="utf-8") as fh:
                fh.write(text)
                fh.flush()
                try:
                    os_fsync = __import__("os").fsync
                    os_fsync(fh.fileno())
                except Exception:
                    pass
            if not _replace_with_retry(tmp, file_path):
                return False
            return True
        except Exception:
            return False
        finally:
            if tmp is not None:
                try:
                    if tmp.exists():
                        tmp.unlink()
                except OSError:
                    pass

class JsonStore:

    def __init__(self, file_path: Path, default: Any) -> None:
        self.path = Path(file_path)
        self._default = default
        self._data = load(self.path, default)

    @property
    def data(self) -> Any:
        return self._data

    def get(self, key: str, default: Any = None) -> Any:
        if isinstance(self._data, dict):
            return self._data.get(key, default)
        return default

    def set(self, key: str, value: Any, autosave: bool = True) -> None:
        if not isinstance(self._data, dict):
            self._data = {}
        self._data[key] = value
        if autosave:
            self.save()

    def update(self, patch: dict, autosave: bool = True) -> None:
        if not isinstance(self._data, dict):
            self._data = {}
        self._data.update(patch)
        if autosave:
            self.save()

    def save(self) -> bool:
        return save(self.path, self._data)

    def reload(self) -> Any:
        self._data = load(self.path, self._default)
        return self._data

def new_id(prefix: str = "id") -> str:
    import uuid

    return f"{prefix}-{uuid.uuid4().hex[:8]}"
