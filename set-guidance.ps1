cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# ASCII only on purpose: Windows PowerShell reads a script without a BOM as ANSI.
# Puts Aura's updated mytattoo guidance (tattoo-talk-new.txt, saved next to this script) into
# cognition:prompts -> tattoo_talk. Every other saved prompt is left as it is. A backup of the whole
# map is saved first. She picks the new text up within 5 minutes - no deploy. Calls no model, costs nothing.
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $utf8   # read wrangler's output as UTF-8, so no character is mangled
$new = [IO.File]::ReadAllText("$PWD\tattoo-talk-new.txt", $utf8)
if ($new.Length -lt 15000) { "STOPPED - tattoo-talk-new.txt is missing or too short ($($new.Length))"; return }
$raw = (npx wrangler kv key get --namespace-id $ns "cognition:prompts" --remote 2>$null | Out-String).Trim()
if (-not $raw.StartsWith("{")) { "STOPPED - could not read cognition:prompts"; return }
$bk = "$PWD\cognition-prompts-backup-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".json"
[IO.File]::WriteAllText($bk, $raw, $utf8)
$all = $raw | ConvertFrom-Json
$keys = @($all.PSObject.Properties | % { $_.Name })
"prompts in the map: " + $keys.Count + "   (backup: " + $bk + ")"
$old = [string]$all.tattoo_talk
"current tattoo_talk: " + $old.Length + " chars" + $(if ($old.Contains([string][char]0x0393 + [char]0x00C7)) { "  - it has garbled characters, the new text fixes them" } else { "" })
$all | Add-Member -NotePropertyName tattoo_talk -NotePropertyValue $new -Force
$tmp = Join-Path $env:TEMP "aura-cognition-prompts.json"
[IO.File]::WriteAllText($tmp, ($all | ConvertTo-Json -Depth 30 -Compress), $utf8)
npx wrangler kv key put --namespace-id $ns "cognition:prompts" --path $tmp --remote 2>$null | Out-Null
$chk = (npx wrangler kv key get --namespace-id $ns "cognition:prompts" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
$k2 = @($chk.PSObject.Properties | % { $_.Name }).Count
"after: tattoo_talk " + ([string]$chk.tattoo_talk).Length + " chars, prompts in the map: " + $k2 +
  $(if ($k2 -eq $keys.Count -and ([string]$chk.tattoo_talk).StartsWith("YOU TALK LIKE")) { "  OK" } else { "  CHECK - something is off, the backup is above" })
