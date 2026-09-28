#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ "$(uname -s)" != "Darwin" ]; then
  echo "ERROR: this script must run on macOS."
  echo "PyInstaller cannot cross-compile - it only builds for the OS it runs on."
  echo "On Windows use build_windows.bat instead."
  exit 1
fi
echo "============================================"
echo "  AT指令调试台 - macOS 打包（单文件版）"
echo "============================================"
python3 -m pip install -r requirements.txt
python3 build.py
echo "打包完成：dist/AT指令调试台（单文件，可任意移动分发）"
