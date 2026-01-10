// src/index.js
// Minimal, production-safe single-worker router with:
// - GET /            -> simple UI (kept small on purpose)
// - POST /chat       -> placeholder (returns 501 unless you wire your chat handler back in)
// - POST /upload     -> REAL multipart upload -> R2 + KV metadata
// - GET /file/:id    -> returns uploaded file
// - GET /health      -> ok
// - GET /version     -> build info
//
// IMPORTANT: This file is focused on unblocking uploads fast.
// After uploads work, we can merge these routes into your full Aura UI/chat file.

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

function text(s, status = 200, extra = {}) {
  return new Response(s, { status, headers: { "Content-Type": "text/plain; charset=UTF-8", ...extra } });
}

function safeFilename(name = "upload") {
  return String(name).replace(/[^\w.\-]+/g, "_").slice(0, 180);
}

async function sha256Hex(arrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const bytes = new Uint8Array(digest);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // ---- OPTIONS (CORS preflight) ----
    if (request.method === "OPTIONS") {
      // Respond to all preflights universally
      return new Response(null, { status: 204, headers: corsHeaders("*") });
    }

    // ---- Health ----
    if (request.method === "GET" && pathname === "/health") {
      return text("ok", 200, corsHeaders("*"));
    }

    // ---- Version ----
    if (request.method === "GET" && pathname === "/version") {
      const out = {
        ok: true,
        worker: "aura-core",
        ts: new Date().toISOString(),
      };
      return json(out, 200, corsHeaders("*"));
    }

    // ---- Upload: POST /upload (multipart field name: file) ----
    if (request.method === "POST" && pathname === "/upload") {
      try {
        if (!env.AURA_UPLOADS) {
          return json({ ok: false, error: "Missing R2 binding env.AURA_UPLOADS" }, 500, corsHeaders("*"));
        }
        if (!env.AURA_MEM) {
          return json({ ok: false, error: "Missing KV binding env.AURA_MEM" }, 500, corsHeaders("*"));
        }

        const ct = request.headers.get("content-type") || "";
        if (!ct.toLowerCase().includes("multipart/form-data")) {
          return json({ ok: false, error: "Expected multipart/form-data" }, 415, corsHeaders("*"));
        }

        const form = await request.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") {
          return json({ ok: false, error: "Missing file field named 'file'" }, 400, corsHeaders("*"));
        }

        const bytes = await file.arrayBuffer();
        const hash = await sha256Hex(bytes);

        const upload_id = crypto.randomUUID();
        const filename = safeFilename(file.name || "upload");
        const mime = file.type || "application/octet-stream";
        const r2_key = `uploads/${upload_id}/${filename}`;

        await env.AURA_UPLOADS.put(r2_key, bytes, {
          httpMetadata: { contentType: mime },
        });

        const meta = {
          ok: true,
          upload_id,
          filename,
          mime,
          bytes: bytes.byteLength,
          sha256: hash,
          r2_key,
          created_at: new Date().toISOString(),
        };

        await env.AURA_MEM.put(`upload:${upload_id}`, JSON.stringify(meta));

        return json(
          {
            ok: true,
            upload: meta,
            url: `/file/${upload_id}`,
          },
          201,
          corsHeaders("*")
        );
      } catch (e) {
        return json({ ok: false, error: String(e?.message || e) }, 500, corsHeaders("*"));
      }
    }

    // ---- File fetch: GET /file/:upload_id ----
    if (request.method === "GET" && pathname.startsWith("/file/")) {
      try {
        if (!env.AURA_UPLOADS || !env.AURA_MEM) {
          return text("Not Found", 404, corsHeaders("*"));
        }
        const upload_id = pathname.split("/").pop();
        const raw = await env.AURA_MEM.get(`upload:${upload_id}`);
        if (!raw) return text("Not Found", 404, corsHeaders("*"));

        const meta = JSON.parse(raw);
        const obj = await env.AURA_UPLOADS.get(meta.r2_key);
        if (!obj) return text("Not Found", 404, corsHeaders("*"));

        const headers = new Headers(corsHeaders("*"));
        headers.set("Content-Type", meta.mime || "application/octet-stream");
        headers.set("Content-Disposition", `inline; filename="${meta.filename || "file"}"`);

        return new Response(obj.body, { status: 200, headers });
      } catch (e) {
        return json({ ok: false, error: String(e?.message || e) }, 500, corsHeaders("*"));
      }
    }

    // ---- Chat placeholder (so UI doesn't 404) ----
    if (request.method === "POST" && pathname === "/chat") {
      return json(
        { ok: false, error: "Chat endpoint not merged in this minimal upload-fix build yet." },
        501,
        corsHeaders("*")
      );
    }

    // ---- UI (simple) ----
    if (request.method === "GET" && pathname === "/") {
      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Aura</title>
  <style>
    body{font-family:system-ui,Segoe UI,Arial;margin:24px;max-width:760px}
    .row{display:flex;gap:8px;align-items:center}
    input[type="text"]{flex:1;padding:10px;border:1px solid #ccc;border-radius:10px}
    button{padding:10px 12px;border:0;border-radius:10px;cursor:pointer}
    .log{margin-top:16px;white-space:pre-wrap;border:1px solid #eee;padding:12px;border-radius:12px}
  </style>
</head>
<body>
  <h2>Aura</h2>
  <div class="row">
    <input id="msg" type="text" placeholder="Type... (chat not merged in this minimal build)" />
    <input id="file" type="file" style="display:none" />
    <button id="plus">+</button>
    <button id="send">Send</button>
  </div>
  <div id="log" class="log">Aura is working.</div>

<script>
  const log = (s)=>document.getElementById('log').textContent = s;
  const fileInput = document.getElementById('file');

  document.getElementById('plus').onclick = ()=>fileInput.click();

  fileInput.onchange = async ()=>{
    const f = fileInput.files && fileInput.files[0];
    if(!f) return;
    log("Uploading " + f.name + " ...");
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/upload", { method:"POST", body: fd });
    const txt = await res.text();
    log("Upload response ("+res.status+"):\\n" + txt);
  };

  document.getElementById('send').onclick = async ()=>{
    log("Chat not merged in this minimal upload-fix build yet.");
  };
</script>
</body>
</html>`;
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=UTF-8" } });
    }

    // Default
    return text("Not Found", 404, corsHeaders("*"));
  },
};
