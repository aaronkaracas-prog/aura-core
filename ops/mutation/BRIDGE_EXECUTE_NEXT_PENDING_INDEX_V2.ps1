param(
  [string]$HostName = "auras.guide",
  [string]$IndexId = "mutation_plan.index.v1"
)

$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllBytes($Path, $enc.GetBytes($Text))
}

$root = "C:\Users\Aaron Karacas\aura-worker\aura"
$ops  = Join-Path $root "ops\mutation"
$base = "https://$HostName/chat"
$bridgePath = Join-Path $root "ops\mutation\AURA_MUTATION_BRIDGE_V1.ps1"

if ([string]::IsNullOrWhiteSpace($env:AURA_OPERATOR_TOKEN)) { throw "EMPTY_OPERATOR_TOKEN" }

function RegistryGetConfig($id) {
  $tmp = Join-Path $ops ("TX5__GET__" + $id.Replace(".","_") + ".txt")
  $body = @"
HOST $HostName
REGISTRY_GET config $id
"@
  Write-Utf8NoBom $tmp $body
  $json = curl.exe -sS $base -H "content-type: text/plain; charset=utf-8" -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" --data-binary "@$tmp"
  $obj = $json | ConvertFrom-Json
  if (-not $obj.ok) { throw ("REGISTRY_GET_FAILED " + $obj.error) }
  $payload = $null
  if ($obj.reply -is [System.Array]) {
    $payload = ($obj.reply | Where-Object { $_.cmd -like "REGISTRY_GET*" } | Select-Object -First 1).payload
  } else {
    $payload = $obj.reply.payload
  }
  return @{ raw=$json; payload=$payload }
}

function RegistryPutConfigJson($jsonCompress) {
  $tmp = Join-Path $ops ("TX5__PUT__" + (Get-Date -Format "yyyyMMdd_HHmmss_fff") + ".txt")
  $body = @"
HOST $HostName
REGISTRY_PUT config $jsonCompress
"@
  Write-Utf8NoBom $tmp $body
  return (curl.exe -sS $base -H "content-type: text/plain; charset=utf-8" -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" --data-binary "@$tmp")
}

# 1) get index
$idxRes = RegistryGetConfig $IndexId
$index = $idxRes.payload
if (-not $index) { throw "INDEX_PAYLOAD_MISSING" }
if (-not $index.plans) { throw "INDEX_PLANS_MISSING" }

$plans = @($index.plans)
if ($plans.Count -lt 1) { Write-Output "INDEX_EMPTY"; exit 0 }

# 2) iterate newest->oldest, pick first PENDING
$chosen = $null
for ($i = $plans.Count - 1; $i -ge 0; $i--) {
  $planIdCur = $plans[$i]
  $pRes = RegistryGetConfig $planIdCur
  $p = $pRes.payload
  if (-not $p) { continue }
  if ($p.status -eq "PENDING") { $chosen = $p; break }
}

if (-not $chosen) { Write-Output "NO_PENDING_PLANS"; exit 0 }
if ($chosen.applied -eq $true) { throw "PLAN_INCONSISTENT_ALREADY_APPLIED" }

$planId = $chosen.id
$search = $chosen.search
$replace = $chosen.replace
$expected = $chosen.expected_build_contains

if ([string]::IsNullOrWhiteSpace($search)) { throw "PLAN_SEARCH_EMPTY" }
if ([string]::IsNullOrWhiteSpace($replace)) { throw "PLAN_REPLACE_EMPTY" }
if ([string]::IsNullOrWhiteSpace($expected)) { throw "PLAN_EXPECTED_EMPTY" }

# 3) single-pending rule (count pendings)
$pendingCount = 0
for ($j = 0; $j -lt $plans.Count; $j++) {
  $planIdCur2 = $plans[$j]
  $p2 = (RegistryGetConfig $planIdCur2).payload
  if ($p2 -and $p2.status -eq "PENDING") { $pendingCount++ }
}
if ($pendingCount -gt 1) {
  $receipt = @{
    id = $planId
    status = "FAILED"
    applied = $false
    build = ""
    stamp = ""
    patch_file = ""
    bridge_output = ("MULTI_PENDING_BLOCKED count=" + $pendingCount)
    executed_at = (Get-Date -Format o)
  } | ConvertTo-Json -Compress
  $null = RegistryPutConfigJson $receipt
  Write-Output ("CHOSEN_PLAN=" + $planId)
  Write-Output ("BRIDGE_OK=False")
  Write-Output ("MULTI_PENDING_BLOCKED count=" + $pendingCount)
  exit 0
}

# 4) write patch
$patchPath = Join-Path $ops ("TX5__PATCH__" + $planId.Replace(".","_") + "__" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".txt")
$patch = @"
PATCH_V1
TARGET: src\index.js
MODE: REPLACE_ONCE
SEARCH:
$search
REPLACE:
$replace
END_PATCH
"@
Write-Utf8NoBom $patchPath $patch

# 5) execute bridge with catch
$runText = ""
$bridgeOk = $true
try {
  $run = & powershell.exe -ExecutionPolicy Bypass -File $bridgePath -PatchFile $patchPath -ExpectedBuildAfter $expected 2>&1
  $runText = ($run | Out-String).Trim()
} catch {
  $bridgeOk = $false
  $runText = ($_.Exception.Message | Out-String).Trim()
}

# 6) verify build
$show = curl.exe -sS "https://$HostName/chat" -d "SHOW_BUILD"
$showObj = $show | ConvertFrom-Json
$build = $showObj.reply.build
$stamp = $showObj.reply.stamp

$applied = $false
if ($bridgeOk -and $build -and $build.Contains($expected)) { $applied = $true }

# 7) receipt
$receipt = @{
  id = $planId
  status = $(if ($applied) { "APPLIED" } else { "FAILED" })
  applied = $applied
  build = $build
  stamp = $stamp
  patch_file = $patchPath
  bridge_output = $runText
  executed_at = (Get-Date -Format o)
} | ConvertTo-Json -Compress

$put = RegistryPutConfigJson $receipt

# 8) execlog append (keep last 25)
$logId = "mutation_plan.execlog.v1"
$logRes = RegistryGetConfig $logId
$log = $logRes.payload
$lines = @()
if ($log -and $log.lines) { $lines = @($log.lines) }

$line = (Get-Date -Format o) + " " + $planId + " " + (if ($applied) { "APPLIED" } else { "FAILED" }) + " " + $build
$lines = @($lines + $line)
if ($lines.Count -gt 25) { $lines = $lines[($lines.Count-25)..($lines.Count-1)] }

$logPut = @{
  id = $logId
  lines = $lines
  updated_at_local = (Get-Date -Format o)
} | ConvertTo-Json -Compress

$logPutResp = RegistryPutConfigJson $logPut

Write-Output ("CHOSEN_PLAN=" + $planId)
Write-Output ("BRIDGE_OK=" + $bridgeOk)
Write-Output $runText
Write-Output $show
Write-Output $put
Write-Output $logPutResp