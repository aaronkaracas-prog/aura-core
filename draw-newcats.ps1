cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$sets = @('Universe Within Human Universes','Universe Within Cosmic Creatures','Universe Within Worlds Within Objects','Universe Within Hidden Worlds','Universe Within Cosmic Nature','Universe Within Living Anatomy','Universe Within Impossible Realities','Universe Within Time and Transformation','Universe Within Emotional Universes','Universe Within New Ideas','Impossible Fusion Human x Animal','Impossible Fusion Life x Death','Impossible Fusion Water x Fire','Impossible Fusion Nature x Machine','Impossible Fusion Human x Landscape','Impossible Fusion Animal x Architecture','Impossible Fusion Human x Plant','Impossible Fusion Sun x Moon','Impossible Fusion Organic x Mechanical','Impossible Fusion Human x Mythical','Impossible Fusion Unexpected','Hidden Within Faces Within Faces','Hidden Within Animals Within Animals','Hidden Within Love and Connection','Hidden Within Skulls and the Cycle of Life','Hidden Within Nature Hiding Other Worlds','Hidden Within Water Sky and Cosmos','Hidden Within Objects with Secret Identities','Hidden Within Impossible Architecture and Illusions','Hidden Within Transformations','Hidden Within Unexpected Discoveries')
$skip = @('Dreaming Galaxy','The Iron Lion','Wolf Within','Dreaming Galaxy in Universe Within Style','The Iron Lion in Impossible Fusion Style','Wolf Within in Hidden Within Style')
$tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json)
$names = @(); foreach ($k in $sets) { foreach ($n in @($tree.specific.$k)) { if ($n -and ($skip -notcontains $n)) { $names += $n } } }
"  " + $names.Count + " designs to draw (the three test cards are already drawn)"
if ($names.Count -lt 290) { "  STOP - expected 297, the catalog read came back short - run the block again" } else {
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
