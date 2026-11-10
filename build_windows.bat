@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   AT Command Debugger - Windows build (single-file)
echo ============================================
where python >nul 2>nul
if errorlevel 1 (
  echo Python not found. Install Python 3.9+ and add it to PATH, then retry.
  pause
  exit /b 1
)
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Dependency install failed.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm not found. The frozen app needs the web build in dist. Install Node.js.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 (
  echo Dependency install failed.
  pause
  exit /b 1
)
call npm run build
if errorlevel 1 (
  echo Web build failed. Cannot package.
  pause
  exit /b 1
)
python build.py
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)
echo Done. Output is in dist as a single-file .exe, portable.
pause
