/**
 * aura-core — Cloudflare Worker (single-file)
 *
 * FILE: C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
 *
 * Guarantees:
 * - Keeps /core, /chat, /image, /__version working
 * - Adds generic self-publishing sites: GET /site/<slug>
 * - Adds legacy convenience route: GET /malibu -> /site/malibu
 * - Adds protected admin endpoints (X-Core-Pass must equal CORE_PASS secret):
 *     POST /admin/ui
 *     POST /admin/ui/reset
 *     POST /admin/dir/seed
 *     POST /admin/dir/get
 *     POST /admin/site/set
 *     POST /admin/site/reset
 *     POST /admin/site/list
 *
 * Storage:
 * - Uses ONE KV binding: env.AURA_KV
 * - Keys:
 *     AURA_CORE_UI              (HTML string override for /core)
 *     AURA_DIRECTORY            (directory JSON)
 *     SITE_HTML:<slug>          (HTML string for /site/<slug>)
 *
 * Notes:
 * - This file does NOT redesign /core beyond a minimal, clickable, functional UI
 *   with typing + upload (+) + mic button placeholder, and image rendering.
 * - If you already have OpenAI wired, set env.OPENAI_API_KEY and optional models:
 *     env.CHAT_MODEL (default: "gpt-4.1-mini")
 *     env.IMAGE_MODEL (default: "gpt-image-1")
 */

const VERSION = "aura-core-2026-01-13";
const BUILD_ID = "site-publisher-v1";
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function text(str, status = 200, extraHeaders = {}) {
  return new Response(str, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...extraHeaders },
  });
}

function html(str, status = 200, extraHeaders = {}) {
  return new Response(str, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...extraHeaders },
  });
}

function badRequest(msg = "bad_request", detail) {
  return json({ ok: false, error: msg, detail }, 400);
}

function unauthorized(msg = "unauthorized") {
  return json({ ok: false, error: msg }, 401);
}

function notFound() {
  return text("Not found", 404);
}

function methodNotAllowed() {
  return text("Method Not Allowed", 405);
}

function getHeader(request, name) {
  return request.headers.get(name) || request.headers.get(name.toLowerCase()) || "";
}

function safeSlug(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  if (!s) return null;
  // keep it sane
  if (s.length > 80) return s.slice(0, 80);
  return s;
}

async function readBodyText(request) {
  // Works for text/plain, text/html, application/json (raw)
  return await request.text();
}

async function readBodyJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

function requireAdmin(request, env) {
  const pass = getHeader(request, "X-Core-Pass");
  if (!env || typeof env.CORE_PASS !== "string" || !env.CORE_PASS) return false;
  return pass && pass === env.CORE_PASS;
}

async function kvGet(env, key) {
  if (!env?.AURA_KV) throw new Error("missing_kv_binding_AURA_KV");
  return await env.AURA_KV.get(key);
}

async function kvPut(env, key, value) {
  if (!env?.AURA_KV) throw new Error("missing_kv_binding_AURA_KV");
  await env.AURA_KV.put(key, value);
}

async function kvDel(env, key) {
  if (!env?.AURA_KV) throw new Error("missing_kv_binding_AURA_KV");
  await env.AURA_KV.delete(key);
}

