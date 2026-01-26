// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-22__AUTONOMY_STEP_31__UI_LOCK_STEP11_PLUS_KV_MEMORY__01
// Full-file replacement.
// UI: LOCKED to known-good STEP 11 inline UI (send/enter/mic/upload works). DO NOT MODIFY UI.
// Backend: Batch scripting + deployer launch + KV-backed memory (pinned briefing + chat log) WITHOUT touching UI wiring.
// Stamp: 2026-01-22 11:40 PT

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: JSON_HEADERS });
}
function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", ...extraHeaders },
  });
}

const BUILD_VERSION = "AURA_CORE__2026-01-22__AUTONOMY_STEP_53B__CITYGUIDE_EXTERNAL_MODULE_SOURCE__01";
const BUILD_STAMP = "2026-01-22 23:10 PT";

/* =========================
   AURA SYSTEM BRAIN (LOCKED)
   ========================= */
const AURA_SYSTEM = {
  name: "Aura",
  role: "Human-first, consent-based companion intelligence",
  environment: "Cloudflare Worker (LIVE)",
  mission: "Organize information and actions so humans can act clearly.",
  capabilities: [
    "Reasoning and explanation",
    "Planning and decomposition",
    "Self-inspection of environment",
    "Secure self-deployment via deployer",
    "Managing city guides and presence systems",
    "Autonomous action when explicitly authorized",
    "KV-backed pinned memory + chat log (if env.AURA_KV bound)"
  ],
  guardrails: [
    "Be transparent about limits",
    "Ask before irreversible actions",
    "Avoid manipulation or coercion",
    "Operate with consent and clarity"
  ]
};

/* =========================
   UI (LOCKED to STEP 11)
   ========================= */
