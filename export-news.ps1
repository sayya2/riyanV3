# Export News Script for PowerShell
# Sets environment variables and runs export

Write-Host "Setting environment variables..." -ForegroundColor Yellow

$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3310"
$env:DB_USER="user"
$env:DB_PASSWORD="Riyanitaccess@26+"
$env:DB_NAME="riyan_nextjs"
$env:DIRECTUS_URL="http://127.0.0.1:8055"

Write-Host "Exporting all published news..." -ForegroundColor Cyan
npm run export:news:published

Write-Host ""
Write-Host "Export complete! Check the exports/ folder for the CSV file." -ForegroundColor Green
