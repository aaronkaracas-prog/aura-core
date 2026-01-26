/**
 * Aura Core — single-file Cloudflare Worker
 * - /core: ChatGPT-style UI (same visuals)
 * - /core.js: UI logic (external JS so buttons always work)
 * - /chat: OpenAI Responses API (text + vision)
 * - /transcribe: OpenAI Whisper transcription
 *
 * FIXES (locked from your base):
 * 1) UI buttons dead: move UI logic to /core.js (no inline script)
 * 2) Composer overlap: update padding before scroll
 * 3) Mic: proper record->stop->await finalize->/transcribe->insert transcript (no auto-send)
 * 4) Upload: thumbnail preview + send with message (vision)
 * 5) Image generation: "create image ..." returns an assistant image that UI renders
 *
 * ADD (this round, functional wiring only; /core visuals unchanged):
 * 6) /malibu.city serves HTML (directory page)
 * 7) /malibu.city/api/places proxies Google Places using GOOGLE_PLACES_API_KEY (server-side)
 */

const VERSION = "AURA_CORE__2026-01-18__ONEFILE__CHATGPT_UI_LOCK_04__MALIBU_CITY_01__GATEFIX_03__DEPLOY_PAYLOAD_01";
const UI_BUILD = "AURA_UI_BUILD__2026-01-15__06";

const LS_THREADS_KEY = "aura_threads_v1";
const LS_ACTIVE_THREAD_KEY = "aura_active_thread_v1";

function safeJson(text) {
  const clean = (text || "").replace(/^\uFEFF+/, "").trim();
  if (!clean) return null;
  try {
    return JSON.parse(clean);
  } catch (e) {
    return { __parse_error: true, __raw: clean, __message: String(e && e.message ? e.message : e) };
  }
}
function safeStr(x) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function methodNotAllowed() {
  return json({ ok: false, error: "method_not_allowed" }, 405, withNoCacheHeaders());
}

async function readBodyJson(request) {
  try {
    const clone = request.clone();
    const t = await clone.text();
    const j = safeJson(t);
    return (j && typeof j === "object") ? j : {};
  } catch {
    return {};
  }
}

function pickModel(env) {
  const m = safeStr(env && (env.OPENAI_MODEL || env.AURA_MODEL));
  return m || "gpt-4.1-mini";
}
function pickApiKey(env) {
  const k = safeStr(env && (env.OPENAI_API_KEY || env.AURA_OPENAI_API_KEY));
  return k || "";
}

function withNoCacheHeaders(extra) {
  return Object.assign(
    {
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      pragma: "no-cache",
      expires: "0",
    },
    extra || {}
  );
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, headers || {}),
  });
}
function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: Object.assign({ "content-type": "text/html; charset=utf-8" }, headers || {}),
  });
}
function js(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: Object.assign({ "content-type": "application/javascript; charset=utf-8" }, headers || {}),
  });
}

function isImagePrompt(text) {
  const t = safeStr(text).trim().toLowerCase();
  if (!t) return false;
  return (
    t.startsWith("create image") ||
    t.startsWith("generate image") ||
    t.startsWith("make an image") ||
    t.startsWith("make image") ||
    t.startsWith("create an image")
  );
}
function extractImagePrompt(text) {
  const raw = safeStr(text).trim();
  if (!raw) return "";
  return raw.replace(/^(create|generate|make)\s+(an\s+)?image\s*(of\s*)?/i, "").trim() || raw;
}

/**
 * OpenAI Responses API (text-only or vision input via data URLs)
 */
async function openaiText(env, userText, imagesDataUrls) {
  const apiKey = pickApiKey(env);
  if (!apiKey) return { ok: false, error: "missing_api_key" };

  const model = pickModel(env);

  const userContent = [];
  userContent.push({ type: "input_text", text: safeStr(userText) });

  if (Array.isArray(imagesDataUrls) && imagesDataUrls.length) {
    for (const u of imagesDataUrls) {
      const url = safeStr(u).trim();
      if (!url) continue;
      userContent.push({ type: "input_image", image_url: url });
    }
  }

  const payload = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are Aura. Be concise. If user asks for JSON-only, return valid JSON only with no extra text. Never use code fences.",
          },
        ],
      },
      { role: "user", content: userContent },
    ],
  };

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await resp.text();
  if (!resp.ok) return { ok: false, error: "openai_error", status: resp.status, detail: safeJson(raw) || raw };

  let outText = "";
  try {
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (!item || !Array.isArray(item.content)) continue;
        for (const c of item.content) {
          if (!c) continue;
          if (c.type === "output_text" && typeof c.text === "string") outText += c.text;
          if (c.type === "text" && typeof c.text === "string") outText += c.text;
        }
      }
    }
    if (!outText && data && typeof data.output_text === "string") outText = data.output_text;
  } catch (_) {}

  outText = safeStr(outText).trim();
  if (!outText) outText = "[no_text_output]";
  return { ok: true, text: outText };
}

/**
 * OpenAI Image generation
 */
async function openaiImage(env, prompt) {
  const apiKey = pickApiKey(env);
  if (!apiKey) return { ok: false, error: "missing_api_key" };

  const p = safeStr(prompt).trim();
  if (!p) return { ok: false, error: "missing_prompt" };

  const payload = { model: "gpt-image-1", prompt: p, size: "1024x1024" };

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await resp.text();
  const j = safeJson(raw);

  if (!resp.ok) return { ok: false, error: "openai_image_error", status: resp.status, detail: j || raw };

  const b64 = j && j.data && j.data[0] && typeof j.data[0].b64_json === "string" ? j.data[0].b64_json : "";
  if (!b64) return { ok: false, error: "image_no_data", detail: j || raw };

  return { ok: true, data_url: "data:image/png;base64," + b64 };
}

