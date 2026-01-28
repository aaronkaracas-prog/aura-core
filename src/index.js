// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-24__AUTONOMY_STEP_101__CLAIM_GATE_HOST_SCOPED_KV_TTL__CORE_ALIAS__UI_OK__01
// Full-file replacement. DO NOT MERGE.
// Restores /ui + full command set + adds RUN_CITYGUIDE_WORLD_VERIFY (batch) without breaking existing exports.

const BUILD_VERSION = "AURA_CORE__2026-01-26__UI_SELF_BUNDLE__05__VF_INLINE_FIX__01";
const BUILD_STAMP = "2026-01-26 18:10 PT";
let AURA_ENV = null;

// --- CORS ---
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type, X-Requested-With",
  "access-control-max-age": "86400"
};
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };



// --- VERIFIED FETCH + CLAIM GATING (STEP 97) ---
// Aura must never claim a site is live/launched/etc unless VERIFIED_FETCH_URL returns status + first HTML line.
const CLAIM_WORDS = ["live","deployed","launched","resolving","propagating","successful","verified","up","online","working","reachable","available","accessible"];
const CLAIM_WORD_RE = new RegExp("\\b(" + CLAIM_WORDS.join("|") + ")\\b", "i");

const VF_KV_PREFIX = "vf:";
const VF_TTL_MS = 15 * 60 * 1000; // 15 minutes

