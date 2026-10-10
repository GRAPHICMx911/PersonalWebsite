@echo off
title Personal Website & CMS Server
echo ===================================================
echo Starting Personal Global Website & CMS Platform...
echo ===================================================
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Server running at http://127.0.0.1:8000
echo Public Site:    http://127.0.0.1:8000/
echo Admin CMS:      http://127.0.0.1:8000/admin/login.html
echo API Docs:       http://127.0.0.1:8000/docs
echo ===================================================
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
