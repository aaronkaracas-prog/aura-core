
// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-23__AUTONOMY_STEP_60__CITYGUIDE_WORLD_EXPORT__01
// Full-file replacement. DO NOT MERGE.
// UI: STEP 11 preserved.
// Adds world index export for CityGuide.World (enumeration only).

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: JSON_HEADERS });
}
function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", ...extraHeaders } });
}

const BUILD_VERSION = "AURA_CORE__2026-01-23__AUTONOMY_STEP_60__CITYGUIDE_WORLD_EXPORT__01";
const BUILD_STAMP = "2026-01-23 21:25 PT";

function uiHtml() {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
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
function bubble(t,c){const d=document.createElement('div');d.className='b '+c;d.textContent=t;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;}
async function send(){const t=input.value.trim();if(!t)return;input.value='';bubble(t,'me');const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'text/plain'},body:t});const j=await r.json();bubble(j.reply||JSON.stringify(j,null,2),'a');}
input.addEventListener('keydown',e=>{if(e.key==='Enter')send()});
bubble('UI wired OK (STEP 11)','a');
</script>
</body></html>`;
}

function kvOk(env){ return !!env.AURA_KV; }
async function kvGetJson(env, key){
  if(!kvOk(env)) return null;
  const v = await env.AURA_KV.get(key);
  return v ? JSON.parse(v) : null;
}

function slugCity(name){
  return String(name||"").trim().toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9\-]/g,"");
}

// ---- EXPORTS ----
async function exportCity(citySlug, env){
  const layout = await kvGetJson(env, `aura:cityguide:layout:${citySlug}`);
  const analysis = await kvGetJson(env, `aura:cityguide:analysis:${citySlug}`);
  if(!layout || !analysis) return json({ ok:false, error:"city_not_found" },404);
  return json({
    city: analysis.city,
    vibe: analysis.vibe,
    hero: layout.layout.hero,
    sections: layout.layout.sections,
    build: BUILD_VERSION,
    ts: new Date().toISOString()
  });
}

async function exportWorld(env){
  const idx = await kvGetJson(env, "aura:cityguide:world_index");
  const results = idx?.results || [];
  return json({
    count: results.length,
    cities: results.map(r=>({
      city: r.city,
      slug: slugCity(r.city),
      vibe: r.vibe,
      href: `/export/cityguide/${slugCity(r.city)}`
    })),
    build: BUILD_VERSION,
    ts: new Date().toISOString()
  });
}

async function chatRouter(req){
  const t = await req.text();
  return json({ reply: t });
}

function health(){
  return json({ ok:true, version: BUILD_VERSION, stamp: BUILD_STAMP });
}

export default {
  async fetch(req, env){
    const url = new URL(req.url);
    if(req.method==="GET" && url.pathname==="/") return html(`<script>location.href='/ui'</script>`);
    if(req.method==="GET" && url.pathname==="/ui") return html(uiHtml());
    if(req.method==="GET" && url.pathname==="/health") return health();
    if(req.method==="POST" && url.pathname==="/chat") return chatRouter(req);
    if(req.method==="GET" && url.pathname.startsWith("/export/cityguide/")){
      const slug = url.pathname.split("/").pop();
      return exportCity(slug, env);
    }
    if(req.method==="GET" && url.pathname==="/export/cityguide"){
      return exportWorld(env);
    }
    return json({ ok:false, error:"not_found" },404);
  }
};
