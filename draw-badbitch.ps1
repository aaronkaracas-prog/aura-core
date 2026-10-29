cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Bad Bitch 100
$sets = @('Bad Bitch Queens Without Permission','Bad Bitch Dangerous Beauty','Bad Bitch Women Who Survive','Bad Bitch The Unruly','Bad Bitch Dark Goddesses and Mythic Women','Bad Bitch Wild Creatures','Bad Bitch Ornamental Armor and Luxury Darkness','Bad Bitch Surreal and Unforgettable','Bad Bitch Glamour Grit and Attitude','Bad Bitch Original Icons')
$skip = @()
$first = @()
$tree = $null; for ($t = 1; $t -le 4 -and -not $tree; $t++) { try { $tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json) } catch { Start-Sleep -Seconds 5 } }
$names = @($first); foreach ($k in $sets) { foreach ($n in @($tree.specific.$k)) { if ($n -and ($skip -notcontains $n)) { $names += $n } } }
"  " + $names.Count + " designs to draw"
if ($names.Count -lt 100) { "  STOP - expected 100, the catalog read came back short (has the build finished?) - run the block again" } else {
RUN "SETKV config:source:redo:model gpt-image-2" | Out-Null
"  REDO model set to gpt-image-2 - waiting 70 seconds..."
Start-Sleep -Seconds 70
$i = 0; $ok = 0; $bad = @(); $tot = $names.Count
foreach ($nm in $names) { $i++
  $done = $false
  for ($try = 1; $try -le 2 -and -not $done; $try++) {
    $r = (RUN ("REDO " + $nm) | Out-String)
    if ($r -match '->  (https://[^"]+)"') { $ok++; $done = $true; "  " + $i + "/" + $tot + " " + $nm + " -> " + $matches[1] }
  }
  if (-not $done) { $bad += $nm; "  " + $i + "/" + $tot + " " + $nm + " -> NOT DRAWN (twice): " + ($r.Substring(0, [Math]::Min(300, $r.Length))) }
}
"== drawn: " + $ok + " of " + $tot + " =="
if ($bad.Count) { "== not drawn - send me this list ==" ; $bad }
"  the REDO model stays on gpt-image-2 (what it was before)"
}
