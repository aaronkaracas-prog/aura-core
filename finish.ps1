cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$cats = @('Bio-Organic','Glass Effect')
foreach ($c in $cats) {
  $last = -1
  for ($pass = 1; $pass -le 4; $pass++) {
    $o = (RUN ("WALK " + $c) | Out-String)
    $m = [regex]::Match($o, '"missing":\[(.*?)\]')
    if (-not $m.Success) { "== " + $c + " - NO ANSWER, run the block again =="; break }
    $names = @([regex]::Matches($m.Groups[1].Value, '"([^"]+)"') | % { $_.Groups[1].Value })
    if ($names.Count -eq 0) { "== " + $c + " - nothing missing =="; break }
    if ($names.Count -eq $last) { "== " + $c + " - these keep failing, send them to me =="; $names | % { "  " + $_ }; break }
    $last = $names.Count
    "== " + $c + " pass " + $pass + " - drawing " + $names.Count + " missing cards, 5 at a time =="
    for ($i = 0; $i -lt $names.Count; $i += 5) {
      $r = (RUN ("REDO " + (($names[$i..([Math]::Min($i+4,$names.Count-1))]) -join ", ")) | Out-String)
      [regex]::Matches($r, '"([^"]+)  ->  (FAILED[^"]{0,60})"') | % { "    FAILED: " + $_.Groups[1].Value }
    }
  }
}
Get-Content .\final.ps1 -Raw | Invoke-Expression
