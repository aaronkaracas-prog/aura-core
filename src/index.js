
// AURA_CORE_EXECUTION_ROUTER__2026-01-22__EXEC_MODE_V2__UI_MINIMAL_FIXED
// Full-file replacement.
// Fixes /core UI interactions: Enter-to-send, mic (SpeechRecognition), real file upload to R2 (if bound),
// and richer /health + upload endpoints.
// Keeps execution router behavior intact.

function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function htmlResponse(body) {
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function textResponse(status, body) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function uid() {
  // URL-safe-ish random id
  return "u_" + crypto.randomUUID().replace(/-/g, "");
}

function safeName(name) {
  return (name || "file").replace(/[^\w.\-() ]+/g, "_").slice(0, 140);
}

function wiringCheck(env) {
  const has = (k) => Boolean(env && env[k]);
  return {
    has_AURA_KV: has("AURA_KV"),
    has_AURA_UPLOADS_R2: has("AURA_UPLOADS"),
    has_GOOGLE_PLACES_API_KEY: has("GOOGLE_PLACES_API_KEY"),
    has_CLOUDFLARE_DNS_TOKEN: has("CLOUDFLARE_DNS_TOKEN"),
    has_CITYGUIDE_DOMAIN: has("CITYGUIDE_DOMAIN"),
    has_AURA_ADMIN_TOKEN: has("AURA_ADMIN_TOKEN")
  };
}


async function kvListAll(env, prefix, maxKeys = 500) {
  if (!env?.AURA_KV) return { ok: false, error: "kv_not_bound" };
  const keys = [];
  let cursor = undefined;
  let safety = 0;
  while (keys.length < maxKeys && safety < 50) {
    safety++;
    const res = await env.AURA_KV.list({ prefix, cursor, limit: Math.min(100, maxKeys - keys.length) });
    if (res?.keys?.length) for (const k of res.keys) keys.push(k.name);
    cursor = res?.cursor;
    if (res?.list_complete) break;
    if (!cursor) break;
  }
  return { ok: true, prefix, count: keys.length, keys, truncated: keys.length >= maxKeys };
}

async function kvGetJson(env, key) {
  if (!env?.AURA_KV) return { ok: false, error: "kv_not_bound" };
  const v = await env.AURA_KV.get(key);
  if (v === null) return { ok: false, error: "not_found", key };
  try { return { ok: true, key, json: JSON.parse(v) }; }
  catch { return { ok: true, key, text: v }; }
}

async function readCityGuideMalibu(env) {
  const prefixes = ["cityguide:malibu:","cityguide:malibu/","city:malibu:","cg:malibu:","malibu:","listing:malibu:"];
  const tried = [];
  for (const p of prefixes) {
    const r = await kvListAll(env, p, 200);
    tried.push({ prefix: p, ok: r.ok, count: r.ok ? r.count : 0, error: r.error });
    if (r.ok && r.count > 0) {
      return { ok: true, city: "malibu", prefix_used: p, count: r.count, sample_keys: r.keys.slice(0, 25), truncated: r.truncated === true };
    }
  }
  return { ok: false, city: "malibu", error: "no_keys_found_for_common_prefixes", tried };
}

function detectExecutionContract(t) {
  const s = (t || "").toLowerCase().trim();

  // Atomic execution primitives must work as single-line commands.
  if (s === "wiring check") return true;
  if (s.startsWith("emit ")) return true;
  if (s.startsWith("execution mode")) return true;
  if (s.startsWith("read cityguide")) return true;
  if (s.startsWith("kv ")) return true;
  if (s.startsWith("generate an image")) return true;


  // Back-compat: if message contains 2+ cues, treat as execution.
  const hits = [
    "execution mode",
    "no questions",
    "full file replacement",
    "execute",
    "output artifacts",
    "generate index.js",
    "implement cityguide",
    "cityguide v1",
    "wiring check",
    "emit ",
    "read cityguide",
    "kv list",
    "kv get",
    "generate an image"
  ];
  let c = 0;
  for (const h of hits) if (s.includes(h)) c++;
  return c >= 2;
}


async function executionReply(t, env) {
  const s = (t || "").toLowerCase().trim();

  if (s === "wiring check") {
    return JSON.stringify({ mode: "execution", wiring: wiringCheck(env) }, null, 2);
  }

  // KV tools (execution mode)
  if (s.startsWith("kv list prefix ")) {
    const prefix = (t || "").slice("kv list prefix ".length).trim();
    const r = await kvListAll(env, prefix, 500);
    return JSON.stringify(r, null, 2);
  }
  if (s.startsWith("kv get ")) {
    const key = (t || "").slice("kv get ".length).trim();
    const r = await kvGetJson(env, key);
    return JSON.stringify(r, null, 2);
  }

  // CityGuide read probe (non-destructive)
  if (s === "read cityguide malibu listings (non-destructive)" || s === "read cityguide malibu listings" || s.startsWith("read cityguide malibu")) {
    const r = await readCityGuideMalibu(env);
    return JSON.stringify(r, null, 2);
  }

  // Image generation probe
  if (s.startsWith("generate an image")) {
    return [
      "EXECUTION MODE — IMAGE",
      "",
      "image_generation_capability_missing",
      "This worker build does not yet implement an image generation command runner.",
      "Next step: add an execution command that calls the configured image provider using OPENAI_API_KEY and returns an artifact URL (R2) or a hosted image link."
    ].join("\n");
  }



  if (s.startsWith("emit ")) {
    // Minimal artifact emit: describe what this build can do right now and what is required next.
    const wantsCityGuide = s.includes("cityguide");
    const wantsMalibu = s.includes("malibu");
    const wantsV1 = s.includes("v1") || s.includes("version 1");

    if (wantsCityGuide && wantsMalibu && wantsV1) {
      return [
        "EXECUTION MODE — ARTIFACT EMIT",
        "",
        "ARTIFACTS:",
        "1) This worker build: /core UI (fixed), /health wiring check, /core/upload (R2 if bound), /core/command execution router.",
        "2) CityGuide public routes are NOT present in this build yet (this file is a Core + Execution Router).",
        "",
        "NEXT REQUIRED ARTIFACT (to enable CityGuide.World launch pages):",
        "- A full-file index.js that adds CityGuide v1 routes (/, /city/<slug>, /api/city/<slug>/listings) and KV reconciliation/index builder.",
        "",
        "REQUIRED ENV (for CityGuide listings):",
        "- AURA_KV (required)",
        "- CITYGUIDE_DOMAIN (optional)",
        "- GOOGLE_PLACES_API_KEY (optional, for ingestion)",
        "",
        "NEXT COMMAND:",
        "- implement CityGuide v1 for Malibu"
      ].join("\n");
    }

    return [
      "EXECUTION MODE — EMIT",
      "",
      "No supported emit artifact matched.",
      "Try: emit CityGuide v1 artifacts for Malibu"
    ].join("\n");
  }

  if (s.includes("implement cityguide")) {
    return [
      "EXECUTION MODE — ARTIFACTS ONLY",
      "",
      "OUTPUT:",
      "- Full CityGuide v1 index.js (next step)",
      "- Env vars required",
      "- Wrangler deploy commands",
      "",
      "STATUS:",
      "Execution router active.",
      "Ready to emit full artifacts on next CityGuide execution prompt."
    ].join("\n");
  }

  return [
    "EXECUTION MODE ACTIVE",
    "",
    "No executable artifact matched.",
    "Send a concrete execution command (e.g. 'wiring check' or 'implement CityGuide v1 for Malibu')."
  ].join("\n");
}

function identityCapabilitiesResponse() {
  return [
    "I am Aura — the control-plane intelligence for ARK Systems.",
    "",
    "Mode: Respond / Diagnostic",
    "Use execution contracts to force artifact output."
  ].join("\n");
}

function looksLikeStructuredPrompt(t) {
  const s = (t || "").toLowerCase();
  const cues = ["first,", "second,", "third,", "do not echo", "capabilities", "limitations", "cityguide"];
  let hit = 0;
  for (const c of cues) if (s.includes(c)) hit++;
  return hit >= 3 || (t || "").length > 350;
}

function respond(t) {
  if (/^who are you\??$/i.test(t)) return "I am Aura — the control-plane intelligence for ARK Systems.";
  if (looksLikeStructuredPrompt(t) || /capabilities|what can you do/i.test(t)) return identityCapabilitiesResponse();
  return "Acknowledged. Tell me the next instruction.";
}

function isTooGeneric(reply) {
  const s = (reply || "").trim().toLowerCase();
  return s === "acknowledged. tell me the next instruction.";
}

async function requireAdmin(request, env) {
  const pass = request.headers.get("X-Core-Pass") || "";
  const ok = env?.AURA_ADMIN_TOKEN && pass && pass === env.AURA_ADMIN_TOKEN;
  return ok;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------- UI (MINIMAL, FIXED) ----------
    if (url.pathname === "/core") {
      return htmlResponse(`<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aura Core</title>
<style>
:root { --bg:#0b1020; --card:rgba(255,255,255,.08); --line:rgba(255,255,255,.12); --accent:#38bdf8; }
body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; background:var(--bg); color:#fff; }
header { position:sticky; top:0; z-index:10; background:rgba(0,0,0,.55); backdrop-filter: blur(10px); border-bottom:1px solid var(--line); }
header .bar { display:flex; gap:10px; align-items:center; padding:12px 14px; }
header .title { font-weight:700; letter-spacing:.2px; }
header .pill { margin-left:auto; font-size:12px; padding:6px 10px; border-radius:999px; background:var(--card); border:1px solid var(--line); }
main { max-width:980px; margin:0 auto; padding:14px; }
#chat { border:1px solid var(--line); border-radius:16px; background:rgba(0,0,0,.25); padding:12px; height:60vh; overflow-y:auto; }
.bubble { padding:10px 12px; margin:10px 0; border-radius:14px; white-space:pre-wrap; line-height:1.35; border:1px solid var(--line); }
.user { background:rgba(56,189,248,.12); }
.aura { background:rgba(255,255,255,.06); }
.meta { font-size:12px; opacity:.75; margin-top:6px; }
.composer { margin-top:12px; border:1px solid var(--line); border-radius:18px; background:rgba(255,255,255,.04); padding:10px; }
#input { width:100%; min-height:92px; max-height:220px; resize:vertical; font-size:16px; border:none; outline:none; color:#fff; background:transparent; }
.controls { display:flex; gap:8px; align-items:center; margin-top:10px; }
button { border:1px solid var(--line); background:var(--card); color:#fff; padding:10px 12px; border-radius:14px; font-size:16px; cursor:pointer; }
button.primary { background:var(--accent); border-color:transparent; color:#001018; font-weight:700; }
button:disabled { opacity:.55; cursor:not-allowed; }
#file { display:none; }
#attachList { font-size:13px; opacity:.9; margin-top:8px; display:flex; flex-wrap:wrap; gap:8px; }
.chip { border:1px solid var(--line); background:rgba(255,255,255,.06); padding:6px 10px; border-radius:999px; display:flex; gap:8px; align-items:center; }
.chip b { font-weight:600; }
.chip .x { opacity:.85; cursor:pointer; }
.status { font-size:12px; opacity:.8; margin-left:auto; }
</style>
</head>
<body>
<header>
  <div class="bar">
    <div class="title">Aura Core (Minimal)</div>
    <div class="pill" id="healthPill">connecting…</div>
  </div>
</header>

<main>
  <div id="chat"></div>

  <div class="composer">
    <textarea id="input" placeholder="Type here… (Enter to send, Shift+Enter for new line)"></textarea>

    <div id="attachList"></div>

    <div class="controls">
      <input type="file" id="file" multiple />
      <button id="attach" title="Add files">＋</button>
      <button id="mic" title="Voice">🎤</button>
      <button id="send" class="primary">Send</button>
      <div class="status" id="status"></div>
    </div>
  </div>
</main>

<script>
const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const fileInput = document.getElementById("file");
const attachBtn = document.getElementById("attach");
const attachList = document.getElementById("attachList");
const healthPill = document.getElementById("healthPill");
const statusEl = document.getElementById("status");

let attachments = []; // {id,name,size,type,url?}
let recognizing = false;
let recognition = null;

function bubble(cls, text, meta) {
  const d = document.createElement("div");
  d.className = "bubble " + cls;
  d.textContent = text;
  if (meta) {
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = meta;
    d.appendChild(m);
  }
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function setStatus(t) { statusEl.textContent = t || ""; }

function renderAttachments() {
  attachList.innerHTML = "";
  attachments.forEach((a, idx) => {
    const c = document.createElement("div");
    c.className = "chip";
    const name = (a.name || "file").slice(0, 60);
    c.innerHTML = "<b>📎</b><span>" + name + "</span><span class='x' title='Remove'>✕</span>";
    c.querySelector(".x").onclick = () => {
      attachments.splice(idx, 1);
      renderAttachments();
    };
    attachList.appendChild(c);
  });
}

async function refreshHealth() {
  try {
    const r = await fetch("/health", { cache: "no-store" });
    const j = await r.json();
    if (j && j.ok) {
      healthPill.textContent = "ok";
    } else {
      healthPill.textContent = "down";
    }
  } catch (e) {
    healthPill.textContent = "offline";
  }
}

async function uploadFiles(files) {
  if (!files || !files.length) return;
  setStatus("Uploading…");
  sendBtn.disabled = true;
  attachBtn.disabled = true;

  try {
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f, f.name);
      const r = await fetch("/core/upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.ok) {
        bubble("aura", "Upload failed for: " + f.name + "\\n" + (j && j.error ? j.error : "unknown_error"));
        continue;
      }
      attachments.push(j.upload);
      renderAttachments();
    }
  } catch (e) {
    bubble("aura", "Upload error: " + (e && e.message ? e.message : String(e)));
  } finally {
    setStatus("");
    sendBtn.disabled = false;
    attachBtn.disabled = false;
    fileInput.value = "";
  }
}

async function sendMsg(text) {
  const t = (text || "").trim();
  if (!t && !attachments.length) return;

  const meta = attachments.length ? ("Attachments: " + attachments.map(a => a.name).join(", ")) : "";
  bubble("user", t || "(attachments)", meta);

  input.value = "";
  const payload = { text: t, attachments };

  attachments = [];
  renderAttachments();

  setStatus("Thinking…");
  sendBtn.disabled = true;
  micBtn.disabled = true;
  attachBtn.disabled = true;

  try {
    const r = await fetch("/core/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const j = await r.json().catch(() => null);
    const reply = (j && j.reply) ? j.reply : (j && j.error) ? j.error : "ok";
    bubble("aura", reply);
  } catch (e) {
    bubble("aura", "Request failed: " + (e && e.message ? e.message : String(e)));
  } finally {
    setStatus("");
    sendBtn.disabled = false;
    micBtn.disabled = false;
    attachBtn.disabled = false;
    input.focus();
  }
}

sendBtn.onclick = () => sendMsg(input.value);

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMsg(input.value);
  }
});

attachBtn.onclick = () => fileInput.click();
fileInput.onchange = () => uploadFiles([...fileInput.files]);

function initSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";

  rec.onstart = () => {
    recognizing = true;
    micBtn.textContent = "⏺";
    setStatus("Listening…");
  };

  rec.onerror = (e) => {
    bubble("aura", "Mic error: " + (e && e.error ? e.error : "unknown"));
  };

  rec.onend = () => {
    recognizing = false;
    micBtn.textContent = "🎤";
    setStatus("");
  };

  rec.onresult = (e) => {
    let finalText = "";
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const txt = res[0] && res[0].transcript ? res[0].transcript : "";
      if (res.isFinal) finalText += txt;
      else interim += txt;
    }
    if (finalText) input.value += (input.value ? " " : "") + finalText.trim();
    // show interim in status
    if (interim) setStatus("Listening… " + interim.trim());
  };

  return rec;
}

recognition = initSpeech();
micBtn.onclick = async () => {
  if (!recognition) {
    bubble("aura", "Mic not supported in this browser.");
    return;
  }
  try {
    if (!recognizing) recognition.start();
    else recognition.stop();
  } catch (e) {
    bubble("aura", "Mic failed: " + (e && e.message ? e.message : String(e)));
  }
};

// boot
refreshHealth();
setInterval(refreshHealth, 8000);
input.focus();
</script>
</body>
</html>`);
    }

    // ---------- CORE FILE UPLOAD (public; stored in R2 if configured) ----------
    if (url.pathname === "/core/upload" && request.method === "POST") {
      // Accept multipart/form-data with "file"
      const ct = request.headers.get("content-type") || "";
      if (!ct.toLowerCase().includes("multipart/form-data")) {
        return jsonResponse(400, { ok: false, error: "expected_multipart_form_data" });
      }

      let form;
      try {
        form = await request.formData();
      } catch {
        return jsonResponse(400, { ok: false, error: "bad_form_data" });
      }

      const f = form.get("file");
      if (!(f instanceof File)) {
        return jsonResponse(400, { ok: false, error: "missing_file" });
      }

      const id = uid();
      const name = safeName(f.name);
      const type = (f.type || "application/octet-stream").slice(0, 120);
      const size = f.size || 0;

      const key = `core_uploads/${id}/${name}`;

      let stored = false;
      try {
        if (env?.AURA_UPLOADS) {
          await env.AURA_UPLOADS.put(key, await f.arrayBuffer(), {
            httpMetadata: { contentType: type },
            customMetadata: { name, type, size: String(size) }
          });
          stored = true;
        }
      } catch (e) {
        return jsonResponse(500, { ok: false, error: "r2_put_failed" });
      }

      // Optional KV pointer for later retrieval
      try {
        if (env?.AURA_KV) {
          await env.AURA_KV.put(`upload:${id}`, JSON.stringify({ id, key, name, type, size, stored }), { expirationTtl: 60 * 60 * 24 * 7 });
        }
      } catch (_) {
        // ignore
      }

      return jsonResponse(200, {
        ok: true,
        upload: { id, name, type, size, stored, key }
      });
    }

    // ---------- CORE COMMAND ----------
    if (url.pathname === "/core/command" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const text = (body && body.text ? String(body.text) : "").trim();
      const attachments = Array.isArray(body?.attachments) ? body.attachments : [];

      if (!text && (!attachments || !attachments.length)) {
        return jsonResponse(200, { reply: "I’m here." });
      }

      // Execution routing first (based on text only)
      if (detectExecutionContract(text)) {
        return jsonResponse(200, { reply: await executionReply(text, env) });
      }

      // If attachments included, acknowledge them explicitly (so you can test upload end-to-end)
      if (attachments && attachments.length) {
        const names = attachments.map(a => a && a.name ? a.name : a && a.id ? a.id : "file").join(", ");
        return jsonResponse(200, { reply: `Received ${attachments.length} attachment(s): ${names}\n\nNow tell me what to do with them.` });
      }

      // Fallback responder
      let reply = respond(text);
      if (looksLikeStructuredPrompt(text) && isTooGeneric(reply)) reply = identityCapabilitiesResponse();
      return jsonResponse(200, { reply });
    }

    // ---------- DIAGNOSTICS ----------
    if (url.pathname === "/health") {
      return jsonResponse(200, {
        ok: true,
        ui: "minimal_fixed",
        mode: "execution_router_v2_plus",
        wiring: wiringCheck(env)
      });
    }

    // ---------- CityGuide endpoints remain in other script versions; keep 404 here ----------
    return jsonResponse(404, { ok: false });
  }
};
