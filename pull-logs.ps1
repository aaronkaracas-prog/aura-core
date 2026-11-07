param([string]$Root = $PSScriptRoot, [string]$Prof = $PROFILE)
# pull-logs.ps1 (2026-11-06, one minute at a time, each minute twice) - saves each minute of aura-core and aura-think logs into
# <aura-core>\logs\ so Claude can read them without asking you to run LOGS.
# ONE MINUTE: Cloudflare hands back at most 1,000 lines per ask; a 3-minute window during a test held more (15:58).
# TWICE: a turn runs as a job, and a job's lines only arrive when it ends, 90-140s after it starts (16:44: the first pull of
# that minute had none of them). Each minute is pulled 20s after it ends and again ~4 minutes later; the later pull replaces it.
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
    foreach ($back in 1, 5) {
      $m = (Get-Date).AddMinutes(-$back)
      $day = $m.ToString('yyyy-MM-dd'); $hm = $m.ToString('HH:mm'); $stamp = $m.ToString('yyyyMMdd-HHmm')
      foreach ($w in 'core', 'think') {
        $out = RUN "LOGS $day $hm $hm $w" *>&1 | Out-String
        Set-Content -Encoding utf8 -Path (Join-Path $dir "$w-$stamp.json") -Value $out
      }
    }
    Get-ChildItem $dir -File -Filter '*.json' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -ErrorAction SilentlyContinue
  } catch {
    Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + ' ' + $_)
  }
}
