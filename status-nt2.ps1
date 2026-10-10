cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
Get-Job -Name "aura-draw-nt2" | Select-Object Name, State
"== last lines =="
Receive-Job -Name "aura-draw-nt2" -Keep | Select-Object -Last 8 | % { $s = "$_"; if ($s.Length -gt 220) { $s.Substring(0,220) + " ..." } else { $s } }
