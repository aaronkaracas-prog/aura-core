param(
  [Parameter(Mandatory=$true)][string]$HostName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$sec = Read-Host "AURA_OPERATOR_TOKEN (Bearer) for $HostName" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
try { $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

function CurlAura($file) {
  curl.exe -sS ("https://{0}/chat" -f $HostName) -H ("authorization: Bearer {0}" -f $token) --data-binary ("@{0}" -f $file)
}

function WriteNoBom($path,$text) {
  [System.IO.File]::WriteAllText($path,$text,(New-Object System.Text.UTF8Encoding($false)))
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$bridge = Join-Path $here "AURA_MUTATION_BRIDGE_V1.ps1"

# GET index
$idxFile = Join-Path $here "V7_INDEX_GET.txt"
WriteNoBom $idxFile ("HOST {0}`nREGISTRY_GET config mutation_plan.index.v1`n" -f $HostName)
$idxResp = CurlAura $idxFile | ConvertFrom-Json
$idxPayload = $idxResp.reply[0].payload

if (-not $idxPayload -or -not $idxPayload.index) {
  Write-Output "NO_INDEX"
  exit 0
}

$pending = $null

foreach ($planIdIter in $idxPayload.index) {
  $pFile = Join-Path $here "V7_PLAN_GET.txt"
  WriteNoBom $pFile ("HOST {0}`nREGISTRY_GET config {1}`n" -f $HostName,$planIdIter)
  $pResp = CurlAura $pFile | ConvertFrom-Json
  $pPayload = $pResp.reply[0].payload

  if ($pPayload.status -eq "PENDING") {
    $pending = $pPayload
    break
  }
}

if (-not $pending) {
  Write-Output "NO_PENDING_PLANS"
  exit 0
}

$bridgeOut = & $bridge -PatchFile $pending.patch_file -ExpectedBuildAfter $pending.expected_build_after 2>&1 | Out-String

$status = "FAILED"
$applied = $false
if ($bridgeOut -match "APPLIED" -or $bridgeOut -match "DEPLOYED" -or $bridgeOut -match "SUCCESS") {
  $status = "APPLIED"
  $applied = $true
}

$sbFile = Join-Path $here "V7_SHOW_BUILD.txt"
WriteNoBom $sbFile ("HOST {0}`nSHOW_BUILD`n" -f $HostName)
$sbResp = CurlAura $sbFile | ConvertFrom-Json
$build = $sbResp.reply[0].payload.build

$receipt = @{
  id = $pending.id
  status = $status
  applied = $applied
  patch_file = $pending.patch_file
  expected_build_after = $pending.expected_build_after
  build = $build
  bridge_output = $bridgeOut.Trim()
  executed_at = (Get-Date).ToString("o")
  type = "config"
  version = "v1"
} | ConvertTo-Json -Compress

$rFile = Join-Path $here "V7_PLAN_PUT.txt"
WriteNoBom $rFile ("HOST {0}`nREGISTRY_PUT config {1}`n" -f $HostName,$receipt)
CurlAura $rFile | Out-Null

Write-Output ("DONE {0} {1}" -f $pending.id,$status)

