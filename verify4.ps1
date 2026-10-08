cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Checks the 4 styles WITHOUT rebuilding: right file on disk, then ONE test card through the real batch path (REDO),
# then the exact words REDO sent must start with the two-panel sentence. Only then PASSED. About 8 cents.
Remove-Item .\passed-*.flag -ErrorAction SilentlyContinue
$gReport = @()
"##### Personal Story"
$gHash = (Get-FileHash ".\build-personal-story.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
if ($gHash -ne "65C043318FB3DA51D4A040C32657A6C89C2AD3520FA9AA44C1CFECEBB87FC9AF") { "  STOPPED - build-personal-story.ps1 is not the file Claude sent"; $gReport += "Personal Story: STOPPED - wrong file" } else {
  $gOut = (RUN 'REDO A childhood house sits at the bottom of an enormous ancient tree whose roots descend beneath it like an underground second world. Small fragments of childhood are almost hidden inside the root system rather than arranged around the house as symbols' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-personal-story.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Personal Story: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; if (-not $gUrl) { "  no picture came back: " + $gOut.Substring(0,[Math]::Min(300,$gOut.Length)) }; $gReport += "Personal Story: FAILED" } }
"##### Pin-Up Girls"
$gHash = (Get-FileHash ".\build-pin-up-girls.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
if ($gHash -ne "668B433EBC6F632DCE054A364CD0B4E5A591577B26B358D80C3C7290CC00CBA7") { "  STOPPED - build-pin-up-girls.ps1 is not the file Claude sent"; $gReport += "Pin-Up Girls: STOPPED - wrong file" } else {
  $gOut = (RUN 'REDO A classic sailor woman sits confidently on an enormous ship anchor but the treatment is elevated with sweeping windblown hair rolling ocean and dramatic sunset light rather than simple vintage flash' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-pin-up-girls.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Pin-Up Girls: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; if (-not $gUrl) { "  no picture came back: " + $gOut.Substring(0,[Math]::Min(300,$gOut.Length)) }; $gReport += "Pin-Up Girls: FAILED" } }
"##### Colour Realism"
$gHash = (Get-FileHash ".\build-colour-realism-2.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
if ($gHash -ne "92124EBC81303A062B115031F1AA8D24E763C59034BEE12CF9C2C80537F110EF") { "  STOPPED - build-colour-realism-2.ps1 is not the file Claude sent"; $gReport += "Colour Realism: STOPPED - wrong file" } else {
  $gOut = (RUN 'REDO A cluster of blackberries covered in cold morning condensation. Individual berries shift from deep purple-black to ruby and blue where window light passes across their wet surfaces' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone")) { Set-Content -Path ".\passed-colour-realism-2.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Colour Realism: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; if (-not $gUrl) { "  no picture came back: " + $gOut.Substring(0,[Math]::Min(300,$gOut.Length)) }; $gReport += "Colour Realism: FAILED" } }
"##### Matching Tattoos"
$gHash = (Get-FileHash ".\build-matching.ps1" -Algorithm SHA256 -ErrorAction SilentlyContinue).Hash
if ($gHash -ne "C45BB9F179A5AB8E69976C17F49DA0A87B537911E14B18FDEECAEE08F3DA768A") { "  STOPPED - build-matching.ps1 is not the file Claude sent"; $gReport += "Matching Tattoos: STOPPED - wrong file" } else {
  $gOut = (RUN 'REDO Ornamental moth and exact same ornamental moth' | Out-String)
  $gUrl = [regex]::Match($gOut, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $gSent = [regex]::Match($gOut, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($gUrl -and $gSent.StartsWith("Two panels side by side on one image, divided down the middle. LEFT PANEL: both tattoo designs")) { Set-Content -Path ".\passed-matching.flag" -Value $gUrl; "  PASSED - real batch path sent the two-panel words first"; "  look at it: " + $gUrl; $gReport += ("Matching Tattoos: PASSED  " + $gUrl) }
  else { "  FAILED - words sent began: " + $gSent; if (-not $gUrl) { "  no picture came back: " + $gOut.Substring(0,[Math]::Min(300,$gOut.Length)) }; $gReport += "Matching Tattoos: FAILED" } }
""
"== RESULT =="
$gReport
