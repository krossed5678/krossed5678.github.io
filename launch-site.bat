@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM Path settings (adjust if you use a different venv name)
set VENV=%~dp0.venv312\Scripts\python.exe
set UvicornArgs=-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

REM If venv python not found, fall back to system python on PATH
if not exist "%VENV%" (
  echo .venv312 python not found, falling back to system python
  set VENV=python
)

REM Simple logging for troubleshooting
set LOGFILE=%~dp0\launch-site.log
echo ---------------- %DATE% %TIME% >> "%LOGFILE%"
echo Launch args: %* >> "%LOGFILE%"

REM Accept optional protocol argument (when launched via custom URL protocol)
set PROTO_ARG=%1
if defined PROTO_ARG (
  echo Invoked with protocol arg: %PROTO_ARG%
)

echo Starting backend (using %VENV%) ...
REM Start uvicorn if not already running
REM Try to find an existing uvicorn/python process already serving our app
set PID=
for /f "tokens=2 delims=," %%P in ('wmic process where "CommandLine like '%%uvicorn%%' or CommandLine like '%%backend.app.main:app%%'" get ProcessId /format:csv ^2^>nul') do (
  set PID=%%P
)
if defined PID (
  echo Uvicorn already running (PID=!PID!) >> "%LOGFILE%"
  echo Uvicorn already running (PID=!PID!)
) else (
  echo Starting uvicorn with %VENV% %UvicornArgs% >> "%LOGFILE%"
  start "uvicorn" "%VENV%" %UvicornArgs%
  echo Waiting for backend to start... >> "%LOGFILE%"
  echo Waiting for backend to start...
)

REM Wait for /health to return 200
set ATTEMPTS=0
:WAITLOOP
if %ATTEMPTS% geq 30 (
  echo Timeout waiting for backend.
  goto :OPENBROWSER
)
curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8000/health | findstr /b /c:"200" >nul
if %errorlevel% equ 0 (
  echo Backend is up.
  goto :OPENBROWSER
)
ping -n 2 127.0.0.1 >nul
set /a ATTEMPTS=%ATTEMPTS%+1
goto :WAITLOOP

:OPENBROWSER
echo Opening browser to http://127.0.0.1:8000/
start "" "http://127.0.0.1:8000/"

endlocal
