@echo off
chcp 65001 >nul
title Money Guru - Deploiement prod
echo.
echo  Build de l'image et demarrage du conteneur...
echo.
docker compose up -d --build
if errorlevel 1 goto :echec
echo.
echo  PROD : http://localhost:6112
echo.
pause
exit /b 0
:echec
echo.
echo  [ERREUR] Le deploiement a echoue. Verifiez que Docker Desktop tourne.
echo.
pause
exit /b 1
