cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$names = @('Unknown Language','The Visitor''s Mark','Forbidden Character','The Lost Alphabet','Signal from Europa','The Silent Emissary','Glyph of Origin','The Untranslated','Beyond Human','Neural Core','Chrome Parasite','Synthetic Spine','Cybernetic Seed','The Living Circuit','Xeno-Armor Fragment','Mechanical Bloom','The Artificial Organ','Chrome Tendril','Machine Symbiote','Orbital Glyphs','Solar Cipher','The Ninth Orbit','Planetary Lock','Satellite Shrine','Black Hole Diagram','Three Worlds','The Orbit Breaker','Celestial Coordinates','Interstellar Key','Lunar Alignment','Stellar Mark','Eclipse Engine','The Blue Comet','Twin Moons Protocol','Supernova Code','The Cosmic Gate','Redshift','The Void Compass','Astral Frequency','Celestial Flow','Liquid Signal','The Floating Serpent','Gravity Ribbon','Alien Current','The Unfolding Form','Orbiting Tendrils','The Phase Shift','Violet Passage','The Infinite Organism','Signal Tower','First Transmission','Deep Space Ping','The Unknown Frequency','Beacon 7','Dead Channel','Echo from Titan','The Listening Device','Signal Lost','Universal Frequency','Fractured Hex','Quantum Lattice','The Black Prism','Triad Protocol','Dimensional Fracture','The Infinite Polygon','Obsidian Grid','Vector Ghost','The Fractal Gate','Zero Point','The Visitor''s Crown','Xeno Division','The Starborn Emblem','Void Guardian','The Forgotten Species','Quantum Order','The Exile Mark','Dark Matter Seal','The Cosmic Nomad','The Last Colony','Tiny Visitor','Micro Eclipse','The Hidden Star','Alien Apostrophe','Mini Orbital','The Quiet Signal','Pocket Dimension','Blue Nova','The Micro Glyph','Zero Signal','The Dimensional Key','The Living Portal','The Alien Eye Engine','The Time Fracture','The Star Eater','The Invisible Architecture','The Cosmic Scar','The Alien Crown Circuit','The Parallel Self','The Unknown Universe')
$tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json)
$have = @{}; foreach ($k in @($tree.subjects.'Cyberpunk and Alien Symbols')) { foreach ($n in @($tree.specific.$k)) { $have[$n.ToLower()] = $n } }
RUN "SETKV config:source:redo:model gpt-image-2" | Out-Null
"  REDO model set to gpt-image-2 for this set - waiting 70 seconds..."
Start-Sleep -Seconds 70
$i = 0; $ok = 0; $bad = @()
foreach ($n in $names) { $i++
  $nm = $n; foreach ($h in $have.Values) { if ($h -eq $n -or $h -eq ($n + " in Cyberpunk and Alien Symbols Style")) { $nm = $h } }
  $r = (RUN ("REDO " + $nm) | Out-String)
  if ($r -match '"image":"(https://[^"]+)"') { $ok++; "  " + $i + "/99 " + $nm + " -> " + $matches[1] } else { $bad += $nm; "  " + $i + "/99 " + $nm + " -> NOT DRAWN: " + ($r.Substring(0, [Math]::Min(200, $r.Length))) }
}
"== drawn: " + $ok + " of 99 =="
if ($bad.Count) { "== not drawn - send me this list ==" ; $bad }
$old = ""; $f = Join-Path (Get-Location) "redo-model-before.txt"; if (Test-Path $f) { $old = (Get-Content $f -Raw).Trim() }
if ($old) { RUN ("SETKV config:source:redo:model " + $old) | Out-Null; "  the REDO model is back to " + $old } else { RUN "DELKV config:source:redo:model" | Out-Null; "  the REDO model setting is back to empty (the default)" }
