# Puts the new phone page live. Save mt-shell.html into the aura-host folder first.
cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-host"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"; $k = "page:mytattoo.world/_shell_mt_shell"
$h = (Get-FileHash .\mt-shell.html -Algorithm SHA256).Hash
if ($h -ne "01AF3EF2BECF330C4A4CE3DEF8A82945045FF69B0C888539DE94D760640A94DA") { "== mt-shell.html is not the new one (" + $h + ") - NOTHING WRITTEN ==" } else {
  $bak = Join-Path $env:TEMP ("mt-shell-backup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".html")
  npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-File -FilePath $bak -Encoding utf8
  "  old page backed up to " + $bak
  npx wrangler kv key put --namespace-id $ns $k --path .\mt-shell.html --remote 2>$null | Out-Null
  $back = (npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-String)
  if ($back -match "THE CATEGORY USES THE WHOLE SCREEN") { "== new page is live - open it on your phone ==" } else { "== the read-back does not show the new page - send me this ==" }
}
