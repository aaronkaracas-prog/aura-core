cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Makes the small copies for EVERY picture in the catalogue, not only what the front page shows.
# 1. Re-banks the Explore index so the new categories have their covers (draws nothing).
# 2. Lists every category, every set cover and every card through the same door the page uses.
# 3. Asks for each picture at the widths the page shows it: cards at 480 (rows) and 720 (the big grid), covers at 480.
#    Eight at a time. A copy already made is only read back, so running this again is quick and harmless.
"== 1. the Explore index =="
for ($p = 1; $p -le 15; $p++) {
  $o = ((RUN "BROWSE" | Out-String) | ConvertFrom-Json).payload
  "  pass " + $p + ": " + $o.banked + " of " + $o.categories + " categories banked, " + $o.with_cover + " with a cover, " + $o.remaining + " left"
  if ($o.no_cover -and $o.no_cover.Count) { "  no cover yet: " + ($o.no_cover -join ", ") }
  if (-not $o.remaining) { break }
}
"== 2. listing every picture =="
$door = "https://mytattoo.world/_design"
$ask = { param($body) try { Invoke-RestMethod -Method Post -Uri $door -ContentType "application/json" -Body ($body | ConvertTo-Json -Compress) -TimeoutSec 120 } catch { $null } }
$idOf = { param($u) if ([string]$u -match '(img_[A-Za-z0-9]+)') { $matches[1] } else { $null } }
$want = @{}
$add = { param($id, $w) if ($id) { $want[$id + "|" + $w] = 1 } }
$front = & $ask @{ action = "catalog" }
$cats = @($front.items | % { $_.label } | ? { $_ })
"  " + $cats.Count + " categories"
foreach ($it in $front.items) { & $add (& $idOf $it.image) 480 }
$page = (Invoke-WebRequest "https://mytattoo.world/?v=warm$(Get-Random)" -UseBasicParsing).Content
[regex]::Matches($page, 'img_[a-z0-9]{12}\b') | % { & $add $_.Value 480 }
$n = 0
foreach ($c in $cats) { $n++
  $k = & $ask @{ action = "catalog"; category = $c }
  foreach ($it in @($k.items)) { & $add (& $idOf $it.image) 480 }
  $a = & $ask @{ action = "catalog"; category = $c; all = $true }
  foreach ($it in @($a.items)) { $i0 = & $idOf $it.image; & $add $i0 480; & $add $i0 720 }
  if ($n % 20 -eq 0) { "  listed " + $n + " of " + $cats.Count + " categories - " + $want.Count + " copies to check so far" }
}
$jobs = @($want.Keys)
"  " + $jobs.Count + " copies to check (each picture at the widths the page shows it)"
"== 3. making the copies, eight at a time =="
Add-Type -AssemblyName System.Net.Http
$hc = New-Object System.Net.Http.HttpClient
$hc.Timeout = [TimeSpan]::FromSeconds(120)
$made = 0; $kept = 0; $miss = 0; $missed = @(); $t0 = Get-Date
for ($i = 0; $i -lt $jobs.Count; $i += 8) {
  $batch = @($jobs[$i..([Math]::Min($i + 7, $jobs.Count - 1))])
  $tasks = @($batch | % { $bits = $_.Split("|"); $hc.GetAsync("https://auras.guide/image/" + $bits[0] + "?w=" + $bits[1], [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead) })
  try { [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$tasks) } catch {}
  for ($j = 0; $j -lt $tasks.Count; $j++) {
    $t = $tasks[$j]
    if ($t.IsFaulted -or $t.IsCanceled) { $miss++; $missed += ($batch[$j] + "  ->  no answer"); continue }
    $r = $t.Result; $v = $null; $vals = $null
    if ($r.Headers.TryGetValues("x-small-copy", [ref]$vals)) { $v = @($vals)[0] }
    if ($v -eq "made") { $made++ } elseif ($v -eq "kept") { $kept++ } else { $miss++; $missed += ($batch[$j] + "  ->  " + [int]$r.StatusCode + " " + $r.Content.Headers.ContentType) }
    $r.Dispose()
  }
  $done = [Math]::Min($i + 8, $jobs.Count)
  if ($done % 200 -lt 8 -or $done -eq $jobs.Count) { $sec = ((Get-Date) - $t0).TotalSeconds; "  " + $done + " of " + $jobs.Count + " - " + [int]$sec + "s so far, about " + [int](($jobs.Count - $done) * $sec / [Math]::Max(1, $done) / 60) + " min left" }
}
$hc.Dispose()
"== small copies: " + $made + " made now, " + $kept + " already there, " + $miss + " not made - " + [int]((Get-Date) - $t0).TotalMinutes + " min =="
if ($missed.Count) { "== not made - send me these lines ==" ; $missed | Select-Object -First 40; if ($missed.Count -gt 40) { "  ... and " + ($missed.Count - 40) + " more" } }
