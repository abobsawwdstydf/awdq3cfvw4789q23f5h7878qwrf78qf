@echo off
echo ========================================
echo   Fix Prisma Schema - genRandomString
echo ========================================
echo.

echo [INFO] Ispravlenie osibok v sheme...

REM Создаём временный файл
set TEMP_FILE=prisma\schema_fixed.prisma

REM Копируем схему с заменой genRandomString(16) на auto()
powershell -Command "(Get-Content 'prisma\schema.prisma') -replace 'genRandomString\(16\)', 'auto()' | Set-Content 'prisma\schema_fixed.prisma'"

REM Заменяем оригинал
move /Y "prisma\schema_fixed.prisma" "prisma\schema.prisma"

echo.
echo [INFO] Takzhe ispravlyaem v apps/server/prisma/...
powershell -Command "(Get-Content 'apps\server\prisma\schema.prisma') -replace 'genRandomString\(16\)', 'auto()' | Set-Content 'apps\server\prisma\schema_fixed.prisma'"
move /Y "apps\server\prisma\schema_fixed.prisma" "apps\server\prisma\schema.prisma"

echo.
echo [INFO] Takzhe ispravlyaem v render-server/prisma/...
if exist "render-server\prisma\schema.prisma" (
    powershell -Command "(Get-Content 'render-server\prisma\schema.prisma') -replace 'genRandomString\(16\)', 'auto()' | Set-Content 'render-server\prisma\schema_fixed.prisma'"
    move /Y "render-server\prisma\schema_fixed.prisma" "render-server\prisma\schema.prisma"
)

echo.
echo [INFO] Dobavlenie v git...
git add prisma/schema.prisma apps/server/prisma/schema.prisma render-server/prisma/schema.prisma

echo.
git commit -m "Fix: replace genRandomString with auto()"

echo.
echo [INFO] Push na GitHub...
git push

echo.
echo ========================================
echo   Gotovo!
echo ========================================
echo.
pause
