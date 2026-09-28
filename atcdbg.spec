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
