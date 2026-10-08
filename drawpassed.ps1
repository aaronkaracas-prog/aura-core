cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Draws ONLY the styles gate4 marked PASSED. One job, one style at a time.
Start-Job -Name "aura-draw4" -ArgumentList $PROFILE, (Get-Location).Path -ScriptBlock { param($p, $d) . $p; Set-Location $d
  foreach ($s in "personal-story", "pin-up-girls", "colour-realism-2", "matching") {
    if (-not (Test-Path (".\passed-" + $s + ".flag"))) { "##### " + $s + " - NOT PASSED, skipped"; continue }
    "##### draw-" + $s; Get-Content (".\draw-" + $s + ".ps1") -Raw | Invoke-Expression }
  "##### browse"; Get-Content .\browse.ps1 -Raw | Invoke-Expression } | Out-Null
Get-Job | Select-Object Name, State
