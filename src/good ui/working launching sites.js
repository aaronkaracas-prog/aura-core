// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-23__AUTONOMY_STEP_58__WORLD_SCALE_CITYGUIDE__01
// Full-file replacement. DO NOT MERGE.
// UI: STEP 11 preserved.
// Preserves STEP 57B city pipeline + adds world-scale commands:
//   CITYGUIDE_WORLD_MODE:<GLOBAL|OFF>
//   CITYGUIDE_WORLD_SEED:city1,city2,...
//   CITYGUIDE_WORLD_ANALYZE
//   CITYGUIDE_WORLD_LIST
//   CITYGUIDE_WORLD_PROJECT:<city>
// Stamp: 2026-01-23 20:35 PT

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: JSON_HEADERS });
}
function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", ...extraHeaders } });
}

const BUILD_VERSION = "AURA_CORE__2026-01-23__AUTONOMY_STEP_58__WORLD_SCALE_CITYGUIDE__01";
const BUILD_STAMP = "2026-01-23 20:35 PT";

/* =========================
   SYSTEM
   ========================= */
const AURA_SYSTEM = {
  name: "Aura",
  role: "Human-first, consent-based companion intelligence",
  mission: "Organize information and actions so humans can act clearly."
};

/* =========================
   UI (STEP 11)
   ========================= */
