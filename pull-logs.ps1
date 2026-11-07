param([string]$Root = $PSScriptRoot, [string]$Prof = $PROFILE)
# pull-logs.ps1 (2026-11-06, one minute at a time) - once a minute, saves the minute that just ended, for aura-core and aura-think,
# into <aura-core>\logs\ so Claude can read them without asking you to run LOGS.
# WHY ONE MINUTE: Cloudflare hands back at most 1,000 log lines per ask; a 3-minute window during a test held more and its first
# lines were cut (15:58). One finished minute is asked for exactly once, 20 seconds after it ends.
# Uses RUN from your PowerShell profile - the operator token never leaves this machine. Reads Cloudflare only; costs nothing.
# Restart: Stop-Job AuraLogs; Remove-Job AuraLogs; Start-Job -Name AuraLogs -FilePath .\pull-logs.ps1 -ArgumentList $PWD.Path, $PROFILE
. $Prof
$dir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
while ($true) {
  $now = Get-Date
  $next = $now.Date.AddHours($now.Hour).AddMinutes($now.Minute + 1).AddSeconds(20)
  Start-Sleep -Milliseconds ([int][Math]::Max(1000, ($next - (Get-Date)).TotalMilliseconds))
  try {
    $m = (Get-Date).AddMinutes(-1)
    $day = $m.ToString('yyyy-MM-dd'); $hm = $m.ToString('HH:mm'); $stamp = $m.ToString('yyyyMMdd-HHmm')
    foreach ($w in 'core', 'think') {
      $out = RUN "LOGS $day $hm $hm $w" *>&1 | Out-String
      Set-Content -Encoding utf8 -Path (Join-Path $dir "$w-$stamp.json") -Value $out
    }
    Get-ChildItem $dir -File -Filter '*.json' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -ErrorAction SilentlyContinue
  } catch {
    Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + ' ' + $_)
  }
}
