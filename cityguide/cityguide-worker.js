export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        version: "CITYGUIDE_WORLD__GITHUB_SOURCE__01",
        format: "module"
      }), { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CityGuide.World</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui;background:#0b0f14;color:#e7ecf3}
.card{max-width:900px;width:calc(100% - 32px);padding:20px;border-radius:16px;background:#121b2b;border:1px solid #263553}
h1{margin:0 0 8px} p{margin:0;opacity:.85}
</style></head>
<body><div class="card">
<h1>CityGuide.World</h1>
<p>Deployed from GitHub raw URL via Aura.</p>
<p style="margin-top:10px;opacity:.7">Next: hook Google Places + city backdrops.</p>
</div></body></html>`;

    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
};
