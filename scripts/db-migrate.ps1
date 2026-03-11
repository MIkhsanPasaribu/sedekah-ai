# Script untuk migrate menggunakan direct connection (port 5432)
# Bypass pooler untuk operasi schema/migration

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$' -and -not $_.StartsWith('#')) {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove surrounding quotes if present
            if ($value -match '^"(.*)"$') {
                $value = $matches[1]
            }
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "📄 Loaded .env file" -ForegroundColor Gray
} else {
    Write-Error "❌ .env file tidak ditemukan"
    exit 1
}

if (-not $env:DIRECT_URL) {
    Write-Error "❌ DIRECT_URL environment variable tidak ditemukan di .env"
    Write-Host "Pastikan DIRECT_URL sudah diset ke direct connection (port 5432)"
    exit 1
}

Write-Host "🔄 Running Prisma Migrate with Direct Connection..." -ForegroundColor Cyan

# Override DATABASE_URL with DIRECT_URL for schema operations
$env:DATABASE_URL = $env:DIRECT_URL

npx prisma migrate dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Error "❌ Migration failed"
    exit 1
}
