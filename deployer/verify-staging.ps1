# verify-staging.ps1
# Confirms aura-core-staging health endpoint

$ErrorActionPreference = "Stop"

$STAGING_HEALTH = "https://aura-core-staging.aaronkaracas.workers.dev/health"

Write-Host "Verifying staging health..."
Write-Host "GET $STAGING_HEALTH"
Write-Host ""

curl.exe -s "$STAGING_HEALTH"

Write-Host ""
Write-Host "Health check complete."
