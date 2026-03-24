@echo off
REM ============================================
REM Nexo Messenger - GitHub Deploy Script
REM ============================================

echo.
echo ========================================
echo   Nexo Messenger - GitHub Deploy
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git не найден! Установите Git с https://git-scm.com/
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] Файл .env не найден!
    echo Создайте .env файл на основе .env.example
    echo.
    pause
)

REM Initialize git if needed
if not exist ".git" (
    echo [INFO] Инициализация Git репозитория...
    git init
)

REM Check remote
git remote get-url origin >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [INFO] Добавьте remote origin:
    echo git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
    echo.
    set /p ADD_REMOTE="Добавить remote origin? (y/n): "
    if /i "%ADD_REMOTE%"=="y" (
        git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
    )
)

echo.
echo [INFO] Текущая ветка:
git branch

echo.
echo [INFO] Статус репозитория:
git status --short

echo.
set /p COMMIT_MSG="Введите сообщение коммита (Enter для 'Update'): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update

echo.
echo [INFO] Добавление файлов...
git add .

echo.
echo [INFO] Коммит...
git commit -m "%COMMIT_MSG%"

echo.
echo [INFO] Проверка удаленного репозитория...
git remote -v

echo.
set /p PUSH="Отправить изменения на GitHub? (y/n): "
if /i "%PUSH%"=="y" (
    echo.
    echo [INFO] Push на GitHub...
    git push -u origin main
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [WARNING] Не удалось выполнить push. Попробуйте вручную:
        echo git push -u origin main
    ) else (
        echo.
        echo [SUCCESS] Изменения отправлены на GitHub!
        echo GitHub Actions автоматически задеплоит изменения на Render.
    )
)

echo.
echo ========================================
echo   Готово!
echo ========================================
echo.
echo Следующие шаги:
echo 1. Проверьте репозиторий на GitHub
echo 2. Проверьте Actions tab для статуса деплоя
echo 3. Проверьте приложение на Render
echo.
pause
