@echo off
title Personal Website - Live Server
echo ======================================================================
echo           Starting Personal Website + Cloudflare Live Tunnel
echo ======================================================================
echo.

echo [1/2] Starting FastAPI Backend (http://127.0.0.1:8000)...
start "FastAPI Backend Server" cmd /k "venv\Scripts\activate && python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 4 /nobreak >nul

echo [2/2] Starting Cloudflare Live HTTPS Tunnel...
start "Cloudflare Live Tunnel" cmd /k "tools\cloudflared.exe tunnel --url http://127.0.0.1:8000"

echo.
echo ======================================================================
echo  Both services launched in separate windows!
echo  - Look at the 'Cloudflare Live Tunnel' window to see your public URL.
echo  - Keep both windows open to keep your website live worldwide.
echo ======================================================================
echo.
pause
