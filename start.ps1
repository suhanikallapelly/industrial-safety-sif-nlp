Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "           OIL INDIA LIMITED - SIF PRECURSOR AI PLATFORM" -ForegroundColor Cyan
Write-Host "              Real BERT NLP Engine & Bento Grid Interface" -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

$root = $PSScriptRoot
$pyCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } elseif (Get-Command py -ErrorAction SilentlyContinue) { "py" } else { "C:\Users\Garim\AppData\Local\Programs\Python\Python312\python.exe" }

Write-Host "[1/2] Starting FastAPI Backend on Port 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; & '$pyCmd' -m uvicorn main:app --reload --host 127.0.0.1 --port 8001"

Write-Host "[2/2] Starting Next.js Frontend on Port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; node node_modules\next\dist\bin\next dev"

Write-Host "Platform launched successfully!" -ForegroundColor Green
Write-Host " - Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host " - Backend:  http://127.0.0.1:8001/docs" -ForegroundColor Cyan
Write-Host "Opening browser in 3 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
Write-Host "===============================================================================" -ForegroundColor Green
