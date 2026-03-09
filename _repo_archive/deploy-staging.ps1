# deploy-staging.ps1
# Sends the prepared staging payload to aura-deployer (/deploy)
# Uses known-good auth header first, with safe fallbacks.
# Permanent, non-interactive, no noise.

$ErrorActionPreference = "Stop"

$HERE = Split-Path -Parent $MyInvocation.MyCommand.Path
$PAYLOAD = Join-Path $HERE "deploy_payload_real_staging.json"

if (-not (Test-Path $PAYLOAD)) {
  throw "deploy_payload_real_staging.json not found. Run make-staging-payload.ps1 first."
}

$DEPLOYER_URL = "https://aura-deployer.aaronkaracas.workers.dev/deploy"

$DEPLOY_SECRET = $env:DEPLOY_SECRET
if ([string]::IsNullOrWhiteSpace($DEPLOY_SECRET)) {
  throw "DEPLOY_SECRET is not set in the environment."
}

# Known-good header first (no unauthorized noise)
$attempts = @(
  @{ Name = "X-DEPLOY-KEY";    Value = $DEPLOY_SECRET },
  @{ Name = "X-DEPLOY-SECRET"; Value = $DEPLOY_SECRET },
  @{ Name = "Authorization";   Value = ("Bearer " + $DEPLOY_SECRET) }
)

Write-Host "Deploying staging payload..."
Write-Host "Endpoint: $DEPLOYER_URL"
Write-Host "Payload:  $PAYLOAD"
Write-Host ""

foreach ($a in $attempts) {
  $hName = $a.Name
  $hVal  = $a.Value
  $header = "${hName}: ${hVal}"

  $resp = curl.exe -s -X POST "$DEPLOYER_URL" `
    -H "Content-Type: application/json" `
    -H $header `
    --data-binary "@$PAYLOAD"

  if ($resp -match '"ok"\s*:\s*true') {
    $resp
    exit 0
  }
}

throw "Deploy failed: all auth header attempts rejected."
