cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Six new collections, one after another (about 7 minutes each). Each is ADDED to the catalog (nothing removed),
# then ONE card goes through the real batch path and the exact words sent are checked. Only collections that pass are drawn.
$passed = @()
"##### Dark Ornamental"
Remove-Item ".\passed-dark-ornamental-2.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-dark-ornamental-2.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "155D3D4CBC1D9F66CF617083DE50C5A0B5142199CCDDDBB1EE24E2D15A6C04D7") { "  STOPPED - build-dark-ornamental-2.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-dark-ornamental-2.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A towering Gothic cathedral structure built vertically from pointed arches narrow columns and black tracery tapering naturally as it descends' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-dark-ornamental-2.flag" -Value $gUrl; $passed += "dark-ornamental-2"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### Biomechanical"
Remove-Item ".\passed-biomechanical.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-biomechanical.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "191DB2AF1C2116B273F9ADEABBEF55CA805072E680B1D202E142577D6EAB05A6") { "  STOPPED - build-biomechanical.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-biomechanical.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO The shoulder appears partially opened to reveal an intricate titanium ball-and-socket joint surrounded by cables pistons and layered mechanical structures' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-biomechanical.flag" -Value $gUrl; $passed += "biomechanical"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### Heavy Blackwork"
Remove-Item ".\passed-heavy-blackwork.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-heavy-blackwork.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "A848543C7A305EEFB18673626E5FF1C6B734B69EB2617A8D4F0FBEAD7444233D") { "  STOPPED - build-heavy-blackwork.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-heavy-blackwork.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO Enormous sweeping black brush structures explode from shoulder across chest alternating between solid saturation dry-brush texture and untouched skin' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-heavy-blackwork.flag" -Value $gUrl; $passed += "heavy-blackwork"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### Blackout"
Remove-Item ".\passed-blackout.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-blackout.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "32F13DB22ACAA03207923CDF8F1EC9517DF2BFE268ADE3C2AB5C2BD154F94699") { "  STOPPED - build-blackout.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-blackout.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A completely saturated black forearm begins beneath the elbow with an absolutely precise hard edge turning the lower arm into one uninterrupted sculptural black form' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-blackout.flag" -Value $gUrl; $passed += "blackout"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### Dark Fantasy"
Remove-Item ".\passed-dark-fantasy.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-dark-fantasy.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "5A0E2ECE33A53F6ABD3AF78782EEC2C45EEFBE27EBCFD135B1239E0466DCAB4B") { "  STOPPED - build-dark-fantasy.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-dark-fantasy.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A battle-worn knight in shattered black armor walks toward the viewer through a storm of ash while a colossal ruined fortress barely appears behind him' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-dark-fantasy.flag" -Value $gUrl; $passed += "dark-fantasy"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### Brutalism"
Remove-Item ".\passed-brutalism.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-brutalism.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "1A81110731504BFEE8456F9C9001B9FFE5940C796872E2BB7DE3D9ED4ADE1684") { "  STOPPED - build-brutalism.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-brutalism.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO An enormous windowless concrete tower rises vertically along the spine with deep shadow cuts separating massive stacked volumes and one tiny human figure standing at its base' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-brutalism.flag" -Value $gUrl; $passed += "brutalism"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### starting the drawing in the background (two jobs, three collections each)"
$half = [Math]::Ceiling($passed.Count / 2)
$groups = @(@($passed | Select-Object -First $half), @($passed | Select-Object -Skip $half))
$n = 0
foreach ($grp in $groups) { $n++; if ($grp.Count -eq 0) { continue }
  Start-Job -Name ("aura-draw-six-" + $n) -ArgumentList $PROFILE, (Get-Location).Path, $grp -ScriptBlock { param($p, $d, $list) . $p; Set-Location $d; foreach ($o in $list) { "##### draw-" + $o; Get-Content (".\draw-" + $o + ".ps1") -Raw | Invoke-Expression } } | Out-Null
  "  job aura-draw-six-" + $n + ": " + ($grp -join ", ") }
"  passed: " + $passed.Count + " of 6"
Get-Job | Select-Object Name, State
