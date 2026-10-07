cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-host"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$hit = @((npx wrangler kv key list --namespace-id $ns --prefix "page:" --remote 2>$null | Out-String | ConvertFrom-Json) | % { $_.name } | ? { $_ -match "shell" })
"== page keys with shell in the name: " + ($hit -join " | ")
if ($hit.Count -ne 1) { "== not exactly one - NOTHING WRITTEN, send me this line ==" } else {
  $k = $hit[0]
  $bak = Join-Path $env:TEMP ("mt-shell-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".html")
  npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-File -FilePath $bak -Encoding utf8
  "  old page backed up to " + $bak
  npx wrangler kv key put --namespace-id $ns $k --path .\mt-shell.html --remote 2>$null | Out-Null
  $back = (npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-String)
  if ($back -match "EXPLORE STYLES \(2026-10-06") { "== new page is live at " + $k + " - open it on your phone ==" } else { "== the read-back does not show the new page - send me this ==" }
}
