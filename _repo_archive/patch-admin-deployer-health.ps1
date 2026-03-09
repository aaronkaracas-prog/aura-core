# patch-admin-deployer-health.ps1
# Adds operator-gated /admin/deployer/health route to src\index.js
# Full-file safe patch (refuses if marker not found or already patched)

$ErrorActionPreference = "Stop"

$path = "C:\Users\Aaron Karacas\aura-worker\aura\src\index.js"
if (-not (Test-Path $path)) { throw "Missing file: $path" }

$src = Get-Content $path -Raw

# Marker: the existing admin placeholder we added earlier
$marker = @'
      if (path === "/admin/self-deploy-staging") {
        return json({ ok: false, error: "not_enabled" }, 501, withNoCacheHeaders());
      }
'@

if ($src.IndexOf($marker) -lt 0) {
  throw "Marker block not found. index.js changed; refusing to patch."
}

# Avoid double insert
if ($src -match 'path === "/admin/deployer/health"') {
  Write-Host "SKIP: /admin/deployer/health already present."
  exit 0
}

$insert = @'
      if (request.method === "GET" && path === "/admin/deployer/health") {
        const u = "https://aura-deployer.aaronkaracas.workers.dev/health";
        const r = await fetch(u, { method: "GET" });
        const t = await r.text();
        let j = null;
        try { j = JSON.parse(t); } catch { j = { raw: t }; }
        return json({ ok: true, upstream: u, status: r.status, data: j }, 200, withNoCacheHeaders());
      }

'@

$dst = $src.Replace($marker, $marker + $insert)
Set-Content -Path $path -Value $dst -Encoding UTF8

Write-Host "OK: Patched /admin/deployer/health into $path"
