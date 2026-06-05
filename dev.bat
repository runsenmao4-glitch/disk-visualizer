@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Please install Node.js 20 or newer.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

start "Disk Visualizer API" cmd /k "cd /d %~dp0 && npm run server"
start "" http://127.0.0.1:5173
npm run dev
goto :eof

:error
echo Failed to start dev mode.
pause
exit /b 1
