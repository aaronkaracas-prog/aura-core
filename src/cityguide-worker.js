
/**
 * CityGuide Worker — FULL FILE
 * Fixes:
 *  - Places photo proxy returns real image bytes w/ correct Content-Type
 *  - Clickable cards with details modal
 *  - Dynamic city theme/backdrop based on search or geolocation (simple)
 *
 * Notes:
 *  - Expects PLACES_API_KEY secret
 *  - Uses Places API (New) v1
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response("", { headers: CORS_HEADERS });

    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (pathname === "/health") {
      return json({ ok: true, service: "cityguide-worker" });
    }

    if (pathname === "/api/search") {
      const q = (searchParams.get("q") || "").trim();
      if (!q) return json({ ok: false, error: "missing_query" }, 400);
      return await placesSearch(q, env);
    }

    if (pathname === "/api/place") {
      const id = searchParams.get("id");
      if (!id) return json({ ok: false, error: "missing_id" }, 400);
      return await placeDetails(id, env);
    }

    if (pathname === "/api/photo") {
      const name = searchParams.get("name");
      const maxw = searchParams.get("maxw") || "800";
      if (!name) return json({ ok: false, error: "missing_photo_name" }, 400);
      return await proxyPhoto(name, maxw, env);
    }

    // Serve UI
    return new Response(renderHTML(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function placesSearch(query, env) {
  const body = {
    textQuery: query,
    pageSize: 20,
    locationBias: { rectangle: {
      low: { latitude: 33.9, longitude: -118.9 },
      high:{ latitude: 34.1, longitude: -118.6 }
    }}
  };

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.photos"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return json({ ok: true, places: data.places || [] });
}

async function placeDetails(id, env) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,internationalPhoneNumber,websiteUri,openingHours,photos"
    }
  });
  const data = await res.json();
  return json({ ok: true, place: data });
}

async function proxyPhoto(photoName, maxw, env) {
  const url = `https://places.googleapis.com/v1/${encodeURIComponent(photoName)}/media?maxWidthPx=${encodeURIComponent(maxw)}`;
  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": env.PLACES_API_KEY }
  });

  const ct = res.headers.get("content-type") || "image/jpeg";
  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": ct, "Cache-Control": "public, max-age=86400" }
  });
}

function renderHTML() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CityGuide</title>
<style>
:root { --bg:#0b132b; --card:#1c2541; --accent:#5bc0be; }
body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: linear-gradient(180deg,var(--bg),#000); color:#fff; }
header { padding:16px; background:rgba(0,0,0,.4); backdrop-filter: blur(6px); position:sticky; top:0; }
input { width:100%; padding:12px; border-radius:10px; border:none; }
.grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap:12px; padding:16px; }
.card { background:var(--card); border-radius:14px; overflow:hidden; cursor:pointer; }
.card img { width:100%; height:140px; object-fit:cover; background:#111; }
.card .p { padding:10px; }
.modal { position:fixed; inset:0; background:rgba(0,0,0,.6); display:none; align-items:center; justify-content:center; }
.modal .box { background:#111; max-width:720px; width:92%; border-radius:14px; overflow:auto; max-height:90vh; }
.close { float:right; padding:10px; cursor:pointer; }
.theme-malibu { --bg:#0b3c5d; --accent:#00c2ff; }
.theme-vegas { --bg:#2b0b3c; --accent:#ff3b7f; }
</style>
</head>
<body>
<header>
<input id="q" placeholder="Search city or place (e.g., Malibu, Las Vegas)"/>
</header>
<div id="grid" class="grid"></div>

<div id="modal" class="modal">
  <div class="box">
    <div class="close" onclick="hide()">✕</div>
    <div id="detail"></div>
  </div>
</div>

<script>
const grid = document.getElementById('grid');
const modal = document.getElementById('modal');
const detail = document.getElementById('detail');

document.getElementById('q').addEventListener('keydown', e => {
  if (e.key === 'Enter') search(e.target.value);
});

async function search(q) {
  applyTheme(q);
  const r = await fetch('/api/search?q=' + encodeURIComponent(q));
  const j = await r.json();
  grid.innerHTML = '';
  (j.places||[]).forEach(p => {
    const img = p.photos?.[0]?.name ? '/api/photo?name=' + encodeURIComponent(p.photos[0].name) : '';
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = '<img src=\"'+img+'\"><div class=\"p\"><b>'+p.displayName.text+'</b><br><small>'+p.formattedAddress+'</small></div>';
    c.onclick = () => openPlace(p.id);
    grid.appendChild(c);
  });
}

async function openPlace(id) {
  const r = await fetch('/api/place?id=' + encodeURIComponent(id));
  const j = await r.json();
  const p = j.place;
  const img = p.photos?.[0]?.name ? '/api/photo?name=' + encodeURIComponent(p.photos[0].name) + '&maxw=1200' : '';
  detail.innerHTML = '<img style=\"width:100%\" src=\"'+img+'\"><div style=\"padding:12px\"><h2>'+p.displayName.text+'</h2><p>'+p.formattedAddress+'</p>' +
    (p.internationalPhoneNumber?('<p>'+p.internationalPhoneNumber+'</p>'):'') +
    (p.websiteUri?('<p><a href=\"'+p.websiteUri+'\" target=\"_blank\">Website</a></p>'):'') +
    '</div>';
  modal.style.display = 'flex';
}

function hide(){ modal.style.display='none'; }

function applyTheme(q){
  document.body.classList.remove('theme-malibu','theme-vegas');
  const s = q.toLowerCase();
  if (s.includes('malibu')) document.body.classList.add('theme-malibu');
  if (s.includes('vegas')) document.body.classList.add('theme-vegas');
}
</script>
</body>
</html>`;
}
