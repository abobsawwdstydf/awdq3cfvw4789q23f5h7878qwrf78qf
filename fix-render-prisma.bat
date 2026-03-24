@echo off
echo ========================================
echo   Fix Render Prisma
echo ========================================
echo.

echo [INFO] Sozdanie papki prisma v render-server...
if not exist "render-server\prisma" mkdir render-server\prisma

echo.
echo [INFO] Kopirovanie schema.prisma...
copy /Y "apps\server\prisma\schema.prisma" "render-server\prisma\schema.prisma"

echo.
echo [INFO] Dobavlenie v git...
git add render-server/prisma/schema.prisma

echo.
git commit -m "Fix prisma schema for Render"

echo.
echo [INFO] Push na GitHub...
git push

echo.
echo ========================================
echo   Gotovo! Render peresoberetsya!
echo ========================================
echo.
pause
