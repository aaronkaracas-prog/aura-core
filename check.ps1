cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
RUN "FACES 126cb158-a143-4e78-b688-a0b2ac442420"
RUN "FACES 71883a66-eb57-4dae-8466-fcd3f75872c2"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$slug = { param($x) $s = (($x.ToLower() -replace '[^a-z0-9]+','-').Trim('-')); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$raw = npx wrangler kv key get --namespace-id $ns "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
if (-not $tt.subjects) { "COULD NOT READ THE CATALOG - run the block again" } else {
$probe = @()
foreach ($p in $tt.subjects.PSObject.Properties) { foreach ($k in @($p.Value)) { $l = @($tt.specific.$k | ? { $_ }); if ($l.Count) { $probe += [pscustomobject]@{ cat = $p.Name; key = "face:v1:" + (& $slug $l[0]) } } } }
"== checking the date of " + $probe.Count + " sets (first picture of each) =="
$when = @{}
$keys = @($probe.key | Select-Object -Unique)
$tmp = Join-Path $env:TEMP "aura-dates-keys.json"
for ($i = 0; $i -lt $keys.Count; $i += 100) {
  $chunk = $keys[$i..([Math]::Min($i+99,$keys.Count-1))]
  ConvertTo-Json @($chunk) | Set-Content -Path $tmp -Encoding utf8
  $out = (npx wrangler kv bulk get $tmp --namespace-id $ns --remote 2>$null | Out-String)
  $hits = [regex]::Matches($out, '"(face:v1:[^"]+)":\s*"((?:[^"\\]|\\.)*)"')
  if ($hits.Count -eq 0) { "  nothing readable came back - first part:"; "  " + $out.Substring(0,[Math]::Min(400,$out.Length)); break }
  foreach ($h in $hits) {
    $at = [regex]::Match($h.Groups[2].Value, '\\"at\\":\\"([0-9T:.\-]+Z)')
    if ($at.Success) { $when[$h.Groups[1].Value] = [datetime]$at.Groups[1].Value }
  }
}
Remove-Item $tmp -ErrorAction SilentlyContinue
$cut = Get-Date "2026-09-29"
$rows = $probe | Group-Object cat | % {
  $d = @($_.Group | % { $when[$_.key] } | ? { $_ })
  $recent = @($d | ? { $_ -ge $cut }).Count
  [pscustomobject]@{ category = $_.Name; sets = $_.Count; drawn_last_week = $recent; no_date = $_.Count - $d.Count;
    newest = $(if ($d) { ($d | Sort-Object | Select-Object -Last 1).ToString("MM-dd") } else { "" });
    oldest = $(if ($d) { ($d | Sort-Object | Select-Object -First 1).ToString("MM-dd") } else { "" }) }
}
$rows | Sort-Object { $_.drawn_last_week / [Math]::Max(1,$_.sets) } -Descending | Format-Table -AutoSize | Out-String -Width 200
}
