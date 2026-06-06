@echo off
cd /d "%~dp0"
echo Iniciando Masory Brothers System...
start http://localhost:3000
"C:\Program Files\nodejs\node.exe" backend/server.js
pause