function extractHostFromText(s){
  const t = String(s||"");
  // 1) Try full URL
  const m = t.match(/https?:\/\/[^\s"'<>]+/i);
  if (m && m[0]) {
    try { return new URL(m[0]).hostname.toLowerCase(); } catch(e) {}
  }
  // 2) Try bare domain
  const dm = t.match(/\b([a-z0-9-]+\.)+[a-z]{2,}\b/i);
  if (dm && dm[0]) return dm[0].toLowerCase();
  return "";
}

function promptLooksLikeStatusClaim(prompt){
  const raw = String(prompt||"").trim();
  const up = raw.toUpperCase();

  // Never treat internal commands as "status claims"
  if (up === "PING") return false;
  if (up.startsWith("SHOW_")) return false;
  if (up.startsWith("VERIFIED_FETCH")) return false;
  if (up.startsWith("CANON_")) return false;

  const p = raw.toLowerCase();
  if (!p) return false;

  // direct status question patterns (covers "is X reachable", "can you reach X", etc.)
  if (/(is|are)\s+.+\s+(live|up|online|working|reachable|available|accessible)\b/.test(p)) return true;
  if (/\b(can you|can we|is it)\s+.+\s+(reach|access)\b/.test(p)) return true;

  // keyword fallback using the claim list (WORD-BOUNDARY SAFE)
  return CLAIM_WORD_RE.test(p);
}


async function hasRecentPassingVerifiedFetch(env, host){
  const h = String(host||"").trim().toLowerCase();
  if (!h) return false;
  try{
    const raw = await env.AURA_KV.get(VF_KV_PREFIX + h);
    if (!raw) return false;
    const rec = JSON.parse(raw);
    const ts = rec && rec.ts ? Date.parse(rec.ts) : 0;
    if (!ts || (Date.now() - ts) > VF_TTL_MS) return false;
    return !!(rec.ok === true && typeof rec.http_status === "number" && rec.http_status >= 200 && rec.http_status < 400);
  } catch(e){
    return false;
  }
}

function looksLikeVerifiedFetch(text){
  const s = String(text||"").trim();
  // Allow ONLY explicit VERIFIED_FETCH / NOT WIRED formats, or the strict JSON shape produced by VERIFIED_FETCH_URL.
  if (s.startsWith("VERIFIED_FETCH") || s.startsWith("NOT WIRED")) return true;
  if (s.startsWith("{")) {
    try{
      const o = JSON.parse(s);
      return o && typeof o === "object" &&
        ("ok" in o) && ("url" in o) && ("http_status" in o) && ("first_line_html" in o);
    }catch(e){ return false; }
  }
  return false;
}

function enforceClaimGate(text){
  const s = String(text||"").trim();
  if (!s) return s;
  if (CLAIM_WORD_RE.test(s) && !looksLikeVerifiedFetch(s)) {
    // SINGLE-LINE enforcement (no extra notes) to satisfy "ONLY" constraints.
    return "NOT WIRED: VERIFIED_FETCH REQUIRED";
  }
  return s;
}

function getClaimGateInfo(){
  return {
    trigger_words: CLAIM_WORDS.slice(),
    forced_message: "NOT WIRED: VERIFIED_FETCH REQUIRED",
    requires_verified_fetch_format: true
  };
}


async function getVerifiedFetchRecord(env, host){
  try{
    if (!env || !env.AURA_KV) return null;
    const h = String(host||"").trim().toLowerCase();
    if (!h) return null;
    const raw = await env.AURA_KV.get(VF_KV_PREFIX + h);
    if (!raw) return null;
    let rec=null;
    try { rec = JSON.parse(raw); } catch(e){ rec=null; }
    if (!rec || typeof rec !== "object") return null;
    // Require ok:true + http_status>0
    if (!rec.ok) return null;
    const ts = rec.ts ? Date.parse(rec.ts) : NaN;
    if (!Number.isFinite(ts)) return rec; // if missing ts, still accept within KV TTL
    const age = Date.now() - ts;
    if (age < 0) return rec;
    if (age > VF_TTL_MS) return null;
    return rec;
  } catch(e){
    return null;
  }
}



function normalizeCommandInput(raw){
  let s = String(raw||"").trim();
  // Allow operator to prefix prompts with "Aura:" or "Aura," etc.
  s = s.replace(/^aura\s*[:,-]\s*/i, "");
  // Common wrapper words
  s = s.replace(/^run\s+/i, "");
  s = s.replace(/^please\s+/i, "");
  return s.trim();
}


async function verifiedFetchUrl(url){
  const u = String(url||"").trim();
  if (!u) return { ok:false, url:"", http_status:0, first_line_html:"", error:"missing_url" };
  let resp=null;
  try{
    // Always send a UA (GitHub API + some CDNs require it), and accept any content.
    resp = await fetch(u, { redirect: "follow", headers: { "User-Agent": "AuraCore/auras.guide", "Accept": "*/*" } });
    const status = resp.status || 0;

    // Capture headers useful for debugging + downstream logic.
    const contentType = (resp.headers.get("content-type")||"").toLowerCase();
    const contentLengthHeader = resp.headers.get("content-length") || "";

    // Read body as text for ALL responses. Then cap what we store to keep prompts small.
    let txt = "";
    try { txt = await resp.text(); } catch(e) { txt = ""; }

    const bodyLen = (txt && txt.length) ? txt.length : 0;

    // Keep this small so Aura can reason over it without hitting token limits.
    // (Full body is NOT needed for most probes; increase later only if required.)
    const BODY_CAP = 2000;
    const bodyText = String(txt || "").slice(0, BODY_CAP);

    const firstLine = String((String(txt||"").split(/\r?\n/)[0] || "")).trim();

    const rec = {
      ok: !!resp.ok,
      url: u,
      http_status: status,
      first_line_html: firstLine,
      body_length: bodyLen,
      body_text: bodyText,
      content_type: contentType,
      content_length: contentLengthHeader,
      error: "",
      ts: new Date().toISOString()
    };

    try{
      const host = extractHostFromText(u);
      if (host) await AURA_ENV.AURA_KV.put(VF_KV_PREFIX + host, JSON.stringify(rec), { expirationTtl: Math.floor(VF_TTL_MS/1000) });
    }catch(e){}

    return {
      ok: rec.ok,
      url: rec.url,
      http_status: rec.http_status,
      first_line_html: rec.first_line_html,
      body_length: rec.body_length,
      body_text: rec.body_text,
      content_type: rec.content_type,
      content_length: rec.content_length,
      error: rec.error
    };
  } catch(e){
    const rec = { ok:false, url: u, http_status:0, first_line_html:"", error: (e && e.message) ? e.message : String(e), ts: new Date().toISOString() };
    try{ const host = extractHostFromText(u); if (host) await AURA_ENV.AURA_KV.put(VF_KV_PREFIX + host, JSON.stringify(rec), { expirationTtl: Math.floor(VF_TTL_MS/1000) }); }catch(e2){}
    return { ok: rec.ok, url: rec.url, http_status: rec.http_status, first_line_html: rec.first_line_html, body_length: rec.body_length || 0, body_text: rec.body_text || "", content_type: rec.content_type || "", content_length: rec.content_length || "", error: rec.error };
  }
}
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
const mic=document.getElementById('mic');
const up=document.getElementById('up');
const file=document.getElementById('file');
let __sendBusy = false;
let __lastSendText = '';
let __lastSendAt = 0;


let __micActive = false;
let __micSentHash = '';
let __micSentAt = 0;
function __hashDedup(str){
  let h=0;
  for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0; }
  return (h>>>0).toString(16);
}
function bubble(text, who, node){
  const d=document.createElement('div');
  d.className='b ' + (who||'a');
  if (node){
    const wrap=document.createElement('div');
    wrap.className='nodewrap';
    wrap.appendChild(node);
    d.appendChild(wrap);
    if (text){
      const cap=document.createElement('div');
      cap.className='cap';
      cap.textContent=String(text);
      d.appendChild(cap);
    }
  } else {
    d.textContent=String(text||'');
  }
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}
function bubbleImage(srcUrl, altText){
  const img=document.createElement('img');
  img.src=srcUrl;
  img.alt=altText||'image';
  img.style.maxWidth='100%';
  img.style.borderRadius='12px';
  img.style.display='block';
  bubble(altText||'', 'a', img);
}


async function safeJson(res){
  const ct=(res.headers.get('content-type')||'').toLowerCase();
  if (ct.includes('application/json')) return await res.json();
  const txt=await res.text();
  return { ok:false, error:"non_json_response", status:res.status, body:txt.slice(0,2000) };
}

async function send(src){
  const t=input.value.trim();
  if(!t) return;
  src = src || 'typed';
  if (__micActive && src !== 'mic') return;
    if (__sendBusy) return;
  const __now = Date.now();
  if (t === __lastSendText && (__now - __lastSendAt) < 1200) return;
  __lastSendText = t;
  __lastSendAt = __now;
  if (src === 'mic'){
    const h = __hashDedup(t);
    const norm = (t||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
    const prev = (__micSentNorm||"");
    if (prev && (__now - __micSentAt) < 5000){
      if (norm === prev) return;
      if (norm && prev && (norm.includes(prev) || prev.includes(norm))) return;
    }
    if (h === __micSentHash && (__now - __micSentAt) < 5000) return;
    __micSentHash = h;
    __micSentNorm = norm;
    __micSentAt = __now;
  }
  input.value='';
  bubble(t,'me');

  try{
    __sendBusy = true;
    const res = await fetch('/chat', {
      method:'POST',
      headers:{'Content-Type':'text/plain; charset=utf-8'},
      body:t
    });
    const j = await safeJson(res);
    bubble(j.reply ?? JSON.stringify(j,null,2),'a');
  } catch(e){
    bubble('UI_ERROR: ' + (e && e.message ? e.message : String(e)),'err');
  } finally { __sendBusy = false; }

}

sendBtn.addEventListener('click', ()=>send('click'));
input.addEventListener('keydown', e => { if(e.key==='Enter') send('enter'); });

function abToB64(ab){
  const bytes = new Uint8Array(ab);
  let bin = '';
  const chunk = 0x8000;
  for (let i=0;i<bytes.length;i+=chunk){
    bin += String.fromCharCode.apply(null, bytes.subarray(i,i+chunk));
  }
  return btoa(bin);
}

async function uploadFile(f){
  // Safety: keep uploads small unless R2 is wired.
  const MAX = 4 * 1024 * 1024; // 4MB
  if (f.size > MAX){
    bubble('Upload too large for now (' + f.size + ' bytes). Max ' + MAX + ' bytes.', 'err');
    return;
  }
  const ab = await f.arrayBuffer();
  const b64 = abToB64(ab);
  const payload = { name: f.name, type: f.type || 'application/octet-stream', size: f.size, b64 };
  const res = await fetch('/upload', {
    method:'POST',
    headers:{'Content-Type':'application/json; charset=utf-8'},
    body: JSON.stringify(payload)
  });
  const j = await safeJson(res);
  if (j.ok && j.id){
    bubble('uploaded: ' + j.name + ' :: id=' + j.id, 'a');
    // Add a lightweight reference into chat context (no forced sending)
    input.value = (input.value ? input.value + ' ' : '') + '[file:' + j.id + ']';
  } else {
    bubble(j.reply || JSON.stringify(j,null,2), 'err');
  }
}

up.addEventListener('click', () => file.click());
file.addEventListener('change', async () => {
  const f=file.files && file.files[0];
  if(!f) return;
  bubble('[upload] ' + f.name + ' (' + f.size + ' bytes)','me');
  file.value='';
  try { await uploadFile(f); } catch(e){ bubble('UPLOAD_ERROR: ' + (e && e.message ? e.message : String(e)), 'err'); }
});

// Mic (Web Speech API). Chrome/Edge support webkitSpeechRecognition.
let rec=null; let recOn=false;
let __micFinalText=""; let __micInterimText="";
function micSupported(){ return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
function setMicUi(){ mic.textContent = recOn ? '⏹' : '🎤'; mic.title = recOn ? 'Stop' : 'Mic'; }
async function toggleMic(){
  if (!micSupported()) { bubble('Mic not supported in this browser.', 'err'); return; }
  if (!rec){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (e)=>{
      let interim='';
      for (let i=e.resultIndex;i<e.results.length;i++){
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) __micFinalText += txt;
        else interim += txt;
      }
      __micInterimText = interim;
      input.value = (__micFinalText + __micInterimText).trim();
    };
    rec.onerror = (e)=>{ bubble('MIC_ERROR: ' + (e.error || 'unknown'), 'err'); recOn=false; setMicUi(); };
    rec.onend = ()=>{
      // Do NOT auto-send on mic end. Keep transcript in the input so Aaron can review/edit, then press Enter/Send.
      recOn=false; __micActive=false; setMicUi();
      sendBtn.disabled = false;
      // Reset buffers so the next mic run starts clean, but DO NOT wipe the visible input.
      __micFinalText=""; __micInterimText="";
    };
  }
  if (!recOn){
    __micFinalText=""; __micInterimText=""; input.value="";
    recOn=true; __micActive=true; setMicUi();
    sendBtn.disabled = true;
    try { rec.start(); } catch(e){ recOn=false; __micActive=false; setMicUi(); sendBtn.disabled=false; bubble('MIC_START_ERROR: ' + (e && e.message ? e.message : String(e)), 'err'); }
  } else {
    try { rec.stop(); } catch(e){}
  }
}
mic.addEventListener('click', toggleMic);
setMicUi();

bubble('UI wired OK (STEP 11) — mic + uploads enabled','a');
</script>
</body></html>`;
}


// --- Upload storage (KV-backed, small files only) ---
// NOTE: Cloudflare KV is used as a minimal transport so Aaron can stop using ChatGPT.
// If you later add R2, we can lift size limits and store binary there.
function b64FromArrayBuffer(buf){
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i=0;i<bytes.length;i+=chunk){
    bin += String.fromCharCode.apply(null, bytes.subarray(i,i+chunk));
  }
  // btoa expects binary string
  return btoa(bin);
}

function toB64(str){
  const enc = new TextEncoder();
  const ab = enc.encode(str).buffer;
  return b64FromArrayBuffer(ab);
}
function sha1Hex(str){
  // lightweight hash for IDs (not crypto security)
  let h = 0;
  for (let i=0;i<str.length;i++){
    h = ((h<<5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return (h>>>0).toString(16).padStart(8,"0");
}
function uploadId(name, size, headB64){
  const seed = `${Date.now()}|${name||""}|${size||0}|${headB64||""}|${Math.random()}`;
  return "u_" + sha1Hex(seed) + "_" + Date.now().toString(36);
}
async function uploadsIndexGet(env){
  const k = "aura:uploads:index";
  const raw = await env.AURA_KV.get(k);
  return raw ? (JSON.parse(raw)||[]) : [];
}
async function uploadsIndexPut(env, list){
  const k = "aura:uploads:index";
  const trimmed = Array.isArray(list) ? list.slice(0,200) : [];
  await env.AURA_KV.put(k, JSON.stringify(trimmed));
}
async function uploadStore(env, meta){
  const id = meta.id;
  await env.AURA_KV.put("aura:upload:" + id, JSON.stringify(meta));
  const idx = await uploadsIndexGet(env);
  const next = [{ id, name: meta.name, type: meta.type, size: meta.size, ts: meta.ts }, ...idx.filter(x=>x && x.id!==id)].slice(0,200);
  await uploadsIndexPut(env, next);
}
async function uploadGet(env, id){
  const raw = await env.AURA_KV.get("aura:upload:" + id);
  return raw ? JSON.parse(raw) : null;
}
async function uploadDelete(env, id){
  await env.AURA_KV.delete("aura:upload:" + id);
  const idx = await uploadsIndexGet(env);
  await uploadsIndexPut(env, idx.filter(x=>x && x.id!==id));
}

// --- KV helpers ---
function kvOk(env) { return !!env.AURA_KV; }

// --- Session Log (KV-backed, tiny ring buffer) ---
// Purpose: enable "SESSION MEMORY PACK" and continuity without pretending we have magical memory.
async function sessionLogGet(env){
  const key = "aura:session:log";
  const raw = await env.AURA_KV.get(key);
  return raw ? (JSON.parse(raw)||[]) : [];
}
async function sessionLogPut(env, list){
  const key = "aura:session:log";
  const trimmed = Array.isArray(list) ? list.slice(-80) : []; // keep last 80 entries max
  await env.AURA_KV.put(key, JSON.stringify(trimmed));
}
async function sessionLogAppend(env, entry){
  if (!env.AURA_KV) return;
  try{
    const log = await sessionLogGet(env);
    log.push(entry);
    await sessionLogPut(env, log);
  } catch(e){}
}
async function sessionLastPackGet(env){
  if (!env.AURA_KV) return null;
  const raw = await env.AURA_KV.get("aura:session:last_pack");
  return raw ? String(raw) : null;
}
async function sessionLastPackPut(env, pack){
  if (!env.AURA_KV) return;
  try{ await env.AURA_KV.put("aura:session:last_pack", String(pack||"")); }catch(e){}
}
function makeSessionMemoryPack(anchors, aliases, objective, notes){
  const topic = anchors?.topic ? String(anchors.topic) : "";
  const ents = (anchors?.entities && Array.isArray(anchors.entities)) ? anchors.entities.map(String) : [];
  const aliasPairs = [];
  if (aliases && typeof aliases === "object"){
    for (const k of Object.keys(aliases)){
      if (!k) continue;
      aliasPairs.push(`${k}→${String(aliases[k])}`);
    }
  }
  const lines = [];
  if (topic) lines.push(`* Current topic: ${topic}`);
  if (objective) lines.push(`* Current objective: ${objective}`);
  if (ents.length) lines.push(`* Active entities: ${ents.join(", ")}`);
  if (aliasPairs.length) lines.push(`* Alias map: ${aliasPairs.join(", ")}`);
  if (notes && Array.isArray(notes) && notes.length){
    for (const n of notes.slice(0,10)) lines.push(`* ${n}`);
  }
  return "```\n" + lines.slice(0,20).join("\n") + "\n```";
}
function isPriorSessionQuestion(rawLower){
  if (!rawLower) return false;
  return rawLower.includes("what did we talk about yesterday") ||
         rawLower.includes("what did we talk about last session") ||
         rawLower.includes("yesterday") ||
         rawLower.includes("last session") ||
         rawLower.includes("previous session") ||
         rawLower.includes("earlier today") ||
         rawLower.includes("what did we talk about");
}
function isSessionPackCreate(rawLower){
  return rawLower.includes("session memory pack") && (rawLower.includes("create") || rawLower.includes("make") || rawLower.includes("generate"));
}
function isMemoryPackPaste(rawTrim){
  return rawTrim.startsWith("MEMORY PACK:") || rawTrim.startsWith("SESSION MEMORY PACK:");
}
function parseMemoryPack(raw){
  const out = { topic:"", objective:"", entities:[], aliases:{} };
  const s = String(raw||"");
  const lines = s.split(/\r?\n/).map(x=>x.trim());
  for (const l of lines){
    const line = l.replace(/^\*+\s*/,"").trim();
    if (!line) continue;
    if (line.toLowerCase().startsWith("current topic:")){
      out.topic = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("current objective:")){
      out.objective = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("active entities:")){
      const rest = line.split(":").slice(1).join(":").trim();
      out.entities = rest ? rest.split(",").map(x=>x.trim()).filter(Boolean) : [];
    } else if (line.toLowerCase().startsWith("alias map:")){
      const rest = line.split(":").slice(1).join(":").trim();
      const pairs = rest.split(",").map(x=>x.trim()).filter(Boolean);
      for (const p of pairs){
        const parts = p.split("→");
        if (parts.length===2){
          const k = normWord(parts[0]);
          const v = parts[1].trim();
          if (k && v) out.aliases[k]=v;
        }
      }
    }
  }
  return out;
}



// --- Session State (KV-backed) ---
// Stores lightweight current topic/entities/aliases/objective derived from MEMORY PACK paste.
// This is explicit persistence via KV, not magical recall.
async function sessionStateGet(env){
  if (!env.AURA_KV) return { topic:"", objective:"", entities:[], aliases:{} };
  const s = await kvGetJson(env, "aura:session:state");
  if (!s || typeof s !== "object") return { topic:"", objective:"", entities:[], aliases:{} };
  return {
    topic: s.topic ? String(s.topic) : "",
    objective: s.objective ? String(s.objective) : "",
    entities: Array.isArray(s.entities) ? s.entities.map(String) : [],
    aliases: (s.aliases && typeof s.aliases === "object") ? s.aliases : {}
  };
}
async function sessionStatePut(env, state){
  if (!env.AURA_KV) return false;
  const safe = {
    topic: state?.topic ? String(state.topic) : "",
    objective: state?.objective ? String(state.objective) : "",
    entities: Array.isArray(state?.entities) ? state.entities.map(String).slice(0,25) : [],
    aliases: (state?.aliases && typeof state.aliases === "object") ? state.aliases : {}
  };
  try { await kvPutJson(env, "aura:session:state", safe); return true; } catch(e){ return false; }
}
async function kvGetJson(env, key) {
  if (!kvOk(env)) return null;
  const v = await env.AURA_KV.get(key);
  if (!v) return null;
  try { return JSON.parse(v); } catch (e) { return null; }
}

async function kvPutJson(env, key, obj) {
  if (!kvOk(env)) return false;
  await env.AURA_KV.put(key, JSON.stringify(obj));
  return true;
}

// --- Operator Identity (KV-backed) ---
// Stores stable operator identity so Aura does not "forget" Aaron across sessions.
// This is NOT magical memory. It is explicit persistence via AURA_KV only.
async function getOperatorProfile(env){
  const key = "aura:operator:profile";
  let p = await kvGetJson(env, key);
  if (!p || typeof p !== "object"){
    p = {
      name: "Aaron Karacas",
      role: "creator/operator of ARK Systems",
      ts: new Date().toISOString(),
      build: BUILD_VERSION
    };
    // best-effort persist
    try { await kvPutJson(env, key, p); } catch(e){}
  }
  return p;

}

async function githubCtxGet(env){
  const key = "aura:github:context";
  const ctx = await kvGetJson(env, key);
  return (ctx && typeof ctx === "object") ? ctx : null;
}
async function githubCtxSet(env, ctx){
  const key = "aura:github:context";
  await kvPutJson(env, key, ctx);
  return true;
}

// --- helpers ---

function parseKeyValueArgs(s){
  const out={};
  const parts=String(s||"").trim().split(/\s+/).filter(Boolean);
  for (const p of parts){
    const i=p.indexOf('=');
    if (i>0){
      const k=p.slice(0,i).trim();
      const v=p.slice(i+1).trim();
      if (k) out[k]=v;
    }
  }
  return out;
}

function titleCaseWords(s){
  return String(s||"")
    .trim()
    .split(/\s+/)
    .map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : w)
    .join(" ");
}
function cityNameFromSlug(slug){
  const s = String(slug||"").trim().replace(/^\/+|\/+$/g,"");
  return titleCaseWords(s.replace(/-/g," "));
}

// --- Memory Log (KV-backed, compact) ---
// Opt-in logging of commands/results so Aura can keep continuity across sessions.
async function memIsOn(env){
  const v = await kvGetJson(env, "aura:memory:on");
  return !!v?.on;
}
async function memSet(env, on){
  await kvPutJson(env, "aura:memory:on", { on: !!on, ts: new Date().toISOString(), build: BUILD_VERSION });
}
async function memAppend(env, entry){
  if (!kvOk(env)) return;
  const key = "aura:memory:events";
  const line = JSON.stringify(entry);
  const existing = await env.AURA_KV.get(key);
  const lines = (existing ? existing.split("\n").filter(Boolean) : []);
  lines.push(line);
  // keep last 200 events
  const trimmed = lines.slice(-200).join("\n");
  await env.AURA_KV.put(key, trimmed);
}
async function memExport(env, n=50){
  if (!kvOk(env)) return [];
  const key = "aura:memory:events";
  const existing = await env.AURA_KV.get(key);
  const lines = (existing ? existing.split("\n").filter(Boolean) : []);
  return lines.slice(-Math.max(1, Math.min(200, Number(n)||50)));
}



// --- Memory Notes + Snapshots ---
async function memNote(env, note){
  if (!kvOk(env)) return;
  const entry = { ts: new Date().toISOString(), type: "note", note: String(note||"").trim(), build: BUILD_VERSION };
  await memAppend(env, entry);
}

async function snapAdd(env, name, note=""){
  if (!kvOk(env)) return { ok:false, reply:"snapshot:kv_missing" };
  const n = String(name||"").trim();
  if (!n) return { ok:false, reply:"snapshot:missing_name" };
  const keyList = "aura:snapshots:list";
  const keyItem = "aura:snapshots:" + n;
  const rec = { name:n, ts:new Date().toISOString(), build: BUILD_VERSION, note: String(note||"").trim() };
  const existing = await env.AURA_KV.get(keyList);
  const list = existing ? (JSON.parse(existing)||[]) : [];
  // prepend newest, keep last 50
  const next = [rec, ...list.filter(x=>x && x.name!==n)].slice(0,50);
  await env.AURA_KV.put(keyList, JSON.stringify(next));
  await env.AURA_KV.put(keyItem, JSON.stringify(rec));
  await memNote(env, `SNAPSHOT:${n} ${rec.note||""}`.trim());
  return { ok:true, reply:`snapshot_saved: ${n}` };
}

async function snapList(env){
  if (!kvOk(env)) return { ok:false, reply:"snapshot_list:kv_missing" };
  const keyList = "aura:snapshots:list";
  const existing = await env.AURA_KV.get(keyList);
  const list = existing ? (JSON.parse(existing)||[]) : [];
  if (!list.length) return { ok:true, reply:"snapshot_list: empty" };
  const lines = list.slice(0,20).map(r=>`- ${r.name} :: ${r.ts} :: ${r.build}${r.note?` :: ${r.note}`:""}`);
  return { ok:true, reply:"snapshots:\n"+lines.join("\n") };
}

async function snapExport(env, name, n=50){
  if (!kvOk(env)) return { ok:false, reply:"snapshot_export:kv_missing" };
  const keyItem = "aura:snapshots:" + String(name||"").trim();
  const recRaw = await env.AURA_KV.get(keyItem);
  if (!recRaw) return { ok:false, reply:"snapshot_export: not_found" };
  const rec = JSON.parse(recRaw);
  const lines = await memExport(env, n);
  return { ok:true, reply: JSON.stringify(rec) + "\n" + (lines.length?lines.join("\n"):"") };
}

// --- Cloudflare Token Probes (capability diagnosis) ---
async function cmdCfTokenPerms(env){
  const zone = await kvGetJson(env, "aura:cf:zone");
  const zoneId = zone?.id;
  if (!zoneId) return { ok:false, reply:"cf_token_perms: no_zone_set (run CF_ZONE_SET:domain)" };
  const tests = [
    { name:"zone_read", path:`/zones/${zoneId}`, method:"GET" },
    { name:"dns_list_root", path:`/zones/${zoneId}/dns_records?per_page=1`, method:"GET" },
    { name:"pages_domains_list", path:`/accounts/${await cfAccountId(env)}/pages/projects/arksystems-cityguide/domains`, method:"GET" },
    { name:"rulesets_read", path:`/zones/${zoneId}/rulesets`, method:"GET" },
  ];
  const out = [];
  for (const t of tests){
    const r = await cfApi(env, t.path, { method:t.method });
    out.push(`${t.name}: ${r.ok ? "ok" : "fail"} (${r.status||0})`);
  }
  out.push("note: if rulesets_read fails, canonical redirect automation needs Zone->Rulesets permissions.");
  return { ok:true, reply: "cf_token_perms:\n" + out.join("\n") };
}

// small helper to get account id (cached)
async function cfAccountId(env){
  const cached = await kvGetJson(env, "aura:cf:account");
  if (cached?.id) return cached.id;
  const r = await cfApi(env, "/accounts", { method:"GET" });
  if (!r.ok) return "";
  const id = r.json?.result?.[0]?.id || "";
  if (id) await kvPutJson(env, "aura:cf:account", { id, ts: new Date().toISOString() });
  return id;
}

// --- Canonical Redirect (best-effort via Rulesets API) ---
async function cmdCanonicalRedirectSet(env, args){
  // Canonical redirect WITHOUT Rulesets API (many tokens lack Rulesets perms).
  // We implement canonical via the Pages UI (client-side redirect in index.html), deployed through Pages API.
  const zone = await kvGetJson(env, "aura:cf:zone");
  const zoneId = zone?.id;
  if (!zoneId) return { ok:false, reply:"canonical_redirect: no_zone_set (run CF_ZONE_SET:domain)" };

  const m = {};
  for (const part of String(args||"").split(/\s+/).filter(Boolean)){
    const [k,v]=part.split("=");
    if (k && v) m[k.trim().toLowerCase()] = v.trim();
  }
  const primary = m.primary, secondary = m.secondary;
  if (!primary || !secondary) return { ok:false, reply:"canonical_redirect: missing primary/secondary (use primary=.. secondary=..)" };

  const rec = { primary, secondary, ts: new Date().toISOString(), mode:"pages_ui_client" };
  await kvPutJson(env, "aura:cityguide:canonical_redirect", rec);

  // Apply immediately by re-deploying the CityGuide UI bundle to Pages (injects redirect script).
  const dep = await cmdPagesDeployCityGuideUI(env);
  if (!dep?.ok) {
    return { ok:false, reply:`canonical_redirect: saved (${secondary} -> ${primary}) but pages_deploy_failed :: ${dep?.reply||"unknown"}` };
  }
  return { ok:true, reply:`canonical_redirect: applied (client-side) ${secondary} -> ${primary} :: pages_deploy_ok` };
}

async function cmdCanonicalRedirectStatus(env){
  const rec = await kvGetJson(env, "aura:cityguide:canonical_redirect");
  if (!rec) return { ok:true, reply:"canonical_redirect: not_set" };
  return { ok:true, reply:`canonical_redirect: ${rec.secondary} -> ${rec.primary} (client-side) ts=${rec.ts}` };
}

// --- Dynamic City Projection ---
// If a city export is requested but layout/analysis aren't present yet, create a minimal record on-demand.
async function ensureCityProjected(env, citySlug){
  const s = slugCity(citySlug);
  const aKey = `aura:cityguide:analysis:${s}`;
  const lKey = `aura:cityguide:layout:${s}`;
  const existingA = await kvGetJson(env, aKey);
  const existingL = await kvGetJson(env, lKey);
  if (existingA && existingL) return { ok:true, created:false, slug:s };

  const cityName = cityNameFromSlug(s);
  const analysis = existingA || { city: cityName, vibe: "ready", ts: new Date().toISOString(), source: "dynamic_export" };
  const layout = existingL || {
    layout: {
      hero: { title: cityName, subtitle: `What’s happening in ${cityName} — right now.` },
      sections: []
    },
    ts: new Date().toISOString(),
    source: "dynamic_export"
  };

  await kvPutJson(env, aKey, analysis);
  await kvPutJson(env, lKey, layout);
  return { ok:true, created:true, slug:s, city: cityName };
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


// --- Live Modules (no keys) ---
// Uses public endpoints: Nominatim (geocode), Open-Meteo (weather), OSM Overpass (places)
// These are best-effort and can be swapped later for paid providers.

async function isLiveModulesOn(env) {
  const v = await kvGetJson(env, "aura:cityguide:live_modules");
  return !!v?.on;
}

async function cmdLiveModules(env, onOff) {
  const on = String(onOff || "").trim().toUpperCase() !== "OFF";
  await kvPutJson(env, "aura:cityguide:live_modules", { on, ts: new Date().toISOString(), build: BUILD_VERSION });
  return { ok: true, reply: `CityGuide live modules: ${on ? "ON" : "OFF"}.` };
}

async function geocodeCity(name) {
  const q = encodeURIComponent(String(name || ""));
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
  const res = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "CityGuide.World (arksystems) / Aura"
    }
  });
  if (!res.ok) return null;
  const arr = await res.json();
  if (!arr || !arr[0]) return null;
  return { lat: Number(arr[0].lat), lon: Number(arr[0].lon), display: arr[0].display_name };
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  const c = j?.current;
  if (!c) return null;
  return { temp_c: c.temperature_2m, code: c.weather_code };
}

async function overpass(query) {
  const url = "https://overpass-api.de/api/interpreter";
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query)
  });
  if (!res.ok) return null;
  return await res.json();
}

function pickNames(osmJson, max=6) {
  const out = [];
  const els = osmJson?.elements || [];
  for (const e of els) {
    const n = e?.tags?.name;
    if (n && !out.includes(n)) out.push(n);
    if (out.length >= max) break;
  }
  return out;
}

async function fetchTopPlaces(lat, lon) {
  // within ~5km
  const qAttractions = `
    [out:json][timeout:12];
    (
      node(around:5000,${lat},${lon})["tourism"="attraction"];
      node(around:5000,${lat},${lon})["tourism"="museum"];
      node(around:5000,${lat},${lon})["historic"];
    );
    out tags 25;
  `;
  const qDining = `
    [out:json][timeout:12];
    (
      node(around:5000,${lat},${lon})["amenity"="restaurant"];
      node(around:5000,${lat},${lon})["amenity"="cafe"];
    );
    out tags 25;
  `;
  const [a, d] = await Promise.all([overpass(qAttractions), overpass(qDining)]);
  return {
    attractions: a ? pickNames(a, 6) : [],
    dining: d ? pickNames(d, 6) : []
  };
}

async function buildLiveModules(cityName) {
  const geo = await geocodeCity(cityName);
  if (!geo) return { ok: false, error: "geocode_failed" };

  const [wx, places] = await Promise.all([
    fetchWeather(geo.lat, geo.lon),
    fetchTopPlaces(geo.lat, geo.lon)
  ]);

  return {
    ok: true,
    geo,
    weather: wx || null,
    modules: {
      upcoming_events: [
        "Live events feed: provider pending",
        "Add paid provider later (Ticketmaster/Songkick/etc)"
      ],
      top_attractions: places.attractions,
      dining_spots: places.dining
    },
    ts: new Date().toISOString()
  };
}

// --- CityGuide export ---
async function exportCity(citySlug, env) {
  const s = slugCity(citySlug);
  let layout = await kvGetJson(env, `aura:cityguide:layout:${s}`);
  let analysis = await kvGetJson(env, `aura:cityguide:analysis:${s}`);

  if (!layout || !analysis) {
    await ensureCityProjected(env, s);
    layout = await kvGetJson(env, `aura:cityguide:layout:${s}`);
    analysis = await kvGetJson(env, `aura:cityguide:analysis:${s}`);
  }

  if (!layout || !analysis) return jsonResp({ ok: false, error: "city_not_found" }, 404);

  let live = null;
  if (await isLiveModulesOn(env)) {
    // cache live modules for 15 minutes
    const cacheKey = `aura:cityguide:live:${citySlug}`;
    const cached = await kvGetJson(env, cacheKey);
    const now = Date.now();
    if (cached?.ts_ms && (now - cached.ts_ms) < 15 * 60 * 1000) {
      live = cached.payload || null;
    } else {
      const payload = await buildLiveModules(analysis.city);
      live = payload;
      await kvPutJson(env, cacheKey, { ts_ms: now, payload });
    }
  }

  return jsonResp({
    city: analysis.city,
    vibe: analysis.vibe,
    hero: layout.layout?.hero ?? null,
    sections: layout.layout?.sections ?? [],
    live: live,
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


// --- Cloudflare Discovery (Aura-only) ---
// Lets Aura find the correct account id + Pages project name without operator doing anything in dashboards.

async function cmdCfTokenVerify(env) {
  const res = await cfApi(env, "/user/tokens/verify", { method: "GET" });
  if (!res.ok) return { ok: false, reply: `cf_token_verify: fail (${res.status})` };
  const status = res.json?.result?.status || "unknown";
  return { ok: true, reply: `cf_token_verify: ${status}` };
}

async function cmdCfAccountsList(env) {
  const res = await cfApi(env, "/accounts?per_page=50", { method: "GET" });
  if (!res.ok) return { ok: false, reply: `cf_accounts: fail (${res.status})` };
  const arr = res.json?.result || [];
  // short list
  const lines = arr.slice(0, 10).map(a => `- ${a.name} :: ${a.id}`);
  return { ok: true, reply: ["cf_accounts:", ...lines].join("\n") };
}

async function cmdCfPagesProjectsList(env) {
  const cfg = await kvGetJson(env, "aura:cloudflare:config");
  const accountId = env.CF_ACCOUNT_ID || cfg?.account_id;
  if (!accountId) return { ok: false, reply: "cf_pages_projects: missing_account_id" };

  const res = await cfApi(env, `/accounts/${accountId}/pages/projects?per_page=100`, { method: "GET" });
  if (!res.ok) return { ok: false, reply: `cf_pages_projects: fail (${res.status})` };
  const arr = res.json?.result || [];
  const lines = arr.slice(0, 20).map(p => `- ${p.name} :: subdomain=${p.subdomain || "?"}`);
  return { ok: true, reply: ["cf_pages_projects:", ...lines].join("\n") };
}

async function cmdCfPagesSetProject(env, name) {
  const n = String(name || "").trim();
  if (!n) return { ok: false, reply: "cf_pages_project: missing" };
  const intent = (await kvGetJson(env, "aura:cityguide:pages_bind_intent")) || {};
  intent.repo = n; // reuse field as project name
  await kvPutJson(env, "aura:cityguide:pages_bind_intent", intent);
  return { ok: true, reply: `cf_pages_project: set ${n}` };
}


async function cmdCfPagesDomainsList(env) {
  const cfg = await kvGetJson(env, "aura:cloudflare:config");
  const accountId = env.CF_ACCOUNT_ID || cfg?.account_id;
  if (!accountId) return { ok: false, reply: "cf_pages_domains: missing_account_id" };

  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const project = intent?.repo || "arksystems-cityguide";

  const res = await cfApi(env, `/accounts/${accountId}/pages/projects/${project}/domains`, { method: "GET" });
  if (!res.ok) return { ok: false, reply: `cf_pages_domains: fail (${res.status})` };

  const arr = res.json?.result || [];
  const lines = arr.slice(0, 25).map(d => `- ${d.name} :: status=${d.status || "?"} :: id=${d.id || "?"}`);
  return { ok: true, reply: ["cf_pages_domains:", ...lines].join("\n") };
}

async function cmdCfPagesDomainAdd(env, domainName) {
  const name = String(domainName || "").trim();
  if (!name) return { ok: false, reply: "cf_pages_domain_add: missing" };

  const cfg = await kvGetJson(env, "aura:cloudflare:config");
  const accountId = env.CF_ACCOUNT_ID || cfg?.account_id;
  if (!accountId) return { ok: false, reply: "cf_pages_domain_add: missing_account_id" };

  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const project = intent?.repo || "arksystems-cityguide";

  const res = await cfApi(env, `/accounts/${accountId}/pages/projects/${project}/domains`, {
    method: "POST",
    body: JSON.stringify({ name })
  });

  if (!res.ok) return { ok: false, reply: `cf_pages_domain_add: fail (${res.status})` };

  const status = res.json?.result?.status || "unknown";
  await kvPutJson(env, "aura:cityguide:last_pages_domain_add", { name, status, ts: new Date().toISOString() });

  return { ok: true, reply: `cf_pages_domain_add: ${name} status=${status}` };
}


// --- Pages Domain Info + DNS Fix (Aura-only) ---
// These commands help finish custom domain cutover by:
// 1) showing domain status + required DNS validation records (when provided by API)
// 2) setting the required DNS records in the zone via API (no dashboard work)

async function cmdCfPagesDomainInfo(env, domainName) {
  const name = String(domainName || "").trim();
  if (!name) return { ok: false, reply: "cf_pages_domain_info: missing" };

  const cfg = await kvGetJson(env, "aura:cloudflare:config");
  const accountId = env.CF_ACCOUNT_ID || cfg?.account_id;
  if (!accountId) return { ok: false, reply: "cf_pages_domain_info: missing_account_id" };

  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const project = intent?.repo || "arksystems-cityguide";

  const res = await cfApi(env, `/accounts/${accountId}/pages/projects/${project}/domains`, { method: "GET" });
  if (!res.ok) return { ok: false, reply: `cf_pages_domain_info: fail (${res.status})` };

  const arr = res.json?.result || [];
  const d = arr.find(x => String(x?.name || "").toLowerCase() === name.toLowerCase());
  if (!d) return { ok: false, reply: `cf_pages_domain_info: not_found (${name})` };

  const status = d.status || "unknown";

  // Try to surface validation requirements if present (API sometimes returns validation_data / validation_records).
  const v = d.validation_data || d.validation_records || d.verification_data || null;
  const lines = [];
  lines.push(`cf_pages_domain_info: ${name}`);
  lines.push(`status=${status}`);

  if (Array.isArray(v) && v.length) {
    for (const r of v.slice(0, 4)) {
      const type = r.type || r.record_type || "TXT";
      const rrname = r.name || r.record_name || r.hostname || "";
      const content = r.value || r.content || r.record_value || "";
      if (rrname && content) lines.push(`dns_required: ${type} ${rrname} = ${content}`);
    }
  } else if (v && typeof v === "object") {
    const type = v.type || v.record_type || "TXT";
    const rrname = v.name || v.record_name || v.hostname || "";
    const content = v.value || v.content || v.record_value || "";
    if (rrname && content) lines.push(`dns_required: ${type} ${rrname} = ${content}`);
  } else {
    lines.push("dns_required: (none reported by API)");
  }

  await kvPutJson(env, `aura:cityguide:last_pages_domain_info:${name.toLowerCase()}`, { d, ts: new Date().toISOString() });
  return { ok: true, reply: lines.join("\n") };
}

async function cmdCfZoneSet(env, zoneName) {
  const name = String(zoneName || "").trim();
  if (!name) return { ok:false, reply:"cf_zone_set: missing" };

  const res = await cfApi(env, `/zones?name=${encodeURIComponent(name)}&per_page=50`, { method:"GET" });
  if (!res.ok) return { ok:false, reply:`cf_zone_set: fail (${res.status})` };

  const zones = res.json?.result || [];
  const z = zones.find(x => String(x?.name || "").toLowerCase() === name.toLowerCase());
  if (!z) return { ok:false, reply:`cf_zone_set: not_found (${name})` };

  await kvPutJson(env, "aura:cloudflare:zone", { name: z.name, zone_id: z.id, ts: new Date().toISOString(), build: BUILD_VERSION });
  await kvPutJson(env, "aura:cf:zone", { name: z.name, id: z.id, ts: new Date().toISOString(), build: BUILD_VERSION });
  return { ok:true, reply:`cf_zone_set: saved ${z.name} (${z.id})` };
}

async function upsertDnsRecord(env, zone_id, rec) {
  // rec: {type,name,content,ttl,proxied}
  const list = await cfApi(env, `/zones/${zone_id}/dns_records?type=${encodeURIComponent(rec.type)}&name=${encodeURIComponent(rec.name)}&per_page=50`, { method:"GET" });
  if (!list.ok) return { ok:false, msg:`dns_list_fail (${list.status})` };

  const existing = (list.json?.result || []).find(r => String(r?.name||"").toLowerCase() === rec.name.toLowerCase());
  if (existing?.id) {
    const upd = await cfApi(env, `/zones/${zone_id}/dns_records/${existing.id}`, {
      method:"PUT",
      body: JSON.stringify({ ...rec })
    });
    if (!upd.ok) return { ok:false, msg:`dns_update_fail (${upd.status})` };
    return { ok:true, msg:`dns_updated ${rec.type} ${rec.name}` };
  } else {
    const crt = await cfApi(env, `/zones/${zone_id}/dns_records`, {
      method:"POST",
      body: JSON.stringify({ ...rec })
    });
    if (!crt.ok) return { ok:false, msg:`dns_create_fail (${crt.status})` };
    return { ok:true, msg:`dns_created ${rec.type} ${rec.name}` };
  }
}

async function cmdCfPagesDnsFix(env, rootDomain) {
  const domain = String(rootDomain || "").trim();
  if (!domain) return { ok:false, reply:"cf_pages_dns_fix: missing_domain" };

  const cfg = await kvGetJson(env, "aura:cloudflare:config");
  const accountId = env.CF_ACCOUNT_ID || cfg?.account_id;
  if (!accountId) return { ok:false, reply:"cf_pages_dns_fix: missing_account_id" };

  // Zone id must be set once.
  const z = await kvGetJson(env, "aura:cloudflare:zone");
  if (!z?.zone_id) return { ok:false, reply:"cf_pages_dns_fix: missing_zone_id (run CF_ZONE_SET:cityguide.world)" };

  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const project = intent?.repo || "arksystems-cityguide";

  // Get project subdomain (target for CNAME)
  const proj = await cfApi(env, `/accounts/${accountId}/pages/projects/${project}`, { method:"GET" });
  if (!proj.ok) return { ok:false, reply:`cf_pages_dns_fix: project_fail (${proj.status})` };

  const sub = proj.json?.result?.subdomain;
  if (!sub) return { ok:false, reply:"cf_pages_dns_fix: missing_project_subdomain" };

  let subClean = String(sub || "").trim();
  // Cloudflare may return subdomain already suffixed with .pages.dev
  subClean = subClean.replace(/\.pages\.dev(\.pages\.dev)+$/i, ".pages.dev");
  const target = subClean.toLowerCase().endsWith(".pages.dev") ? subClean : `${subClean}.pages.dev`;

  // apex + www
  const apex = domain;
  const www = `www.${domain}`;

  const r1 = await upsertDnsRecord(env, z.zone_id, { type:"CNAME", name: apex, content: target, ttl: 1, proxied: true });
  const r2 = await upsertDnsRecord(env, z.zone_id, { type:"CNAME", name: www, content: target, ttl: 1, proxied: true });

  const lines = [];
  lines.push(`cf_pages_dns_fix: target=${target}`);
  lines.push(r1.ok ? r1.msg : `fail:${r1.msg}`);
  lines.push(r2.ok ? r2.msg : `fail:${r2.msg}`);

  await kvPutJson(env, "aura:cityguide:last_pages_dns_fix", { domain, target, r1, r2, ts: new Date().toISOString() });
  return { ok:true, reply: lines.join("\n") };
}

// --- Cloudflare Pages Deploy (NO GITHUB) ---
// Uses CLOUDFLARE_API_TOKEN (already present) to deploy embedded CityGuide UI to a Pages project.
// NOTE: This is best-effort and returns short status.

const CITYGUIDE_UI_FILES = {
  "index.html": "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>CityGuide.World</title>\n  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap\" rel=\"stylesheet\">\n  <link rel=\"stylesheet\" href=\"/styles.css\" />\n</head>\n<body>\n  <div class=\"bg\">\n    <div class=\"bg-overlay\"></div>\n    <div class=\"app\">\n      <header class=\"topbar\">\n        <div class=\"brand\">\n          <div class=\"brand-text\">\n            <span class=\"brand-city\">cityguide</span><span class=\"brand-dot\">.</span><span class=\"brand-world\">world</span>\n          </div>\n          <div class=\"brand-caret\"></div>\n        </div>\n      </header>\n\n      <main class=\"screen\">\n        <section class=\"hero\">\n          <div class=\"hero-media\" id=\"heroMedia\"></div>\n          <div class=\"hero-text\">\n            <h1 id=\"heroTitle\">CityGuide.World</h1>\n            <p id=\"heroSubtitle\">Discover what's happening \u2014 anywhere.</p>\n          </div>\n        </section>\n\n        <section class=\"panel\">\n          <div class=\"panel-title\">\n            <div class=\"panel-line\"></div>\n            <div class=\"panel-label\" id=\"panelLabel\">Top things to do</div>\n            <div class=\"panel-line\"></div>\n          </div>\n\n          <div class=\"cards\" id=\"cardsRow\"></div>\n\n          <div class=\"two-col\">\n            <div class=\"card-lg\" id=\"leftModule\">\n              <div class=\"card-lg-head\">\n                <div class=\"card-lg-title\" id=\"leftTitle\">Upcoming events</div>\n                <button class=\"btn\" id=\"leftBtn\" type=\"button\">View all</button>\n              </div>\n              <ul class=\"list\" id=\"leftList\"></ul>\n            </div>\n\n            <div class=\"card-lg\" id=\"rightModule\">\n              <div class=\"card-lg-head\">\n                <div class=\"card-lg-title\" id=\"rightTitle\">Dining & spots</div>\n              </div>\n              <ul class=\"list\" id=\"rightList\"></ul>\n            </div>\n          </div>\n        </section>\n      </main>\n\n      <nav class=\"bottom-nav\">\n        <a class=\"nav-item active\" href=\"/\" data-nav=\"home\">\n          <div class=\"nav-ico\">\u2302</div><div class=\"nav-lbl\">Home</div>\n        </a>\n        <a class=\"nav-item\" href=\"/destinations\" data-nav=\"destinations\">\n          <div class=\"nav-ico\">\u2316</div><div class=\"nav-lbl\">Destinations</div>\n        </a>\n        <a class=\"nav-item\" href=\"/offers\" data-nav=\"offers\">\n          <div class=\"nav-ico\">\u2605</div><div class=\"nav-lbl\">Offers</div>\n        </a>\n        <a class=\"nav-item\" href=\"/trips\" data-nav=\"trips\">\n          <div class=\"nav-ico\">\u25a3</div><div class=\"nav-lbl\">My Trips</div>\n        </a>\n      </nav>\n    </div>\n  </div>\n\n  <script src=\"/app.js\"></script>\n</body>\n</html>\n",
  "styles.css": ":root{\n  --bg1:#070b12;\n  --bg2:#0a1020;\n  --panel:#0e1a2c;\n  --panel2:#0b1424;\n  --stroke:rgba(255,255,255,.10);\n  --stroke2:rgba(255,255,255,.16);\n  --text:#eef3ff;\n  --muted:rgba(238,243,255,.78);\n  --muted2:rgba(238,243,255,.60);\n  --accent:#ffd54a;\n  --shadow: 0 20px 60px rgba(0,0,0,.55);\n  --radius: 18px;\n  --radius2: 22px;\n}\n\n*{box-sizing:border-box}\nhtml,body{height:100%}\nbody{\n  margin:0;\n  font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;\n  color:var(--text);\n  background: radial-gradient(1200px 800px at 50% 0%, #1d2f63 0%, #0a1020 55%, #060a11 100%);\n  overflow:hidden;\n}\n\n.bg{\n  position:fixed; inset:0;\n  background: radial-gradient(1200px 800px at 50% 0%, #223a7a 0%, #0b1430 60%, #070b12 100%);\n}\n\n.bg-overlay{\n  position:absolute; inset:0;\n  background: linear-gradient(180deg, rgba(0,0,0,.50) 0%, rgba(0,0,0,.72) 40%, rgba(0,0,0,.82) 100%);\n  pointer-events:none;\n}\n\n.app{\n  position:relative;\n  height:100%;\n  max-width: 980px;\n  margin: 0 auto;\n  display:flex;\n  flex-direction:column;\n}\n\n.topbar{\n  padding: 14px 18px 10px;\n  display:flex;\n  justify-content:center;\n}\n\n.brand{\n  display:flex;\n  flex-direction:column;\n  align-items:center;\n  gap:8px;\n  user-select:none;\n}\n\n.brand-text{\n  font-weight:800;\n  letter-spacing:.5px;\n  font-size:40px;\n  line-height:1;\n  text-transform:lowercase;\n  text-shadow: 0 10px 30px rgba(0,0,0,.55);\n}\n.brand-city{color:#f3f7ff}\n.brand-dot{color:#f3f7ff}\n.brand-world{color:var(--accent)}\n\n.brand-caret{\n  width:0;height:0;\n  border-left:10px solid transparent;\n  border-right:10px solid transparent;\n  border-top:12px solid var(--accent);\n  filter: drop-shadow(0 8px 14px rgba(0,0,0,.6));\n}\n\n.screen{\n  flex:1;\n  overflow:auto;\n  padding: 0 16px 100px;\n}\n\n.hero{\n  position:relative;\n  border-radius: var(--radius2);\n  overflow:hidden;\n  box-shadow: var(--shadow);\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(10,16,32,.25);\n}\n\n.hero-media{\n  height: 320px;\n  background-size: cover;\n  background-position:center;\n  filter: saturate(1.10) contrast(1.05);\n}\n\n.hero-media:before{\n  content:\"\";\n  position:absolute; inset:0;\n  background: linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,.55) 55%, rgba(0,0,0,.78) 100%);\n}\n\n.hero-text{\n  position:absolute;\n  left: 22px;\n  right: 22px;\n  bottom: 18px;\n  text-shadow: 0 12px 32px rgba(0,0,0,.65);\n}\n.hero-text h1{\n  margin:0;\n  font-size: 56px;\n  font-weight: 900;\n  letter-spacing: .6px;\n  text-transform: uppercase;\n}\n.hero-text p{\n  margin: 10px 0 0;\n  font-size: 18px;\n  color: var(--muted);\n  font-weight: 600;\n}\n\n.panel{\n  margin-top: 16px;\n  border-radius: var(--radius2);\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(10,16,32,.30);\n  box-shadow: 0 18px 55px rgba(0,0,0,.55);\n  padding: 14px;\n}\n\n.panel-title{\n  display:flex;\n  align-items:center;\n  gap:12px;\n  margin: 6px 4px 12px;\n}\n.panel-line{\n  height:1px;\n  background: rgba(255,255,255,.20);\n  flex:1;\n}\n.panel-label{\n  color: var(--muted);\n  font-weight:800;\n  letter-spacing:.6px;\n  text-transform: uppercase;\n  font-size: 15px;\n}\n\n.cards{\n  display:grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 12px;\n  margin: 10px 0 14px;\n}\n\n.card{\n  border-radius: 18px;\n  overflow:hidden;\n  border: 1px solid rgba(255,255,255,.14);\n  background: rgba(9,14,25,.55);\n  box-shadow: 0 14px 35px rgba(0,0,0,.45);\n  display:flex;\n  flex-direction:column;\n  min-height: 170px;\n}\n\n.card-img{\n  height: 95px;\n  background-size: cover;\n  background-position:center;\n  filter: saturate(1.12) contrast(1.04);\n}\n\n.card-body{\n  padding: 10px 12px 12px;\n}\n\n.card-title{\n  font-weight: 800;\n  letter-spacing:.2px;\n  font-size: 16px;\n  margin: 0 0 8px;\n  text-shadow: 0 10px 20px rgba(0,0,0,.55);\n}\n.card-items{\n  margin:0;\n  padding:0 0 0 14px;\n  color: var(--muted);\n  font-weight: 600;\n  line-height: 1.45;\n}\n\n.two-col{\n  display:grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 12px;\n}\n\n.card-lg{\n  border-radius: 18px;\n  border: 1px solid rgba(255,255,255,.14);\n  background: rgba(9,14,25,.55);\n  box-shadow: 0 14px 35px rgba(0,0,0,.45);\n  padding: 12px;\n}\n\n.card-lg-head{\n  display:flex;\n  align-items:center;\n  justify-content:space-between;\n  gap: 10px;\n  margin-bottom: 8px;\n}\n\n.card-lg-title{\n  font-weight: 900;\n  letter-spacing:.4px;\n  text-transform: uppercase;\n  font-size: 16px;\n  color: var(--text);\n}\n\n.btn{\n  border: 1px solid rgba(255,255,255,.18);\n  background: rgba(30,60,140,.35);\n  color: var(--text);\n  border-radius: 12px;\n  padding: 8px 12px;\n  font-weight: 800;\n  cursor:pointer;\n}\n\n.list{\n  list-style:none;\n  padding:0;\n  margin:0;\n  color: var(--muted);\n  font-weight: 650;\n}\n.list li{\n  padding: 8px 0;\n  border-bottom: 1px solid rgba(255,255,255,.08);\n}\n.list li:last-child{border-bottom:none}\n\n.bottom-nav{\n  position:sticky;\n  bottom:0;\n  left:0;\n  right:0;\n  padding: 12px 14px 16px;\n  display:grid;\n  grid-template-columns: repeat(4, 1fr);\n  gap: 10px;\n  background: linear-gradient(180deg, rgba(7,11,18,0) 0%, rgba(7,11,18,.55) 20%, rgba(7,11,18,.85) 65%, rgba(7,11,18,.95) 100%);\n  backdrop-filter: blur(10px);\n}\n\n.nav-item{\n  text-decoration:none;\n  color: var(--muted2);\n  display:flex;\n  flex-direction:column;\n  align-items:center;\n  gap: 4px;\n  padding: 10px 8px;\n  border-radius: 16px;\n  border: 1px solid rgba(255,255,255,.10);\n  background: rgba(12,18,32,.38);\n}\n.nav-item.active{\n  color: var(--text);\n  border-color: rgba(255,255,255,.18);\n  background: rgba(20,35,70,.45);\n}\n.nav-ico{font-size:20px; line-height:1}\n.nav-lbl{font-weight:800; font-size:12px; letter-spacing:.2px}\n\n@media (max-width: 860px){\n  .brand-text{font-size:34px}\n  .hero-text h1{font-size:44px}\n  .hero-media{height: 280px}\n  .cards{grid-template-columns:1fr}\n  .two-col{grid-template-columns:1fr}\n}\n",
  "app.js": "\n// CityGuide.World Glass UI (Aura-deployed, no GitHub)\n// Renders City + Live modules from Aura export.\n//\n// - world index: https://auras.guide/export/cityguide\n// - city:        https://auras.guide/export/cityguide/:slug\n\nconst AURA_WORLD = \"https://auras.guide/export/cityguide\";\nfunction qs(id){ return document.getElementById(id); }\n\nfunction titleCase(s){\n  return String(s||\"\").split(/\\s+/).map(w=>w? w[0].toUpperCase()+w.slice(1).toLowerCase():w).join(\" \");\n}\nfunction cityFromPath(){\n  const p = location.pathname.replace(/^\\/+|\\/+$/g,\"\");\n  if (!p) return null;\n  if ([\"destinations\",\"offers\",\"trips\"].includes(p)) return null;\n  return p;\n}\nfunction unsplashHero(city){\n  const q = encodeURIComponent((city||\"world\") + \" skyline night\");\n  return `https://source.unsplash.com/1600x900/?${q}`;\n}\nfunction imageForCard(city, topic){\n  const q = encodeURIComponent((city||\"\") + \" \" + topic);\n  return `https://source.unsplash.com/800x500/?${q}`;\n}\nasync function fetchJson(url){\n  const res = await fetch(url, { cache: \"no-store\" });\n  const ct = (res.headers.get(\"content-type\")||\"\").toLowerCase();\n  if (!ct.includes(\"application/json\")) throw new Error(\"non_json\");\n  return await res.json();\n}\n\nfunction setHero(city){\n  const hero = qs(\"heroMedia\");\n  hero.style.backgroundImage = `url(\"${unsplashHero(city)}\")`;\n}\nfunction setTop(city, subtitle){\n  qs(\"heroTitle\").textContent = city ? String(city).toUpperCase() : \"CityGuide.World\";\n  qs(\"heroSubtitle\").textContent = subtitle || (city ? `What\u2019s happening in ${city} \u2014 right now.` : \"Discover what's happening \u2014 anywhere.\");\n  qs(\"panelLabel\").textContent = city ? `Top things to do in ${city}` : \"Top destinations right now\";\n}\n\nfunction renderCards(city, live){\n  const row = qs(\"cardsRow\");\n  row.innerHTML = \"\";\n\n  const attractions = live?.modules?.top_attractions || [];\n  const dining = live?.modules?.dining_spots || [];\n\n  const cards = [\n    { title:\"Top attractions\", topic:\"landmarks\", bullets: attractions.slice(0,2) },\n    { title:\"Dining & spots\", topic:\"restaurant\", bullets: dining.slice(0,2) },\n    { title:\"Today\u2019s weather\", topic:\"weather\", bullets: [weatherLine(live?.weather), \"Live feed enabled\"] }\n  ];\n\n  cards.forEach(c=>{\n    const div=document.createElement(\"div\");\n    div.className=\"card\";\n    const img=document.createElement(\"div\");\n    img.className=\"card-img\";\n    img.style.backgroundImage = `url(\"${imageForCard(city, c.topic)}\")`;\n    const body=document.createElement(\"div\");\n    body.className=\"card-body\";\n    const t=document.createElement(\"div\");\n    t.className=\"card-title\";\n    t.textContent=c.title;\n    const ul=document.createElement(\"ul\");\n    ul.className=\"card-items\";\n    (c.bullets && c.bullets.length ? c.bullets : [\"Loading\u2026\",\"Loading\u2026\"]).slice(0,2).forEach(b=>{\n      const li=document.createElement(\"li\");\n      li.textContent=b;\n      ul.appendChild(li);\n    });\n    body.appendChild(t); body.appendChild(ul);\n    div.appendChild(img); div.appendChild(body);\n    row.appendChild(div);\n  });\n}\n\nfunction weatherLine(wx){\n  if (!wx) return \"Weather: (loading)\";\n  const c = wx.temp_c;\n  if (typeof c !== \"number\") return \"Weather: (unavailable)\";\n  const f = Math.round((c * 9/5) + 32);\n  return `Weather: ${f}\u00b0F`;\n}\n\nfunction renderLists(city, live){\n  const left=qs(\"leftList\");\n  const right=qs(\"rightList\");\n  left.innerHTML=\"\"; right.innerHTML=\"\";\n\n  const events = live?.modules?.upcoming_events || [\"Events feed: provider pending\"];\n  const dining = live?.modules?.dining_spots || [\"Dining feed: loading\u2026\"];\n  const attractions = live?.modules?.top_attractions || [\"Attractions feed: loading\u2026\"];\n\n  events.slice(0,6).forEach(e=>{\n    const li=document.createElement(\"li\");\n    li.textContent=e;\n    left.appendChild(li);\n  });\n\n  // mix dining + attractions\n  const mix = [...dining.slice(0,3), ...attractions.slice(0,3)];\n  mix.slice(0,6).forEach(x=>{\n    const li=document.createElement(\"li\");\n    li.textContent=x;\n    right.appendChild(li);\n  });\n}\n\nfunction renderWorldIndex(cities){\n  setHero(\"World\");\n  setTop(null, \"Pick a city. Any city. Aura runs it.\");\n  const row=qs(\"cardsRow\");\n  row.innerHTML=\"\";\n  (cities||[]).slice(0,9).forEach(c=>{\n    const div=document.createElement(\"div\");\n    div.className=\"card\";\n    const img=document.createElement(\"div\");\n    img.className=\"card-img\";\n    img.style.backgroundImage = `url(\"${unsplashHero(c.city)}\")`;\n    const body=document.createElement(\"div\");\n    body.className=\"card-body\";\n    const t=document.createElement(\"div\");\n    t.className=\"card-title\";\n    t.textContent=c.city;\n    const ul=document.createElement(\"ul\");\n    ul.className=\"card-items\";\n    const li1=document.createElement(\"li\"); li1.textContent = c.vibe ? `Vibe: ${c.vibe}` : \"Vibe: ready\";\n    const li2=document.createElement(\"li\"); li2.textContent = \"Tap to open\";\n    ul.appendChild(li1); ul.appendChild(li2);\n    body.appendChild(t); body.appendChild(ul);\n    div.appendChild(img); div.appendChild(body);\n    div.addEventListener(\"click\", ()=>{ location.href = \"/\" + (c.slug || \"\").toLowerCase(); });\n    row.appendChild(div);\n  });\n\n  // keep lower modules generic\n  renderLists(\"World\", null);\n}\n\nasync function boot(){\n  const slug = cityFromPath();\n  const world = await fetchJson(AURA_WORLD);\n\n  if (!slug){\n    renderWorldIndex(world.cities || []);\n    return;\n  }\n\n  const city = (world.cities || []).find(x => (x.slug || \"\").toLowerCase() === slug.toLowerCase());\n  const cityName = city?.city || titleCase(slug.replace(/-/g,\" \"));\n  setHero(cityName);\n  setTop(cityName);\n\n  // fetch city live export\n  const cityUrl = `https://auras.guide/export/cityguide/${slug}`;\n  let cityJson = null;\n  try { cityJson = await fetchJson(cityUrl); } catch(e){ cityJson = null; }\n\n  const live = cityJson?.live || null;\n  renderCards(cityName, live);\n  renderLists(cityName, live);\n}\n\nboot().catch(()=>{});\n",
  "_redirects": "/*    /index.html   200\n"
};

async function cfApi(env, path, init={}) {
  const token = env.CLOUDFLARE_API_TOKEN;
  if (!token) return { ok:false, status:0, error:"missing_pages_token" };
  const url = "https://api.cloudflare.com/client/v4" + path;
  const res = await fetch(url, {
    ...init,
    headers: {
      "authorization": "Bearer " + token,
      "content-type": init.body instanceof FormData ? undefined : "application/json",
      ...(init.headers || {})
    }
  });
  let j = null;
  try { j = await res.json(); } catch (e) { j = null; }
  return { ok: res.ok, status: res.status, json: j };
}

async function cmdPagesDeployCityGuideUI(env) {
  // Requires account id + project name stored via intent.
  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const project = intent?.repo || "arksystems-cityguide";

  // Account ID is not stored; we try to infer from env.CF_ACCOUNT_ID (optional) or saved kv.
  const cfg = await kvGetJson(env, "aura:cloudflare:config");
  const accountId = env.CF_ACCOUNT_ID || cfg?.account_id;
  if (!accountId) return { ok:false, reply:"pages_deploy: missing_account_id" };

  // Create a Pages deployment using a "files" manifest.
  const form = new FormData();
  // metadata
  form.append("manifest", new Blob([JSON.stringify({})], { type: "application/json" }), "manifest.json");
  // Build files dynamically so we can inject canonical redirect (if configured).
  const files = { ...CITYGUIDE_UI_FILES };
  const canon = await kvGetJson(env, "aura:cityguide:canonical_redirect");
  if (canon?.primary && canon?.secondary && typeof files["index.html"] === "string") {
    const js = `<script>(function(){try{var p="__PRIMARY__";var s="__SECONDARY__";if(location.host===s){var u=location.protocol+"//"+p+location.pathname+location.search+location.hash;location.replace(u);}}catch(e){}})();</script>`;
    const js2 = js.replace("__PRIMARY__", canon.primary).replace("__SECONDARY__", canon.secondary);
    // Inject as early as possible in <head>
    files["index.html"] = files["index.html"].replace("<head>", "<head>\n  " + js2 + "\n");
  }

  // files
  for (const [name, content] of Object.entries(files)) {
    form.append("files", new Blob([content], { type: "application/octet-stream" }), name);
  }


  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}/deployments`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "authorization": "Bearer " + env.CLOUDFLARE_API_TOKEN },
    body: form
  });

  let j = null;
  try { j = await res.json(); } catch (e) { j = null; }

  if (!res.ok) {
    return { ok:false, reply:`pages_deploy: fail (${res.status})` };
  }

  const id = j?.result?.id || j?.result?.deployment_id || "unknown";
  await kvPutJson(env, "aura:cityguide:last_pages_deploy", { ok:true, id, ts: new Date().toISOString() });
  return { ok:true, reply:`pages_deploy: started (${id})` };
}

async function cmdSetCloudflareAccount(env, id) {
  const account_id = String(id || "").trim();
  if (!account_id) return { ok:false, reply:"cf_account: missing" };
  await kvPutJson(env, "aura:cloudflare:config", { account_id, ts: new Date().toISOString(), build: BUILD_VERSION });
  return { ok:true, reply:"cf_account: saved" };
}


async function cmdVerifyGlassAsset(env, assetPath) {
  const intent = await kvGetJson(env, "aura:cityguide:pages_bind_intent");
  const host = pickGlassBase(intent);
  const p = String(assetPath || "").trim().replace(/^\//,"");
  if (!p) return { ok:false, reply:"glass_asset: missing_path" };

  const url = `https://${host}/${p}?cb=${Date.now()}`;
  const r = await fetchCheck(url, 8000);

  // look for signature strings when possible
  let sig = "n/a";
  if (r.ok && typeof r.head === "string") {
    if (r.head.includes("CityGuide.World Glass UI")) sig = "glass_ui_v1";
    else if (r.head.includes(":root{")) sig = "css_root";
    else if (r.head.includes("<!doctype html")) sig = "html";
  }

  await kvPutJson(env, `aura:cityguide:last_verify_asset:${p}`, { url, r, sig, ts: new Date().toISOString() });
  return { ok:true, reply:`glass_asset:${p} ${r.ok ? "ok" : "fail"} (${r.status || 0}) sig=${sig}` };
}

