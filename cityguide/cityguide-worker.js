// cityguide/cityguide-worker.js
// CITYGUIDE_WORLD__ROUTES__03
// Full-file replacement. Module worker.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const json = (obj, status = 200, extra = {}) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", ...extra },
      });

    // Health
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, version: "CITYGUIDE_WORLD__ROUTES__03", format: "module" });
    }

    // Placeholder for future routed APIs (ROUTES__03 baseline)
    if (url.pathname.startsWith("/api/")) {
      return json({
        ok: false,
        error: "api_not_implemented",
        routes: "ROUTES__03",
      }, 404);
    }

    // Default UI (minimal shell; Aura handles rich UI separately)
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CityGuide.World</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;
font-family:system-ui;background:#0b0f14;color:#e7ecf3}
.card{padding:24px;border-radius:16px;background:#121b2b}
</style>
</head>
<body>
<div class="card">
<h1>CityGuide.World</h1>
<p>ROUTES__03 baseline deployed.</p>
</div>
</body>
</html>`;

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
