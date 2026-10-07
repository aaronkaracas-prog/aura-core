cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
function Read-Tree { for ($t = 1; $t -le 4; $t++) { $r = (npx wrangler kv key get --namespace-id $ns "card:tree" --remote 2>$null | Out-String).Trim(); if ($r.StartsWith("{")) { try { $o = $r | ConvertFrom-Json; if ($o.subjects -and $o.specific) { return @{ raw = $r; tree = $o } } } catch {} }; "  read failed (try " + $t + ") - retrying"; Start-Sleep -Seconds 5 }; return $null }
$slug = { param($x) $s = (($x.ToLower() -replace "[^a-z0-9]+","-").Trim("-")); if ($s.Length -gt 70) { $s = $s.Substring(0,70) }; $s }
$got = Read-Tree
if (-not $got) { "COULD NOT READ THE CATALOG - nothing written, run the block again" } else {
$tt = $got.tree
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $env:TEMP ("card-tree-backup-" + $stamp + ".json")
[System.IO.File]::WriteAllText($backup, $got.raw, (New-Object System.Text.UTF8Encoding $false))
"  backup of the catalog saved first: " + $backup
$beforeCats = @($tt.subjects.PSObject.Properties).Count
$cats = [ordered]@{}
$cats['Kids Art'] = [ordered]@{}
$cats['Kids Art']['Kids Art Family Portraits'] = @('Mom drawn by her five-year-old exactly as the child drew her','Dad drawn with enormous arms and tiny legs exactly as drawn','Childs crooked family portrait preserved exactly as artwork','Kids first recognizable drawing of the family dog','Childs wildly inaccurate drawing of the family cat','First self-portrait with giant head and stick legs','Childs drawing of Mom and Dad holding hands','Kids drawing of the entire family including pets','Family portrait where everybody has enormous smiling faces','Childs drawing of their house with family standing outside')
$cats['Kids Art']['Kids Art First Words'] = @('First handwritten I LOVE YOU MOM','First handwritten I LOVE YOU DAD','Childs first attempt at writing their own name','Kids handwritten nickname for Mom','Kids handwritten nickname for Dad','Misspelled love note preserved exactly','Birthday-card message in the childs actual handwriting','Tiny handwritten note left on the kitchen table','Childs handwriting wrapped around their little drawing','Childs name and doodled heart exactly as they wrote it')
$cats['Kids Art']['Kids Art Animals'] = @('Kids ridiculous dinosaur preserved exactly','Childs three-legged dog drawing','Kids terrifyingly inaccurate cat','Childs giant smiling shark','Kids butterfly with completely mismatched wings','Childs horse that looks absolutely nothing like a horse','Kids enormous-eyed owl','Childs colorful imaginary bird','Kids crooked turtle','Childs bizarre imaginary animal nobody can identify')
$cats['Kids Art']['Kids Art Imaginary Characters'] = @('Kids monster with six eyes and ten legs','Childs friendly dragon breathing crooked flames','Kids superhero with completely invented powers','Childs princess with enormous crown','Kids robot made from squares and circles','Childs alien with ridiculous antennae','Kids pirate with giant sword','Childs mermaid with wildly colorful tail','Kids knight fighting an absurd monster','Childs imaginary creature given its own little name')
$cats['Kids Art']['Kids Art Fridge Art'] = @('Refrigerator drawing of a bright yellow sun and family','Crayon rainbow preserved with all the uneven colors','Finger-painted flowers','Childs watercolor butterfly','Crayon house beneath an enormous smiling sun','Kids scribbled heart filled with chaotic color','Childs construction-paper-style flower artwork','Kids handprint turned into a colorful little creature','Childs painted tree with fingerprints for leaves','Kids abstract painting preserved like a tiny masterpiece')
$cats['Kids Art']['Kids Art Collages'] = @('Five favorite refrigerator drawings arranged as one tattoo collage','Three childrens drawings combined into one family composition','One little drawing from each child arranged around Moms handwriting','Childs drawings from ages three five and seven arranged together','Kids first dinosaur first person and first written name together','Several tiny family doodles scattered like tattoo flash','Childs drawings arranged like Polaroids pinned to a refrigerator','Collection of tiny monsters the child invented over several years','Different childrens handprints combined into one colorful composition','Mom and Dad drawn separately by the same child and brought together')
$cats['Kids Art']['Kids Art In Real Worlds'] = @('Childs crude dinosaur walking through a beautifully realistic prehistoric jungle','Kids stick-figure astronaut floating through a spectacular galaxy','Childs badly drawn shark swimming through a gorgeous realistic ocean','Kids crooked rocket blasting through a beautifully rendered universe','Childs tiny monster standing inside a dramatic Gothic castle','Kids simple butterfly flying through an elaborate flower garden','Childs stick-figure cowboy riding through a cinematic Western desert','Kids scribbled fish swimming through Japanese-style waves','Childs little dragon flying above beautifully painted mountains','Kids robot walking through an elaborate futuristic city')
$cats['Kids Art']['Kids Art Side by Side'] = @('Childs drawing of the family dog beside a beautiful realistic version of the same dog','Kids drawing of Mom beside an elegant portrait silhouette of Mom','Childs drawing of Dad beside Dads actual favorite motorcycle','Kids house drawing surrounded by realistic flowers from the real homes garden','Childs butterfly transitioning from crayon drawing into detailed butterfly','Kids flower transitioning from crooked crayon petals into realistic botanical petals','Childs little fish gradually transforming into a magnificent koi','Kids scribbled bird transforming into a beautifully detailed bird in flight','Childs moon and stars expanding into an elaborate celestial composition','Kids tiny tree growing into a magnificent old tree while preserving the original drawing at its roots')
$cats['Kids Art']['Kids Art Brought to Life'] = @('Childs superhero redrawn as an enormous comic-book hero while keeping the original costume','Kids monster turned into a full colorful movie-monster character','Childs imaginary car transformed into an outrageous real-looking custom car','Kids invented motorcycle transformed into an impossible custom show bike','Childs princess transformed into an elaborate fantasy queen','Kids robot transformed into an enormous detailed mechanical machine','Childs dragon transformed into a spectacular fantasy dragon','Kids invented animal transformed into a believable fantasy creature','Childs spaceship transformed into a gigantic cinematic spacecraft','Kids castle transformed into an enormous fantasy kingdom')
$cats['Kids Art']['Kids Art Framed Like Masterpieces'] = @('Childs drawing tattooed exactly as drawn inside an ornate museum frame','Kids crayon picture presented like a priceless Renaissance painting','Childs ridiculous monster presented on an elaborate royal coat of arms','Kids stick family placed inside a beautiful heart-shaped locket','Childs crooked flower displayed like a scientific botanical specimen','Kids dinosaur presented as a dramatic vintage museum poster','Childs scribbled rocket treated like a serious NASA mission emblem','Kids badly drawn cat presented like royal heraldry with crown and banners','A refrigerator covered with tiny recognizable pieces of the childs artwork','A whole childhood told through the childs evolving artwork first scribble handprint family drawing favorite creature handwriting and final little I love you')
# names already used by OTHER sets - a new design with the same name would be stolen by the old set
$mine = @(); foreach ($c in $cats.Keys) { $mine += @($cats[$c].Keys) }
$taken = @{}; $tt.specific.PSObject.Properties | ? { $mine -notcontains $_.Name } | % { $_.Value | ? { $_ } | % { $taken[(& $slug $_)] = 1 } }
$renamed = 0
foreach ($c in $cats.Keys) {
  $kinds = @($cats[$c].Keys)
  if ($tt.subjects.PSObject.Properties[$c]) { $tt.subjects.$c = $kinds } else { $tt.subjects | Add-Member -NotePropertyName $c -NotePropertyValue $kinds }
  foreach ($k in $kinds) {
    $names = @($cats[$c][$k] | % { if ($taken.ContainsKey((& $slug $_))) { $script:renamed++; "  RENAMED: " + $_ + " in " + $c + " Style" | Out-Host; $_ + " in " + $c + " Style" } else { $_ } })
    if ($tt.specific.PSObject.Properties[$k]) { $tt.specific.$k = $names } else { $tt.specific | Add-Member -NotePropertyName $k -NotePropertyValue $names }
  }
}
$json = $tt | ConvertTo-Json -Depth 20 -Compress
$check = $json | ConvertFrom-Json
$afterCats = @($check.subjects.PSObject.Properties).Count
if ($afterCats -lt $beforeCats -or $json.Length -lt ($got.raw.Length * 0.9)) { "  SAFETY STOP - the new catalog looks smaller than the old one, nothing written" } else {
$tmp = Join-Path $env:TEMP "card-tree-new.json"
[System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding $false))
npx wrangler kv key put --namespace-id $ns "card:tree" --path $tmp --remote 2>$null | Out-Null
"  catalog written in ONE save: " + $beforeCats + " categories before, " + $afterCats + " after"
npx wrangler kv key put --namespace-id $ns "frame:category:kids-art" ", imaginative tattoo artwork built around authentic children's artwork, handwriting, doodles, paintings and creative ideas; preserve the charming imperfections, uneven lines, strange proportions, backwards letters, misspellings, awkward shapes, accidental marks and personality of children's artwork rather than automatically cleaning or correcting it; when the concept calls for the child's original artwork to remain literal, keep it visibly child-drawn and faithful to the source; when expanding a child's creation into a larger artistic world, preserve the recognizable original child-drawn idea while allowing the surrounding environment or transformed interpretation to become beautifully detailed, cinematic, realistic, illustrative, colorful, fantastical or surreal; freely range between literal crayon reproduction, colored pencil, marker, finger paint, watercolor, simple black linework, collage, tattoo flash, realism, storybook illustration, fantasy, comic-book art, Japanese influence, ornamental framing and playful surrealism according to the concept; use joyful color freely and preserve actual handwriting when it is integral to the design; make the result feel personal, funny, touching and unmistakably connected to something a real child created rather than generic professional children's illustration; tattoo artwork alone, never worn on skin or a body, complete design filling the frame, isolated on a clean plain background unless a larger scene is integral to the concept, no watermark" --remote 2>$null | Out-Null
"  waiting 70 seconds so every server sees the new catalog..."
Start-Sleep -Seconds 70
$got2 = Read-Tree
$short = 0
foreach ($c in $cats.Keys) { foreach ($k in $cats[$c].Keys) { $h = @($got2.tree.specific.$k | ? { $_ }).Count; if ($h -ne 10) { "  STILL SHORT: " + $k + " has " + $h; $short++ } } }
if ($short) { "== " + $short + " Kids Art sets still short - send me this output ==" } else {
"== Kids Art saved: 10 sets of 10 - test design: =="
RUN "FACE Kids stick-figure astronaut floating through a spectacular galaxy"
}
}
}
"== now drawing what is left of Sports, Where Im From and Memorials, one after another in this window =="
Get-Content .\draw-sports.ps1 -Raw | Invoke-Expression
Get-Content .\draw-wif.ps1 -Raw | Invoke-Expression
Get-Content .\draw-mem.ps1 -Raw | Invoke-Expression
