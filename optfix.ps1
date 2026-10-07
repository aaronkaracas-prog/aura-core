cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$raw = npx wrangler kv key get --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
if (-not $tt.specific) { "COULD NOT READ THE CATALOG - nothing written, run the block again" } else {
$new = @($tt.specific.'3D Optical Style Large Pieces' | % { if ($_ -eq 'Skin rip chest piece') { 'Clockwork gears chest piece' } else { $_ } })
if ($new.Count -ne 10) { "  wrong count - nothing written" } else {
RUN ("LEAVES 3D Optical Style Large Pieces :: " + ($new -join ", ")) | Out-Null
RUN "SETKV build:clockwork-gears-chest-piece The tattoo: clockwork gears chest piece. 3D optical illusion tattoo, strong realistic depth and shading so it looks like it pops out of or sinks into the skin, cast shadows and highlights, mind bending perspective, designed like work from a top modern tattoo artist, no letters, no words, no brand names, no logos. In the right panel it is across his chest, shirtless" | Out-Null
RUN "REDO Clockwork gears chest piece"
}
}
Get-Content .\final.ps1 -Raw | Invoke-Expression
