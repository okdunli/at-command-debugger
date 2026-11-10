"""PyInstaller spec - AT指令调试台 (rosezm 移植版), 单文件可执行程序。

与原版的唯一差别：界面资源来自 rosezm 的 Web 构建产物 `dist/`，而不是原版
仓库里的 `atcdbg/webui/ui`。冻结版里 `paths.ui_dir()` = `app_dir()/"dist"`，
而 `app_dir()` 在冻结态指向 PyInstaller 的 `_MEIPASS`，所以这里把 `dist/`
打进 `dist/` —— 与 `atcdbg/core/paths.py::ui_dir()` 的约定严格对应。

原版 spec 见原始仓库的 atcdbg.spec；两份保持同步，改动请同时更新。
"""
import sys
from pathlib import Path

PROJECT = Path(SPECPATH)
UI_DIR = PROJECT / "dist"          # rosezm build 的产物（npm run build）
ASSETS_DIR = PROJECT / "assets"

datas = []

# 界面资源：rosezm 的 Web 构建产物。缺了就直接报错——打出一个打开是白屏的
# exe 比不打更糟。
if not (UI_DIR / "index.html").exists():
    raise SystemExit(
        "atcdbg.spec: 找不到 %s/index.html。\n"
        "  请先执行 `npm run build`（rosezm build）生成 Web 产物再打包。" % UI_DIR
    )

# 只收 Web 资源，不要整个 dist/。dist/ 里同时有：
#   - 打包产物本身（AT指令调试台 / .exe）→ 整个目录打包会「自我嵌套」，体积每次翻倍
#   - 运行时数据 data/、profiles/（用户数据，不该进包）
#   - screenshot/、test/、*.br 预压缩件等开发/运行时残留
# 逐个文件收，排除以上非界面资源。
_UI_EXCLUDE_TOP = {"data", "profiles", "screenshot", "test", "build"}
_UI_EXCLUDE_NAMES = {"AT指令调试台", "AT指令调试台.exe"}
for _p in sorted(UI_DIR.rglob("*")):
    if not _p.is_file():
        continue
    _rel = _p.relative_to(UI_DIR)
    if _rel.parts and _rel.parts[0] in _UI_EXCLUDE_TOP:
        continue
    if _p.name in _UI_EXCLUDE_NAMES:
        continue
    if _p.suffix == ".br":          # 预压缩件，冻结版用不到
        continue
    datas.append((str(_p), str(Path("dist") / _rel.parent)))

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
