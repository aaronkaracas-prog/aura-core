cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# FIX THE CATALOG - one card name with an a-umlaut (The Twisted Doppelganger) was being garbled and doubled on every save.
# Cause: PowerShell read wrangler's output in the old console code page instead of UTF-8. Read it as UTF-8 now, rename the card to plain letters, save, redraw that one card.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
function Read-Tree { for ($t = 1; $t -le 4; $t++) { $r = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim(); if ($r.StartsWith("{")) { try { $o = $r | ConvertFrom-Json; if ($o.subjects -and $o.specific) { return @{ raw = $r; tree = $o } } } catch {} }; "  read failed (try " + $t + ") - retrying" | Out-Host; Start-Sleep -Seconds 5 }; return $null }
$got = Read-Tree
if (-not $got) { "COULD NOT READ THE CATALOG - nothing written, run the block again" } else {
$tt = $got.tree
$backup = Join-Path $env:TEMP ("card-tree-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
[System.IO.File]::WriteAllText($backup, $got.raw, (New-Object System.Text.UTF8Encoding $false))
"  catalog read: " + [math]::Round($got.raw.Length/1MB,2) + " MB - backup saved: " + $backup
$fixed = 0; $odd = @()
foreach ($p in @($tt.specific.PSObject.Properties)) {
  if ($p.Name -match '[^\x00-\x7F]') { $odd += ("SET NAME: " + $p.Name.Substring(0, [Math]::Min(60, $p.Name.Length))) }
  $arr = @($p.Value); $chg = $false
  for ($i = 0; $i -lt $arr.Count; $i++) {
    $s = [string]$arr[$i]
    if ($s -match '[^\x00-\x7F]') {
      if ($s.StartsWith("The Twisted Doppelg")) { $arr[$i] = "The Twisted Doppelganger"; $chg = $true; $fixed++ }
      else { $odd += ($p.Name + " :: " + $s.Substring(0, [Math]::Min(60, $s.Length)) + " (" + $s.Length + " letters)") }
    }
  }
  if ($chg) { $tt.specific.($p.Name) = $arr }
}
foreach ($p in @($tt.subjects.PSObject.Properties)) { foreach ($s in @($p.Value)) { if ([string]$s -match '[^\x00-\x7F]') { $odd += ("KIND in " + $p.Name + " :: " + ([string]$s).Substring(0, [Math]::Min(60, ([string]$s).Length))) } } }
"  garbled Doppelganger names fixed: " + $fixed
if ($odd.Count) { "  OTHER NAMES WITH SPECIAL LETTERS (listed only, not changed):"; $odd | % { "    " + $_ } }
$json = $tt | ConvertTo-Json -Depth 20 -Compress
"  catalog size after the fix: " + [math]::Round($json.Length/1MB,2) + " MB"
$big = @($odd | ? { $_ -match '\((\d+) letters\)' -and [int]$matches[1] -gt 150 })
if ($fixed -lt 1 -or $json.Length -gt 3MB -or $big.Count) { "  STOP - the catalog is still too big or another name is garbled - nothing written, send me this output" } else {
$tmp = Join-Path $env:TEMP "card-tree-new.json"
[System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding $false))
$okSave = $false
for ($p = 1; $p -le 3 -and -not $okSave; $p++) {
  $po = (npx wrangler kv key put --namespace-id $ns "card:tree" --path $tmp --remote 2>&1 | Out-String)
  Start-Sleep -Seconds 10
  $chk = Read-Tree
  if ($chk -and $chk.raw.Length -lt 3MB -and (@($chk.tree.specific.'Grotesque Dark Fantasy Grotesque Faces') -contains "The Twisted Doppelganger")) { $okSave = $true; "  catalog saved and checked: " + [math]::Round($chk.raw.Length/1MB,2) + " MB" } else { "  save did not show up (try " + $p + ") - wrangler said: " + (($po.Trim() -split "`n") | ? { $_ -match 'ERROR|exceeds|code' } | Select-Object -First 2) -join " " }
}
if (-not $okSave) { "  CATALOG SAVE FAILED - send me this output" } else {
$d = 'Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone on a plain white background, shown flat exactly as described, no body, drawn large so it fills most of the panel. RIGHT PANEL: Studio photograph of a real person''''s body showing the same exact tattoo where described, healed tattoo on real skin in soft even light, the rest of the body modestly covered by simple plain clothing, only the tattooed area bare, plain seamless light grey studio backdrop - no room, no furniture, no scenery. The tattoo in both panels is identical. The tattoo: The Twisted Doppelganger, a Grotesque Dark Fantasy tattoo. In the right panel it is on a woman, outer thigh, two faces blending together, a medium tattoo about the size of her hand, with plenty of bare skin around it.'
RUN ("SETKV build:the-twisted-doppelganger " + $d) | Out-Null
"  description saved under the new name - waiting 70 seconds, then redrawing that one card..."
Start-Sleep -Seconds 70
$r = (RUN "REDO The Twisted Doppelganger" | Out-String)
if ($r -match '->  (https://[^"]+)"') { "  The Twisted Doppelganger -> " + $matches[1] } else { "  The Twisted Doppelganger NOT DRAWN: " + $r.Substring(0, [Math]::Min(300, $r.Length)) }
"== CATALOG FIXED - now run build-bb-badass3 =="
} } }
