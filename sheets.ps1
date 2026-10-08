cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$links = @()
"STYLE                    DRAWN  MISSING  FAILED   SHEET"
$w = (RUN "WALK Neo-Tribal" | Out-String); $s = (RUN "SHEET Neo-Tribal" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Neo-Tribal".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Cybersigilism" | Out-String); $s = (RUN "SHEET Cybersigilism" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Cybersigilism".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Fine-Line Florals" | Out-String); $s = (RUN "SHEET Fine-Line Florals" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Fine-Line Florals".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Y2K Nostalgia" | Out-String); $s = (RUN "SHEET Y2K Nostalgia" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Y2K Nostalgia".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Liquid Chrome" | Out-String); $s = (RUN "SHEET Liquid Chrome" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Liquid Chrome".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Red Ink" | Out-String); $s = (RUN "SHEET Red Ink" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Red Ink".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Fine Line" | Out-String); $s = (RUN "SHEET Fine Line" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Fine Line".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Realism" | Out-String); $s = (RUN "SHEET Realism" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Realism".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Black & Grey Realism" | Out-String); $s = (RUN "SHEET Black & Grey Realism" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Black & Grey Realism".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK American Traditional" | Out-String); $s = (RUN "SHEET American Traditional" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"American Traditional".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Japanese" | Out-String); $s = (RUN "SHEET Japanese" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Japanese".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Watercolour" | Out-String); $s = (RUN "SHEET Watercolour" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Watercolour".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Illustrative" | Out-String); $s = (RUN "SHEET Illustrative" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Illustrative".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Chicano" | Out-String); $s = (RUN "SHEET Chicano" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Chicano".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Geometric" | Out-String); $s = (RUN "SHEET Geometric" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Geometric".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK New School" | Out-String); $s = (RUN "SHEET New School" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"New School".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Pets" | Out-String); $s = (RUN "SHEET Pets" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Pets".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Animals" | Out-String); $s = (RUN "SHEET Animals" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Animals".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Dotwork" | Out-String); $s = (RUN "SHEET Dotwork" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Dotwork".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Colour Realism" | Out-String); $s = (RUN "SHEET Colour Realism" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Colour Realism".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
$w = (RUN "WALK Sketch" | Out-String); $s = (RUN "SHEET Sketch" | Out-String)
$miss = [regex]::Match($w, '"no_tile":(\d+)').Groups[1].Value
$drawn = [regex]::Match($s, '"drawn":(\d+)').Groups[1].Value; $failed = [regex]::Match($s, '"failed":(\d+)').Groups[1].Value
$url = [regex]::Match($s, 'https://auras\.guide/sheet/[a-z0-9-]+').Value
"Sketch".PadRight(25) + "$drawn".PadRight(7) + "$miss".PadRight(9) + "$failed".PadRight(9) + $url
