cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# Read-only: every category in the catalog, how many sets it has, its first set, and the cover the
# home page would use for it today (from the browse index). Changes nothing, costs nothing.
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$tree = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
$idx = (npx wrangler kv key get --namespace-id $ns "browse:v1:index" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json
$cov = @{}; foreach ($it in $idx.items) { $cov[[string]$it.label] = [string]$it.image }
"browse index built: " + $idx.at + "  (" + @($idx.items).Count + " categories in it)"
$names = @($tree.subjects.PSObject.Properties | % { $_.Name })
"categories in catalog: " + $names.Count
foreach ($n in $names) {
  $sets = @($tree.subjects.$n | ? { $_ })
  $c = $cov[$n]; if (-not $c) { $c = "NO COVER IN INDEX" } else { $c = ($c -replace '^.*/image/','') }
  "CAT | " + $n + " | " + $sets.Count + " | " + $(if ($sets.Count) { $sets[0] } else { "" }) + " | " + $c
}
