# Core v9.539: flat-file cut fix, Make It Mine line, See it on you after lock-in, project details.
# Save index-core.v539.mjs into the aura-core folder first.
cd "C:\Users\Aaron Karacas\aura-worker\aura\aura-workers\aura-core"
$h = (Get-FileHash .\index-core.v539.mjs -Algorithm SHA256).Hash
if ($h -ne "9EB7E508FD5AD4214F32F58AD0D12552198264931600C3B5BE971A3466367FE9") { "== index-core.v539.mjs is not the right file (" + $h + ") - NOTHING CHANGED ==" ; return }
$cur = @(Get-ChildItem -Recurse -Filter index-core.mjs | ? { $_.FullName -notmatch "node_modules|\.wrangler|\\dist\\" })
if ($cur.Count -ne 1) { "== found " + $cur.Count + " index-core.mjs files - NOTHING CHANGED, send me this ==" ; $cur | % { $_.FullName } ; return }
$f = $cur[0].FullName
if (-not (Select-String -Path $f -SimpleMatch 'aura-core-v9.538.0-2026-10-07-favorites' -Quiet)) { "== live file is not v9.538 - NOTHING CHANGED, send me this ==" ; return }
Copy-Item $f ($f + ".v538.bak") -Force
Copy-Item .\index-core.v539.mjs $f -Force
node --check $f; if ($LASTEXITCODE -ne 0) { Copy-Item ($f + ".v538.bak") $f -Force; "== syntax check failed - put v9.538 back, NOTHING DEPLOYED ==" ; return }
npx wrangler deploy 2>&1 | Select-String -Pattern "Uploaded|Deployed|Current Version|error" 
git add -A; git commit -m "v9.539: flat-file cut fix, Make It Mine asks first, See it on you after lock-in, project details" | Out-Null; git push 2>&1 | Select-Object -Last 1
"== v9.539 deployed - backup at " + $f + ".v538.bak =="
