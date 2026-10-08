cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
Get-Job | Stop-Job; Get-Job | Remove-Job
# ONE job, one step at a time. Each draw step only draws what is missing.
Start-Job -Name "aura-finish" -ArgumentList $PROFILE, (Get-Location).Path -ScriptBlock { param($p, $d) . $p; Set-Location $d
  $steps = @(
    # styles already saved right - draw what is missing
    ".\draw-new-school.ps1", ".\draw-geometric.ps1", ".\draw-watercolour.ps1",
    # the 4 off-track styles + Dotwork + Skulls: save in the new order (each redraws its #01), then draw the rest
    ".\build-pets.ps1", ".\draw-pets.ps1",
    ".\build-animals.ps1", ".\draw-animals.ps1",
    ".\build-colour-realism.ps1", ".\draw-colour-realism.ps1",
    ".\build-sketch.ps1", ".\draw-sketch.ps1",
    ".\build-dotwork.ps1", ".\draw-dotwork.ps1",
    ".\build-skulls.ps1", ".\draw-skulls.ps1",
    # small gaps in the earlier styles, then the refused cards with their fallback placements
    ".\draw-tribal.ps1", ".\draw-cybersigilism.ps1", ".\draw-fine-line-florals.ps1", ".\draw-y2k-nostalgia.ps1",
    ".\draw-liquid-chrome.ps1", ".\draw-red-ink.ps1", ".\draw-fine-line.ps1", ".\draw-black-grey-realism.ps1", ".\draw-illustrative.ps1",
    ".\fix5.ps1", ".\browse.ps1")
  foreach ($f in $steps) { "##### " + $f; if (Test-Path $f) { Get-Content $f -Raw | Invoke-Expression } else { "  FILE NOT FOUND - skipped" } } } | Out-Null
Get-Job | Select-Object Name, State
