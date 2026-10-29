cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$sets = @('Pets Elegant and Timeless Portraits','Pets Royalty Legends and Heroes','Pets Goofy and Ridiculous','Pets Adventure and Impossible Situations','Pets Beautiful and Artistic Transformations','Pets Love Memory and Personal Connection','Pets Unexpected Pairs and Personality')
$skip = @('The Royal Portrait','The Beach Bum','The Samurai Cat','The Airplane Pilot')
$tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json)
$names = @(); foreach ($k in $sets) { foreach ($n in @($tree.specific.$k)) { if ($n -and ($skip -notcontains $n)) { $names += $n } } }
"  " + $names.Count + " designs to draw (the test cards are already drawn)"
if ($names.Count -lt 96) { "  STOP - expected 96, the catalog read came back short - run the block again" } else {
RUN "SETKV config:source:redo:model gpt-image-2" | Out-Null
"  REDO model set to gpt-image-2 - waiting 70 seconds..."
Start-Sleep -Seconds 70
$i = 0; $ok = 0; $bad = @(); $tot = $names.Count
foreach ($nm in $names) { $i++
  $r = (RUN ("REDO " + $nm) | Out-String)
  if ($r -match '->  (https://[^"]+)"') { $ok++; "  " + $i + "/" + $tot + " " + $nm + " -> " + $matches[1] } else { $bad += $nm; "  " + $i + "/" + $tot + " " + $nm + " -> NOT DRAWN: " + ($r.Substring(0, [Math]::Min(200, $r.Length))) }
}
"== drawn: " + $ok + " of " + $tot + " =="
if ($bad.Count) { "== not drawn - send me this list ==" ; $bad }
$old = ""; $f = Join-Path (Get-Location) "redo-model-before.txt"; if (Test-Path $f) { $old = (Get-Content $f -Raw).Trim() }
if ($old) { RUN ("SETKV config:source:redo:model " + $old) | Out-Null; "  the REDO model is back to " + $old } else { RUN "DELKV config:source:redo:model" | Out-Null; "  the REDO model setting is back to empty (the default)" }
}
