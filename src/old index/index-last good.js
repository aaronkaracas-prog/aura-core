// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-21__AUTONOMY_STEP_07__FIX_ADMIN_AUTH__01
// Full-file replacement. No UI work.

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function text(body, status = 200, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", ...extraHeaders },
  });
}

function nowUtcIso() {
  return new Date().toISOString();
}

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function safeId(prefix = "id") {
  const a = crypto.getRandomValues(new Uint8Array(8));
  let s = "";
  for (const b of a) s += b.toString(16).padStart(2, "0");
  return `${prefix}_${s}`;
}

async function readJson(req) {
  const ct = req.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) {
    const t = await req.text();
    if (!t) return {};
    try { return JSON.parse(t); } catch { return null; }
  }
  try { return await req.json(); } catch { return null; }
}

function getAdminTokenFromReq(req) {
  const h = req.headers;
  return (
    h.get("X-Core-Pass") ||
    h.get("x-core-pass") ||
    h.get("X-Aura-Pass") ||
    h.get("x-aura-pass") ||
    h.get("X-Admin-Token") ||
    h.get("x-admin-token") ||
    ""
  );
}

function adminAuthDiag(req, env) {
  const token = getAdminTokenFromReq(req);
  const envTok = env?.AURA_ADMIN_TOKEN || "";
  return {
    header_present: !!token,
    header_len: token ? token.length : 0,
    env_present: !!envTok,
    env_len: envTok ? envTok.length : 0,
    match: !!token && !!envTok && token === envTok,
    header_names_checked: ["X-Core-Pass", "X-Aura-Pass", "X-Admin-Token"],
  };
}

function requireAdmin(req, env) {
  const token = getAdminTokenFromReq(req);
  const envTok = env?.AURA_ADMIN_TOKEN || "";
  if (!envTok) return { ok: false, error: "server_misconfigured", status: 500 };
  if (!token || token !== envTok) {
    return { ok: false, error: "unauthorized", status: 401, auth_diag: adminAuthDiag(req, env) };
  }
  return { ok: true };
}

// ---- KV helpers ----
async function kvGetJson(kv, key) {
  const v = await kv.get(key);
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}

async function kvPutJson(kv, key, obj) {
  await kv.put(key, JSON.stringify(obj));
}

// ---- Image storage ----
const KV_LAST_IMAGE_KEY = "images:last_id";

async function saveImageToR2(env, { pngBytes, id }) {
  const key = `images/${id}.png`;
  await env.AURA_UPLOADS.put(key, pngBytes, { httpMetadata: { contentType: "image/png" } });
  return key;
}

async function getImageMeta(env, id) {
  return await kvGetJson(env.AURA_KV, `images:meta:${id}`);
}

async function setImageMeta(env, id, meta) {
  await kvPutJson(env.AURA_KV, `images:meta:${id}`, meta);
  await env.AURA_KV.put(KV_LAST_IMAGE_KEY, id);
}

async function getLastImageId(env) {
  return await env.AURA_KV.get(KV_LAST_IMAGE_KEY);
}

async function openaiImageGenerate(env, { prompt, size }) {
  const url = "https://api.openai.com/v1/images/generations";
  const body = { model: "gpt-image-1", prompt, size: size || "1024x1024" };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const textRaw = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(textRaw); } catch { parsed = null; }

  if (!res.ok) {
    return { ok: false, status: res.status, details: parsed || { raw: textRaw?.slice(0, 5000) } };
  }

  const b64 = parsed?.data?.[0]?.b64_json;
  if (!b64) return { ok: false, status: 500, details: { error: "missing_b64_json", raw: parsed } };

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return { ok: true, bytes, revised_prompt: parsed?.data?.[0]?.revised_prompt || null };
}

// ---- Task queue ----
const TASKS_INDEX_KEY = "tasks:index";
const TASKS_INDEX_CAP = 200;

