@echo off
chcp 65001 >nul
title Money Guru - Demarrage
echo.
echo  ============================================================
echo   Money Guru - demarrage complet
echo  ============================================================
echo.
echo [1/3] Prod Docker 6110 - optionnel...
where docker >nul 2>&1 && if exist "%~dp0docker-compose.yml" docker compose up -d >nul 2>&1
echo [2/3] Backend dev 3010 - si present...
if exist "%~dp0server\package.json" start "Money Guru BACKEND 3010" cmd /k "cd /d "%~dp0server" && npm run dev"
echo [3/3] Frontend dev 6010...
start "Money Guru VITE 6010" cmd /k "cd /d "%~dp0ui" && npm run dev"
echo.
echo  DEV  : http://localhost:6010
echo  Arret : .\stop-all.bat
echo.
timeout /t 4 /nobreak >nul
start "" "http://localhost:6010"
exit /b 0
