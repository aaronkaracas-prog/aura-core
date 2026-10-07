cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$slug = { param($x) (($x.ToLower() -replace '[^a-z0-9]+','-').Trim('-')) }
$raw = npx wrangler kv key get --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
if (-not $tt.specific) { "COULD NOT READ THE CATALOG - nothing written, run the block again" } else {
$new = @($tt.specific.'Pop of Colour Style Mythical' | % { if ($_ -eq 'Black and grey mermaid with a teal tail') { 'Black and grey mermaid tail with teal scales' } else { $_ } })
if ($new.Count -ne 10) { "  wrong count - nothing written" } else {
RUN ("LEAVES Pop of Colour Style Mythical :: " + ($new -join ", ")) | Out-Null
RUN "SETKV build:black-and-grey-mermaid-tail-with-teal-scales The tattoo: black and grey mermaid tail with teal scales. Pop of colour tattoo, the whole design in smooth black and grey realism shading, with only one small part in a single bright colour as a striking accent, everything else stays black and grey, high contrast, designed like work from a top modern tattoo artist, no letters, no words, no brand names, no logos. In the right panel it is on the side of his thigh, wearing shorts" | Out-Null
RUN "REDO Black and grey mermaid tail with teal scales"
RUN "SHEET Pop of Colour"
}
}
