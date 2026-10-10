cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Builds the 100 sets into the catalog (ADDED to Neo-Traditional, nothing removed), then ONE card through the
# real batch path and checks the exact words sent. Only if that passes does the drawing start, in the background.
"##### Neo-Traditional II"
Remove-Item ".\passed-neo-traditional-2.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-neo-traditional-2.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "C6524DADACE0DE5E958CB5766AE8E3A457A7ED86648309D12060BB9E77833F9C") { "  STOPPED - build-neo-traditional-2.ps1 is not the file Claude sent" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-neo-traditional-2.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A magnificent tiger head emerging diagonally through sweeping chrysanthemum petals with the tiger breaking beyond the floral composition rather than sitting inside a frame' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) {
    Set-Content -Path ".\passed-neo-traditional-2.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl
    Start-Job -Name "aura-draw-nt2" -ArgumentList $PROFILE, (Get-Location).Path -ScriptBlock { param($p, $d) . $p; Set-Location $d; "##### draw-neo-traditional-2"; Get-Content ".\draw-neo-traditional-2.ps1" -Raw | Invoke-Expression } | Out-Null
    "  drawing the rest in the background - check with the status block"; Get-Job | Select-Object Name, State
  } else { "  FAILED - nothing drawn. Words sent began: " + $gSent }
}
