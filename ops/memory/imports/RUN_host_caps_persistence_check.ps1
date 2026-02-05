$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text + "`n", (New-Object System.Text.UTF8Encoding($false)))
}

function Aura-Chat([string]$Path, [string]$OpToken = "") {
  $headers = @("content-type: text/plain; charset=utf-8")
  if ($OpToken -and $OpToken.Trim().Length -gt 0) { $headers += "X-Operator-Token: $OpToken" }
  $h = @()
  foreach ($x in $headers) { $h += @("-H", $x) }
  $args = @("-sS","-X","POST","https://auras.guide/chat") + $h + @("--data-binary","@$Path")
  & curl.exe @args | Out-Host
}

$ops = Join-Path (Get-Location) "ops\memory\imports"
New-Item -ItemType Directory -Force -Path $ops | Out-Null

Write-Host "`n=== A1 SNAPSHOT_STATE (auras.guide) ==="
$bodyA1 = "HOST auras.guide`nSNAPSHOT_STATE"
$pA1 = Join-Path $ops "caps_A1_snapshot.txt"
Write-Utf8NoBom $pA1 $bodyA1
Aura-Chat $pA1 ""

Write-Host "`n=== A2 HOST_CAPS_GET malibu.city ==="
$bodyA2 = "HOST auras.guide`nHOST_CAPS_GET malibu.city"
$pA2 = Join-Path $ops "caps_A2_get_malibu.txt"
Write-Utf8NoBom $pA2 $bodyA2
Aura-Chat $pA2 ""

Write-Host "`n=== A3 HOST_CAPS_GET frontdesk.network ==="
$bodyA3 = "HOST auras.guide`nHOST_CAPS_GET frontdesk.network"
$pA3 = Join-Path $ops "caps_A3_get_frontdesk.txt"
Write-Utf8NoBom $pA3 $bodyA3
Aura-Chat $pA3 ""

Write-Host "`n=== B OPERATOR: add SHOW_ALLOWED_COMMANDS to frontdesk.network ==="
$OP = Read-Host "Paste AURA operator token"
$bodyB = "HOST auras.guide`nHOST_CAPS_SET frontdesk.network [`"VERIFIED_FETCH_URL`",`"CLEAR_VERIFIED_FETCH`",`"EVIDENCE_PRESENT`",`"SNAPSHOT_STATE`",`"SHOW_ALLOWED_COMMANDS`"]`nHOST_CAPS_GET frontdesk.network"
$pB = Join-Path $ops "caps_B_set_frontdesk_operator.txt"
Write-Utf8NoBom $pB $bodyB
Aura-Chat $pB $OP

Write-Host "`n=== C Under frontdesk: SHOW_ALLOWED_COMMANDS (should be allowed now) ==="
$bodyC = "HOST frontdesk.network`nSHOW_ALLOWED_COMMANDS"
$pC = Join-Path $ops "caps_C_show_allowed_frontdesk.txt"
Write-Utf8NoBom $pC $bodyC
Aura-Chat $pC ""

Write-Host "`n=== D Under frontdesk: REGISTRY_GET (must remain blocked) ==="
$bodyD = "HOST frontdesk.network`nREGISTRY_GET domains frontdesk.network"
$pD = Join-Path $ops "caps_D_registry_get_blocked.txt"
Write-Utf8NoBom $pD $bodyD
Aura-Chat $pD ""

Write-Host "`nDONE"
