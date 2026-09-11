@echo off
title OIL SIF Frontend
cd /d %~dp0
echo Starting Next.js Bento Frontend on http://localhost:3000 ...
node node_modules\next\dist\bin\next dev
pause
