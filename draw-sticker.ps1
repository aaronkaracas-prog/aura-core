$c = "Sticker Tattoos"
$last = ""
for ($pass = 1; $pass -le 8; $pass++) {
  $m = $null
  for ($try = 1; $try -le 4; $try++) { $o = (RUN ("WALK " + $c) | Out-String); $m = [regex]::Match($o, '"missing":\[(.*?)\]'); if ($m.Success) { break }; Start-Sleep -Seconds 15 }
  if (-not $m.Success) { "== " + $c + " - NO ANSWER, run the block again =="; break }
  $names = @([regex]::Matches($m.Groups[1].Value, '"([^"]+)"') | % { $_.Groups[1].Value })
  if ($names.Count -eq 0) { "== " + $c + " - nothing missing =="; break }
  $now = ($names -join "|")
  if ($now -eq $last) { "== " + $c + " - these keep failing, send them to me =="; $names | % { "  " + $_ }; break }
  $last = $now
  "== " + $c + " pass " + $pass + " - drawing " + $names.Count + " missing split cards, 5 at a time =="
  for ($i = 0; $i -lt $names.Count; $i += 5) {
    $r = (RUN ("REDO " + (($names[$i..([Math]::Min($i+4,$names.Count-1))]) -join ", ")) | Out-String)
    [regex]::Matches($r, '"([^"]+)  ->  (https://[^"]+|FAILED[^"]{0,60})"') | % { if ($_.Groups[2].Value -like "FAILED*") { "  FAILED  " + $_.Groups[1].Value } else { "  ok  " + $_.Groups[1].Value } }
  }
}
RUN ("SHEET " + $c)
