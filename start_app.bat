@echo off
title OIL SIF HSSE Safety Platform
color 0B
echo =================================================================
echo   STARTING OIL SIF HSSE SAFETY CHECKER PLATFORM
echo =================================================================
echo.
set ROOT=%~dp0
echo Starting FastAPI Backend on Port 8001...
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start "OIL SIF Backend" /min cmd /c "cd /d "%ROOT%backend" && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"
) else (
    start "OIL SIF Backend" /min cmd /c "cd /d "%ROOT%backend" && py -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"
)

cd /d "%ROOT%frontend"
echo Launching your browser to http://localhost:3000 in background...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"
echo Starting Dev Server on http://localhost:3000 ...
node "node_modules\next\dist\bin\next" dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo Direct node launch failed, trying npm run dev...
    npm run dev
)
pause
