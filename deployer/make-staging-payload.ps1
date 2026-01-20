# make-staging-payload.ps1
# Purpose: Generate a clean, UTF-8 (no BOM) staging deploy payload for Aura Core
# Output: deploy_payload_real_staging.json
# Safe: No console output of bundle, no UI changes

$ErrorActionPreference = "Stop"

$root = "C:\Users\Aaron Karacas\aura-worker\aura"
$src  = Join-Path $root "src\index.js"
$out  = Join-Path $root "deployer\deploy_payload_real_staging.json"

if (!(Test-Path $src)) {
  throw "Aura Core source not found at $src"
}

# Read Aura Core as a literal string
$bundle = [string](Get-Content $src -Raw)

# Build payload (module worker)
$payload = @{
  script_name = "aura-core-staging"
  bundle      = $bundle
}

# Write JSON, UTF-8 no BOM
$json = $payload | ConvertTo-Json -Compress -Depth 5
[IO.File]::WriteAllText($out, $json, (New-Object Text.UTF8Encoding($false)))

Write-Host "OK: Wrote staging payload -> $out"
