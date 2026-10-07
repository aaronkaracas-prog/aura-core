cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$tt = $null; for ($t = 1; $t -le 4 -and -not $tt; $t++) { try { $o = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String) | ConvertFrom-Json; if ($o.subjects) { $tt = $o } } catch {}; if (-not $tt) { Start-Sleep -Seconds 5 } }
if (-not $tt) { "COULD NOT READ THE CATALOG - run the block again" } else {
function Bulk($keys, $rx) { $res = @{}; $tmp = Join-Path $env:TEMP "aura-audit-keys.json"; for ($i = 0; $i -lt $keys.Count; $i += 100) { $chunk = $keys[$i..([Math]::Min($i+99,$keys.Count-1))]; ConvertTo-Json @($chunk) | Set-Content -Path $tmp -Encoding utf8; $out = $null; for ($t = 1; $t -le 3 -and -not $out; $t++) { $o = (npx wrangler kv bulk get $tmp --namespace-id $ns --remote 2>$null | Out-String); if ($o.Length -gt 5) { $out = $o } else { Start-Sleep -Seconds 5 } }; if ($out) { [regex]::Matches($out, $rx) | % { $res[$_.Groups[1].Value] = $_.Groups[2].Value } } }; Remove-Item $tmp -ErrorAction SilentlyContinue; $res }
"== 1. every category: sets, cards, drawn, and when its pictures were drawn (free) =="
$rows = @(); $allFace = @()
foreach ($p in $tt.subjects.PSObject.Properties) { foreach ($k in @($p.Value)) { foreach ($l in @($tt.specific.$k | ? { $_ })) { $allFace += ("face:v1:" + (& $slug $l)) } } }
$allFace = @($allFace | Select-Object -Unique)
"  reading " + $allFace.Count + " picture records, about a minute per 1,500..."
$face = Bulk $allFace '"(face:v1:[^"]+)":\s*"((?:[^"\\]|\\.)*)"'
foreach ($p in $tt.subjects.PSObject.Properties) {
  $kinds = @($p.Value | ? { $_ }); $n = 0; $d = 0; $dates = @()
  foreach ($k in $kinds) { foreach ($l in @($tt.specific.$k | ? { $_ })) { $n++; $v = $face["face:v1:" + (& $slug $l)]; if ($v) { $d++; $m = [regex]::Match($v, '\\"at\\":\\"([0-9T:.\-]+Z)'); if ($m.Success) { $dates += [datetime]$m.Groups[1].Value } } } }
  $recent = @($dates | ? { $_ -ge (Get-Date "2026-09-25") }).Count
  $rows += [pscustomobject]@{ category = $p.Name; sets = $kinds.Count; cards = $n; drawn = $d; since_sep25 = $recent; newest = $(if ($dates) { ($dates | Sort-Object | Select-Object -Last 1).ToString("MM-dd") } else { "" }); oldest = $(if ($dates) { ($dates | Sort-Object | Select-Object -First 1).ToString("MM-dd") } else { "" }) }
}
$rows | Sort-Object { $_.since_sep25 / [Math]::Max(1,$_.cards) }, category -Descending | Format-Table -AutoSize | Out-String -Width 220
$keep = @($rows | ? { $_.cards -gt 0 -and ($_.since_sep25 / $_.cards) -ge 0.8 } | % { $_.category })
"  " + $keep.Count + " categories are 80%+ drawn since Sept 25 (new); " + ($rows.Count - $keep.Count) + " are mostly old"
"== 2. leftover style words on the new categories and their sets (exact names) =="
$ck = @(); $own = @{}
foreach ($c in $keep) { $own["context:" + (& $slug $c)] = $c; foreach ($k in @($tt.subjects.$c | ? { $_ })) { $own["context:" + (& $slug $k)] = $k } }
$ctx = Bulk @($own.Keys) '"(context:[^"]+)":\s*"((?:[^"\\]|\\.)*)"'
if ($ctx.Count -eq 0) { "  none found" } else { foreach ($h in $ctx.Keys) { "  removed " + $h + " (" + $own[$h] + "): " + $ctx[$h]; npx wrangler kv key delete --namespace-id $ns $h --remote 2>$null | Out-Null } }
"== 3. split settings and descriptions on the categories built since the last check =="
$new = @('Music','Horror','Neo-Traditional Bold Illustrated','Cannabis Culture','Holidays','Embroidered Tattoos','Ignorant Doodle')
$sk = @(); $bk = @{}
foreach ($c in $new) { foreach ($k in @($tt.subjects.$c | ? { $_ })) { $ks = & $slug $k; $sk += @("render:" + $ks, "shape:" + $ks, "split:" + $ks); foreach ($l in @($tt.specific.$k | ? { $_ })) { $bk["build:" + (& $slug $l)] = $c + " / " + $l } } }
$sv = Bulk $sk '"((?:render|shape|split):[^"]+)":\s*"((?:[^"\\]|\\.)*)"'
$bv = Bulk @($bk.Keys) '"(build:[^"]+)":\s*"((?:[^"\\]|\\.)*)"'
$missS = @($sk | ? { -not $sv.ContainsKey($_) }); $missB = @($bk.Keys | ? { -not $bv.ContainsKey($_) })
"  set settings missing: " + $missS.Count + "   descriptions missing: " + $missB.Count
$missS | % { "    " + $_ }; $missB | % { "    no description: " + $bk[$_] }
"== done - send me all of this =="
}
