# Исправление prisma/schema.prisma
$content = Get-Content 'prisma\schema.prisma' -Raw
$content = $content -replace '@default\(auto\(\)\)', '@default(uuid())'
Set-Content 'prisma\schema.prisma' $content

# Исправление apps/server/prisma/schema.prisma
if (Test-Path 'apps\server\prisma\schema.prisma') {
    $content = Get-Content 'apps\server\prisma\schema.prisma' -Raw
    $content = $content -replace '@default\(auto\(\)\)', '@default(uuid())'
    Set-Content 'apps\server\prisma\schema.prisma' $content
}

# Исправление render-server/prisma/schema.prisma
if (Test-Path 'render-server\prisma\schema.prisma') {
    $content = Get-Content 'render-server\prisma\schema.prisma' -Raw
    $content = $content -replace '@default\(auto\(\)\)', '@default(uuid())'
    Set-Content 'render-server\prisma\schema.prisma' $content
}

Write-Host "Done!"
