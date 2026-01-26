
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ---- Google Places Photo Proxy ----
    if (url.pathname === "/photo") {
      const name = url.searchParams.get("name");
      if (!name) return new Response("", { status: 404 });

      const apiUrl =
        "https://places.googleapis.com/v1/" +
        encodeURIComponent(name) +
        "/media?maxWidthPx=800";

      const r = await fetch(apiUrl, {
        headers: {
          "X-Goog-Api-Key": env.PLACES_API_KEY,
          "Accept": "image/*"
        }
      });

      return new Response(r.body, {
        headers: {
          "Content-Type": r.headers.get("content-type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    // ---- Places Text Search ----
    if (url.pathname === "/search") {
      const q = url.searchParams.get("q") || "";
      const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.PLACES_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.types,places.photos"
        },
        body: JSON.stringify({
          textQuery: q,
          pageSize: 20
        })
      });

      const j = await r.json();
      return new Response(JSON.stringify(j.places || []), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(html(), {
      headers: { "Content-Type": "text/html" }
    });
  }
};

function html() {
return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CityGuide.world</title>
<style>
:root {
  --bg:#1a0826;
  --accent:#ffb703;
}
body {
  margin:0;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  background:var(--bg);
  color:white;
}
header {
  padding:14px;
  background:black;
  position:sticky;
  top:0;
  z-index:10;
}
input {
  width:100%;
  padding:12px;
  border-radius:12px;
  border:none;
  font-size:16px;
}
.hero {
  height:520px;
  background-size:cover;
  background-position:center;
  display:flex;
  align-items:flex-end;
}
.hero h1 {
  margin:24px;
  font-size:72px;
  text-shadow:0 10px 40px rgba(0,0,0,.9);
}
.pills {
  display:flex;
  gap:10px;
  padding:16px;
}
.pill {
  padding:10px 16px;
  border-radius:999px;
  background:rgba(255,255,255,.15);
  cursor:pointer;
}
.pill.active {
  background:var(--accent);
  color:black;
}
.grid {
  padding:16px;
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:16px;
}
.card {
  background:rgba(255,255,255,.08);
  border-radius:16px;
  overflow:hidden;
  cursor:pointer;
}
.card img {
  width:100%;
  height:160px;
  object-fit:cover;
  background:#000;
}
.card .p {
  padding:12px;
}
.modal {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.75);
  display:none;
  align-items:center;
  justify-content:center;
}
.modal .box {
  background:#020617;
  padding:24px;
  border-radius:16px;
  max-width:600px;
  width:90%;
}
.close {
  cursor:pointer;
  margin-bottom:10px;
  text-align:right;
}
</style>
</head>
<body>

<header>
<input id="q" placeholder="Search Vegas restaurants, bars, events"/>
</header>

<div id="hero" class="hero">
  <h1 id="cityTitle">VEGAS</h1>
</div>

<div class="pills">
  <div class="pill active" onclick="filter('all', this)">All</div>
  <div class="pill" onclick="filter('restaurant', this)">Restaurants</div>
  <div class="pill" onclick="filter('bar', this)">Bars</div>
  <div class="pill" onclick="filter('night_club', this)">Clubs</div>
  <div class="pill" onclick="filter('shopping_mall', this)">Shopping</div>
</div>

<div id="grid" class="grid"></div>

<div id="modal" class="modal">
  <div class="box">
    <div class="close" onclick="closeModal()">✕ Close</div>
    <h2 id="modalTitle"></h2>
    <p id="modalAddr"></p>
  </div>
</div>

<script>
const CITIES = {
  vegas: {
    name: "VEGAS",
    hero: "https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1600&q=80",
    bg: "#1a0826",
    accent: "#ffb703",
    defaultQuery: "Vegas restaurants"
  },
  malibu: {
    name: "MALIBU",
    hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    bg: "#021a2d",
    accent: "#38bdf8",
    defaultQuery: "Malibu restaurants"
  },
  florence: {
    name: "FLORENCE",
    hero: "https://images.unsplash.com/photo-1526481280691-90606c2f9a7c?auto=format&fit=crop&w=1600&q=80",
    bg: "#2a0f14",
    accent: "#e11d48",
    defaultQuery: "Florence restaurants"
  }
};

let currentCity = CITIES.vegas;
let allPlaces = [];

const hero = document.getElementById("hero");
const cityTitle = document.getElementById("cityTitle");
const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalAddr = document.getElementById("modalAddr");

function applyCity(city) {
  currentCity = city;
  document.documentElement.style.setProperty("--bg", city.bg);
  document.documentElement.style.setProperty("--accent", city.accent);
  hero.style.backgroundImage = "url(" + city.hero + ")";
  cityTitle.textContent = city.name;
  load(city.defaultQuery);
}

document.getElementById("q").addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const v = e.target.value.toLowerCase();
    if (v.includes("malibu")) applyCity(CITIES.malibu);
    else if (v.includes("florence")) applyCity(CITIES.florence);
    else applyCity(CITIES.vegas);
  }
});

async function load(q) {
  const r = await fetch("/search?q=" + encodeURIComponent(q));
  allPlaces = await r.json();
  render(allPlaces);
}

function render(list) {
  grid.innerHTML = "";
  list.forEach(p => {
    const img = p.photos && p.photos[0]
      ? "/photo?name=" + encodeURIComponent(p.photos[0].name)
      : "";
    const d = document.createElement("div");
    d.className = "card";
    d.onclick = () => openModal(p);
    d.innerHTML =
      "<img src='" + img + "'>" +
      "<div class='p'><b>" + p.displayName.text +
      "</b><br><small>" + p.formattedAddress + "</small></div>";
    grid.appendChild(d);
  });
}

function filter(type, el) {
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  el.classList.add("active");
  if (type === "all") render(allPlaces);
  else render(allPlaces.filter(p => p.types && p.types.includes(type)));
}

function openModal(p) {
  modalTitle.textContent = p.displayName.text;
  modalAddr.textContent = p.formattedAddress;
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

// initial load
applyCity(CITIES.vegas);
</script>

</body>
</html>`;
}