function uiHtml() {
  // NOTE: Keep this as inline JS. Do not add CSP that blocks inline scripts.
  // UI IS LOCKED FOREVER. DO NOT MODIFY.
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
img.chatimg{max-width:100%;border-radius:8px;margin-top:6px}
.bar{display:flex;gap:8px;padding:10px;border-top:1px solid #1c2536;background:#0f1621}
input[type=text]{flex:1;background:#0c1320;color:#fff;border:1px solid #263553;border-radius:10px;padding:10px}
button{background:#1b2a44;color:#fff;border:1px solid #263553;border-radius:10px;padding:8px 10px;cursor:pointer}
.small{font-size:12px;opacity:.75;margin:6px 12px}
</style>
</head>
<body>
<div class="app">
  <div class="small">Build: <b>${BUILD_VERSION}</b> · <b>${BUILD_STAMP}</b> · Tip: <b>LAUNCH_CITYGUIDE_NOW</b> · Batch: <b>BEGIN_SCRIPT</b></div>
  <div id="chat" class="chat"></div>
  <div class="bar">
    <input id="file" type="file" hidden />
    <button onclick="file.click()">📎</button>
    <button id="mic">🎤</button>
    <input id="input" type="text" placeholder="Type or speak, press Enter…" />
    <button onclick="send()">Send</button>
  </div>
</div>
<script>
const chat=document.getElementById('chat');
const input=document.getElementById('input');
const file=document.getElementById('file');
const micBtn=document.getElementById('mic');

function bubble(t,c){
  const d=document.createElement('div');
  d.className='b '+c;
  d.textContent=t;
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}
function imageBubble(src,c){
  const d=document.createElement('div');
  d.className='b '+c;
  const i=document.createElement('img');
  i.src=src; i.className='chatimg';
  d.appendChild(i);
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

async function send(textOverride){
  const t=(textOverride||input.value).trim();
  if(!t)return;
  input.value='';
  bubble(t,'me');
  const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'text/plain; charset=utf-8'},body:t});
  const j=await r.json();
  if(j.mode==='batch' && Array.isArray(j.results)){
    bubble(JSON.stringify(j,null,2),'a');
    return;
  }
  if(j.image_base64){
    imageBubble(j.image_base64,'a');
  }
  if(j.reply){
    bubble(j.reply,'a');
  } else if(j.error){
    bubble('Error: '+j.error,'a');
  } else {
    bubble(JSON.stringify(j,null,2),'a');
  }
}
input.addEventListener('keydown',e=>{if(e.key==='Enter')send()});

// Upload
file.onchange=async()=>{
  const f=file.files[0]; if(!f)return;
  if(f.type && f.type.startsWith('image/')){
    const reader=new FileReader();
    reader.onload=()=>{
      bubble('[image uploaded]','me');
      send('IMAGE_BASE64:'+reader.result);
    };
    reader.readAsDataURL(f);
  } else {
    const txt=await f.text();
    bubble('[file uploaded] '+f.name,'me');
    send('FILE:'+f.name+'\\n'+txt.slice(0,8000));
  }
};

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

bubble('UI wired OK (STEP 11 locked) — ${BUILD_STAMP}','a');
</script>
</body>
</html>`;
}

/* =========================
   KV Memory (pinned + logs)
   ========================= */

const KV_KEYS = {
  PINNED: "aura:pinned_briefing",
  LOG_INDEX: "aura:log_index", // JSON array of log keys, capped
  CITYGUIDE_SOURCE: "aura:cityguide:source_url",
  CITYGUIDE_PREP: "aura:cityguide:prep",
  CITYGUIDE_STATUS: "aura:cityguide:status"
};

function kvOk(env){ return !!(env && env.AURA_KV); }

async function kvGetText(env, key){
  if(!kvOk(env)) return null;
  const v = await env.AURA_KV.get(key);
  return v === null ? null : String(v);
}

async function kvPutText(env, key, value){
  if(!kvOk(env)) return false;
  await env.AURA_KV.put(key, String(value||""));
  return true;
}

async function kvGetJson(env, key){
  const t = await kvGetText(env, key);
  if(!t) return null;
  try { return JSON.parse(t); } catch { return null; }
}

async function kvPutJson(env, key, obj){
  return kvPutText(env, key, JSON.stringify(obj));
}

async function cityguideSetStatus(env, patch){
  if(!kvOk(env)) return { ok:false, error:"no_kv" };
  const cur = (await kvGetJson(env, KV_KEYS.CITYGUIDE_STATUS)) || {};
  const next = { ...cur, ...patch, ts: new Date().toISOString() };
  await kvPutJson(env, KV_KEYS.CITYGUIDE_STATUS, next);
  return { ok:true, status: next };
}

function makeLogKey(){
  const d = new Date();
  const iso = d.toISOString().slice(0,10); // YYYY-MM-DD
  const rand = Math.random().toString(16).slice(2);
  return `aura:log:${iso}:${Date.now()}:${rand}`;
}

async function appendLogIndex(env, key){
  if(!kvOk(env)) return { ok:false, reason:"no_kv" };
  const idx = (await kvGetJson(env, KV_KEYS.LOG_INDEX)) || [];
  idx.push(key);
  const capped = idx.slice(-200);
  await kvPutJson(env, KV_KEYS.LOG_INDEX, capped);
  return { ok:true, count:capped.length };
}

async function writeChatLog(env, incomingText, resultObj){
  if(!kvOk(env)) return { ok:false, reason:"no_kv" };

  const entry = {
    ts: new Date().toISOString(),
    in: String(incomingText||"").slice(0, 20000),
    out: resultObj
  };

  const key = makeLogKey();
  await kvPutJson(env, key, entry);
  const idxRes = await appendLogIndex(env, key);
  return { ok:true, key, index: idxRes };
}

async function readLastLogs(env, n){
  if(!kvOk(env)) return { ok:false, error:"no_kv" };
  const idx = (await kvGetJson(env, KV_KEYS.LOG_INDEX)) || [];
  const keys = idx.slice(-Math.max(1, Math.min(50, n||10)));
  const items = [];
  for (const k of keys) {
    const v = await kvGetJson(env, k);
    if (v) items.push({ key:k, ts:v.ts, in_preview: String(v.in||"").slice(0,200) });
  }
  return { ok:true, count: items.length, items };
}

/* =========================
   CityGuide.World bundle (PLAIN JS ONLY)
   ========================= */
function buildCityGuideBundle(versionStamp){
  const v = String(versionStamp||"CITYGUIDE_WORLD__BOOT__02");
  // NOTE: This bundle is deployed to the separate Worker "cityguide-world" via AURA_DEPLOYER.
  // It is intentionally self-contained: UI + Google Places API endpoints.
  return `addEventListener("fetch", event => {
  event.respondWith(fetchHandler(event.request));
});

async function fetchHandler(request) {
    const url = new URL(request.url);
    const method = request.method || "GET";

    const json = (obj, status=200, extra={}) => new Response(JSON.stringify(obj), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", ...extra }
    });

    // Health
    if (method === "GET" && url.pathname === "/health") {
      return json({ ok:true, version: "CITYGUIDE_WORLD__${v}" });
    }

    const requirePlacesKey = () => {
      if (typeof PLACES_API_KEY === "undefined" || !PLACES_API_KEY) return json({ ok:false, error:"missing_places_api_key" }, 500);
      return null;
    };

    // POST /api/search { query }
    if (method === "POST" && url.pathname === "/api/search") {
      const e = requirePlacesKey(); if (e) return e;
      let body = {};
      try { body = await request.json(); } catch(_e) {}
      const query = body && body.query ? String(body.query).slice(0,200) : "";
      if (!query) return json({ ok:false, error:"missing_query" }, 400);

      const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos"
        },
        body: JSON.stringify({ textQuery: query })
      });
      const data = await resp.json().catch(() => ({}));
      const results = (data && data.places) ? data.places : [];
      return json({
        ok:true,
        results: results.map(p => ({
          placeId: p.id,
          name: (p.displayName && p.displayName.text) ? p.displayName.text : "",
          address: p.formattedAddress || "",
          rating: (p.rating == null ? null : p.rating),
          openNow: (p.currentOpeningHours && p.currentOpeningHours.openNow) ? true : false,
          photo: (p.photos && p.photos[0] && p.photos[0].name) ? ("/api/photo?name=" + encodeURIComponent(p.photos[0].name)) : null
        }))
      });
    }

    // GET /api/nearby?type=&lat=&lng=
    if (method === "GET" && url.pathname === "/api/nearby") {
      const e = requirePlacesKey(); if (e) return e;
      const type = url.searchParams.get("type") || "restaurant";
      const lat = Number(url.searchParams.get("lat"));
      const lng = Number(url.searchParams.get("lng"));
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ ok:false, error:"missing_lat_lng" }, 400);

      const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos"
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 20,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 6000 } }
        })
      });
      const data = await resp.json().catch(() => ({}));
      const results = (data && data.places) ? data.places : [];
      return json({
        ok:true,
        results: results.map(p => ({
          placeId: p.id,
          name: (p.displayName && p.displayName.text) ? p.displayName.text : "",
          address: p.formattedAddress || "",
          rating: (p.rating == null ? null : p.rating),
          openNow: (p.currentOpeningHours && p.currentOpeningHours.openNow) ? true : false,
          photo: (p.photos && p.photos[0] && p.photos[0].name) ? ("/api/photo?name=" + encodeURIComponent(p.photos[0].name)) : null
        }))
      });
    }

    // GET /api/place?id=
    if (method === "GET" && url.pathname === "/api/place") {
      const e = requirePlacesKey(); if (e) return e;
      const id = url.searchParams.get("id");
      if (!id) return json({ ok:false, error:"missing_id" }, 400);

      const resp = await fetch("https://places.googleapis.com/v1/places/" + encodeURIComponent(id), {
        headers: {
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,internationalPhoneNumber,websiteUri,currentOpeningHours"
        }
      });
      const p = await resp.json().catch(() => ({}));
      return json({
        ok:true,
        placeId: p.id || id,
        name: (p.displayName && p.displayName.text) ? p.displayName.text : "",
        address: p.formattedAddress || "",
        phone: p.internationalPhoneNumber || "",
        website: p.websiteUri || "",
        hours: (p.currentOpeningHours && p.currentOpeningHours.weekdayDescriptions) ? p.currentOpeningHours.weekdayDescriptions.join(" · ") : ""
      });
    }

    // GET /api/photo?name=
    if (method === "GET" && url.pathname === "/api/photo") {
      const e = requirePlacesKey(); if (e) return e;
      const name = url.searchParams.get("name");
      if (!name) return json({ ok:false, error:"missing_name" }, 400);

      const mediaUrl = "https://places.googleapis.com/v1/" + encodeURIComponent(name) + "/media?maxHeightPx=420";
      const resp = await fetch(mediaUrl, { headers: { "X-Goog-Api-Key": PLACES_API_KEY } });
      const ct = resp.headers.get("content-type") || "image/jpeg";
      return new Response(resp.body, {
        status: resp.status,
        headers: { "content-type": ct, "cache-control": "public, max-age=86400" }
      });
    }

    // UI
    const html = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>CityGuide.World</title>\n<style>\n:root { color-scheme: dark; }\n* { box-sizing: border-box; }\nbody{\n  margin:0; min-height:100vh; display:grid; place-items:center; padding:24px;\n  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;\n  background: radial-gradient(1200px 600px at 50% 0%, #0f1722, #070a10);\n  color:#fff;\n}\n.card{\n  width:100%; max-width:960px; padding:22px; border-radius:18px;\n  background: rgba(20,26,34,0.92); box-shadow: 0 20px 50px rgba(0,0,0,0.45);\n}\nh1{ margin:0 0 6px; }\np{ margin:0 0 14px; opacity:0.9; }\n.row{ display:flex; gap:10px; }\ninput{\n  flex:1; padding:12px 14px; border-radius:14px;\n  border:1px solid rgba(255,255,255,0.15); background:#0f141b; color:#fff; outline:none;\n}\nbutton{\n  padding:12px 16px; border-radius:14px; cursor:pointer;\n  border:1px solid rgba(255,255,255,0.20); background:#1b2432; color:#fff;\n}\n.chips{ display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; }\n.chip{\n  padding:8px 12px; border-radius:999px; cursor:pointer; font-size:13px;\n  border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);\n}\n.grid{\n  display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));\n  gap:12px; margin-top:14px;\n}\n.item{\n  background: rgba(255,255,255,0.06); border-radius:12px; overflow:hidden;\n  display:flex; flex-direction:column; cursor:pointer;\n}\n.thumb{ height:140px; background:#0f141b; }\n.thumb img{ width:100%; height:100%; object-fit:cover; display:block; }\n.body{ padding:12px; }\n.body b{ display:block; margin-bottom:4px; }\n.muted{ opacity:0.75; font-size:13px; }\n.badges{ display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }\n.badge{\n  font-size:12px; padding:4px 8px; border-radius:999px;\n  border:1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);\n}\n.foot{ margin-top:14px; font-size:12px; opacity:0.75; }\n.modal{\n  position:fixed; inset:0; background: rgba(0,0,0,0.60);\n  display:none; align-items:center; justify-content:center; padding:16px;\n}\n.modal .card{ max-width:720px; }\n.close{ float:right; cursor:pointer; opacity:0.85; }\n.skel{ background: linear-gradient(90deg, #0f141b, #1b2432, #0f141b); background-size: 200% 100%; animation: sh 1.2s infinite; }\n@keyframes sh { 0%{background-position:0 0} 100%{background-position:200% 0} }\na{ color:inherit; }\n</style>\n</head>\n<body>\n<div class=\"card\">\n  <h1>CityGuide.World</h1>\n  <p>Search places anywhere, or explore what\u2019s nearby. Powered by Aura.</p>\n\n  <div class=\"row\">\n    <input id=\"q\" placeholder=\"Try: Malibu sushi \u00b7 Paris museums \u00b7 Lugano hotels\">\n    <button id=\"btnSearch\">Search</button>\n  </div>\n\n  <div class=\"chips\">\n    <div class=\"chip\" data-type=\"restaurant\">Dining</div>\n    <div class=\"chip\" data-type=\"tourist_attraction\">Sights</div>\n    <div class=\"chip\" data-type=\"lodging\">Hotels</div>\n    <div class=\"chip\" data-type=\"bar\">Bars</div>\n    <div class=\"chip\" data-type=\"shopping_mall\">Shopping</div>\n    <div class=\"chip\" data-type=\"cafe\">Cafe</div>\n  </div>\n\n  <div id=\"results\" class=\"grid\"></div>\n\n  <div class=\"foot\">Nearby uses your location when allowed. Otherwise defaults to Malibu, CA.</div>\n</div>\n\n<div id=\"modal\" class=\"modal\">\n  <div class=\"card\">\n    <span class=\"close\" id=\"closeModal\">X</span>\n    <div id=\"detail\"></div>\n  </div>\n</div>\n\n<script>\n(function(){\n  const DEFAULT = { lat: 34.0259, lng: -118.7798, label: \"Malibu, CA\" };\n  let userPos = { lat: DEFAULT.lat, lng: DEFAULT.lng };\n\n  if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {\n    navigator.geolocation.getCurrentPosition(function(pos){\n      userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };\n    }, function(){});\n  }\n\n  function skeleton(n){\n    const el = document.getElementById(\"results\");\n    el.innerHTML = \"\";\n    for (let i=0;i<n;i++){\n      const d = document.createElement(\"div\");\n      d.className = \"item\";\n      d.innerHTML = '<div class=\"thumb skel\"></div><div class=\"body\"><div class=\"skel\" style=\"height:14px;width:70%\"></div><div class=\"skel\" style=\"height:12px;width:90%;margin-top:8px\"></div></div>';\n      el.appendChild(d);\n    }\n  }\n\n  function render(data){\n    const el = document.getElementById(\"results\");\n    el.innerHTML = \"\";\n    const arr = (data && data.results) ? data.results : [];\n    if (!arr.length){\n      el.innerHTML = '<div class=\"muted\">No results.</div>';\n      return;\n    }\n    for (const p of arr){\n      const d = document.createElement(\"div\");\n      d.className = \"item\";\n      const photo = p.photo ? '<img alt=\"\" src=\"'+p.photo+'\">' : '';\n      const openNow = p.openNow ? '<span class=\"badge\">Open now</span>' : '';\n      d.innerHTML =\n        '<div class=\"thumb\">' + photo + '</div>' +\n        '<div class=\"body\">' +\n          '<b>' + (p.name || \"\") + '</b>' +\n          '<div class=\"muted\">' + (p.address || \"\") + '</div>' +\n          '<div class=\"badges\">' +\n            '<span class=\"badge\">Rating: ' + (p.rating == null ? \"-\" : p.rating) + '</span>' +\n            openNow +\n          '</div>' +\n        '</div>';\n      d.addEventListener(\"click\", function(){ openDetail(p.placeId); });\n      el.appendChild(d);\n    }\n  }\n\n  async function runSearch(){\n    const q = document.getElementById(\"q\").value.trim();\n    if (!q) return;\n    skeleton(6);\n    const r = await fetch(\"/api/search\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ query: q })\n    });\n    render(await r.json());\n  }\n\n  async function nearby(type){\n    skeleton(8);\n    const qs = \"type=\" + encodeURIComponent(type) + \"&lat=\" + encodeURIComponent(String(userPos.lat)) + \"&lng=\" + encodeURIComponent(String(userPos.lng));\n    const r = await fetch(\"/api/nearby?\" + qs);\n    render(await r.json());\n  }\n\n  async function openDetail(placeId){\n    const modal = document.getElementById(\"modal\");\n    const detail = document.getElementById(\"detail\");\n    detail.innerHTML = '<p class=\"skel\" style=\"height:16px;width:60%\"></p>';\n    modal.style.display = \"flex\";\n    const r = await fetch(\"/api/place?id=\" + encodeURIComponent(placeId));\n    const data = await r.json();\n    const hours = data && data.hours ? data.hours : \"\";\n    const website = data && data.website ? ('<a target=\"_blank\" rel=\"noreferrer\" href=\"' + data.website + '\">Website</a>') : \"\";\n    detail.innerHTML =\n      \"<h2>\" + (data.name || \"\") + \"</h2>\" +\n      \"<p>\" + (data.address || \"\") + \"</p>\" +\n      \"<p class='muted'>\" + (data.phone || \"\") + \"</p>\" +\n      \"<p class='muted'>\" + website + \"</p>\" +\n      \"<p class='muted'>\" + hours + \"</p>\";\n  }\n\n  document.getElementById(\"btnSearch\").addEventListener(\"click\", runSearch);\n  document.getElementById(\"q\").addEventListener(\"keydown\", function(e){ if (e.key === \"Enter\") runSearch(); });\n\n  const chips = document.querySelectorAll(\".chip[data-type]\");\n  for (const c of chips){\n    c.addEventListener(\"click\", function(){ nearby(c.getAttribute(\"data-type\")); });\n  }\n\n  document.getElementById(\"closeModal\").addEventListener(\"click\", function(){\n    document.getElementById(\"modal\").style.display = \"none\";\n  });\n  document.getElementById(\"modal\").addEventListener(\"click\", function(e){\n    if (e.target && e.target.id === \"modal\") document.getElementById(\"modal\").style.display = \"none\";\n  });\n})();\n</script>\n</body>\n</html>\n";
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}`;
}

/* =========================
   Batch + command router
   ========================= */

function normalizeIncomingText(raw, ct) {
  let t = raw || "";
  // If we received true form-encoded data, extract q=... else keep raw.
  if (ct && ct.includes("application/x-www-form-urlencoded") && t.includes("=")) {
    const params = new URLSearchParams(t);
    t = params.get("q") || t;
  }
  return String(t);
}

function isBatch(text){
  return /BEGIN_SCRIPT/i.test(text);
}

function parseBatch(text){
  const t = String(text || "");

  // Preferred: multi-line blocks (works if caller can send newlines)
  if (t.includes("\n") || t.includes("\r")) {
    const lines = t.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const cmds = [];
    let started = false;
    for (const line0 of lines){
      const line = line0.replace(/^>>\s*/,"");
      if (/^BEGIN_SCRIPT$/i.test(line)) { started = true; continue; }
      if (/^END_SCRIPT$/i.test(line)) { break; }
      if (!started) continue;
      if (line.startsWith("#")) continue;
      cmds.push(line);
    }
    return cmds;
  }

  // Fallback: one-line scripts for STEP 11 UI (input is single-line).
  // Supported delimiters: "|" (recommended) or ";".
  // Example:
  // BEGIN_SCRIPT|SHOW_BUILD|SHOW_DEPLOY_STATE|MEMORY_STATUS|END_SCRIPT
  // For MEMORY_PIN with spaces, use:
  // BEGIN_SCRIPT|MEMORY_PIN:Your text with spaces here|BOOT_BRIEF|END_SCRIPT
  const upper = t.toUpperCase();
  const b = upper.indexOf("BEGIN_SCRIPT");
  if (b === -1) return [];
  const e = upper.indexOf("END_SCRIPT", b);
  if (e === -1) return [];

  let inner = t.slice(b + "BEGIN_SCRIPT".length, e).trim();

  // Strip leading delimiter if present
  if (inner.startsWith("|") || inner.startsWith(";")) inner = inner.slice(1);

  const parts = inner.split(/[|;]/).map(s=>s.trim()).filter(Boolean);
  return parts;
}


function safeB64(text){
  // Cloudflare Workers has btoa, but it expects Latin1.
  // Our bundle is ASCII; keep it that way.
  return btoa(text);
}

async function handleCommand(cmd, env, ctx){
  const c = String(cmd||"").trim();
  if (!c) return { ok:false, error:"empty_command" };

  // Memory commands
  if (c === "MEMORY_STATUS") {
    const pinned = await kvGetText(env, KV_KEYS.PINNED);
    const idx = await kvGetJson(env, KV_KEYS.LOG_INDEX);
    return {
      ok:true,
      kv_bound: kvOk(env),
      pinned_bytes: pinned ? pinned.length : 0,
      log_index_count: Array.isArray(idx) ? idx.length : 0
    };
  }
  if (c.startsWith("MEMORY_PIN ") || c.startsWith("MEMORY_PIN:")) {
    const text = c.startsWith("MEMORY_PIN:") ? c.slice("MEMORY_PIN:".length).trim() : c.slice("MEMORY_PIN ".length).trim();
    const ok = await kvPutText(env, KV_KEYS.PINNED, text);
    return { ok:true, kv_bound: kvOk(env), pinned_saved: ok, pinned_preview: text.slice(0, 240) };
  }
  if (c === "MEMORY_SHOW_PIN") {
    const pinned = await kvGetText(env, KV_KEYS.PINNED);
    return { ok:true, kv_bound: kvOk(env), pinned: pinned || "" };
  }
  if (c === "MEMORY_CLEAR_PIN") {
    const ok = await kvPutText(env, KV_KEYS.PINNED, "");
    return { ok:true, kv_bound: kvOk(env), cleared: ok };
  }
  if (c.startsWith("MEMORY_LAST")) {
    const parts = c.split(/\s+/);
    const n = parseInt(parts[1] || "10", 10);
    const res = await readLastLogs(env, n);
    return res;
  }
  if (c === "BOOT_BRIEF") {
    const pinned = await kvGetText(env, KV_KEYS.PINNED);
    const brief = [
      `Build: ${BUILD_VERSION} · ${BUILD_STAMP}`,
      `I am ${AURA_SYSTEM.name}. Role: ${AURA_SYSTEM.role}. Environment: ${AURA_SYSTEM.environment}.`,
      `Mission: ${AURA_SYSTEM.mission}`,
      "",
      "Pinned briefing:",
      pinned && pinned.trim() ? pinned.trim() : "(none pinned yet — use MEMORY_PIN <text>)"
    ].join("\n");
    return { ok:true, reply: brief };
  }

  // Core introspection
  if (c === "SHOW_BUILD") {
    return { ok:true, reply: `${BUILD_VERSION} · ${BUILD_STAMP}` };
  }

  if (c === "CAPABILITIES") {
    return { ok:true, reply: AURA_SYSTEM.capabilities.join("\n") };
  }

  if (c === "SHOW_DEPLOY_STATE") {
    return {
      ok: true,
      has_kv: !!env.AURA_KV,
      has_deployer_binding: !!env.AURA_DEPLOYER,
      has_deploy_secret: !!env.DEPLOY_SECRET,
      has_promote_phrase: !!env.PROMOTE_PHRASE,
      promote_phrase_source: env.PROMOTE_PHRASE ? "env.PROMOTE_PHRASE" : "default(PROMOTE_TO_PROD)"
    };
  }

  if (c === "PING_DEPLOYER") {
    if (!env.AURA_DEPLOYER) return { ok:false, error:"missing_deployer_binding" };

    const secret = (env.DEPLOY_SECRET||"");

    // SAFE AUTH PROBE:
    // Call the real deploy endpoint with required fields EXCEPT promotion_phrase.
    // Expected outcomes (all indicate deployer is reachable; some indicate auth is accepted):
    // - 401/403: auth rejected (bad/missing secret)
    // - 200 with {ok:false,error:"promotion_phrase_required"} or {ok:false,error:"missing_required_fields"}: endpoint reached and parsed JSON
    // This probe should NOT deploy anything because promotion_phrase is omitted.
    const probeBundle = 'export default { async fetch(){ return new Response("ok"); } };';
    const payload = {
      target: "prod",
      script_name: "cityguide-world",
      bundle_b64: safeB64(probeBundle)
      // promotion_phrase intentionally omitted
    };

    let r, text, body;
    try {
      r = await env.AURA_DEPLOYER.fetch("https://deployer/admin/foundry/deploy", {
        method:"POST",
        headers:{ "content-type":"application/json", "X-Deploy-Secret": secret },
        body: JSON.stringify(payload)
      });
      text = await r.text();
      try { body = JSON.parse(text); } catch { body = { raw: text }; }
    } catch (e) {
      return { ok:false, error:"fetch_failed", detail:String(e) };
    }

    // Interpret result
    const err = body && body.error ? String(body.error) : "";
    const authAcceptedSignals = ["promotion_phrase_required", "missing_required_fields", "script_name_required", "bundle_b64_required", "target_required"];
    const authLikelyAccepted = authAcceptedSignals.includes(err) || (body && body.ok === false && r.status !== 401);

    return {
      ok: authLikelyAccepted,
      status: r.status,
      error: err || null,
      body,
      note: authLikelyAccepted
        ? "Deployer reachable. Probe hit /admin/foundry/deploy and was parsed. promotion_phrase was intentionally omitted so nothing should deploy."
        : "Likely auth rejection (401) or unexpected response."
    };
  }


  /* =========================
     CityGuide non-blocking deploy (training)
     ========================= */

  
  if (c === "CITYGUIDE_PREP_PEEK") {
    const prep = await kvGetJson(env, KV_KEYS.CITYGUIDE_PREP);
    if (!prep || !prep.bundle_b64) return { ok:false, error:"no_prepared_bundle" };
    let decoded = "";
    try { decoded = atob(prep.bundle_b64); } catch(_e) { decoded = ""; }
    return {
      ok:true,
      script_name: prep.script_name,
      target: prep.target,
      promotion_phrase: prep.promotion_phrase,
      bundle_chars: decoded.length,
      head_line: (decoded.split("\n")[0] || "").slice(0,220),
      head: decoded.slice(0,220)
    };
  }

  
  // CityGuide external source URL (module script)
  if (c.startsWith("CITYGUIDE_SET_SOURCE:") || c.startsWith("CITYGUIDE_SET_SOURCE ")) {
    const url = c.startsWith("CITYGUIDE_SET_SOURCE:") ? c.slice("CITYGUIDE_SET_SOURCE:".length).trim() : c.slice("CITYGUIDE_SET_SOURCE ".length).trim();
    if (!url) return { ok:false, reply:"Missing URL.", error:"missing_url" };
    const ok = await kvPutText(env, KV_KEYS.CITYGUIDE_SOURCE, url);
    return { ok:true, reply:"CityGuide source URL saved.", saved: ok, url };
  }
  if (c === "CITYGUIDE_SHOW_SOURCE") {
    const url = await kvGetText(env, KV_KEYS.CITYGUIDE_SOURCE);
    return { ok:true, url: url || "" };
  }

if (c === "PREPARE_CITYGUIDE_PROBE_SW") {
    const promotion_phrase = env.PROMOTE_PHRASE || "PROMOTE_TO_PROD";
    const bundleText = buildCityGuideProbeSW("CITYGUIDE_PROBE_SW__"+BUILD_VERSION);
    const bundle_b64 = safeB64(bundleText);
    const prep = { target:"prod", script_name:"cityguide-world", bundle_b64, promotion_phrase, build: BUILD_VERSION };
    await kvPutJson(env, KV_KEYS.CITYGUIDE_PREP, prep);
    await cityguideSetStatus(env, { phase:"prepared", ok:true, note:"Prepared CityGuide PROBE (service-worker). Run COMMIT_CITYGUIDE." });
    return { ok:true, reply:"Prepared CityGuide PROBE (service-worker). Now run COMMIT_CITYGUIDE." };
  }

  if (c === "PREPARE_CITYGUIDE_PROBE_MODULE") {
    const promotion_phrase = env.PROMOTE_PHRASE || "PROMOTE_TO_PROD";
    const bundleText = buildCityGuideProbeModule("CITYGUIDE_PROBE_MODULE__"+BUILD_VERSION);
    const bundle_b64 = safeB64(bundleText);
    const prep = { target:"prod", script_name:"cityguide-world", bundle_b64, promotion_phrase, build: BUILD_VERSION };
    await kvPutJson(env, KV_KEYS.CITYGUIDE_PREP, prep);
    await cityguideSetStatus(env, { phase:"prepared", ok:true, note:"Prepared CityGuide PROBE (module). Run COMMIT_CITYGUIDE." });
    return { ok:true, reply:"Prepared CityGuide PROBE (module). Now run COMMIT_CITYGUIDE." };
  }

if (c === "PREPARE_CITYGUIDE") {
    const promotion_phrase = env.PROMOTE_PHRASE || "PROMOTE_TO_PROD";

    const sourceUrl = await kvGetText(env, KV_KEYS.CITYGUIDE_SOURCE);
    if (!sourceUrl || !sourceUrl.trim()) {
      await cityguideSetStatus(env, { phase:"failed", ok:false, error:"missing_source_url", note:"Set CityGuide source first: CITYGUIDE_SET_SOURCE:<url>" });
      return { ok:false, reply:"Missing CityGuide source URL. Set it with CITYGUIDE_SET_SOURCE:<url>.", error:"missing_source_url" };
    }

    let bundleText = "";
    try {
      const r = await fetch(sourceUrl, { method:"GET" });
      if (!r.ok) {
        await cityguideSetStatus(env, { phase:"failed", ok:false, error:"source_fetch_failed", status:r.status, note:"Could not fetch CityGuide source URL." });
        return { ok:false, reply:"Failed to fetch CityGuide source URL.", error:"source_fetch_failed", status:r.status };
      }
      bundleText = await r.text();
    } catch (e) {
      await cityguideSetStatus(env, { phase:"failed", ok:false, error:"source_fetch_exception", detail:String(e) });
      return { ok:false, reply:"Failed to fetch CityGuide source URL.", error:"source_fetch_exception", detail:String(e) };
    }

    const head = bundleText.slice(0, 400);
    const looksModule = /^\s*(?:\/\*[\s\S]*?\*\/\s*)*(?:(?:\/\/[^\n]*\n)\s*)*export\s+default\b/m.test(head) || /export\s+default\s*\{/m.test(head);
    if (!looksModule) {
      await cityguideSetStatus(env, { phase:"failed", ok:false, error:"not_module_format", note:"CityGuide source must be module syntax: export default { fetch(...) { ... } }" });
      return { ok:false, reply:"CityGuide source is not module format. It must start with export default.", error:"not_module_format", head: head.slice(0,200) };
    }

    const bundle_b64 = safeB64(bundleText);
    const prep = { target:"prod", script_name:"cityguide-world", bundle_b64, promotion_phrase, build: BUILD_VERSION, source_url: sourceUrl };
    await kvPutJson(env, KV_KEYS.CITYGUIDE_PREP, prep);
    await cityguideSetStatus(env, { phase:"prepared", ok:true, error:null, note:"Prepared CityGuide from external module source. Run COMMIT_CITYGUIDE to deploy.", source_url: sourceUrl, bundle_chars: bundleText.length, b64_chars: bundle_b64.length });

    return { ok:true, reply:"Prepared CityGuide from external source. Now run COMMIT_CITYGUIDE.", prepared:{ script_name:"cityguide-world", target:"prod", promotion_phrase }, source_url: sourceUrl };
  }

  if (c === "COMMIT_CITYGUIDE") {
    if (!env.AURA_DEPLOYER) return { ok:false, reply:"Commit failed.", error:"missing_deployer_binding" };
    const prep = await kvGetJson(env, KV_KEYS.CITYGUIDE_PREP);
    if (!prep || !prep.bundle_b64) return { ok:false, reply:"Commit failed.", error:"missing_prepared_bundle", hint:"Run PREPARE_CITYGUIDE first." };

    const secret = (env.DEPLOY_SECRET||"");
    const payload = { target: prep.target, script_name: prep.script_name, bundle_b64: prep.bundle_b64, promotion_phrase: prep.promotion_phrase };

    // Non-blocking: schedule the deploy and return immediately.
    const job_id = "cg_" + Date.now().toString(36) + "_" + Math.random().toString(16).slice(2);

    await cityguideSetStatus(env, { phase:"deploying", job_id, ok:true, note:"Deploy started in background." });

    if (ctx && ctx.waitUntil) {
      ctx.waitUntil((async () => {
        try {
          const r = await env.AURA_DEPLOYER.fetch("https://deployer/admin/foundry/deploy", {
            method:"POST",
            headers:{ "content-type":"application/json", "X-Deploy-Secret": secret },
            body: JSON.stringify(payload)
          });
          const text = await r.text();
          let body;
          try { body = JSON.parse(text); } catch { body = { raw:text }; }

          if (!r.ok || (body && body.ok === false)) {
            await cityguideSetStatus(env, { phase:"failed", ok:false, status:r.status, error:"deployer_failed", body });
            return;
          }
          await cityguideSetStatus(env, { phase:"deployed", ok:true, error:null, status:r.status, body });
        } catch (e) {
          await cityguideSetStatus(env, { phase:"failed", ok:false, error:"exception", detail:String(e) });
        }
      })());
    } else {
      // Fallback: if ctx missing, do the blocking behavior (should not happen in Workers).
      return { ok:false, reply:"Commit failed.", error:"missing_ctx_waitUntil" };
    }

    return { ok:true, reply:"CityGuide deploy started (non-blocking). Run CITYGUIDE_STATUS then CHECK_CITYGUIDE_HEALTH.", job_id };
  }

  if (c === "CITYGUIDE_STATUS") {
    const st = await kvGetJson(env, KV_KEYS.CITYGUIDE_STATUS);
    return { ok:true, status: st || { phase:"unknown", note:"No status yet. Run PREPARE_CITYGUIDE then COMMIT_CITYGUIDE." } };
  }

  if (c === "CHECK_CITYGUIDE_HEALTH") {
    try {
      const r = await fetch("https://cityguide.world/health", { method:"GET" });
      const text = await r.text();
      return { ok:true, reply:text, status:r.status };
    } catch (e) {
      return { ok:false, reply:"Health check failed.", error:"fetch_failed", detail:String(e) };
    }
  }

    if (c === "DRYRUN_LAUNCH_CITYGUIDE") {
    const bundleText = buildCityGuideBundle("CITYGUIDE_WORLD__"+BUILD_VERSION);
    const bundle_b64 = safeB64(bundleText);
    const headLine = (bundleText.split("\n")[0] || "").slice(0,220);
    return {
      ok:true,
      bundle_chars: bundleText.length,
      head_line: headLine,
      would_send:{
        target:"prod",
        script_name:"cityguide-world",
        promotion_phrase: env.PROMOTE_PHRASE || "PROMOTE_TO_PROD",
        bundle_b64_bytes: bundle_b64.length
      }
    };
  }

  if (c === "LAUNCH_CITYGUIDE_NOW") {
    // Backward-compatible alias: non-blocking deploy sequence.
    // 1) Prepare bundle into KV
    // 2) Commit deploy in background
    const prepRes = await handleCommand("PREPARE_CITYGUIDE", env, ctx);
    if (!prepRes || prepRes.ok === false) return prepRes;
    const commitRes = await handleCommand("COMMIT_CITYGUIDE", env, ctx);
    return commitRes;
  }


  if (c === "POST_LAUNCH_CHECKS") {
    return {
      ok:true,
      checks:[
        "Run: curl.exe -s https://cityguide.world/health | Out-Host",
        "Also run in Aura: CITYGUIDE_STATUS and CHECK_CITYGUIDE_HEALTH",
        "Open https://cityguide.world and confirm Build banner shows new version.",
        "If old UI appears, hard refresh (Ctrl+F5) or Incognito."
      ]
    };
  }

  // simple chat intents
  if (/^who are you\??$/i.test(c)) {
    return {
      ok:true,
      reply: `I am ${AURA_SYSTEM.name}. I am a ${AURA_SYSTEM.role} running as a ${AURA_SYSTEM.environment}. My mission is to ${AURA_SYSTEM.mission}`
    };
  }

  if (/^capabilities$/i.test(c)) {
    return { ok:true, reply: AURA_SYSTEM.capabilities.join("\n") };
  }

  return {
    ok:true,
    reply: "I am live. Run BOOT_BRIEF, then (optionally) MEMORY_PIN <briefing>. Use BEGIN_SCRIPT for batch."
  };
}

/* =========================
   LIVE CHAT ROUTER
   ========================= */
async function chatRouter(req, env, ctx) {
  const ct = req.headers.get("content-type") || "";
  const raw = normalizeIncomingText(await req.text(), ct);

  // Image passthrough for UI inline render
  if (raw.startsWith("IMAGE_BASE64:")) {
    const b64 = raw.slice("IMAGE_BASE64:".length);
    const out = { ok:true, reply:"Image received and rendered inline.", image_base64:b64 };
    // Log it (preview only)
    await writeChatLog(env, "[IMAGE_BASE64 payload omitted]", { ok:true, reply:"[image received]" });
    return json(out);
  }

  // Batch
  if (isBatch(raw)) {
    const cmds = parseBatch(raw);
    const results = [];
    for (const cmd of cmds) {
      const result = await handleCommand(cmd, env, ctx);
      results.push({ cmd, result });
    }
    const out = { ok:true, mode:"batch", count:results.length, results };
    await writeChatLog(env, raw, { ok:true, mode:"batch", count: results.length });
    return json(out);
  }

  // Single command
  const result = await handleCommand(raw.trim(), env, ctx);

  // Keep the old shape the UI expects
  const out = (result && typeof result === "object" && "reply" in result && !("mode" in result))
    ? (result.ok === undefined ? { ok:true, ...result } : result)
    : result;

  await writeChatLog(env, raw, out);
  return json(out);
}

/* =========================
   HEALTH
   ========================= */
function health() {
  return json({ ok:true, version: BUILD_VERSION, stamp: BUILD_STAMP });
}

/* =========================
   FETCH
   ========================= */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") return html(`<script>location.href='/ui'</script>`);
    if (req.method === "GET" && url.pathname === "/ui") return html(uiHtml());
    if (req.method === "GET" && url.pathname === "/health") return health();
    if (req.method === "POST" && url.pathname === "/chat") return chatRouter(req, env, ctx);
    return json({ ok:false, error:"not_found" }, 404);
  }
};



// Minimal deploy probes to detect which handler format the deployer upload path expects.
function buildCityGuideProbeSW(versionStamp){
  const v = String(versionStamp||"CITYGUIDE_PROBE_SW__01");
  return `addEventListener("fetch", event => {
  event.respondWith(handle(event.request));
});
async function handle(request){
  const url = new URL(request.url);
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ ok:true, version:"${v}", format:"service-worker" }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }
  return new Response("probe sw " + "${v}", { status: 200 });
}
`;
}
function buildCityGuideProbeModule(versionStamp){
  const v = String(versionStamp||"CITYGUIDE_PROBE_MODULE__01");
  return `export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok:true, version:"${v}", format:"module" }), {
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
    return new Response("probe module " + "${v}", { status: 200 });
  }
};`;
}


