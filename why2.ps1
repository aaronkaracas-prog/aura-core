cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
foreach ($n in @("TAYLOR SWIFT TAYLOR SWIFT surrounded by friendship bracelets sparkling boots stars handwritten-looking fan keepsakes and visual transitions through different musical eras celebratory fan artwork rather than an album reproduction","BILLIE EILISH BILLIE EILISH inside a strange moody contemporary dreamscape with oversized forms distorted bedroom imagery and electric color")) {
  "== " + $n.Substring(0,13)
  $r = (RUN ("REDO " + $n) | Out-String)
  $u = [regex]::Match($r, '(https://auras\.guide/image/[a-z0-9_]+)').Groups[1].Value
  if ($u) { "  DREW: " + $u } else { "  REFUSED - what came back:"; "  " + ([regex]::Match($r, '"results":\[(.{0,400})')).Groups[1].Value; "  " + ([regex]::Match($r, '"(why|error)":"([^"]{0,300})')).Value }
}
