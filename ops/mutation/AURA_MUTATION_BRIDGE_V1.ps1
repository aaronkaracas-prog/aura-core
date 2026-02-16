[CmdletBinding(DefaultParameterSetName="Mutate")]
param(
  [Parameter(ParameterSetName="Mutate", Mandatory=$true)]
  [string]$PatchFile,

  [Parameter(ParameterSetName="Mutate")]
  [string]$ExpectedBuildAfter = "",

  [Parameter(ParameterSetName="Mutate")]
  [switch]$DryRun,

  [Parameter(ParameterSetName="Rollback", Mandatory=$true)]
  [switch]$RollbackOnly,

  [Parameter(ParameterSetName="Rollback", Mandatory=$true)]
  [string]$RollbackFrom,

  [Parameter(ParameterSetName="Rollback")]
  [switch]$RollbackDryRun
)

$ErrorActionPreference = "Stop"

function Fail($code) { throw $code }

$root = "C:\Users\Aaron Karacas\aura-worker\aura"
$indexPath = Join-Path $root "src\index.js"
$backupDir = Join-Path $root "ops\mutation\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (-not (Test-Path $indexPath)) { Fail "INDEX_NOT_FOUND" }

# --- ROLLBACK MODE ---
if ($PSCmdlet.ParameterSetName -eq "Rollback") {
  if (-not (Test-Path $RollbackFrom)) { Fail "ROLLBACK_FILE_NOT_FOUND" }
  Copy-Item $RollbackFrom $indexPath -Force
  if (-not $RollbackDryRun) {
    wrangler deploy | Out-Null
    Start-Sleep -Seconds 3
  }
  Write-Output "ROLLBACK_APPLIED"
  exit 0
}

# --- MUTATION MODE ---
if (-not (Test-Path $PatchFile)) { Fail "PATCH_FILE_NOT_FOUND" }

$patch = Get-Content $PatchFile -Raw

if (-not $patch.StartsWith("PATCH_V1")) { Fail "PATCH_NOT_V1" }
if (-not $patch.Contains("SEARCH:")) { Fail "PATCH_MISSING_SEARCH" }
if (-not $patch.Contains("REPLACE:")) { Fail "PATCH_MISSING_REPLACE" }
if (-not $patch.Contains("END_PATCH")) { Fail "PATCH_MISSING_END" }

$afterSearch = ($patch -split "SEARCH:`r?`n",2)[1]
$searchBlock = ($afterSearch -split "`r?`nREPLACE:`r?`n",2)[0]
$replaceBlock = (($afterSearch -split "`r?`nREPLACE:`r?`n",2)[1] -split "`r?`nEND_PATCH",2)[0]

$search = $searchBlock
$replace = $replaceBlock

$original = Get-Content $indexPath -Raw

if (-not $original.Contains($search)) { Fail "SEARCH_PATTERN_NOT_FOUND" }

$first = $original.IndexOf($search)
$second = $original.IndexOf($search, $first + $search.Length)
if ($second -ge 0) { Fail "SEARCH_NOT_UNIQUE" }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = Join-Path $backupDir "index.js.bak_$timestamp"
Copy-Item $indexPath $backupPath -Force

$updated = $original.Replace($search, $replace)
Set-Content -Path $indexPath -Value $updated -Encoding UTF8

if ($DryRun) {
  Copy-Item $backupPath $indexPath -Force
  Write-Output ("DRY_RUN_OK backup=" + $backupPath)
  exit 0
}

wrangler deploy | Out-Null
Start-Sleep -Seconds 3

if (-not [string]::IsNullOrWhiteSpace($ExpectedBuildAfter)) {
  $resp = curl.exe -sS https://auras.guide/chat -d "SHOW_BUILD"
  if (-not $resp.Contains($ExpectedBuildAfter)) {
    Copy-Item $backupPath $indexPath -Force
    wrangler deploy | Out-Null
    Fail "VERIFY_FAILED_ROLLED_BACK"
  }
}

Write-Output ("MUTATION_SUCCESS backup=" + $backupPath)