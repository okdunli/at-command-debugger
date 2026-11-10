#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ "$(uname -s)" != "Linux" ]; then
  echo "ERROR: this script must run on Linux."
  echo "PyInstaller cannot cross-compile - it only builds for the OS it runs on."
  echo "On Windows use build_windows.bat instead."
  exit 1
fi
# pywebview 在 Linux 上走 GTK/WebKitGTK：需要系统包
#   sudo apt install python3-gi gir1.2-webkit2-4.1
echo "============================================"
echo "  AT指令调试台 - Linux 打包（单文件版）"
echo "============================================"
python3 -m pip install -r requirements.txt
npm run build
python3 build.py
echo "打包完成：dist/AT指令调试台（单文件，可任意移动分发）"
