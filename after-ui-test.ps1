# after-ui-test.ps1 - run this right after a UI test. Nothing is spent: it only reads logs and builds a page.
# Usage (from aura-core):  .\after-ui-test.ps1            (looks at the last 30 minutes)
#                          .\after-ui-test.ps1 -Minutes 60
# It finds your latest test by itself, prints every turn in order with the exact words sent to the image
# model and the pictures that went in and came back, the artist-file lines, and opens one page with every picture.
param([int]$Minutes = 30)

$end = Get-Date
$start = $end.AddMinutes(-$Minutes)
if ($start.Date -ne $end.Date) { $start = $end.Date }
$from = $start.ToString('yyyy-MM-dd HH:mm')
$to = $end.ToString('HH:mm')

$lg = (RUN "LOGS $from $to core turns" | Out-String) | ConvertFrom-Json
$lines = @($lg.payload.log)
$turnLines = @($lines | Where-Object { $_ -match '\[TURN\] ' -and $_ -match 'who=pta_' })
if (-not $turnLines.Count) { Write-Host "STOPPED: no test turns found in the last $Minutes minutes. Try: .\after-ui-test.ps1 -Minutes 60"; return }
$pta = ([regex]::Match([string]($turnLines | Select-Object -Last 1), 'who=(pta_[a-z0-9]+)')).Groups[1].Value
$mine = @($lines | Where-Object { $_ -match $pta })

Write-Host ""
Write-Host ("===== YOUR TEST | person: " + $pta + " | " + $from + " to " + $to)
Write-Host ""
Write-Host "===== EVERY TURN, IN ORDER"
foreach ($l in $mine) { Write-Host $l; Write-Host "" }

$pics = @(); $orig = $null
foreach ($l in $mine) {
  if ($l -notmatch '\[TURN:PICTURE\] sent:') { continue }
  $made = ([regex]::Match($l, 'made (https://\S+)')).Groups[1].Value
  $p1 = ([regex]::Match($l, 'picture 1: (ent_[a-z0-9]+)')).Groups[1].Value
  $p2 = ([regex]::Match($l, 'picture 2: (https://\S+)')).Groups[1].Value
  $words = ([regex]::Match($l, 'sent: "([^"]*)')).Groups[1].Value
  if (-not $orig -and $p1) { $orig = $p1 }
  if ($made) { $pics += ,@($words, $made, $p2) }
}

Write-Host "===== ARTIST FILES (from the full logs)"
$all = (RUN "LOGS $from $to core" | Out-String) | ConvertFrom-Json
$files = @(@($all.payload.log) | Where-Object { $_ -match '\[FILES\]|\[PRINT' })
if ($files.Count) { foreach ($f in $files) { Write-Host $f } } else { Write-Host "(none in this window - not locked in yet, or the files are still being made)" }
$nwLine = [string](@($files | Where-Object { $_ -match 'new work sheet' }) | Select-Object -Last 1)
$newWork = $(if ($nwLine) { ([regex]::Match($nwLine, 'came back: (https://\S+)')).Groups[1].Value } else { $null })

$origUrl = $null
if ($orig) { $origUrl = [string]((RUN ("IMAGE LIFE " + $orig) | Out-String) | ConvertFrom-Json).payload.image.image_url }

$html = "<html><body style='background:#111;color:#eee;font-family:sans-serif;margin:10px'><h2>Test " + $pta + " (" + $from + " to " + $to + ")</h2><div style='display:flex;flex-wrap:wrap;gap:10px'>"
if ($origUrl) { $html += "<div style='width:380px'><b>THEIR PHOTO</b><br><img src='" + $origUrl + "' style='width:380px'></div>" }
$n = 1
foreach ($p in $pics) {
  $label = "PICTURE " + $n + $(if ($p[2]) { " (with a second picture)" } else { "" })
  $html += "<div style='width:380px'><b>" + $label + "</b><br><img src='" + $p[1] + "' style='width:380px'><div style='font-size:11px;color:#aaa'>" + [System.Net.WebUtility]::HtmlEncode($p[0]) + "</div></div>"
  $n++
}
if ($newWork) { $html += "<div style='width:380px'><b>ARTIST FILE - NEW WORK</b><br><img src='" + $newWork + "' style='width:380px'></div>" }
$html += "</div></body></html>"
$page = Join-Path $env:TEMP "after-ui-test.html"
[IO.File]::WriteAllText($page, $html, (New-Object System.Text.UTF8Encoding $false))
Start-Process $page
Write-Host ""
Write-Host ("===== PAGE OPENED: " + $page + " | pictures: " + $pics.Count + $(if ($newWork) { " + new-work file" } else { "" }))
