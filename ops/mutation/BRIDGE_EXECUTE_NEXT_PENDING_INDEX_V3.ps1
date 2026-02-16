param(
    [Parameter(Mandatory=$true)][string]$HostName
)

$ErrorActionPreference = "Stop"

$root = "C:\Users\Aaron Karacas\aura-worker\aura"
$ops  = Join-Path $root "ops\mutation"
$bridgePath = Join-Path $ops "AURA_MUTATION_BRIDGE_V1.ps1"
$execlogPath = Join-Path $ops "mutation_execlog_v1.log"

if (-not (Test-Path $bridgePath)) {
    Write-Output "BRIDGE_MISSING"
    exit 1
}

# Pull mutation index
$idxPayloadPath = Join-Path $ops "IDX_GET.txt"
@"
HOST $HostName
REGISTRY_GET config mutation_plan.index.v1
"@ | Set-Content -Encoding utf8 $idxPayloadPath

$idxResp = curl.exe -s `
  -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" `
  --data-binary "@$idxPayloadPath" `
  https://auras.guide/chat

$idxJson = $idxResp | ConvertFrom-Json
$idxData = $idxJson.reply

if (-not $idxData -or -not $idxData.index) {
    Write-Output "NO_INDEX"
    exit 0
}

$plans = $idxData.index
if (-not $plans -or $plans.Count -eq 0) {
    Write-Output "NO_PENDING_PLANS"
    exit 0
}

$pendingPlanId = $null
$pendingPlan = $null

foreach ($planIdCur in $plans) {

    $planPayloadPath = Join-Path $ops "PLAN_GET.txt"
@"
HOST $HostName
REGISTRY_GET config $planIdCur
"@ | Set-Content -Encoding utf8 $planPayloadPath

    $planResp = curl.exe -s `
      -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" `
      --data-binary "@$planPayloadPath" `
      https://auras.guide/chat

    $planJson = $planResp | ConvertFrom-Json
    $planObj = $planJson.reply

    if ($planObj.status -eq "PENDING") {
        $pendingPlanId = $planIdCur
        $pendingPlan = $planObj
        break
    }
}

if (-not $pendingPlanId) {
    Write-Output "NO_PENDING_PLANS"
    exit 0
}

# Execute mutation via bridge
$patchFile = $pendingPlan.patch_file
$search = $pendingPlan.search
$replace = $pendingPlan.replace

$bridgeResult = powershell.exe -ExecutionPolicy Bypass -File $bridgePath `
    -SearchPattern $search `
    -ReplaceWith $replace `
    -PatchFile $patchFile

$applied = $bridgeResult -match "BUILD_ADVANCED"

if ($applied) {
    $resultWord = "APPLIED"
} else {
    $resultWord = "FAILED"
}

# Verify build
$verifyPayloadPath = Join-Path $ops "VERIFY_BUILD.txt"
@"
HOST $HostName
SHOW_BUILD
"@ | Set-Content -Encoding utf8 $verifyPayloadPath

$verifyResp = curl.exe -s `
  -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" `
  --data-binary "@$verifyPayloadPath" `
  https://auras.guide/chat

$verifyJson = $verifyResp | ConvertFrom-Json
$buildNow = $verifyJson.reply.build
$stampNow = $verifyJson.reply.stamp

# Write receipt back into same plan id
$receipt = @{
    id = $pendingPlanId
    status = $resultWord
    applied = $applied
    build = $buildNow
    stamp = $stampNow
    patch_file = $patchFile
    bridge_output = $bridgeResult
    executed_at = (Get-Date).ToString("o")
}

$receiptJson = $receipt | ConvertTo-Json -Depth 6

$putPayloadPath = Join-Path $ops "PLAN_PUT.txt"
@"
HOST $HostName
REGISTRY_PUT config $receiptJson
"@ | Set-Content -Encoding utf8 $putPayloadPath

curl.exe -s `
  -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" `
  --data-binary "@$putPayloadPath" `
  https://auras.guide/chat | Out-Null

# Append execlog safely
$logLine = "$(Get-Date -Format o) $pendingPlanId $resultWord $buildNow"
Add-Content -Path $execlogPath -Value $logLine -Encoding utf8

Write-Output "EXECUTED_$resultWord"
