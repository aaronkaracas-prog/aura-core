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

Write-Host "`n=== 1) OPERATOR: Set host caps for frontdesk.network (add SHOW_BUILD) ==="
$OP = Read-Host "Paste NEW operator token"

$body1 = @(
  "HOST auras.guide",
  "HOST_CAPS_SET frontdesk.network [`"VERIFIED_FETCH_URL`",`"CLEAR_VERIFIED_FETCH`",`"EVIDENCE_PRESENT`",`"SNAPSHOT_STATE`",`"SHOW_ALLOWED_COMMANDS`",`"SHOW_BUILD`"]",
  "HOST_CAPS_GET frontdesk.network"
) -join "`n"
$p1 = Join-Path $ops "caps_set_frontdesk_add_show_build.txt"
Write-Utf8NoBom $p1 $body1
Aura-Chat $p1 $OP

Write-Host "`n=== 2) Under frontdesk: SHOW_BUILD should now be allowed (no-operator) ==="
$body2 = @(
  "HOST frontdesk.network",
  "SHOW_BUILD",
  "SNAPSHOT_STATE"
) -join "`n"
$p2 = Join-Path $ops "frontdesk_show_build_check.txt"
Write-Utf8NoBom $p2 $body2
Aura-Chat $p2 ""

Write-Host "`n=== 3) Under frontdesk: REGISTRY_GET must remain blocked (no-operator) ==="
$body3 = @(
  "HOST frontdesk.network",
  "REGISTRY_GET domains frontdesk.network"
) -join "`n"
$p3 = Join-Path $ops "frontdesk_registry_still_blocked.txt"
Write-Utf8NoBom $p3 $body3
Aura-Chat $p3 ""

Write-Host "`nDONE"
