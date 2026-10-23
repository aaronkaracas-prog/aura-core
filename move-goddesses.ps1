cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Splits Pin-Up Girls in two (Aaron 2026-10-23): the 10 split-card sets named "Pin-Up Girls ..." move to a new category,
# "Goddesses and Muses", renamed "Goddesses and Muses ..." so the screen shows their own names. The 10 classic "Pin-Up ..." sets stay.
# No picture is touched - every card keeps its own name and picture. The catalog is backed up first.
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$from = "Pin-Up Girls"; $to = "Goddesses and Muses"
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$raw = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim()
$tt = $null; try { $tt = $raw | ConvertFrom-Json } catch {}
if (-not $tt -or -not $tt.subjects -or -not $tt.specific) { "COULD NOT READ THE CATALOG - nothing written, run it again" } else {
$backup = Join-Path $env:TEMP ("card-tree-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
[System.IO.File]::WriteAllText($backup, $raw, (New-Object System.Text.UTF8Encoding $false))
"  backup of the catalog saved first: " + $backup
$all = @($tt.subjects.$from | ? { $_ })
$move = @($all | ? { $_ -like ($from + " *") })
$stay = @($all | ? { $_ -notlike ($from + " *") })
"  " + $from + " has " + $all.Count + " sets: " + $move.Count + " move to " + $to + ", " + $stay.Count + " stay"
if ($move.Count -ne 10 -or $tt.subjects.PSObject.Properties[$to]) { "  STOP - expected 10 sets to move and no " + $to + " yet; nothing written" } else {
$newNames = @()
foreach ($k in $move) {
  $nk = $to + " " + $k.Substring($from.Length + 1)
  $newNames += $nk
  $tt.specific | Add-Member -NotePropertyName $nk -NotePropertyValue @($tt.specific.$k) -Force
  $tt.specific.PSObject.Properties.Remove($k)
  "  " + $k + "  ->  " + $nk + " (" + @($tt.specific.$nk).Count + " cards)"
}
$tt.subjects.$from = $stay
$tt.subjects | Add-Member -NotePropertyName $to -NotePropertyValue $newNames
$json = $tt | ConvertTo-Json -Depth 20 -Compress
if ($json.Length -lt ($raw.Length * 0.95)) { "  SAFETY STOP - the new catalog looks smaller than the old one, nothing written" } else {
$tmp = Join-Path $env:TEMP "card-tree-new.json"
[System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding $false))
npx wrangler kv key put --namespace-id $ns "card:tree" --path $tmp --remote 2>$null | Out-Null
"  catalog written in ONE save"
"  carrying each set's own settings to its new name..."
$copied = 0
for ($i = 0; $i -lt $move.Count; $i++) {
  $os = & $slug $move[$i]; $nsl = & $slug $newNames[$i]
  foreach ($p in "render:","shape:","split:","context:","own:","signed:") {
    $v = $null; try { $v = ((RUN ("GETKV " + $p + $os) | Out-String) | ConvertFrom-Json).payload.reply } catch {}
    if ($v) { RUN ("SETKV " + $p + $nsl + " " + $v) | Out-Null; $copied++ }
  }
}
"  " + $copied + " settings carried over - waiting 70 seconds so every server sees the new catalog..."
Start-Sleep -Seconds 70
"  rebuilding the Explore index..."
for ($q = 1; $q -le 15; $q++) {
  $o = ((RUN "BROWSE" | Out-String) | ConvertFrom-Json).payload
  "  pass " + $q + ": " + $o.banked + " of " + $o.categories + " categories, " + $o.remaining + " left"
  if (-not $o.remaining) { break }
}
$chk = ((npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json)
"== " + $to + ": " + @($chk.subjects.$to).Count + " sets - " + $from + ": " + @($chk.subjects.$from).Count + " sets =="
}}}
