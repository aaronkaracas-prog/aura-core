cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
for ($i = 1; $i -le 15; $i++) {
  $r = (RUN "BROWSE" | Out-String)
  $left = [regex]::Match($r, '"remaining":(\d+)').Groups[1].Value
  "  pass " + $i + ": " + [regex]::Match($r, '"built_this_pass":\d+').Value + "  remaining " + $left
  if ($left -eq "0") { "== covers rebuilt =="; [regex]::Match($r, '"with_cover":\d+').Value; "  no cover: " + [regex]::Match($r, '"no_cover":\[[^\]]*\]').Value; break }
}
