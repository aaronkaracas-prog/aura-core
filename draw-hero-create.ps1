cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# THE CREATE HERO, NEW WORDS (2026-11-01, Aaron's copy spec): the words are part of the picture, so the picture is edited, not
# redrawn - the current hero goes in as the reference, and only the three lines of text change. Phone picture first, then the wide one.
# Nothing on the page changes until Aaron approves them; then their ids go into mt-shell.html.
$heroes = @(
  @{ slot="PHONE"; ref="https://auras.guide/image/img_mvmhi4dwijix"; w=1536; h=1152 },
  @{ slot="WIDE";  ref="https://auras.guide/image/img_mvmhix8bpzqk"; w=2048; h=864 }
)
$words = 'Keep this picture exactly as it is - the same woman, the same tattoo, the same studio, light, colours and framing. Change only the words in the lower left. They become three lines of text, left-aligned: the small word "CREATE" in white spaced capital letters; under it "Imagine It. We''ll Design It." in a large flowing brush script in bright blue, the same lettering as now; under it, in a clean white sans-serif, "Your idea, your inspiration, your tattoo. Let''s bring it to life." The text is large, sharp and spelled exactly as written, and never covers a face. No other text, no letters, no logos anywhere.'
"== the exact words sent with each picture =="
$words
""
foreach ($h in $heroes) {
  $body = @{ subject = $words; refs = @($h.ref); model = "gpt-image-2"; width = $h.w; height = $h.h; exact_size = $true; raw = $true } | ConvertTo-Json -Compress
  $o = $null; try { $o = ((RUN ("SHOW_IT " + $body) | Out-String) | ConvertFrom-Json).payload } catch {}
  if ($o -and $o.ok -and $o.image_url) { "  " + $h.slot + "  ->  " + $o.image_url + "  (`$" + $o.cost_usd + ")" }
  else { "  " + $h.slot + "  ->  NOT DRAWN: " + ($(if ($o) { $o.error } else { "no answer" })) }
}
"== send me everything above this line =="
