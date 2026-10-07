cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
"== what the black cat set has right now =="
"  render:witchy-black-cats-and-familiars = " + ((npx wrangler kv key get --namespace-id $ns "render:witchy-black-cats-and-familiars" --remote 2>$null | Out-String).Trim())
"  render:default = " + ((npx wrangler kv key get --namespace-id $ns "render:default" --remote 2>$null | Out-String).Trim())
$tt = $null; for ($t = 1; $t -le 4 -and -not $tt; $t++) { try { $tt = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json } catch { Start-Sleep -Seconds 5 } }
function Keys($p) { $o = @{}; (npx wrangler kv key list --namespace-id $ns --prefix $p --remote 2>$null | Out-String | ConvertFrom-Json) | % { $o[$_.name] = 1 }; $o }
$R = Keys "render:"; $Sh = Keys "shape:"; $Sp = Keys "split:"; $B = Keys "build:"
"== checking every body-card set: " + $R.Count + " render, " + $B.Count + " build settings found =="
$cats = @('Zodiac','Astrology and Birth Charts','Birthstones','Charms and Keepsakes','Food and Drink','Gaming','Movies and TV','Insects and Butterflies','Symbols and Talismans','Warriors','Family','Science','Things I Love','Geometric and Patterns','Abstract Art','Witchy and Occult','Western','Fun','Ignorant Doodle','1970s Horror Poster','1980s Airbrush','1990s Nostalgia','3D / Optical','Abstract Blackwork','Bio-Organic','Cyber-Realism','Cyberpunk','Dark Ornamental','Dark Romantic','Dark Surrealism','Etching','Glass Effect','Horror Surrealism','Hyperrealism','Medieval Marginalia','Medieval','Meme Tattoos','Pastel','Pop of Colour','Renaissance','Stained Glass','Surrealism','Woodcut')
$fixed = 0; $nob = 0
foreach ($c in $cats) {
  $kinds = @($tt.subjects.$c); if ($kinds.Count -eq 0) { "  " + $c + ": NOT IN CATALOG"; continue }
  $miss = @(); $mb = 0
  foreach ($k in $kinds) { $ks = & $slug $k
    if (-not $R.ContainsKey("render:" + $ks)) { $miss += ("render " + $k); RUN ("SETKV render:" + $ks + " Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone on a plain white background, shown flat exactly as described, no body, drawn large so it fills most of the panel. RIGHT PANEL: Studio photograph of a real person's body showing the same exact tattoo where described, healed tattoo on real skin in soft even light, the rest of the body modestly covered by simple plain clothing, only the tattooed area bare, plain seamless light grey studio backdrop - no room, no furniture, no scenery. The tattoo in both panels is identical.") | Out-Null; $fixed++ }
    if (-not $Sh.ContainsKey("shape:" + $ks)) { $miss += ("shape " + $k); RUN ("SETKV shape:" + $ks + " 3:2") | Out-Null; $fixed++ }
    if (-not $Sp.ContainsKey("split:" + $ks)) { $miss += ("split " + $k); RUN ("SETKV split:" + $ks + " yes") | Out-Null; $fixed++ }
    foreach ($l in @($tt.specific.$k | ? { $_ })) { if (-not $B.ContainsKey("build:" + (& $slug $l))) { $mb++; $nob++; "    no description: " + $l } }
  }
  if ($miss.Count -eq 0 -and $mb -eq 0) { "  " + $c + ": all good" } else { "  " + $c + ": fixed " + ($miss -join "; ") + " | leaves with no description: " + $mb }
}
"== " + $fixed + " missing set settings put back, " + $nob + " leaves with no description =="
"  waiting 70 seconds, then redrawing the black cat test..."
Start-Sleep -Seconds 70
RUN "REDO Black cat riding a broom and clearly having absolutely no control over it"
"== then drawing in this window: Geometric and Patterns, then Abstract Art =="
Get-Content .\draw-geo.ps1 -Raw | Invoke-Expression
Get-Content .\draw-abstract.ps1 -Raw | Invoke-Expression
