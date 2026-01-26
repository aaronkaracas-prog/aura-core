// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-24__AUTONOMY_STEP_67__ADD_CITY_LOCK__01
// Full-file replacement. DO NOT MERGE.
// Restores /ui + full command set + adds RUN_CITYGUIDE_WORLD_VERIFY (batch) without breaking existing exports.

const BUILD_VERSION = "AURA_CORE__2026-01-24__AUTONOMY_STEP_67__ADD_CITY_LOCK__01";
const BUILD_STAMP = "2026-01-24 00:45 PT";

// --- CORS ---
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type, X-Requested-With",
  "access-control-max-age": "86400"
};
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function withCors(headers = {}) {
  return { ...headers, ...CORS_HEADERS };
}
function jsonResp(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: withCors({ ...JSON_HEADERS, ...extraHeaders })
  });
}
function html(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: withCors({ "content-type": "text/html; charset=utf-8", ...extraHeaders })
  });
}
function optionsOk() {
  return new Response(null, { status: 204, headers: withCors() });
}

// --- UI (STEP 11) ---
function uiHtml() {
  return `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aura</title>
<style>
body{margin:0;font-family:system-ui;background:#0b0f14;color:#e7ecf3}
.app{display:flex;flex-direction:column;height:100vh}
.chat{flex:1;overflow:auto;padding:12px}
.b{max-width:75%;margin:6px 0;padding:10px;border-radius:12px;white-space:pre-wrap;word-break:break-word}
.me{margin-left:auto;background:#1b2a44}
.a{margin-right:auto;background:#121b2b}
.err{margin-right:auto;background:#3a1b1b}
.bar{display:flex;gap:8px;padding:10px;border-top:1px solid #1c2536;background:#0f1621;align-items:center}
input[type=text]{flex:1;background:#0c1320;color:#fff;border:1px solid #263553;border-radius:10px;padding:10px}
button{background:#1b2a44;color:#fff;border:1px solid #263553;border-radius:10px;padding:8px 10px;cursor:pointer}
.small{font-size:12px;opacity:.75;margin:6px 12px}
#file{display:none}
</style>
</head>
<body>
<div class="app">
  <div class="small">Build: <b>${BUILD_VERSION}</b> · <b>${BUILD_STAMP}</b></div>
  <div id="chat" class="chat"></div>
  <div class="bar">
    <button id="mic" title="Mic">🎤</button>
    <button id="up" title="Upload">＋</button>
    <input id="file" type="file" />
    <input id="input" type="text" placeholder="Type or speak, press Enter…" />
    <button id="sendBtn">Send</button>
  </div>
</div>
<script>
const chat=document.getElementById('chat');
const input=document.getElementById('input');
const sendBtn=document.getElementById('sendBtn');
const up=document.getElementById('up');
const file=document.getElementById('file');

function bubble(t,c){
  const d=document.createElement('div');
  d.className='b '+c;
  d.textContent=String(t ?? '');
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

async function safeJson(res){
  const ct=(res.headers.get('content-type')||'').toLowerCase();
  if (ct.includes('application/json')) return await res.json();
  const txt=await res.text();
  return { ok:false, error:"non_json_response", status:res.status, body:txt.slice(0,2000) };
}

async function send(){
  const t=input.value.trim();
  if(!t) return;
  input.value='';
  bubble(t,'me');

  try{
    const res = await fetch('/chat', {
      method:'POST',
      headers:{'Content-Type':'text/plain; charset=utf-8'},
      body:t
    });
    const j = await safeJson(res);
    bubble(j.reply ?? JSON.stringify(j,null,2),'a');
  } catch(e){
    bubble('UI_ERROR: ' + (e && e.message ? e.message : String(e)),'err');
  }
}

sendBtn.addEventListener('click', send);
input.addEventListener('keydown', e => { if(e.key==='Enter') send(); });

up.addEventListener('click', () => file.click());
file.addEventListener('change', async () => {
  const f=file.files && file.files[0];
  if(!f) return;
  bubble('[upload] ' + f.name + ' (' + f.size + ' bytes)','me');
  file.value='';
  bubble('UPLOAD_NOT_ENABLED_IN_STEP_11_UI','a');
});

bubble('UI wired OK (STEP 11)','a');
</script>
</body></html>`;
}

// --- KV helpers ---
function kvOk(env) { return !!env.AURA_KV; }

async function kvGetJson(env, key) {
  if (!kvOk(env)) return null;
  const v = await env.AURA_KV.get(key);
  return v ? JSON.parse(v) : null;
}

async function kvPutJson(env, key, obj) {
  if (!kvOk(env)) return false;
  await env.AURA_KV.put(key, JSON.stringify(obj));
  return true;
}

