cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
Get-Job -Name "aura-draw-*" | Select-Object Name, State
foreach ($j in @("aura-draw-nt2","aura-draw-six-1","aura-draw-six-2")) { if (Get-Job -Name $j -ErrorAction SilentlyContinue) { "== " + $j + " - last lines =="; Receive-Job -Name $j -Keep | Select-Object -Last 6 | % { $s = "$_"; if ($s.Length -gt 160) { $s.Substring(0,160) + " ..." } else { $s } } } }
