param(
  [Parameter(Mandatory=$true)][string]$HostName
)

$ErrorActionPreference = "Stop"

$root = "C:\Users\Aaron Karacas\aura-worker\aura"
$ops  = Join-Path $root "ops\mutation"
$bridgePath  = Join-Path $ops "AURA_MUTATION_BRIDGE_V1.ps1"
$execlogPath = Join-Path $ops "mutation_execlog_v1.log"

function Invoke-Aura([string]$payloadPath) {
  curl.exe -s `
    -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" `
    --data-binary "@$payloadPath" `
    https://auras.guide/chat
}

function Get-PayloadFromReply($respObj, [string]$cmdPrefix) {
  # Aura /chat often returns: { ok:true, reply:[ {cmd:"...", payload:...} ] }
  if ($null -eq $respObj) { return $null }
  $r = $respObj.reply
  if ($r -is [System.Array]) {
    foreach ($item in $r) {
      if ($item.cmd -and $item.cmd.StartsWith($cmdPrefix)) { return $item.payload }
    }
    return $null
  }
  # fallback: single-object reply
  return $r
}

if (-not (Test-Path $bridgePath)) { Write-Output "BRIDGE_MISSING"; exit 1 }

# ---- GET INDEX ----
$idxPayloadPath = Join-Path $ops "IDX_GET.txt"
@"
HOST $HostName
REGISTRY_GET config mutation_plan.index.v1
"@ | Set-Content -Encoding utf8 $idxPayloadPath

$idxResp = Invoke-Aura $idxPayloadPath
$idxObj  = $idxResp | ConvertFrom-Json
$idxPayload = Get-PayloadFromReply $idxObj "REGISTRY_GET config mutation_plan.index.v1"

if (-not $idxPayload -or -not $idxPayload.index) { Write-Output "NO_INDEX"; exit 0 }

$plans = $idxPayload.index
if (-not $plans -or $plans.Count -eq 0) { Write-Output "NO_PENDING_PLANS"; exit 0 }

# ---- FIND FIRST PENDING ----
$pendingPlanId = $null
$pendingPlan = $null

foreach ($planIdCur in $plans) {

  $planPayloadPath = Join-Path $ops "PLAN_GET.txt"
@"
HOST $HostName
REGISTRY_GET config $planIdCur
"@ | Set-Content -Encoding utf8 $planPayloadPath

  $planResp = Invoke-Aura $planPayloadPath
  $planObj  = $planResp | ConvertFrom-Json
  $planPayload = Get-PayloadFromReply $planObj "REGISTRY_GET config $planIdCur"

  if ($planPayload -and $planPayload.status -eq "PENDING") {
    $pendingPlanId = $planIdCur
    $pendingPlan   = $planPayload
    break
  }
}

if (-not $pendingPlanId) { Write-Output "NO_PENDING_PLANS"; exit 0 }

# ---- EXECUTE VIA BRIDGE ----
$patchFile = $pendingPlan.patch_file
$search    = $pendingPlan.search
$replace   = $pendingPlan.replace

$bridgeResult = powershell.exe -ExecutionPolicy Bypass -File $bridgePath `
  -SearchPattern $search `
  -ReplaceWith $replace `
  -PatchFile $patchFile

$applied = ($bridgeResult -match "BUILD_ADVANCED")

if ($applied) { $resultWord = "APPLIED" } else { $resultWord = "FAILED" }

# ---- SHOW_BUILD ----
$buildPayloadPath = Join-Path $ops "SHOW_BUILD.txt"
@"
HOST $HostName
SHOW_BUILD
"@ | Set-Content -Encoding utf8 $buildPayloadPath

$buildResp = Invoke-Aura $buildPayloadPath
$buildObj  = $buildResp | ConvertFrom-Json
$buildPayload = Get-PayloadFromReply $buildObj "SHOW_BUILD"

$buildNow = $buildPayload.build
$stampNow = $buildPayload.stamp

# ---- WRITE RECEIPT (overwrite same plan id) ----
$receipt = @{
  id          = $pendingPlanId
  status      = $resultWord
  applied     = $applied
  build       = $buildNow
  stamp       = $stampNow
  patch_file  = $patchFile
  bridge_output = $bridgeResult
  executed_at = (Get-Date).ToString("o")
}

$receiptJson = $receipt | ConvertTo-Json -Depth 6

$putPlanPath = Join-Path $ops "PLAN_PUT.txt"
@"
HOST $HostName
REGISTRY_PUT config $receiptJson
"@ | Set-Content -Encoding utf8 $putPlanPath

Invoke-Aura $putPlanPath | Out-Null

# ---- EXECL0G: append local + persist registry ----
$logLine = "$(Get-Date -Format o) $pendingPlanId $resultWord $buildNow"
Add-Content -Path $execlogPath -Value $logLine -Encoding utf8

$execlogObj = @{
  id = "mutation_plan.execlog.v1"
  lines = @($logLine)
  updated_at = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 6

$putLogPath = Join-Path $ops "EXECL0G_PUT.txt"
@"
HOST $HostName
REGISTRY_PUT config $execlogObj
"@ | Set-Content -Encoding utf8 $putLogPath

Invoke-Aura $putLogPath | Out-Null

Write-Output "EXECUTED_$resultWord"
