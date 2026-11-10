"""AT指令调试台 构建脚本。

用法：
    python build.py            # 打包（单文件可执行程序）
    python build.py --clean    # 清理产物
    python build.py --check    # 运行后端自检

打包前会确保 Web 构建产物 `dist/` 存在
（`npm run build`），因为冻结版的界面资源就是它 —— 缺了就打出一个白屏 exe。

产物：dist/AT指令调试台.exe（Windows）/ dist/AT指令调试台（macOS、Linux），
单文件，可直接移动分发，目标机器无需安装 Python。
"""
from __future__ import annotations

import argparse
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP_NAME = "AT指令调试台"
DIST = ROOT / "dist"
BUILD = ROOT / "build"
ASSETS = ROOT / "assets"
WEB_DIST = ROOT / "dist"   # rosezm build 的产物


def run(cmd: list[str], **kw) -> int:
    print(">>", " ".join(str(c) for c in cmd))
    return subprocess.call([str(c) for c in cmd], **kw)


def check_pyinstaller() -> bool:
    try:
        import PyInstaller  # noqa: F401
        return True
    except ImportError:
        print("未安装 PyInstaller。请先执行：")
        print("  pip install -r requirements.txt")
        return False


def clean() -> None:
    # dist/ 同时是 rosezm 的 Web 构建产物目录——清理时只删打包产物，
    # 不动 Web 产物（它是 npm run build 生成的，可重新生成）。
    for d in (BUILD,):
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
            print("已清理", d)
    for name in ("AT指令调试台", "AT指令调试台.exe"):
        p = DIST / name
        if p.exists():
            if p.is_dir():
                shutil.rmtree(p, ignore_errors=True)
            else:
                p.unlink()
            print("已清理", p)


def ensure_web_build() -> bool:
    """冻结版的界面资源是 Web 构建产物；缺了就先构建一份。"""
    if (WEB_DIST / "index.html").exists():
        print("Web 产物已存在：", WEB_DIST / "index.html")
        return True
    print("未找到 %s/index.html，尝试执行 `npm run build` ..." % WEB_DIST)
    npm = shutil.which("npm")
    if not npm:
        print("  未找到 npm，无法自动构建。请先执行 `npm run build` 后重试。")
        return False
    code = subprocess.call([npm, "run", "--silent", "build"], cwd=str(ROOT))
    if code != 0 or not (WEB_DIST / "index.html").exists():
        print("  Web 构建失败，无法打包（冻结版需要 dist/ 里的界面资源）。")
        return False
    print("Web 构建完成：", WEB_DIST / "index.html")
    return True


def exe_name() -> str:
    return {
        "Windows": f"{APP_NAME}.exe",
        "Darwin": APP_NAME,
        "Linux": APP_NAME,
    }.get(platform.system(), APP_NAME)


def copy_profiles() -> None:
    src = ROOT / "profiles"
    if not src.is_dir():
        print("未找到 profiles/，跳过复制（应用启动时也需要该目录）")
        return
    dst = DIST / "profiles"
    if dst.exists():
        shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst)
    count = sum(1 for p in dst.iterdir() if p.is_dir())
    print(f"已复制 profiles/ → dist/profiles/（{count} 个配置集，exe 从同级 profiles 目录外置读取）")


def build() -> int:
    if not check_pyinstaller():
        return 2
    system = platform.system()
    print(f"当前构建平台：{system}（PyInstaller 只能打包当前系统，不能交叉编译）")
    if not ensure_web_build():
        return 3
    code = run([sys.executable, "-m", "PyInstaller",
                "atcdbg.spec", "--noconfirm", "--clean"], cwd=str(ROOT))
    if code != 0:
        print("打包失败")
        return code
    copy_profiles()
    out = DIST / exe_name()
    print("=" * 60)
    if out.exists():
        size_mb = out.stat().st_size / 1048576
        print(f"打包完成（单文件版）：{out}  ({size_mb:.1f} MB)")
        print("单文件可直接移动/分发；首次启动需解压到临时目录，稍慢属正常。")
    else:
        print(f"打包完成，但未找到预期产物：{out}")
        print("dist/ 内容：")
        for p in DIST.iterdir():
            print("  ", p)
    print("=" * 60)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="AT指令调试台 构建脚本")
    parser.add_argument("--clean", action="store_true", help="清理产物")
    parser.add_argument("--check", action="store_true", help="运行自检")
    args = parser.parse_args()

    if args.clean:
        clean()
        return 0
    if args.check:
        return subprocess.call([sys.executable, "main.py", "--selftest"])
    return build()


if __name__ == "__main__":
    sys.exit(main())
