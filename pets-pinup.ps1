cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$raw = npx wrangler kv key get --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
$petK = @('Pets in Landscapes','Pets in Flower Fields','Pets at Night','Pets Transformed','Dark and Ornamental Pets','Decorative Pets','Enchanted Pets','Pets in Sun and Water','Pet Characters','Funny Pet Situations')
$petL = @($petK | % { @($tt.specific.$_) })
$w = (RUN "WALK Animals & Pets" | Out-String) | ConvertFrom-Json
if (-not $tt.subjects -or -not $w.payload) { "== PETS: could not read the catalog or the walk - batch not started, run the block again" } else {
  $other = @($w.payload.missing | ? { $petL -notcontains $_ })
  "== PETS: " + $petL.Count + " pet designs, " + @($w.payload.missing).Count + " without a picture"
  if ($other) { "  OLD ANIMAL DESIGNS WITH NO PICTURE (they would be drawn in the pet style): " + ($other -join ", "); "  STOPPED - pets batch not started" } else { RUN "FACES Animals & Pets --all" }
}
"== MEME TEST TILE (already drawn - this just shows its link) =="
RUN "FACE Grim Reaper riding inflatable flamingo"
$slug = { param($x) (($x.ToLower() -replace '[^a-z0-9]+','-').Trim('-')) }
$raw = npx wrangler kv key get --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "card:tree" --remote | Select-Object -Last 1
$tt = $raw | ConvertFrom-Json
if (-not $tt.subjects) { "COULD NOT READ THE CATALOG - nothing written, run the block again" } else {
$mineK = @($tt.subjects."Pin-Up Girls")
$tk = @{}
$tt.subjects.PSObject.Properties | % { $_.Value | ? { $mineK -notcontains $_ } | % { $tk[(& $slug $_)] = "a set name" } }
$tt.specific.PSObject.Properties | ? { $mineK -notcontains $_.Name } | % { $k = $_.Name; $_.Value | % { $tk[(& $slug $_)] = $k } }
"== Pin-Up Girls before (empty = new category) =="
"  " + (@($tt.subjects."Pin-Up Girls") -join ", ")
$kinds = 'Pin-Up Classics','Pin-Up Americana','Pin-Up Space Age','Pin-Up Spooky','Pin-Up Punk and Goth','Pin-Up Disco and Y2K','Pin-Up Beach and Sea','Pin-Up Western','Pin-Up Everyday Chaos','Pin-Up Fantasy'
$kh = $kinds | ? { $tk.ContainsKey((& $slug $_)) }
if ($kh) { $kh | % { "  SET NAME CLASH: $_" }; "  STOPPED - nothing written or drawn" } else {
$sets = [ordered]@{}
$sets['Pin-Up Classics'] = @('Classic sailor girl sitting on an anchor','Cowgirl swinging a lasso','Rockabilly girl leaning against a hot rod','Biker girl sitting on a vintage motorcycle','Mechanic girl holding an oversized wrench','Aviator girl sitting on an airplane wing','Surfer girl carrying a longboard','Vegas showgirl throwing flaming dice','Tattooed sailor girl holding a ship wheel','Pin-up girl sitting inside a crescent moon')
$sets['Pin-Up Americana'] = @('Cowgirl riding a bucking bronco','Racer girl waving a checkered flag','Roller-skating diner girl carrying six milkshakes','Tattoo artist girl tattooing a heart','Beach girl sitting inside a giant seashell','Pirate girl sitting on a treasure chest','Hula girl surrounded by tropical flowers','Glamorous lounge singer with vintage microphone','Motorcycle mechanic covered in grease','Classic pin-up posing beside a jukebox')
$sets['Pin-Up Space Age'] = @('Space girl sitting on Saturn','Retro astronaut girl floating with ray gun','Alien girl taking a Polaroid of Earth','Space cowgirl riding a rocket','Retro-futuristic girl leaning against flying saucer','Moon girl dangling her feet over a crescent','Martian girl holding a ray gun and cocktail','Space mechanic repairing a broken UFO','Cosmic girl surfing through a galaxy','Astronaut pin-up riding a meteor')
$sets['Pin-Up Spooky'] = @('Witch stirring a cocktail in a cauldron','Witch riding a vacuum cleaner instead of a broom','Devil girl lighting a cigarette from her own tail','Angel girl whose halo keeps falling off','Vampire girl drinking a Bloody Mary','Ghost girl under a sheet wearing high heels','Female Grim Reaper sunbathing','Zombie prom queen fixing her lipstick','Frankenstein-inspired pin-up plugging herself into a charger','Mummy girl unraveling while dancing')
$sets['Pin-Up Punk and Goth'] = @('Goth girl sitting on a cemetery gate','Punk girl with mohawk holding a broken heart','Rocker girl smashing a guitar','Tattooed goth girl surrounded by black roses','Vampire biker girl riding through flames','Punk pin-up sitting on a giant safety pin','Goth girl holding an ornate black umbrella','Rockabilly devil girl leaning on a hot rod','Glam-rock girl beneath a disco ball','Punk girl riding a skateboard in platform boots')
$sets['Pin-Up Disco and Y2K'] = @('Disco girl sitting inside a giant martini glass','Roller-disco girl beneath a mirrored ball','1970s pin-up dancing inside a lava lamp','Glamorous disco girl riding a giant vinyl record','Y2K girl sitting on a transparent landline phone','Y2K pin-up surrounded by butterflies and chrome stars','Retro girl emerging from a television screen','Pin-up girl sitting on a giant cassette tape','Glam girl riding a roller skate','Pin-up DJ spinning records with heart-shaped headphones')
$sets['Pin-Up Beach and Sea'] = @('Surfer girl riding a shark','Mermaid sitting inside a cocktail glass','Mermaid pin-up riding a seahorse','Pirate girl steering a ship through a storm','Sailor girl riding an anchor like a rodeo bull','Beach pin-up sitting beneath a giant tropical drink umbrella','Lifeguard girl riding a giant inflatable flamingo','Mermaid fixing her hair in a hand mirror','Deep-sea diver pin-up surrounded by curious fish','Sailor girl relaxing inside a giant clam shell')
$sets['Pin-Up Western'] = @('Cowgirl riding a rocket','Cowgirl sitting on a giant horseshoe','Saloon girl playing poker with skeletons','Western outlaw girl holding two smoking finger guns','Rodeo queen riding an enormous jackrabbit','Cowgirl leaning against a cactus covered in flowers','Vegas cowgirl sitting on oversized dice','Outlaw pin-up posing beside a wanted poster of herself','Desert pin-up riding a giant rattlesnake','Cowgirl drinking champagne from a cowboy boot')
$sets['Pin-Up Everyday Chaos'] = @('1950s housewife calmly drinking coffee while the kitchen burns','Pin-up tattoo artist tattooing a skeleton','Glamorous girl walking a tiny three-headed dog','Mechanic girl repairing a UFO with an ordinary wrench','Office pin-up sitting on a mountain of paperwork','Librarian pin-up riding a flying book','Gardener girl watering flowers that have tiny eyeballs','Chef pin-up being chased by an enormous lobster','Maid pin-up sweeping tiny ghosts under a rug','Scientist pin-up holding a bubbling love potion')
$sets['Pin-Up Fantasy'] = @('Fairy pin-up riding a giant moth','Warrior pin-up sitting on a dragon','Goddess girl surrounded by sun and moon ornament','Angel pin-up riding a motorcycle through clouds','Demon girl relaxing in a bubble bath of flames','Mushroom fairy sitting beneath an enormous spotted mushroom','Medusa pin-up putting curlers in her snakes','Mermaid cowgirl riding a giant koi fish','Alien cowgirl riding a three-eyed space horse','Grim Reaper pin-up relaxing on an inflatable flamingo')
$renamed = @()
foreach ($k in @($sets.Keys)) { $sets[$k] = @($sets[$k] | % { $n = $_; if ($tk.ContainsKey((& $slug $n))) { $r = "$n in Pin-Up Style"; $renamed += "  RENAMED: $n  ->  $r  (the first was under " + $tk[(& $slug $n)] + ")"; $r } else { $n } }) }
if ($renamed) { $renamed } else { "  no clashes" }
npx wrangler kv key put --namespace-id 9c2ba111589e48c6ba5ad1b924ae8809 "frame:category:pin-up-girls" ", imaginative contemporary pin-up tattoo artwork, unmistakable pin-up attitude with expressive posing, personality and character, freely ranging between classic American tattoo flash, neo-traditional tattoo art, colorful retro illustration, rockabilly, Western, biker, punk, goth, horror, fantasy, space-age retro-futurism, Y2K, psychedelic and playful surrealism depending on the concept; vary women naturally across body types, skin tones, hairstyles, hair colors, fashion eras and personalities rather than repeatedly generating the same woman; stylish, playful, confident and sexy without explicit nudity, strong readable tattoo composition, expressive faces and dynamic poses, allow rich saturated color when appropriate and black-and-grey when stronger, favor visual storytelling and surprising situations rather than simply changing outfits, tattoo artwork alone, never worn on skin or a body, complete design filling the frame, isolated on a clean plain white background, no watermark, no letters, no words" --remote
RUN "CATEGORY Pin-Up Girls :: Pin-Up Classics, Pin-Up Americana, Pin-Up Space Age, Pin-Up Spooky, Pin-Up Punk and Goth, Pin-Up Disco and Y2K, Pin-Up Beach and Sea, Pin-Up Western, Pin-Up Everyday Chaos, Pin-Up Fantasy"
foreach ($k in $sets.Keys) { RUN ("LEAVES " + $k + " :: " + ($sets[$k] -join ", ")) }
RUN "FACE Space girl sitting on Saturn"
}
}