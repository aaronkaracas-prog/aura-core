function Write-Utf8NoBom([string]$Path, [string]$Text) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Invoke-AuraFullProof([string]$OperatorToken) {
  if (-not $OperatorToken -or $OperatorToken.Trim().Length -lt 8) { throw "OPERATOR_TOKEN_EMPTY_OR_TOO_SHORT" }

  $ops = "C:\Users\Aaron Karacas\aura-worker\aura\ops"
  $proofs = Join-Path $ops "PROOFS"
  New-Item -ItemType Directory -Force -Path $proofs | Out-Null

  $d40Dir = Join-Path $ops "D40__OPERATOR_PROOF_PACK"
  $d41Dir = Join-Path $ops "D41__SELF_AUDIT_PACK"
  New-Item -ItemType Directory -Force -Path $d40Dir | Out-Null
  New-Item -ItemType Directory -Force -Path $d41Dir | Out-Null

  $pktAuras   = Join-Path $d40Dir "D40__auras.guide__PROOF_PACKET.txt"
  $pktFront   = Join-Path $d40Dir "D40__frontdesk.network__PROOF_PACKET.txt"
  $pktMalibu  = Join-Path $d40Dir "D40__malibu.city__PROOF_PACKET.txt"

  $pktAuras41  = Join-Path $d41Dir "D41__auras.guide__SELF_AUDIT.txt"
  $pktFront41  = Join-Path $d41Dir "D41__frontdesk.network__SELF_AUDIT.txt"
  $pktMalibu41 = Join-Path $d41Dir "D41__malibu.city__SELF_AUDIT.txt"

  # Bootstrap (D40/D41) if missing
  $charterText = "D40_PROOF_PACK__CHARTER_V10__ENVELOPE_ONLY__" + (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

  function New-D40Packet([string]$HostName, [int]$BudgetLimit) {
    $lines = @()
    $lines += ">> HOST $HostName"
    $lines += ">> SNAPSHOT_STATE"
    $lines += ">> AUTONOMY_BUDGET_SET"
    $lines += ">> {""limit"":$BudgetLimit,""spent"":0,""window"":""day""}"
    $lines += ">> AUTONOMY_BUDGET_GET"
    $lines += ">> AUTONOMY_CHARTER_SET"
    $lines += ">> {""host"":""$HostName"",""charter"":{""version"":10,""text"":""$charterText""}}"
    $lines += ">> AUTONOMY_CHARTER_GET"
    $lines += ">> AUTONOMY_LAST_TICK_SET"
    $lines += ">> {""host"":""$HostName""}"
    $lines += ">> AUTONOMY_LAST_TICK"
    $lines += ">> "
    return ($lines -join "`n")
  }

  function New-D41Packet([string]$HostName) {
    $lines = @()
    $lines += ">> HOST $HostName"
    $lines += ">> SNAPSHOT_STATE"
    $lines += ">> AUTONOMY_STATUS"
    $lines += ">> HOST_CAPS_GET"
    $lines += ">> SELF_AUDIT_FULL"
    $lines += ">> REGISTRY_AUDIT_TRAIL"
    $lines += ">> "
    return ($lines -join "`n")
  }

  if (-not (Test-Path $pktAuras))  { Write-Utf8NoBom $pktAuras  (New-D40Packet "auras.guide" 101) }
  if (-not (Test-Path $pktFront))  { Write-Utf8NoBom $pktFront  (New-D40Packet "frontdesk.network" 102) }
  if (-not (Test-Path $pktMalibu)) { Write-Utf8NoBom $pktMalibu (New-D40Packet "malibu.city" 103) }

  if (-not (Test-Path $pktAuras41))  { Write-Utf8NoBom $pktAuras41  (New-D41Packet "auras.guide") }
  if (-not (Test-Path $pktFront41))  { Write-Utf8NoBom $pktFront41  (New-D41Packet "frontdesk.network") }
  if (-not (Test-Path $pktMalibu41)) { Write-Utf8NoBom $pktMalibu41 (New-D41Packet "malibu.city") }

  $runStamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
  $runDir = Join-Path $proofs ("RUN__" + $runStamp)
  New-Item -ItemType Directory -Force -Path $runDir | Out-Null

  function Invoke-AuraPacketToFile([string]$HostName, [string]$PacketPath, [string]$OutPath) {
    if (-not (Test-Path $PacketPath)) { throw ("PACKET_MISSING: " + $PacketPath) }
    if ((Get-Item $PacketPath).Length -lt 10) { throw ("PACKET_EMPTY: " + $PacketPath) }
    $u = "https://$HostName/chat"
    $out = curl.exe -s -X POST $u -H "content-type: text/plain; charset=utf-8" -H ("x-operator-token: " + $OperatorToken) --data-binary ("@" + $PacketPath)
    Write-Utf8NoBom $OutPath $out
    $out
  }

  Invoke-AuraPacketToFile "auras.guide"       $pktAuras    (Join-Path $runDir "D40__auras.guide.json")         | Out-Null
  Invoke-AuraPacketToFile "frontdesk.network" $pktFront    (Join-Path $runDir "D40__frontdesk.network.json")   | Out-Null
  Invoke-AuraPacketToFile "malibu.city"       $pktMalibu   (Join-Path $runDir "D40__malibu.city.json")         | Out-Null

  Invoke-AuraPacketToFile "auras.guide"       $pktAuras41  (Join-Path $runDir "D41__auras.guide.json")         | Out-Null
  Invoke-AuraPacketToFile "frontdesk.network" $pktFront41  (Join-Path $runDir "D41__frontdesk.network.json")   | Out-Null
  Invoke-AuraPacketToFile "malibu.city"       $pktMalibu41 (Join-Path $runDir "D41__malibu.city.json")         | Out-Null

  $manifest = Join-Path $runDir "MANIFEST.txt"
  $hdr = "AURA_PROOF_BUNDLE_MANIFEST`nRUN_DIR=$runDir`nSTAMP=$runStamp`nGENERATED_UTC=" + (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ") + "`n`n"
  Write-Utf8NoBom $manifest $hdr

  Get-ChildItem $runDir -File | Sort-Object Name | ForEach-Object {
    $h = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
    $line = "{0}  {1}  {2}`n" -f $_.Name, $_.Length, $h
    Add-Content -LiteralPath $manifest -Value $line -Encoding UTF8
  }

  [pscustomobject]@{
    ok = $true
    runDir = $runDir
    packets = [pscustomobject]@{
      d40 = @($pktAuras,$pktFront,$pktMalibu)
      d41 = @($pktAuras41,$pktFront41,$pktMalibu41)
    }
    files = (Get-ChildItem $runDir -File | Sort-Object Name | Select-Object Name, Length)
  }
}