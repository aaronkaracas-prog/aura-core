cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# FOUR PAGE HEROES FROM AARON'S MOCKUPS (2026-11-01): Build On Your Ink, Cover Up, See It On You, Ink It. Two pictures each - a phone
# picture (1536x1152) and a wide one for a computer (2048x864) - the same recipe as the approved heroes: the catalogue model, the exact
# size, the words only. Nothing on the page changes until Aaron approves them; then their ids go into mt-shell.html.
$heroes = @(
  @{ k="job1"; kick="BUILD ON"; title="Your Ink"; color="hot pink"; line="Already have a tattoo or an idea to add to it? Let's take it further - on your body, or as a design for your artist.";
     scene="Two forearms side by side against a dark purple background: the first has one small black-and-grey rose tattoo with faint fine-line sketch lines showing where it could grow; the second shows that same rose grown into a full black-and-grey sleeve of roses, leaves and small flowers, outlined by a soft glowing violet light. A curved glowing white arrow points from the first arm to the second." },
  @{ k="job2"; kick="COVER UP"; title="A New Story"; color="hot pink"; line="Transform a tattoo you're ready to change into something you'll love.";
     scene="Two forearms side by side against a dark purple background: the first has an old faded red heart tattoo with blurry outlines; the second has a dense, beautiful black-and-grey rose tattoo that completely covers where the heart was, outlined by a soft glowing violet light. A curved glowing pink arrow points from the first arm to the second." },
  @{ k="job3"; kick="SEE IT"; title="On You"; color="hot pink"; line="Create a tattoo or upload an idea, and we'll show you how it looks on your body before you ink it.";
     scene="A smiling young woman with dark hair resting her chin on her hand, holding up her phone; the phone screen shows her forearm with a delicate fine-line lily tattoo. Her other forearm, in front of her, has the same fine-line lily tattoo, framed by four glowing violet corner brackets like a camera viewfinder. Warm, softly lit room with a purple glow." },
  @{ k="job6"; kick="INK"; title="It."; color="hot pink"; line="Turn your photos into a custom tattoo.";
     scene="Two printed photos with white borders, slightly tilted: a smiling golden retriever, and a laughing toddler with curly hair. Curved white arrows point from the photos to a forearm with a healed black-and-grey realism tattoo of that same golden retriever above that same laughing toddler. Dark background with a soft purple glow." }
)
function Words($h) { "three lines of text, left-aligned: the small word ""$($h.kick)"" in white spaced capital letters; under it ""$($h.title)"" in a large flowing brush script in $($h.color) with a brush-stroke underline; under it, in a clean white sans-serif, ""$($h.line)"" The text is large, sharp and spelled exactly as written, and never covers a face. No other text, no letters, no logos anywhere." }
$jobs = @()
foreach ($h in $heroes) {
  $jobs += @{ k=$h.k; slot="PHONE"; w=1536; h=1152; s=("A cinematic photograph for the top of a phone screen on a tattoo website. " + $h.scene + " The subject fills the upper and right part of the picture. The lower left of the picture is dark and calm, and on it, " + (Words $h)) }
  $jobs += @{ k=$h.k; slot="WIDE";  w=2048; h=864;  s=("A wide cinematic photograph for the top of a tattoo website. " + $h.scene + " The subject is on the right half of the picture. The left half is dark and calm, and on it, " + (Words $h)) }
}
"== the exact words for the first picture (every other one follows the same sentence with its own scene and words) =="
$jobs[0].s
""
$i = 0
foreach ($j in $jobs) { $i++
  $body = @{ subject = $j.s; model = "gpt-image-2"; width = $j.w; height = $j.h; exact_size = $true; raw = $true } | ConvertTo-Json -Compress
  $o = $null; try { $o = ((RUN ("SHOW_IT " + $body) | Out-String) | ConvertFrom-Json).payload } catch {}
  if ($o -and $o.ok -and $o.image_url) { "  " + $i + "/" + $jobs.Count + "  " + $j.k + " " + $j.slot + "  ->  " + $o.image_url + "  (`$" + $o.cost_usd + ")" }
  else { "  " + $i + "/" + $jobs.Count + "  " + $j.k + " " + $j.slot + "  ->  NOT DRAWN: " + ($(if ($o) { $o.error } else { "no answer" })) }
}
"== send me everything above this line =="
