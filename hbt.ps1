$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$tt = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json
$all = @($tt.specific."Horror Body Transformation" | ? { $_ })
"== redrawing the " + $all.Count + " Horror Body Transformation cards (their split setting was missing when they drew) =="
for ($i = 0; $i -lt $all.Count; $i += 5) {
  $r = (RUN ("REDO " + (($all[$i..([Math]::Min($i+4,$all.Count-1))]) -join ", ")) | Out-String)
  if ($i -eq 0) { "  first one: ..." + ([regex]::Match($r, '(In the right panel it is [^.]+\. Two panels)')).Groups[1].Value }
  [regex]::Matches($r, '"([^"]+)  ->  (https://[^"]+|FAILED[^"]{0,60})"') | % { "  " + $(if ($_.Groups[2].Value -like "FAILED*") { "FAILED" } else { "ok" }) + "  " + $_.Groups[1].Value }
}
