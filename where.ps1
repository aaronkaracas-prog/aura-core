cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$ns = "9c2ba111589e48c6ba5ad1b924ae8809"
function Missing($c) { for ($t = 1; $t -le 4; $t++) { $o = (RUN ("WALK " + $c) | Out-String); $m = [regex]::Match($o, '"missing":\[(.*?)\]'); if ($m.Success) { return @([regex]::Matches($m.Groups[1].Value, '"([^"]+)"')).Count }; Start-Sleep -Seconds 10 }; return "no answer" }
"== STYLES DONE YESTERDAY / EARLIER TODAY (old order - these were approved) =="
"  " + "Neo-Tribal".PadRight(24) + "missing cards: " + (Missing "Neo-Tribal")
"  " + "Cybersigilism".PadRight(24) + "missing cards: " + (Missing "Cybersigilism")
"  " + "Fine-Line Florals".PadRight(24) + "missing cards: " + (Missing "Fine-Line Florals")
"  " + "Y2K Nostalgia".PadRight(24) + "missing cards: " + (Missing "Y2K Nostalgia")
"  " + "Liquid Chrome".PadRight(24) + "missing cards: " + (Missing "Liquid Chrome")
"  " + "Red Ink".PadRight(24) + "missing cards: " + (Missing "Red Ink")
"  " + "Fine Line".PadRight(24) + "missing cards: " + (Missing "Fine Line")
"  " + "Realism".PadRight(24) + "missing cards: " + (Missing "Realism")
"  " + "Black & Grey Realism".PadRight(24) + "missing cards: " + (Missing "Black & Grey Realism")
"  " + "American Traditional".PadRight(24) + "missing cards: " + (Missing "American Traditional")
"  " + "Japanese".PadRight(24) + "missing cards: " + (Missing "Japanese")
"  " + "Watercolour".PadRight(24) + "missing cards: " + (Missing "Watercolour")
"  " + "Illustrative".PadRight(24) + "missing cards: " + (Missing "Illustrative")
"  " + "Chicano".PadRight(24) + "missing cards: " + (Missing "Chicano")
"== NEW STYLES (need the new order) =="
$d = (npx wrangler kv key get --namespace-id $ns "build:three-perfect-circles-intersect-to-create-a-clean-geometric-structure-" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Geometric".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Geometric")
$d = (npx wrangler kv key get --namespace-id $ns "build:a-furious-blue-chameleon-lunges-forward-with-one-enormous-rotating-eye" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "New School".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "New School")
$d = (npx wrangler kv key get --namespace-id $ns "build:a-senior-golden-retriever-looks-directly-toward-the-viewer-in-soft-bla" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Pets".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Pets")
$d = (npx wrangler kv key get --namespace-id $ns "build:a-snow-leopard-moves-diagonally-down-a-rocky-slope-rather-than-posing-" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Animals".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Animals")
$d = (npx wrangler kv key get --namespace-id $ns "build:a-single-sphere-exists-entirely-through-dot-density-there-is-no-outlin" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Dotwork".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Dotwork")
$d = (npx wrangler kv key get --namespace-id $ns "build:two-wet-cherries-hang-from-one-stem-rendered-so-realistically-that-the" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Colour Realism".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Colour Realism")
$d = (npx wrangler kv key get --namespace-id $ns "build:a-huge-raven-is-caught-at-the-instant-its-wings-open-the-head-and-ches" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Sketch".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Sketch")
$d = (npx wrangler kv key get --namespace-id $ns "build:an-anatomically-observed-human-skull-is-shown-from-an-unusual-three-qu" --remote 2>$null | Out-String).Trim()
if ($d.StartsWith("Two panels")) { $ord = "NEW order saved" } elseif ($d.StartsWith("The tattoo")) { $ord = "OLD order saved" } else { $ord = "not saved yet" }
"  " + "Skulls & Skeletons".PadRight(24) + $ord.PadRight(18) + "missing cards: " + (Missing "Skulls & Skeletons")
