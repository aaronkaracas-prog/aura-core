$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Aura-Chat([string]$Path, [string]$OpToken = "") {
  $headers = @("content-type: text/plain; charset=utf-8")
  if ($OpToken -and $OpToken.Trim().Length -gt 0) { $headers += "X-Operator-Token: $OpToken" }
  $h = @()
  foreach ($x in $headers) { $h += @("-H", $x) }
  $args = @("-sS","-X","POST","https://auras.guide/chat") + $h + @("--data-binary","@$Path")
  & curl.exe @args | Out-Host
}

$OP = Read-Host "Paste AURA operator token"

$ops = Join-Path (Get-Location) "ops\memory\imports"
New-Item -ItemType Directory -Force -Path $ops | Out-Null

# 1) Operator-only: lock HostCaps for frontdesk.network to minimal allowlist
$body1 = @(
  "HOST auras.guide",
  "HOST_CAPS_SET frontdesk.network [`"VERIFIED_FETCH_URL`",`"CLEAR_VERIFIED_FETCH`",`"EVIDENCE_PRESENT`",`"SNAPSHOT_STATE`"]",
  "HOST_CAPS_GET frontdesk.network"
) -join "`n"
$p1 = Join-Path $ops "host_caps_set_frontdesk_network.txt"
Write-Utf8NoBom $p1 $body1
Aura-Chat $p1 $OP

# 2) Prove blocks: PING should be NOT_ALLOWED
$body2 = @(
  "HOST frontdesk.network",
  "PING"
) -join "`n"
$p2 = Join-Path $ops "host_caps_block_ping_on_frontdesk.txt"
Write-Utf8NoBom $p2 $body2
Aura-Chat $p2 ""

# 3) Prove allowlist: evidence commands should run
$body3 = @(
  "HOST frontdesk.network",
  "CLEAR_VERIFIED_FETCH https://frontdesk.network",
  "VERIFIED_FETCH_URL https://frontdesk.network",
  "EVIDENCE_PRESENT",
  "SNAPSHOT_STATE"
) -join "`n"
$p3 = Join-Path $ops "host_caps_allowlist_frontdesk_allowed_cmds.txt"
Write-Utf8NoBom $p3 $body3
Aura-Chat $p3 ""

# 4) Prove registry blocked under host: should be NOT_ALLOWED
$body4 = @(
  "HOST frontdesk.network",
  "REGISTRY_GET domains frontdesk.network"
) -join "`n"
$p4 = Join-Path $ops "host_caps_block_registry_get_under_frontdesk.txt"
Write-Utf8NoBom $p4 $body4
Aura-Chat $p4 ""

# 5) Prove registry put blocked under host: should be NOT_ALLOWED
$body5 = @(
  "HOST frontdesk.network",
  "REGISTRY_PUT {`"type`":`"domains`",`"item`":{`"id`":`"frontdesk.network`",`"domain`":`"frontdesk.network`",`"proof`":`"HOST_CAPS_SHOULD_BLOCK_REGISTRY_UNDER_FRONTDESK`"}}"
) -join "`n"
$p5 = Join-Path $ops "host_caps_block_registry_put_under_frontdesk.txt"
Write-Utf8NoBom $p5 $body5
Aura-Chat $p5 ""

Write-Host "DONE"
