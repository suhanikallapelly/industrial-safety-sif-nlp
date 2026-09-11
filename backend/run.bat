@echo off
title OIL SIF Backend
cd /d %~dp0
echo Starting FastAPI Backend on http://127.0.0.1:8001 ...
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
) else (
    py -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
)
pause
