@echo off
"%~dp0backend\venv\Scripts\python.exe" "%~dp0scripts\launch_local.py" %*
exit /b %errorlevel%
