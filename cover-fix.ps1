cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
function Read-Tree { for ($t = 1; $t -le 4; $t++) { $r = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim(); if ($r.StartsWith("{")) { try { $o = $r | ConvertFrom-Json; if ($o.subjects -and $o.specific) { return @{ raw = $r; tree = $o } } } catch {} }; "  read failed (try " + $t + ") - retrying"; Start-Sleep -Seconds 5 }; return $null }
# Puts each category's newest sets (the white two-panel "II" sets) FIRST in the catalog, so the category's
# cover - which is the first picture of its first set - becomes a white split card. Nothing added or removed.
# Then rebuilds the covers (BROWSE). Draws nothing, costs nothing.
$got = Read-Tree
if (-not $got) { "COULD NOT READ THE CATALOG - nothing written, run the block again" } else {
$tt = $got.tree
$backup = Join-Path $env:TEMP ("card-tree-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
[System.IO.File]::WriteAllText($backup, $got.raw, (New-Object System.Text.UTF8Encoding $false))
"  backup of the catalog saved first: " + $backup
$beforeCats = @($tt.subjects.PSObject.Properties).Count
$bad = $false
foreach ($c in @("Colour Realism", "Neo-Traditional", "Dark Ornamental")) {
  $had = @($tt.subjects.$c | ? { $_ })
  $newer = @($had | ? { $_.StartsWith($c + " II ") })
  $older = @($had | ? { -not $_.StartsWith($c + " II ") })
  $now = @($newer + $older)
  if ($now.Count -ne $had.Count -or $newer.Count -eq 0) { "  STOP - " + $c + " did not add up, nothing written"; $bad = $true; continue }
  $tt.subjects.$c = $now
  "  " + $c + ": " + $newer.Count + " new sets moved to the front, " + $older.Count + " older after them (" + $now.Count + " in all)"
}
$json = $tt | ConvertTo-Json -Depth 20 -Compress
$check = $json | ConvertFrom-Json
$afterCats = @($check.subjects.PSObject.Properties).Count
if ($bad -or $afterCats -ne $beforeCats -or $json.Length -lt ($got.raw.Length * 0.98)) { "  SAFETY STOP - nothing written" } else {
  $tmp = Join-Path $env:TEMP "card-tree-new.json"
  [System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding $false))
  npx wrangler kv key put --namespace-id $ns "card:tree" --path $tmp --remote 2>$null | Out-Null
  "  catalog written in ONE save: " + $beforeCats + " categories before, " + $afterCats + " after - waiting 70 seconds"
  Start-Sleep -Seconds 70
  for ($i = 1; $i -le 12; $i++) { $o = (RUN "BROWSE" | Out-String); if ($o -match '"remaining":\s*0') { "  covers rebuilt"; break } else { "  BROWSE pass " + $i + " - more to do" } }
  $idx = (npx wrangler kv key get --namespace-id $ns "browse:v1:index" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
  foreach ($it in $idx.items) { if (@("Colour Realism","Neo-Traditional","Dark Ornamental","Biomechanical","Metalwork") -contains $it.label) { "  cover " + $it.label + ": " + $it.image } }
}
}
