param([int]$Only = 0)
# ROUND 6 (2026-11-01): Patchwork sent as "patchwork tattoo", worded from how tattoo shops define it - separate stand-alone tattoos,
# each with a clear edge, empty space between, mixed styles (flash, fine line, blackwork), no scene joining them ("sticker sleeve"); tried on the fox AND on a second idea (the farm) to prove it is general.
# Blackout: one solid block in a simple clean shape, only the main subject as a bare-skin silhouette, nothing around its edge.
$idea = "a fox curled up asleep in a bed of wildflowers"
$styles = @(
  @{ n="patchwork tattoo"; d="each design is a collection of separate stand-alone tattoos, like a sticker sleeve - the main subject as one tattoo and each other thing from the idea as its own tattoo, each with its own clear edge and empty space between them, mixing tattoo styles such as traditional flash, fine line and blackwork, with no scene joining them. Nothing quilted, stitched or filled with fabric patches" },
  @{ n="patchwork tattoo"; i="I grew up in a small town on a farm with apple trees and my dad drove a tractor"; d="each design is a collection of separate stand-alone tattoos, like a sticker sleeve - the main subject as one tattoo and each other thing from the idea as its own tattoo, each with its own clear edge and empty space between them, mixing tattoo styles such as traditional flash, fine line and blackwork, with no scene joining them. Nothing quilted, stitched or filled with fabric patches" },
  @{ n="Blackout"; d="one big solid block of ink in a simple clean shape - a circle, a band or a shield - with only the main subject left inside it as one clean silhouette of bare skin. Nothing else from the idea, inside it or around its edge, and no linework" }
)
$rest = "Make one tall page with a solid black background, divided into a grid of 8 equal cards, 2 across and 4 down, with a wide black gap between them. Each card is all white with a thin black outline around it: the whole tattoo artwork as large as it fits at the top - not on skin - a design that could be tattooed as it is, standing on its own on the white card, with no background scene or rectangle of picture filling the card behind it - and under it, inside a box with a thin black outline, a short title in bold black capital letters, and under it two short lines in black describing the design. No numbers anywhere."
function Sentence($s) { $look = if ($s.d) { " - " + $s.d } else { "" }
  "This is my tattoo idea: " + $(if ($s.i) { $s.i } else { $idea }) + ". Show me 8 different designs of it, all in the " + $s.n + " style" + $look + ". Make number 1 the closest to what I described. For the others, be bold and imaginative with the idea, but keep each subject as itself. Use the colors the " + $s.n + " style is known for. " + $rest }
"== the exact words for the patchwork tattoo (every other style is the same sentence with its own name and line) =="
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
