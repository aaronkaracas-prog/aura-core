param(
  [string]$HostName = "auras.guide"
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

# deterministic priority list (highest first)
$planIds = @(
  "mutation_plan.plan.v3",
  "mutation_plan.plan.v2"
)

function Get-Plan($planId) {
  $tmp = Join-Path $ops ("TX4_2__GET__" + $planId.Replace(".","_") + ".txt")
  $body = @"
HOST $HostName
REGISTRY_GET config $planId
"@
  Write-Utf8NoBom $tmp $body
  $json = curl.exe -sS $base -H "content-type: text/plain; charset=utf-8" -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" --data-binary "@$tmp"
  $obj = $json | ConvertFrom-Json
  if (-not $obj.ok) { throw ("PLAN_GET_FAILED " + $obj.error) }
  $payload = $null
  if ($obj.reply -is [System.Array]) {
    $payload = ($obj.reply | Where-Object { $_.cmd -like "REGISTRY_GET*" } | Select-Object -First 1).payload
  } else {
    $payload = $obj.reply.payload
  }
  return @{ raw=$json; payload=$payload }
}

$chosen = $null
foreach ($id in $planIds) {
  $r = Get-Plan $id
  if (-not $r.payload) { continue }
  if ($r.payload.status -eq "PENDING") { $chosen = $r.payload; break }
}

if (-not $chosen) { Write-Output "NO_PENDING_PLANS"; exit 0 }

# idempotency: refuse to run if already has applied=true
if ($chosen.applied -eq $true) { throw "PLAN_INCONSISTENT_ALREADY_APPLIED" }

$search = $chosen.search
$replace = $chosen.replace
$expected = $chosen.expected_build_contains
$planId = $chosen.id

if ([string]::IsNullOrWhiteSpace($search)) { throw "PLAN_SEARCH_EMPTY" }
if ([string]::IsNullOrWhiteSpace($replace)) { throw "PLAN_REPLACE_EMPTY" }
if ([string]::IsNullOrWhiteSpace($expected)) { throw "PLAN_EXPECTED_EMPTY" }

# write patch
$patchPath = Join-Path $ops ("TX4_2__PATCH__" + $planId.Replace(".","_") + "__" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".txt")
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

# execute
$run = & powershell.exe -ExecutionPolicy Bypass -File $bridgePath -PatchFile $patchPath -ExpectedBuildAfter $expected 2>&1
$runText = ($run | Out-String).Trim()

# verify
$show = curl.exe -sS "https://$HostName/chat" -d "SHOW_BUILD"
$showObj = $show | ConvertFrom-Json
$build = $showObj.reply.build
$stamp = $showObj.reply.stamp
$applied = $false
if ($build -and $build.Contains($expected)) { $applied = $true }

# write receipt (overwrite same id)
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

$tmpPut = Join-Path $ops ("TX4_2__RECEIPT_PUT__" + $planId.Replace(".","_") + ".txt")
$bodyPut = @"
HOST $HostName
REGISTRY_PUT config $receipt
REGISTRY_GET config $planId
"@
Write-Utf8NoBom $tmpPut $bodyPut
$put = curl.exe -sS $base -H "content-type: text/plain; charset=utf-8" -H "authorization: Bearer $env:AURA_OPERATOR_TOKEN" --data-binary "@$tmpPut"

Write-Output ("CHOSEN_PLAN=" + $planId)
Write-Output $runText
Write-Output $show
Write-Output $put