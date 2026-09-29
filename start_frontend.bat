@echo off
echo ===================================================
echo  Starting Smart Hospital Management Frontend...
echo ===================================================
cd /d "%~dp0frontend"
start http://127.0.0.1:3000
python serve.py
pause