function uiHtml() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aura</title>
<style>
body{margin:0;font-family:system-ui;background:#0b0f14;color:#e7ecf3}
.app{display:flex;flex-direction:column;height:100vh}
.chat{flex:1;overflow:auto;padding:12px}
.b{max-width:75%;margin:6px 0;padding:10px;border-radius:12px;white-space:pre-wrap}
.me{margin-left:auto;background:#1b2a44}
.a{margin-right:auto;background:#121b2b}
.bar{display:flex;gap:8px;padding:10px;border-top:1px solid #1c2536;background:#0f1621}
input[type=text]{flex:1;background:#0c1320;color:#fff;border:1px solid #263553;border-radius:10px;padding:10px}
button{background:#1b2a44;color:#fff;border:1px solid #263553;border-radius:10px;padding:8px 10px;cursor:pointer}
.small{font-size:12px;opacity:.75;margin:6px 12px}
</style>
</head>
<body>
<div class="app">
  <div class="small">Build: <b>${BUILD_VERSION}</b> · <b>${BUILD_STAMP}</b></div>
  <div id="chat" class="chat"></div>
  <div class="bar">
    <button id="mic">🎤</button>
    <input id="input" type="text" placeholder="Type or speak, press Enter…" />
    <button onclick="send()">Send</button>
  </div>
</div>
<script>
const chat=document.getElementById('chat');
const input=document.getElementById('input');
const micBtn=document.getElementById('mic');

function bubble(t,c){
  const d=document.createElement('div');
  d.className='b '+c;
  d.textContent=t;
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

async function send(textOverride){
  const t=(textOverride||input.value).trim();
  if(!t)return;
  input.value='';
  bubble(t,'me');
  const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'text/plain'},body:t});
  const j=await r.json();
  bubble(j.reply||JSON.stringify(j,null,2),'a');
}
input.addEventListener('keydown',e=>{if(e.key==='Enter')send()});

// Mic (webkitSpeechRecognition)
let rec;
if('webkitSpeechRecognition'in window){
  rec=new webkitSpeechRecognition();
  rec.continuous=false; rec.interimResults=true;
  rec.onresult=e=>{
    let s='';
    for(let i=e.resultIndex;i<e.results.length;i++)s+=e.results[i][0].transcript;
    input.value=s;
  };
}
micBtn.onclick=()=>{ if(rec)rec.start(); };

bubble('UI wired OK (STEP 11)','a');
</script>
</body>
</html>`;
}

/* =========================
   KV
   ========================= */
const KV_KEYS = {
  CITYGUIDE_CONTEXT: "aura:cityguide:world_context_last",
  CITYGUIDE_MODE: "aura:cityguide:mode",
  CITYGUIDE_ANALYSIS: "aura:cityguide:analysis",
  CITYGUIDE_HOOKS: "aura:cityguide:hooks",
  CITYGUIDE_SECTIONS: "aura:cityguide:sections",
  CITYGUIDE_LAYOUT: "aura:cityguide:layout",
  CITYGUIDE_LOCKED: "aura:cityguide:projection_locked",
  // World-scale
  CITYGUIDE_WORLD_MODE: "aura:cityguide:world_mode",
  CITYGUIDE_WORLD_SEED: "aura:cityguide:world_seed"
};

function kvOk(env){ return !!env.AURA_KV; }
async function kvPutJson(env, key, obj){
  if(!kvOk(env)) return false;
  await env.AURA_KV.put(key, JSON.stringify(obj));
  return true;
}
async function kvGetJson(env, key){
  if(!kvOk(env)) return null;
  const v = await env.AURA_KV.get(key);
  return v ? JSON.parse(v) : null;
}

/* =========================
   Helpers
   ========================= */
function slugCity(name){
  return String(name||"").trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-]/g,"");
}
function cityKey(base, cityName){
  return `${base}:${slugCity(cityName)}`;
}
function parseCsvCities(s){
  return String(s||"")
    .split(",")
    .map(x=>x.trim())
    .filter(Boolean);
}

/* =========================
   PLACE RESOLUTION
   ========================= */
function resolvePlace(query){
  const q = String(query||"").toLowerCase();
  if (q.includes("malibu")) return { city:"Malibu", region:"California", country:"United States", backdrop:"Malibu coastline cliffs and Pacific Ocean" };
  if (q.includes("paris")) return { city:"Paris", region:"Île-de-France", country:"France", backdrop:"Paris skyline with Eiffel Tower at dusk" };
  if (q.includes("lugano")) return { city:"Lugano", region:"Ticino", country:"Switzerland", backdrop:"Lake Lugano with Alps and waterfront" };
  if (q.includes("las vegas") || q.includes("vegas")) return { city:"Las Vegas", region:"Nevada", country:"United States", backdrop:"Las Vegas Strip at night with neon skyline" };
  return { city:null, region:null, country:null, backdrop:"Global city skyline landmark" };
}

/* =========================
   CITY ANALYSIS + HOOKS (instant heuristic, no APIs)
   ========================= */
function analyzeFromResolved(resolved){
  const city = resolved?.city || "Unknown";
  const country = resolved?.country || "Unknown";
  const region = resolved?.region || "Unknown";
  const backdrop = resolved?.backdrop || "Global city skyline landmark";

  const cityKey = String(city).toLowerCase();

  if (cityKey === "malibu") {
    return {
      city, region, country, backdrop,
      vibe: "coastal-relaxed",
      primary_intents: ["Beaches & Surfing", "Outdoor Adventures", "Local Attractions", "Wellness", "Sunsets"],
      hooks: {
        top_things: ["Beaches & Surfing", "Outdoor Adventures", "Local Attractions"],
        events: ["Farmers Market", "Sunset Yoga", "Wine Tasting"],
        dining: ["Seafood", "Oceanfront Dining", "Casual Cafés"],
        experiences: ["Point Dume", "Malibu Pier", "Hiking"],
      }
    };
  }

  if (cityKey === "paris") {
    return {
      city, region, country, backdrop,
      vibe: "romantic-cultural",
      primary_intents: ["Landmarks & Tours", "Art & Culture", "Local Activities", "Cafés", "Shopping"],
      hooks: {
        top_things: ["Landmarks & Tours", "Art & Culture", "Local Activities"],
        events: ["Fashion Week", "Concerts", "Food Markets"],
        dining: ["Bistros", "Cafés", "Wine Bars"],
        experiences: ["Seine Cruise", "Museums", "Neighborhood Walks"],
      }
    };
  }

  if (cityKey === "las vegas") {
    return {
      city, region, country, backdrop,
      vibe: "electric-entertainment",
      primary_intents: ["Concerts & Shows", "Nightlife & Parties", "Local Attractions", "Dining & Casinos"],
      hooks: {
        top_things: ["Concerts & Shows", "Nightlife & Parties", "Local Attractions"],
        events: ["Residencies", "Club Nights", "Festivals"],
        dining: ["Celebrity Chefs", "Late Night", "Buffets"],
        experiences: ["Strip Highlights", "Grand Canyon Tours", "Pools"],
      }
    };
  }

  // Generic inference by geography keywords in backdrop
  const b = String(backdrop).toLowerCase();
  const isCoastal = b.includes("coast") || b.includes("ocean") || b.includes("beach");
  const isMountain = b.includes("alps") || b.includes("mountain") || b.includes("lake");
  const vibe = isCoastal ? "coastal" : (isMountain ? "alpine-lakeside" : "urban");
  const primary_intents = isCoastal
    ? ["Beaches", "Food", "Outdoor", "Local Spots"]
    : isMountain
      ? ["Scenery", "Outdoor", "Culture", "Food"]
      : ["Attractions", "Dining", "Culture", "Events"];

  return {
    city, region, country, backdrop,
    vibe,
    primary_intents,
    hooks: {
      top_things: primary_intents.slice(0,3),
      events: ["Seasonal Highlights", "Local Calendar Picks", "Live Music"],
      dining: ["Top Restaurants", "Local Favorites", "Markets"],
      experiences: ["Signature Landmark", "Neighborhoods", "Day Trips"],
    }
  };
}

function mapHooksToSections(analysis){
  const h = analysis?.hooks || {};
  const top = Array.isArray(h.top_things) ? h.top_things : [];
  const events = Array.isArray(h.events) ? h.events : [];
  const dining = Array.isArray(h.dining) ? h.dining : [];
  const experiences = Array.isArray(h.experiences) ? h.experiences : [];

  return {
    hero: {
      title: (analysis?.city || "CITY").toUpperCase(),
      subtitle: "CITY GUIDE",
      tagline: `Your Ultimate Guide to ${analysis?.city || "the City"}`,
      backdrop: analysis?.backdrop || "Global city skyline landmark"
    },
    sections: [
      { id:"top_things", title:`Top Things to Do in ${analysis?.city || "this City"}`, type:"three_cards", items: top.slice(0,3) },
      { id:"events", title:"Upcoming Events", type:"list", items: events.slice(0,6) },
      { id:"dining", title: (analysis?.city && String(analysis.city).toLowerCase()==="las vegas") ? "Dining & Casinos" : "Dining & Activities", type:"list", items: [...dining.slice(0,4), ...experiences.slice(0,2)].slice(0,6) }
    ]
  };
}

/* =========================
   World pipeline (no APIs)
   ========================= */
async function worldAnalyzeCity(env, cityName){
  const resolved = resolvePlace(cityName);
  const context = { type:"cityguide_world_context", input: cityName, resolved, build: BUILD_VERSION, ts: new Date().toISOString() };
  const analysis = { ...analyzeFromResolved(resolved), ts:new Date().toISOString(), build: BUILD_VERSION };
  const layout = mapHooksToSections(analysis);

  await kvPutJson(env, cityKey("aura:cityguide:context", cityName), context);
  await kvPutJson(env, cityKey("aura:cityguide:analysis", cityName), analysis);
  await kvPutJson(env, cityKey("aura:cityguide:layout", cityName), { layout, ts:new Date().toISOString(), build: BUILD_VERSION });

  return { city: resolved.city || cityName, vibe: analysis.vibe, status: "ready" };
}

/* =========================
   COMMAND ROUTER
   ========================= */
async function handleCommand(cmd, env){
  const c = String(cmd||"").trim();
  if(!c) return { ok:false, reply:"Empty command." };

  // --- World-scale commands ---
  if(c.startsWith("CITYGUIDE_WORLD_MODE:")){
    const mode = c.slice("CITYGUIDE_WORLD_MODE:".length).trim().toUpperCase();
    await kvPutJson(env, KV_KEYS.CITYGUIDE_WORLD_MODE, { mode, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:`CityGuide world mode set to ${mode}.` };
  }

  if(c.startsWith("CITYGUIDE_WORLD_SEED:")){
    const list = parseCsvCities(c.slice("CITYGUIDE_WORLD_SEED:".length));
    await kvPutJson(env, KV_KEYS.CITYGUIDE_WORLD_SEED, { cities: list, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:`World seed set (${list.length} cities).`, cities: list };
  }

  if(c === "CITYGUIDE_WORLD_ANALYZE"){
    const seed = await kvGetJson(env, KV_KEYS.CITYGUIDE_WORLD_SEED);
    const cities = seed?.cities || [];
    const results = [];
    for (const name of cities) {
      results.push(await worldAnalyzeCity(env, name));
    }
    await kvPutJson(env, "aura:cityguide:world_index", { results, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:`World analyzed: ${results.length} cities.`, results };
  }

  if(c === "CITYGUIDE_WORLD_LIST"){
    const idx = await kvGetJson(env, "aura:cityguide:world_index");
    const results = idx?.results || [];
    const lines = ["World cities:"];
    for (const r of results) lines.push(`- ${r.city} (${r.vibe}) [${r.status}]`);
    return { ok:true, reply: lines.join("\n"), results };
  }

  if(c.startsWith("CITYGUIDE_WORLD_PROJECT:")){
    const city = c.slice("CITYGUIDE_WORLD_PROJECT:".length).trim();
    const layout = await kvGetJson(env, cityKey("aura:cityguide:layout", city));
    return { ok:true, reply:`Projected layout for ${city} (no deploy).`, layout: layout?.layout || null };
  }

  // --- Single-city pipeline (57B preserved) ---
  if(c.startsWith("CITYGUIDE_WORLD_CONTEXT:")){
    const raw = c.slice("CITYGUIDE_WORLD_CONTEXT:".length).trim();
    const resolved = resolvePlace(raw);
    const context = { type:"cityguide_world_context", input: raw, resolved, build: BUILD_VERSION, ts: new Date().toISOString() };
    await kvPutJson(env, KV_KEYS.CITYGUIDE_CONTEXT, context);
    return {
      ok:true,
      reply:[
        "CityGuide world context established.",
        `City: ${resolved.city || "unknown"}`,
        `Region: ${resolved.region || "unknown"}`,
        `Country: ${resolved.country || "unknown"}`,
        `Backdrop: ${resolved.backdrop}`
      ].join("\n"),
      context
    };
  }

  if(c.startsWith("CITYGUIDE_MODE:")){
    const mode = c.slice("CITYGUIDE_MODE:".length).trim().toUpperCase();
    await kvPutJson(env, KV_KEYS.CITYGUIDE_MODE, { mode, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:`CityGuide mode set to ${mode}.` };
  }

  if(c === "CITYGUIDE_BIND_CONTEXT"){
    const ctx = await kvGetJson(env, KV_KEYS.CITYGUIDE_CONTEXT);
    return { ok:true, reply:"CityGuide context bound.", context: ctx };
  }

  if(c === "CITYGUIDE_PROJECT_VIEW"){
    const ctx = await kvGetJson(env, KV_KEYS.CITYGUIDE_CONTEXT);
    return { ok:true, reply:"Projected CityGuide view (no deploy).", projection:{ city: ctx?.resolved?.city, backdrop: ctx?.resolved?.backdrop } };
  }

  if(c === "CITYGUIDE_BACKDROP_RULES"){
    return { ok:true, reply:"Backdrop rules:\n- One city = one canonical hero backdrop\n- Backdrop derived from Aura world context\n- CityGuide renders, Aura decides." };
  }

  if(c === "CITYGUIDE_ANALYZE_CITY"){
    const ctx = await kvGetJson(env, KV_KEYS.CITYGUIDE_CONTEXT);
    const analysis = analyzeFromResolved(ctx?.resolved || null);
    const payload = { ...analysis, ts:new Date().toISOString(), build: BUILD_VERSION };
    await kvPutJson(env, KV_KEYS.CITYGUIDE_ANALYSIS, payload);
    return { ok:true, reply:`City analyzed.\nCity: ${payload.city}\nVibe: ${payload.vibe}`, analysis: payload };
  }

  if(c === "CITYGUIDE_GENERATE_HOOKS"){
    const analysis = await kvGetJson(env, KV_KEYS.CITYGUIDE_ANALYSIS);
    const hooks = analysis?.hooks || {};
    await kvPutJson(env, KV_KEYS.CITYGUIDE_HOOKS, { hooks, ts:new Date().toISOString(), build: BUILD_VERSION });
    const lines = [
      "Hooks generated:",
      ...(hooks.top_things ? ["Top: " + hooks.top_things.join(", ")] : []),
      ...(hooks.events ? ["Events: " + hooks.events.join(", ")] : []),
      ...(hooks.dining ? ["Dining: " + hooks.dining.join(", ")] : []),
      ...(hooks.experiences ? ["Experiences: " + hooks.experiences.join(", ")] : []),
    ];
    return { ok:true, reply: lines.join("\n"), hooks };
  }

  if(c === "CITYGUIDE_MAP_SECTIONS"){
    const analysis = await kvGetJson(env, KV_KEYS.CITYGUIDE_ANALYSIS);
    const layout = mapHooksToSections(analysis);
    await kvPutJson(env, KV_KEYS.CITYGUIDE_SECTIONS, { sections: layout.sections, hero: layout.hero, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:"Sections mapped.", sections: layout.sections, hero: layout.hero };
  }

  if(c === "CITYGUIDE_PROJECT_LAYOUT"){
    const analysis = await kvGetJson(env, KV_KEYS.CITYGUIDE_ANALYSIS);
    const layout = mapHooksToSections(analysis);
    await kvPutJson(env, KV_KEYS.CITYGUIDE_LAYOUT, { layout, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:"Projected CityGuide layout (no deploy).", layout };
  }

  if(c === "CITYGUIDE_LOCK_PROJECTION"){
    await kvPutJson(env, KV_KEYS.CITYGUIDE_LOCKED, { locked:true, ts:new Date().toISOString(), build: BUILD_VERSION });
    return { ok:true, reply:"CityGuide projection locked." };
  }

  if(c.startsWith("RESOLVE_PLACE:")){
    return { ok:true, resolved: resolvePlace(c.slice("RESOLVE_PLACE:".length).trim()) };
  }

  if(/^WHO ARE YOU\??$/i.test(c)){
    return { ok:true, reply:`I am ${AURA_SYSTEM.name}. ${AURA_SYSTEM.role}. Mission: ${AURA_SYSTEM.mission}` };
  }

  if(c === "SHOW_BUILD"){
    return { ok:true, reply:`${BUILD_VERSION} · ${BUILD_STAMP}` };
  }

  if(c === "CAPABILITIES"){
    return { ok:true, reply: "Place resolution\nWorld context synthesis\nCityGuide projection (non-deploy)\nBackdrop rule generation\nCity analysis and hook synthesis\nKV-backed memory\nWorld-scale orchestration" };
  }

  if(c === "BOOT_BRIEF"){
    return { ok:true, reply:`${BUILD_VERSION}\n${AURA_SYSTEM.mission}` };
  }

  return { ok:true, reply:"I am live. Run BOOT_BRIEF." };
}

/* =========================
   ROUTERS
   ========================= */
async function chatRouter(req, env){
  const text = await req.text();
  const out = await handleCommand(text, env);
  return json(out);
}
function health(){
  return json({ ok:true, version: BUILD_VERSION, stamp: BUILD_STAMP });
}

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    if(req.method === "GET" && url.pathname === "/") return html(`<script>location.href='/ui'</script>`);
    if(req.method === "GET" && url.pathname === "/ui") return html(uiHtml());
    if(req.method === "GET" && url.pathname === "/health") return health();
    if(req.method === "POST" && url.pathname === "/chat") return chatRouter(req, env);
    return json({ ok:false, error:"not_found" }, 404);
  }
};