function normalizeTaskInput(input) {
  if (typeof input === "string") return input.trim();
  if (input == null) return "";
  return String(input).trim();
}

async function tasksIndexGet(env) {
  const idx = await kvGetJson(env.AURA_KV, TASKS_INDEX_KEY);
  return Array.isArray(idx) ? idx : [];
}

async function tasksIndexPut(env, arr) {
  await kvPutJson(env.AURA_KV, TASKS_INDEX_KEY, arr.slice(0, TASKS_INDEX_CAP));
}

async function taskGet(env, id) {
  return await kvGetJson(env.AURA_KV, `tasks:task:${id}`);
}

async function taskPut(env, task) {
  await kvPutJson(env.AURA_KV, `tasks:task:${task.id}`, task);
}

function computeNextRunAtIso(delaySeconds = 0) {
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

async function enqueueTask(env, { mode = "TASK", input = "", max_retries = 5, delay_seconds = 0 }) {
  const id = safeId("t");
  const now = nowUtcIso();
  const task = {
    id,
    mode,
    input: normalizeTaskInput(input),
    status: "queued",
    retries: 0,
    max_retries: max_retries ?? 5,
    next_run_at: computeNextRunAtIso(delay_seconds || 0),
    created_at: now,
    updated_at: now,
    claimed_at: null,
    claimed_by: null,
    lease_until: null,
    result: null,
    error: null,
  };

  await taskPut(env, task);
  const idx = await tasksIndexGet(env);
  idx.unshift(id);
  await tasksIndexPut(env, idx);
  return task;
}

function isDue(task) {
  if (!task) return false;
  if (task.status !== "queued") return false;
  if (!task.next_run_at) return true;
  return Date.parse(task.next_run_at) <= Date.now();
}

async function claimNextDue(env, claimer = "runner", lease_seconds = 180) {
  const idx = await tasksIndexGet(env);
  for (const id of idx) {
    const task = await taskGet(env, id);
    if (!isDue(task)) continue;
    const now = nowUtcIso();
    task.status = "claimed";
    task.claimed_at = now;
    task.claimed_by = claimer;
    task.lease_until = computeNextRunAtIso(lease_seconds);
    task.updated_at = now;
    await taskPut(env, task);
    return task;
  }
  return null;
}

async function executeTask(env, task) {
  const now = nowUtcIso();
  const input = task.input || "";
  let result = { kind: "task", ok: true, summary: "Task executed (baseline).", echo: input };

  if (input.startsWith("IMAGE_JOB:")) {
    const rest = input.slice("IMAGE_JOB:".length).trim();
    const parts = rest.split("||").map((s) => s.trim()).filter(Boolean);
    const prompt = parts[0] || "";
    let size = "1024x1024";
    for (const p of parts.slice(1)) {
      const m = /^size\s*=\s*(.+)$/i.exec(p);
      if (m) size = m[1].trim();
    }

    const imgId = safeId("img");
    const gen = await openaiImageGenerate(env, { prompt, size });
    if (!gen.ok) {
      result = { ok: false, error: "openai", status: gen.status, details: gen.details };
    } else {
      const r2_key = await saveImageToR2(env, { pngBytes: gen.bytes, id: imgId });
      const meta = {
        id: imgId,
        mime: "image/png",
        r2_key,
        created_at: now,
        prompt,
        size,
        revised_prompt: gen.revised_prompt,
      };
      await setImageMeta(env, imgId, meta);
      result = { kind: "image", ok: true, image: { id: imgId, mime: "image/png", url: `/images/${imgId}?raw=1`, meta } };
    }
  }

  task.status = "succeeded";
  task.result = result;
  task.error = null;
  task.updated_at = now;
  return task;
}

async function finishTask(env, task) {
  await taskPut(env, task);
  return task;
}

async function runDue(env, { max = 5, claimer = "runner" } = {}) {
  const results = [];
  let ran = 0;
  for (let i = 0; i < (max || 5); i++) {
    const task = await claimNextDue(env, claimer, 180);
    if (!task) break;
    const executed = await executeTask(env, task);
    await finishTask(env, executed);
    ran++;
    results.push({ id: executed.id, status: executed.status, ok: executed.result?.ok ?? true, error: executed.result?.error ?? null });
  }
  return { ran, results };
}

// ---- Foundry deploy proxy ----
async function proxyFoundryDeploy(req, env, url) {
  const body = await req.arrayBuffer();
  const diag = url.searchParams.get("diag") === "1";

  const deployer = env.AURA_DEPLOYER;
  if (!deployer || typeof deployer.fetch !== "function") return json({ ok: false, error: "missing_deployer_binding" }, 500);

  if (!env.DEPLOY_SECRET) return json({ ok: false, error: "missing_deploy_secret_binding" }, 500);

  const upstream = await deployer.fetch("https://deployer.internal/deploy" + (diag ? "?diag=1" : ""), {
    method: "POST",
    headers: { "content-type": "application/json", "X-Deploy-Secret": env.DEPLOY_SECRET },
    body,
  });

  const t = await upstream.text();
  let parsed = null;
  try { parsed = JSON.parse(t); } catch { parsed = { raw: t }; }
  return json(parsed, upstream.status);
}

// ---- Core endpoints ----
function capabilitiesPayload(env) {
  return {
    version: "AURA_CORE__2026-01-21__AUTONOMY_STEP_07__FIX_ADMIN_AUTH__01",
    now_utc: nowUtcIso(),
    bindings: {
      AURA_KV: !!env.AURA_KV,
      AURA_ADMIN_TOKEN: !!env.AURA_ADMIN_TOKEN,
      OPENAI_API_KEY: !!env.OPENAI_API_KEY,
      AURA_UPLOADS: !!env.AURA_UPLOADS,
      AURA_DEPLOYER: !!env.AURA_DEPLOYER,
      AURA_CF: !!env.AURA_CF,
      DEPLOY_SECRET: !!env.DEPLOY_SECRET,
    },
    endpoints: [
      { method: "GET", path: "/health", purpose: "status + binding presence" },
      { method: "GET", path: "/core", purpose: "minimal command surface" },
      { method: "POST", path: "/chat", purpose: "accept text/json and return response" },
      { method: "POST", path: "/aura/command", purpose: "same as /chat (operator surface)" },
      { method: "GET", path: "/state", purpose: "truthful self-description" },
      { method: "GET|HEAD", path: "/images/:id", purpose: "image meta; ?raw=1 streams bytes (public)" },
      { method: "GET|HEAD", path: "/images/last", purpose: "last image id shortcut; ?raw=1 streams bytes (public)" },
      { method: "POST", path: "/images/generate", purpose: "generate image (admin)", requires: ["OPENAI_API_KEY", "AURA_UPLOADS", "AURA_KV"] },
      { method: "GET", path: "/admin/capabilities", purpose: "capability registry (admin)" },
      { method: "GET", path: "/admin/logs", purpose: "recent logs (admin)" },
      { method: "POST", path: "/admin/tasks/enqueue", purpose: "enqueue task (admin)" },
      { method: "GET", path: "/admin/tasks", purpose: "list tasks (admin) [status, limit, only_due]" },
      { method: "GET", path: "/admin/tasks/:id", purpose: "get task by id (admin)" },
      { method: "POST", path: "/admin/tasks/claim", purpose: "claim next due queued task (admin)" },
      { method: "POST", path: "/admin/tasks/execute", purpose: "execute claimed task (admin)" },
      { method: "POST", path: "/admin/tasks/run_due", purpose: "loop claim+execute up to N (admin)" },
      { method: "POST", path: "/admin/foundry/deploy", purpose: "compat: proxy to aura-deployer /deploy (admin)" },
    ],
    notes: {
      autonomy: "Step 07 fixes admin auth drift for /admin/foundry/deploy by accepting header aliases and unifying auth. Also proxies deploy via service binding if DEPLOY_SECRET is bound.",
      ui: "No UI work.",
    },
  };
}

async function handleChat(req) {
  const body = await req.text();
  return json({ ok: true, kind: "chat", received: body.slice(0, 8000) });
}

async function handleState(env) {
  return json({ ok: true, service: "aura-core", version: capabilitiesPayload(env).version, now_utc: nowUtcIso(), truthful: true });
}

async function handleHealth(env) {
  return json({
    ok: true,
    service: "aura-core",
    version: capabilitiesPayload(env).version,
    now_utc: nowUtcIso(),
    has_kv: !!env.AURA_KV,
    has_admin_token: !!env.AURA_ADMIN_TOKEN,
    has_openai_key: !!env.OPENAI_API_KEY,
    has_r2: !!env.AURA_UPLOADS,
  });
}

async function handleImageGet(req, env, id, raw) {
  const meta = await getImageMeta(env, id);
  if (!meta) return json({ ok: false, error: "not_found" }, 404);

  if (raw) {
    const obj = await env.AURA_UPLOADS.get(meta.r2_key);
    if (!obj) return json({ ok: false, error: "not_found" }, 404);
    const headers = new Headers();
    headers.set("content-type", meta.mime || "image/png");
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(obj.body, { status: 200, headers });
  }

  return json({ ok: true, image: { id: meta.id, mime: meta.mime, url: `/images/${id}?raw=1`, meta } });
}

async function handleImageLast(req, env, raw) {
  const id = await getLastImageId(env);
  if (!id) return json({ ok: false, error: "not_found" }, 404);
  return handleImageGet(req, env, id, raw);
}

async function handleImageGenerate(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);

  const body = await readJson(req);
  if (body == null) return json({ ok: false, error: "bad_json" }, 400);

  const prompt = normalizeTaskInput(body.prompt);
  const size = normalizeTaskInput(body.size) || "1024x1024";
  if (!prompt) return json({ ok: false, error: "missing_prompt" }, 400);

  const imgId = safeId("img");
  const gen = await openaiImageGenerate(env, { prompt, size });
  if (!gen.ok) return json({ ok: false, error: "openai", status: gen.status, details: gen.details }, 502);

  const r2_key = await saveImageToR2(env, { pngBytes: gen.bytes, id: imgId });
  const meta = { id: imgId, mime: "image/png", r2_key, created_at: nowUtcIso(), prompt, size, revised_prompt: gen.revised_prompt };
  await setImageMeta(env, imgId, meta);

  return json({ ok: true, image: { id: imgId, mime: "image/png", url: `/images/${imgId}?raw=1`, meta } });
}

