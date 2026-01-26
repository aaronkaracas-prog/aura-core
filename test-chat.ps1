param(
  [string]$Url = "https://aura-core-staging.aaronkaracas.workers.dev/chat",
  [string]$Text = "ping"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$payloadPath = Join-Path $PSScriptRoot "chat_payload.json"

[System.IO.File]::WriteAllText($payloadPath, ('{"type":"text","input":"' + ($Text -replace '"','\"') + '"}'), $utf8NoBom)

curl.exe -s -X POST "$Url" -H "Content-Type: application/json" --data-binary "@$payloadPath"