@echo off
echo ========================================
echo   Fix Prisma Schema
echo ========================================
echo.

echo [INFO] Sozdanie papki prisma v korne...
if not exist "prisma" mkdir prisma

echo.
echo [INFO] Kopirovanie schema.prisma...
copy /Y "apps\server\prisma\schema.prisma" "prisma\schema.prisma"

echo.
echo [INFO] Dobavlenie v git...
git add prisma/schema.prisma

echo.
git commit -m "Add prisma schema to root for Render"

echo.
echo [INFO] Push na GitHub...
git push

echo.
echo ========================================
echo   Gotovo!
echo ========================================
echo.
pause