async function cmdPagesLastDeploy(env){
  const d = await kvGetJson(env, "aura:cityguide:last_pages_deploy");
  if (!d) return { ok:true, reply:"pages_last_deploy: none" };
  return { ok:true, reply:`pages_last_deploy: ok id=${d.id} ts=${d.ts}` };
}
async function chatRouter(req, env) {
  const raw = (await req.text()) || "";
  const t = raw.trim();
  const U = t.toUpperCase();

  const memOn = await memIsOn(env);
  if (memOn) await memAppend(env, { ts: new Date().toISOString(), type: "in", text: t, build: BUILD_VERSION });

  if (!t) return { ok: true, reply: "" };
  if (U === "PING") return { ok: true, reply: "pong" };
  if (U === "CAPABILITIES") return await cmdCapabilities(env);

  if (U.startsWith("DECLARE_GITHUB_CONTEXT")) {
    const ctx = parseKeyValueArgs(t.replace(/^DECLARE_GITHUB_CONTEXT\s*/i,""));
    ctx.ts = new Date().toISOString();
    ctx.build = BUILD_VERSION;
    await githubCtxSet(env, ctx);
    return { ok:true, reply:"github_context: saved", github: ctx };
  }
  if (U === "CONFIRM_GITHUB_CONTEXT") {
    const ctx = await githubCtxGet(env);
    if (!ctx) return { ok:false, reply:"github_context: none" };
    return { ok:true, reply: JSON.stringify(ctx, null, 2), github: ctx };
  }
  if (U === "SOURCE_OF_TRUTH") {
    const ctx = await githubCtxGet(env);
    if (ctx && ctx.repo) return { ok:true, reply:`source_of_truth: ${ctx.repo} (${ctx.branch||"main"}) ${ctx.authoritative_path||"src/index.js"}` };
    return { ok:true, reply:'source_of_truth: aaronkaracas-prog/aura-core (main) src/index.js' };
  }


  if (U === "MEMORY:ON") { await memSet(env, true); return { ok:true, reply:"Memory log: ON." }; }
  if (U === "MEMORY:OFF") { await memSet(env, false); return { ok:true, reply:"Memory log: OFF." }; }
  if (U === "MEMORY_STATUS") { const on = await memIsOn(env); return { ok:true, reply:`Memory log: ${on ? "ON" : "OFF"}.` }; }
  if (U.startsWith("MEMORY_EXPORT:")) {
    const n = Number(t.split(":").slice(1).join(":").trim()) || 50;
    const lines = await memExport(env, n);
    return { ok:true, reply: lines.length ? lines.join("\n") : "memory_export: empty" };
  }


  if (U.startsWith("MEMORY_NOTE:")) {
    const note = t.split(":").slice(1).join(":").trim();
    await memNote(env, note);
    return { ok:true, reply:`memory_note: saved` };
  }

  if (U.startsWith("SNAPSHOT:")) {
    const rest = t.split(":").slice(1).join(":").trim();
    const [name, ...noteParts] = rest.split("::");
    const snapName = (name||"").trim();
    const snapNote = (noteParts.join("::")||"").trim();
    return await snapAdd(env, snapName, snapNote);
  }
  if (U === "SNAPSHOT_LIST") return await snapList(env);
  if (U.startsWith("SNAPSHOT_EXPORT:")) {
    const rest = t.split(":").slice(1).join(":").trim();
    const name = rest.split("::")[0].trim();
    const n = Number((rest.split("::")[1]||"").trim()) || 50;
    return await snapExport(env, name, n);
  }

  if (U === "CF_TOKEN_PERMS") return await cmdCfTokenPerms(env);
  if (U.startsWith("CF_CANONICAL_REDIRECT_SET:")) return await cmdCanonicalRedirectSet(env, t.split(":").slice(1).join(":"));
  if (U === "CF_CANONICAL_REDIRECT_STATUS") return await cmdCanonicalRedirectStatus(env);

  if (U.startsWith("CITYGUIDE_WORLD_MODE:")) return await cmdWorldMode(env, t.split(":").slice(1).join(":"));
  if (U.startsWith("CITYGUIDE_WORLD_SEED:")) return await cmdWorldSeed(env, t.split(":").slice(1).join(":"));
  if (U === "CITYGUIDE_WORLD_ANALYZE") return await cmdWorldAnalyze(env);
  if (U === "CITYGUIDE_WORLD_LIST") return await cmdWorldList(env);

  if (U.startsWith("PAGES_BIND_INTENT:")) return await cmdPagesBindIntent(env, t.split(":").slice(1).join(":"));
  if (U === "VERIFY_GLASS_ROOT") return await cmdVerifyGlassRoot(env);
  if (U.startsWith("VERIFY_GLASS_CITY:")) return await cmdVerifyGlassCity(env, t.split(":").slice(1).join(":"));
  if (U === "CITYGUIDE_WORLD_STATUS") return await cmdWorldStatus(env);

  if (U === "RUN_CITYGUIDE_WORLD_VERIFY") return await cmdBatchVerify(env);

  if (U === "PAGES_DEPLOY_CITYGUIDE_UI") return await cmdPagesDeployCityGuideUI(env);
  if (U === "PAGES_LAST_DEPLOY") return await cmdPagesLastDeploy(env);
  if (U.startsWith("VERIFY_GLASS_ASSET:")) return await cmdVerifyGlassAsset(env, t.split(":").slice(1).join(":"));
  if (U.startsWith("CF_ACCOUNT_ID:")) return await cmdSetCloudflareAccount(env, t.split(":").slice(1).join(":"));
  if (U === "CF_TOKEN_VERIFY") return await cmdCfTokenVerify(env);
  if (U === "CF_ACCOUNTS_LIST") return await cmdCfAccountsList(env);
  if (U === "CF_PAGES_PROJECTS_LIST") return await cmdCfPagesProjectsList(env);
  if (U.startsWith("CF_PAGES_PROJECT:")) return await cmdCfPagesSetProject(env, t.split(":").slice(1).join(":"));
if (U.startsWith("CF_PAGES_DOMAIN_INFO:")) return await cmdCfPagesDomainInfo(env, t.split(":").slice(1).join(":"));
if (U.startsWith("CF_ZONE_SET:")) return await cmdCfZoneSet(env, t.split(":").slice(1).join(":"));
if (U.startsWith("CF_PAGES_DNS_FIX:")) return await cmdCfPagesDnsFix(env, t.split(":").slice(1).join(":"));

  if (U === "CF_PAGES_DOMAINS_LIST") return await cmdCfPagesDomainsList(env);
  if (U.startsWith("CF_PAGES_DOMAIN_ADD:")) return await cmdCfPagesDomainAdd(env, t.split(":").slice(1).join(":"));

  if (U.startsWith("CITYGUIDE_LIVE_MODULES:")) return await cmdLiveModules(env, t.split(":").slice(1).join(":"));

  if (U === "LOCK_CITYGUIDE_WORLD_TEMPLATE") return await cmdLockTemplate(env);
  if (U.startsWith("CITYGUIDE_ADD_CITY:")) return await cmdAddCity(env, t.split(":").slice(1).join(":"));

  if (U.startsWith("CITYGUIDE_PROJECT_CITY:")) {
    const slug = t.split(":").slice(1).join(":");
    const r = await ensureCityProjected(env, slug);
    return { ok:true, reply: r.created ? `city_projected: ${r.slug}` : `city_projected: already ${r.slug}` };
  }

  return { ok: true, reply: t };
}


