cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
# THE STYLE HEROES (2026-10-24, Aaron: "that's perfect"). Each style's own card picture, shown as a real healed tattoo on a person,
# with "TATTOO STYLE" and the style's name drawn in - the approved Fine Line / Dark Fantasy sentence, only the person and the name change.
# 1152x1440. One at a time; each line prints its name and its address. The ids are kept in style-heroes.txt.
$styles = @(
  @{ n="American Traditional"; img="img_mvjs5ovkudn9"; on="a man's outer upper arm" },
  @{ n="Neo-Traditional"; img="img_mvjs68mib73j"; on="a woman's thigh" },
  @{ n="Japanese"; img="img_mvjs0anzl6l0"; on="a man's shoulder and upper arm" },
  @{ n="Black & Grey Realism"; img="img_mvjs6sl6rw6f"; on="a man's forearm" },
  @{ n="Color Realism"; img="img_mvjs79fv7mrr"; on="a woman's shoulder" },
  @{ n="Micro Tattoos"; img="img_mvjs7sd09bz0"; on="a woman's wrist" },
  @{ n="Minimalist"; img="img_mvjs86raw2bd"; on="a woman's ankle" },
  @{ n="Blackwork"; img="img_mvjs8lt3ocgq"; on="a man's calf" },
  @{ n="Blackout"; img="img_mvjs958052hq"; on="a man's arm" },
  @{ n="Illustrative"; img="img_mvjs9ktgeinb"; on="a woman's upper back" },
  @{ n="Chicano"; img="img_mvjsa48757pu"; on="a man's chest" },
  @{ n="Geometric"; img="img_mvjsanxl7d8e"; on="a man's upper arm" },
  @{ n="Dotwork"; img="img_mvjsb64zjsmc"; on="a woman's shoulder blade" },
  @{ n="Ornamental"; img="img_mvjsboi3zh05"; on="a woman's forearm" },
  @{ n="Watercolor"; img="img_mvjsc6xuvvut"; on="a woman's side, along the ribs" },
  @{ n="New School"; img="img_mvjscouejzwx"; on="a man's forearm" },
  @{ n="Tribal"; img="img_mvjsd78si7bb"; on="a man's shoulder and upper arm" },
  @{ n="Sketch"; img="img_mvjsdnues00b"; on="a woman's upper arm" },
  @{ n="Etching"; img="img_mvjse7j6hyxi"; on="a man's forearm" },
  @{ n="Surrealism"; img="img_mvjsep53josz"; on="a man's upper back" },
  @{ n="Biomechanical"; img="img_mvjsfy6jrm2j"; on="a man's forearm" },
  @{ n="Medieval"; img="img_mvjsh15ghop5"; on="a man's chest" },
  @{ n="Renaissance"; img="img_mvjshl0mlpuv"; on="a man's back" },
  @{ n="Stained Glass"; img="img_mvjsi1kjj5pj"; on="a woman's upper back" },
  @{ n="Liquid Chrome"; img="img_mvjsil0fx9dc"; on="a man's upper arm" },
  @{ n="Cybersigilism"; img="img_mvjsj1du76ed"; on="a woman's back, along the spine" },
  @{ n="Cyberpunk"; img="img_mvjsjihupx8f"; on="a man's forearm" },
  @{ n="Patchwork"; img="img_mvjsk4jkynyx"; on="a man's arm" },
  @{ n="Ignorant Doodle"; img="img_mvjsknzasaot"; on="a woman's shin" },
  @{ n="Sticker"; img="img_mvjsl4m8yles"; on="a woman's forearm" },
  @{ n="Embroidered"; img="img_mvjsln3u67b5"; on="a woman's shoulder" },
  @{ n="Red Ink"; img="img_mvjsm58atyrm"; on="a woman's collarbone" },
  @{ n="Negative Space"; img="img_mvjsmplik3aj"; on="a man's calf" },
  @{ n="Brutalism"; img="img_mvjsn8vnsksc"; on="a man's chest" },
  @{ n="Mixed Media"; img="img_mvjsnr8mi9py"; on="a woman's thigh" },
  @{ n="Y2K Nostalgia"; img="img_mvjsobq9nl2l"; on="a woman's lower leg" },
  @{ n="1980s Airbrush"; img="img_mvjsowhp7hbq"; on="a man's upper back" },
  @{ n="3D / Optical"; img="img_mvjspedgfzpv"; on="a man's forearm" },
  @{ n="Abstract"; img="img_mvjspue831m0"; on="a woman's shoulder blade" }
)
function Sentence($s) { "This is a tattoo design. Show it as a real, healed tattoo on " + $s.on + ", in a beautiful cinematic photograph - the whole tattoo clearly visible on the skin, in the upper three quarters of the picture. Soft natural light. The bottom quarter of the picture is dark and calm, and on it, two lines of text, centered: the small words ""TATTOO STYLE"" in white spaced capital letters; under them """ + $s.n + """ in a large flowing brush script, in a color taken from the tattoo. Keep the design exactly as it is. The text is sharp, spelled exactly as written, and never covers the tattoo. No other text, no letters, no logos anywhere." }
"== the exact words for the first one (every other one is the same sentence with its own person and name) =="
Sentence $styles[0]
""
$i = 0; $t0 = Get-Date; $done = @(); $bad = @(); $spent = 0
foreach ($s in $styles) { $i++
  $body = @{ subject = (Sentence $s); model = "gpt-image-2"; source = "image_evolve"; refs = @("https://auras.guide/image/" + $s.img); width = 1152; height = 1440; exact_size = $true; raw = $true } | ConvertTo-Json -Compress
  $o = $null; try { $o = ((RUN ("SHOW_IT " + $body) | Out-String) | ConvertFrom-Json).payload } catch {}
  if ($o -and $o.ok -and $o.image_url -and ($o.image_url -match "(img_[A-Za-z0-9_-]+)")) { $done += ($s.n + "=" + $Matches[1]); $spent += [double]$o.cost_usd; "  " + $i + "/" + $styles.Count + "  " + $s.n + "  ->  " + $o.image_url + "  (`$" + $o.cost_usd + ")" }
  else { "  " + $i + "/" + $styles.Count + "  " + $s.n + "  ->  NOT DRAWN: " + ($(if ($o) { $o.error } else { "no answer" })); $bad += $s.n }
}
$done | Set-Content -Encoding utf8 .\style-heroes.txt
"== " + $done.Count + " drawn, " + $bad.Count + " not drawn - " + [int]((Get-Date) - $t0).TotalMinutes + " min - `$" + [math]::Round($spent, 2) + " =="
if ($bad.Count) { "== not drawn: " + ($bad -join ", ") }
"== kept in style-heroes.txt - send me everything above this line =="
