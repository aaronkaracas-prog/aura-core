param([Parameter(Mandatory=$true)][string]$Path)
$raw = Get-Content -Raw -Encoding utf8 $Path
$raw = $raw -replace "(`r`n|`r)", "`n"
$raw = ($raw -split "`n") | ForEach-Object {
  $_ -replace '^\s*>>\s?', '' -replace '^\s*>\s?', ''
} | ForEach-Object { $_.TrimEnd() }
$out = ($raw | Where-Object { $_ -ne $null }) -join "`n"
Set-Content -Encoding utf8 -NoNewline -Path $Path -Value $out