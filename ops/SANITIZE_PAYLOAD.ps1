param(
  [Parameter(Mandatory=$true)][string]$InFile,
  [Parameter(Mandatory=$true)][string]$OutFile
)

# Read as raw to preserve newlines
$raw = Get-Content -Raw -Encoding utf8 $InFile

# Strip common prompt artifacts at line starts:
# - ">> " (PS continuation prompt)
# - "PS C:\...> " (full prompt)
# - leading ">" variations
$lines = $raw -split "`r?`n"

$clean = foreach ($l in $lines) {
  $x = $l
  $x = $x -replace '^\s*>>\s*', ''          # continuation marker
  $x = $x -replace '^\s*PS\s+.*?>\s*', ''   # full prompt line
  $x = $x -replace '^\s*>\s*', ''           # single >
  $x
}

($clean -join "`n") | Set-Content -Encoding utf8 -NoNewline $OutFile