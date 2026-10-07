cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$cats = @('Tribal','Minimalist','Blackwork','Hyperrealism','Cyber-Realism','Dark Ornamental','Meme Tattoos','Surrealism','Horror Surrealism','1970s Horror Poster','Medieval','Medieval Marginalia','Stained Glass','Animals & Pets','Dotwork','Chicano','New School','Sketch','Ornamental','Colour Realism','Dark Romantic','Dark Surrealism','Pin-Up Girls','Geometric','Watercolour','Illustrative','Woodcut','Renaissance','Etching','1990s Nostalgia','1980s Airbrush','Cyberpunk','Pastel','Pop of Colour','Abstract Blackwork','3D / Optical','Glass Effect','Bio-Organic')
"== FINAL CHECK - " + $cats.Count + " categories =="
$short = @()
foreach ($c in $cats) {
  $o = (RUN ("SHEET " + $c) | Out-String)
  $d = [regex]::Match($o, '"drawn":(\d+)').Groups[1].Value
  $l = [regex]::Match($o, '"leaves":(\d+)').Groups[1].Value
  if (-not $l) { $line = "  ??  " + $c + "  - no answer, check this one"; $short += $c }
  elseif ($d -ne $l) { $line = "  !!  " + $c + "  " + $d + " of " + $l; $short += $c }
  else { $line = "  ok  " + $c + "  " + $d + " of " + $l }
  $line
}
"== " + ($cats.Count - $short.Count) + " fully drawn, " + $short.Count + " need a look =="
$short | % { "  NEEDS A LOOK: " + $_ }
"== orphan audit =="
Get-Content .\audit.ps1 -Raw | Invoke-Expression
