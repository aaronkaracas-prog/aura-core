cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Builds each style (in its own scope so nothing collides), then ONE test card through the real batch path,
# and checks the exact words sent. PASSED styles get a flag; drawpassed2 draws only those.
$gReport = @()
"##### Pets II"
Remove-Item ".\passed-pets-2.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-pets-2.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "37EC1A95F7E46322067CE740B83C922E2461A0CB3C7FB434ED5429C6D018D376") { "  STOPPED - build-pets-2.ps1 is not the file Claude sent"; $gReport += "Pets II: STOPPED - wrong file" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-pets-2.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A black Labrador waits at the front door with a leash already in its mouth ears lifted and tail caught mid-wag. Soft Black and Grey Realism keeps the dog sharp while the door and floor fade quickly into skin' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-pets-2.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Pets II: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; $gReport += "Pets II: FAILED" } }
"##### Animals II"
Remove-Item ".\passed-animals-2.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-animals-2.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "BB737AC8FEA1D32831AAEC7F19711067A3FAFB2F885F56EC5C1BE36D2C19E1A4") { "  STOPPED - build-animals-2.ps1 is not the file Claude sent"; $gReport += "Animals II: STOPPED - wrong file" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-animals-2.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A great horned owl sits on a dead branch under a full moon ear tufts raised and eyes glowing amber. Black and Grey Realism with the moon left as bare skin' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-animals-2.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Animals II: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; $gReport += "Animals II: FAILED" } }
"##### Sketch II"
Remove-Item ".\passed-sketch-2.flag" -ErrorAction SilentlyContinue
if ((Get-FileHash ".\build-sketch-2.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash -ne "1B8EFEC2C25F531DD1E3B878B14AE8305319007029253CFEAA6A5A162C690CD4") { "  STOPPED - build-sketch-2.ps1 is not the file Claude sent"; $gReport += "Sketch II: STOPPED - wrong file" } else {
  "  file check OK - building (about 7 minutes)"
  $gOut = (& { Get-Content ".\build-sketch-2.ps1" -Raw | Invoke-Expression } | Out-String)
  $gOut -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $gOut = (RUN 'REDO A crow lands on a branch drawn from six quick overlapping gesture positions with only the final head and beak resolved in dark confident ink' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-sketch-2.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Sketch II: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; $gReport += "Sketch II: FAILED" } }
""
"== RESULT =="
$gReport
