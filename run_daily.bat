@echo off
chcp 65001 > nul
echo =======================================================
echo  Portal Um Futuro Proximo - Ingestao Diaria de Noticias
echo =======================================================
echo.

cd /d "%~dp0"

echo [1/3] Verificando ambiente Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado no PATH do sistema.
    pause
    exit /b 1
)

echo [2/3] Executando pipeline (Sheets -^> Ollama -^> Supabase)...
python main_supabase.py run

if %errorlevel% equ 0 (
    echo.
    echo [3/3] Sucesso! As noticias foram processadas e estao online no portal.
) else (
    echo.
    echo [ERRO] Ocorreu uma falha durante a execucao do pipeline. Verifique os logs na pasta 'logs/'.
)

echo.
echo =======================================================
timeout /t 5