function defaultCoreUI() {
  // Minimal, clickable, self-contained.
  // Keeps typing + upload (+) + mic button placeholder + image rendering.
  // Does NOT attempt to embed any city guide here.
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Aura Core</title>
  <style>
    :root { --bg:#0b0f14; --panel:#0f1620; --muted:#8aa0b5; --text:#e8f0f7; --line:rgba(255,255,255,.10); }
    html,body{height:100%; margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}
    .wrap{height:100%; display:flex;}
    .left{width:260px; border-right:1px solid var(--line); background:linear-gradient(180deg,#0e1621,#0b0f14); padding:14px; box-sizing:border-box;}
    .brand{font-weight:800; letter-spacing:.6px; margin-bottom:10px;}
    .small{font-size:12px; color:var(--muted); line-height:1.35;}
    .link{display:block; margin-top:12px; padding:10px 12px; border:1px solid var(--line); border-radius:10px; color:var(--text); text-decoration:none;}
    .link:hover{border-color:rgba(255,255,255,.22)}
    .main{flex:1; display:flex; flex-direction:column; min-width:0;}
    .top{padding:12px 14px; border-bottom:1px solid var(--line); display:flex; gap:10px; align-items:center;}
    .pill{font-size:12px; color:var(--muted); border:1px solid var(--line); padding:6px 10px; border-radius:999px;}
    .msgs{flex:1; overflow:auto; padding:14px; box-sizing:border-box;}
    .msg{max-width:920px; margin:0 auto 12px auto; padding:12px 12px; border:1px solid var(--line); border-radius:12px; background:rgba(255,255,255,.03);}
    .msg .role{font-weight:700; font-size:12px; color:var(--muted); margin-bottom:6px; letter-spacing:.3px;}
    .msg .body{white-space:pre-wrap; line-height:1.35;}
    .msg img{max-width:100%; border-radius:12px; display:block; margin-top:10px; border:1px solid var(--line);}
    .composer{border-top:1px solid var(--line); padding:12px 14px; display:flex; gap:10px; align-items:flex-end;}
    .btn{border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--text); border-radius:12px; padding:10px 12px; cursor:pointer;}
    .btn:hover{border-color:rgba(255,255,255,.22)}
    textarea{flex:1; resize:none; min-height:46px; max-height:180px; border-radius:12px; border:1px solid var(--line); background:rgba(255,255,255,.03); color:var(--text); padding:10px 12px; outline:none; font-size:14px; line-height:1.35;}
    input[type=file]{display:none;}
  </style>
</head>
<body>
<div class="wrap">
  <aside class="left">
    <div class="brand">AURA</div>
    <div class="small">Core console</div>
    <a class="link" href="/site/malibu" target="_blank" rel="noopener">Open Malibu City Guide</a>
    <a class="link" href="/__version" target="_blank" rel="noopener">Version</a>
    <div class="small" style="margin-top:12px;">Note: City Guide pages live under <b>/site/&lt;slug&gt;</b>.</div>
  </aside>

  <main class="main">
    <div class="top">
      <div class="pill">/core</div>
      <div class="pill" id="statusPill">ready</div>
    </div>

    <div class="msgs" id="msgs"></div>

    <div class="composer">
      <label class="btn" for="filePick" title="Upload">+</label>
      <input id="filePick" type="file" />
      <button class="btn" id="micBtn" title="Mic">🎤</button>
      <textarea id="inp" placeholder="Message Aura…"></textarea>
      <button class="btn" id="sendBtn">Send</button>
    </div>
  </main>
</div>

<script>
(() => {
  const $msgs = document.getElementById('msgs');
  const $inp = document.getElementById('inp');
  const $send = document.getElementById('sendBtn');
  const $status = document.getElementById('statusPill');
  const $file = document.getElementById('filePick');
  const $mic = document.getElementById('micBtn');

  const log = (role, body, imageUrl) => {
    const wrap = document.createElement('div');
    wrap.className = 'msg';
    const r = document.createElement('div'); r.className='role'; r.textContent=role;
    const b = document.createElement('div'); b.className='body'; b.textContent=body || '';
    wrap.appendChild(r); wrap.appendChild(b);
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = "image";
      wrap.appendChild(img);
    }
    $msgs.appendChild(wrap);
    $msgs.scrollTop = $msgs.scrollHeight;
  };

  log('YOU', 'Aura Core UI loaded.');

  async function sendText(text) {
    $status.textContent = 'thinking…';
    try {
      const res = await fetch('/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'text', input: text })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        log('AU', 'Error: ' + (data?.error || res.status));
      } else if (data.type === 'image' && data.url) {
        log('AU', data.caption || '(image)', data.url);
      } else {
        log('AU', data.output || data.text || JSON.stringify(data));
      }
    } catch (e) {
      log('AU', 'Network error.');
    } finally {
      $status.textContent = 'ready';
    }
  }

  $send.addEventListener('click', () => {
    const t = ($inp.value || '').trim();
    if (!t) return;
    log('YOU', t);
    $inp.value = '';
    sendText(t);
  });

  $inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      $send.click();
    }
  });

  $file.addEventListener('change', async () => {
    const f = $file.files && $file.files[0];
    if (!f) return;
    log('YOU', 'Uploading: ' + f.name);

    const fd = new FormData();
    fd.append('file', f, f.name);

    try {
      const res = await fetch('/upload', { method:'POST', body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        log('AU', 'Upload failed.');
      } else {
        log('AU', 'Upload OK: ' + data.url);
      }
    } catch (e) {
      log('AU', 'Upload error.');
    } finally {
      $file.value = '';
    }
  });

  // Mic placeholder (UI must remain ON; actual speech-to-text can be wired later)
  $mic.addEventListener('click', () => {
    log('AU', 'Mic is present. If speech capture is not wired, this will be updated later.');
  });
})();
</script>
</body>
</html>`;
}

/** City Guide HTML (standalone) */
function renderCityGuideHTML(slug, directoryJson) {
  const title = `${slug}.city`.replace(/^\./, "");
  const safeTitle = title.toUpperCase();
  // directoryJson is expected to be either:
  // - { categories:[ {name, items:[{name,description,image_url,location,...}]} ] }
  // OR
  // - { Dining:[...], Shopping:[...], ... }  (legacy)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${safeTitle} — City Guide</title>
  <style>
    :root {
      --bg:#f4fbff;
      --card:#ffffff;
      --text:#153046;
      --muted:#4f6b80;
      --line:rgba(21,48,70,.15);
      --accent:#0077be;
    }
    html,body{margin:0; padding:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; color:var(--text); background:var(--bg);}
    header{position:sticky; top:0; z-index:10; background:rgba(244,251,255,.92); backdrop-filter: blur(10px); border-bottom:1px solid var(--line);}
    .bar{max-width:1100px; margin:0 auto; padding:14px 14px; display:flex; gap:12px; align-items:center; justify-content:space-between;}
    .brand{font-weight:900; letter-spacing:.8px;}
    .sub{font-size:12px; color:var(--muted);}
    .tabs{max-width:1100px; margin:0 auto; padding:10px 14px 14px; display:flex; gap:10px; flex-wrap:wrap;}
    .tab{border:1px solid var(--line); background:rgba(255,255,255,.7); padding:8px 12px; border-radius:999px; cursor:pointer; user-select:none; font-weight:700; font-size:13px;}
    .tab.active{background:var(--accent); border-color:var(--accent); color:white;}
    main{max-width:1100px; margin:0 auto; padding:14px;}
    .grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px;}
    .card{background:var(--card); border:1px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,.04); display:flex; flex-direction:column;}
    .card img{width:100%; height:150px; object-fit:cover; background:#e9f3fb;}
    .c{padding:12px 12px 14px;}
    .name{font-weight:900; margin:0 0 6px 0; color:var(--accent);}
    .desc{margin:0 0 10px 0; color:var(--muted); font-size:13px; line-height:1.35;}
    .meta{font-size:12px; color:var(--muted);}
    .empty{padding:18px; color:var(--muted);}
    a.back{color:var(--accent); text-decoration:none; font-weight:800;}
  </style>
</head>
<body>
<header>
  <div class="bar">
    <div>
      <div class="brand">${safeTitle}</div>
      <div class="sub">Local guide — categories & listings</div>
    </div>
    <div class="sub"><a class="back" href="/core">Back to Aura Core</a></div>
  </div>
  <div class="tabs" id="tabs"></div>
</header>

<main>
  <div id="grid" class="grid"></div>
  <div id="empty" class="empty" style="display:none;"></div>
</main>

<script>
(() => {
  const raw = ${JSON.stringify(directoryJson || {})};

  function normalize(dir) {
    // If already categories array, use it.
    if (dir && Array.isArray(dir.categories)) return dir.categories;

    // Else treat object keys as categories with array items.
    const keys = Object.keys(dir || {});
    const out = [];
    for (const k of keys) {
      if (Array.isArray(dir[k])) out.push({ name: k, items: dir[k] });
    }
    return out;
  }

  const cats = normalize(raw);
  const tabs = document.getElementById('tabs');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');

  if (!cats.length) {
    empty.style.display = 'block';
    empty.textContent = 'No directory data found yet.';
    return;
  }

  let active = cats[0].name;

  function setActive(name) {
    active = name;
    renderTabs();
    renderCards();
  }

  function renderTabs() {
    tabs.innerHTML = '';
    for (const c of cats) {
      const b = document.createElement('div');
      b.className = 'tab' + (c.name === active ? ' active' : '');
      b.textContent = c.name;
      b.addEventListener('click', () => setActive(c.name));
      tabs.appendChild(b);
    }
  }

  function renderCards() {
    grid.innerHTML = '';
    empty.style.display = 'none';

    const cat = cats.find(x => x.name === active);
    const items = (cat && Array.isArray(cat.items)) ? cat.items : [];

    if (!items.length) {
      empty.style.display = 'block';
      empty.textContent = 'No listings in ' + active + '.';
      return;
    }

    for (const it of items) {
      const card = document.createElement('div');
      card.className = 'card';

      if (it.image_url) {
        const img = document.createElement('img');
        img.src = it.image_url;
        img.alt = it.name || 'image';
        card.appendChild(img);
      }

      const c = document.createElement('div');
      c.className = 'c';

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = it.name || 'Untitled';
      c.appendChild(name);

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = it.description || it.short_description || '';
      c.appendChild(desc);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = it.location || 'Malibu, CA';
      c.appendChild(meta);

      card.appendChild(c);
      grid.appendChild(card);
    }
  }

  renderTabs();
  renderCards();
})();
</script>
</body>
</html>`;
}

