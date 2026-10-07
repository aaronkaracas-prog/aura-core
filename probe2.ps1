cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$tt = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json
$kf = Join-Path $env:TEMP "aura-probe.json"
foreach ($c in @("Neo-Traditional","Black & Grey Realism","Japanese")) {
  "== " + $c
  $keys = New-Object System.Collections.ArrayList
  $cs = & $slug $c
  foreach ($p in @("context:","render:","frame:category:","shape:","split:")) { [void]$keys.Add($p + $cs) }
  $kinds = @($tt.subjects.$c | ? { $_ })
  foreach ($k in $kinds) { $ks = & $slug $k; foreach ($p in @("context:","render:","shape:","split:")) { [void]$keys.Add($p + $ks) }; foreach ($l in @($tt.specific.$k | ? { $_ })) { [void]$keys.Add("face:v1:" + (& $slug $l)); [void]$keys.Add("build:" + (& $slug $l)) } }
  $res = @{}
  for ($i = 0; $i -lt $keys.Count; $i += 100) { ConvertTo-Json @($keys[$i..([Math]::Min($i+99,$keys.Count-1))]) | Set-Content -Path $kf -Encoding utf8; $o = (npx wrangler kv bulk get $kf --namespace-id $ns --remote 2>$null | Out-String); [regex]::Matches($o, '"([a-z0-9:-]+)":\s*"((?:[^"\\]|\\.)*)"') | % { $res[$_.Groups[1].Value] = $_.Groups[2].Value } }
  "  sets: " + ($kinds -join " | ")
  $res.Keys | ? { $_ -notlike "face:*" -and $_ -notlike "build:*" } | Sort-Object | % { "  " + $_ + " = " + $res[$_].Substring(0,[Math]::Min(220,$res[$_].Length)) }
  $faces = @($res.Keys | ? { $_ -like "face:*" })
  "  drawn: " + $faces.Count + "   descriptions: " + @($res.Keys | ? { $_ -like "build:*" }).Count
  $faces | Select-Object -First 3 | % { "  " + $_ + " = " + $res[$_] }
}
