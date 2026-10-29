cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# WINDOW 2: Faith & Spirituality 100 + LGBTQ+ 100 + the 76 Where I'm From not drawn yet
$sets = @('Faith & Spirituality Christian Faith','Faith & Spirituality Catholic Devotion and Saints','Faith & Spirituality Jewish Faith and Identity','Faith & Spirituality Islamic Art and Spiritual Devotion','Faith & Spirituality Hindu Traditions','Faith & Spirituality Buddhist Spirituality','Faith & Spirituality Sikh Identity and Other Traditions','Faith & Spirituality Indigenous Heritage and Cultural Spirituality','Faith & Spirituality Personal Spirituality Nature and the Universe','Faith & Spirituality Hope Protection Remembrance and Personal Faith','LGBTQ+ Identity & Pride Pride Visibility and Equality','LGBTQ+ Identity & Pride Lesbian Identity and Love','LGBTQ+ Identity & Pride Gay Men and Brotherhood','LGBTQ+ Identity & Pride Bi Pan and Beyond','LGBTQ+ Identity & Pride Transgender Identity and Affirmation','LGBTQ+ Identity & Pride Nonbinary Genderfluid and Gender Diversity','LGBTQ+ Identity & Pride Queer Love and Chosen Family','LGBTQ+ Identity & Pride History Activism and Resistance','LGBTQ+ Identity & Pride Self-Acceptance and Courage','LGBTQ+ Identity & Pride Quiet Pride and Personal Symbols','Hometown Area Code Culture','Hometown ZIP Code Pride','Hometown Neighborhood and Block','Hometown City Pride and Landmarks','Hometown Urban Attitude','Hometown Two Places One Story','Hometown Numbers as Art','Hometown Historical and Cultural Roots','Hometown Playful and Unexpected','Hometown Personal Identity')
$skip = @('The Area Code Masterpiece','The Bridge Connection','The City in Engraving','ZIP Code Color Statement','The Area Code Crest','Area Code Blackwork','The Vintage Area Code','Area Code Script','The Area Code Monogram','Area Code Traditional','Area Code Geometry','Area Code Minimalism','The Area Code Signature','My ZIP','ZIP Code Street Lettering','ZIP Code Architecture','ZIP Code Micro Tattoo','ZIP Code Ornamental','ZIP Code Black and Grey','ZIP Code Vintage Sign','ZIP Code with Birth Year','ZIP Code Family Connection','The Old Neighborhood','My Block')
$first = @()
$tree = $null; for ($t = 1; $t -le 4 -and -not $tree; $t++) { try { $tree = ((npx wrangler kv key get --namespace-id "9c2ba111589e48c6ba5ad1b924ae8809" "card:tree" --remote 2>$null | Out-String).Trim() | ConvertFrom-Json) } catch { Start-Sleep -Seconds 5 } }
$names = @($first); foreach ($k in $sets) { foreach ($n in @($tree.specific.$k)) { if ($n -and ($skip -notcontains $n)) { $names += $n } } }
"  " + $names.Count + " designs to draw"
if ($names.Count -lt 276) { "  STOP - expected 276, the catalog read came back short (has the build finished?) - run the block again" } else {
RUN "SETKV config:source:redo:model gpt-image-2" | Out-Null
"  REDO model set to gpt-image-2 - waiting 70 seconds..."
Start-Sleep -Seconds 70
$i = 0; $ok = 0; $bad = @(); $tot = $names.Count
foreach ($nm in $names) { $i++
  $done = $false
  for ($try = 1; $try -le 2 -and -not $done; $try++) {
    $r = (RUN ("REDO " + $nm) | Out-String)
    if ($r -match '->  (https://[^"]+)"') { $ok++; $done = $true; "  " + $i + "/" + $tot + " " + $nm + " -> " + $matches[1] }
  }
  if (-not $done) { $bad += $nm; "  " + $i + "/" + $tot + " " + $nm + " -> NOT DRAWN (twice): " + ($r.Substring(0, [Math]::Min(300, $r.Length))) }
}
"== drawn: " + $ok + " of " + $tot + " =="
if ($bad.Count) { "== not drawn - send me this list ==" ; $bad }
"  the REDO model stays on gpt-image-2 (what it was before)"
}
