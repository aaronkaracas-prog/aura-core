cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$sets = @('Good vs Evil Faces of Duality','Good vs Evil Animals of Light and Dark','Good vs Evil Angels and Demons','Good vs Evil Sacred and Corrupted','Good vs Evil Heaven and Hell','Good vs Evil Creation and Destruction','Good vs Evil Life and Death','Good vs Evil Temptation and Redemption','Good vs Evil The Struggle Within','Good vs Evil Mythic Dualities','Sick and Twisted Uncanny Portraits','Sick and Twisted Dolls and Puppets','Sick and Twisted Grotesque Botanicals','Sick and Twisted Impossible Anatomy','Sick and Twisted The Uninvited','Sick and Twisted Dark Fairy Tales','Sick and Twisted Sacred Horror','Sick and Twisted Nightmare Creatures','Sick and Twisted Beautiful Decay','Sick and Twisted Twisted Dreams','What The Fuck Best Life Animals','What The Fuck Food Creatures','What The Fuck Trash Royalty','What The Fuck Space Nonsense','What The Fuck Dark Comedy','What The Fuck Objects Alive','What The Fuck Wrong Scale','What The Fuck Mind Melts','What The Fuck Visual Puns','What The Fuck Beautiful Nonsense')
$skip = @('The Two Faces','The Doll','Shark Cowboy','The Two Faces in Good vs Evil Style','The Doll in Sick and Twisted Style','Shark Cowboy in What The Fuck Style')
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
