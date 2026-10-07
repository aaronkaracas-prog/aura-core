cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$cats = @('Medieval','Animals & Pets','Dark Romantic','Pin-Up Girls','Etching','Abstract Blackwork','3D / Optical')
foreach ($c in $cats) {
  "== " + $c + " =="
  $o = (RUN ("WALK " + $c) | Out-String)
  $m = [regex]::Match($o, '"missing":\[(.*?)\]')
  if (-not $m.Success) { "  NO ANSWER - first part of what came back:"; "  " + $o.Substring(0, [Math]::Min(300, $o.Length)); continue }
  $names = @([regex]::Matches($m.Groups[1].Value, '"([^"]+)"') | % { $_.Groups[1].Value })
  if ($names.Count -eq 0) { "  nothing missing"; continue }
  $names | % { "  missing: " + $_ }
  for ($i = 0; $i -lt $names.Count; $i += 2) {
    $r = (RUN ("REDO " + (($names[$i..([Math]::Min($i+1,$names.Count-1))]) -join ", ")) | Out-String)
    [regex]::Matches($r, '"([^"]+)  ->  (https://[^"]+|FAILED[^"]{0,60})"') | % { "    " + $_.Groups[1].Value + "  ->  " + $_.Groups[2].Value }
  }
}
