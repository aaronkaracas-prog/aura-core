param(
  [Parameter(Mandatory=$true)][string]$HostName
)

$ErrorActionPreference = "Stop"

$root = "C:\Users\Aaron Karacas\aura-worker\aura"
$ops  = Join-Path $root "ops\mutation"
$bridgePath  = Join-Path $ops "AURA_MUTATION_BRIDGE_V1.ps1"

function Invoke-Aura([string]$payloadPath) {
  curl.exe -s `
    -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" `
    --data-binary "@$payloadPath" `
    https://auras.guide/chat
}

function Get-PayloadFromReply($respObj, [string]$cmdPrefix) {
  if ($null -eq $respObj) { return $null }
  $r = $respObj.reply
  if ($r -is [System.Array]) {
    foreach ($item in $r) {
      if ($item.cmd -and $item.cmd.StartsWith($cmdPrefix)) { return $item.payload }
    }
    return $null
  }
  return $r
}

if (-not (Test-Path $bridgePath)) { Write-Output "BRIDGE_MISSING"; exit 1 }

# ---- GET INDEX ----
$idxGetPath = Join-Path $ops "IDX_GET.txt"
@"
HOST $HostName
REGISTRY_GET config mutation_plan.index.v1
"@ | Set-Content -Encoding utf8 $idxGetPath

$idxObj = (Invoke-Aura $idxGetPath) | ConvertFrom-Json
$idxPayload = Get-PayloadFromReply $idxObj "REGISTRY_GET config mutation_plan.index.v1"
if (-not $idxPayload -or -not $idxPayload.index) { Write-Output "NO_INDEX"; exit 0 }

$plans = $idxPayload.index
if (-not $plans -or $plans.Count -eq 0) { Write-Output "NO_PENDING_PLANS"; exit 0 }

# ---- FIND FIRST PENDING ----
$pendingPlanId = $null
$pendingPlan   = $null

foreach ($planIdCur in $plans) {
  $planGetPath = Join-Path $ops "PLAN_GET.txt"
@"
HOST $HostName
REGISTRY_GET config $planIdCur
"@ | Set-Content -Encoding utf8 $planGetPath

  $planObj = (Invoke-Aura $planGetPath) | ConvertFrom-Json
  $planPayload = Get-PayloadFromReply $planObj "REGISTRY_GET config $planIdCur"

  if ($planPayload -and $planPayload.status -eq "PENDING") {
    $pendingPlanId = $planIdCur
    $pendingPlan   = $planPayload
    break
  }
}

if (-not $pendingPlanId) { Write-Output "NO_PENDING_PLANS"; exit 0 }

# ---- EXECUTE VIA BRIDGE (PatchFile only) ----
$patchFile = $pendingPlan.patch_file

$bridgeResult = & $bridgePath -PatchFile $patchFile

$applied = ($bridgeResult -match "MUTATION_SUCCESS") -or ($bridgeResult -match "BUILD_ADVANCED") -or ($bridgeResult -match "DRY_RUN_OK")
if ($applied) { $resultWord = "APPLIED" } else { $resultWord = "FAILED" }

# ---- SHOW_BUILD ----
$showBuildPath = Join-Path $ops "SHOW_BUILD.txt"
@"
HOST $HostName
SHOW_BUILD
"@ | Set-Content -Encoding utf8 $showBuildPath

$buildObj = (Invoke-Aura $showBuildPath) | ConvertFrom-Json
$buildPayload = Get-PayloadFromReply $buildObj "SHOW_BUILD"
$buildNow = $buildPayload.build
$stampNow = $buildPayload.stamp

# ---- WRITE RECEIPT ----
$receipt = @{
  id            = $pendingPlanId
  status        = $resultWord
  applied       = $applied
  build         = $buildNow
  stamp         = $stampNow
  patch_file    = $patchFile
  bridge_output = $bridgeResult
  executed_at   = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 8 -Compress

$planPutPath = Join-Path $ops "PLAN_PUT.txt"
@"
HOST $HostName
REGISTRY_PUT config $receipt
"@ | Set-Content -Encoding utf8 $planPutPath

Invoke-Aura $planPutPath | Out-Null

# ---- EXECL0G APPEND (registry) ----
$logLine = "$(Get-Date -Format o) $pendingPlanId $resultWord $buildNow"

$logGetPath = Join-Path $ops "EXECL0G_GET.txt"
@"
HOST $HostName
REGISTRY_GET config mutation_plan.execlog.v1
"@ | Set-Content -Encoding utf8 $logGetPath

$logObj = (Invoke-Aura $logGetPath) | ConvertFrom-Json
$logPayload = Get-PayloadFromReply $logObj "REGISTRY_GET config mutation_plan.execlog.v1"

$lines = @()
if ($logPayload -and $logPayload -ne "MISSING" -and $logPayload.lines) {
  $lines = @($logPayload.lines)
}

$lines = $lines + @($logLine)

$execlogPut = @{
  id = "mutation_plan.execlog.v1"
  lines = $lines
  updated_at = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 8 -Compress

$logPutPath = Join-Path $ops "EXECL0G_PUT.txt"
@"
HOST $HostName
REGISTRY_PUT config $execlogPut
"@ | Set-Content -Encoding utf8 $logPutPath

Invoke-Aura $logPutPath | Out-Null

Write-Output "EXECUTED_$resultWord"
