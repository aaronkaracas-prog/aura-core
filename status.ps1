cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
Get-Job | Select-Object Name, State
"== steps finished or running =="
Receive-Job -Name "aura-draw4" -Keep | ? { "$_" -like "#####*" } | % { "  " + "$_" }
"== last lines =="
Receive-Job -Name "aura-draw4" -Keep | Select-Object -Last 6 | % { $s = "$_"; if ($s.Length -gt 220) { $s.Substring(0,220) + " ..." } else { $s } }
