@echo off
chcp 65001 >nul
title Money Guru - Arret
echo Arret Money Guru - ports 3012 6012 + conteneur Docker
for %%p in (3012 6012) do (
  for /f "tokens=5" %%i in ('netstat -aon ^| findstr ":%%p " ^| findstr "LISTENING"') do (
    echo   Kill port %%p PID %%i
    taskkill /F /PID %%i >nul 2>&1 ) )
if exist "%~dp0docker-compose.yml" docker compose stop
echo Termine.
pause
exit /b 0
