export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        version: "CITYGUIDE_WORLD__CITIES_BACKDROPS__01",
        format: "module"
      }), { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    const city = (url.searchParams.get("city") || "malibu").toLowerCase();

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CityGuide.World — ${city}</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui;background:#0b0f14;color:#e7ecf3;padding:24px}
.card{max-width:980px;width:calc(100% - 32px);padding:18px;border-radius:18px;background:#121b2b;border:1px solid #263553}
h1{margin:0 0 8px} p{margin:0;opacity:.85}
.links{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}
a{color:#e7ecf3;text-decoration:none;border:1px solid rgba(255,255,255,.14);padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.06)}
</style></head>
<body><div class="card">
<h1>CityGuide.World — ${city}</h1>
<p>Cities/Backdrops shell is live. Next: Places search + results.</p>
<div class="links">
<a href="/?city=malibu">Malibu</a>
<a href="/?city=las-vegas">Las Vegas</a>
<a href="/?city=lugano">Lugano</a>
<a href="/?city=paris">Paris</a>
</div>
</div></body></html>`;

    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
};
