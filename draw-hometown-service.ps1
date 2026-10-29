cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$sets = @('Hometown Area Code Culture','Hometown ZIP Code Pride','Hometown Neighborhood and Block','Hometown City Pride and Landmarks','Hometown Urban Attitude','Hometown Two Places One Story','Hometown Numbers as Art','Hometown Historical and Cultural Roots','Hometown Playful and Unexpected','Hometown Personal Identity','Service & Sacrifice The Rite of Passage','Service & Sacrifice Brothers and Sisters in Arms','Service & Sacrifice The Deployment','Service & Sacrifice The Fallen','Service & Sacrifice The Homecoming','Service & Sacrifice Branch and Identity','Service & Sacrifice The Family Served Too','Service & Sacrifice Beyond the Uniform','Service & Sacrifice Duty Courage and Conviction','Service & Sacrifice The Personal Service Story')
$skip = @('The Area Code Masterpiece','The Bridge Connection','The City in Engraving','ZIP Code Color Statement','Two Shadows','The Navy Anchor','The Battlefield Cross','The Airport Hug')
$tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json)
$names = @(); foreach ($k in $sets) { foreach ($n in @($tree.specific.$k)) { if ($n -and ($skip -notcontains $n)) { $names += $n } } }
"  " + $names.Count + " designs to draw (the test cards are already drawn)"
if ($names.Count -lt 192) { "  STOP - expected 192, the catalog read came back short - run the block again" } else {
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
