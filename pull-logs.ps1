param([string]$Root = $PSScriptRoot, [string]$Prof = $PROFILE)
# pull-logs.ps1 (2026-11-06) - every 2 minutes, saves the last 3 minutes of aura-core and aura-think logs into
# <aura-core>\logs\ so Claude can read them without asking you to run LOGS.
# It uses RUN from your own PowerShell profile, so the operator token never leaves this machine.
# Pulling logs reads Cloudflare only - no model is called, it costs nothing.
#
# Start it, in the PowerShell window you already have open (it runs in the background, no new window):
#   Start-Job -Name AuraLogs -FilePath .\pull-logs.ps1 -ArgumentList $PWD.Path, $PROFILE
# Check it:   Get-Job AuraLogs
# Stop it:    Stop-Job AuraLogs; Remove-Job AuraLogs
# It also stops when you close this PowerShell window. Files older than one day are deleted.

. $Prof
$dir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

while ($true) {
  try {
    $now = Get-Date
    $start = $now.AddMinutes(-3)
    # A window that crosses midnight is skipped - LOGS reads one day at a time.
    if ($start.Date -eq $now.Date) {
      $day = $now.ToString('yyyy-MM-dd')
      $from = $start.ToString('HH:mm')
      $to = $now.ToString('HH:mm')
      $stamp = $now.ToString('yyyyMMdd-HHmm')
      foreach ($w in 'core', 'think') {
        $out = RUN "LOGS $day $from $to $w" *>&1 | Out-String
        Set-Content -Encoding utf8 -Path (Join-Path $dir "$w-$stamp.json") -Value $out
      }
    }
    Get-ChildItem $dir -File -Filter '*.json' | Where-Object { $_.LastWriteTime -lt $now.AddDays(-1) } | Remove-Item -ErrorAction SilentlyContinue
  } catch {
    Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + ' ' + $_)
  }
  Start-Sleep -Seconds 120
}