async function handleAdminCapabilities(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);
  return json({ ok: true, enforced: true, via: "header", capabilities: capabilitiesPayload(env) });
}

async function handleAdminLogs(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);
  return json({ ok: true, logs: [], note: "Logs endpoint is a placeholder in this build." });
}

async function handleTasksList(req, env, url) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);

  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || "10")));
  const statusFilter = (url.searchParams.get("status") || "").trim();
  const onlyDue = url.searchParams.get("only_due") === "1";

  const idx = await tasksIndexGet(env);
  const out = [];
  for (const id of idx) {
    const t = await taskGet(env, id);
    if (!t) continue;
    if (statusFilter && t.status !== statusFilter) continue;
    if (onlyDue && !isDue(t)) continue;
    out.push(t);
    if (out.length >= limit) break;
  }
  return json({ ok: true, tasks: out });
}

async function handleTaskGet(req, env, id) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);
  const t = await taskGet(env, id);
  if (!t) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true, task: t });
}

async function handleTasksEnqueue(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);

  const body = await readJson(req);
  if (body == null) return json({ ok: false, error: "bad_json" }, 400);

  const task = await enqueueTask(env, {
    mode: body.mode || "TASK",
    input: body.input || "",
    max_retries: isObject(body) ? body.max_retries : 5,
    delay_seconds: isObject(body) ? body.delay_seconds : 0,
  });

  return json({ ok: true, task });
}

