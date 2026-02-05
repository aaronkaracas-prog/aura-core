$ErrorActionPreference = "Stop"

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($false)))
}

function Aura-Chat([string]$Path, [switch]$WithOperator) {
  $headers = @("content-type: text/plain; charset=utf-8")
  if ($WithOperator) { $headers += "X-Operator-Token: $env:AURA_OP_TOKEN" }
  $h = @()
  foreach ($x in $headers) { $h += @("-H", $x) }
  $args = @("-sS","-X","POST","https://auras.guide/chat") + $h + @("--data-binary","@$Path")
  & curl.exe @args | Out-Host
}

Write-Host "Aura batch runner ready."
Write-Host "Use: Aura-Chat <file> [-WithOperator]"