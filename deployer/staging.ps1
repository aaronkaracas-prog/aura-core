# staging.ps1
# One-command staging workflow:
# 1) make payload
# 2) prompt for DEPLOY_SECRET (hidden) if not set
# 3) deploy (auto-detects auth header via deploy-staging.ps1)
# 4) verify

$ErrorActionPreference = "Stop"

$HERE = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== STAGING WORKFLOW START ==="
Write-Host "Folder: $HERE"
Write-Host ""

# 1) Build payload
& (Join-Path $HERE "make-staging-payload.ps1")

# 2) Ensure DEPLOY_SECRET for this session (hidden prompt)
if ([string]::IsNullOrWhiteSpace($env:DEPLOY_SECRET)) {
  $env:DEPLOY_SECRET = Read-Host "DEPLOY_SECRET" -AsSecureString | % {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($_)
    )
  }
}

# 3) Deploy
& (Join-Path $HERE "deploy-staging.ps1")

# 4) Verify
& (Join-Path $HERE "verify-staging.ps1")

Write-Host ""
Write-Host "=== STAGING WORKFLOW DONE ==="
