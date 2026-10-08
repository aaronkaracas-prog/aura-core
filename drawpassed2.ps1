cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Draws ONLY the styles gate3 marked PASSED. One job, one style at a time.
Start-Job -Name "aura-draw3" -ArgumentList $PROFILE, (Get-Location).Path -ScriptBlock { param($p, $d) . $p; Set-Location $d
  foreach ($s in "pets-2", "animals-2", "sketch-2") {
    if (-not (Test-Path (".\passed-" + $s + ".flag"))) { "##### " + $s + " - NOT PASSED, skipped"; continue }
    "##### draw-" + $s; Get-Content (".\draw-" + $s + ".ps1") -Raw | Invoke-Expression } } | Out-Null
Get-Job | Select-Object Name, State
