var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var VERSION = "aura-core-2026-01-13";
var BUILD_ID = "site-publisher-v1";
var JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8"
};
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}
__name(json, "json");
function text(str, status = 200, extraHeaders = {}) {
  return new Response(str, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...extraHeaders }
  });
}
__name(text, "text");
function html(str, status = 200, extraHeaders = {}) {
  return new Response(str, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...extraHeaders }
  });
}
__name(html, "html");
function badRequest(msg = "bad_request", detail) {
  return json({ ok: false, error: msg, detail }, 400);
}
__name(badRequest, "badRequest");
function unauthorized(msg = "unauthorized") {
  return json({ ok: false, error: msg }, 401);
}
__name(unauthorized, "unauthorized");
function notFound() {
  return text("Not found", 404);
}
__name(notFound, "notFound");
function methodNotAllowed() {
  return text("Method Not Allowed", 405);
}
__name(methodNotAllowed, "methodNotAllowed");
function getHeader(request, name) {
  return request.headers.get(name) || request.headers.get(name.toLowerCase()) || "";
}
__name(getHeader, "getHeader");
function safeSlug(input) {
  const s = String(input || "").trim().toLowerCase().replace(/[^a-z0-9\-_.]/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  if (!s) return null;
  if (s.length > 80) return s.slice(0, 80);
  return s;
}
__name(safeSlug, "safeSlug");
async function readBodyText(request) {
  return await request.text();
}
__name(readBodyText, "readBodyText");
async function readBodyJson(request) {
  try {
    const clone = request.clone();
    const t = await clone.text();
    if (!t || !t.trim()) return null;
    return JSON.parse(t);
  } catch (e) {
    return null;
  }
}
__name(readBodyJson, "readBodyJson");
function requireAdmin(request, env) {
  const pass = getHeader(request, "X-Core-Pass");
  if (!env || typeof env.CORE_PASS !== "string" || !env.CORE_PASS) return false;
  return pass && pass === env.CORE_PASS;
}
__name(requireAdmin, "requireAdmin");
async function kvGet(env, key) {
  if (!env?.AURA_KV) throw new Error("missing_kv_binding_AURA_KV");
  return await env.AURA_KV.get(key);
}
__name(kvGet, "kvGet");
async function kvPut(env, key, value) {
  if (!env?.AURA_KV) throw new Error("missing_kv_binding_AURA_KV");
  await env.AURA_KV.put(key, value);
}
__name(kvPut, "kvPut");
async function kvDel(env, key) {
  if (!env?.AURA_KV) throw new Error("missing_kv_binding_AURA_KV");
  await env.AURA_KV.delete(key);
}
__name(kvDel, "kvDel");
function defaultCoreUI() {
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
      <button class="btn" id="micBtn" title="Mic">\u{1F3A4}</button>
      <textarea id="inp" placeholder="Message Aura\u2026"></textarea>
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
    $status.textContent = 'thinking\u2026';
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
<\/script>
</body>
</html>`;
}
__name(defaultCoreUI, "defaultCoreUI");
async function adminSeedDirectory(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const body = await readBodyJson(request);
  if (!body) return badRequest("invalid_json");
  let dir = body;
  if (body.AURA_DIRECTORY) dir = body.AURA_DIRECTORY;
  if (body.directory) dir = body.directory;
  if (!dir || typeof dir !== "object") return badRequest("invalid_directory");
  await kvPut(env, "AURA_DIRECTORY", JSON.stringify(dir));
  return json({ ok: true, wrote: "AURA_DIRECTORY" });
}
__name(adminSeedDirectory, "adminSeedDirectory");
async function adminGetDirectory(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const raw = await kvGet(env, "AURA_DIRECTORY");
  if (!raw) return json({ ok: true, exists: false, directory: null });
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
  }
  return json({ ok: true, exists: true, directory: parsed ?? raw });
}
__name(adminGetDirectory, "adminGetDirectory");
async function adminSetUI(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const body = await readBodyText(request);
  if (!body || body.trim().length < 10) return badRequest("ui_too_small");
  await kvPut(env, "AURA_CORE_UI", body);
  return json({ ok: true, wrote: "AURA_CORE_UI", bytes: body.length });
}
__name(adminSetUI, "adminSetUI");
async function adminResetUI(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  await kvDel(env, "AURA_CORE_UI");
  return json({ ok: true, deleted: "AURA_CORE_UI" });
}
__name(adminResetUI, "adminResetUI");
async function adminSetSite(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
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
__name(adminSetSite, "adminSetSite");
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
__name(adminResetSite, "adminResetSite");
async function adminListSites(request, env) {
  if (!requireAdmin(request, env)) return unauthorized();
  const listed = await env.AURA_KV.list({ prefix: "SITE_HTML:" });
  const slugs = (listed.keys || []).map((k) => (k.name || "").replace(/^SITE_HTML:/, "")).filter(Boolean);
  return json({ ok: true, count: slugs.length, slugs });
}
__name(adminListSites, "adminListSites");
async function handleCore(request, env) {
  const override = await kvGet(env, "AURA_CORE_UI");
  if (override && override.trim()) return html(override);
  return html(defaultCoreUI());
}
__name(handleCore, "handleCore");
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
__name(handleSite, "handleSite");
function handleMalibuRedirect() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/site/malibu" }
  });
}
__name(handleMalibuRedirect, "handleMalibuRedirect");
async function handleChat(request, env) {
  if (request.method !== "POST") return methodNotAllowed();
  const payload = await readBodyJson(request);
  if (!payload || typeof payload !== "object") return badRequest("invalid_json");
  if (payload.type === "image") {
    const prompt = String(payload.prompt || payload.input || "").trim();
    if (!prompt) return badRequest("missing_prompt");
    return await handleImageInternal(env, prompt);
  }
  const input = String(payload.input || "").trim();
  if (!input) return badRequest("missing_input");
  if (/^\s*image\s*:/i.test(input)) {
    const prompt = input.replace(/^\s*image\s*:/i, "").trim();
    if (!prompt) return badRequest("missing_prompt");
    return await handleImageInternal(env, prompt);
  }
  if (!env?.OPENAI_API_KEY) {
    return json({
      ok: true,
      type: "text",
      output: `OPENAI_API_KEY not configured. Echo: ${input}`
    });
  }
  const model = env.CHAT_MODEL || "gpt-4.1-mini";
  try {
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input
      })
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data) {
      return json(
        {
          ok: false,
          error: "openai_error",
          status: resp.status,
          detail: data || null
        },
        500
      );
    }
    let outText = "";
    if (typeof data.output_text === "string") outText = data.output_text;
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
__name(handleChat, "handleChat");
async function handleImage(request, env) {
  if (request.method !== "POST") return methodNotAllowed();
  const payload = await readBodyJson(request);
  if (!payload) return badRequest("invalid_json");
  const prompt = String(payload.prompt || payload.input || "").trim();
  if (!prompt) return badRequest("missing_prompt");
  return await handleImageInternal(env, prompt);
}
__name(handleImage, "handleImage");
async function handleImageInternal(env, prompt) {
  if (!env?.OPENAI_API_KEY) {
    return json({
      ok: false,
      error: "OPENAI_API_KEY_not_configured"
    }, 500);
  }
  const model = env.IMAGE_MODEL || "gpt-image-1";
  try {
    const resp = await fetch("https://api.openai.com/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1024x1024"
      })
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data) {
      return json(
        {
          ok: false,
          error: "openai_image_error",
          status: resp.status,
          detail: data || null
        },
        500
      );
    }
    const first = Array.isArray(data.data) ? data.data[0] : null;
    if (!first) return json({ ok: false, error: "no_image_returned" }, 500);
    if (first.url) {
      return json({ ok: true, type: "image", url: first.url, caption: prompt });
    }
    if (first.b64_json) {
      return json({
        ok: true,
        type: "image",
        url: `data:image/png;base64,${first.b64_json}`,
        caption: prompt
      });
    }
    return json({ ok: false, error: "unknown_image_shape" }, 500);
  } catch (e) {
    return json({ ok: false, error: "image_failed" }, 500);
  }
}
__name(handleImageInternal, "handleImageInternal");
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
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  const id = crypto.randomUUID();
  const key = `UPLOAD:${id}`;
  const meta = {
    name: file.name || "upload",
    type: file.type || "application/octet-stream",
    size: bytes.length,
    b64
  };
  await kvPut(env, key, JSON.stringify(meta));
  return json({
    ok: true,
    file_id: id,
    url: `/uploads/${id}`,
    name: meta.name,
    type: meta.type,
    size: meta.size
  });
}
__name(handleUpload, "handleUpload");
async function handleUploadsServe(request, env, id) {
  const key = `UPLOAD:${id}`;
  const raw = await kvGet(env, key);
  if (!raw) return notFound();
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch {
    return notFound();
  }
  if (!meta?.b64) return notFound();
  const bytes = Uint8Array.from(atob(meta.b64), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": meta.type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${(meta.name || id).replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
__name(handleUploadsServe, "handleUploadsServe");
async function handleVersion() {
  return json({
    ok: true,
    version: VERSION,
    build: BUILD_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
__name(handleVersion, "handleVersion");
async function handleAdmin(request, env, pathname) {
  if (!pathname.startsWith("/admin/")) return notFound();
  if (!requireAdmin(request, env)) return unauthorized();
  if (pathname === "/admin/ui") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminSetUI(request, env);
  }
  if (pathname === "/admin/ui/reset") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminResetUI(request, env);
  }
  if (pathname === "/admin/dir/seed") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminSeedDirectory(request, env);
  }
  if (pathname === "/admin/dir/get") {
    if (request.method !== "POST") return methodNotAllowed();
    return await adminGetDirectory(request, env);
  }
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
  if (pathname === "/admin/self_deploy/prepare") {
    if (request.method !== "POST") return methodNotAllowed();
    if (!env?.AURA_DEPLOYER) return json({ ok: false, error: "missing_deployer_binding" }, 500);
    return json({ ok: true });
  }
  if (pathname === "/admin/self_deploy/commit") {
    if (request.method !== "POST") return methodNotAllowed();
    if (!env?.AURA_DEPLOYER) return json({ ok: false, error: "missing_deployer_binding" }, 500);
    const token = env?.DEPLOY_SECRET || env?.DEPLOY_KEY;
    if (!token) return json({ ok: false, error: "missing_deploy_token" }, 500);
    try {
      const incoming = await readBodyJson(request);
      const payload = incoming && typeof incoming === "object" ? incoming : {};
      const script_name = payload.script_name;
      const bundle_b64 = payload.bundle_b64;
      const bundle_raw = payload.bundle;
      if (!script_name || !bundle_b64 && !bundle_raw) {
        return json({ ok: false, error: "missing_required_fields" }, 400);
      }
      let bundle = null;
      if (typeof bundle_raw === "string" && bundle_raw.length) {
        bundle = bundle_raw;
      } else {
        try {
          bundle = atob(String(bundle_b64));
        } catch (e) {
          return json({ ok: false, error: "invalid_bundle_b64" }, 400);
        }
      }
      const forward = {
        script_name,
        bundle
      };
      if (payload.compatibility_date) forward.compatibility_date = payload.compatibility_date;
      if (payload.promote_phrase) forward.promote_phrase = payload.promote_phrase;
      const res = await env.AURA_DEPLOYER.fetch("https://aura-deployer/deploy", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "X-Deploy-Key": token,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(forward)
      });
      const bodyText = await res.text();
      return new Response(bodyText, {
        status: res.status,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    } catch (e) {
      return json({ ok: false, error: "deployer_fetch_failed", detail: String(e && e.message ? e.message : e) }, 500);
    }
  }
  return notFound();
}
__name(handleAdmin, "handleAdmin");
var index_default = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      if (path === "/__version") return await handleVersion();
      if (path === "/core" || path === "/") return await handleCore(request, env);
      if (path === "/chat") return await handleChat(request, env);
      if (path === "/image") return await handleImage(request, env);
      if (path === "/upload") return await handleUpload(request, env);
      if (path.startsWith("/uploads/")) {
        const id = path.slice("/uploads/".length).trim();
        if (!id) return notFound();
        return await handleUploadsServe(request, env, id);
      }
      if (path.startsWith("/admin/")) {
        return await handleAdmin(request, env, path);
      }
      if (path === "/malibu") return handleMalibuRedirect();
      if (path.startsWith("/site/")) {
        const slug = safeSlug(path.slice("/site/".length));
        if (!slug) return notFound();
        return await handleSite(request, env, slug);
      }
      if (path.startsWith("/city/")) {
        const slug = safeSlug(path.slice("/city/".length));
        if (!slug) return notFound();
        return new Response(null, { status: 302, headers: { Location: `/site/${slug}` } });
      }
      return notFound();
    } catch (e) {
      return json({ ok: false, error: "internal_error", detail: String(e && e.message ? e.message : e) }, 500);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
