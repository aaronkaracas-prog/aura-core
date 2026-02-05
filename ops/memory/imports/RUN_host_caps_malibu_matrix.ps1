$ErrorActionPreference = "Stop"

# ---------- helpers ----------
function Write-Utf8NoBom([string]$Path, [string]$Text) {
    [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Aura-Chat([string]$Path, [string]$OpToken = "") {
    $headers = @("content-type: text/plain; charset=utf-8")
    if ($OpToken -and $OpToken.Length -gt 0) {
        $headers += "X-Operator-Token: $OpToken"
    }

    $args = @("-sS","-X","POST","https://auras.guide/chat")
    foreach ($h in $headers) { $args += @("-H",$h) }
    $args += @("--data-binary","@$Path")

    & curl.exe @args | Out-Host
}

# ---------- setup ----------
$ops = Join-Path (Get-Location) "ops\memory\imports"
New-Item -ItemType Directory -Force -Path $ops | Out-Null

$OP = (Read-Host "Paste AURA operator token").Trim()

# ---------- 1. set malibu.city caps ----------
$body1 = @(
    "HOST auras.guide",
    "HOST_CAPS_SET malibu.city [`"VERIFIED_FETCH_URL`",`"CLEAR_VERIFIED_FETCH`",`"EVIDENCE_PRESENT`",`"SNAPSHOT_STATE`"]",
    "HOST_CAPS_GET malibu.city"
) -join "`n"

$p1 = Join-Path $ops "caps_set_malibu.txt"
Write-Utf8NoBom $p1 $body1
Aura-Chat $p1 $OP

# ---------- 2. prove ping blocked ----------
$body2 = @(
    "HOST malibu.city",
    "PING"
) -join "`n"

$p2 = Join-Path $ops "malibu_ping_blocked.txt"
Write-Utf8NoBom $p2 $body2
Aura-Chat $p2 ""

# ---------- 3. allowed commands under malibu ----------
$body3 = @(
    "HOST malibu.city",
    "CLEAR_VERIFIED_FETCH https://malibu.city",
    "VERIFIED_FETCH_URL https://malibu.city",
    "EVIDENCE_PRESENT",
    "SNAPSHOT_STATE"
) -join "`n"

$p3 = Join-Path $ops "malibu_allowed_cmds.txt"
Write-Utf8NoBom $p3 $body3
Aura-Chat $p3 ""

# ---------- 4. registry blocked ----------
$body4 = @(
    "HOST malibu.city",
    "REGISTRY_GET domains malibu.city"
) -join "`n"

$p4 = Join-Path $ops "malibu_registry_get_blocked.txt"
Write-Utf8NoBom $p4 $body4
Aura-Chat $p4 ""

$body5 = @(
    "HOST malibu.city",
    "REGISTRY_PUT {`"type`":`"domains`",`"item`":{`"id`":`"malibu.city`",`"domain`":`"malibu.city`",`"proof`":`"HOST_CAPS_BLOCK_TEST`"}}"
) -join "`n"

$p5 = Join-Path $ops "malibu_registry_put_blocked.txt"
Write-Utf8NoBom $p5 $body5
Aura-Chat $p5 ""

# ---------- 5. set frontdesk.network caps ----------
$body6 = @(
    "HOST auras.guide",
    "HOST_CAPS_SET frontdesk.network [`"VERIFIED_FETCH_URL`",`"CLEAR_VERIFIED_FETCH`",`"EVIDENCE_PRESENT`",`"SNAPSHOT_STATE`"]",
    "HOST_CAPS_GET frontdesk.network"
) -join "`n"

$p6 = Join-Path $ops "caps_set_frontdesk.txt"
Write-Utf8NoBom $p6 $body6
Aura-Chat $p6 $OP

# ---------- 6. frontdesk matrix ----------
$body7 = @(
    "HOST frontdesk.network",
    "CLEAR_VERIFIED_FETCH https://frontdesk.network",
    "VERIFIED_FETCH_URL https://frontdesk.network",
    "EVIDENCE_PRESENT",
    "SNAPSHOT_STATE",
    "REGISTRY_GET domains frontdesk.network",
    "REGISTRY_PUT {`"type`":`"domains`",`"item`":{`"id`":`"frontdesk.network`",`"domain`":`"frontdesk.network`",`"proof`":`"HOST_CAPS_BLOCK_TEST`"}}"
) -join "`n"

$p7 = Join-Path $ops "frontdesk_matrix.txt"
Write-Utf8NoBom $p7 $body7
Aura-Chat $p7 ""

Write-Host "DONE"
