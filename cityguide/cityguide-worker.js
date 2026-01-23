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

    return new Response("CityGuide.World — Cities Backdrops v01", {
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
};
