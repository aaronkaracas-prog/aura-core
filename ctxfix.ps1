cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$tt = $null; for ($t = 1; $t -le 4 -and -not $tt; $t++) { try { $o = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json; if ($o.subjects) { $tt = $o } } catch {}; if (-not $tt) { Start-Sleep -Seconds 5 } }
if (-not $tt) { "COULD NOT READ THE CATALOG - run the block again" } else {
$split = @('Zodiac','Astrology and Birth Charts','Birthstones','Charms and Keepsakes','Food and Drink','Gaming','Movies and TV','Insects and Butterflies','Symbols and Talismans','Warriors','Family','Science','Things I Love','Geometric and Patterns','Abstract Art','Witchy and Occult','Western','Fun','Ignorant Doodle','Holidays','Embroidered Tattoos','1970s Horror Poster','1980s Airbrush','1990s Nostalgia','3D / Optical','Abstract Blackwork','Bio-Organic','Cyber-Realism','Cyberpunk','Dark Ornamental','Dark Romantic','Dark Surrealism','Etching','Glass Effect','Horror Surrealism','Hyperrealism','Medieval Marginalia','Medieval','Meme Tattoos','Pastel','Pop of Colour','Renaissance','Stained Glass','Surrealism','Woodcut')
$flat = @('Sports','Where I''m From','Memorials','Kids Art','Cars','Motorcycles')
$own = @{}; $isCat = @{}
foreach ($c in ($split + $flat)) { $own["context:" + (& $slug $c)] = $c; $isCat["context:" + (& $slug $c)] = 1; foreach ($k in @($tt.subjects.$c)) { if ($k) { $own["context:" + (& $slug $k)] = $k } } }
$keys = @($own.Keys)
"== looking for leftover style words on " + $keys.Count + " categories and sets =="
$hit = @{}
$tmp = Join-Path $env:TEMP "aura-ctx-keys.json"
for ($i = 0; $i -lt $keys.Count; $i += 100) {
  $chunk = $keys[$i..([Math]::Min($i+99,$keys.Count-1))]
  ConvertTo-Json @($chunk) | Set-Content -Path $tmp -Encoding utf8
  $out = $null; for ($t = 1; $t -le 3 -and -not $out; $t++) { $o = (npx wrangler kv bulk get $tmp --namespace-id $ns --remote 2>$null | Out-String); if ($o -match "context:") { $out = $o } else { Start-Sleep -Seconds 5 } }
  if (-not $out) { "  NO ANSWER for one batch - run the block again"; continue }
  [regex]::Matches($out, '"(context:[^"]+)":\s*"((?:[^"\\]|\\.)*)"') | % { $hit[$_.Groups[1].Value] = $_.Groups[2].Value }
}
Remove-Item $tmp -ErrorAction SilentlyContinue
if ($hit.Count -eq 0) { "  none found - every set is clean" }
$redo = @()
foreach ($h in $hit.Keys) {
  "  removed " + $h + " (" + $own[$h] + "): " + $hit[$h]
  npx wrangler kv key delete --namespace-id $ns $h --remote 2>$null | Out-Null
  if ($isCat.ContainsKey($h)) { "    ^ this is a whole category - not redrawing it automatically, tell Claude" }
  elseif ($flat | ? { @($tt.subjects.$_) -contains $own[$h] }) { "    ^ flat set - tell Claude" }
  else { $redo += @($tt.specific.($own[$h]) | ? { $_ }) }
}
if ($redo.Count -gt 0) {
  "== waiting 70 seconds, then redrawing the " + $redo.Count + " cards that were drawn with the leftover words =="
  Start-Sleep -Seconds 70
  for ($i = 0; $i -lt $redo.Count; $i += 5) {
    $r = (RUN ("REDO " + (($redo[$i..([Math]::Min($i+4,$redo.Count-1))]) -join ", ")) | Out-String)
    [regex]::Matches($r, '"([^"]+)  ->  (https://[^"]+|FAILED[^"]{0,60})"') | % { if ($_.Groups[2].Value -like "FAILED*") { "  FAILED  " + $_.Groups[1].Value } else { "  ok  " + $_.Groups[1].Value } }
  }
}
"== done =="
}
