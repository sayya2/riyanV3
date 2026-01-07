# Import Projects Script for PowerShell
# Sets environment variables and runs import

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,

    [switch]$DryRun
)

Write-Host "Setting environment variables..." -ForegroundColor Yellow

$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3310"
$env:DB_USER="user"
$env:DB_PASSWORD="Riyanitaccess@26+"
$env:DB_NAME="riyan_nextjs"
$env:DIRECTUS_URL="http://127.0.0.1:8055"

if ($DryRun) {
    Write-Host "Running DRY RUN (no database changes)..." -ForegroundColor Cyan
    npm run import:projects:dry -- --file $FilePath
} else {
    Write-Host "Running LIVE IMPORT (will modify database)..." -ForegroundColor Red
    Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    npm run import:projects -- --file $FilePath
}
