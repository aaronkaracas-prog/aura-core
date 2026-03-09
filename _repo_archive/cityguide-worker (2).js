
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ok:true}), {headers:{"Content-Type":"application/json"}});
    }

    if (url.pathname === "/img") {
      const src = url.searchParams.get("src");
      if (!src) return new Response("", {status:404});
      const r = await fetch(src);
      return new Response(r.body, {
        headers:{
          "Content-Type": r.headers.get("content-type") || "image/jpeg",
          "Cache-Control":"public, max-age=86400"
        }
      });
    }

    return new Response(html(), {headers:{"Content-Type":"text/html"}});
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
:root { --bg:#000; --accent:#fff; }
body { margin:0; font-family:system-ui; background:var(--bg); color:white; }
header { padding:14px; background:black; position:sticky; top:0; }
input { width:100%; padding:12px; border-radius:12px; border:none; font-size:16px; }
.hero { height:480px; background-size:cover; background-position:center; display:flex; align-items:flex-end; }
.hero h1 { margin:24px; font-size:64px; text-shadow:0 10px 40px rgba(0,0,0,.9); }
.pills { display:flex; gap:10px; padding:16px; }
.pill { padding:10px 16px; border-radius:999px; background:rgba(255,255,255,.15); }
</style>
</head>
<body>

<header>
<input id="q" placeholder="VEGAS · MALIBU · FLORENCE"/>
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

<script>
const HERO = {
  vegas: {
    name:"VEGAS",
    img:"https://upload.wikimedia.org/wikipedia/commons/d/d3/Las_Vegas_Strip_at_night.jpg",
    bg:"#1a0826",
    accent:"#ffb703"
  },
  malibu: {
    name:"MALIBU",
    img:"https://upload.wikimedia.org/wikipedia/commons/4/4f/Malibu_coast.jpg",
    bg:"#021a2d",
    accent:"#38bdf8"
  },
  florence: {
    name:"FLORENCE",
    img:"https://upload.wikimedia.org/wikipedia/commons/a/a6/Florence_skyline_panorama.jpg",
    bg:"#2a0f14",
    accent:"#e11d48"
  }
};

const hero = document.getElementById("hero");
const city = document.getElementById("city");
const q = document.getElementById("q");

function apply(input) {
  const v = input.toLowerCase();
  let cfg = null;

  if (v.includes("vegas") || v.includes("las vegas") || v === "lv") cfg = HERO.vegas;
  if (v.includes("malibu")) cfg = HERO.malibu;
  if (v.includes("florence")) cfg = HERO.florence;

  if (!cfg) return;

  document.documentElement.style.setProperty("--bg", cfg.bg);
  document.documentElement.style.setProperty("--accent", cfg.accent);
  hero.style.backgroundImage = "url(/img?src=" + encodeURIComponent(cfg.img) + ")";
  city.textContent = cfg.name;
}

q.addEventListener("keydown", e => {
  if (e.key === "Enter") apply(e.target.value);
});

apply("vegas");
</script>

</body>
</html>`;
}
