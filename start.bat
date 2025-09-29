@echo off
echo ========================================
echo Sistema de Consulta de Produtos
echo ========================================
echo.
echo Iniciando aplicacao...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao esta instalado!
    echo Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo.
echo Dependencias verificadas!
echo Iniciando servidor na porta 201...
echo.
echo Acesse: http://localhost:201
echo Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar a aplicação
npm start

pause
