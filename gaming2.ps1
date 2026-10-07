cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
"== every style-word setting whose name starts with context:gaming =="
$found = @((npx wrangler kv key list --namespace-id $ns --prefix "context:gaming" --remote 2>$null | Out-String | ConvertFrom-Json) | % { $_.name })
if ($found.Count -eq 0) { "  none - Gaming is clean" } else { foreach ($f in $found) { "  found " + $f + " - deleting"; npx wrangler kv key delete --namespace-id $ns $f --remote 2>$null | Out-Null }; "  waiting 70 seconds"; Start-Sleep -Seconds 70 }
$tt = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json
$all = @(); foreach ($k in @($tt.subjects.Gaming)) { $all += @($tt.specific.$k | ? { $_ }) }
"== redrawing one Gaming card first to prove it is clean =="
$r = (RUN ("REDO " + $all[0]) | Out-String)
$from = ([regex]::Match($r, '"style_from":\["[^"]*::\s*([^"]+)"')).Groups[1].Value
"  " + $all[0] + "  ->  " + ([regex]::Match($r, '(https://auras\.guide/image/[a-z0-9_]+)')).Groups[1].Value
"  style came from: " + $from
if ($r -match "COLOUR REALISM" -or $from -match "styled by") { "== STILL GETTING LEFTOVER WORDS - stopped, send this to Claude ==" } else {
"== clean - redrawing the other " + ($all.Count - 1) + " Gaming cards =="
for ($i = 1; $i -lt $all.Count; $i += 5) {
  $r = (RUN ("REDO " + (($all[$i..([Math]::Min($i+4,$all.Count-1))]) -join ", ")) | Out-String)
  if ($r -match "COLOUR REALISM") { "  WARNING: this batch still had the leftover words" }
  [regex]::Matches($r, '"([^"]+)  ->  (https://[^"]+|FAILED[^"]{0,60})"') | % { if ($_.Groups[2].Value -like "FAILED*") { "  FAILED  " + $_.Groups[1].Value } else { "  ok  " + $_.Groups[1].Value } }
}
RUN "SHEET Gaming"
}
