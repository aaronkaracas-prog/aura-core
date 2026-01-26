// CityGuide.world Worker (module format)
// CITYGUIDE_WORLD__ROUTES__03
// Global, dynamic cities. Pretty /city/<slug> resolves -> canonical /city/g:<placeId>
// Requires: PLACES_API_KEY binding (Google Places API - New)

const VERSION = "CITYGUIDE_WORLD__ROUTES__03";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { ...JSON_HEADERS, ...extra } });
}
function html(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", ...extra } });
}
function redirect(loc, status = 302) {
  return new Response("", { status, headers: { location: loc } });
}

function requirePlacesKey(env) {
  if (!env || !env.PLACES_API_KEY) return json({ ok: false, error: "missing_places_api_key" }, 500);
  return null;
}

// Category mapping: cityguide category -> Places includedType
const CATEGORY_TO_TYPE = {
  dining: "restaurant",
  hotels: "lodging",
  shopping: "shopping_mall",
  bars: "bar",
  cafe: "cafe",
  sights: "tourist_attraction",
};

function isCanonicalCityKey(cityKey) {
  return typeof cityKey === "string" && cityKey.startsWith("g:");
}
function canonicalPathForPlaceId(placeId) {
  return "/city/g:" + encodeURIComponent(placeId);
}

async function placesSearchCityByText(env, q) {
  const textQuery = String(q || "").trim().slice(0, 140);
  const hinted = textQuery.toLowerCase().includes("city") ? textQuery : (textQuery + " city");
  const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
    },
    body: JSON.stringify({ textQuery: hinted, maxResultCount: 5 }),
  });
  const data = await resp.json().catch(() => ({}));
  const places = Array.isArray(data?.places) ? data.places : [];

  const scored = places.map((p) => {
    const types = Array.isArray(p.types) ? p.types : [];
    const isLocality = types.includes("locality") || types.includes("administrative_area_level_1") || types.includes("postal_town");
    return { p, score: (isLocality ? 10 : 0) + (p?.location ? 1 : 0) };
  }).sort((a,b)=>b.score-a.score);

  const top = scored[0]?.p;
  if (!top?.id) return null;

  return {
    placeId: top.id,
    name: top?.displayName?.text || "",
    address: top?.formattedAddress || "",
    location: top?.location || null,
    types: Array.isArray(top.types) ? top.types : [],
  };
}

async function placesGetPlace(env, placeId, fieldMask) {
  const resp = await fetch("https://places.googleapis.com/v1/places/" + encodeURIComponent(placeId), {
    headers: {
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });
  const data = await resp.json().catch(() => ({}));
  return data;
}

async function cityCenterFromPlace(env, placeId) {
  const p = await placesGetPlace(
    env,
    placeId,
    "id,displayName,formattedAddress,location,photos"
  );
  const loc = p?.location;
  if (!loc || typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return null;
  const photoName = (Array.isArray(p.photos) && p.photos[0]?.name) ? p.photos[0].name : null;
  return {
    placeId: p.id || placeId,
    name: p?.displayName?.text || "",
    address: p?.formattedAddress || "",
    lat: loc.latitude,
    lng: loc.longitude,
    heroPhoto: photoName ? ("/api/photo?name=" + encodeURIComponent(photoName)) : null,
  };
}

async function placesNearby(env, lat, lng, includedType) {
  const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos,places.websiteUri,places.internationalPhoneNumber",
    },
    body: JSON.stringify({
      includedTypes: [includedType],
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 9000 } },
    }),
  });
  const data = await resp.json().catch(() => ({}));
  const results = Array.isArray(data?.places) ? data.places : [];
  return results.map((p) => ({
    placeId: p.id,
    name: p?.displayName?.text || "",
    address: p?.formattedAddress || "",
    rating: p?.rating ?? null,
    openNow: !!p?.currentOpeningHours?.openNow,
    phone: p?.internationalPhoneNumber || "",
    website: p?.websiteUri || "",
    photo: (Array.isArray(p.photos) && p.photos[0]?.name) ? ("/api/photo?name=" + encodeURIComponent(p.photos[0].name)) : null,
  }));
}

// Photo proxy
async function handlePhoto(env, url) {
  const e = requirePlacesKey(env); if (e) return e;
  const name = url.searchParams.get("name");
  if (!name) return json({ ok:false, error:"missing_name" }, 400);

  const mediaUrl = "https://places.googleapis.com/v1/" + encodeURIComponent(name) + "/media?maxHeightPx=720";
  const resp = await fetch(mediaUrl, { headers: { "X-Goog-Api-Key": env.PLACES_API_KEY } });
  const ct = resp.headers.get("content-type") || "image/jpeg";
  return new Response(resp.body, {
    status: resp.status,
    headers: { "content-type": ct, "cache-control": "public, max-age=86400" },
  });
}

function landingHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CityGuide.world</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:system-ui;background:radial-gradient(1200px 600px at 50% 0%, #0f1722, #070a10);color:#fff}
.card{width:100%;max-width:980px;padding:22px;border-radius:18px;background:rgba(20,26,34,.92);box-shadow:0 20px 50px rgba(0,0,0,.45)}
h1{margin:0 0 6px}
p{margin:0 0 14px;opacity:.9}
.row{display:flex;gap:10px;flex-wrap:wrap}
input{flex:1;min-width:240px;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.15);background:#0f141b;color:#fff;outline:none}
button{padding:12px 16px;border-radius:14px;cursor:pointer;border:1px solid rgba(255,255,255,.2);background:#1b2432;color:#fff}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
.chip{padding:8px 12px;border-radius:999px;cursor:pointer;font-size:13px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08)}
.small{font-size:12px;opacity:.75;margin-top:10px}
</style>
</head>
<body>
<div class="card">
  <h1>CityGuide.world</h1>
  <p>Choose any city on Earth. Search a city name, then pick a category.</p>

  <div class="row">
    <input id="city" placeholder="City (e.g., Tokyo, Paris, São Paulo)"/>
    <button id="go">Go</button>
  </div>

  <div class="chips" id="cats">
    <div class="chip" data-cat="dining">Dining</div>
    <div class="chip" data-cat="sights">Sights</div>
    <div class="chip" data-cat="hotels">Hotels</div>
    <div class="chip" data-cat="bars">Bars</div>
    <div class="chip" data-cat="shopping">Shopping</div>
    <div class="chip" data-cat="cafe">Cafe</div>
  </div>

  <div class="small">Build: ${VERSION}</div>
</div>

<script>
(function(){
  const cityEl = document.getElementById("city");
  const goBtn = document.getElementById("go");
  const cats = document.getElementById("cats");
  let selectedCat = "";

  function setCat(cat){
    selectedCat = cat || "";
    Array.from(cats.querySelectorAll(".chip")).forEach(x=>{
      x.style.opacity = (x.getAttribute("data-cat")===selectedCat || !selectedCat) ? "1" : "0.6";
    });
  }

  cats.addEventListener("click", (e)=>{
    const t = e.target;
    if (!t || !t.getAttribute) return;
    const cat = t.getAttribute("data-cat");
    if (cat) setCat(cat);
  });

  async function resolveAndGo(){
    const q = (cityEl.value||"").trim();
    if(!q) return;
    const r = await fetch("/api/city/resolve?q=" + encodeURIComponent(q));
    const j = await r.json();
    if(!j.ok || !j.cityKey){
      alert("Could not resolve city. Try a more specific name (e.g., \\"Paris France\\").");
      return;
    }
    const target = selectedCat ? ("/city/" + encodeURIComponent(j.cityKey) + "/" + encodeURIComponent(selectedCat)) : ("/city/" + encodeURIComponent(j.cityKey));
    location.href = target;
  }

  goBtn.addEventListener("click", resolveAndGo);
  cityEl.addEventListener("keydown", (e)=>{ if(e.key==="Enter") resolveAndGo(); });

  setCat("");
})();
</script>
</body>
</html>`;
}

function cityHtml(city, cityKey) {
  const name = city?.name || "City";
  const hero = city?.heroPhoto ? `<img alt="" src="${city.heroPhoto}" style="width:100%;height:220px;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.08)"/>` : "";
  const subtitle = city?.address || "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${name} · CityGuide.world</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;padding:24px;font-family:system-ui;background:radial-gradient(1200px 600px at 50% 0%, #0f1722, #070a10);color:#fff}
.card{max-width:980px;margin:0 auto;padding:22px;border-radius:18px;background:rgba(20,26,34,.92);box-shadow:0 20px 50px rgba(0,0,0,.45)}
h1{margin:12px 0 6px}
p{margin:0 0 14px;opacity:.9}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
.chip{padding:8px 12px;border-radius:999px;cursor:pointer;font-size:13px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);text-decoration:none;color:#fff}
.small{font-size:12px;opacity:.75;margin-top:10px}
a{color:inherit}
</style>
</head>
<body>
<div class="card">
  <div><a href="/">← All cities</a></div>
  ${hero}
  <h1>${name}</h1>
  <p>${subtitle}</p>

  <div class="chips">
    <a class="chip" href="/city/${encodeURIComponent(cityKey)}/dining">Dining</a>
    <a class="chip" href="/city/${encodeURIComponent(cityKey)}/sights">Sights</a>
    <a class="chip" href="/city/${encodeURIComponent(cityKey)}/hotels">Hotels</a>
    <a class="chip" href="/city/${encodeURIComponent(cityKey)}/bars">Bars</a>
    <a class="chip" href="/city/${encodeURIComponent(cityKey)}/shopping">Shopping</a>
    <a class="chip" href="/city/${encodeURIComponent(cityKey)}/cafe">Cafe</a>
  </div>

  <div class="small">Build: ${VERSION}</div>
</div>
</body>
</html>`;
}

