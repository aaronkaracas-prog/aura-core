cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
"== what is still running in this window before we start =="
Get-Job | Select-Object Name, State
Remove-Item .\ready-*.flag -ErrorAction SilentlyContinue
Get-Job | ? { $_.State -ne "Running" } | Remove-Job

# 1. The 7 new styles, rebuilt with the proven order (layout, design, placement, GPT style). One after another in ONE job,
#    because each build rewrites the catalog. After each build a ready flag lets its batch start.
Start-Job -Name "aura-builds" -ArgumentList $PROFILE, (Get-Location).Path -ScriptBlock { param($p, $d) . $p; Set-Location $d
  foreach ($s in "geometric", "dotwork", "new-school", "colour-realism", "pets", "sketch", "animals") {
    "##### build-" + $s; Get-Content (".\build-" + $s + ".ps1") -Raw | Invoke-Expression
    Set-Content -Path (".\ready-" + $s + ".flag") -Value "done" } } | Out-Null

# 2. Two batch jobs. Each one waits for its style's build to finish, then draws all 100.
foreach ($pair in @(@("aura-draws-a", @("geometric", "new-school", "pets", "animals")), @("aura-draws-b", @("dotwork", "colour-realism", "sketch")))) {
  Start-Job -Name $pair[0] -ArgumentList $PROFILE, (Get-Location).Path, $pair[1] -ScriptBlock { param($p, $d, $list) . $p; Set-Location $d
    foreach ($s in $list) {
      while (-not (Test-Path (".\ready-" + $s + ".flag"))) { Start-Sleep -Seconds 30 }
      "##### draw-" + $s; Get-Content (".\draw-" + $s + ".ps1") -Raw | Invoke-Expression } } | Out-Null }

# 3. The earlier approved styles - finishes any design still missing its card (each draw skips what is already done).
Start-Job -Name "aura-draws-c" -ArgumentList $PROFILE, (Get-Location).Path -ScriptBlock { param($p, $d) . $p; Set-Location $d
  foreach ($s in "realism", "black-grey-realism", "american-traditional", "japanese", "watercolour", "illustrative", "chicano") {
    "##### draw-" + $s; Get-Content (".\draw-" + $s + ".ps1") -Raw | Invoke-Expression } } | Out-Null

"== started =="
Get-Job | Select-Object Name, State
