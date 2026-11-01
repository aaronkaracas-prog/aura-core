cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# THE GET INSPIRED HERO (2026-11-01, Aaron's mockup): a new picture with its words in it, the same recipe as the approved heroes -
# the catalogue model, the exact size, the words only. Phone picture first, then the wide one. Nothing on the page changes until
# Aaron approves them; then their ids go into mt-shell.html.
$scene = "On the left, a fan of glowing phone screens tilted in the air, each showing a tattoo design - a lion with a crown, a skull with red roses, an orange koi fish, a purple mountain landscape, an ornate compass and a woman's portrait - edged in soft purple light. On the right, a woman with dark wavy hair in profile looking up, her bare shoulder covered in a healed colour tattoo of a large red rose with dark ornamental shading. Deep purple and black background with a soft violet glow."
$words = "three lines of text, left-aligned: the small word ""GET"" in white spaced capital letters; under it ""Inspired"" in a large flowing brush script in hot pink with a brush-stroke underline; under it, in a clean white sans-serif, ""Explore real tattoos, artists, studios, and ideas from around the world."" The text is large, sharp and spelled exactly as written, and never covers a face. No other text, no letters, no logos anywhere."
$jobs = @(
  @{ slot="PHONE"; w=1536; h=1152; s=("A cinematic photograph for the top of a phone screen on a tattoo website. " + $scene + " The phones fill the upper left and the woman fills the right side. The lower left of the picture is dark and calm, and on it, " + $words) },
  @{ slot="WIDE";  w=2048; h=864;  s=("A wide cinematic photograph for the top of a tattoo website. " + $scene + " The phones and the woman are on the right half of the picture. The left half is dark and calm, and on it, " + $words) }
)
"== the exact words for the PHONE picture (the WIDE one differs only in where things sit) =="
$jobs[0].s
""
foreach ($j in $jobs) {
  $body = @{ subject = $j.s; model = "gpt-image-2"; width = $j.w; height = $j.h; exact_size = $true; raw = $true } | ConvertTo-Json -Compress
  $o = $null; try { $o = ((RUN ("SHOW_IT " + $body) | Out-String) | ConvertFrom-Json).payload } catch {}
  if ($o -and $o.ok -and $o.image_url) { "  " + $j.slot + "  ->  " + $o.image_url + "  (`$" + $o.cost_usd + ")" }
  else { "  " + $j.slot + "  ->  NOT DRAWN: " + ($(if ($o) { $o.error } else { "no answer" })) }
}
"== send me everything above this line =="
