cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$tt = $null; for ($t = 1; $t -le 4 -and -not $tt; $t++) { $r = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim(); if ($r.StartsWith("{")) { try { $tt = $r | ConvertFrom-Json } catch {} }; if (-not $tt) { Start-Sleep -Seconds 5 } }
if (-not $tt) { "COULD NOT READ THE CATALOG - run again" } else {
$rows = [ordered]@{}
$rows['Trending'] = @('Neo-Tribal','Cybersigilism','Patchwork','Embroidered Tattoos','Sticker Tattoos','Ignorant Doodle','Micro Realism','Micro Tattoos','Fine-Line Florals','Y2K Nostalgia','Liquid Chrome','Organic Body Flow','Red Ink','Negative Space','Bows & Ribbons','Birth Month Flowers','Stained Glass','Renaissance')
$rows['Styles'] = @('Fine Line','Realism','Hyperrealism','Black & Grey Realism','Colour Realism','Minimalist','American Traditional','Neo-Traditional Bold Illustrated','Neo-Traditional','Japanese','Blackwork','Illustrative','Watercolour','Geometric','Dotwork','Ornamental','Chicano','Surrealism','Sketch','Etching','New School','3D / Optical','Tribal')
$rows['Explore Styles'] = @('Woodcut','Cyberpunk','Cyber-Realism','Glass Effect','Pastel','Pop of Colour','Bio-Organic','Dark Romantic','Dark Ornamental','Dark Surrealism','Horror Surrealism','Medieval','Medieval Marginalia','1970s Horror Poster','1980s Airbrush','1990s Nostalgia','Abstract Blackwork','Meme Tattoos')
$rows['More to Explore'] = @('Horror','Music','Cannabis Culture','Western','Witchy and Occult','Animals & Pets','Family','Memorials','Kids Art','Birthstones','Charms and Keepsakes','Matching Tattoos','Insects and Butterflies','Skulls & Skeletons','Zodiac','Astrology and Birth Charts','Symbols and Talismans','Cars','Motorcycles','Gaming','Movies and TV','Sports','Food and Drink','Holidays','Pin-Up Girls','Portraits','Warriors','Science','Where I''m From','Lettering & Quotes','Fun','Abstract Art','Geometric and Patterns','Things I Love','Personal Story')
$want = @{}
foreach ($r in $rows.Keys) { foreach ($c in $rows[$r]) { $ks = @($tt.subjects.$c); foreach ($k in $ks) { if ($k) { $want["split:" + (& $slug $k)] = 1 } } } }
$keys = @($want.Keys); $yes = @{}
for ($i = 0; $i -lt $keys.Count; $i += 100) {
  $part = $keys[$i..([Math]::Min($i+99, $keys.Count-1))]
  $tmp = Join-Path $env:TEMP "aura-split-audit.json"; ConvertTo-Json @($part) | Set-Content -Path $tmp -Encoding utf8
  $out = (npx wrangler kv bulk get $tmp --namespace-id $ns --remote 2>$null | Out-String)
  foreach ($m in [regex]::Matches($out, '"(split:[^"]+)":\s*"yes"')) { $yes[$m.Groups[1].Value] = 1 }
}
$flat = @(); $part2 = @(); $missing = @()
foreach ($r in $rows.Keys) { "== " + $r + " =="; foreach ($c in $rows[$r]) {
  $ks = @($tt.subjects.$c | ? { $_ })
  if (-not $ks.Count) { "  NOT IN CATALOG  " + $c; $missing += $c; continue }
  $n = @($ks | ? { $yes.ContainsKey("split:" + (& $slug $_)) }).Count
  if ($n -eq $ks.Count) { $tag = "white+body" } elseif ($n -eq 0) { $tag = "WHITE ONLY"; $flat += ($r + ": " + $c) } else { $tag = "MIXED " + $n + " of " + $ks.Count + " sets"; $part2 += ($r + ": " + $c) }
  "  " + $tag.PadRight(22) + $c
} }
"" ; "== NO BODY CARDS (" + $flat.Count + ") =="; $flat
"== MIXED (" + $part2.Count + ") =="; $part2
"== NOT FOUND IN CATALOG (" + $missing.Count + ") =="; $missing
}
