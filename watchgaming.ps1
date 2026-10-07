cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
function Ctx { (npx wrangler kv key get --namespace-id $ns "context:gaming" --remote 2>$null | Out-String).Trim() }
"== right now context:gaming = [" + (Ctx) + "]"
npx wrangler kv key delete --namespace-id $ns "context:gaming" --remote
"== deleted - reading it back every 60 seconds for 5 minutes to see if something writes it again =="
$back = $false
for ($m = 0; $m -le 5; $m++) {
  if ($m -gt 0) { Start-Sleep -Seconds 60 }
  $v = Ctx
  if ($v -and $v -notmatch "Value not found" -and $v -notmatch "not found") { "  minute " + $m + ": IT IS BACK: " + $v; $back = $true; break } else { "  minute " + $m + ": gone" }
}
if ($back) { "== something keeps writing context:gaming - NOT redrawing, send this to Claude ==" } else {
"== stayed gone - redrawing all of Gaming clean =="
$tt = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json
$all = @(); foreach ($k in @($tt.subjects.Gaming)) { $all += @($tt.specific.$k | ? { $_ }) }
"  " + $all.Count + " cards"
for ($i = 0; $i -lt $all.Count; $i += 5) {
  $r = (RUN ("REDO " + (($all[$i..([Math]::Min($i+4,$all.Count-1))]) -join ", ")) | Out-String)
  if ($i -eq 0) { "  first batch was drawn with: " + ([regex]::Match($r, 'In the right panel it is ([^.]+)\.')).Groups[1].Value }
  [regex]::Matches($r, '"([^"]+)  ->  (https://[^"]+|FAILED[^"]{0,60})"') | % { if ($_.Groups[2].Value -like "FAILED*") { "  FAILED  " + $_.Groups[1].Value } else { "  ok  " + $_.Groups[1].Value } }
}
RUN "SHEET Gaming"
}
