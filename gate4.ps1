cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# THE GATE. For each style: (1) the file on disk must be EXACTLY the one Claude sent (fingerprint match),
# (2) the build saves it and draws its test card through the REAL batch path (REDO), (3) the exact words
# that REDO sent to the image model must start with the two-panel sentence. Only then is the style marked
# PASSED - and the batch job only draws PASSED styles.
$want = [ordered]@{
  "personal-story"   = @("Personal Story",   "65C043318FB3DA51D4A040C32657A6C89C2AD3520FA9AA44C1CFECEBB87FC9AF", "Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone");
  "pin-up-girls"     = @("Pin-Up Girls",     "668B433EBC6F632DCE054A364CD0B4E5A591577B26B358D80C3C7290CC00CBA7", "Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone");
  "colour-realism-2" = @("Colour Realism",   "92124EBC81303A062B115031F1AA8D24E763C59034BEE12CF9C2C80537F110EF", "Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone");
  "matching"         = @("Matching Tattoos", "C45BB9F179A5AB8E69976C17F49DA0A87B537911E14B18FDEECAEE08F3DA768A", "Two panels side by side on one image, divided down the middle. LEFT PANEL: both tattoo designs") }
Remove-Item .\passed-*.flag -ErrorAction SilentlyContinue
$report = @()
foreach ($s in $want.Keys) {
  $f = ".\build-" + $s + ".ps1"; $name = $want[$s][0]
  "##### " + $name
  if (-not (Test-Path $f)) { "  STOPPED - " + $f + " is not in this folder"; $report += ($name + ": STOPPED - file missing"); continue }
  $h = (Get-FileHash $f -Algorithm SHA256).Hash
  if ($h -ne $want[$s][1]) { "  STOPPED - " + $f + " is NOT the file Claude sent (old copy?) - nothing built"; $report += ($name + ": STOPPED - wrong file"); continue }
  "  file check OK - building (about 7 minutes)"
  $o = (Get-Content $f -Raw | Invoke-Expression | Out-String)
  $o -split "`n" | ? { $_ -match "catalog written|already has|ALREADY IN|SAFETY STOP|STILL SHORT|descriptions saved" } | % { "  " + $_.Trim() }
  $u = [regex]::Match($o, "https://auras\.guide/image/img_[a-z0-9]+").Value
  $sent = [regex]::Match($o, '"asked":\["[^"]*?  ::  (.{0,140})').Groups[1].Value
  if ($u -and $sent.StartsWith($want[$s][2])) {
    Set-Content -Path (".\passed-" + $s + ".flag") -Value $u
    "  PASSED - the real batch path sent the two-panel words first"; "  look at it: " + $u
    $report += ($name + ": PASSED  " + $u)
  } else {
    "  FAILED - words sent began: " + $sent; if (-not $u) { "  (no picture came back)" }
    $report += ($name + ": FAILED")
  }
}
"" ; "== RESULT =="; $report
