cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Renames every catalogue set with "Push" in its name: "Chicano Push Chicano Now" -> "Chicano Reimagined".
# Draws nothing, costs nothing. Every picture is filed under its design, not its set name, so no drawing is lost.
# Order: back up card:tree -> rename each set (KIND) -> fix its two-picture-card mark -> fix the Imagine It
# lists that name the set -> rebuild the home page index (BROWSE) -> check nothing with Push is left.
# Run it alone - nothing else that changes the catalogue may run at the same time.
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$utf8 = New-Object System.Text.UTF8Encoding $false
function Slug($x) { (([string]$x).ToLower() -replace '[^a-z0-9]+','-').Trim('-') }
$bk = Join-Path (Get-Location) ("push-rename-backup-" + (Get-Date -Format "yyyyMMdd-HHmm"))
New-Item -ItemType Directory -Path $bk -Force | Out-Null
$rawTree = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim()
if (-not $rawTree.StartsWith("{")) { "STOPPED - could not read card:tree"; return }
[IO.File]::WriteAllText((Join-Path $bk "card-tree.json"), $rawTree, $utf8)
$tree = $rawTree | ConvertFrom-Json
$map = [ordered]@{}
foreach ($cat in $tree.subjects.PSObject.Properties) {
  foreach ($set in @($cat.Value | ? { $_ })) {
    $s = [string]$set
    if ($s -match '(?i)\bpush\b' -and -not $map.Contains($s)) { $map[$s] = (($s -replace '(?i)\s+push\b.*$','').Trim() + " Reimagined") }
  }
}
"sets to rename: " + $map.Count
"--- 1. RENAME ---"
foreach ($old in $map.Keys) {
  $new = $map[$old]
  $out = (RUN ("KIND " + $old + " :: " + $new) | Out-String).Trim()
  $ok = $out -match '"payload":\{"ok":true'
  "  " + $(if ($ok) { "OK  " } else { "FAIL" }) + " | " + $old + "  ->  " + $new + $(if (-not $ok) { " | " + $out.Substring(0, [Math]::Min(200, $out.Length)) } else { "" })
  $sv = (npx wrangler kv key get --namespace-id $ns ("split:" + (Slug $old)) --remote 2>$null | Out-String).Trim()
  if ($sv -and $sv -notmatch 'not found|error') {
    $tmp = Join-Path $env:TEMP "aura-split.txt"; [IO.File]::WriteAllText($tmp, $sv, $utf8)
    npx wrangler kv key put --namespace-id $ns ("split:" + (Slug $new)) --path $tmp --remote 2>$null | Out-Null
    "       two-picture-card mark carried over"
  }
}
"--- 2. IMAGINE IT LISTS ---"
$keys = (npx wrangler kv key list --namespace-id $ns --prefix "subject:" --remote 2>$null | Out-String) | ConvertFrom-Json
foreach ($kk in @($keys)) {
  $k = [string]$kk.name
  $raw = (npx wrangler kv key get --namespace-id $ns $k --remote 2>$null | Out-String).Trim()
  if (-not $raw.StartsWith("[")) { continue }
  $rows = @(ConvertFrom-Json -InputObject $raw)
  if ($rows.Count -eq 1 -and $rows[0] -is [array] -and $rows[0].Count -gt 3) { $rows = $rows[0] }
  $changed = 0
  $parts = foreach ($r in $rows) {
    $f = @($r | % { [string]$_ })
    if ($f.Count -gt 1 -and $map.Contains($f[1])) { $f[1] = $map[$f[1]]; $changed++ }
    '[' + (($f | % { ConvertTo-Json $_ -Compress }) -join ',') + ']'
  }
  if ($changed -eq 0) { continue }
  [IO.File]::WriteAllText((Join-Path $bk (($k -replace '[:/]','_') + ".json")), $raw, $utf8)
  $tmp = Join-Path $env:TEMP "aura-subj.json"
  [IO.File]::WriteAllText($tmp, '[' + ($parts -join ',') + ']', $utf8)
  npx wrangler kv key put --namespace-id $ns $k --path $tmp --remote 2>$null | Out-Null
  "  " + $k + ": " + $changed + " designs now point at the new set name"
}
"--- 3. HOME PAGE INDEX ---"
$b = (RUN "BROWSE" | Out-String).Trim(); $b.Substring(0, [Math]::Min(300, $b.Length))
"--- 4. CHECK ---"
$t2 = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
$left = 0; foreach ($cat in $t2.subjects.PSObject.Properties) { foreach ($set in @($cat.Value | ? { $_ })) { if ([string]$set -match '(?i)\bpush\b') { "  STILL HAS PUSH: " + $set; $left++ } } }
$lost = 0; foreach ($new in $map.Values) { $n = @($t2.specific.$new | ? { $_ }).Count; if ($n -ne 10) { "  " + $new + " has " + $n + " designs (expected 10)"; $lost++ } }
"sets still with push: " + $left + "   sets not at 10 designs: " + $lost
"backups saved in " + $bk