/** Admin: seed directory (writes AURA_DIRECTORY) */
async function adminSeedDirectory(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();

  // Accept:
  // - raw JSON body
  // - { AURA_DIRECTORY: {...} }
  // - { directory: {...} }
  const body = await readBodyJson(request);
  if (!body) return badRequest("invalid_json");

  let dir = body;
  if (body.AURA_DIRECTORY) dir = body.AURA_DIRECTORY;
  if (body.directory) dir = body.directory;

  // Minimal validation: must be object
  if (!dir || typeof dir !== "object") return badRequest("invalid_directory");

  await kvPut(env, "AURA_DIRECTORY", JSON.stringify(dir));
  return json({ ok: true, wrote: "AURA_DIRECTORY" });
}

/** Admin: get directory (reads AURA_DIRECTORY) */
async function adminGetDirectory(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const raw = await kvGet(env, "AURA_DIRECTORY");
  if (!raw) return json({ ok: true, exists: false, directory: null });
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch {}
  return json({ ok: true, exists: true, directory: parsed ?? raw });
}

/** Admin: set UI override (writes AURA_CORE_UI) */
async function adminSetUI(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const body = await readBodyText(request);
  if (!body || body.trim().length < 10) return badRequest("ui_too_small");
  await kvPut(env, "AURA_CORE_UI", body);
  return json({ ok: true, wrote: "AURA_CORE_UI", bytes: body.length });
}

