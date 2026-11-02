param([int]$Only = 0)
# THE 13 STYLES THE NAME ALONE DID NOT GET RIGHT (2026-11-01 test, img_mvyf...): the same idea and sentence as draw-style-test.ps1, with
# one line of how the style LOOKS after its name - never its colour. Sticker goes first; pass "1" to draw only it, or nothing for all 13.
$idea = "a fox curled up asleep in a bed of wildflowers"
$styles = @(
  @{ n="Sticker"; d="looks like a real sticker - a thick white die-cut border all the way around the design, flat bold fills, and one edge or corner curling up as if it is being peeled off, with a small shadow under it" },
  @{ n="Ignorant Doodle"; d="a crude, deliberately naive doodle - wobbly hand-drawn lines and no shading, like a quick drawing in the margin of a notebook" },
  @{ n="Patchwork"; d="many small, separate tattoos placed close together with bare skin between them, like a sticker book" },
  @{ n="Micro Tattoos"; d="tiny, delicate and simple, with very fine single-needle lines and only the smallest details" },
  @{ n="Minimalist"; d="as few lines as possible - one simple shape, lots of empty space, nothing extra" },
  @{ n="Blackout"; d="a large area filled completely solid, with the design left as bare skin inside it" },
  @{ n="Ornamental"; d="built from decorative patterns - filigree, lace, mandala and jewelry-like linework - in symmetry" },
  @{ n="New School"; d="cartoon-style with exaggerated shapes and thick outlines" },
  @{ n="Sketch"; d="looks like a loose pencil sketch - rough, unfinished strokes with the construction lines left in" },
  @{ n="Renaissance"; d="like a Renaissance oil painting or marble sculpture - classical, realistic, with soft light and shadow" },
  @{ n="Cybersigilism"; d="thin, sharp, spiky lines like digital sigils and glyphs flowing around the subject, with little or no shading" },
  @{ n="Brutalism"; d="raw, heavy, aggressive brush-stroke shapes - harsh and bold, nothing delicate" },
  @{ n="3D / Optical"; d="an optical illusion - shading and perspective that make it look three-dimensional or impossible, popping out of or sinking into the skin" }
)
$rest = "Make one tall page with a solid black background, divided into a grid of 8 equal cards, 2 across and 4 down, with a wide black gap between them. Each card is all white with a thin black outline around it: the whole tattoo artwork as large as it fits at the top - not on skin - and under it, inside a box with a thin black outline, a short title in bold black capital letters, and under it two short lines in black describing the design. No numbers anywhere."
function Sentence($s) { "This is my tattoo idea: " + $idea + ". Show me 8 different designs of it, all in the " + $s.n + " style - " + $s.d + ". Make number 1 the closest to what I described. For the others, be bold and imaginative with the idea, but keep each subject as itself. Use the colors the " + $s.n + " style is known for. " + $rest }
"== the exact words for Sticker (every other style is the same sentence with its own name and line) =="
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
