export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    const json = (obj, status = 200, headers = {}) =>
      new Response(JSON.stringify(obj, null, 2), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
      });

    const html = (str, status = 200) =>
      new Response(str, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });

    // Cache helpers (Workers Cache API)
    const ckReq = (key) => new Request("https://cache.cityguide.world/" + key);
    const getCached = async (key) => (await caches.default.match(ckReq(key))) || null;
    const putCached = async (key, resp, seconds) => {
      const out = new Response(resp.body, resp);
      out.headers.set("Cache-Control", "public, max-age=" + String(seconds));
      ctx.waitUntil(caches.default.put(ckReq(key), out));
    };

    const requirePlacesKey = () => {
      if (!env || !env.PLACES_API_KEY) return json({ ok: false, error: "missing_places_api_key" }, 500);
      return null;
    };

    // Health
    if (method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "cityguide-worker", ts: Date.now() });
    }

    // UI
    if (method === "GET" && url.pathname === "/") {
      // Malibu defaults (ASCII only)
      const DEFAULT_LAT = 34.0259;
      const DEFAULT_LNG = -118.7798;
      const DEFAULT_LABEL = "Malibu, CA";

      return html(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CityGuide.World</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body{
  margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  background: radial-gradient(1200px 600px at 50% 0%, #0f1722, #070a10);
  color:#fff;
}
.card{
  width:100%; max-width:960px; padding:22px; border-radius:18px;
  background: rgba(20,26,34,0.92); box-shadow: 0 20px 50px rgba(0,0,0,0.45);
}
h1{ margin:0 0 6px; }
p{ margin:0 0 14px; opacity:0.9; }
.row{ display:flex; gap:10px; }
input{
  flex:1; padding:12px 14px; border-radius:14px;
  border:1px solid rgba(255,255,255,0.15); background:#0f141b; color:#fff; outline:none;
}
button{
  padding:12px 16px; border-radius:14px; cursor:pointer;
  border:1px solid rgba(255,255,255,0.20); background:#1b2432; color:#fff;
}
.chips{ display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; }
.chip{
  padding:8px 12px; border-radius:999px; cursor:pointer; font-size:13px;
  border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);
}
.grid{
  display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap:12px; margin-top:14px;
}
.item{
  background: rgba(255,255,255,0.06); border-radius:12px; overflow:hidden;
  display:flex; flex-direction:column; cursor:pointer;
}
.thumb{ height:140px; background:#0f141b; }
.thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.body{ padding:12px; }
.body b{ display:block; margin-bottom:4px; }
.muted{ opacity:0.75; font-size:13px; }
.badges{ display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }
.badge{
  font-size:12px; padding:4px 8px; border-radius:999px;
  border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);
}
.foot{ margin-top:14px; font-size:12px; opacity:0.75; }
.modal{
  position:fixed; inset:0; background: rgba(0,0,0,0.60);
  display:none; align-items:center; justify-content:center; padding:16px;
}
.modal .card{ max-width:720px; }
.close{ float:right; cursor:pointer; opacity:0.85; }
.skel{ background: linear-gradient(90deg, #0f141b, #1b2432, #0f141b); background-size: 200% 100%; animation: sh 1.2s infinite; }
@keyframes sh { 0%{background-position:0 0} 100%{background-position:200% 0} }
a{ color:inherit; }
</style>
</head>
<body>
<div class="card">
  <h1>CityGuide.World</h1>
  <p>Search places or explore nearby categories. Powered by Aura.</p>

  <div class="row">
    <input id="q" placeholder="Search a city, place, or category">
    <button id="btnSearch">Search</button>
  </div>

  <div class="chips">
    <div class="chip" data-type="restaurant">Dining</div>
    <div class="chip" data-type="tourist_attraction">Sights</div>
    <div class="chip" data-type="lodging">Hotels</div>
    <div class="chip" data-type="bar">Bars</div>
    <div class="chip" data-type="shopping_mall">Shopping</div>
    <div class="chip" data-type="cafe">Cafe</div>
  </div>

  <div id="results" class="grid"></div>

  <div class="foot">Default: <span id="defLbl"></span>. Location improves results when allowed.</div>
</div>

<div id="modal" class="modal">
  <div class="card">
    <span class="close" id="closeModal">X</span>
    <div id="detail"></div>
  </div>
</div>

<script>
(function(){
  const DEFAULT = { lat: ${DEFAULT_LAT}, lng: ${DEFAULT_LNG}, label: "${DEFAULT_LABEL}" };
  let userPos = { lat: DEFAULT.lat, lng: DEFAULT.lng };
  document.getElementById("defLbl").textContent = DEFAULT.label;

  if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    navigator.geolocation.getCurrentPosition(function(pos){
      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }, function(){});
  }

  function skeleton(n){
    const el = document.getElementById("results");
    el.innerHTML = "";
    for (let i=0;i<n;i++){
      const d = document.createElement("div");
      d.className = "item";
      d.innerHTML = '<div class="thumb skel"></div><div class="body"><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:12px;width:90%;margin-top:8px"></div></div>';
      el.appendChild(d);
    }
  }

  function render(data){
    const el = document.getElementById("results");
    el.innerHTML = "";
    const arr = (data && data.results) ? data.results : [];
    for (const p of arr){
      const d = document.createElement("div");
      d.className = "item";
      const photo = p.photo ? '<img alt="" src="'+p.photo+'">' : '';
      const openNow = p.openNow ? '<span class="badge">Open now</span>' : '';
      d.innerHTML =
        '<div class="thumb">' + photo + '</div>' +
        '<div class="body">' +
          '<b>' + (p.name || "") + '</b>' +
          '<div class="muted">' + (p.address || "") + '</div>' +
          '<div class="badges">' +
            '<span class="badge">Rating: ' + (p.rating == null ? "-" : p.rating) + '</span>' +
            openNow +
          '</div>' +
        '</div>';
      d.addEventListener("click", function(){ openDetail(p.placeId); });
      el.appendChild(d);
    }
  }

  async function runSearch(){
    const q = document.getElementById("q").value.trim();
    if (!q) return;
    skeleton(6);
    const r = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q })
    });
    render(await r.json());
  }

  async function nearby(type){
    skeleton(8);
    const qs = "type=" + encodeURIComponent(type) + "&lat=" + encodeURIComponent(String(userPos.lat)) + "&lng=" + encodeURIComponent(String(userPos.lng));
    const r = await fetch("/api/nearby?" + qs);
    render(await r.json());
  }

  async function openDetail(placeId){
    const modal = document.getElementById("modal");
    const detail = document.getElementById("detail");
    detail.innerHTML = '<p class="skel" style="height:16px;width:60%"></p>';
    modal.style.display = "flex";
    const r = await fetch("/api/place?id=" + encodeURIComponent(placeId));
    const data = await r.json();
    const hours = data && data.hours ? data.hours : "";
    const website = data && data.website ? ('<a target="_blank" rel="noreferrer" href="' + data.website + '">Website</a>') : "";
    detail.innerHTML =
      "<h2>" + (data.name || "") + "</h2>" +
      "<p>" + (data.address || "") + "</p>" +
      "<p class='muted'>" + (data.phone || "") + "</p>" +
      "<p class='muted'>" + website + "</p>" +
      "<p class='muted'>" + hours + "</p>";
  }

  document.getElementById("btnSearch").addEventListener("click", runSearch);
  document.getElementById("q").addEventListener("keydown", function(e){ if (e.key === "Enter") runSearch(); });

  const chips = document.querySelectorAll(".chip[data-type]");
  for (const c of chips){
    c.addEventListener("click", function(){ nearby(c.getAttribute("data-type")); });
  }

  document.getElementById("closeModal").addEventListener("click", function(){
    document.getElementById("modal").style.display = "none";
  });
  document.getElementById("modal").addEventListener("click", function(e){
    if (e.target && e.target.id === "modal") document.getElementById("modal").style.display = "none";
  });
})();
</script>
</body>
</html>`);
    }

    // API: Text search
    if (method === "POST" && url.pathname === "/api/search") {
      const err = requirePlacesKey();
      if (err) return err;

      let body = {};
      try { body = await request.json(); } catch (_) {}
      const query = (body && body.query) ? String(body.query) : "";
      if (!query) return json({ ok: false, error: "missing_query" }, 400);

      const key = "search:" + query.toLowerCase();
      const cached = await getCached(key);
      if (cached) return cached;

      const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.PLACES_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos"
        },
        body: JSON.stringify({ textQuery: query, maxResultCount: 18 })
      });

      const data = await resp.json();
      const results = (data && data.places) ? data.places : [];
      const out = json({
        ok: true,
        results: results.map((p) => ({
          placeId: p.id,
          name: p.displayName && p.displayName.text ? p.displayName.text : "",
          address: p.formattedAddress || "",
          rating: p.rating,
          openNow: p.currentOpeningHours ? !!p.currentOpeningHours.openNow : false,
          photo: (p.photos && p.photos[0] && p.photos[0].name) ? ("/api/photo?name=" + encodeURIComponent(p.photos[0].name)) : null
        }))
      });

      await putCached(key, out, 180);
      return out;
    }

    // API: Nearby
    if (method === "GET" && url.pathname === "/api/nearby") {
      const err = requirePlacesKey();
      if (err) return err;

      const type = url.searchParams.get("type") || "";
      const lat = Number(url.searchParams.get("lat"));
      const lng = Number(url.searchParams.get("lng"));

      if (!type) return json({ ok: false, error: "missing_type" }, 400);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ ok: false, error: "missing_lat_lng" }, 400);

      const key = "nearby:" + type + ":" + String(lat).slice(0, 8) + ":" + String(lng).slice(0, 9);
      const cached = await getCached(key);
      if (cached) return cached;

      const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.PLACES_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos"
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 18,
          locationRestriction: {
            circle: { center: { latitude: lat, longitude: lng }, radius: 3000 }
          }
        })
      });

      const data = await resp.json();
      const results = (data && data.places) ? data.places : [];
      const out = json({
        ok: true,
        results: results.map((p) => ({
          placeId: p.id,
          name: p.displayName && p.displayName.text ? p.displayName.text : "",
          address: p.formattedAddress || "",
          rating: p.rating,
          openNow: p.currentOpeningHours ? !!p.currentOpeningHours.openNow : false,
          photo: (p.photos && p.photos[0] && p.photos[0].name) ? ("/api/photo?name=" + encodeURIComponent(p.photos[0].name)) : null
        }))
      });

      await putCached(key, out, 180);
      return out;
    }

    // API: Place detail
    if (method === "GET" && url.pathname === "/api/place") {
      const err = requirePlacesKey();
      if (err) return err;

      const id = url.searchParams.get("id") || "";
      if (!id) return json({ ok: false, error: "missing_id" }, 400);

      const key = "place:" + id;
      const cached = await getCached(key);
      if (cached) return cached;

      const resp = await fetch("https://places.googleapis.com/v1/places/" + encodeURIComponent(id), {
        headers: {
          "X-Goog-Api-Key": env.PLACES_API_KEY,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,internationalPhoneNumber,websiteUri,regularOpeningHours"
        }
      });

      const p = await resp.json();
      const hoursArr = (p && p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions) ? p.regularOpeningHours.weekdayDescriptions : [];
      // ASCII separator only
      const hours = hoursArr.length ? hoursArr.join(" | ") : "";

      const out = json({
        ok: true,
        name: p.displayName && p.displayName.text ? p.displayName.text : "",
        address: p.formattedAddress || "",
        phone: p.internationalPhoneNumber || "",
        website: p.websiteUri || "",
        hours: hours
      });

      await putCached(key, out, 900);
      return out;
    }

    // API: Photo proxy
    if (method === "GET" && url.pathname === "/api/photo") {
      const err = requirePlacesKey();
      if (err) return err;

      const name = url.searchParams.get("name") || "";
      if (!name) return new Response("Missing name", { status: 400 });

      const key = "photo:" + name;
      const cached = await getCached(key);
      if (cached) return cached;

      const resp = await fetch(
        "https://places.googleapis.com/v1/" + encodeURIComponent(name) + "/media?maxHeightPx=420",
        { headers: { "X-Goog-Api-Key": env.PLACES_API_KEY } }
      );

      const out = new Response(resp.body, resp);
      await putCached(key, out, 3600);
      return out;
    }

    return new Response("Not Found", { status: 404 });
  },
};
