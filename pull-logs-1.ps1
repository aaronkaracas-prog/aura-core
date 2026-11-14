param([string]$Root = $PSScriptRoot, [string]$Prof = $PROFILE)
# pull-logs.ps1 (2026-11-06, one minute at a time, each minute twice; 2026-11-13 an empty pull never overwrites; 2026-11-14 a failed second pull is asked again) - saves each minute of aura-core and aura-think logs into
# <aura-core>\logs\ so Claude can read them without asking you to run LOGS.
# ONE MINUTE: Cloudflare hands back at most 1,000 lines per ask; a 3-minute window during a test held more (15:58).
# TWICE: a turn runs as a job, and a job's lines only arrive when it ends, 90-140s after it starts (16:44: the first pull of
# that minute had none of them). Each minute is pulled 20s after it ends and again ~4 minutes later; the later pull replaces it.
# NO MINUTE SKIPPED (2026-11-08): MEASURED 06:43, 06:46 and 06:47 were missing - a pass that ran long started the next one a minute
# late, and "one minute ago" was then the minute after. Each pull now remembers the last minute it got and catches up every minute
# since (at most 10), for the first pull and the second.
# A SECOND PULL THAT GETS NO ANSWER IS ASKED AGAIN (2026-11-14, Aaron: go): MEASURED 06:47:27 - the second pull of 06:42 got no answer
# (the link to the computer dropped), the first pull was kept, and it held none of change 3's job lines; that minute was never asked again.
# Such a minute now goes on a retry list and is asked again on each of the next passes (at most 10 tries) until an answer comes back.
# Uses RUN from your PowerShell profile - the operator token never leaves this machine. Reads Cloudflare only; costs nothing.
# Restart: Stop-Job AuraLogs; Remove-Job AuraLogs; Start-Job -Name AuraLogs -FilePath .\pull-logs.ps1 -ArgumentList $PWD.Path, $PROFILE
. $Prof
$dir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
function Get-Minute([datetime]$t) { $t.Date.AddHours($t.Hour).AddMinutes($t.Minute) }
function Save-Minute([datetime]$m) {
  $ok = $true
  $day = $m.ToString('yyyy-MM-dd'); $hm = $m.ToString('HH:mm'); $stamp = $m.ToString('yyyyMMdd-HHmm')
  foreach ($w in 'core', 'think') {
    $out = RUN "LOGS $day $hm $hm $w" *>&1 | Out-String
    # NEVER AN EMPTY PULL OVER A GOOD ONE (2026-11-13): MEASURED 13:39-13:41 - the computer slept, the later pull came back empty and wrote
    # over the minutes that held the failed picture turns. A pull with no answer in it is noted in pull-errors.txt and the file is left alone.
    if ($out -notmatch '"cmd"\s*:\s*"LOGS"') {
      Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + " $w-$stamp no answer - kept what was there: " + $out.Trim().Substring(0, [Math]::Min(120, $out.Trim().Length)))
      $ok = $false
      continue
    }
    Set-Content -Encoding utf8 -Path (Join-Path $dir "$w-$stamp.json") -Value $out
  }
  return $ok
}
$first = $null; $second = $null; $retry = @{}
while ($true) {
  $now = Get-Date
  $next = $now.Date.AddHours($now.Hour).AddMinutes($now.Minute + 1).AddSeconds(20)
  Start-Sleep -Milliseconds ([int][Math]::Max(1000, ($next - (Get-Date)).TotalMilliseconds))
  try {
    $cur = Get-Minute (Get-Date)
    $t1 = $cur.AddMinutes(-1); $t5 = $cur.AddMinutes(-5)
    if (-not $first -or ($t1 - $first).TotalMinutes -gt 10) { $first = $t1.AddMinutes(-1) }
    if (-not $second -or ($t5 - $second).TotalMinutes -gt 10) { $second = $t5.AddMinutes(-1) }
    while ($first -lt $t1) { $first = $first.AddMinutes(1); Save-Minute $first }
    while ($second -lt $t5) { $second = $second.AddMinutes(1); if (-not (Save-Minute $second)) { $retry[$second] = 0 } }
    foreach ($m in @($retry.Keys)) {
      if ($m -eq $second) { continue }
      $retry[$m]++
      if (Save-Minute $m) { $retry.Remove($m); Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + ' ' + $m.ToString('yyyyMMdd-HHmm') + ' asked again - answered') }
      elseif ($retry[$m] -ge 10) { $retry.Remove($m); Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + ' ' + $m.ToString('yyyyMMdd-HHmm') + ' asked 10 more times - no answer, given up') }
    }
    Get-ChildItem $dir -File -Filter '*.json' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -ErrorAction SilentlyContinue
  } catch {
    Add-Content -Path (Join-Path $dir 'pull-errors.txt') -Value ((Get-Date).ToString('s') + ' ' + $_)
  }
}
