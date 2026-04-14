@echo off
title ES TURBO - WhatsApp Marketing Automation
color 0A

echo.
echo ========================================
echo    ES TURBO - Iniciando Servidores
echo ========================================
echo.
echo Pressione CTRL+C para parar os servidores
echo.
echo Iniciando Backend (Node.js)...
echo Frontend estara disponivel em: http://localhost:5173
echo Backend API em: http://localhost:5000
echo.
echo ========================================
echo.

cd "%~dp0"
start "ES TURBO Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "ES TURBO Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servidores iniciados em janelas separadas!
echo Feche esta janela quando terminar.
echo.
pause