/** Admin: reset UI override */
async function adminResetUI(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  await kvDel(env, "AURA_CORE_UI");
  return json({ ok: true, deleted: "AURA_CORE_UI" });
}

/** Admin: set site HTML for slug (writes SITE_HTML:<slug>) */
async function adminSetSite(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();

  // Accept JSON: { slug, html } or { site:{slug, html} }
  const body = await readBodyJson(request);
  if (!body) return badRequest("invalid_json");

  const obj = body.site ? body.site : body;
  const slug = safeSlug(obj.slug);
  const htmlStr = typeof obj.html === "string" ? obj.html : null;

  if (!slug) return badRequest("invalid_slug");
  if (!htmlStr || htmlStr.trim().length < 10) return badRequest("invalid_html");

  const key = `SITE_HTML:${slug}`;
  await kvPut(env, key, htmlStr);
  return json({ ok: true, wrote: key, slug, bytes: htmlStr.length });
}

/** Admin: reset site HTML */
async function adminResetSite(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const body = await readBodyJson(request);
  if (!body) return badRequest("invalid_json");
  const slug = safeSlug(body.slug);
  if (!slug) return badRequest("invalid_slug");
  const key = `SITE_HTML:${slug}`;
  await kvDel(env, key);
  return json({ ok: true, deleted: key, slug });
}

/** Admin: list site keys (prefix scan if supported) */
async function adminListSites(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();

  // KV list is supported. Return slugs.
  const listed = await env.AURA_KV.list({ prefix: "SITE_HTML:" });
  const slugs = (listed.keys || [])
    .map(k => (k.name || "").replace(/^SITE_HTML:/, ""))
    .filter(Boolean);

  return json({ ok: true, count: slugs.length, slugs });
}

/** Serve /core — from KV override or default */
async function handleCore(request, env) {
  const override = await kvGet(env, "AURA_CORE_UI");
  if (override && override.trim()) return html(override);
  return html(defaultCoreUI());
}

