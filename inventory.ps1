cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$raw = npx wrangler kv key get --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
if (-not $tt.subjects) { "COULD NOT READ THE CATALOG - run the block again" } else {
$new = @('Tribal','Minimalist','Blackwork','Hyperrealism','Cyber-Realism','Dark Ornamental','Meme Tattoos','Surrealism','Horror Surrealism','1970s Horror Poster','Medieval','Medieval Marginalia','Stained Glass','Animals & Pets','Dotwork','Chicano','New School','Sketch','Ornamental','Colour Realism','Dark Romantic','Dark Surrealism','Pin-Up Girls','Geometric','Watercolour','Illustrative','Woodcut','Renaissance','Etching','1990s Nostalgia','1980s Airbrush','Cyberpunk','Pastel','Pop of Colour','Abstract Blackwork','3D / Optical','Glass Effect','Bio-Organic')
$rows = foreach ($p in $tt.subjects.PSObject.Properties) {
  $kinds = @($p.Value); $n = 0
  foreach ($k in $kinds) { $n += @($tt.specific.$k).Count }
  [pscustomobject]@{ tag = $(if ($new -contains $p.Name) { 'REBUILT' } else { 'other' }); category = $p.Name; kinds = $kinds.Count; designs = $n; first_kind = $kinds[0] }
}
"== " + @($rows).Count + " categories in the catalog =="
$rows | Sort-Object tag, category | Format-Table -AutoSize | Out-String -Width 220
}