async function handleTasksClaim(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);

  const body = await readJson(req);
  if (body == null) return json({ ok: false, error: "bad_json" }, 400);
  const claimer = normalizeTaskInput(body.claimer) || "runner";
  const task = await claimNextDue(env, claimer, 180);
  return json({ ok: true, task: task || null });
}

async function handleTasksExecute(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);

  const body = await readJson(req);
  if (body == null) return json({ ok: false, error: "bad_json" }, 400);

  const id = normalizeTaskInput(body.id);
  if (!id) return json({ ok: false, error: "missing_id" }, 400);

  const task = await taskGet(env, id);
  if (!task) return json({ ok: false, error: "not_found" }, 404);
  if (task.status !== "claimed") return json({ ok: false, error: "not_claimed", status: task.status }, 409);

  const executed = await executeTask(env, task);
  await finishTask(env, executed);
  return json({ ok: true, task: executed });
}

async function handleTasksRunDue(req, env) {
  const auth = requireAdmin(req, env);
  if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);

  const body = await readJson(req);
  if (body == null) return json({ ok: false, error: "bad_json" }, 400);

  const max = Number(body.max || body.n || 5) || 5;
  const claimer = normalizeTaskInput(body.claimer) || "runner";
  const ran = await runDue(env, { max, claimer });
  return json({ ok: true, ...ran });
}

