@echo off
title OIL SIF Precursor Detection Platform
color 0A
echo ===============================================================================
echo            OIL INDIA LIMITED - SIF PRECURSOR AI PLATFORM
echo                Safety Checker - Incident Records Platform
echo ===============================================================================
echo.

cd /d "%~dp0frontend"

echo Starting Next.js Dev Server at http://localhost:3000 ...
echo.

node "node_modules\next\dist\bin\next" dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo Node direct launch failed, attempting npm run dev...
    npm run dev
)

pause
