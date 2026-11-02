param([int]$Only = 0)
# ROUND 4 (2026-11-01): Patchwork - sent as "patchwork sleeve", the tattoo name for it, so the word does not pull to quilts - and Blackout.
# ROUND 3 (2026-11-01): new lines for Patchwork, New School, Renaissance, Cybersigilism and Blackout - and, on EVERY sheet here, the card
# asks for a design that could be tattooed as it is, with no background scene or rectangle of picture behind it. Surrealism, Dark Fantasy
# and Cyberpunk keep the name only and test just that card change; Brutalism keeps its line from round 2. Patchwork first.
$idea = "a fox curled up asleep in a bed of wildflowers"
$styles = @(
  @{ n="patchwork sleeve"; d="the idea split into several small, separate tattoos - for example the fox on its own, a single flower on its own, a leaf on its own, a moon on its own - each a complete little tattoo with its own outline, scattered across the card with bare space between them and none of them touching. Not one picture, and nothing quilted, stitched or patched" },
  @{ n="Blackout"; d="a big solid block of ink filling most of the design - a circle, a band or a shield - with the subject drawn inside it only as thin lines of bare skin, as if carved out of it" }
)
$rest = "Make one tall page with a solid black background, divided into a grid of 8 equal cards, 2 across and 4 down, with a wide black gap between them. Each card is all white with a thin black outline around it: the whole tattoo artwork as large as it fits at the top - not on skin - a design that could be tattooed as it is, standing on its own on the white card, with no background scene or rectangle of picture filling the card behind it - and under it, inside a box with a thin black outline, a short title in bold black capital letters, and under it two short lines in black describing the design. No numbers anywhere."
function Sentence($s) { $look = if ($s.d) { " - " + $s.d } else { "" }
  "This is my tattoo idea: " + $idea + ". Show me 8 different designs of it, all in the " + $s.n + " style" + $look + ". Make number 1 the closest to what I described. For the others, be bold and imaginative with the idea, but keep each subject as itself. Use the colors the " + $s.n + " style is known for. " + $rest }
"== the exact words for the patchwork sleeve (every other style is the same sentence with its own name and line) =="
Sentence $styles[0]
""
$list = @(if ($Only -gt 0) { $styles[0..($Only-1)] } else { $styles })
$i = 0
foreach ($st in $list) { $i++
  $body = @{ subject = (Sentence $st); model = "gpt-image-2.5-flare"; quality = "high"; width = 1440; height = 3120; exact_size = $true; raw = $true } | ConvertTo-Json -Compress
  $o = $null; try { $o = ((RUN ("SHOW_IT " + $body) | Out-String) | ConvertFrom-Json).payload } catch {}
  if ($o -and $o.ok -and $o.image_url) { "  " + $i + "/" + $list.Count + "  " + $st.n + "  ->  " + $o.image_url + "  (`$" + $o.cost_usd + ")" }
  else { "  " + $i + "/" + $list.Count + "  " + $st.n + "  ->  NOT DRAWN: " + ($(if ($o) { $o.error } else { "no answer" })) }
}
"== send me everything above this line =="
