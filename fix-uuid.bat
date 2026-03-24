@echo off
echo ========================================
echo   Fix Prisma Schema - PostgreSQL UUID
echo ========================================
echo.

echo [INFO] Ispravlenie osibok v sheme...

REM Заменяем genRandomString(16) и auto() на uuid() для PostgreSQL
powershell -Command "(Get-Content 'prisma\schema.prisma') -replace 'genRandomString\\(16\\)', 'uuid()' -replace '@default\\(auto\\(\\)\\)', '@default(uuid())' | Set-Content 'prisma\schema_fixed.prisma'"
move /Y "prisma\schema_fixed.prisma" "prisma\schema.prisma"

echo.
echo [INFO] Takzhe ispravlyaem v apps/server/prisma/...
powershell -Command "(Get-Content 'apps\server\prisma\schema.prisma') -replace 'genRandomString\\(16\\)', 'uuid()' -replace '@default\\(auto\\(\\)\\)', '@default(uuid())' | Set-Content 'apps\server\prisma\schema_fixed.prisma'"
move /Y "apps\server\prisma\schema_fixed.prisma" "apps\server\prisma\schema.prisma"

echo.
echo [INFO] Takzhe ispravlyaem v render-server/prisma/...
if exist "render-server\prisma\schema.prisma" (
    powershell -Command "(Get-Content 'render-server\prisma\schema.prisma') -replace 'genRandomString\\(16\\)', 'uuid()' -replace '@default\\(auto\\(\\)\\)', '@default(uuid())' | Set-Content 'render-server\prisma\schema_fixed.prisma'"
    move /Y "render-server\prisma\schema_fixed.prisma" "render-server\prisma\schema.prisma"
)

echo.
echo [INFO] Dobavlenie v git...
git add prisma/schema.prisma apps/server/prisma/schema.prisma render-server/prisma/schema.prisma

echo.
git commit -m "Fix: use uuid() for PostgreSQL"

echo.
echo [INFO] Push na GitHub...
git push

echo.
echo ========================================
echo   Gotovo!
echo ========================================
echo.
pause
