# keep-uvicorn.ps1 - simple restart-on-crash loop (development)
$venv = "$PSScriptRoot\.venv312\Scripts\Activate.ps1"
$entry = "backend.app.main:app"
$uvicornHost = "127.0.0.1"
$port = "8000"

while ($true) {
    try {
        Write-Host "Activating venv and starting uvicorn..."
        & $venv
        python -m uvicorn $entry --host $uvicornHost --port $port
        Write-Host "uvicorn exited with code $LASTEXITCODE at $(Get-Date). Restarting in 2s..."
    } catch {
        Write-Host "Error launching uvicorn: $_"
    }
    Start-Sleep -Seconds 2
}