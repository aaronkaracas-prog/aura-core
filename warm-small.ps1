cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Makes the small copies ahead of time for every picture the page shows first - the 41 style cards, home rows, Tell me / Show me,
# the job cards - and the catalogue's own covers. Each one is made once and kept; running this again only reads them.
$page = (Invoke-WebRequest "https://mytattoo.world/?v=warm$(Get-Random)" -UseBasicParsing).Content
$ids = @{}
[regex]::Matches($page, 'img_[A-Za-z0-9]{10,16}') | % { $ids[$_.Value] = 1 }
try {
  $idx = Invoke-RestMethod -Method Post -Uri "https://mytattoo.world/_design" -ContentType "application/json" -Body '{"action":"catalog"}'
  if ($idx.items) { $idx.items | % { if ($_.image -match 'img_[A-Za-z0-9]+') { $ids[$matches[0]] = 1 } } }
} catch { "  (the catalogue list did not come back - only the page's own pictures this time)" }
"  " + $ids.Count + " pictures to make small copies of"
$made = 0; $kept = 0; $miss = 0; $i = 0; $t0 = Get-Date; $missed = @()
foreach ($id in $ids.Keys) { $i++
  try {
    $r = Invoke-WebRequest ("https://auras.guide/image/" + $id + "?w=480") -UseBasicParsing
    $h = $r.Headers["x-small-copy"]
    if ($h -eq "made") { $made++ } elseif ($h -eq "kept") { $kept++ } else { $miss++; $missed += ($id + "  ->  " + $r.StatusCode + " " + $r.Headers["content-type"] + ", " + $r.RawContentLength + " bytes") }
  } catch { $miss++; $missed += ($id + "  ->  " + $_.Exception.Message) }
  if ($i % 25 -eq 0) { "  " + $i + " of " + $ids.Count + " done" }
}
"== small copies: " + $made + " made now, " + $kept + " already there, " + $miss + " not made (served full size) - " + [int]((Get-Date) - $t0).TotalSeconds + "s =="
if ($missed.Count) { "== not made - send me these lines ==" ; $missed }