function categoryHtml(city, cityKey, category, items) {
  const name = city?.name || "City";
  const subtitle = city?.address || "";
  const rows = (items || []).map((p) => {
    const photo = p.photo ? `<img alt="" src="${p.photo}" style="width:100%;height:140px;object-fit:cover;display:block"/>` : `<div style="height:140px;background:#0f141b"></div>`;
    const open = p.openNow ? `<span style="font-size:12px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08)">Open now</span>` : "";
    const rating = `<span style="font-size:12px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08)">Rating: ${p.rating==null?"-":p.rating}</span>`;
    const phone = p.phone ? `<div style="opacity:.75;font-size:13px;margin-top:6px">${p.phone}</div>` : "";
    const website = p.website ? `<div style="opacity:.85;font-size:13px;margin-top:6px"><a target="_blank" rel="noreferrer" href="${p.website}">Website</a></div>` : "";
    return `
      <div style="border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06)">
        ${photo}
        <div style="padding:12px">
          <div style="font-weight:700;margin-bottom:4px">${p.name||""}</div>
          <div style="opacity:.8;font-size:13px">${p.address||""}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${rating}${open}</div>
          ${website}
          ${phone}
        </div>
      </div>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${name} · ${category} · CityGuide.world</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;padding:24px;font-family:system-ui;background:radial-gradient(1200px 600px at 50% 0%, #0f1722, #070a10);color:#fff}
.card{max-width:980px;margin:0 auto;padding:22px;border-radius:18px;background:rgba(20,26,34,.92);box-shadow:0 20px 50px rgba(0,0,0,.45)}
h1{margin:12px 0 6px}
p{margin:0 0 14px;opacity:.9}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;margin-top:14px}
.small{font-size:12px;opacity:.75;margin-top:10px}
a{color:inherit}
</style>
</head>
<body>
<div class="card">
  <div><a href="/city/${encodeURIComponent(cityKey)}">← ${name}</a> · <a href="/">All cities</a></div>
  <h1>${name} · ${category}</h1>
  <p>${subtitle}</p>

  <div class="grid">${rows || '<div style="opacity:.75">No results.</div>'}</div>

  <div class="small">Build: ${VERSION}</div>
</div>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method || "GET";

    if (method === "GET" && url.pathname === "/health") {
      return json({ ok: true, version: VERSION, format: "module" });
    }

    if (method === "GET" && url.pathname === "/api/photo") {
      return handlePhoto(env, url);
    }

    if (method === "GET" && url.pathname === "/api/city/resolve") {
      const e = requirePlacesKey(env); if (e) return e;
      const q = url.searchParams.get("q") || "";
      if (!q.trim()) return json({ ok:false, error:"missing_q" }, 400);
      const city = await placesSearchCityByText(env, q);
      if (!city) return json({ ok:false, error:"no_city_match" }, 404);
      const cityKey = "g:" + city.placeId;
      return json({ ok:true, cityKey, city });
    }

    if (method === "GET" && url.pathname === "/") {
      return html(landingHtml());
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (method === "GET" && parts[0] === "city") {
      const e = requirePlacesKey(env); if (e) return e;

      const rawCityKey = parts[1] ? decodeURIComponent(parts[1]) : "";
      if (!rawCityKey) return redirect("/");

      if (!isCanonicalCityKey(rawCityKey)) {
        const city = await placesSearchCityByText(env, rawCityKey);
        if (!city) return html("<h1>City not found</h1>", 404);
        return redirect(canonicalPathForPlaceId(city.placeId));
      }

      const placeId = rawCityKey.slice(2);
      const center = await cityCenterFromPlace(env, placeId);
      if (!center) return html("<h1>City center unavailable</h1>", 500);

      if (parts.length === 2) {
        return html(cityHtml(center, rawCityKey));
      }

      const category = String(parts[2] || "").toLowerCase();
      const includedType = CATEGORY_TO_TYPE[category];
      if (!includedType) return html("<h1>Unknown category</h1>", 404);

      const items = await placesNearby(env, center.lat, center.lng, includedType);
      return html(categoryHtml(center, rawCityKey, category, items));
    }

    return json({ ok:false, error:"not_found" }, 404);
  }
};