async function handleCorePage() {
  return text("Aura Core is running.");
}

async function notFound(path) {
  return json({ ok: false, error: "not_found", path }, 404);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET" && path === "/health") return handleHealth(env);
    if (req.method === "GET" && path === "/state") return handleState(env);
    if (req.method === "GET" && path === "/core") return handleCorePage();

    if ((req.method === "GET" || req.method === "HEAD") && path.startsWith("/images/")) {
      const raw = url.searchParams.get("raw") === "1";
      if (path === "/images/last") return handleImageLast(req, env, raw);
      const id = path.split("/").pop();
      return handleImageGet(req, env, id, raw);
    }

    if (req.method === "POST" && (path === "/chat" || path === "/aura/command")) return handleChat(req);

    if (req.method === "POST" && path === "/images/generate") return handleImageGenerate(req, env);

    if (req.method === "GET" && path === "/admin/capabilities") return handleAdminCapabilities(req, env);
    if (req.method === "GET" && path === "/admin/logs") return handleAdminLogs(req, env);

    if (path === "/admin/tasks" && req.method === "GET") return handleTasksList(req, env, url);
    if (path === "/admin/tasks/enqueue" && req.method === "POST") return handleTasksEnqueue(req, env);
    if (path === "/admin/tasks/claim" && req.method === "POST") return handleTasksClaim(req, env);
    if (path === "/admin/tasks/execute" && req.method === "POST") return handleTasksExecute(req, env);
    if (path === "/admin/tasks/run_due" && req.method === "POST") return handleTasksRunDue(req, env);

    if (path.startsWith("/admin/tasks/") && req.method === "GET") {
      const id = path.split("/").pop();
      return handleTaskGet(req, env, id);
    }

    if (path === "/admin/foundry/deploy" && req.method === "POST") {
      const auth = requireAdmin(req, env);
      if (!auth.ok) return json({ ok: false, error: auth.error, auth_diag: auth.auth_diag }, auth.status);
      return proxyFoundryDeploy(req, env, url);
    }

    return notFound(path);
  },

  async scheduled(event, env, ctx) {
    try { await runDue(env, { max: 5, claimer: "auto" }); } catch {}
  },
};
