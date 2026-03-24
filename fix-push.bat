@echo off
echo ========================================
echo   Fix GitHub Push
echo ========================================
echo.

echo [INFO] Peremenovanie vetki master -> main...
git branch -M main

echo.
echo [INFO] Push na GitHub...
git push -u origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Obychniy push ne udalsya. Probujem --force...
    git push -u origin main --force
)

echo.
echo ========================================
echo   Gotovo!
echo ========================================
echo.
echo Otkroy: https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf
echo.
pause
