from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

APP_NAME = "AT指令调试台"
APP_NAME_ASCII = "ATCommandDebugger"
LEGACY_APP_NAMES = ("AT指令助手",)
LEGACY_APP_NAME_ASCII = "ATCommandAssistant"

_INSTANCE = ""

def set_instance(name: str) -> str:
    global _INSTANCE
    _INSTANCE = str(name or "").strip()
    return _INSTANCE

def instance_name() -> str:
    return _INSTANCE

def is_frozen() -> bool:
    return bool(getattr(sys, "frozen", False))

def app_dir() -> Path:
    if is_frozen():
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    return Path(__file__).resolve().parents[2]

def resource_path(relative: str) -> Path:
    return app_dir() / relative

def ui_dir() -> Path:
    return resource_path("atcdbg/webui/ui")

def _windows_base() -> Path:
    base = os.environ.get("APPDATA")
    if not base:
        base = str(Path.home() / "AppData" / "Roaming")
    return Path(base)

def _macos_base() -> Path:
    return Path.home() / "Library" / "Application Support"

def _linux_base() -> Path:
    base = os.environ.get("XDG_DATA_HOME")
    if not base:
        base = str(Path.home() / ".local" / "share")
    return Path(base)

def _base_dir() -> Path:
    if sys.platform == "win32":
        return _windows_base()
    if sys.platform == "darwin":
        return _macos_base()
    return _linux_base()

def _data_dir_for(name: str) -> Path:
    return _base_dir() / name

def migrate_legacy() -> str:
    target = _data_dir_for(APP_NAME)
    if target.exists():
        return ""
    for legacy in LEGACY_APP_NAMES:
        source = _data_dir_for(legacy)
        if not source.is_dir():
            continue
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(source), str(target))
            return legacy
        except (OSError, shutil.Error):

            try:
                shutil.copytree(str(source), str(target), dirs_exist_ok=True)
                return legacy
            except (OSError, shutil.Error):
                return ""
    return ""

def data_dir() -> Path:
    migrate_legacy()
    name = APP_NAME if not _INSTANCE else f"{APP_NAME}-{_INSTANCE}"
    path = _data_dir_for(name)
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError:
        fallback = Path.home() / ("." + APP_NAME_ASCII.lower())
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback
    return path

def portable_marker() -> Path:
    return app_dir() / "portable.txt"

def is_portable() -> bool:
    return portable_marker().exists()

def user_dir() -> Path:
    if is_portable():

        name = "data" if not _INSTANCE else f"data-{_INSTANCE}"
        path = app_dir() / name
        path.mkdir(parents=True, exist_ok=True)
        return path
    return data_dir()

def config_file() -> Path:
    return user_dir() / "config.json"

def buttons_file(profile_id: str = "") -> Path:
    if profile_id:
        path = user_dir() / "profiles" / profile_id
        try:
            path.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass
        return path / "buttons.json"
    return user_dir() / "buttons.json"

def profiles_dir() -> Path:
    path = user_dir() / "profiles"
    path.mkdir(parents=True, exist_ok=True)
    return path

def builtin_profiles_dir() -> Path:
    if is_frozen():
        return Path(sys.executable).resolve().parent / "profiles"
    return app_dir() / "profiles"

def errorcodes_file(profile_id: str = "") -> Path:
    if profile_id:
        path = user_dir() / "profiles" / profile_id
        try:
            path.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass
        return path / "errorcodes.json"
    return user_dir() / "errorcodes.json"

def history_file() -> Path:
    return user_dir() / "history.json"

def quick_params_file() -> Path:
    return user_dir() / "quick_params.json"

def export_dir() -> Path:
    path = user_dir() / "exports"
    path.mkdir(parents=True, exist_ok=True)
    return path

def log_dir() -> Path:
    path = user_dir() / "logs"
    path.mkdir(parents=True, exist_ok=True)
    return path

def log_file() -> Path:
    return log_dir() / "debugger.log"

def backup_dir() -> Path:
    path = user_dir() / "backups"
    path.mkdir(parents=True, exist_ok=True)
    return path

def baselines_dir() -> Path:
    path = user_dir() / "baselines"
    path.mkdir(parents=True, exist_ok=True)
    return path

def platform_label() -> str:
    if sys.platform == "win32":
        return "Windows"
    if sys.platform == "darwin":
        return "macOS"
    return "Linux"

def default_serial_ports() -> list[str]:
    if sys.platform == "win32":
        return [f"COM{i}" for i in range(1, 25)]
    if sys.platform == "darwin":
        return ["/dev/cu.usbserial", "/dev/cu.usbmodem", "/dev/cu.SLAB_USBtoUART"]
    return ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyACM0", "/dev/ttyS0"]
