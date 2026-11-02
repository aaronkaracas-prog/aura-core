param([int]$Only = 0)
# ROUND 5 (2026-11-01): Patchwork and Blackout, worded the general way they would sit in core (no "fox" in the lines).
# Patchwork follows the catalogue card prompt: each design is its own collected sheet of separate small motifs.
# Blackout: one solid block of ink with only the main subject left in it as a bare-skin silhouette, nothing else.
$idea = "a fox curled up asleep in a bed of wildflowers"
$styles = @(
  @{ n="Patchwork"; d="each design is its own little patchwork: the idea broken into separate small motifs - the main subject on its own, plus a few other small things from the idea, each on its own - gathered together on the card, each one visually independent with clear spacing between them, collected rather than connected into one picture" },
  @{ n="Blackout"; d="a big solid block of ink filling most of the design, with only the main subject left inside it as one clean silhouette of bare skin - no other details, no linework, and nothing else from the idea" }
)
$rest = "Make one tall page with a solid black background, divided into a grid of 8 equal cards, 2 across and 4 down, with a wide black gap between them. Each card is all white with a thin black outline around it: the whole tattoo artwork as large as it fits at the top - not on skin - a design that could be tattooed as it is, standing on its own on the white card, with no background scene or rectangle of picture filling the card behind it - and under it, inside a box with a thin black outline, a short title in bold black capital letters, and under it two short lines in black describing the design. No numbers anywhere."
function Sentence($s) { $look = if ($s.d) { " - " + $s.d } else { "" }
  "This is my tattoo idea: " + $idea + ". Show me 8 different designs of it, all in the " + $s.n + " style" + $look + ". Make number 1 the closest to what I described. For the others, be bold and imaginative with the idea, but keep each subject as itself. Use the colors the " + $s.n + " style is known for. " + $rest }
"== the exact words for Patchwork (every other style is the same sentence with its own name and line) =="
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
