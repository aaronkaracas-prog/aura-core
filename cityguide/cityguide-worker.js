export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ========== HEALTH ==========
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        version: "CITYGUIDE_WORLD__ROUTES__02",
        format: "module"
      }), { headers: { "content-type": "application/json; charset=utf-8" } });
    }

    // ========== CITY DATA ==========
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

    const CATS = [
      { key: "dining", label: "Dining" },
      { key: "beaches", label: "Beaches" },
      { key: "events", label: "Events" },
      { key: "shopping", label: "Shopping" },
      { key: "experiences", label: "Experiences" },
      { key: "services", label: "Services" }
    ];

    const STUB = {
      dining: [
        { title: "Nobu Malibu", subtitle: "Iconic oceanfront dining", href: "https://www.noburestaurants.com/malibu/" },
        { title: "Malibu Seafood", subtitle: "Casual, classic seafood", href: "https://www.malibuseafood.com/" }
      ],
      beaches: [
        { title: "Zuma Beach", subtitle: "Big sand, big waves" },
        { title: "Surfrider Beach", subtitle: "Point break legend" }
      ],
      events: [
        { title: "Tonight", subtitle: "Live events (coming next)" },
        { title: "This weekend", subtitle: "Top picks (coming next)" }
      ],
      shopping: [
        { title: "Local shops", subtitle: "Boutiques + essentials" },
        { title: "Markets", subtitle: "Pop-ups + vendors" }
      ],
      experiences: [
        { title: "Guided experiences", subtitle: "Tours + activities" },
        { title: "Outdoor", subtitle: "Hikes + views" }
      ],
      services: [
        { title: "Transportation", subtitle: "Getting around" },
        { title: "Emergency + essentials", subtitle: "Pharmacy, urgent care, etc." }
      ]
    };

    const css = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body{
  margin:0; min-height:100vh;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  color:#e7ecf3; background:#0b0f14;
}
a{ color:inherit; }
.wrap{ max-width:1100px; margin:0 auto; width:100%; }
.hero{
  position:relative; min-height:46vh;
  display:flex; align-items:flex-end;
  padding: 28px 20px;
  background-size:cover; background-position:center;
}
.hero::before{
  content:""; position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.88) 84%);
}
.hero > .wrap, .topbar{ position:relative; z-index:1; }
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
.citypick{ display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
.pill{
  text-decoration:none;
  padding:8px 12px; border-radius:999px;
  background: rgba(0,0,0,0.35);
  border:1px solid rgba(255,255,255,0.12);
  font-size:13px;
}
.h1{ font-size:42px; margin:0; line-height:1.05; }
.tag{ margin:10px 0 0; opacity:0.9; max-width:720px; }
.subnav{ margin-top:14px; display:flex; flex-wrap:wrap; gap:10px; }
.chip{
  text-decoration:none;
  padding:10px 14px; border-radius:999px;
  border:1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.08);
  font-size:13px;
}
.main{ padding: 18px 18px 42px; }
.section{ padding: 22px 0; border-top:1px solid rgba(255,255,255,0.08); }
.section h2{ margin:0 0 10px; font-size:22px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
.grid{ display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
.card{
  display:block; text-decoration:none;
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
.breadcrumbs{ padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.08); }
.crumb{ opacity:.85; text-decoration:none; }
.sep{ opacity:.45; padding:0 8px; }
.footer{
  padding: 18px; opacity: 0.7;
  border-top:1px solid rgba(255,255,255,0.08);
  font-size:12px;
}
.small{ font-size:12px; opacity:.72; margin-top:8px; }
`;

    const htmlShell = (title, heroUrl, inner) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${css}</style>
</head><body>${inner}</body></html>`;

    const renderTopbar = () => `
<div class="topbar">
  <div class="brand">CityGuide.World</div>
  <div class="citypick">
    <a class="pill" href="/city/malibu">Malibu</a>
    <a class="pill" href="/city/las-vegas">Las Vegas</a>
    <a class="pill" href="/city/lugano">Lugano</a>
    <a class="pill" href="/city/paris">Paris</a>
  </div>
</div>`;

    const renderHero = (c, title, tagline, chipsHtml) => `
<div class="hero" style="background-image:url('${c.hero}')">
  ${renderTopbar()}
  <div class="wrap">
    <h1 class="h1">${title}</h1>
    <p class="tag">${tagline || c.tagline}</p>
    ${chipsHtml || ""}
    <div class="small">Build: CITYGUIDE_WORLD__ROUTES__02</div>
  </div>
</div>`;

    const card = (t, s, href) => `
<a class="card" href="${href}">
  <div class="thumb"></div>
  <div class="body">
    <b>${t}</b>
    <div class="muted">${s || ""}</div>
  </div>
</a>`;

    // ========== ROUTES ==========
    // Home -> redirect to /city/malibu
    if (url.pathname === "/") {
      return Response.redirect(url.origin + "/city/malibu", 302);
    }

    // /city/<slug> and /city/<slug>/<category>
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "city") {
      return new Response("Not found", { status: 404 });
    }

    const slug = (parts[1] || "malibu").toLowerCase();
    const c = CITY[slug] || CITY["malibu"];
    const cat = (parts[2] || "").toLowerCase();

    // Breadcrumbs
    const crumbs = (items) => `
<div class="breadcrumbs"><div class="wrap">
  ${items.map((it, i) => `${i ? `<span class="sep">›</span>` : ""}<a class="crumb" href="${it.href}">${it.label}</a>`).join("")}
</div></div>`;

    // City page
    if (!cat) {
      const chips = `<div class="subnav">
        ${CATS.map(x => `<a class="chip" href="/city/${encodeURIComponent(slug)}/${x.key}">${x.label}</a>`).join("")}
      </div>`;

      const sections = CATS.map(x => {
        const items = (STUB[x.key] || []).slice(0, 2);
        return `
<section id="${x.key}" class="section">
  <h2>${x.label} <a class="chip" href="/city/${encodeURIComponent(slug)}/${x.key}">View all</a></h2>
  <div class="grid">
    ${items.map(it => card(it.title, it.subtitle, it.href || `/city/${encodeURIComponent(slug)}/${x.key}`)).join("")}
  </div>
</section>`;
      }).join("");

      const body = `
${renderHero(c, c.name, c.tagline, chips)}
<div class="main"><div class="wrap">
  ${sections}
</div></div>
<div class="footer"><div class="wrap">
  City page shell is live. Next: category pages already exist; next-next: wire Places for real results + photos.
</div></div>`;

      return new Response(htmlShell(`CityGuide.World — ${c.name}`, c.hero, body), {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
      });
    }

    // Category page
    const catDef = CATS.find(x => x.key === cat);
    if (!catDef) return new Response("Not found", { status: 404 });

    const list = (STUB[cat] || []).map(it => card(it.title, it.subtitle, it.href || "#")).join("");
    const chips = `<div class="subnav">
      ${CATS.map(x => `<a class="chip" href="/city/${encodeURIComponent(slug)}/${x.key}">${x.label}</a>`).join("")}
    </div>`;

    const body = `
${renderTopbar()}
${crumbs([{ label: c.name, href: `/city/${encodeURIComponent(slug)}` }, { label: catDef.label, href: `/city/${encodeURIComponent(slug)}/${catDef.key}` }])}
${renderHero(c, `${c.name} — ${catDef.label}`, `Top ${catDef.label.toLowerCase()} picks (stubbed). Next: Places API feed.`, chips)}
<div class="main"><div class="wrap">
  <section class="section">
    <h2>${catDef.label}</h2>
    <div class="grid">${list}</div>
  </section>
</div></div>
<div class="footer"><div class="wrap">
  Category route is live: /city/${slug}/${catDef.key}. Next: replace stub lists with Places search/nearby results.
</div></div>`;

    return new Response(htmlShell(`CityGuide.World — ${c.name} — ${catDef.label}`, c.hero, body), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }
    });
  }
};
