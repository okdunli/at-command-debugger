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
    """旧版 %APPDATA% 数据目录（仅供迁移读取，不再作为运行时数据目录）。"""
    migrate_legacy()
    name = APP_NAME if not _INSTANCE else f"{APP_NAME}-{_INSTANCE}"
    return _data_dir_for(name)


def _repo_root() -> Path:
    """程序所在目录（打包后取 exe 目录，避免 PyInstaller 临时解压目录）。"""
    if is_frozen():
        return Path(sys.executable).resolve().parent
    return app_dir()


def _legacy_appdata_dir() -> Path:
    name = APP_NAME if not _INSTANCE else f"{APP_NAME}-{_INSTANCE}"
    return _base_dir() / name


def _migrate_from_appdata(target: Path) -> None:
    """一次性把旧 %APPDATA% 数据搬进仓库 profiles 目录（不覆盖已有文件）。"""
    legacy = _legacy_appdata_dir()
    if not legacy.is_dir():
        return
    if not (legacy / "config.json").exists():
        return
    if (target / "config.json").exists():
        return  # 已迁移过

    def _move(src: Path, dst: Path) -> None:
        if not src.exists() or dst.exists():
            return
        try:
            shutil.move(str(src), str(dst))
        except (OSError, shutil.Error):
            try:
                if src.is_dir():
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)
            except OSError:
                pass

    rt = runtime_dir()
    try:
        target.mkdir(parents=True, exist_ok=True)
        rt.mkdir(parents=True, exist_ok=True)
        # 软件配置与配置集 -> profiles/；运行数据 -> 独立 data/ 目录
        _move(legacy / "config.json", target / "config.json")
        for name in ("history.json", "quick_params.json"):
            _move(legacy / name, rt / name)
        for name in ("logs", "exports", "backups", "baselines"):
            _move(legacy / name, rt / name)
        legacy_profiles = legacy / "profiles"
        if legacy_profiles.is_dir():
            for child in legacy_profiles.iterdir():
                if not child.is_dir():
                    continue
                dest_dir = target / child.name
                dest_dir.mkdir(parents=True, exist_ok=True)
                for item in child.iterdir():
                    if item.name == "profile.json":
                        # 内置/种子 profile 不搬（以仓库为准），仅搬用户数据
                        try:
                            import json as _json
                            data = _json.loads(
                                item.read_text(encoding="utf-8"))
                            has_content = bool(data.get("commands"))
                        except Exception:
                            has_content = False
                        if not has_content:
                            continue
                    _move(item, dest_dir / item.name)
    except OSError:
        pass


def user_dir() -> Path:
    """运行时数据目录：跟随程序仓库的 profiles/（config.json 与各配置集数据都在此）。"""
    suffix = f"-{_INSTANCE}" if _INSTANCE else ""
    path = _repo_root() / f"profiles{suffix}"
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError:
        path = Path.home() / ("." + APP_NAME_ASCII.lower())
        path = path / f"profiles{suffix}"
        path.mkdir(parents=True, exist_ok=True)
    _migrate_from_appdata(path)
    return path


def config_file() -> Path:
    return user_dir() / "config.json"


def buttons_file(profile_id: str = "") -> Path:
    if profile_id:
        path = user_dir() / profile_id
        try:
            path.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass
        return path / "buttons.json"
    return user_dir() / "buttons.json"


def profiles_dir() -> Path:
    return user_dir()


def builtin_profiles_dir() -> Path:
    """内置配置集目录。冻结版优先 exe 旁 profiles/（用户可见可编辑）；
    若其尚无 example（首次运行/被清空），回退到打包资源内的 profiles/，
    供初始化时把内置配置集"输出"到 exe 旁。"""
    if is_frozen():
        exe_side = Path(sys.executable).resolve().parent / "profiles"
        try:
            if (exe_side / "example" / "profile.json").exists():
                return exe_side
        except OSError:
            pass
        try:
            bundled = resource_path("profiles")
            if (bundled / "example" / "profile.json").exists():
                return bundled
        except OSError:
            pass
        return exe_side
    return app_dir() / "profiles"