/** Serve /site/<slug> from KV, fallback message */
async function handleSite(request, env, slug) {
  const key = `SITE_HTML:${slug}`;
  const page = await kvGet(env, key);
  if (page && page.trim()) return html(page);
  return html(`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${slug}.city</title></head><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:18px;">
  <h2 style="margin:0 0 8px 0;">${slug}.city not yet published</h2>
  <p style="margin:0 0 14px 0;">KV key missing: <code>${key}</code></p>
  <p><a href="/core">Back to Aura Core</a></p>
</body></html>`);
}

/** Serve /malibu legacy (redirect to /site/malibu) */
function handleMalibuRedirect() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/site/malibu" },
  });
}

/**
 * /chat — text in, text out (and supports returning image via /image)
 * Input JSON:
 *   { "type":"text", "input":"..." }
 *   { "type":"image", "prompt":"..." }   (optional: direct)
 */
async function handleChat(request, env) {
  if (request.method !== "POST") return methodNotAllowed();

  const payload = await readBodyJson(request);
  if (!payload || typeof payload !== "object") return badRequest("invalid_json");

  // Direct image intent
  if (payload.type === "image") {
    const prompt = String(payload.prompt || payload.input || "").trim();
    if (!prompt) return badRequest("missing_prompt");
    return await handleImageInternal(env, prompt);
  }

  const input = String(payload.input || "").trim();
  if (!input) return badRequest("missing_input");

  // Simple heuristic: if user explicitly prefixes "image:" then route to /image
  if (/^\s*image\s*:/i.test(input)) {
    const prompt = input.replace(/^\s*image\s*:/i, "").trim();
    if (!prompt) return badRequest("missing_prompt");
    return await handleImageInternal(env, prompt);
  }

  // If OpenAI is not configured, provide a deterministic echo response.
  if (!env?.OPENAI_API_KEY) {
    return json({
      ok: true,
      type: "text",
      output: `OPENAI_API_KEY not configured. Echo: ${input}`,
    });
  }

  const model = env.CHAT_MODEL || "gpt-4.1-mini";

  // Use Responses API (works for modern OpenAI) — best-effort.
  try {
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok || !data) {
      return json(
        {
          ok: false,
          error: "openai_error",
          status: resp.status,
          detail: data || null,
        },
        500
      );
    }

    // Try to extract output text
    let outText = "";
    if (typeof data.output_text === "string") outText = data.output_text;

    // Fallback extraction
    if (!outText && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item && item.type === "message" && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c && c.type === "output_text" && typeof c.text === "string") {
              outText += c.text;
            }
          }
        }
      }
    }

    outText = outText || "(no output_text)";

    return json({ ok: true, type: "text", output: outText });
  } catch (e) {
    return json({ ok: false, error: "chat_failed" }, 500);
  }
}

/**
 * /image — returns {type:"image", url}
 * Input JSON:
 *   { "prompt":"..." } OR { "type":"image", "prompt":"..." }
 */
async function handleImage(request, env) {
  if (request.method !== "POST") return methodNotAllowed();
  const payload = await readBodyJson(request);
  if (!payload) return badRequest("invalid_json");
  const prompt = String(payload.prompt || payload.input || "").trim();
  if (!prompt) return badRequest("missing_prompt");
  return await handleImageInternal(env, prompt);
}

async function handleImageInternal(env, prompt) {
  if (!env?.OPENAI_API_KEY) {
    return json({
      ok: false,
      error: "OPENAI_API_KEY_not_configured",
    }, 500);
  }

  const model = env.IMAGE_MODEL || "gpt-image-1";

  try {
    // Use Images API — best-effort.
    const resp = await fetch("https://api.openai.com/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1024x1024",
      }),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok || !data) {
      return json(
        {
          ok: false,
          error: "openai_image_error",
          status: resp.status,
          detail: data || null,
        },
        500
      );
    }

    // Common shapes:
    // - {data:[{url:"..."}]}
    // - {data:[{b64_json:"..."}]}
    const first = Array.isArray(data.data) ? data.data[0] : null;
    if (!first) return json({ ok: false, error: "no_image_returned" }, 500);

    if (first.url) {
      return json({ ok: true, type: "image", url: first.url, caption: prompt });
    }

    if (first.b64_json) {
      // Return as data URL
      return json({
        ok: true,
        type: "image",
        url: `data:image/png;base64,${first.b64_json}`,
        caption: prompt,
      });
    }

    return json({ ok: false, error: "unknown_image_shape" }, 500);
  } catch (e) {
    return json({ ok: false, error: "image_failed" }, 500);
  }
}

