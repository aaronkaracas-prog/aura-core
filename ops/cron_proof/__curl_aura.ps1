param(
  [Parameter(Mandatory=$true)][string]$Url,
  [Parameter(Mandatory=$true)][string]$PacketPath
)

if (-not (Test-Path -LiteralPath $PacketPath)) { throw "Packet not found: $PacketPath" }

$headers = @("content-type: text/plain")

if ($env:AURA_OPERATOR_TOKEN -and $env:AURA_OPERATOR_TOKEN.Length -gt 0) {
  # CANON: Worker reads x-operator-token
  $headers += ("x-operator-token: " + $env:AURA_OPERATOR_TOKEN)
}

$args = @("-s", $Url)
foreach($h in $headers){ $args += @("-H", $h) }
$args += @("--data-binary", ("@" + $PacketPath))

& curl.exe @args