async function handleChat(request, env) {
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return json({ ok: false, error: "bad_request", detail: "cannot_read_body" }, 400);
  }

  const body = safeJson(bodyText);
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, 400);

  const type = safeStr(body.type);
  if (type !== "text" && type !== "mixed") return json({ ok: false, error: "unsupported_type", got: type }, 400);

  const input = safeStr(body.input);
  if (!input) return json({ ok: false, error: "missing_input" }, 400);

  if (input.trim().toLowerCase() === "ping") return json({ ok: true, text: "pong" }, 200, withNoCacheHeaders());

  if (isImagePrompt(input)) {
    const prompt = extractImagePrompt(input);
    const img = await openaiImage(env, prompt);
    if (!img.ok) return json(img, 500, withNoCacheHeaders());
    return json(
      { ok: true, kind: "image", image_data_url: img.data_url, caption: "Image generated." },
      200,
      withNoCacheHeaders()
    );
  }

  const images = Array.isArray(body.images) ? body.images : [];
  const out = await openaiText(env, input, images);
  if (!out.ok) return json(out, 500, withNoCacheHeaders());

  return json({ ok: true, text: out.text }, 200, withNoCacheHeaders());
}

async function handleTranscribe(request, env) {
  const apiKey = pickApiKey(env);
  if (!apiKey) return json({ ok: false, error: "missing_api_key" }, 400);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "invalid_form_data" }, 400);
  }

  const file = form.get("file");
  if (!file) return json({ ok: false, error: "missing_file" }, 400);

  const out = new FormData();
  out.append("model", "whisper-1");
  out.append("file", file, "audio.webm");

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey },
    body: out,
  });

  const raw = await resp.text();
  if (!resp.ok) return json({ ok: false, error: "openai_error", status: resp.status, detail: safeJson(raw) }, 500);

  try {
    const j = JSON.parse(raw);
    const t = j && typeof j.text === "string" ? j.text : "";
    return json({ ok: true, text: safeStr(t) }, 200, withNoCacheHeaders());
  } catch {
    return json({ ok: true, text: safeStr(raw) }, 200, withNoCacheHeaders());
  }
}

/**
 * Malibu.city: Google Places proxy
 * Uses env.GOOGLE_PLACES_API_KEY (already set per your lock)
 */
async function handleMalibuPlaces(request, env) {
  const key = safeStr(env && env.GOOGLE_PLACES_API_KEY).trim();
  if (!key) return json({ ok: false, error: "missing_google_places_api_key" }, 500, withNoCacheHeaders());

  const url = new URL(request.url);

  // Defaults: Malibu, CA
  const defaultLat = "34.0259";
  const defaultLng = "-118.7798";

  const q = safeStr(url.searchParams.get("q")).trim();
  const mode = safeStr(url.searchParams.get("mode")).trim().toLowerCase() || (q ? "text" : "nearby");

  const radius = safeStr(url.searchParams.get("radius")).trim() || "25000";
  const type = safeStr(url.searchParams.get("type")).trim() || "restaurant";
  const lat = safeStr(url.searchParams.get("lat")).trim() || defaultLat;
  const lng = safeStr(url.searchParams.get("lng")).trim() || defaultLng;

  let endpoint = "";
  if (mode === "text") {
    const query = q || `${type} in Malibu CA`;
    endpoint =
      "https://maps.googleapis.com/maps/api/place/textsearch/json" +
      `?query=${encodeURIComponent(query)}` +
      `&key=${encodeURIComponent(key)}`;
  } else {
    endpoint =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json" +
      `?location=${encodeURIComponent(lat + "," + lng)}` +
      `&radius=${encodeURIComponent(radius)}` +
      `&type=${encodeURIComponent(type)}` +
      `&key=${encodeURIComponent(key)}`;
  }

  const resp = await fetch(endpoint, { method: "GET" });
  const raw = await resp.text();
  const data = safeJson(raw);

  if (!resp.ok) {
    return json(
      { ok: false, error: "google_places_error", status: resp.status, detail: data || raw },
      502,
      withNoCacheHeaders()
    );
  }

  // Keep response lean but usable
  const results = data && Array.isArray(data.results) ? data.results : [];
  const slim = results.map((r) => ({
    place_id: r.place_id,
    name: r.name,
    rating: r.rating,
    user_ratings_total: r.user_ratings_total,
    price_level: r.price_level,
    vicinity: r.vicinity,
    formatted_address: r.formatted_address,
    business_status: r.business_status,
    types: r.types,
    geometry: r.geometry,
    photos: r.photos,
  }));

  return json(
    {
      ok: true,
      source: "google_places",
      mode,
      query: q || null,
      type,
      radius: Number(radius) || radius,
      center: { lat: Number(lat) || lat, lng: Number(lng) || lng },
      results: slim,
    },
    200,
    withNoCacheHeaders()
  );
}

/**
 * Malibu.city HTML (separate from /core; does not change /core visuals)
 */
