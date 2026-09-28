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
    for d in (DIST, BUILD):
        if d.exists():
            shutil.rmtree(d, ignore_errors=True)
            print("已清理", d)


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
