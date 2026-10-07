cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$slug = { param($x) if ($null -eq $x) { "" } else { ((([string]$x).ToLower() -replace '[^a-z0-9]+','-').Trim('-')) } }
$raw = npx wrangler kv key get --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
if (-not $tt.subjects) { "COULD NOT READ THE CATALOG - run it again" } else {
$live = @{}
foreach ($c in $tt.subjects.PSObject.Properties) { foreach ($k in @($c.Value)) { if ($k) { $live[$k] = $c.Name } } }
$first = @{}
foreach ($p in $tt.specific.PSObject.Properties) { foreach ($l in @($p.Value)) { if ($l) { $s = & $slug $l; if ($s -and -not $first.ContainsKey($s)) { $first[$s] = $p.Name } } } }
$orph = @{}; $total = 0
"== DESIGNS TAKEN BY A LEFTOVER SET THAT NO LONGER BELONGS TO ANY CATEGORY =="
foreach ($c in $tt.subjects.PSObject.Properties) {
  $bad = @()
  foreach ($k in @($c.Value)) { if (-not $k) { continue }
    foreach ($l in @($tt.specific.$k)) { if (-not $l) { continue }
      $o = $first[(& $slug $l)]
      if ($o -and $o -ne $k -and -not $live.ContainsKey($o)) { $bad += "$l  <- $o"; $orph[$o] = 1 } } }
  if ($bad.Count) { $total += $bad.Count; "  " + $c.Name + ": " + $bad.Count; $bad | Select-Object -First 3 | % { "      $_" } }
}
"  TOTAL DESIGNS AFFECTED: $total"
"== LEFTOVER SETS DOING IT (" + $orph.Count + ") =="
"  " + (@($orph.Keys | Sort-Object) -join " | ")
}
