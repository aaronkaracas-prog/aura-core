cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Two new collections, one after another. Run ONLY after gate-six has finished (both write the catalog).
$passed = @()
"##### Japanese Fusion"
Remove-Item ".\passed-japanese-fusion.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-japanese-fusion.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "11979E82FC9DC3930C3DBDBC450524B6D0580DBFFCD00C10C71B53AF5B7B6F7C") { "  STOPPED - build-japanese-fusion.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-japanese-fusion.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A ferocious black and grey Hannya mask rendered with deep smoky shadows while only the horns and one tear are saturated blood red' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-japanese-fusion.flag" -Value $gUrl; $passed += "japanese-fusion"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
"##### Mixed Media"
Remove-Item ".\passed-mixed-media.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-mixed-media.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "6EEAF84398346D048FFD99F2A064F2902BD5D7A193A2245F825D089CF4174F96") { "  STOPPED - build-mixed-media.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-mixed-media.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A photorealistic tiger emerges through hard black graphic panels while one violent red brushstroke cuts across its eyes and continues beyond the animal' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-mixed-media.flag" -Value $gUrl; $passed += "mixed-media"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}
if ($passed.Count -gt 0) { Start-Job -Name "aura-draw-two" -ArgumentList $PROFILE, (Get-Location).Path, $passed -ScriptBlock { param($p, $d, $list) . $p; Set-Location $d; foreach ($o in $list) { "##### draw-" + $o; Get-Content (".\draw-" + $o + ".ps1") -Raw | Invoke-Expression } } | Out-Null; "  drawing in the background: " + ($passed -join ", ") }
"  passed: " + $passed.Count + " of 2"
Get-Job | Select-Object Name, State