function slugCity(name) {
  return String(name || "").trim().toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function parseSeed(arg) {
  return String(arg || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function parseKeyVals(s) {
  const out = {};
  const parts = String(s || "")
    .replace(/\n+/g, " ")
    .split(/\s+/)
    .map(p => p.trim())
    .filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^([a-zA-Z0-9_\-]+)=(.+)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function fetchCheck(url, ms=8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort("timeout"), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const txt = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      bytes: txt ? txt.length : 0,
      head: (txt || "").slice(0, 120)
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e && e.message ? e.message : String(e)
    };
  } finally {
    clearTimeout(t);
  }
}

// --- CityGuide export ---
async function exportCity(citySlug, env) {
  const layout = await kvGetJson(env, `aura:cityguide:layout:${citySlug}`);
  const analysis = await kvGetJson(env, `aura:cityguide:analysis:${citySlug}`);
  if (!layout || !analysis) return jsonResp({ ok: false, error: "city_not_found" }, 404);

  return jsonResp({
    city: analysis.city,
    vibe: analysis.vibe,
    hero: layout.layout?.hero ?? null,
    sections: layout.layout?.sections ?? [],
    build: BUILD_VERSION,
    ts: new Date().toISOString()
  });
}

async function exportWorld(env) {
  const idx = await kvGetJson(env, "aura:cityguide:world_index");
  const results = idx?.results || [];
  return jsonResp({
    count: results.length,
    cities: results.map(r => ({
      city: r.city,
      slug: slugCity(r.city),
      vibe: r.vibe,
      href: `/export/cityguide/${slugCity(r.city)}`
    })),
    build: BUILD_VERSION,
    ts: new Date().toISOString()
  });
}

// --- Commands ---
async function cmdCapabilities(env) {
  const caps = {
    has_kv: !!env.AURA_KV,
    has_deployer_binding: !!env.AURA_DEPLOYER,
    has_deploy_secret: !!env.DEPLOY_SECRET,
    has_github_token: !!env.GITHUB_TOKEN,
    has_pages_token: !!env.CLOUDFLARE_API_TOKEN,
  };
  return { ok: true, reply: JSON.stringify({ caps, build: BUILD_VERSION }, null, 2) };
}

async function cmdWorldMode(env, arg) {
  const mode = String(arg || "").trim().toUpperCase() || "GLOBAL";
  await kvPutJson(env, "aura:cityguide:world_mode", { mode, ts: new Date().toISOString() });
  return { ok: true, reply: `CityGuide world mode set to ${mode}.` };
}

async function cmdWorldSeed(env, arg) {
  const list = parseSeed(arg);
  await kvPutJson(env, "aura:cityguide:world_seed", { cities: list, ts: new Date().toISOString() });
  return { ok: true, reply: `World seed set (${list.length} cities).` };
}

async function cmdWorldAnalyze(env) {
  const seed = await kvGetJson(env, "aura:cityguide:world_seed");
  const cities = seed?.cities || [];
  const results = cities.map(c => ({ city: c, vibe: "ready", ts: new Date().toISOString() }));
  await kvPutJson(env, "aura:cityguide:world_index", { results, ts: new Date().toISOString() });
  return { ok: true, reply: `World analyzed: ${results.length} cities.` };
}

async function cmdWorldList(env) {
  const idx = await kvGetJson(env, "aura:cityguide:world_index");
  const results = idx?.results || [];
  const lines = results.map(r => `- ${r.city} [${r.vibe}]`).join("\n");
  return { ok: true, reply: `World cities:\n${lines || "(none)"}` };
}

async function cmdPagesBindIntent(env, raw) {
  const kvs = parseKeyVals(raw);
  const intent = {
    repo: kvs.repo || null,
    primary: kvs.primary || null,
    secondary: kvs.secondary || null,
    source: kvs.source || null,
    ts: new Date().toISOString()
  };
  await kvPutJson(env, "aura:cityguide:pages_bind_intent", intent);
  return { ok: true, reply: "Pages/domain intent saved." };
}

function pickGlassBase(intent) {
  return intent?.secondary || intent?.primary || "cityguide.arksystems.us";
}

async function cmdVerifyGlassRoot(env) {
  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const host = pickGlassBase(intent);
  const url = `https://${host}/?cb=${Date.now()}`;
  const r = await fetchCheck(url, 8000);
  await kvPutJson(env, "aura:cityguide:last_verify_root", { url, r, ts: new Date().toISOString() });
  return { ok: true, reply: `glass_root: ${r.ok ? "ok" : "fail"} (${r.status || 0})` };
}

async function cmdVerifyGlassCity(env, slug) {
  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const host = pickGlassBase(intent);
  const s = slugCity(slug);
  const url = `https://${host}/${s}?cb=${Date.now()}`;
  const r = await fetchCheck(url, 8000);
  await kvPutJson(env, `aura:cityguide:last_verify_city:${s}`, { url, r, ts: new Date().toISOString() });
  return { ok: true, reply: `glass_city:${s} ${r.ok ? "ok" : "fail"} (${r.status || 0})` };
}

async function cmdWorldStatus(env) {
  const mode = await kvGetJson(env, "aura:cityguide:world_mode");
  const seed = await kvGetJson(env, "aura:cityguide:world_seed");
  const idx = await kvGetJson(env, "aura:cityguide:world_index");
  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const root = await kvGetJson(env, "aura:cityguide:last_verify_root");
  const count = idx?.results?.length || 0;
  const lines = [];
  lines.push(`mode: ${mode?.mode || "unset"}`);
  lines.push(`seed: ${seed?.cities?.length || 0}`);
  lines.push(`world_index: ${count}`);
  lines.push(`glass_host: ${pickGlassBase(intent)}`);
  lines.push(`last_root: ${root?.r?.ok ? "ok" : "unknown"}`);
  return { ok: true, reply: lines.join("\n") };
}

async function cmdBatchVerify(env) {
  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const host = pickGlassBase(intent);
  const idx = await kvGetJson(env, "aura:cityguide:world_index");
  const results = idx?.results || [];
  const out = [];

  const root = await fetchCheck(`https://${host}/?cb=${Date.now()}`, 8000);
  out.push(`root: ${root.ok ? "ok" : "fail"} (${root.status || 0})`);

  for (const c of results) {
    const s = slugCity(c.city);
    const r = await fetchCheck(`https://${host}/${s}?cb=${Date.now()}`, 8000);
    out.push(`${s}: ${r.ok ? "ok" : "fail"} (${r.status || 0})`);
  }

  await kvPutJson(env, "aura:cityguide:last_batch_verify", { out, ts: new Date().toISOString() });
  return { ok: true, reply: out.join("\n") };
}



async function cmdLockTemplate(env) {
  await kvPutJson(env, "aura:cityguide:template_locked", { ok: true, ts: new Date().toISOString(), build: BUILD_VERSION });
  return { ok: true, reply: "CityGuide world template locked." };
}

async function cmdAddCity(env, name) {
  const cityName = String(name || "").trim();
  if (!cityName) return { ok: false, reply: "add_city: missing_name" };

  const seed = (await kvGetJson(env, "aura:cityguide:world_seed")) || { cities: [] };
  const cities = Array.isArray(seed.cities) ? seed.cities.slice() : [];

  // de-dupe case-insensitive
  const exists = cities.some(c => String(c).trim().toLowerCase() === cityName.toLowerCase());
  if (!exists) cities.push(cityName);

  await kvPutJson(env, "aura:cityguide:world_seed", { cities, ts: new Date().toISOString() });

  // keep world_index in sync immediately
  const idxResults = cities.map(c => ({ city: c, vibe: "ready", ts: new Date().toISOString() }));
  await kvPutJson(env, "aura:cityguide:world_index", { results: idxResults, ts: new Date().toISOString() });

  return { ok: true, reply: `City added: ${cityName}. Seed now ${cities.length}.` };
}
async function chatRouter(req, env) {
  const raw = (await req.text()) || "";
  const t = raw.trim();
  const U = t.toUpperCase();

  if (!t) return { ok: true, reply: "" };
  if (U === "PING") return { ok: true, reply: "pong" };
  if (U === "CAPABILITIES") return await cmdCapabilities(env);

  if (U.startsWith("CITYGUIDE_WORLD_MODE:")) return await cmdWorldMode(env, t.split(":").slice(1).join(":"));
  if (U.startsWith("CITYGUIDE_WORLD_SEED:")) return await cmdWorldSeed(env, t.split(":").slice(1).join(":"));
  if (U === "CITYGUIDE_WORLD_ANALYZE") return await cmdWorldAnalyze(env);
  if (U === "CITYGUIDE_WORLD_LIST") return await cmdWorldList(env);

  if (U.startsWith("PAGES_BIND_INTENT:")) return await cmdPagesBindIntent(env, t.split(":").slice(1).join(":"));
  if (U === "VERIFY_GLASS_ROOT") return await cmdVerifyGlassRoot(env);
  if (U.startsWith("VERIFY_GLASS_CITY:")) return await cmdVerifyGlassCity(env, t.split(":").slice(1).join(":"));
  if (U === "CITYGUIDE_WORLD_STATUS") return await cmdWorldStatus(env);

  if (U === "RUN_CITYGUIDE_WORLD_VERIFY") return await cmdBatchVerify(env);

  if (U === "LOCK_CITYGUIDE_WORLD_TEMPLATE") return await cmdLockTemplate(env);
  if (U.startsWith("CITYGUIDE_ADD_CITY:")) return await cmdAddCity(env, t.split(":").slice(1).join(":"));

  return { ok: true, reply: t };
}

function health() {
  return jsonResp({ ok: true, version: BUILD_VERSION, stamp: BUILD_STAMP });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return optionsOk();

    if (req.method === "GET" && url.pathname === "/") return html(`<script>location.href='/ui'</script>`);
    if (req.method === "GET" && url.pathname === "/ui") return html(uiHtml());
    if (req.method === "GET" && url.pathname === "/health") return health();

    if (req.method === "POST" && url.pathname === "/chat") {
      const r = await chatRouter(req, env);
      return jsonResp(r);
    }

    if (req.method === "GET" && url.pathname === "/export/cityguide") return exportWorld(env);
    if (req.method === "GET" && url.pathname.startsWith("/export/cityguide/")) {
      const slug = url.pathname.split("/").pop();
      return exportCity(slug, env);
    }

    return jsonResp({ ok: false, error: "not_found" }, 404);
  }
};
