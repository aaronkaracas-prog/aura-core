cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Adds today's new designs (Neo-Traditional II, Dark Ornamental II, Biomechanical, Heavy Blackwork, Blackout,
# Dark Fantasy, Brutalism, Japanese Fusion, Mixed Media, Metalwork) to the Imagine It subject lists.
# Nothing already in a list is removed or moved; the new designs go at the FRONT. Each list is backed up first.
# Draws nothing, costs nothing.
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$utf8 = New-Object System.Text.UTF8Encoding $false
$add = ConvertFrom-Json -InputObject (Get-Content ".\subj-add.json" -Raw)
$bk = Join-Path (Get-Location) ("subject-backup-" + (Get-Date -Format "yyyyMMdd-HHmm"))
New-Item -ItemType Directory -Path $bk -Force | Out-Null
foreach ($p in $add.PSObject.Properties) {
  $k = "subject:" + $p.Name
  $raw = (npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-String).Trim()
  if (-not $raw.StartsWith("[")) { "  SKIPPED " + $k + " - could not read it"; continue }
  [IO.File]::WriteAllText((Join-Path $bk ($p.Name + ".json")), $raw, $utf8)
  $old = @(ConvertFrom-Json -InputObject $raw)
  if ($old.Count -eq 1 -and $old[0] -is [array] -and $old[0].Count -gt 3) { $old = $old[0] }
  $have = @{}; foreach ($r in $old) { $have[[string]$r[0]] = 1 }
  $new = @($p.Value | ? { -not $have.ContainsKey([string]$_[0]) })
  if ($new.Count -eq 0) { "  " + $k + " - nothing new (" + $old.Count + ")"; continue }
  $all = @($new) + @($old)
  $parts = foreach ($r in $all) { '[' + (($r | % { ConvertTo-Json ([string]$_) -Compress }) -join ',') + ']' }
  $json = '[' + ($parts -join ',') + ']'
  $tmp = Join-Path $env:TEMP ("aura-" + $p.Name + ".json")
  [IO.File]::WriteAllText($tmp, $json, $utf8)
  npx wrangler kv key put --namespace-id $ns $k --path $tmp --remote 2>$null | Out-Null
  $chk = (npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-String).Trim()
  $c2 = @(ConvertFrom-Json -InputObject $chk); if ($c2.Count -eq 1 -and $c2[0] -is [array] -and $c2[0].Count -gt 3) { $c2 = $c2[0] }; $n2 = $c2.Count
  "  " + $k + ": " + $old.Count + " + " + $new.Count + " new = " + $n2 + $(if ($n2 -eq $old.Count + $new.Count) { "  OK" } else { "  CHECK - count is off" })
}
"backups saved in " + $bk
