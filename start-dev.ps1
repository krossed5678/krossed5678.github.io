# Build frontend and start backend (PowerShell)
# Usage: ./start-dev.ps1

$ErrorActionPreference = 'Stop'

Write-Host "Checking for Node.js..."
try {
    node -v | Out-Null
} catch {
    Write-Host "Node.js not found in PATH. Please install Node.js (https://nodejs.org/) and try again." -ForegroundColor Red
    exit 1
}

# Build frontend
Push-Location -Path "frontend"
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing frontend npm dependencies..."
    npm install
}
Write-Host "Building frontend..."
npm run build
Pop-Location

# Start backend (use uvicorn)
Write-Host "Starting backend (uvicorn)..."
# Use python from PATH; ensure your Python 3.13 venv is activated if needed
$uvicornArgs = "backend.app.main:app --reload --host 127.0.0.1 --port 8000"
Write-Host "Run: uvicorn $uvicornArgs"
uvicorn $uvicornArgs
