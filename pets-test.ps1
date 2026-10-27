$split = 'Two panels side by side on one image, divided down the middle. LEFT PANEL: the tattoo design alone on a plain white background, shown flat exactly as described, no body, drawn large so it fills most of the panel. RIGHT PANEL: Studio photograph of a real person''s body showing the same exact tattoo where described, healed tattoo on real skin in soft even light, the rest of the body modestly covered by simple plain clothing, only the tattooed area bare, plain seamless light grey studio backdrop - no room, no furniture, no scenery. The tattoo in both panels is identical. '
$list = @(
  @('The Guilty Criminal', 'The tattoo: The Guilty Criminal - a beagle caught red-pawed with an exaggerated guilty expression, ears drooping, sitting among the shredded evidence of its latest crime: torn couch-cushion stuffing, a chewed slipper and scattered feathers. A Pets tattoo in a playful, comic-inspired illustrative style with bold outlines and bright colour. No text, labels, logos or watermarks in the tattoo. In the right panel it is on a man, outer forearm, a medium tattoo that sits well inside that area.'),
  @('The Mechanical Marvel', 'The tattoo: The Mechanical Marvel - the head of a brown-and-white pit bull in three-quarter view whose face and neck turn into intricate brass gears, metal plates, cables and machinery, the eye still alive and soulful. A Pets tattoo in biomechanical realism, warm brass, steel and natural fur tones. No text, labels, logos or watermarks in the tattoo. In the right panel it is on a woman, outer upper arm, a medium-to-large tattoo that still sits well inside that area, not a full sleeve.')
)
$spent = 0.0
foreach ($c in $list) {
  $subject = $split + $c[1]
  ""
  $c[0] + " - SENT: " + $subject
  $body = @{ subject=$subject; model="gpt-image-2"; width=1536; height=1024; exact_size=$true; raw=$true } | ConvertTo-Json -Compress
  try {
    $j = (RUN ("SHOW_IT " + $body)) | ConvertFrom-Json
    if ($j.payload.ok -and $j.payload.id) { $spent += [double]$j.payload.cost_usd; $c[0] + " - " + $j.payload.image_url + "  `$" + $j.payload.cost_usd }
    else { $c[0] + " - NOT DRAWN: " + $j.payload.error }
  } catch { $c[0] + " - NOT DRAWN: " + $_.Exception.Message }
}
""
"Spent: `$" + [math]::Round($spent, 3)