/**
 * /upload — minimal file upload to KV (keeps + functional)
 * - Stores as base64 under key UPLOAD:<id>
 * - Serves at /uploads/<id>
 */
async function handleUpload(request, env) {
  if (request.method !== "POST") return methodNotAllowed();

  const ct = request.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("multipart/form-data")) {
    return badRequest("expected_multipart_form_data");
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return badRequest("missing_file");

  const arrBuf = await file.arrayBuffer();
  const bytes = new Uint8Array(arrBuf);
  let bin = "";
  // Base64 encode (small/medium files; fine for now)
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);

  const id = crypto.randomUUID();
  const key = `UPLOAD:${id}`;
  const meta = {
    name: file.name || "upload",
    type: file.type || "application/octet-stream",
    size: bytes.length,
    b64,
  };

  await kvPut(env, key, JSON.stringify(meta));
  return json({
    ok: true,
    file_id: id,
    url: `/uploads/${id}`,
    name: meta.name,
    type: meta.type,
    size: meta.size,
  });
}

async function handleUploadsServe(request, env, id) {
  const key = `UPLOAD:${id}`;
  const raw = await kvGet(env, key);
  if (!raw) return notFound();

  let meta;
  try { meta = JSON.parse(raw); } catch { return notFound(); }

  if (!meta?.b64) return notFound();

  const bytes = Uint8Array.from(atob(meta.b64), c => c.charCodeAt(0));
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": meta.type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${(meta.name || id).replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** /__version */
async function handleVersion() {
  return json({
    ok: true,
    version: VERSION,
    build: BUILD_ID,
    timestamp: new Date().toISOString(),
  });
}

/** /admin router */
async function handleAdmin(request, env, pathname) {
  if (!pathname.startsWith("/admin/")) return notFound();

  // Must be protected
  if (!requireAdmin(request, env)) return unauthorized();

  // Route map:
  // UI
  if (pathname === "/admin/ui") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminSetUI(request, env);
  }
  if (pathname === "/admin/ui/reset") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminResetUI(request, env);
  }

  // Directory
  if (pathname === "/admin/dir/seed") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminSeedDirectory(request, env);
  }
  if (pathname === "/admin/dir/get") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminGetDirectory(request, env);
  }

  // Site publishing (generic)
  if (pathname === "/admin/site/set") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminSetSite(request, env);
  }
  if (pathname === "/admin/site/reset") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminResetSite(request, env);
  }
  if (pathname === "/admin/site/list") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminListSites(request, env);
  }

  return notFound();
}

/** main router */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Version
      if (path === "/__version") return await handleVersion();

      // Core UI
      if (path === "/core" || path === "/") return await handleCore(request, env);

      // Chat + Image
      if (path === "/chat") return await handleChat(request, env);
      if (path === "/image") return await handleImage(request, env);

      // Uploads
      if (path === "/upload") return await handleUpload(request, env);
      if (path.startsWith("/uploads/")) {
        const id = path.slice("/uploads/".length).trim();
        if (!id) return notFound();
        return await handleUploadsServe(request, env, id);
      }

      // Admin
      if (path.startsWith("/admin/")) {
        return await handleAdmin(request, env, path);
      }

      // Legacy Malibu redirect
      if (path === "/malibu") return handleMalibuRedirect();

      // Generic site route: /site/<slug>
      if (path.startsWith("/site/")) {
        const slug = safeSlug(path.slice("/site/".length));
        if (!slug) return notFound();
        return await handleSite(request, env, slug);
      }

      // Optional: convenience city route /city/<slug> -> /site/<slug>
      if (path.startsWith("/city/")) {
        const slug = safeSlug(path.slice("/city/".length));
        if (!slug) return notFound();
        return new Response(null, { status: 302, headers: { Location: `/site/${slug}` } });
      }

      return notFound();
    } catch (e) {
      return json({ ok: false, error: "internal_error" }, 500);
    }
  },
};

/**
 * QUICK NOTE FOR AURA (not shown to users):
 * - To publish Malibu:
 *   1) POST /admin/dir/seed (AURA_DIRECTORY)
 *   2) Generate HTML using renderCityGuideHTML("malibu", directory)
 *   3) POST /admin/site/set {slug:"malibu", html:"..."}  -> serves at /site/malibu
 *
 * You can also store a fully custom HTML string per site.
 */
