# patch-admin-routes.ps1
# Adds operator-gated admin endpoints to src\index.js without manual editing.
# Inserts after the /version route block.

$ErrorActionPreference = "Stop"

$path = "C:\Users\Aaron Karacas\aura-worker\aura\src\index.js"
if (-not (Test-Path $path)) { throw "Missing file: $path" }

$src = Get-Content $path -Raw

$marker = @'
      if (path === "/version") {
        return json({ ok: true, service: "aura-core", ui_build: UI_BUILD, version: VERSION }, 200, withNoCacheHeaders());
      }
'@

if ($src.IndexOf($marker) -lt 0) {
  throw "Marker block not found. index.js changed; refusing to patch."
}

# Avoid double-insert if already patched
if ($src -match 'path === "/admin/selftest"' -or $src -match 'path === "/admin/capabilities"') {
  Write-Host "SKIP: admin routes already present."
  exit 0
}

$insert = @'

      // Admin (operator only)
      if (request.method === "GET" && path === "/admin/selftest") {
        return json({ ok: true, admin: true, ui_build: UI_BUILD, version: VERSION }, 200, withNoCacheHeaders());
      }
      if (request.method === "GET" && path === "/admin/capabilities") {
        return json({
          ok: true,
          ui_build: UI_BUILD,
          version: VERSION,
          capabilities: {
            operator_gate: true,
            admin_routes: true,
            self_deploy: false,
            deployer_call: false,
            payload_gen: false,
            kv: !!(env && (env.AURA_MEM || env.AURA_KV)),
            r2: !!(env && env.AURA_UPLOADS),
            openai: !!(env && (env.OPENAI_API_KEY || env.AURA_OPENAI_API_KEY)),
            google_places_proxy: !!(env && env.GOOGLE_PLACES_API_KEY)
          }
        }, 200, withNoCacheHeaders());
      }
      if (path === "/admin/self-deploy-staging") {
        return json({ ok: false, error: "not_enabled" }, 501, withNoCacheHeaders());
      }

'@

# Insert immediately after the /version route block
$dst = $src.Replace($marker, $marker + $insert)

Set-Content -Path $path -Value $dst -Encoding UTF8
Write-Host "OK: Patched admin routes into $path"
