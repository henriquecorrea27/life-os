@echo off
rem Launcher do Windows: sobe o servidor e abre o app no Chrome.
rem Aponte um atalho (.lnk) para este arquivo com icone logo/logo.ico -
rem .bat sozinho nao aceita icone customizado, o atalho e' o jeito certo.
rem Caminhos abaixo sao fixos para esta maquina/usuario (henri).
setlocal EnableDelayedExpansion
title Life OS

set "PROJECT_DIR=C:\Users\henri\Documents\todo_journal"
set "URL=http://localhost:3000"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"

cd /d "%PROJECT_DIR%"
if errorlevel 1 (
  echo Nao encontrei a pasta do projeto em: %PROJECT_DIR%
  pause
  exit /b 1
)

rem Se o servidor ja estiver rodando (de uma vez anterior que voce nao fechou),
rem so abre o navegador de novo - evita subir um segundo servidor duplicado.
curl -s -o nul "%URL%"
if not errorlevel 1 (
  echo O Life OS ja estava rodando. Abrindo no Chrome...
  goto open_browser
)

if not exist "node_modules" (
  echo Primeira vez rodando aqui - instalando dependencias, pode levar um tempinho...
  call npm install
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  call npm run setup
)

rem "npm run app" roda em modo producao, recompilando so quando o codigo muda.
rem Em modo dev o Next compila cada tela na primeira visita, e o clique demorava
rem de 0,8 a 1,9 segundo em vez dos ~50 ms de producao.
echo Iniciando o servidor do Life OS...
start "Life OS - servidor (feche esta janela para PARAR o app)" cmd /k npm run app

echo Aguardando o servidor subir em %URL% ...
set /a tentativas=0
echo (se o codigo mudou, a primeira vez compila e leva alguns segundos a mais)

:wait_loop
set /a tentativas+=1
curl -s -o nul "%URL%"
if not errorlevel 1 goto open_browser
if !tentativas! GEQ 180 (
  echo O servidor esta demorando mais que o normal, vou abrir o navegador mesmo assim...
  goto open_browser
)
timeout /t 1 /nobreak >nul
goto wait_loop

:open_browser
if exist "%CHROME%" (
  start "" "%CHROME%" "%URL%"
) else (
  start "" "%URL%"
)

exit /b 0
