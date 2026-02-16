param(
  [string]$HostName = "auras.guide",
  [string]$PlanId = "mutation_plan.plan.v1"
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

# 1) fetch plan
$tmpGet = Join-Path $ops ("TX3_3__PLAN_GET__" + $PlanId.Replace(".","_") + ".txt")
$bodyGet = @"
HOST $HostName
REGISTRY_GET config $PlanId
"@
Write-Utf8NoBom $tmpGet $bodyGet

$json = curl.exe -sS $base -H "content-type: text/plain; charset=utf-8" -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" --data-binary "@$tmpGet"
$obj = $json | ConvertFrom-Json

if (-not $obj.ok) { throw ("PLAN_GET_FAILED " + $obj.error) }

# reply may be array or object; normalize
$payload = $null
if ($obj.reply -is [System.Array]) {
  $payload = ($obj.reply | Where-Object { $_.cmd -like "REGISTRY_GET*" } | Select-Object -First 1).payload
} else {
  $payload = $obj.reply.payload
}
if (-not $payload) { throw "PLAN_PAYLOAD_MISSING" }

$status = $payload.status
if ($status -ne "PENDING") { throw ("PLAN_NOT_PENDING status=" + $status) }

$search = $payload.search
$replace = $payload.replace
$expected = $payload.expected_build_contains

if ([string]::IsNullOrWhiteSpace($search)) { throw "PLAN_SEARCH_EMPTY" }
if ([string]::IsNullOrWhiteSpace($replace)) { throw "PLAN_REPLACE_EMPTY" }
if ([string]::IsNullOrWhiteSpace($expected)) { throw "PLAN_EXPECTED_EMPTY" }

# 2) write PATCH_V1
$patchPath = Join-Path $ops ("TX3_3__PATCH_FROM_PLAN__" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".txt")
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

# 3) execute mutation (deploy+verify)
$run = & powershell.exe -ExecutionPolicy Bypass -File $bridgePath -PatchFile $patchPath -ExpectedBuildAfter $expected 2>&1
$runText = ($run | Out-String).Trim()

# 4) fetch SHOW_BUILD stamp
$show = curl.exe -sS "https://$HostName/chat" -d "SHOW_BUILD"
$showObj = $show | ConvertFrom-Json
$build = $showObj.reply.build
$stamp = $showObj.reply.stamp

$applied = $false
if ($build -and $build.Contains($expected)) { $applied = $true }

# 5) write receipt back
$receipt = @{
  id = $PlanId
  status = $(if ($applied) { "APPLIED" } else { "FAILED" })
  applied = $applied
  build = $build
  stamp = $stamp
  patch_file = $patchPath
  bridge_output = $runText
  executed_at = (Get-Date -Format o)
} | ConvertTo-Json -Compress

$tmpPut = Join-Path $ops ("TX3_3__PLAN_RECEIPT_PUT__" + $PlanId.Replace(".","_") + ".txt")
$bodyPut = @"
HOST $HostName
REGISTRY_PUT config $receipt
REGISTRY_GET config $PlanId
"@
Write-Utf8NoBom $tmpPut $bodyPut

$put = curl.exe -sS $base -H "content-type: text/plain; charset=utf-8" -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" --data-binary "@$tmpPut"
Write-Output $runText
Write-Output $show
Write-Output $put