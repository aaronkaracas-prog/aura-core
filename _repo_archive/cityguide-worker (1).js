
/**
 * CITYGUIDE.WORLD — POC FORCE FILE
 * Purpose: Visual proof-of-concept (not final architecture)
 *
 * WHAT THIS FILE DOES:
 * - Forces city hero images (Vegas / Malibu / Florence)
 * - Proxies ALL images through worker (no mixed-content / CORS issues)
 * - Applies city-specific color palettes
 * - Makes layout look like "real product", not skeleton
 *
 * REQUIREMENT:
 * - Secret: PLACES_API_KEY
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const CITY_CONFIG = {
  "las vegas": {
    hero: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Las_Vegas_Strip_at_night.jpg",
    accent: "#ffb703",
    bg: "#2b0b3c",
  },
  "malibu": {
    hero: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Malibu_coast.jpg",
    accent: "#38bdf8",
    bg: "#020617",
  },
  "florence": {
    hero: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Florence_skyline_panorama.jpg",
    accent: "#e11d48",
    bg: "#1f2937",
  },
};

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response("", { headers: CORS });
    const url = new URL(req.url);

    if (url.pathname === "/health")
      return json({ ok: true, service: "cityguide-worker" });

    if (url.pathname === "/api/search")
      return searchPlaces(url.searchParams.get("q"), env);

    if (url.pathname === "/api/place")
      return placeDetails(url.searchParams.get("id"), env);

    if (url.pathname === "/api/photo")
      return proxyPlacesPhoto(url.searchParams.get("name"), env);

    if (url.pathname === "/api/img")
      return proxyGenericImage(url.searchParams.get("src"));

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

/* ---------------- API ---------------- */

async function searchPlaces(q, env) {
  if (!q) return json({ ok: false, error: "missing_q" }, 400);
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.photos",
    },
    body: JSON.stringify({ textQuery: q, pageSize: 18 }),
  });
  const j = await r.json();
  return json({ ok: true, places: j.places || [] });
}

async function placeDetails(id, env) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
    headers: {
      "X-Goog-Api-Key": env.PLACES_API_KEY,
      "X-Goog-FieldMask": "displayName,formattedAddress,rating,photos,websiteUri",
    },
  });
  return json({ ok: true, place: await r.json() });
}

async function proxyPlacesPhoto(name, env) {
  if (!name) return new Response("", { status: 404 });
  const r = await fetch(
    `https://places.googleapis.com/v1/${encodeURIComponent(name)}/media?maxWidthPx=1200`,
    { headers: { "X-Goog-Api-Key": env.PLACES_API_KEY } }
  );
  return new Response(r.body, {
    headers: {
      "Content-Type": r.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

async function proxyGenericImage(src) {
  if (!src) return new Response("", { status: 404 });
  const r = await fetch(src);
  return new Response(r.body, {
    headers: {
      "Content-Type": r.headers.get("content-type") || "image/jpeg",
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
  --accent: #38bdf8;
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  background: var(--bg);
  color: white;
}
header {
  padding: 14px;
  background: rgba(0,0,0,.6);
  position: sticky;
  top: 0;
}
input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
}
.hero {
  height: 420px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}
.hero h1 {
  margin: 24px;
  font-size: 56px;
  text-shadow: 0 10px 40px rgba(0,0,0,.9);
}
.pills {
  display: flex;
  gap: 10px;
  padding: 16px;
}
.pill {
  padding: 10px 14px;
  background: rgba(255,255,255,.1);
  border-radius: 999px;
}
.grid {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
  gap: 16px;
}
.card {
  background: rgba(255,255,255,.08);
  border-radius: 16px;
  overflow: hidden;
}
.card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}
.card .p {
  padding: 12px;
}
</style>
</head>
<body>

<header>
<input id="q" placeholder="Search Malibu, Las Vegas, Florence"/>
</header>

<div id="hero" class="hero"><h1 id="city"></h1></div>

<div class="pills">
  <div class="pill">All</div>
  <div class="pill">Restaurants</div>
  <div class="pill">Bars</div>
  <div class="pill">Events</div>
  <div class="pill">Concerts</div>
  <div class="pill">Shopping</div>
</div>

<div id="grid" class="grid"></div>

<script>
const CITY_CONFIG = ${JSON.stringify(CITY_CONFIG)};
const hero = document.getElementById("hero");
const cityEl = document.getElementById("city");
const grid = document.getElementById("grid");

document.getElementById("q").addEventListener("keydown", e => {
  if (e.key === "Enter") search(e.target.value);
});

function applyCity(q) {
  const k = q.toLowerCase();
  for (const c in CITY_CONFIG) {
    if (k.includes(c)) {
      const cfg = CITY_CONFIG[c];
      document.documentElement.style.setProperty("--bg", cfg.bg);
      document.documentElement.style.setProperty("--accent", cfg.accent);
      hero.style.backgroundImage =
        "url(/api/img?src=" + encodeURIComponent(cfg.hero) + ")";
      cityEl.textContent = c.toUpperCase();
      return;
    }
  }
  hero.style.background = "linear-gradient(180deg,#020617,#000)";
  cityEl.textContent = q;
}

async function search(q) {
  applyCity(q);
  const r = await fetch("/api/search?q=" + encodeURIComponent(q));
  const j = await r.json();
  grid.innerHTML = "";
  (j.places||[]).forEach(p => {
    const img = p.photos?.[0]?.name
      ? "/api/photo?name=" + encodeURIComponent(p.photos[0].name)
      : "";
    const d = document.createElement("div");
    d.className = "card";
    d.innerHTML =
      "<img src='"+img+"'><div class='p'><b>"+p.displayName.text+"</b><br>"+
      "<small>"+p.formattedAddress+"</small></div>";
    grid.appendChild(d);
  });
}
</script>

</body>
</html>`;
}
