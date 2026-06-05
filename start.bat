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

if not exist dist (
  echo Building app...
  call npm run build
  if errorlevel 1 goto :error
)

start "" http://127.0.0.1:8787
echo Disk Visualizer is running at http://127.0.0.1:8787
node dist-server/server/index.js
goto :eof

:error
echo Failed to start Disk Visualizer.
pause
exit /b 1