function renderMalibuCityUI() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Malibu.city</title>
<style>
:root{--bg:#ffffff;--muted:#6b7280;--line:#e5e7eb;--shadow:0 1px 0 rgba(0,0,0,.03);--pill:#f3f4f6;--blue:#2563eb;--blue2:#1d4ed8}
html,body{height:100%;margin:0;background:var(--bg);color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
a{color:inherit}
.wrap{max-width:980px;margin:0 auto;padding:18px 16px 40px 16px}
.top{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.brand{font-weight:800;font-size:18px}
.meta{color:var(--muted);font-size:12px}
.card{border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:var(--shadow);padding:12px 12px}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.input{flex:1;min-width:220px;border:1px solid var(--line);border-radius:14px;padding:10px 12px;font-size:14px;outline:none}
.btn{border:1px solid var(--line);background:#fff;border-radius:14px;padding:10px 12px;cursor:pointer;font-weight:650}
.btn.primary{background:var(--blue);border-color:var(--blue);color:#fff}
.btn.primary:hover{background:var(--blue2)}
.small{color:var(--muted);font-size:12px;margin-top:10px}
.list{margin-top:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.item{border:1px solid var(--line);border-radius:16px;background:#fff;box-shadow:var(--shadow);padding:12px}
.name{font-weight:800;margin:0 0 6px 0}
.addr{color:var(--muted);font-size:13px;line-height:1.35}
.badges{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
.badge{background:var(--pill);border:1px solid var(--line);border-radius:999px;padding:5px 9px;font-size:12px;color:#111827}
</style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="brand">Malibu.city</div>
      <div class="meta">Directory (live)</div>
      <div class="meta" style="margin-left:auto">Powered by Google Places</div>
    </div>

    <div class="card">
      <div class="row">
        <input class="input" id="q" placeholder="Search (e.g., restaurants, coffee, tacos, sushi)" />
        <button class="btn" id="restaurants">Restaurants</button>
        <button class="btn" id="coffee">Coffee</button>
        <button class="btn primary" id="search">Search</button>
      </div>
      <div class="small">Tip: this page calls <code>/malibu.city/api/places</code>. Key stays server-side.</div>
    </div>

    <div class="list" id="list"></div>
    <div class="small" id="status"></div>
  </div>

<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const list = $("list");
  const status = $("status");
  const q = $("q");

  function esc(s){ return (s||"").toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function load(query){
    status.textContent = "Loading...";
    list.innerHTML = "";
    const url = "/malibu.city/api/places?mode=text&q=" + encodeURIComponent(query || "restaurants in Malibu CA");
    const resp = await fetch(url);
    const j = await resp.json().catch(() => null);
    if (!resp.ok || !j || !j.ok) {
      status.textContent = "Error loading places.";
      return;
    }
    const items = j.results || [];
    status.textContent = items.length ? (items.length + " results") : "No results.";
    list.innerHTML = items.map(r => {
      const name = esc(r.name || "");
      const addr = esc(r.formatted_address || r.vicinity || "");
      const rating = (r.rating != null) ? ("⭐ " + r.rating) : "";
      const total = (r.user_ratings_total != null) ? ("(" + r.user_ratings_total + ")") : "";
      const price = (r.price_level != null) ? ("$".repeat(Math.max(1, Math.min(4, r.price_level+1)))) : "";
      return (
        '<div class="item">' +
          '<div class="name">' + name + '</div>' +
          '<div class="addr">' + addr + '</div>' +
          '<div class="badges">' +
            (rating ? '<span class="badge">' + rating + " " + total + '</span>' : "") +
            (price ? '<span class="badge">' + price + '</span>' : "") +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  $("search").addEventListener("click", () => load((q.value||"").trim() || "restaurants in Malibu CA"));
  $("restaurants").addEventListener("click", () => { q.value="restaurants in Malibu CA"; load(q.value); });
  $("coffee").addEventListener("click", () => { q.value="coffee in Malibu CA"; load(q.value); });

  q.addEventListener("keydown", (e) => {
    if (e.key === "Enter") load((q.value||"").trim());
  });

  load("restaurants in Malibu CA");
})();
</script>
</body>
</html>`;
}

/**
 * UI HTML: same visuals, but loads external /core.js
 */
function renderUI() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Aura</title>
<style>
:root{--bg:#ffffff;--muted:#6b7280;--muted2:#9ca3af;--line:#e5e7eb;--pill:#f3f4f6;--shadow:0 1px 0 rgba(0,0,0,.03);--ring:0 0 0 3px rgba(59,130,246,.18);--blue:#2563eb;--blue2:#1d4ed8}
html,body{height:100%;margin:0;background:var(--bg);color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji"}
a{color:inherit}
.app{display:flex;height:100%}
.side{width:280px;border-right:1px solid var(--line);background:#fbfbfc;display:flex;flex-direction:column}
.sideTop{padding:14px 14px 10px 14px}
.brand{display:flex;align-items:center;gap:10px;font-weight:650}
.brandName{font-size:16px}
.online{display:flex;align-items:center;gap:6px;color:var(--muted);font-weight:500;font-size:12px;margin-left:auto}
.dot{width:8px;height:8px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,.15)}
.butter{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;opacity:.9}
.butter svg{width:18px;height:18px;display:block;fill:#111827}
.sideRow{display:flex;align-items:center;gap:10px}
.sideBtn{display:flex;align-items:center;gap:10px;width:100%;padding:10px 10px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:var(--shadow);cursor:pointer}
.plus{width:18px;height:18px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:var(--pill);border:1px solid var(--line);font-weight:700}
.sideBtn span{font-size:14px}
.projects{padding:8px 6px 12px 6px;border-top:1px solid var(--line)}
.secTitle{padding:8px 10px;color:var(--muted);font-size:12px;font-weight:650;text-transform:uppercase;letter-spacing:.05em}
.item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;cursor:pointer}
.item:hover{background:rgba(0,0,0,.04)}
.item.active{background:rgba(37,99,235,.10)}
.ico{width:18px;height:18px;border-radius:6px;background:rgba(0,0,0,.06);display:inline-flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px}
.label{flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.main{flex:1;display:flex;flex-direction:column;min-width:0}
.topbar{height:54px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;padding:0 16px;background:#fff}
.topbarTitle{font-weight:650}
.meta{color:var(--muted);font-size:12px}
.chat{flex:1;overflow:auto;padding:22px 18px 170px 18px}
.wrap{max-width:860px;margin:0 auto}
.empty{min-height:55vh;display:flex;align-items:center;justify-content:center}
.empty h1{font-size:30px;font-weight:650;margin:0;color:#111827}
.msg{display:flex;gap:12px;margin:0 0 14px 0}
.avatar{width:32px;height:32px;border-radius:10px;background:rgba(37,99,235,.08);display:flex;align-items:center;justify-content:center;color:#1d4ed8;font-weight:800}
.bubble{flex:1;min-width:0}
.role{font-weight:650;margin-bottom:6px}
.text{white-space:pre-wrap;line-height:1.45;color:#111827}
.user .avatar{background:rgba(0,0,0,.06);color:#111827}
.imgMsg{margin-top:8px}
.imgMsg img{max-width:100%;border-radius:14px;border:1px solid var(--line);display:block;box-shadow:var(--shadow)}
.imgCap{color:var(--muted);font-size:12px;margin-top:8px}
.composerWrap{position:fixed;left:280px;right:0;bottom:0;padding:14px 16px 16px 16px;background:linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,.98) 70%, rgba(255,255,255,0));}
@media (max-width:920px){ .side{width:260px} .composerWrap{left:260px} }
@media (max-width:720px){ .side{display:none} .composerWrap{left:0} }
.composer{max-width:860px;margin:0 auto}
.thumbs{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px 2px}
.thumb{width:84px;height:84px;border-radius:14px;border:1px solid var(--line);background:#fff;overflow:hidden;position:relative;box-shadow:var(--shadow)}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.thumb .x{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;cursor:pointer;font-weight:900;color:#111827}
.box{display:flex;align-items:flex-end;gap:10px;border:1px solid var(--line);background:#fff;border-radius:18px;padding:10px 12px;box-shadow:var(--shadow)}
.btn{width:36px;height:36px;border-radius:12px;border:1px solid var(--line);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
.btn:hover{background:rgba(0,0,0,.03)}
.btn:active{transform:translateY(1px)}
.input{flex:1;min-height:24px;max-height:160px;resize:none;border:0;outline:0;font-size:14px;line-height:1.45;padding:7px 0;color:#111827}
.send{background:var(--blue);border-color:var(--blue);color:#fff}
.send:hover{background:var(--blue2)}
.status{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px;margin:10px 4px 0 4px}
.kbd{margin-left:auto;color:var(--muted2);font-size:12px}
.micBtn.rec{border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.10)}
.squig{display:none;align-items:center;gap:3px;margin-left:6px;margin-right:6px;height:20px}
.squig.on{display:flex}
.sq{width:3px;height:10px;border-radius:999px;background:rgba(0,0,0,.45);animation:sq 1.0s infinite ease-in-out}
.sq:nth-child(2){animation-delay:.12s} .sq:nth-child(3){animation-delay:.24s} .sq:nth-child(4){animation-delay:.36s} .sq:nth-child(5){animation-delay:.48s} .sq:nth-child(6){animation-delay:.60s}
@keyframes sq{0%,100%{transform:scaleY(.55)} 50%{transform:scaleY(1.45)}}
.menu{position:absolute;bottom:64px;left:10px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.10);padding:6px;display:none;min-width:220px}
.menu.on{display:block}
.menuItem{display:flex;gap:10px;align-items:center;padding:10px;border-radius:12px;cursor:pointer}
.menuItem:hover{background:rgba(0,0,0,.04)}
.menuItem .mi{width:20px;height:20px;border-radius:8px;background:rgba(0,0,0,.06);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted)}
.menuItem .mt{font-size:13px}
.menuItem .ms{font-size:12px;color:var(--muted);margin-top:2px}
.menuText{display:flex;flex-direction:column}
.stopBtn{display:none;border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.10)}
.stopBtn.on{display:flex}
</style>
</head>
<body>
<div class="app">
  <div class="side">
    <div class="sideTop">
      <div class="brand">
        <div class="sideRow" style="width:100%">
          <div class="brandName">Aura</div>
          <div class="butter" aria-hidden="true" title="Aura">
            <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true"><path d="M12 12c-1.7 2.4-4.6 4.8-7.3 4.8C2 16.8 1 14.8 1 12.3 1 9 2.6 6.4 5.1 6.4c2.2 0 4.7 2.1 6.9 5.6zm0 0c1.7 2.4 4.6 4.8 7.3 4.8 2.7 0 3.7-2 3.7-4.5 0-3.3-1.6-5.9-4.1-5.9-2.2 0-4.7 2.1-6.9 5.6zM12 12c-1.2-3.8-1.1-7.8 1-9.4.9-.7 2.1-.6 2.6.4.8 1.7-.3 4.5-3.6 9zM12 12c1.2-3.8 1.1-7.8-1-9.4-.9-.7-2.1-.6-2.6.4-.8 1.7.3 4.5 3.6 9z"/></svg>
          </div>
          <div class="online"><span class="dot"></span><span id="statusText">Online</span></div>
        </div>
      </div>
      <div style="height:10px"></div>
      <button class="sideBtn" id="newChatBtn"><span class="plus">+</span><span>New chat</span></button>
    </div>

    <div class="projects">
      <div class="secTitle">Projects</div>
      <div id="projectList"></div>
      <div class="secTitle" style="margin-top:8px">Chats</div>
      <div id="threadList"></div>
    </div>
  </div>

  <div class="main">
    <div class="topbar"><div class="topbarTitle">Aura</div><div class="meta">| ${UI_BUILD}</div></div>
    <div class="chat" id="chat"><div class="wrap">
      <div class="empty" id="empty"><h1>Ask anything</h1></div>
      <div id="msgs"></div>
    </div></div>

    <div class="composerWrap" id="composerWrap">
      <div class="composer">
        <div class="thumbs" id="thumbs"></div>

        <div class="box">
          <div style="position:relative">
            <button class="btn" id="plusBtn" title="Attach">+</button>
            <div class="menu" id="plusMenu">
              <div class="menuItem" id="menuUpload"><div class="mi">🖼</div>
                <div class="menuText"><div class="mt">Upload image</div><div class="ms">Attach and send</div></div>
              </div>
            </div>
          </div>

          <textarea class="input" id="input" rows="1" placeholder="Ask anything"></textarea>

          <div class="squig" id="squig" aria-hidden="true">
            <div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div>
          </div>

          <button class="btn stopBtn" id="stopBtn" title="Stop">■</button>
          <button class="btn micBtn" id="micBtn" title="Voice">🎤</button>
          <button class="btn send" id="sendBtn" title="Send">➤</button>

          <input type="file" id="fileInput" accept="image/*" style="display:none" />
        </div>

        <div class="status"><span>+</span><span id="hint">Ask anything</span><span class="kbd">Enter to send • Shift+Enter new line</span></div>
      </div>
    </div>
  </div>
</div>

<script src="/core.js?v=${encodeURIComponent(UI_BUILD)}"></script>
</body>
</html>`;
}

/**
 * External UI logic: this is what makes buttons work
 */
function renderCoreJs() {
  return `(() => {
  "use strict";

  const LS_THREADS_KEY = ${JSON.stringify(LS_THREADS_KEY)};
  const LS_ACTIVE_THREAD_KEY = ${JSON.stringify(LS_ACTIVE_THREAD_KEY)};
  const UI_BUILD = ${JSON.stringify(UI_BUILD)};
  const threadStoreKey = (id) => "aura_thread_" + id;

  const elChat = document.getElementById("chat");
  const elMsgs = document.getElementById("msgs");
  const elEmpty = document.getElementById("empty");
  const elInput = document.getElementById("input");
  const elSend = document.getElementById("sendBtn");
  const elPlus = document.getElementById("plusBtn");
  const elMenu = document.getElementById("plusMenu");
  const elMenuUpload = document.getElementById("menuUpload");
  const elFile = document.getElementById("fileInput");
  const elThumbs = document.getElementById("thumbs");
  const elThreadList = document.getElementById("threadList");
  const elProjectList = document.getElementById("projectList");
  const elNewChatBtn = document.getElementById("newChatBtn");
  const elStatusText = document.getElementById("statusText");
  const elHint = document.getElementById("hint");
  const elMicBtn = document.getElementById("micBtn");
  const elStopBtn = document.getElementById("stopBtn");
  const elSquig = document.getElementById("squig");

  // If any required element is missing, stop silently with a visible hint.
  const required = [elChat, elMsgs, elEmpty, elInput, elSend, elPlus, elMenu, elMenuUpload, elFile, elThumbs, elThreadList, elProjectList, elNewChatBtn, elStatusText, elHint, elMicBtn, elStopBtn, elSquig];
  if (required.some(x => !x)) {
    const m = document.createElement("div");
    m.style.position = "fixed";
    m.style.bottom = "12px";
    m.style.left = "12px";
    m.style.padding = "10px 12px";
    m.style.border = "1px solid #e5e7eb";
    m.style.borderRadius = "12px";
    m.style.background = "white";
    m.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
    m.style.fontSize = "12px";
    m.textContent = "UI error: missing DOM elements. Reload.";
    document.body.appendChild(m);
    return;
  }

  let attachments = [];
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let stopPromiseResolve = null;

  function setStatus(t){ elStatusText.textContent = t; }
  function setHint(t){ elHint.textContent = t; }

  function makeId(){ return "t_" + Math.random().toString(16).slice(2) + Date.now().toString(16); }

  function loadThreads(){
    try { return JSON.parse(localStorage.getItem(LS_THREADS_KEY) || "[]") || []; } catch { return []; }
  }
  function saveThreads(list){ localStorage.setItem(LS_THREADS_KEY, JSON.stringify(list || [])); }
  function getActiveThread(){ return localStorage.getItem(LS_ACTIVE_THREAD_KEY) || ""; }
  function setActiveThread(id){ localStorage.setItem(LS_ACTIVE_THREAD_KEY, id); }

  function loadMessages(id){
    try { return JSON.parse(localStorage.getItem(threadStoreKey(id)) || "[]") || []; } catch { return []; }
  }
  function saveMessages(id, msgs){ localStorage.setItem(threadStoreKey(id), JSON.stringify(msgs || [])); }

  function ensureThread(){
    let id = getActiveThread();
    const threads = loadThreads();
    if (!id || !threads.find(t => t.id === id)) {
      id = makeId();
      threads.unshift({ id, title: "New chat" });
      saveThreads(threads);
      setActiveThread(id);
    }
    return id;
  }

  function scrollToBottom(){ try { elChat.scrollTop = elChat.scrollHeight; } catch {} }

  function updateChatPad(){
    try {
      const cw = document.getElementById("composerWrap");
      if (!cw) return;
      const pad = cw.offsetHeight + 24;
      elChat.style.paddingBottom = pad + "px";
    } catch {}
  }

  function renderThreads(){
    const threads = loadThreads();
    const active = getActiveThread();
    elThreadList.innerHTML = "";
    threads.forEach((t) => {
      const d = document.createElement("div");
      d.className = "item" + (t.id === active ? " active" : "");
      d.innerHTML = '<div class="ico">💬</div><div class="label"></div>';
      d.querySelector(".label").textContent = t.title || "Chat";
      d.addEventListener("click", () => { setActiveThread(t.id); renderThreads(); renderChat(); });
      elThreadList.appendChild(d);
    });
  }

  function renderProjects(){
    const projects = ["Aura Core", "Malibu.city", "FrontDesk.Network"];
    elProjectList.innerHTML = "";
    projects.forEach((p) => {
      const d = document.createElement("div");
      d.className = "item";
      d.innerHTML = '<div class="ico">🏷</div><div class="label"></div>';
      d.querySelector(".label").textContent = p;
      elProjectList.appendChild(d);
    });
  }

  function renderChat(){
    const id = ensureThread();
    const msgs = loadMessages(id);
    elMsgs.innerHTML = "";
    elEmpty.style.display = msgs.length ? "none" : "flex";

    msgs.forEach((m) => {
      const row = document.createElement("div");
      row.className = "msg " + (m.role === "user" ? "user" : "assistant");

      const av = document.createElement("div");
      av.className = "avatar";
      av.textContent = (m.role === "user") ? "Y" : "A";

      const b = document.createElement("div");
      b.className = "bubble";

      const r = document.createElement("div");
      r.className = "role";
      r.textContent = (m.role === "user") ? "You" : "Aura";

      const t = document.createElement("div");
      t.className = "text";
      t.textContent = m.text || "";

      b.appendChild(r); b.appendChild(t);

      if (m && m.imageDataUrl) {
        const wrap = document.createElement("div");
        wrap.className = "imgMsg";
        const img = document.createElement("img");
        img.src = m.imageDataUrl;
        wrap.appendChild(img);
        if (m.caption) { const cap = document.createElement("div"); cap.className = "imgCap"; cap.textContent = m.caption; wrap.appendChild(cap); }
        b.appendChild(wrap);
      }

      row.appendChild(av); row.appendChild(b);
      elMsgs.appendChild(row);
    });

    // FIX: pad FIRST, then scroll
    updateChatPad();
    scrollToBottom();
  }

  function renderThumbs(){
    elThumbs.innerHTML = "";
    attachments.forEach((a, idx) => {
      const d = document.createElement("div");
      d.className = "thumb";

      const img = document.createElement("img");
      img.src = a.dataUrl;

      const x = document.createElement("div");
      x.className = "x";
      x.textContent = "×";
      x.addEventListener("click", () => { attachments.splice(idx, 1); renderThumbs(); autoGrow(); updateChatPad(); });

      d.appendChild(img); d.appendChild(x);
      elThumbs.appendChild(d);
    });
    updateChatPad();
  }

  function autoGrow(){
    elInput.style.height = "0px";
    const hgt = Math.min(160, Math.max(24, elInput.scrollHeight));
    elInput.style.height = hgt + "px";
    updateChatPad();
  }

  function closeMenu(){ elMenu.classList.remove("on"); }
  function toggleMenu(){ elMenu.classList.toggle("on"); }

  document.addEventListener("click", (e) => {
    if (!elMenu.contains(e.target) && !elPlus.contains(e.target)) closeMenu();
  });

  elPlus.addEventListener("click", (e) => { e.preventDefault(); toggleMenu(); });
  elMenuUpload.addEventListener("click", () => { closeMenu(); elFile.click(); });

  elFile.addEventListener("change", (e) => {
    const f = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
    if (!f) return;

    const r = new FileReader();
    r.onload = function(){
      attachments.push({ name: f.name, type: f.type, dataUrl: r.result });
      renderThumbs();
    };
    r.readAsDataURL(f);
    elFile.value = "";
  });

  async function sendMessage(txt){
    const id = ensureThread();
    const msgs = loadMessages(id);
    const outgoingImages = attachments.map(a => a.dataUrl).filter(Boolean);

    msgs.push({ role: "user", text: txt, images: outgoingImages });
    saveMessages(id, msgs);
    renderChat();
    setHint("Aura is thinking...");

    const payload = outgoingImages.length ? { type:"mixed", input: txt, images: outgoingImages } : { type:"text", input: txt };
    attachments = [];
    renderThumbs();

    try {
      const resp = await fetch("/chat", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload) });
      const j = await resp.json();

      if (!j || !j.ok) {
        msgs.push({ role:"assistant", text: "[error] " + (j && j.error ? j.error : "unknown") });
      } else if (j.kind === "image" && j.image_data_url) {
        msgs.push({ role:"assistant", text: "", imageDataUrl: j.image_data_url, caption: j.caption || "" });
      } else {
        msgs.push({ role:"assistant", text: j.text });
      }

      saveMessages(id, msgs);
      renderChat();
    } catch {
      msgs.push({ role:"assistant", text: "[network_error]" });
      saveMessages(id, msgs);
      renderChat();
    } finally {
      setHint("Ask anything");
    }
  }

  elSend.addEventListener("click", () => {
    const v = (elInput.value || "").trim();
    if (!v && attachments.length === 0) return;
    const txt = v || " ";
    elInput.value = ""; autoGrow();
    sendMessage(txt);
  });

  elInput.addEventListener("input", autoGrow);

  elInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const v = (elInput.value || "").trim();
      if (!v && attachments.length === 0) return;
      const txt = v || " ";
      elInput.value = ""; autoGrow();
      sendMessage(txt);
    }
  });

  // Voice: record -> stop -> await recorder stop -> /transcribe -> insert transcript (no auto-send)
  async function transcribeAudio(blob, mimeType){
    const fd = new FormData();
    const filename = (mimeType && mimeType.includes("mp4")) ? "audio.m4a" : "audio.webm";
    fd.append("file", blob, filename);
    const resp = await fetch("/transcribe", { method: "POST", body: fd });
    let j = null;
    try { j = await resp.json(); } catch {}
    if (resp.ok && j && j.ok && typeof j.text === "string") return j.text;
    const msg = (j && j.error) ? j.error : ("http_" + resp.status);
    throw new Error(msg);
  }

  function waitForStop(){
    return new Promise((resolve) => { stopPromiseResolve = resolve; });
  }

  async function startRecording(){
    if (isRecording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { alert("Mic not supported."); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    recordedChunks = [];
    stopPromiseResolve = null;

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (ev) => { if (ev && ev.data && ev.data.size > 0) recordedChunks.push(ev.data); };
    mediaRecorder.onstop = () => {
      try { stream.getTracks().forEach((t) => t.stop()); } catch {}
      if (typeof stopPromiseResolve === "function") { const r = stopPromiseResolve; stopPromiseResolve = null; r(); }
    };

    mediaRecorder.start();
    isRecording = true;
    elSquig.classList.add("on");
    elStopBtn.classList.add("on");
    elMicBtn.classList.add("rec");
    elSend.style.display = "none";
    setStatus("Listening...");
    updateChatPad();
  }

  async function stopRecording(){
    if (!isRecording) return;
    isRecording = false;

    elSquig.classList.remove("on");
    elStopBtn.classList.remove("on");
    elMicBtn.classList.remove("rec");
    elSend.style.display = "flex";
    setStatus("Transcribing...");
    updateChatPad();

    const waiter = waitForStop();
    try { mediaRecorder.requestData && mediaRecorder.requestData(); } catch {}
    try { mediaRecorder.stop(); } catch {}
    try { await waiter; } catch {}

    const mimeType = (recordedChunks && recordedChunks[0] && recordedChunks[0].type) ? recordedChunks[0].type : "audio/webm";
    const blob = new Blob(recordedChunks || [], { type: mimeType || "audio/webm" });

    try {
      if (!blob || !blob.size) throw new Error("empty_audio");
      const txt = await transcribeAudio(blob, mimeType);
      const cleaned = (txt || "").trim();
      if (cleaned) elInput.value = cleaned;
    } catch {
      if (!(elInput.value || "").trim()) elInput.value = "[voice captured]";
    }

    autoGrow();
    setStatus("Online");
    elInput.focus();
  }

  elMicBtn.addEventListener("click", () => {
    if (isRecording) stopRecording();
    else startRecording().catch((e) => alert("Mic error: " + (e && e.message ? e.message : e)));
  });
  elStopBtn.addEventListener("click", () => { stopRecording(); });

  elNewChatBtn.addEventListener("click", () => {
    const id = makeId();
    const threads = loadThreads();
    threads.unshift({ id, title: UI_BUILD });
    saveThreads(threads);
    setActiveThread(id);
    localStorage.removeItem(threadStoreKey(id));
    renderThreads();
    renderChat();
  });

  window.addEventListener("resize", updateChatPad);

  ensureThread();
  renderThreads();
  renderProjects();
  renderChat();
  autoGrow();
  updateChatPad();
})();`;
}

function extractProvidedAuthToken(request) {
  // Accept multiple header styles to reduce friction across tools
  const auth = (request.headers.get("authorization") || request.headers.get("Authorization") || "").trim();
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) return String(m[1]).trim();
  }

  const fallbacks = [
    request.headers.get("x-core-pass"),
    request.headers.get("X-Core-Pass"),
    request.headers.get("x-admin-token"),
    request.headers.get("X-Admin-Token"),
    request.headers.get("x-operator-token"),
    request.headers.get("X-Operator-Token"),
  ];

  for (const raw of fallbacks) {
    const s = String(raw || "").trim();
    if (!s) continue;
    const m = s.match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) return String(m[1]).trim();
    return s; // raw token
  }
  return "";
}

function isOperatorRequest(request, env) {
  const provided = extractProvidedAuthToken(request);
  if (!provided) return false;

  const adminToken = (env && env.AURA_ADMIN_TOKEN) ? String(env.AURA_ADMIN_TOKEN).trim() : "";
  const operatorToken = (env && env.AURA_OPERATOR_TOKEN) ? String(env.AURA_OPERATOR_TOKEN).trim() : "";

  if (adminToken && provided === adminToken) return true;
  if (operatorToken && provided === operatorToken) return true;
  return false;
}


export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Protect privileged prefixes (fallback gate)
      if (
        path.startsWith("/admin") ||
        path.startsWith("/operator") ||
        path.startsWith("/ops") ||
        path.startsWith("/internal") ||
        path.startsWith("/deployer") ||
        path.startsWith("/secrets")
      ) {
        const ok = isOperatorRequest(request, env);
        if (!ok) return json({ ok: false, error: "unauthorized" }, 401, withNoCacheHeaders());
      }

      // UI (UNCHANGED visuals)
      if (path === "/" || path === "/core") {
        return html(renderUI(), 200, withNoCacheHeaders());
      }
      if (path === "/core.js") {
        return js(renderCoreJs(), 200, withNoCacheHeaders());
      }

      // Health/version
      if (path === "/health") {
        return json({ ok: true, service: "aura-core", ui_build: UI_BUILD, version: VERSION }, 200, withNoCacheHeaders());
      }
      if (path === "/version") {
        return json({ ok: true, service: "aura-core", ui_build: UI_BUILD, version: VERSION }, 200, withNoCacheHeaders());
      }
      // Admin (operator only)
      if (request.method === "GET" && path === "/admin/selftest") {
        return json({ ok: true, admin: true, ui_build: UI_BUILD, version: VERSION }, 200, withNoCacheHeaders());
      }
      if (request.method === "GET" && path === "/admin/capabilities") {
        return json({
          ok: true,
          ui_build: UI_BUILD,
          version: VERSION,
          capabilities: {
            operator_gate: true,
            admin_routes: true,
            self_deploy: true,
            deployer_call: true,
            payload_gen: true,
            kv: !!(env && (env.AURA_MEM || env.AURA_KV)),
            r2: !!(env && env.AURA_UPLOADS),
            openai: !!(env && (env.OPENAI_API_KEY || env.AURA_OPENAI_API_KEY)),
            google_places_proxy: !!(env && env.GOOGLE_PLACES_API_KEY)
          }
        }, 200, withNoCacheHeaders());
      }
      if (path === "/admin/self-deploy-staging") {
        return json({ ok: false, error: "not_enabled" }, 501, withNoCacheHeaders());
      }

      // Self-deploy (Aura Core -> aura-deployer via service binding)
      if (path === "/admin/self_deploy/prepare") {
        if (request.method !== "POST") return methodNotAllowed();
        if (!env?.AURA_DEPLOYER) return json({ ok: false, error: "missing_deployer_binding" }, 500, withNoCacheHeaders());
        if (!env?.DEPLOY_SECRET) return json({ ok: false, error: "missing_DEPLOY_SECRET" }, 500, withNoCacheHeaders());
        return json({ ok: true }, 200, withNoCacheHeaders());
      }

      if (path === "/admin/self_deploy/commit") {
        if (request.method !== "POST") return methodNotAllowed();
        if (!env?.AURA_DEPLOYER) return json({ ok: false, error: "missing_deployer_binding" }, 500, withNoCacheHeaders());
        if (!env?.DEPLOY_SECRET) return json({ ok: false, error: "missing_DEPLOY_SECRET" }, 500, withNoCacheHeaders());

        const body = await readBodyJson(request);
        const script_name = String(body?.script_name || "aura-core-staging");
        const bundle_b64 = String(body?.bundle_b64 || "");
        if (!bundle_b64) return json({ ok: false, error: "missing_required_fields", required: ["bundle_b64"], got: Object.keys(body || {}) }, 400, withNoCacheHeaders());

        // Deployer payload compatibility: send redundant field names to match deployer expectations.
        // (Some deployer builds historically used different keys.)
        const deployPayload = {
          script_name,
          scriptName: script_name,
          name: script_name,
          bundle_b64,
          bundleB64: bundle_b64,
          bundle: bundle_b64,
        };

        const upstream = await env.AURA_DEPLOYER.fetch("https://aura-deployer/deploy", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "accept": "application/json",
            // Support both header styles
            "x-deploy-key": String(env.DEPLOY_SECRET),
            "authorization": "Bearer " + String(env.DEPLOY_SECRET)
          },
          body: JSON.stringify(deployPayload)
        });

        const txt = await upstream.text();
        let js = null;
        try { js = JSON.parse(txt); } catch {}
        return json({ ok: true, upstream_status: upstream.status, upstream: js || { raw: txt } }, 200, withNoCacheHeaders());
      }

      // Deployer health (via service binding)
      if (request.method === "GET" && path === "/admin/deployer/health") {
        if (!env?.AURA_DEPLOYER) return json({ ok: false, error: "missing_deployer_binding" }, 500, withNoCacheHeaders());

        const r = await env.AURA_DEPLOYER.fetch("https://aura-deployer/health", {
          method: "GET",
          headers: {
            "accept": "application/json",
            "cache-control": "no-store",
            "pragma": "no-cache",
            "x-deploy-key": String(env.DEPLOY_SECRET || "")
          },
          redirect: "follow"
        });

        const t = await r.text();

        const h = {};
        try {
          for (const [k, v] of r.headers.entries()) {
            const lk = String(k || "").toLowerCase();
            if (lk === "content-type" || lk === "cf-ray" || lk === "server" || lk === "cache-control") {
              h[lk] = v;
            }
          }
        } catch {}

        let j = null;
        try { j = JSON.parse(t); } catch { j = null; }

        return json({ ok: true, upstream: "service_binding:AURA_DEPLOYER:/health", status: r.status, headers: h, json: j, raw: j ? null : t }, 200, withNoCacheHeaders());
      }

// Malibu.city (NEW)
      if (request.method === "GET" && (path === "/malibu.city" || path === "/malibu.city/")) {
        return html(renderMalibuCityUI(), 200, withNoCacheHeaders());
      }
      if (request.method === "GET" && path === "/malibu.city/api/places") {
        return await handleMalibuPlaces(request, env);
      }

      // MalibuCity alias (public) — keep existing behavior
      if (request.method === "GET" && (path === "/MalibuCity" || path === "/malibucity")) {
        return new Response(null, { status: 302, headers: withNoCacheHeaders({ location: "https://malibu.city" }) });
      }

      // APIs
      if (path === "/transcribe") {
        if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
        return await handleTranscribe(request, env);
      }
      if (path === "/chat") {
        if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
        return await handleChat(request, env);
      }

      
  // DIAGNOSTIC ROUTE — TEMPORARY
  if (path === "/__admin_gate_debug") {
    const headersSeen = {};
    try {
      for (const [k, v] of request.headers.entries()) headersSeen[k] = v;
    } catch {}
    return json({
      ok: true,
      diagnostic: true,
      path,
      has_env: {
        AURA_ADMIN_TOKEN: !!(env && env.AURA_ADMIN_TOKEN),
        AURA_OPERATOR_TOKEN: !!(env && env.AURA_OPERATOR_TOKEN),
        AURA_DEPLOYER: !!(env && env.AURA_DEPLOYER),
        AURA_KV: !!(env && env.AURA_KV)
      },
      headers_seen: {
        authorization: request.headers.get("authorization"),
        x_core_pass: request.headers.get("x-core-pass"),
        x_deploy_key: request.headers.get("x-deploy-key")
      },
      note: "TEMP diagnostic route. Remove after use."
    });
  }

return json({ ok: false, error: "not_found", path }, 404);
    } catch (e) {
      return json({ ok: false, error: "unhandled_exception", detail: String(e && e.message ? e.message : e) }, 500);
    }
  },
};




