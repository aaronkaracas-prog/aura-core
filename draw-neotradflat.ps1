$c = "Neo-Traditional"
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
  "== " + $c + " pass " + $pass + " - drawing " + $names.Count + " missing designs, one at a time =="
  $n = 0
  foreach ($leaf in $names) {
    $n++
    $r = (RUN ("FACE " + $leaf) | Out-String)
    if ($r -match '"img":"img_') { "  " + $n + " ok  " + $leaf } else { "  " + $n + " FAILED  " + $leaf + "  " + [regex]::Match($r, '"why":"([^"]{0,80})').Groups[1].Value }
  }
}
RUN ("SHEET " + $c)
