Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  STARTING OIL SIF HSSE SAFETY CHECKER PLATFORM" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
Set-Location -Path "$PSScriptRoot\frontend"
Write-Host "Launching Next.js Dev Server at http://localhost:3000 ..." -ForegroundColor Green
npm run dev
