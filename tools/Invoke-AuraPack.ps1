function Invoke-AuraPack {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory=$true)][string]$HostName,
    [Parameter(Mandatory=$true)][string]$PayloadPath,
    [int]$ConnectTimeoutSec = 5,
    [int]$MaxTimeSec = 20,
    [int]$Retry = 2,
    [int]$RetryDelaySec = 2,
    [string]$OperatorToken = $env:AURA_OPERATOR_TOKEN
  )

  if (!(Test-Path $PayloadPath)) { throw "Payload file not found: $PayloadPath" }

  $uri = "https://$HostName/chat"

  $curlArgs = @(
    "--silent",
    "--connect-timeout", "$ConnectTimeoutSec",
    "--max-time", "$MaxTimeSec",
    "--retry", "$Retry",
    "--retry-delay", "$RetryDelaySec",
    "--retry-connrefused",
    "-X", "POST",
    $uri,
    "--data-binary", "@$PayloadPath",
    "-H", "Content-Type: text/plain; charset=utf-8"
  )

  # Operator header (only if token present)
  if ($OperatorToken -and $OperatorToken.Trim().Length -gt 0) {
    $curlArgs += "-H"
    $curlArgs += ("X-Operator-Token: " + $OperatorToken.Trim())
  }

  $oldEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  $lines = @()
  $lines += (& curl.exe @curlArgs 2>&1 | ForEach-Object { "$_" })
  $exit = $LASTEXITCODE

  $ErrorActionPreference = $oldEap

  return [pscustomobject]@{
    ExitCode = $exit
    Output   = ($lines -join "`n")
  }
}
