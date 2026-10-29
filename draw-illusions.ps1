cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$sets = @('Optical Illusions Broken Reality','Optical Illusions Infinite Depth','Optical Illusions Hidden Images','Optical Illusions Anamorphic Illusions','Optical Illusions Surreal Portraits','Optical Illusions Reality Glitch','Optical Illusions Geometric Illusions','Optical Illusions Folding Skin','Optical Illusions 3D Objects','Optical Illusions Portals Double Exposure and Body Alignment','Material Illusions Embroidery and Thread','Material Illusions Liquid Metal and Chrome','Material Illusions Glass and Crystal','Material Illusions Stone and Marble','Material Illusions Wood and Natural Materials','Material Illusions Denim Leather and Fabric','Material Illusions Jewelry and Precious Gems','Material Illusions Paper Origami and Print','Material Illusions Ceramic Porcelain and Enamel','Material Illusions Mixed Materials and Unexpected Textures')
$skip = @('Galaxy Beneath the Skin','The Floating Cube','The Embroidered Butterfly','The Liquid Chrome Rose','Galaxy Beneath the Skin in Optical Illusions Style','The Floating Cube in Optical Illusions Style','The Embroidered Butterfly in Material Illusions Style','The Liquid Chrome Rose in Material Illusions Style')
$tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json)
$names = @(); foreach ($k in $sets) { foreach ($n in @($tree.specific.$k)) { if ($n -and ($skip -notcontains $n)) { $names += $n } } }
"  " + $names.Count + " designs to draw (the four test cards are already drawn)"
if ($names.Count -lt 196) { "  STOP - expected 196, the catalog read came back short - run the block again" } else {
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
