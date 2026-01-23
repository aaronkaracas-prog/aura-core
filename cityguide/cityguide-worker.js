export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ---------- HEALTH ----------
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        version: "CITYGUIDE_WORLD__PAGE_STRUCTURE__01",
        format: "module"
      }), { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    // ---------- CITY + BACKDROP ----------
    const city = (url.searchParams.get("city") || "malibu").toLowerCase();

    const CITY = {
      "malibu": {
        name: "Malibu",
        hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=70",
        tagline: "Beach, surf, sunsets, and the coast."
      },
      "las-vegas": {
        name: "Las Vegas",
        hero: "https://images.unsplash.com/photo-1605048061104-2bf6f3a5c873?auto=format&fit=crop&w=1600&q=70",
        tagline: "Shows, dining, nightlife, and neon."
      },
      "lugano": {
        name: "Lugano",
        hero: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=70",
        tagline: "Lake views, mountains, and calm city energy."
      },
      "paris": {
        name: "Paris",
        hero: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=70",
        tagline: "Museums, cafes, and timeless streets."
      }
    };

    const c = CITY[city] || CITY["malibu"];

    // ---------- DATA (stubbed for now; next step we wire Places) ----------
    // Keep Dining separate from Shopping (locked requirement).
    const DATA = {
      dining: [
        { title: "Nobu Malibu", subtitle: "Iconic oceanfront dining", href: "https://www.noburestaurants.com/malibu/" },
        { title: "Malibu Seafood", subtitle: "Casual, classic seafood", href: "https://www.malibuseafood.com/" }
      ],
      beaches: [
        { title: "Zuma Beach", subtitle: "Big sand, big waves", href: "/?city=malibu#beaches" },
        { title: "Surfrider Beach", subtitle: "Point break legend", href: "/?city=malibu#beaches" }
      ],
      events: [
        { title: "Tonight", subtitle: "Live events (coming next)", href: "/?city=" + encodeURIComponent(city) + "#events" },
        { title: "This weekend", subtitle: "Top picks (coming next)", href: "/?city=" + encodeURIComponent(city) + "#events" }
      ],
      shopping: [
        { title: "Local shops", subtitle: "Boutiques + essentials", href: "/?city=" + encodeURIComponent(city) + "#shopping" },
        { title: "Markets", subtitle: "Pop-ups + vendors", href: "/?city=" + encodeURIComponent(city) + "#shopping" }
      ],
      experiences: [
        { title: "Guided experiences", subtitle: "Tours + activities", href: "/?city=" + encodeURIComponent(city) + "#experiences" },
        { title: "Outdoor", subtitle: "Hikes + views", href: "/?city=" + encodeURIComponent(city) + "#experiences" }
      ],
      services: [
        { title: "Transportation", subtitle: "Getting around", href: "/?city=" + encodeURIComponent(city) + "#services" },
        { title: "Emergency + essentials", subtitle: "Pharmacy, urgent care, etc.", href: "/?city=" + encodeURIComponent(city) + "#services" }
      ]
    };

    // ---------- HTML ----------
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CityGuide.World — ${c.name}</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body{
  margin:0; min-height:100vh;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color:#e7ecf3;
  background:#0b0f14;
}
.hero{
  position:relative;
  min-height: 54vh;
  display:flex;
  align-items:flex-end;
  padding: 28px 20px;
  background-image:
    linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 80%),
    url('${c.hero}');
  background-size:cover;
  background-position:center;
}
.wrap{ max-width:1100px; margin:0 auto; width:100%; }
.topbar{
  position:absolute; top:0; left:0; right:0;
  padding: 14px 16px;
  display:flex; align-items:center; justify-content:space-between;
  gap:12px;
}
.brand{
  font-weight:800; letter-spacing:0.2px;
  padding:10px 12px; border-radius:999px;
  background: rgba(0,0,0,0.45);
  border:1px solid rgba(255,255,255,0.12);
}
.citypick{
  display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;
}
.pill{
  text-decoration:none; color:inherit;
  padding:8px 12px; border-radius:999px;
  background: rgba(0,0,0,0.35);
  border:1px solid rgba(255,255,255,0.12);
  font-size:13px;
}
.h1{ font-size:42px; margin:0; line-height:1.05; }
.tag{ margin:10px 0 0; opacity:0.9; max-width:700px; }
.subnav{
  margin-top:14px;
  display:flex; flex-wrap:wrap; gap:10px;
}
.chip{
  cursor:pointer;
  padding:10px 14px; border-radius:999px;
  border:1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.08);
  font-size:13px;
}
.main{ padding: 18px 18px 42px; }
.section{ padding: 22px 0; border-top:1px solid rgba(255,255,255,0.08); }
.section h2{ margin:0 0 10px; font-size:22px; }
.grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap:12px;
}
.card{
  display:block;
  text-decoration:none; color:inherit;
  border-radius:16px; overflow:hidden;
  border:1px solid rgba(255,255,255,0.12);
  background: rgba(18,27,43,0.80);
  box-shadow: 0 16px 40px rgba(0,0,0,0.35);
  transition: transform .12s ease;
}
.card:hover{ transform: translateY(-2px); }
.thumb{
  height:120px;
  background: radial-gradient(900px 240px at 40% 20%, rgba(255,255,255,0.10), rgba(255,255,255,0.03));
}
.body{ padding:12px; }
.body b{ display:block; margin-bottom:4px; }
.muted{ opacity:0.78; font-size:13px; }
.footer{
  padding: 18px;
  opacity: 0.7;
  border-top:1px solid rgba(255,255,255,0.08);
  font-size:12px;
}
.small{ font-size:12px; opacity:.72; margin-top:8px; }
</style>
</head>
<body>
  <div class="hero">
    <div class="topbar">
      <div class="brand">CityGuide.World</div>
      <div class="citypick">
        <a class="pill" href="/?city=malibu">Malibu</a>
        <a class="pill" href="/?city=las-vegas">Las Vegas</a>
        <a class="pill" href="/?city=lugano">Lugano</a>
        <a class="pill" href="/?city=paris">Paris</a>
      </div>
    </div>

    <div class="wrap">
      <h1 class="h1">${c.name}</h1>
      <p class="tag">${c.tagline}</p>
      <div class="subnav">
        <a class="chip" href="#dining">Dining</a>
        <a class="chip" href="#beaches">Beaches</a>
        <a class="chip" href="#events">Events</a>
        <a class="chip" href="#shopping">Shopping</a>
        <a class="chip" href="#experiences">Experiences</a>
        <a class="chip" href="#services">Services</a>
      </div>
      <div class="small">Build: CITYGUIDE_WORLD__PAGE_STRUCTURE__01</div>
    </div>
  </div>

  <div class="main">
    <div class="wrap">

      <section id="dining" class="section">
        <h2>Dining</h2>
        <div class="grid">
          ${DATA.dining.map(x => `
            <a class="card" href="${x.href}" target="${x.href.startsWith('http') ? '_blank' : '_self'}" rel="noreferrer">
              <div class="thumb"></div>
              <div class="body">
                <b>${x.title}</b>
                <div class="muted">${x.subtitle}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>

      <section id="beaches" class="section">
        <h2>Beaches</h2>
        <div class="grid">
          ${DATA.beaches.map(x => `
            <a class="card" href="${x.href}">
              <div class="thumb"></div>
              <div class="body">
                <b>${x.title}</b>
                <div class="muted">${x.subtitle}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>

      <section id="events" class="section">
        <h2>Events</h2>
        <div class="grid">
          ${DATA.events.map(x => `
            <a class="card" href="${x.href}">
              <div class="thumb"></div>
              <div class="body">
                <b>${x.title}</b>
                <div class="muted">${x.subtitle}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>

      <section id="shopping" class="section">
        <h2>Shopping</h2>
        <div class="grid">
          ${DATA.shopping.map(x => `
            <a class="card" href="${x.href}">
              <div class="thumb"></div>
              <div class="body">
                <b>${x.title}</b>
                <div class="muted">${x.subtitle}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>

      <section id="experiences" class="section">
        <h2>Experiences</h2>
        <div class="grid">
          ${DATA.experiences.map(x => `
            <a class="card" href="${x.href}">
              <div class="thumb"></div>
              <div class="body">
                <b>${x.title}</b>
                <div class="muted">${x.subtitle}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>

      <section id="services" class="section">
        <h2>Services</h2>
        <div class="grid">
          ${DATA.services.map(x => `
            <a class="card" href="${x.href}">
              <div class="thumb"></div>
              <div class="body">
                <b>${x.title}</b>
                <div class="muted">${x.subtitle}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </section>

    </div>
  </div>

  <div class="footer">
    <div class="wrap">
      This is the CityGuide.World page structure shell. Next: wire Google Places API for live results, photos, and city-specific category feeds.
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
};
