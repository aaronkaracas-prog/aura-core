cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Read-only. Changes nothing, costs nothing.
# 1. Every catalogue set whose name has "push" in it (category | set | designs in it).
# 2. How long the home page cover pictures take to load right now (the white cards).
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$tree = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
"--- SETS WITH PUSH IN THE NAME ---"
$n = 0
foreach ($cat in $tree.subjects.PSObject.Properties) {
  foreach ($set in @($cat.Value | ? { $_ })) {
    if ([string]$set -match '(?i)\bpush') {
      $leaves = @($tree.specific.$set | ? { $_ })
      "PUSH | " + $cat.Name + " | " + $set + " | " + $leaves.Count; $n++
    }
  }
}
"sets with push: " + $n
"--- COVER LOAD TIMES (first 12 on the home page) ---"
$idx = (npx wrangler kv key get --namespace-id $ns "browse:v1:index" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
foreach ($it in @($idx.items | ? { $_.image } | Select-Object -First 12)) {
  $u = [string]$it.image; if ($u -notmatch '^https?://') { $u = "https://auras.guide/image/" + ($u -replace '^.*/image/','') }
  $code = "?"; $len = 0
  $t = Measure-Command { try { $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 30; $code = $r.StatusCode; $len = $r.RawContentLength } catch { $code = "FAIL " + $_.Exception.Message } }
  "COVER | " + $it.label + " | " + $code + " | " + [math]::Round($t.TotalSeconds,2) + "s | " + [math]::Round($len/1024) + " KB"
}
