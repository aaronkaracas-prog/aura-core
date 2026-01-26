# patch-fix-admin-deployer-health.ps1
# Updates /admin/deployer/health route to fetch deployer /health with explicit headers
# and to return upstream headers + raw body for debugging.

$ErrorActionPreference = "Stop"

$path = "C:\Users\Aaron Karacas\aura-worker\aura\src\index.js"
if (-not (Test-Path $path)) { throw "Missing file: $path" }

$src = Get-Content $path -Raw

$old = @'
      if (request.method === "GET" && path === "/admin/deployer/health") {
        const u = "https://aura-deployer.aaronkaracas.workers.dev/health";
        const r = await fetch(u, { method: "GET" });
        const t = await r.text();
        let j = null;
        try { j = JSON.parse(t); } catch { j = { raw: t }; }
        return json({ ok: true, upstream: u, status: r.status, data: j }, 200, withNoCacheHeaders());
      }

'@

if ($src.IndexOf($old) -lt 0) {
  throw "Expected /admin/deployer/health block not found. Refusing to patch."
}

$new = @'
      if (request.method === "GET" && path === "/admin/deployer/health") {
        const u = "https://aura-deployer.aaronkaracas.workers.dev/health";
        const r = await fetch(u, {
          method: "GET",
          headers: {
            "accept": "application/json",
            "cache-control": "no-store",
            "pragma": "no-cache"
          },
          redirect: "follow"
        });

        const t = await r.text();

        // capture a small set of upstream headers for debugging
        const h = {};
        try {
          for (const [k, v] of r.headers.entries()) {
            const lk = String(k || "").toLowerCase();
            if (lk === "content-type" || lk === "cf-ray" || lk === "server" || lk === "cache-control") {
              h[lk] = v;
            }
          }
        } catch {}

        let j = null;
        try { j = JSON.parse(t); } catch { j = null; }

        return json({
          ok: true,
          upstream: u,
          status: r.status,
          headers: h,
          json: j,
          raw: j ? null : t
        }, 200, withNoCacheHeaders());
      }

'@

$dst = $src.Replace($old, $new)
Set-Content -Path $path -Value $dst -Encoding UTF8

Write-Host "OK: Updated /admin/deployer/health fetch logic in $path"
