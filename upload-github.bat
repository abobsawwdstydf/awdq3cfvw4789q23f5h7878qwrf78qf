@echo off
echo ========================================
echo   Nexo Messenger - GitHub Upload
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git ne naiden!
    echo Ustanovite Git: https://git-scm.com/
    pause
    exit /b 1
)

echo [INFO] Proverka .git...
if not exist ".git" (
    echo [INFO] Inicializatsiya Git...
    git init
    echo [OK] Git inicializirovan
)

echo.
echo [INFO] Proverka remote...
git remote get-url origin >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [INFO] Dobavlenie remote origin...
    git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
    echo [OK] Remote dobavlen
) else (
    echo [OK] Remote uzhe suschestvuet
)

echo.
echo [INFO] Tekushchaya vetka:
git branch

echo.
echo [INFO] Dobavlenie vsekh faylov...
git add .

echo.
set /p COMMIT_MSG="Vvedite soobschenie kommita (Enter dlya 'Update'): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update Nexo Messenger - Ultra Secure

git commit -m "%COMMIT_MSG%"

echo.
echo [INFO] Push na GitHub...
echo URL: https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf
echo.

git push -u origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Push ne udalsya!
    echo.
    echo Vozmozhnye prichiny:
    echo 1. Vy ne avtorizovany v GitHub
    echo 2. Net dostupa k repozitoriyu
    echo.
    echo Reshenie:
    echo git push -u origin main --force
    echo.
) else (
    echo.
    echo [SUCCESS] Zagruzeno na GitHub!
    echo.
    echo Otkroy: https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf
)

echo.
echo ========================================
echo   Gotovo!
echo ========================================
pause
