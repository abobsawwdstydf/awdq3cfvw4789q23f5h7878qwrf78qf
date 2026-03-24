@echo off
REM ============================================
REM Nexo Messenger - Render Deploy (Pure Node.js)
REM ============================================

echo.
echo ========================================
echo   Nexo Messenger - Render Deploy
echo   Pure Node.js (bez TypeScript)
echo ========================================
echo.

REM Check git
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git ne naiden! Ustanovite Git.
    pause
    exit /b 1
)

echo [INFO] Proverka .env...
if not exist ".env" (
    echo [WARNING] .env ne naiden! Sozdajte .env iz .env.example
)

echo.
echo [INFO] Proverka .git...
if not exist ".git" (
    git init
    echo [OK] Git inicializirovan
)

echo.
echo [INFO] Dobavlenie failov...
git add .

echo.
set /p COMMIT_MSG="Vvedite soobschenie kommita: "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update Nexo Messenger

git commit -m "%COMMIT_MSG%"

echo.
echo [INFO] Push na GitHub...
git push -u origin main
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Push ne udalsya. Proverьте GitHub.
) else (
    echo [SUCCESS] Zagruzeno na GitHub!
    echo.
    echo Sleduyushie shagi:
    echo 1. Zaidi na https://render.com
    echo 2. Sozday Web Service
    echo 3. Podklyuchi repository: awdq3cfvw4789q23f5h7878qwrf78qf
    echo 4. Root Directory: render-server
    echo 5. Build: npm install ^&^& npx prisma generate
    echo 6. Start: node server.js
    echo 7. Dobav .env peremennye
    echo 8. Deploy!
)

echo.
echo ========================================
echo   Gotovo!
echo ========================================
echo.
pause
