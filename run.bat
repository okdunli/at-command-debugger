@echo off
setlocal
set PY=C:\Program Files\PyManager\python.exe
if exist "%~dp0.venv\Scripts\python.exe" set PY=%~dp0.venv\Scripts\python.exe
cd /d "%~dp0"
"%PY%" main.py %*
if errorlevel 1 pause
endlocal
