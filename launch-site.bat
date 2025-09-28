@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ==== Path settings ====
set "VENV=%~dp0.venv312\Scripts\python.exe"
set "UvicornArgs=-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

REM ==== Python fallback ====
if not exist "%VENV%" (
  echo .venv312 python not found, falling back to system python
  set "VENV=python"
)

REM ==== Logging ====
set "LOGFILE=%~dp0launch-site.log"
echo ---------------- %DATE% %TIME% >> "%LOGFILE%"
echo Launch args: %* >> "%LOGFILE%"

REM ==== Optional protocol arg ====
if not "%~1"=="" (
  echo Invoked with protocol arg: %~1 >> "%LOGFILE%"
)

echo Starting backend (using %VENV%) ...

REM ==== Check if uvicorn already running ====
tasklist /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq uvicorn" | find /I "python.exe" >nul
if %ERRORLEVEL% EQU 0 (
  echo Uvicorn already running >> "%LOGFILE%"
  echo Uvicorn already running
) else (
  echo Starting uvicorn with %VENV% %UvicornArgs% >> "%LOGFILE%"
  start "uvicorn" "%VENV%" %UvicornArgs%
  echo Waiting for backend to start... >> "%LOGFILE%"
  echo Waiting for backend to start...
)

REM ==== Wait for health endpoint ====
set ATTEMPTS=0
:WAITLOOP
if %ATTEMPTS% GEQ 30 (
  echo Timeout waiting for backend.
  goto :OPENBROWSER
)

REM Use PowerShell instead of curl (more reliable on Windows)
for /f "usebackq" %%i in (`powershell -command "(Invoke-WebRequest -Uri http://127.0.0.1:8000/health -UseBasicParsing -TimeoutSec 2).StatusCode" 2^>nul`) do (
  if "%%i"=="200" (
    echo Backend is up.
    goto :OPENBROWSER
  )
)

REM Small delay before retry
ping -n 2 127.0.0.1 >nul
set /a ATTEMPTS+=1
goto :WAITLOOP

:OPENBROWSER
echo Opening browser to http://127.0.0.1:8000/
start "" "http://127.0.0.1:8000/"

endlocal
echo Done.