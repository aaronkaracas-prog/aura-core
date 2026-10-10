cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Metalwork. Nothing else may be building at the same time (both write the catalog).
$passed = @()
"##### Metalwork"
Remove-Item ".\passed-metalwork.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-metalwork.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "4FAC90624A3E63A8DF1CA8290CD46C444966C8D6F976E950F7D62CE8166ED801") { "  STOPPED - build-metalwork.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-metalwork.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A wolf head sculpted from overlapping pieces of blackened forged steel hammered imperfections visible across the surface sharp silver edge highlights and tiny warm gold details around the eyes' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-metalwork.flag" -Value $gUrl; $passed += "metalwork"; "  PASSED - look at it: " + $gUrl } else { "  FAILED - nothing will be drawn for this one. Words sent began: " + $gSent }
}

if ($passed.Count -gt 0) { Start-Job -Name "aura-draw-metal" -ArgumentList $PROFILE, (Get-Location).Path, $passed -ScriptBlock { param($p, $d, $list) . $p; Set-Location $d; foreach ($o in $list) { "##### draw-" + $o; Get-Content (".\draw-" + $o + ".ps1") -Raw | Invoke-Expression } } | Out-Null; "  drawing in the background: " + ($passed -join ", ") }
"  passed: " + $passed.Count + " of 1"
Get-Job | Select-Object Name, State
