@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   AT指令调试台 - Windows 打包（单文件版）
echo ============================================
where python >nul 2>nul
if errorlevel 1 (
  echo 未找到 python，请先安装 Python 3.9+ 并加入 PATH。
  pause
  exit /b 1
)
python -m pip install -r requirements.txt
python build.py
if errorlevel 1 (
  echo 打包失败！
  pause
  exit /b 1
)
echo 打包完成：dist\AT指令调试台.exe（单文件，可任意移动分发）
pause
