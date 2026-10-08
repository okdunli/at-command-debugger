import sys
from pathlib import Path

PROJECT = Path(SPECPATH)
UI_DIR = PROJECT / "atcdbg" / "webui" / "ui"
ASSETS_DIR = PROJECT / "assets"

datas = [
    (str(UI_DIR), "atcdbg/webui/ui"),
]

if ASSETS_DIR.exists():
    datas.append((str(ASSETS_DIR), "assets"))

# 内置配置集：逐个目录打包（含 example），供冻结版首次运行"输出"到 exe 旁。
# 只打包含 profile.json 的配置集目录，排除 profiles 根部的 config.json 等用户数据。
PROFILES_DIR = PROJECT / "profiles"
if PROFILES_DIR.exists():
    for _child in sorted(PROFILES_DIR.iterdir()):
        if _child.is_dir() and (_child / "profile.json").exists():
            datas.append((str(_child), "profiles/" + _child.name))

hiddenimports = [
    "atcdbg",
    "atcdbg.core",
    "atcdbg.core.paths",
    "atcdbg.core.config",
    "atcdbg.core.store",
    "atcdbg.core.serial_mgr",
    "atcdbg.core.protocol",
    "atcdbg.core.commands",
    "atcdbg.core.presets",
    "atcdbg.core.suites",
    "atcdbg.core.buttons",
    "atcdbg.core.runner",
    "atcdbg.core.device_sim",
    "atcdbg.core.exporter",
    "atcdbg.core.logging_setup",
    "atcdbg.core.profiles",
    "atcdbg.core.validators",
    "atcdbg.core.winnative",
    "atcdbg.webui",
    "atcdbg.webui.app",
    "atcdbg.webui.backend",
]

if sys.platform == "win32":
    hiddenimports += ["webview.platforms.edgechromium", "webview.platforms.winforms"]
elif sys.platform == "darwin":
    hiddenimports += ["webview.platforms.cocoa"]
else:
    hiddenimports += ["webview.platforms.gtk"]

a = Analysis(
    ["main.py"],
    pathex=[str(PROJECT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "numpy", "scipy", "pandas",
              "PyQt5", "PyQt6", "PySide2", "PySide6"],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="AT指令调试台",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    runtime_tmpdir=None,
    console=False,
    icon="assets/icon.ico" if (PROJECT / "assets" / "icon.ico").exists() else None,
)