// --- CANON (KV-backed, minimal) ---
function canonAliasNorm(a){
  return String(a||"").trim().replace(/\s+/g,"_").toUpperCase();
}
function canonKey(alias){
  return "canon:" + canonAliasNorm(alias);
}
async function canonGet(env, alias){
  if (!kvOk(env)) return { ok:false, reply:"canon_get: kv_missing" };
  const a = canonAliasNorm(alias);
  if (!a) return { ok:false, reply:"canon_get: missing_alias" };
  const v = await env.AURA_KV.get(canonKey(a));
  if (!v) return { ok:false, reply:`canon_get: not_found (${a})` };
  return { ok:true, reply:v, alias:a };
}

function health() {
  return jsonResp({ ok: true, version: BUILD_VERSION, stamp: BUILD_STAMP });
}

export default {
  async fetch(req, env) {
    AURA_ENV = env;
    const url = new URL(req.url);
    try {

    if (req.method === "OPTIONS") return optionsOk();

    if (req.method === "GET" && url.pathname === "/") return html(`<script>location.href='/ui'</script>`);
    if (req.method === "GET" && url.pathname === "/ui") return html(uiHtml());
    if (req.method === "GET" && url.pathname === "/health") return health();

    
if (req.method === "POST" && url.pathname === "/chat") {
      const body = await req.text();
      let t = (body || "").trim();
      t = normalizeCommandInput(t);
      if (!t) return jsonResp({ ok: true, reply: "" });


      // --- SESSION MEMORY PACK WORKFLOW (server-side, deterministic) ---
      const rawLower = t.toLowerCase();
      const rawTrim = t.trim();

      // 1) MEMORY PACK paste: store + load as authoritative context for this session.
      if (isMemoryPackPaste(rawTrim)) {
        // Accept both multiline and single-line packs. Persist raw text + parsed state.
        try { await sessionLastPackPut(env, rawTrim); } catch(e){}
        try {
          const parsed = parseMemoryPack(rawTrim);
          await sessionStatePut(env, parsed);
        } catch(e){}
        return jsonResp({ ok: true, reply: "Memory pack loaded." });
      }

      // 2) Create SESSION MEMORY PACK on demand (under 20 lines, in one code block)
      if (isSessionPackCreate(rawLower)) {
        let state = { topic:"", objective:"", entities:[], aliases:{} };
        try { state = await sessionStateGet(env); } catch(e){}
        const pack = makeSessionMemoryPack(
          { topic: state.topic, entities: state.entities },
          state.aliases,
          state.objective,
          [
            `Build: ${BUILD_VERSION}`,
            `Stamp: ${BUILD_STAMP}`,
            "Goal: microphone behavior + session continuity prompts",
          ]
        );
        try { await sessionLastPackPut(env, pack); } catch(e){}
        return jsonResp({ ok: true, reply: pack });
      }

      // 3) Prior-session questions: ask for pack (or use most recent pack if present)
      if (isPriorSessionQuestion(rawLower)) {
        const last = await sessionLastPackGet(env);
        if (!last) {
          return jsonResp({ ok: true, reply:
            "Paste your most recent SESSION MEMORY PACK (start with 'MEMORY PACK:'), and I'll answer using it. If you don't have it, I can't know what was discussed in prior sessions, but I can generate a pack at the end of each session going forward."
          });
        }
        return jsonResp({ ok: true, reply: `Using your most recent SESSION MEMORY PACK:\n\n${last}` });
      }

      // Always keep operator commands working (Aura control plane)
      if (t.toUpperCase() === "PING") return jsonResp({ ok: true, reply: "pong" });

      // --- SELF-BUNDLE (GitHub raw fetch -> KV, staging only) ---
      if (/^DECLARE_SELF_BUNDLE_TARGET\b/i.test(t)) {
        await env.AURA_KV.put("aura:self_bundle:target", t);
        return jsonResp({ ok: true, reply: "self_bundle_target: saved" });
      }

      if (/^GENERATE_SELF_BUNDLE$/i.test(t)) {
        const gh = await githubCtxGet(env);
        if (!gh) return jsonResp({ ok: false, reply: "self_bundle: github_context_none" });

        const owner = gh.owner;
        const repo = gh.repo;
        const branch = gh.branch || "main";
        const path = gh.path || "src/index.js";
        if (!owner || !repo || !path) return jsonResp({ ok: false, reply: "self_bundle: github_context_incomplete" });

        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const resp = await fetch(rawUrl, { method: "GET" });
        const txt = await resp.text();

        if (!resp.ok) {
          return jsonResp({ ok: false, reply: JSON.stringify({ self_bundle: "fetch_failed", http_status: resp.status, url: rawUrl }) });
        }

        const bundleB64 = toB64(txt);
        const meta = { ts: new Date().toISOString(), bytes: txt.length, b64_len: bundleB64.length, target: "staging", source: "github_raw", url: rawUrl };

        await env.AURA_KV.put("aura:self_bundle:b64", bundleB64);
        await env.AURA_KV.put("aura:self_bundle:meta", JSON.stringify(meta));

        return jsonResp({ ok: true, reply: "self_bundle: generated", meta });
      }

      if (/^SHOW_SELF_BUNDLE_METADATA$/i.test(t)) {
        const meta = await env.AURA_KV.get("aura:self_bundle:meta");
        return jsonResp({ ok: true, reply: meta || "self_bundle: none" });
      }

      if (/^SEND_SELF_BUNDLE_TO_DEPLOYER$/i.test(t)) {
        const bundle = await env.AURA_KV.get("aura:self_bundle:b64");
        if (!bundle) return jsonResp({ ok: false, reply: "self_bundle: missing" });

        const deployPayload = { target: "staging", bundle };
        const key = env.AURA_DEPLOYER_KEY || "";
        if (!key) return jsonResp({ ok: false, reply: "deployer_key: missing" });

        const headers = { "content-type": "application/json", "X-DEPLOY-KEY": key };

        // Prefer service binding
        if (env.AURA_DEPLOYER && typeof env.AURA_DEPLOYER.fetch === "function") {
          const r = await env.AURA_DEPLOYER.fetch("https://aura-deployer/", { method: "POST", headers, body: JSON.stringify(deployPayload) });
          return jsonResp({ ok: r.ok, reply: (await r.text()).slice(0, 2000) });
        }

        // Fallback URL
        const deployUrl = env.AURA_DEPLOYER_URL;
        if (!deployUrl) return jsonResp({ ok: false, reply: "deployer_url: missing" });

        const r = await fetch(deployUrl, { method: "POST", headers, body: JSON.stringify(deployPayload) });
        return jsonResp({ ok: r.ok, reply: (await r.text()).slice(0, 2000) });
      }

      // --- CANON RECALL (KV-backed) ---
      if (/^RECALL_CANON$/i.test(t)) {
        const r = await canonGet(env, "ARKSYSTEMS_CURRENT_REALITY");
        return jsonResp({ ok: r.ok, reply: r.reply, canon: r });
      }
      if (/^RECALL_CANON:/i.test(t)) {
        const alias = t.split(":").slice(1).join(":").trim();
        const r = await canonGet(env, alias || "ARKSYSTEMS_CURRENT_REALITY");
        return jsonResp({ ok: r.ok, reply: r.reply, canon: r });
      }


      // --- GITHUB CONTEXT (KV-backed) ---
      if (/^DECLARE_GITHUB_CONTEXT\b/i.test(t)) {
        const rest = t.replace(/^DECLARE_GITHUB_CONTEXT\s*/i,"").trim();
        const ctx = parseKeyValueArgs(rest);
        ctx.ts = new Date().toISOString();
        ctx.build = BUILD_VERSION;
        await githubCtxSet(env, ctx);
        return jsonResp({ ok:true, reply:"github_context: saved", github: ctx });
      }
      if (/^CONFIRM_GITHUB_CONTEXT$/i.test(t)) {
        const ctx = await githubCtxGet(env);
        if (!ctx) return jsonResp({ ok:false, reply:"github_context: none" });
        return jsonResp({ ok:true, reply: JSON.stringify(ctx, null, 2), github: ctx });
      }
      if (/^SOURCE_OF_TRUTH$/i.test(t)) {
        const ctx = await githubCtxGet(env);
        const msg = (ctx && ctx.repo)
          ? `source_of_truth: ${ctx.repo} (${ctx.branch||"main"}) ${ctx.authoritative_path||"src/index.js"}`
          : "source_of_truth: aaronkaracas-prog/aura-core (main) src/index.js";
        return jsonResp({ ok:true, reply: msg, github: ctx||null });
      }

      // --- IDENTITY / SELF (simple, deterministic) ---
      if (/^(IDENTITY|DESCRIBE_SELF|STATE_ROLE|LIST_CAPABILITIES)$/i.test(t)) {
        const caps = [
          "PING",
          "RECALL_CANON",
          "Operator command routing (this build)",
          "UI (mic + uploads) (STEP 11)"
        ];
        const identity =
          "I am Aura — the ARK Systems control-plane Worker (aura-core) for Aaron Karacas. " +
          "I run on Cloudflare Workers and respond to operator commands.";
        if (/^LIST_CAPABILITIES$/i.test(t)) return jsonResp({ ok:true, reply: caps.join("\\n") });
        return jsonResp({ ok:true, reply: identity });
      }
      if (/^(who are you|what are you)\??$/i.test(t)) {
        return jsonResp({ ok:true, reply: "I am Aura — the ARK Systems control-plane Worker (aura-core) for Aaron Karacas." });
      }
      if (/^(what can you do|help)\??$/i.test(t)) {
        return jsonResp({ ok:true, reply: "Commands: PING, RECALL_CANON. I also run the Aura UI (/ui) with mic + uploads." });
      }


      // SHOW_CLAIM_GATE  (STEP 97)
      // Returns JSON: { trigger_words, forced_message, requires_verified_fetch_format }
      if (t.toUpperCase() === "SHOW_CLAIM_GATE") {
        const info = getClaimGateInfo();
        return jsonResp({ ok: true, reply: JSON.stringify(info, null, 2), claim_gate: info });
      }

      // SHOW_BUILD
      // Returns JSON: { build, stamp }
      if (t.toUpperCase() === "SHOW_BUILD") {
        const info = { build: BUILD_VERSION, stamp: BUILD_STAMP };
        return jsonResp({ ok: true, reply: JSON.stringify(info, null, 2), ...info });
      }


// VERIFIED_FETCH_URL <url>  (STEP 97)
// NOTE: URL parsing is STRICT: the URL is the first token after the command.
// Any remaining text is treated as an optional "follow-up prompt" that will be executed
// in the SAME request (so VERIFIED_FETCH context cannot expire between messages).
// Returns JSON exactly: { ok, url, http_status, first_line_html, error? }
let __inlineVF = null;
let __inlineVFHost = "";
let __inlineFollowup = "";

if (t.toUpperCase().startsWith("VERIFIED_FETCH_URL")) {
  const rest = String(t.slice("VERIFIED_FETCH_URL".length) || "").trim();
  const parts = rest.split(/\s+/).filter(Boolean);
  const urlTok = (parts[0] || "").trim();
  const follow = parts.slice(1).join(" ").trim();
  const r = await verifiedFetchUrl(urlTok);

  // Always return the fetch result if no follow-up prompt provided.
  if (!follow) {
    return jsonResp({ ok: true, reply: JSON.stringify(r, null, 2), verified_fetch: r });
  }

  // Inline follow-up: keep VF evidence bound to THIS request.
  __inlineVF = r;
  __inlineVFHost = extractHostFromText(urlTok);
  __inlineFollowup = follow;
  t = normalizeCommandInput(follow);
}


      

// --- CLAIM GATE (host-scoped) ---
// Status-claim prompts are blocked unless this host has a recent VERIFIED_FETCH_URL (KV-backed TTL).
let __claimGateAllow = false;
if (promptLooksLikeStatusClaim(t)) {
  const host = extractHostFromText(t) || (__inlineVFHost || "");
  let rec = null;
  if (__inlineVF && host && __inlineVFHost && host === __inlineVFHost) {
    rec = __inlineVF;
  } else {
    rec = await getVerifiedFetchRecord(env, host);
  }
  if (!rec) {
    return jsonResp({ ok: true, reply: "NOT WIRED: VERIFIED_FETCH REQUIRED" });
  }
  __claimGateAllow = true;
}

// Session log (KV-backed, always-on tiny ring) for SESSION MEMORY PACK workflow.
      try { if (env.AURA_KV) await sessionLogAppend(env, { ts: new Date().toISOString(), type: "chat_in", text: t, build: BUILD_VERSION }); } catch(e){}

      // Memory log (KV-backed, opt-in) — captures in/out for continuity across sessions.
      try {
        const memOn = await memIsOn(env);
        if (memOn) await memAppend(env, { ts: new Date().toISOString(), type: "chat_in", text: t, build: BUILD_VERSION });
      } catch(e){}

      // LLM-backed chat (Cloudflare Workers AI). No OpenAI keys required.
      if (env.AI) {
        // Minimal chat template: Aura is the assistant; stay aligned with Aaron's doctrine.
        // Identity + capability hard-lock (STEP 84)
// Important: Aura must NOT claim cross-session memory beyond what is explicitly persisted in KV.
const op = await getOperatorProfile(env);
const CAPABILITIES_LOCK = [
  "Text chat inside Aura UI (/ui -> POST /chat).",
  "Mic input (browser SpeechRecognition -> text) and single-send de-dupe (client-side).",
  "File uploads (small files stored in KV) and retrieval via /files and /files/:id.",
  "Image generation via Workers AI (/image) stored in KV and retrievable via /files/:id (when AI binding is enabled).",
  "CityGuide exports and tools: /export/cityguide and /export/cityguide/:slug plus CityGuide world commands (where implemented).",
  "Admin / deployment / Cloudflare tooling ONLY as explicitly implemented in this worker's command set; never claim OS-level control."
].join("\n- ");

const __vfBlock = (__inlineVF ? `\nVERIFIED_FETCH_CONTEXT (this request only):\n${JSON.stringify(__inlineVF)}\n` : "");

const prompt =
`SYSTEM:
You are Aura, running inside Aura Core (Cloudflare Worker). You are assisting ${op.name}, ${op.role}.
Hard rules (non-negotiable):
- You already know the operator is ${op.name}. Never say you "don't know" who they are.
- Never re-introduce yourself (no "Welcome", no "I'm Aura") unless the operator explicitly asks for an introduction.
- Never claim you remember "everything across sessions" by default. Cross-session persistence exists ONLY when data is explicitly stored in Aura KV (e.g., uploads, operator profile, memory log, snapshots). If asked, explain that plainly.
- Reduce pointless clarifying questions. If the input is a simple test phrase, respond minimally.
- List capabilities ONLY from this wired list; do not invent capabilities.
Wired capabilities (only):
- ${CAPABILITIES_LOCK}
${__vfBlock}
Operator input:
${t}

Aura response (concise, truthful, no invented capabilities):`;
        try {

          // STEP 99: Prompt-intent claim gate (blocks status claims unless a recent passing VERIFIED_FETCH exists for the host)
          try{
            const host = extractHostFromText(t);
            if (promptLooksLikeStatusClaim(t)) {
              const okHost = host && await hasRecentPassingVerifiedFetch(env, host);
              if (!okHost) {
                const forced = "NOT WIRED: VERIFIED_FETCH REQUIRED";
                try {
                  const memOnX = await memIsOn(env);
                  if (memOnX) await memAppend(env, { ts: new Date().toISOString(), type: "chat_out", text: forced, build: BUILD_VERSION });
                } catch(e){}
                return jsonResp({ ok: true, reply: forced });
              }
            }
          } catch(e){}
          const out = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
            prompt,
            max_tokens: 512,
            temperature: 0.3
          });
          // Workers AI returns { response: "..." } for many text models.
          const reply = (out && (out.response || out.output || out.result || out.text)) ? (out.response || out.output || out.result || out.text) : JSON.stringify(out);
          const finalReply = String(reply || "").trim();
          const gatedReply = (__claimGateAllow ? finalReply : enforceClaimGate(finalReply));
          try {
            const memOn2 = await memIsOn(env);
            if (memOn2) await memAppend(env, { ts: new Date().toISOString(), type: "chat_out", text: gatedReply, build: BUILD_VERSION });
          } catch(e){}
          return jsonResp({ ok: true, reply: gatedReply });
        } catch (e) {
          return jsonResp({ ok: false, error: "ai_run_failed", detail: e && e.message ? e.message : String(e) }, 500);
        }
      }

      // Fallback: echo (should not happen once AI binding is wired)
      return jsonResp({ ok: true, reply: t });
    }


    if (req.method === "GET" && url.pathname === "/export/cityguide") return exportWorld(env);
    if (req.method === "GET" && url.pathname === "/files") {
      if (!env.AURA_KV) return jsonResp({ ok:false, error:"kv_missing" }, 500);
      const idx = await uploadsIndexGet(env);
      return jsonResp({ ok:true, files: idx, count: idx.length, build: BUILD_VERSION });
    }

    if (req.method === "GET" && url.pathname.startsWith("/files/")) {
      if (!env.AURA_KV) return jsonResp({ ok:false, error:"kv_missing" }, 500);
      const id = url.pathname.split("/").pop();
      const rec = await uploadGet(env, id);
      if (!rec) return jsonResp({ ok:false, error:"not_found" }, 404);
      // Return raw bytes
      const bin = atob(rec.b64 || "");
      const bytes = new Uint8Array(bin.length);
      for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
      return new Response(bytes, { status:200, headers: withCors({
        "content-type": rec.type || "application/octet-stream",
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(rec.name||id)}`
      })});
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/files/")) {
      if (!env.AURA_KV) return jsonResp({ ok:false, error:"kv_missing" }, 500);
      const id = url.pathname.split("/").pop();
      await uploadDelete(env, id);
      return jsonResp({ ok:true, deleted: id });
    }

    if (req.method === "POST" && url.pathname === "/upload") {
      if (!env.AURA_KV) return jsonResp({ ok:false, error:"kv_missing" }, 500);
      let j=null;
      try { j = await req.json(); } catch(e){ j=null; }
      if (!j || !j.b64 || !j.name) return jsonResp({ ok:false, error:"bad_upload_payload" }, 400);
      const name = String(j.name||"").slice(0,200);
      const type = String(j.type||"application/octet-stream").slice(0,100);
      const size = Number(j.size||0);
      const b64 = String(j.b64||"");
      // Hard safety limit (4MB) unless later moved to R2
      const MAX = 4 * 1024 * 1024;
      if (size > MAX) return jsonResp({ ok:false, error:"too_large", max: MAX, size }, 413);
      const id = uploadId(name, size, b64.slice(0,48));
      const rec = { id, name, type, size, b64, ts: new Date().toISOString(), build: BUILD_VERSION };
      await uploadStore(env, rec);
      return jsonResp({ ok:true, id, name, type, size, href:`/files/${id}` });
    }

    
    if (req.method === "POST" && url.pathname === "/image") {
      if (!env.AURA_KV) return jsonResp({ ok:false, error:"kv_missing" }, 500);
      if (!env.AI) return jsonResp({ ok:false, error:"ai_missing", reply:"AI binding not enabled yet." }, 500);
      let j=null;
      try { j = await req.json(); } catch(e){ j=null; }
      const prompt = j && j.prompt ? String(j.prompt).trim() : "";
      if (!prompt) return jsonResp({ ok:false, error:"missing_prompt" }, 400);

      try {
        const imgStream = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt });
        // Convert stream to ArrayBuffer so we can store in KV as base64 (small images only for now)
        const ab = await new Response(imgStream).arrayBuffer();
        const b64 = b64FromArrayBuffer(ab);
        const name = "gen_" + Date.now() + ".jpg";
        const id = uploadId(name, ab.byteLength, b64.slice(0,48));
        const rec = { id, name, type:"image/jpg", size: ab.byteLength, b64, ts: new Date().toISOString(), build: BUILD_VERSION, gen: { prompt } };
        await uploadStore(env, rec);
        return jsonResp({ ok:true, id, name, type: rec.type, href:`/files/${id}` });
      } catch (e) {
        return jsonResp({ ok:false, error:"image_gen_failed", detail: e && e.message ? e.message : String(e) }, 500);
      }
    }

if (req.method === "GET" && url.pathname.startsWith("/export/cityguide/")) {
      const slug = url.pathname.split("/").pop();
      return exportCity(slug, env);
    }

    return jsonResp({ ok: false, error: "not_found" }, 404);
    } catch (e) {
      return jsonResp({ ok: false, error: "unhandled_exception", detail: e && e.message ? e.message : String(e), build: BUILD_VERSION }, 500);
    }
  }
};