def errorcodes_file(profile_id: str = "") -> Path:
    if profile_id:
        path = user_dir() / profile_id
        try:
            path.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass
        return path / "errorcodes.json"
    return user_dir() / "errorcodes.json"

def runtime_dir() -> Path:
    """运行时数据目录（发送历史/日志/导出/备份/基线等），与配置集目录 profiles/ 分离。"""
    suffix = f"-{_INSTANCE}" if _INSTANCE else ""
    path = _repo_root() / f"data{suffix}"
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError:
        path = Path.home() / ("." + APP_NAME_ASCII.lower()) / f"data{suffix}"
        path.mkdir(parents=True, exist_ok=True)
    _migrate_runtime_from_profiles(path)
    _migrate_orphan_appdata_runtime(path)
    return path


def _migrate_runtime_from_profiles(target: Path) -> None:
    """一次性把上一版误放进 profiles/ 的运行数据搬到独立 data/ 目录（不覆盖已有）。"""
    src = user_dir()
    for name in ("history", "logs", "exports", "backups", "baselines",
                 "history.json", "history.json.migrated", "quick_params.json"):
        s = src / name
        if not s.exists():
            continue
        d = target / name
        if d.exists():
            continue
        try:
            shutil.move(str(s), str(d))
        except (OSError, shutil.Error):
            try:
                if s.is_dir():
                    shutil.copytree(s, d, dirs_exist_ok=True)
                    shutil.rmtree(s, ignore_errors=True)
                else:
                    shutil.copy2(s, d)
            except OSError:
                pass


def _migrate_orphan_appdata_runtime(target: Path) -> None:
    """把仍残留在旧 %APPDATA% 数据目录里的运行数据（日志/导出/备份等）搬到 data/。

    旧版迁移逻辑只在存在 config.json 时才触发；若用户只残留了日志文件而
    无 config.json（例如早期部分版本），那些文件会一直留在 APPDATA。这里做
    一次兜底扫描，让它们最终都归拢到软件目录下的 data/。已存在同名文件则跳过。
    """
    legacy = _legacy_appdata_dir()
    if not legacy.is_dir():
        return
    names = ("logs", "exports", "backups", "baselines", "history",
             "history.json", "history.json.migrated", "quick_params.json")
    try:
        target.mkdir(parents=True, exist_ok=True)
        for name in names:
            s = legacy / name
            if not s.exists():
                continue
            d = target / name
            if d.exists():
                continue
            try:
                shutil.move(str(s), str(d))
            except (OSError, shutil.Error):
                try:
                    if s.is_dir():
                        shutil.copytree(s, d, dirs_exist_ok=True)
                        shutil.rmtree(s, ignore_errors=True)
                    else:
                        shutil.copy2(s, d)
                except OSError:
                    pass
    except OSError:
        pass


def history_file() -> Path:
    """旧版单文件历史（仅供迁移读取）。"""
    return runtime_dir() / "history.json"


def history_dir() -> Path:
    """发送历史：按天分文件 history/YYYY-MM-DD.json。"""
    path = runtime_dir() / "history"
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass
    return path

def quick_params_file() -> Path:
    return runtime_dir() / "quick_params.json"

def export_dir() -> Path:
    path = runtime_dir() / "exports"
    path.mkdir(parents=True, exist_ok=True)
    return path

def log_dir() -> Path:
    path = runtime_dir() / "logs"
    path.mkdir(parents=True, exist_ok=True)
    return path

def log_file() -> Path:
    return log_dir() / "debugger.log"

def backup_dir() -> Path:
    path = runtime_dir() / "backups"
    path.mkdir(parents=True, exist_ok=True)
    return path

def baselines_dir() -> Path:
    path = runtime_dir() / "baselines"
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
