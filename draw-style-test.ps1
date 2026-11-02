param([int]$Only = 0)
# STYLE NAME ONLY (2026-11-01, Aaron: "if you told the image model Chicano style it would have it ... we can test it"). The same idea in
# all 41 styles, each sentence exactly what core sends today for a new tattoo - but with NO description after the style name. Same model,
# size and quality as the real eight (gpt-image-2.5-flare, high, 1440x3120). Nothing on the site changes. Chicano goes first; pass "1" to
# draw only it, or nothing to draw all 41.
$idea = "a fox curled up asleep in a bed of wildflowers"
$styles = @("Chicano", "American Traditional", "Neo-Traditional", "Japanese", "Black & Grey Realism", "Color Realism", "Micro Tattoos", "Fine Line", "Minimalist", "Blackwork", "Blackout", "Illustrative", "Geometric", "Dotwork", "Ornamental", "Watercolor", "New School", "Tribal", "Sketch", "Etching", "Surrealism", "Biomechanical", "Dark Fantasy", "Medieval", "Renaissance", "Stained Glass", "Liquid Chrome", "Cybersigilism", "Cyberpunk", "Patchwork", "Ignorant Doodle", "Sticker", "Embroidered", "Red Ink", "Negative Space", "Brutalism", "Mixed Media", "Y2K Nostalgia", "1980s Airbrush", "3D / Optical", "Abstract")
$rest = "Make one tall page with a solid black background, divided into a grid of 8 equal cards, 2 across and 4 down, with a wide black gap between them. Each card is all white with a thin black outline around it: the whole tattoo artwork as large as it fits at the top - not on skin - and under it, inside a box with a thin black outline, a short title in bold black capital letters, and under it two short lines in black describing the design. No numbers anywhere."
function Sentence($st) { "This is my tattoo idea: " + $idea + ". Show me 8 different designs of it, all in the " + $st + " style. Make number 1 the closest to what I described. For the others, be bold and imaginative with the idea, but keep each subject as itself. Use the colors the " + $st + " style is known for. " + $rest }
"== the exact words for Chicano (every other style is the same sentence with its own name) =="
Sentence "Chicano"
""
$list = if ($Only -gt 0) { $styles[0..($Only-1)] } else { $styles }
$i = 0
foreach ($st in $list) { $i++
  $body = @{ subject = (Sentence $st); model = "gpt-image-2.5-flare"; quality = "high"; width = 1440; height = 3120; exact_size = $true; raw = $true } | ConvertTo-Json -Compress
  $o = $null; try { $o = ((RUN ("SHOW_IT " + $body) | Out-String) | ConvertFrom-Json).payload } catch {}
  if ($o -and $o.ok -and $o.image_url) { "  " + $i + "/" + $list.Count + "  " + $st + "  ->  " + $o.image_url + "  (`$" + $o.cost_usd + ")" }
  else { "  " + $i + "/" + $list.Count + "  " + $st + "  ->  NOT DRAWN: " + ($(if ($o) { $o.error } else { "no answer" })) }
}
"== send me everything above this line =="
