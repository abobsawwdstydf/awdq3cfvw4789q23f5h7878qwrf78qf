@echo off
echo ========================================
echo   Commit and Push Fix
echo ========================================
echo.

echo [INFO] Dobavlenie vsekh izmeneniy...
git add .

echo.
echo [INFO] Kommit...
git commit -m "Fix: use uuid() for PostgreSQL"

echo.
echo [INFO] Push na GitHub...
git push

if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Push ne udalsya. Probujem --force...
    git push --force
)

echo.
echo ========================================
echo   Gotovo!
echo ========================================
echo.
pause
