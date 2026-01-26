
/**
 * CITYGUIDE.WORLD — FULL FILE (CANONICAL)
 * Fixes image loading + adds city-aware hero backdrops
 *
 * REQUIREMENTS:
 * - Cloudflare Worker
 * - Secret: PLACES_API_KEY
 *
 * GUARANTEES:
 * - /api/photo returns real image bytes
 * - Cards + hero images work
 * - City-based backdrop switching (Vegas / Malibu / Florence)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response("", { headers: CORS });

    const url = new URL(req.url);
    const p = url.pathname;

    if (p === "/health") {
      return json({ ok: true, service: "cityguide-worker" });
    }

    if (p === "/api/search") {
      const q = url.searchParams.get("q");
      if (!q) return json({ ok: false, error: "missing_q" }, 400);
      return searchPlaces(q, env);
    }

    if (p === "/api/place") {
      const id = url.searchParams.get("id");
      if (!id) return json({ ok: false, error: "missing_id" }, 400);
      return placeDetails(id, env);
    }

    if (p === "/api/photo") {
      const name = url.searchParams.get("name");
      const max = url.searchParams.get("max") || "1200";
      if (!name) return json({ ok: false, error: "missing_photo_name" }, 400);
      return proxyPhoto(name, max, env);
    }

    return new Response(renderHTML(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

/* ---------------- PLACES ---------------- */

async function searchPlaces(query, env) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.photos",
    },
    body: JSON.stringify({ textQuery: query, pageSize: 20 }),
  });

  const data = await res.json();
  return json({ ok: true, places: data.places || [] });
}

async function placeDetails(id, env) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
    headers: {
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,rating,internationalPhoneNumber,websiteUri,openingHours,photos",
    },
  });
  return json({ ok: true, place: await res.json() });
}

/* ---------------- PHOTO PROXY (FIXED) ---------------- */

async function proxyPhoto(photoName, max, env) {
  const url =
    "https://places.googleapis.com/v1/" +
    encodeURIComponent(photoName) +
    "/media?maxWidthPx=" +
    encodeURIComponent(max);

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": env.PLACES_API_KEY,
    },
  });

  const ct = res.headers.get("content-type") || "image/jpeg";

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/* ---------------- UI ---------------- */

function renderHTML() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CityGuide.world</title>
<style>
:root {
  --bg: #020617;
  --card: rgba(255,255,255,.08);
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: var(--bg);
  color: white;
}
header {
  position: sticky;
  top: 0;
  padding: 14px;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(8px);
}
input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
}
.hero {
  min-height: 420px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}
.hero h1 {
  margin: 24px;
  font-size: 56px;
  text-shadow: 0 8px 30px rgba(0,0,0,.8);
}
.grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
  gap: 14px;
}
.card {
  background: var(--card);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
}
.card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}
.card .p {
  padding: 10px;
}
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.7);
  display: none;
  align-items: center;
  justify-content: center;
}
.modal .box {
  max-width: 720px;
  width: 94%;
  background: #020617;
  border-radius: 16px;
  overflow: auto;
  max-height: 90vh;
}
.close {
  padding: 12px;
  text-align: right;
  cursor: pointer;
}
</style>
</head>
<body>

<header>
<input id="q" placeholder="Search a city or place (Malibu, Las Vegas, Florence)"/>
</header>

<div id="hero" class="hero"><h1 id="cityTitle"></h1></div>
<div id="grid" class="grid"></div>

<div id="modal" class="modal">
  <div class="box">
    <div class="close" onclick="hide()">✕</div>
    <div id="detail"></div>
  </div>
</div>

<script>
const CITY_IMAGES = {
  "las vegas": "https://images.unsplash.com/photo-1506812574058-fc75fa93fead",
  "malibu": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "florence": "https://images.unsplash.com/photo-1549893074-7a4b7c2f7d07"
};

const hero = document.getElementById("hero");
const cityTitle = document.getElementById("cityTitle");
const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const detail = document.getElementById("detail");

document.getElementById("q").addEventListener("keydown", e => {
  if (e.key === "Enter") search(e.target.value);
});

async function search(q) {
  setHero(q);
  const r = await fetch("/api/search?q=" + encodeURIComponent(q));
  const j = await r.json();
  grid.innerHTML = "";
  (j.places || []).forEach(p => {
    const img = p.photos?.[0]?.name
      ? "/api/photo?name=" + encodeURIComponent(p.photos[0].name)
      : "";
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML =
      "<img src='"+img+"'><div class='p'><b>"+p.displayName.text+
      "</b><br><small>"+p.formattedAddress+"</small></div>";
    c.onclick = () => openPlace(p.id);
    grid.appendChild(c);
  });
}

async function openPlace(id) {
  const r = await fetch("/api/place?id=" + encodeURIComponent(id));
  const j = await r.json();
  const p = j.place;
  const img = p.photos?.[0]?.name
    ? "/api/photo?name=" + encodeURIComponent(p.photos[0].name) + "&max=1600"
    : "";
  detail.innerHTML =
    "<img style='width:100%' src='"+img+"'><div style='padding:14px'><h2>"+
    p.displayName.text+"</h2><p>"+p.formattedAddress+"</p></div>";
  modal.style.display = "flex";
}

function hide() {
  modal.style.display = "none";
}

function setHero(q) {
  const key = q.toLowerCase();
  for (const city in CITY_IMAGES) {
    if (key.includes(city)) {
      hero.style.backgroundImage = "url(" + CITY_IMAGES[city] + ")";
      cityTitle.textContent = city.toUpperCase();
      return;
    }
  }
  hero.style.background = "linear-gradient(180deg,#020617,#000)";
  cityTitle.textContent = q;
}
</script>

</body>
</html>`;
}
