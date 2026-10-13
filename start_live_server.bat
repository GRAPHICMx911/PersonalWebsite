@echo off
title Personal Website - Live Server Launcher
echo ========================================================
echo   Starting FastAPI Server and Cloudflare Live Tunnel
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend Server on port 8000...
start "Backend Uvicorn Server" cmd /k "venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"

ping 127.0.0.1 -n 3 >nul

echo [2/2] Launching Cloudflare Tunnel...
start "Cloudflare Live Tunnel" cmd /k "tools\cloudflared.exe tunnel --url http://127.0.0.1:8000"

echo.
echo Both services are now running in their own windows!
echo Check the Cloudflare window to see your live https://*.trycloudflare.com URL.
echo.
pause
