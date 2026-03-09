// Aura Core — UI Recovery Build
// Full-file replacement — legacy UI removed
const BUILD = "AURA_CORE__UI_RECOVERY__2026-02-02__fix2";
const BUILD_TS = new Date().toISOString();

// ==== PATCH: Registry commands bypass claim-gate (2026-01-29) ====
function __registryBypass(token) {
  // Only allow read-only registry operations to bypass claim-gate.
  // Any registry *write* (PUT / IMPORT) must be claim-gated by evidence.
  return token === "REGISTRY_GET" ||
         token === "REGISTRY_LIST" ||
         token === "REGISTRY_FILTER";
}
// ================================================================
const UI_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Aura Core</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#0b0f14;color:#e6edf3}
    header{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;gap:10px;align-items:center}
    header .dot{width:10px;height:10px;border-radius:50%;background:#3fb950}
    main{max-width:980px;margin:0 auto;padding:16px}
    .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden}
    .log{padding:14px;min-height:260px;max-height:55vh;overflow:auto;white-space:pre-wrap;word-break:break-word}
    .row{display:flex;gap:10px;padding:12px;border-top:1px solid rgba(255,255,255,.08);align-items:center}
    textarea{flex:1;min-height:44px;max-height:160px;resize:vertical;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#e6edf3;padding:10px}
    button{border:0;border-radius:10px;padding:10px 14px;background:#238636;color:#fff;font-weight:600;cursor:pointer}
    button:disabled{opacity:.6;cursor:not-allowed}
    input[type=file]{color:#9da7b3}
    .meta{opacity:.75;font-size:12px}
    a{color:#58a6ff}
  </style>
</head>
<body>
  <header>
    <span class="dot"></span>
    <div>
      <div><strong>Aura Core</strong></div>
      <div class="meta">UI route ok — POST /chat</div>
    </div>
  </header>

  <main>
    <div class="card">
      <div id="log" class="log"></div>
      <div class="row">
        <input id="file" type="file" />
        <textarea id="msg" placeholder="Type a command (e.g., PING)"></textarea>
        <button id="send">Send</button>
      </div>
    </div>
    <p class="meta">Endpoints: <a href="/chat">/chat</a> (POST), UI: /, /core, /ui</p>
  </main>

<script>
  const log = document.getElementById('log');
  const msg = document.getElementById('msg');
  const send = document.getElementById('send');
  const file = document.getElementById('file');

  function addLine(prefix, text){
    const t = (typeof text === 'string') ? text : JSON.stringify(text, null, 2);
    log.textContent += prefix + " " + t + "\\n\\n";
    log.scrollTop = log.scrollHeight;
  }

  async function postText(body){
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {'content-type':'text/plain; charset=utf-8'},
      body
    });
    const ct = (res.headers.get('content-type')||'');
    let out;
    if (ct.includes('application/json')) out = await res.json();
    else out = await res.text();
    return {status: res.status, out};
  }

  async function postFile(f){
    const buf = await f.arrayBuffer();
    const res = await fetch('/chat', {method:'POST', headers:{'content-type':'application/octet-stream'}, body: buf});
    const ct = (res.headers.get('content-type')||'');
    let out;
    if (ct.includes('application/json')) out = await res.json();
    else out = await res.text();
    return {status: res.status, out};
  }

  send.addEventListener('click', async ()=>{
    send.disabled = true;
    try{
      const f = file.files && file.files[0];
      if (f){
        addLine('>>', '[file] ' + f.name + ' (' + f.size + ' bytes)');
        const r = await postFile(f);
        addLine('<<', r.out);
        file.value = '';
      }
      const t = (msg.value||'').trim();
      if (t){
        addLine('>>', t);
        const r = await postText(t);
        addLine('<<', r.out);
        msg.value = '';
      }
    }catch(e){
      addLine('!!', String(e && e.message ? e.message : e));
    }finally{
      send.disabled = false;
    }
  });

  msg.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      send.click();
    }
  });

  addLine('..', 'Ready.');
</script>
</body>
</html>`;


export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // UI routing (root + /core + /ui)
    if ((request.method === "GET" || request.method === "HEAD") && (url.pathname === "/" || url.pathname === "/core" || url.pathname === "/ui")) {
      const headers = { "content-type": "text/html; charset=utf-8" };
      if (request.method === "HEAD") return new Response(null, { status: 200, headers });
      return new Response(UI_HTML, { status: 200, headers });
    }

// /chat is served; everything else 404
    if (url.pathname !== "/chat") {
      return new Response("Not Found", { status: 404 });
    }

    const body = await request.text();
    const bodyTrim = body.trim();

    // ----------------------------
    // Build / policy markers
    // ----------------------------
    // ----------------------------
    // Operator auth (explicit only)
    // ----------------------------
    const operatorToken = env.AURA_OPERATOR_TOKEN || env.AURA_OP_TOKEN || env.OPERATOR_TOKEN || "";
    const operatorHeader =
      request.headers.get("x-operator-token") ||
      request.headers.get("X-Operator-Token") ||
      "";
    const isOperator = Boolean(operatorToken) && operatorHeader === operatorToken;

    // If a token is configured and a caller presents a token header that does not match,
    // fail closed (prevents accidental success with a wrong token).
    const operatorHeaderPresent = Boolean(operatorHeader);
    const operatorMismatch = Boolean(operatorToken) && operatorHeaderPresent && operatorHeader !== operatorToken;
    if (operatorMismatch) return Response.json({ ok: true, reply: "UNAUTHORIZED" });

    // ----------------------------
    // Commands (global allowlist)
    // ----------------------------
    const allowedCommands = [
      "PING",
      "SHOW_BUILD",
      "SHOW_CLAIM_GATE",
      "SHOW_ALLOWED_COMMANDS",
      "RUN_SELF_TEST_EVIDENCE",
      "VERIFIED_FETCH_URL",
      "CLEAR_VERIFIED_FETCH",
      "EVIDENCE_PRESENT",
      "SNAPSHOT_STATE",
      "HOST_CAPS_GET",
      "HOST_CAPS_SET",
      "DEPLOYER_CAPS",
      "DEPLOYER_CALL",
      "PAUSE",
      "INTENT_ADD",
      "INTENT_GET",
      "INTENT_CLEAR",
      "SHOW_MEMORY_SCHEMA",
      "REGISTRY_PUT",
      "REGISTRY_GET",
      "REGISTRY_LIST",
      "REGISTRY_FILTER",
      "REGISTRY_IMPORT_ASSETS",
      "REGISTRY_IMPORT_DOMAINS",
      "PORTFOLIO_STATUS",
      "AUDIT_GET",
      "AUDIT_CLEAR",
      "CF_ZONE_GET",
      "CF_DNS_LIST",
      "CF_DNS_UPSERT",
    "HERD_STATUS",
    "HERD_SWEEP",
    "HERD_SELF_TEST"
  ];

    // ----------------------------
    // Helpers
    // ----------------------------
    const normalizeHost = (u) => {
      try {
        return new URL(u).host.toLowerCase();
      } catch {
        return null;
      }
    };

    // Accept either a full URL or a bare domain token.
    const normalizeHostLoose = (s) => {
      if (!s) return null;
      const h = normalizeHost(s);
      if (h) return h;
      const t = String(s).trim().toLowerCase();
      if (!t) return null;
      // Basic sanity: must contain a dot and only valid hostname chars.
      if (!t.includes(".")) return null;
      if (!/^[a-z0-9.-]+$/.test(t)) return null;
      return t;
    };

    const extractLastUrl = (txt) => {
      const matches = [...txt.matchAll(/https?:\/\/[^\s]+/g)];
      return matches.length ? matches[matches.length - 1][0] : null;
    };

    // Extract a bare domain mention like example.com (no scheme).
    // Returns the last plausible domain token found in the message.
    const extractLastBareDomain = (txt) => {
      // labels + TLD; excludes trailing punctuation due to \b
      const re =
        /\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)\b/gi;
      const matches = [];
      let m;
      while ((m = re.exec(txt)) !== null) {
        const d = (m[1] || "").toLowerCase();
        if (!d) continue;
        if (d === "localhost") continue;
        matches.push(d);
      }
      return matches.length ? matches[matches.length - 1] : null;
    };

    const statusReachable = (st) => Number(st) >= 200 && Number(st) < 400;
    const evidenceKey = (host) => `verified_fetch:${host}`;
    const capsKey = (host) => `host_caps:${host}`;
    const intentKey = (host, tag) => `intent:${host}:${tag}`;
// ----------------------------
// Memory Substrate v1 (storage-backed; no model memory)
// ----------------------------
const REGISTRY_VERSION = "v1";

const registryKey = (type, id) => `reg:${REGISTRY_VERSION}:${type}:${id}`;
const registryIndexKey = (type) => `reg:${REGISTRY_VERSION}:index:${type}`;
const registryMetaKey = (type) => `reg:${REGISTRY_VERSION}:meta:${type}`;

const auditSeqKey = `audit:${REGISTRY_VERSION}:seq`;
const auditEventKey = (seq) => `audit:${REGISTRY_VERSION}:event:${seq}`;
const auditClearedAtKey = `audit:${REGISTRY_VERSION}:cleared_at`;

const nowIso = () => new Date().toISOString();

const safeJsonParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const auditWrite = async (env, event) => {
  const ts = nowIso();
  const seqRaw = await env.AURA_KV.get(auditSeqKey);
  const seq = Number(seqRaw || 0) + 1;
  await env.AURA_KV.put(auditSeqKey, String(seq));

  const payload = { seq, ts, ...event };

  await env.AURA_KV.put(auditEventKey(seq), JSON.stringify(payload));
  return payload;
};

const auditList = async (env, limit = 50) => {
  const seqRaw = await env.AURA_KV.get(auditSeqKey);
  const seq = Number(seqRaw || 0);
  const out = [];
  const start = Math.max(1, seq - limit + 1);
  for (let i = start; i <= seq; i++) {
    const s = await env.AURA_KV.get(auditEventKey(i));
    if (!s) continue;
    const p = safeJsonParse(s) || s;
    out.push(p);
  }
  return { seq, events: out };
};

const registryGetIndex = async (env, type) => {
  const raw = await env.AURA_KV.get(registryIndexKey(type));
  const parsed = raw ? safeJsonParse(raw) : null;
  if (Array.isArray(parsed)) return parsed;
  return [];
};

const registryPutIndex = async (env, type, ids) => {
  const clean = [...new Set((ids || []).filter((x) => typeof x === "string" && x.trim()))];
  await env.AURA_KV.put(registryIndexKey(type), JSON.stringify(clean));
  await env.AURA_KV.put(
    registryMetaKey(type),
    JSON.stringify({ type, count: clean.length, updated_at: nowIso(), version: REGISTRY_VERSION })
  );
  return clean.length;
};

const registryPut = async (env, type, obj) => {
  if (!obj || typeof obj !== "object") return { ok: false, error: "BAD_REQUEST" };
  const id = String(obj.id || "").trim();
  if (!id) return { ok: false, error: "BAD_REQUEST" };

  const key = registryKey(type, id);
  const stored = {
    ...obj,
    id,
    type,
    updated_at: nowIso(),
    version: REGISTRY_VERSION
  };

  await env.AURA_KV.put(key, JSON.stringify(stored));

  const ids = await registryGetIndex(env, type);
  if (!ids.includes(id)) {
    ids.push(id);
    await registryPutIndex(env, type, ids);
  } else {
    await env.AURA_KV.put(
      registryMetaKey(type),
      JSON.stringify({ type, count: ids.length, updated_at: nowIso(), version: REGISTRY_VERSION })
    );
  }

  await auditWrite(env, { action: "REGISTRY_PUT", type, id });
  return { ok: true, entry: stored };
};

const registryGet = async (env, type, id) => {
  const key = registryKey(type, id);
  const raw = await env.AURA_KV.get(key);
  if (!raw) return null;
  return safeJsonParse(raw) || raw;
};

const registryList = async (env, type, limit = 50) => {
  const ids = await registryGetIndex(env, type);
  const slice = ids.slice(0, Math.max(0, Math.min(limit, 500)));
  const items = [];
  for (const id of slice) {
    const e = await registryGet(env, type, id);
    if (e) items.push(e);
  }
  const metaRaw = await env.AURA_KV.get(registryMetaKey(type));
  const meta = metaRaw ? (safeJsonParse(metaRaw) || metaRaw) : null;
  return { type, meta, ids_count: ids.length, returned: items.length, items };
};

const registryFilter = async (env, type, field, value, limit = 50) => {
  const ids = await registryGetIndex(env, type);
  const out = [];
  for (const id of ids) {
    const e = await registryGet(env, type, id);
    if (!e || typeof e !== "object") continue;
    const v = e[field];
    const match =
      (typeof v === "string" && String(v).toLowerCase() === String(value).toLowerCase()) ||
      (Array.isArray(v) &&
        v.map((x) => String(x).toLowerCase()).includes(String(value).toLowerCase()));
    if (match) out.push(e);
    if (out.length >= Math.max(1, Math.min(limit, 200))) break;
  }
  return { type, field, value, returned: out.length, items: out };
};


const registryFilterWhere = async (env, type, where = {}, limit = 50) => {
  const ids = await registryGetIndex(env, type);
  const out = [];
  const keys = Object.keys(where || {}).filter(Boolean);
  for (const id of ids) {
    const e = await registryGet(env, type, id);
    if (!e || typeof e !== "object") continue;

    let ok = true;
    for (const k of keys) {
      const expected = where[k];
      const actual = e[k];

      if (expected == null) continue;

      // expected can be string/number/bool OR array of allowed values
      const allowed = Array.isArray(expected) ? expected : [expected];

      const match =
        (typeof actual === "string" &&
          allowed.map((x) => String(x).toLowerCase()).includes(String(actual).toLowerCase())) ||
        (typeof actual === "number" &&
          allowed.map((x) => Number(x)).includes(Number(actual))) ||
        (typeof actual === "boolean" &&
          allowed.map((x) => String(x).toLowerCase()).includes(String(actual).toLowerCase())) ||
        (Array.isArray(actual) &&
          actual.map((x) => String(x).toLowerCase()).some((v) =>
            allowed.map((a) => String(a).toLowerCase()).includes(v)
          ));

      if (!match) { ok = false; break; }
    }

    if (ok) out.push(e);
    if (out.length >= Math.max(1, Math.min(limit, 200))) break;
  }
  return { type, where, returned: out.length, items: out };
};

const memorySchemaV1 = {
  version: REGISTRY_VERSION,
  registries: {
    assets: {
      id: "string (recommended: stable slug or numeric string)",
      name: "string",
      pillar: "string",
      notes: "string (optional)",
      tags: "string[] (optional)",
      sellability: "NEVER_SELL | SELLABLE | HOLD | UNKNOWN (optional)",
      patent_cluster: "string (optional)",
      created_at: "iso string (optional)",
      updated_at: "iso string (system)",
      audit: "KV audit events (system)"
    },
    domains: {
      id: "string (domain itself, lowercased)",
      domain: "string",
      pillar: "string",
      purpose: "string (optional)",
      priority: "PHASE1 | PHASE2 | HOLD | UNKNOWN (optional)",
      status: "UNKNOWN | ACTIVE | PARKED | REDIRECT | BROKEN (optional)",
      updated_at: "iso string (system)",
      audit: "KV audit events (system)"
    },
    users: {
      id: "string",
      prefs: "object",
      intents: "object[]",
      updated_at: "iso string"
    }
  }
};

    const jsonReply = (reply) => Response.json({ ok: true, reply });

// ----------------------------
// Deployer Autonomy Surface (operator-gated; host-capped)
// - Exposes ONLY a minimal proxy surface to service bindings.
// - Does NOT claim success for external effects; callers must verify via VERIFIED_FETCH_URL.
// Commands:
//   DEPLOYER_CAPS
//   DEPLOYER_CALL <json>
// JSON shape for DEPLOYER_CALL:
//   {"service":"AURA_DEPLOYER"|"AURA_CF","path":"/admin|/dns|/deploy|...","method":"POST|GET","content_type":"application/json","body":"...raw..."} 
// ----------------------------
const __hasService = (env, name) => {
  try { return Boolean(env && env[name] && typeof env[name].fetch === "function"); } catch { return false; }
};

const __serviceFetch = async (svc, req) => {
  // Service binding fetch expects a Request object (URL may be relative).
  // We use a synthetic base to construct URLs; only pathname matters to the service worker.
  const base = "https://service.local";
  const url = new URL(req.path || "/", base);
  const init = {
    method: (req.method || "POST").toUpperCase(),
    headers: {
      ...(req.headers && typeof req.headers === "object" ? req.headers : {}),
      ...(req.content_type ? { "content-type": req.content_type } : {})
    },
    body: req.body != null ? req.body : undefined
  };
  const r = await svc.fetch(new Request(url.toString(), init));
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  let out;
  if (ct.includes("application/json")) out = await r.json();
  else out = await r.text();
  return { http_status: r.status, content_type: ct || null, out };
};

const __deployerCaps = (env) => {
  const hasDeployer = __hasService(env, "AURA_DEPLOYER");
  const hasCf = __hasService(env, "AURA_CF");
  return {
    ok: hasDeployer || hasCf,
    bindings: { AURA_DEPLOYER: hasDeployer, AURA_CF: hasCf },
    surface: [
      "DEPLOYER_CALL service=AURA_DEPLOYER path/method/body (operator-only)",
      "DEPLOYER_CALL service=AURA_CF path/method/body (operator-only)"
    ],
    requirement: "Caller must verify externally via VERIFIED_FETCH_URL; no implicit 'success' claims."
  };
};



    
// ----------------------------
// Cloudflare DNS (direct API via CF_API_TOKEN)
// Commands:
//   CF_ZONE_GET [domain]
//   CF_DNS_LIST [domain]
//   CF_DNS_UPSERT <jsonRecord>
// Requires:
//   operator token (operator === true)
//   evidencePresent === true (set by VERIFIED_FETCH_URL / EVIDENCE_PRESENT)
//   env.CF_API_TOKEN secret set (wrangler secret put CF_API_TOKEN)
const __cfApi = async (env, method, path, body) => {
  const token = (env && env.CF_API_TOKEN) ? String(env.CF_API_TOKEN) : "";
  if (!token) return { ok: false, error: "MISSING_CF_API_TOKEN" };

  const url = "https://api.cloudflare.com/client/v4" + path;
  const init = {
    method,
    headers: {
      "authorization": "Bearer " + token,
      "content-type": "application/json"
    }
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const r = await fetch(url, init);
  let j = null;
  try { j = await r.json(); } catch { j = { ok: false, error: "NON_JSON_RESPONSE", status: r.status }; }
  return { http_status: r.status, ...(j || {}) };
};

const __cfZoneIdFor = async (env, domain) => {
  const key = "cf:zone_id:" + domain;
  try {
    const cached = await env.AURA_KV.get(key);
    if (cached) return { ok: true, zone_id: cached, cached: true };
  } catch {}

  const q = encodeURIComponent(domain);
  const res = await __cfApi(env, "GET", "/zones?name=" + q, undefined);
  if (!res || res.ok !== true || !Array.isArray(res.result) || res.result.length === 0) {
    return { ok: false, error: "ZONE_NOT_FOUND", details: res };
  }
  const zone = res.result[0];
  try { await env.AURA_KV.put(key, zone.id); } catch {}
  return { ok: true, zone_id: zone.id, cached: false, zone };
};

const __cfDnsList = async (env, zone_id, params) => {
  const qs = params ? ("?" + new URLSearchParams(params).toString()) : "";
  return await __cfApi(env, "GET", "/zones/" + zone_id + "/dns_records" + qs, undefined);
};

const __cfDnsUpsert = async (env, zone_id, rec) => {
  const type = String(rec.type || "").toUpperCase();
  const name = String(rec.name || "");
  if (!type || !name) return { ok: false, error: "BAD_RECORD", rec };

  const found = await __cfDnsList(env, zone_id, { type, name, per_page: "100" });
  if (found && found.ok === true && Array.isArray(found.result) && found.result.length > 0) {
    const id = found.result[0].id;
    const putRes = await __cfApi(env, "PUT", "/zones/" + zone_id + "/dns_records/" + id, rec);
    return { action: "UPDATED", record_id: id, ...putRes };
  }
  const postRes = await __cfApi(env, "POST", "/zones/" + zone_id + "/dns_records", rec);
  return { action: "CREATED", ...postRes };
};

// ----------------------------
    // Strict allowlist: unknown single-token command => UNKNOWN_COMMAND
    // ----------------------------
    if (/^[A-Z0-9_]+$/.test(bodyTrim) && !allowedCommands.includes(bodyTrim)) {
      return jsonReply("UNKNOWN_COMMAND");
    }

    // ----------------------------
    // Simple commands
    // ----------------------------
    if (bodyTrim === "PING") return jsonReply("PONG");

    if (bodyTrim === "SHOW_ALLOWED_COMMANDS") {
      return jsonReply(JSON.stringify(allowedCommands, null, 2));
    }

    if (bodyTrim === "SHOW_BUILD") {
      return jsonReply(
        JSON.stringify({ build: BUILD, stamp: new Date().toISOString() }, null, 2)
      );
    }

    if (bodyTrim === "SHOW_CLAIM_GATE") {
      return jsonReply(
        JSON.stringify(
          {
            trigger_words: [
              "live",
              "deployed",
              "launched",
              "resolving",
              "propagating",
              "successful",
              "verified",
              "up",
              "online",
              "working",
              "reachable",
              "available",
              "accessible"
            ],
            forced_message: "NOT WIRED: VERIFIED_FETCH REQUIRED",
            requires_verified_fetch_format: true
          },
          null,
          2
        )
      );
    }

if (bodyTrim === "SHOW_MEMORY_SCHEMA") {
  return jsonReply(JSON.stringify(memorySchemaV1, null, 2));
}

if (bodyTrim === "PORTFOLIO_STATUS") {
  const assetsMetaRaw = await env.AURA_KV.get(registryMetaKey("assets"));
  const domainsMetaRaw = await env.AURA_KV.get(registryMetaKey("domains"));
  const assetsMeta = assetsMetaRaw ? (safeJsonParse(assetsMetaRaw) || assetsMetaRaw) : null;
  const domainsMeta = domainsMetaRaw ? (safeJsonParse(domainsMetaRaw) || domainsMetaRaw) : null;

  const status = {
    build: BUILD,
    stamp: nowIso(),
    registry_version: REGISTRY_VERSION,
    registries: {
      assets: assetsMeta || { type: "assets", count: 0, updated_at: null, version: REGISTRY_VERSION },
      domains: domainsMeta || { type: "domains", count: 0, updated_at: null, version: REGISTRY_VERSION }
    }
  };

  return jsonReply(JSON.stringify(status, null, 2));
}

if (bodyTrim === "AUDIT_GET") {
  const payload = await auditList(env, 50);
  return jsonReply(JSON.stringify(payload, null, 2));
}

    if (bodyTrim === "PAUSE") {
      return jsonReply("PAUSED");
    }

    // ----------------------------
    // Parse message lines (multi-line command batches)
    // ----------------------------
    const lines = body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let didRegistryWrite = false;

    // ----------------------------
    // Host context for domain-scoped capability routing
    // ----------------------------
    let explicitHost = null;
    for (const line of lines) {
      if (line.startsWith("HOST ")) {
        const parts = line.split(" ").filter(Boolean);
        if (parts[1]) explicitHost = parts[1].toLowerCase();
      }
    }

    const askedUrl = extractLastUrl(body);
    const askedHostFromUrl = askedUrl ? normalizeHost(askedUrl) : null;

    // If no URL was provided, try to extract a bare domain mention from the message.
    const askedHostFromBare = askedHostFromUrl ? null : extractLastBareDomain(body);

    // Prefer explicit HOST context for "active host", but for questions we will prefer the asked host.
    const askedHost = askedHostFromUrl || askedHostFromBare || null;
    const activeHost = explicitHost || askedHost || null;

    const getHostCaps = async (host) => {
      if (!host) return null;
      const stored = await env.AURA_KV.get(capsKey(host));
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.allowed)) return parsed;
        return null;
      } catch {
        return null;
      }
    };

    const hostCaps = await getHostCaps(activeHost);

    const isAllowedForHost = (cmd) => {
      if (!hostCaps) return true;
      return hostCaps.allowed.includes(cmd);
    };

    // ----------------------------
    // Operator-only: HOST_CAPS_SET (supports multiple lines)
    // ----------------------------
    let hostCapsSetCount = 0;

    for (const line of lines) {
      if (!line.startsWith("HOST_CAPS_SET")) continue;

      if (!isOperator) return jsonReply("UNAUTHORIZED");

      const m = line.match(/^HOST_CAPS_SET\s+(\S+)\s+(.+)$/);
      if (!m) return jsonReply("BAD_REQUEST");

      const host = m[1].toLowerCase();

      try {
        const arr = JSON.parse(m[2]);
        if (!Array.isArray(arr) || !arr.every((x) => typeof x === "string")) {
          return jsonReply("BAD_REQUEST");
        }

        const clean = [...new Set(arr)].filter((c) => allowedCommands.includes(c));

        await env.AURA_KV.put(
          capsKey(host),
          JSON.stringify({ host, allowed: clean, updated_at: new Date().toISOString() })
        );

        hostCapsSetCount += 1;
      } catch {
        return jsonReply("BAD_REQUEST");
      }
    }

    if (hostCapsSetCount > 0) {
      return jsonReply(hostCapsSetCount === 1 ? "OK" : `OK (${hostCapsSetCount})`);
    }

    // HOST_CAPS_GET <host>
    for (const line of lines) {
      if (line.startsWith("HOST_CAPS_GET")) {
        const parts = line.split(" ").filter(Boolean);
        const host = (parts[1] || activeHost || "").toLowerCase();
        if (!host) return jsonReply("BAD_REQUEST");
        const caps = await getHostCaps(host);
        return jsonReply(JSON.stringify(caps || { host, allowed: null }, null, 2));
      }
    }

    // SNAPSHOT_STATE (safe subset)
    if (bodyTrim === "SNAPSHOT_STATE") {
      const safeHost = activeHost || "none";
      const caps = await getHostCaps(activeHost);
      const stored = activeHost ? await env.AURA_KV.get(evidenceKey(activeHost)) : null;

      const snapshot = {
        build: BUILD,
        stamp: new Date().toISOString(),
        operator: isOperator ? "YES" : "NO",
        active_host: safeHost,
        host_caps: caps || null,
        evidence_present_for_active_host: Boolean(stored)
      };

      return jsonReply(JSON.stringify(snapshot, null, 2));
    }

    // If host caps exist and a line starts with a command that isn't allowed for this host, block deterministically.
    for (const line of lines) {
      const token = line.split(" ")[0];
      if (allowedCommands.includes(token) && !isAllowedForHost(token)) {
        return jsonReply("NOT_ALLOWED");
      }
    }

// ----------------------------
// BATCH EXECUTION (ordered, multi-command)
// Purpose: allow VERIFIED_FETCH + REGISTRY_PUT/GET + AUDIT_GET + PORTFOLIO_STATUS in ONE request.
// Avoid early-returns from hasLine() helpers.
// ----------------------------
const isBatch = lines.length > 1 && lines.some((l) => {
  const tok = l.split(" ")[0];
  return tok === "VERIFIED_FETCH_URL" ||
         tok.startsWith("REGISTRY_") ||
         tok === "AUDIT_GET" || tok === "AUDIT_CLEAR" ||
         tok === "PORTFOLIO_STATUS" ||
         tok === "SHOW_MEMORY_SCHEMA" ||
         tok === "SNAPSHOT_STATE" ||
         tok === "EVIDENCE_PRESENT" ||
         tok === "CLEAR_VERIFIED_FETCH";
});

const doVerifiedFetch = async (target) => {
  const host = normalizeHost(target);
  if (!host) return { ok: false, error: "BAD_REQUEST", url: target, http_status: 0 };

  const runFetch = async (probeUrl) => {
    const res = await fetch(probeUrl);
    const text = await res.text();
    return { res, text };
  };

  const nowTs = new Date().toISOString();
  const selfHost = new URL(request.url).host.toLowerCase();

  if (host === selfHost) {
    const evidence = {
      ok: true,
      host,
      url: target,
      probe_url: null,
      http_status: 200,
      first_line_html: "SELF_HOST_SYNTHETIC_EVIDENCE",
      body_length: 0,
      synthetic: true,
      reason: "WORKER_SELF_ROUTE_ASSUME_REACHABLE",
      diagnostics: { cf: request.cf || null, self_host: selfHost, ts: nowTs }
    };
    await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
    return evidence;
  }

  try {
    const { res: res1, text: text1 } = await runFetch(target);

    if (res1.status === 525) {
      const u = new URL(target);
      if (u.protocol === "https:") {
        u.protocol = "http:";
        const httpUrl = u.toString();
        const { res: res2, text: text2 } = await runFetch(httpUrl);

        const evidence = {
          ok: true,
          host,
          public_url: target,
          probe_url: httpUrl,
          fallback_reason: "CF_HTTPS_525_HTTP_PROBE",
          http_status: res2.status,
          first_line_html: text2.split("\n")[0] || "",
          body_length: text2.length,
          diagnostics: { cf: request.cf || null, https_status: 525, ts: nowTs }
        };
        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        return evidence;
      }
    }

    const evidence = {
      ok: true,
      host,
      url: target,
      http_status: res1.status,
      first_line_html: text1.split("\n")[0] || "",
      body_length: text1.length,
      diagnostics: { cf: request.cf || null, ts: nowTs }
    };
    await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
    return evidence;
  } catch (err) {
    const evidence = {
      ok: false,
      host,
      url: target,
      http_status: 0,
      error: String(err?.message || err),
      error_name: err?.name || "UNKNOWN",
      diagnostics: { cf: request.cf || null, ts: nowTs }
    };
    await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
    return evidence;
  }
};

if (isBatch) {
  const out = [];
  const push = (cmd, payload) => out.push({ cmd, payload });
      
  // Track which hosts were VERIFIED_FETCH_URL seeded in THIS request only.
  const __seededThisRequest = new Set();
// Claim-gate (batch mode): registry writes for a domain require VERIFIED_FETCH evidence for that domain's host.
      const __evidenceCache = new Map(); // host -> evidence payload

      const __getHostEvidence = async (host) => {
        const h = String(host || "").trim().toLowerCase();
        if (!h) return null;
        if (__evidenceCache.has(h)) return __evidenceCache.get(h);
        try {
          const ev = await env.AURA_KV.get(evidenceKey(h), { type: "json" });
          if (ev) __evidenceCache.set(h, ev);
          return ev || null;
        } catch (_) {
          return null;
        }
      };

      const __noteHostEvidence = (host, evidence) => {
        const h = String(host || "").trim().toLowerCase();
        if (!h) return;
        __evidenceCache.set(h, evidence || { ok: true, host: h });
      };

      const __domainHostFromRegistryEntry = (type, item) => {
        try {
          if (!item || typeof item !== "object") return null;
          if (type === "domains") return (item.domain || item.id || "").toString();
          if (type === "assets") {
            return (item.domain_id || (Array.isArray(item.domains) && item.domains[0]) || "").toString();
          }
          return null;
        } catch (_) {
          return null;
        }
      };


  // Execute in the order provided.
  for (const line of lines) {
    if (line.startsWith("HOST ")) continue;

    // Operator-only command gate (fail closed)
    const opOnly =
      line === "AUDIT_GET" ||
      line === "AUDIT_CLEAR" ||
      line.startsWith("VERIFIED_FETCH_URL") ||
      line.startsWith("CLEAR_VERIFIED_FETCH") ||
      line === "EVIDENCE_PRESENT" ||
      line.startsWith("HOST_CAPS_") ||
      line === "CF_ZONE_GET" ||
      line.startsWith("CF_ZONE_GET ") ||
      line === "CF_DNS_LIST" ||
      line.startsWith("CF_DNS_LIST ") ||
      line.startsWith("CF_DNS_UPSERT ");

    if (opOnly) {
      if (!operatorToken) return jsonReply("OPERATOR_TOKEN_NOT_CONFIGURED");
      if (!isOperator) return jsonReply("UNAUTHORIZED");
    }


    
    if (line === "HERD_STATUS") {
      if (!isOperator) { push("HERD_STATUS", "NOT_OPERATOR"); continue; }
      const cfg = await registryGet(env, "config", "herd.hosts");
      const hosts = (cfg && Array.isArray(cfg.hosts)) ? cfg.hosts : [];
      const status = [];
      for (const h of hosts) {
        const host = normalizeHostLoose(h);
        if (!host) continue;
        const caps = await getHostCaps(host);
        const ev = await __getHostEvidence(host);
        status.push({
          host,
          caps_allowed: (caps && Array.isArray(caps.allowed)) ? caps.allowed.length : 0,
          evidence_ok: !!(ev && ev.ok),
          evidence_ts: ev && ev.diagnostics && ev.diagnostics.ts ? ev.diagnostics.ts : (ev && ev.ts ? ev.ts : null)
        });
      }
      push("HERD_STATUS", { ok: true, hosts, status });
      continue;
    }

    if (line === "HERD_SWEEP") {
      if (!isOperator) { push("HERD_SWEEP", "NOT_OPERATOR"); continue; }
      const cfg = await registryGet(env, "config", "herd.hosts");
      const hosts = (cfg && Array.isArray(cfg.hosts)) ? cfg.hosts : [];
      const results = [];
      for (const h of hosts) {
        const host = normalizeHostLoose(h);
        if (!host) continue;
        // Enforce per-host caps: herd only runs on hosts that allow VERIFIED_FETCH_URL
        const caps = await getHostCaps(host);
        const allowed = caps && Array.isArray(caps.allowed) ? caps.allowed : [];
        if (!allowed.includes("VERIFIED_FETCH_URL")) {
          results.push({ host, ok: false, error: "HOST_CAPS_BLOCKED_VERIFIED_FETCH_URL" });
          continue;
        }
        const ev = await doVerifiedFetch("https://" + host);
        results.push({ host, ok: !!(ev && ev.ok), evidence: ev });
      }
      push("HERD_SWEEP", { ok: true, hosts, results });
      continue;
    }

    if (line === "HERD_SELF_TEST") {
      if (!isOperator) { push("HERD_SELF_TEST", "NOT_OPERATOR"); continue; }
      const cfg = await registryGet(env, "config", "herd.hosts");
      const hosts = (cfg && Array.isArray(cfg.hosts)) ? cfg.hosts : [];
      const results = [];
      for (const h of hosts) {
        const host = normalizeHostLoose(h);
        if (!host) continue;
        const caps = await getHostCaps(host);
        const allowed = caps && Array.isArray(caps.allowed) ? caps.allowed : [];
        const canFetch = allowed.includes("VERIFIED_FETCH_URL");
        const canAudit = allowed.includes("AUDIT_GET");
        const row = { host, canFetch, canAudit, fetch_ok: false, audit_ok: false };
        if (canFetch) {
          const ev = await doVerifiedFetch("https://" + host);
          row.fetch_ok = !!(ev && ev.ok);
        }
        if (canAudit) {
          const a = await auditGet(env, host);
          row.audit_ok = !!(a && typeof a === "object");
          row.audit_seq = a && typeof a.seq === "number" ? a.seq : null;
        }
        results.push(row);
      }
      const pass = results.filter(r => r.fetch_ok && (r.canAudit ? r.audit_ok : true)).length;
      push("HERD_SELF_TEST", { ok: true, hosts, pass, total: results.length, results });
      continue;
    }

if (line.startsWith("CLEAR_VERIFIED_FETCH")) {
      const parts = line.split(" ").filter(Boolean);
      const host = normalizeHost(parts[1]);
      if (host) await env.AURA_KV.delete(evidenceKey(host));
      push("CLEAR_VERIFIED_FETCH", host ? "CLEARED" : "BAD_REQUEST");
      continue;
    }

    if (line.startsWith("VERIFIED_FETCH_URL")) {
      const parts = line.split(" ").filter(Boolean);
      const target = parts[1];
      const ev = await doVerifiedFetch(target);
      push("VERIFIED_FETCH_URL", ev);
      if (ev && ev.ok && ev.host) { __seededThisRequest.add(String(ev.host).toLowerCase()); }
      continue;
    }

    if (line.startsWith("EVIDENCE_PRESENT")) {
      const parts = line.split(" ").filter(Boolean);
      const host = normalizeHostLoose(parts[1]) || activeHost;
      if (!host) { push("EVIDENCE_PRESENT", "BAD_REQUEST"); continue; }
      const stored = await env.AURA_KV.get(evidenceKey(host));
      push("EVIDENCE_PRESENT", stored ? (safeJsonParse(stored) || stored) : "NO_EVIDENCE");


if (line.startsWith("CF_ZONE_GET")) {
  if (!isOperator) { push("CF_ZONE_GET", "UNAUTHORIZED"); continue; }
  if (!evidencePresent) { push("CF_ZONE_GET", "NOT_VERIFIED"); continue; }
  const parts = line.split(" ").filter(Boolean);
  const domain = normalizeHostLoose(parts[1]) || activeHost;
  if (!domain) { push("CF_ZONE_GET", "BAD_REQUEST"); continue; }
  const zid = await __cfZoneIdFor(env, domain);
  push("CF_ZONE_GET", zid);
  continue;
}

if (line.startsWith("CF_DNS_LIST")) {
  if (!isOperator) { push("CF_DNS_LIST", "UNAUTHORIZED"); continue; }
  if (!evidencePresent) { push("CF_DNS_LIST", "NOT_VERIFIED"); continue; }
  const parts = line.split(" ").filter(Boolean);
  const domain = normalizeHostLoose(parts[1]) || activeHost;
  if (!domain) { push("CF_DNS_LIST", "BAD_REQUEST"); continue; }
  const zid = await __cfZoneIdFor(env, domain);
  if (!zid || zid.ok !== true) { push("CF_DNS_LIST", zid); continue; }
  const list = await __cfDnsList(env, zid.zone_id, { per_page: "100" });
  push("CF_DNS_LIST", { zone_id: zid.zone_id, dns: list });
  continue;
}

if (line.startsWith("CF_DNS_UPSERT ")) {
  if (!isOperator) { push("CF_DNS_UPSERT", "UNAUTHORIZED"); continue; }
  if (!evidencePresent) { push("CF_DNS_UPSERT", "NOT_VERIFIED"); continue; }
  const jsonText = line.slice("CF_DNS_UPSERT ".length);
  const rec = safeJsonParse(jsonText);
  if (!rec) { push("CF_DNS_UPSERT", "BAD_JSON"); continue; }
  // Determine zone from record name; fallback to activeHost
  const domain = normalizeHostLoose(rec.zone) || activeHost;
  if (!domain) { push("CF_DNS_UPSERT", "BAD_REQUEST"); continue; }
  const zid = await __cfZoneIdFor(env, domain);
  if (!zid || zid.ok !== true) { push("CF_DNS_UPSERT", zid); continue; }
  const up = await __cfDnsUpsert(env, zid.zone_id, rec);
  push("CF_DNS_UPSERT", { zone_id: zid.zone_id, result: up });
  continue;
}

      continue;
    }

    if (line === "SHOW_MEMORY_SCHEMA") {
      push("SHOW_MEMORY_SCHEMA", memorySchemaV1);
      continue;
    }

    if (line === "AUDIT_GET") {
      if (!isOperator) { out.push({ cmd: "AUDIT_GET", payload: "UNAUTHORIZED" }); continue; }
      push("AUDIT_GET", await auditList(env, 50));
      continue;
    }

    if (line === "AUDIT_CLEAR") {
      if (!isOperator) { out.push({ cmd: "AUDIT_CLEAR", payload: "UNAUTHORIZED" }); continue; }
      // Require a VERIFIED_FETCH seed for the active host before allowing audit mutation.
      if (!activeHost) { out.push({ cmd: "AUDIT_CLEAR", payload: "BAD_REQUEST" }); continue; }
      // Require VERIFIED_FETCH for this host (either seeded in this request OR already present in KV).
      if (!__seededThisRequest.has(String(activeHost).toLowerCase())) {
        const ev = await __getHostEvidence(activeHost);
        if (!ev || ev.ok !== true) { out.push({ cmd: "AUDIT_CLEAR", payload: "NOT_WIRED: VERIFIED_FETCH REQUIRED" }); continue; }
      }
      // IMPORTANT: clearing should never crash the Worker.
      // We clear by resetting the sequence pointer; old event keys become unreachable.
      try {
        await env.AURA_KV.put(auditSeqKey, "0");
        await env.AURA_KV.put(auditClearedAtKey, nowIso());
        out.push({ cmd: "AUDIT_CLEAR", payload: { ok: true, cleared: true } });
      } catch (e) {
        out.push({ cmd: "AUDIT_CLEAR", payload: { ok: false, error: "EXCEPTION", message: String(e && e.message ? e.message : e) } });
      }
      continue;
    }

    if (line === "PORTFOLIO_STATUS") {
      const assetsMetaRaw = await env.AURA_KV.get(registryMetaKey("assets"));
      const domainsMetaRaw = await env.AURA_KV.get(registryMetaKey("domains"));
      const assetsMeta = assetsMetaRaw ? (safeJsonParse(assetsMetaRaw) || assetsMetaRaw) : null;
      const domainsMeta = domainsMetaRaw ? (safeJsonParse(domainsMetaRaw) || domainsMetaRaw) : null;

      const status = {
        build: BUILD,
        stamp: nowIso(),
        registry_version: REGISTRY_VERSION,
        registries: {
          assets: assetsMeta || { type: "assets", count: 0, updated_at: null, version: REGISTRY_VERSION },
          domains: domainsMeta || { type: "domains", count: 0, updated_at: null, version: REGISTRY_VERSION }
        }
      };
      push("PORTFOLIO_STATUS", status);
      continue;
    }

    if (line.startsWith("REGISTRY_PUT ")) {
      if (!isOperator) { push("REGISTRY_PUT", "NOT_ALLOWED"); continue; }
      const jsonPart = line.slice("REGISTRY_PUT ".length).trim();
      const payload = safeJsonParse(jsonPart);
      const type = payload?.type;
      const item = payload?.item;
      if (!type || !item || !item.id) { push("REGISTRY_PUT", "BAD_REQUEST"); continue; }
      const _t = String(type).toLowerCase();
      const _hostToGate = __domainHostFromRegistryEntry(_t, item);
      if (_hostToGate && (_t === "domains" || _t === "assets")) {
        const _ev = await __getHostEvidence(_hostToGate);
        if (!_ev) { push("REGISTRY_PUT", "NOT_ALLOWED"); continue; }
      }
      const put = await registryPut(env, _t, item);
      push("REGISTRY_PUT", put);
      continue;
    }

    if (line.startsWith("REGISTRY_IMPORT_ASSETS")) {
      if (!isOperator) { push("REGISTRY_IMPORT_ASSETS", "NOT_ALLOWED"); continue; }
      // Leverage existing import handlers by reusing bodyTrim path if needed.
      const raw = body.replace(/^REGISTRY_IMPORT_ASSETS\s*/i, "").trim();
      const parsed = safeJsonParse(raw);
      if (!parsed) { push("REGISTRY_IMPORT_ASSETS", "BAD_REQUEST"); continue; }
      const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : null);
      if (!items) { push("REGISTRY_IMPORT_ASSETS", "BAD_REQUEST"); continue; }
      // run core import
      const idsBefore = await registryGetIndex(env, "assets");
      const ids = [...idsBefore];
      let upserts = 0;
      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        const assetId = String(it.id || "").trim();
        if (!assetId) continue;
        const entry = {
          id: assetId,
          name: String(it.name || it.title || it.id || "").trim() || assetId,
          pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
          notes: String(it.notes || "").trim(),
          tags: Array.isArray(it.tags) ? it.tags : [],
          sellability: String(it.sellability || "UNKNOWN").trim(),
          patent_cluster: String(it.patent_cluster || "").trim()
        };
        const put = await registryPut(env, "assets", entry);
        if (put.ok) {
          upserts += 1;
          if (!ids.includes(entry.id)) ids.push(entry.id);
        }
      }
      await registryPutIndex(env, "assets", ids);
      await auditWrite(env, { action: "REGISTRY_IMPORT", type: "assets", details: { upserts } });
      push("REGISTRY_IMPORT_ASSETS", { ok: true, type: "assets", upserts, total_index_count: ids.length, stamp: nowIso() });
      continue;
    }

    if (line.startsWith("REGISTRY_IMPORT_DOMAINS")) {
      if (!isOperator) { push("REGISTRY_IMPORT_DOMAINS", "NOT_ALLOWED"); continue; }
      const raw = body.replace(/^REGISTRY_IMPORT_DOMAINS\s*/i, "").trim();
      const parsed = safeJsonParse(raw);
      if (!parsed) { push("REGISTRY_IMPORT_DOMAINS", "BAD_REQUEST"); continue; }
      const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : null);
      if (!items) { push("REGISTRY_IMPORT_DOMAINS", "BAD_REQUEST"); continue; }

      const idsBefore = await registryGetIndex(env, "domains");
      const ids = [...idsBefore];
      let upserts = 0;
      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        const domainId = String(it.id || it.domain || "").trim().toLowerCase();
        if (!domainId) continue;
        const entry = {
          id: domainId,
          domain: String(it.domain || it.id || domainId).toLowerCase(),
          pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
          purpose: String(it.purpose || it.notes || "").trim(),
          priority: String(it.priority || "UNKNOWN").trim(),
          status: String(it.status || "UNKNOWN").trim()
        };
        const put = await registryPut(env, "domains", entry);
        if (put.ok) {
          upserts += 1;
          if (!ids.includes(entry.id)) ids.push(entry.id);
        }
      }
      await registryPutIndex(env, "domains", ids);
      await auditWrite(env, { action: "REGISTRY_IMPORT", type: "domains", details: { upserts } });
      push("REGISTRY_IMPORT_DOMAINS", { ok: true, type: "domains", upserts, total_index_count: ids.length, stamp: nowIso() });
      continue;
    }

    if (line.startsWith("REGISTRY_IMPORT ")) {
      if (!isOperator) { push("REGISTRY_IMPORT", "NOT_ALLOWED"); continue; }
      const jsonPart = line.slice("REGISTRY_IMPORT ".length).trim();
      const payload = safeJsonParse(jsonPart);
      const typeName = String(payload?.type || "").toLowerCase().trim();
      const normalized =
        typeName === "asset" || typeName === "assets" ? "assets" :
        typeName === "domain" || typeName === "domains" ? "domains" : "";
      const items = Array.isArray(payload?.items) ? payload.items : null;
      if (!normalized || !items) { push("REGISTRY_IMPORT", "BAD_REQUEST"); continue; }
      // Reuse the same import core logic by calling the generic function already defined below via registryPut loops would be verbose;
      // keep simple: write through registryPut in a tight loop.
      const idsBefore = await registryGetIndex(env, normalized);
      const ids = [...idsBefore];
      let upserts = 0;
      for (const it of items) {
        if (!it || typeof it !== "object") continue;
        if (normalized === "domains") {
          const domainId = String(it.id || it.domain || "").trim().toLowerCase();
          if (!domainId) continue;
          const entry = {
            id: domainId,
            domain: String(it.domain || it.id || domainId).toLowerCase(),
            pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
            purpose: String(it.purpose || it.notes || "").trim(),
            priority: String(it.priority || "UNKNOWN").trim(),
            status: String(it.status || "UNKNOWN").trim()
          };
          const put = await registryPut(env, "domains", entry);
          if (put.ok) { upserts += 1; if (!ids.includes(entry.id)) ids.push(entry.id); }
        } else {
          const assetId = String(it.id || "").trim();
          if (!assetId) continue;
          const entry = {
            id: assetId,
            name: String(it.name || it.title || it.id || "").trim() || assetId,
            pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
            notes: String(it.notes || "").trim(),
            tags: Array.isArray(it.tags) ? it.tags : [],
            sellability: String(it.sellability || "UNKNOWN").trim(),
            patent_cluster: String(it.patent_cluster || "").trim()
          };
          const put = await registryPut(env, "assets", entry);
          if (put.ok) { upserts += 1; if (!ids.includes(entry.id)) ids.push(entry.id); }
        }
      }
      await registryPutIndex(env, normalized, ids);
      await auditWrite(env, { action: "REGISTRY_IMPORT", type: normalized, details: { upserts } });
      push("REGISTRY_IMPORT", { ok: true, type: normalized, upserts, total_index_count: ids.length, stamp: nowIso() });
      continue;
    }

    if (line.startsWith("REGISTRY_GET")) {
      const parts = line.split(" ").filter(Boolean);
      const type = String(parts[1] || "").toLowerCase();
      const id = String(parts[2] || "").trim();
      if (!type || !id) { push("REGISTRY_GET", "BAD_REQUEST"); continue; }
      const e = await registryGet(env, type, id);
      push(`REGISTRY_GET ${type} ${id}`, e ? e : "MISSING");
      continue;
    }

    if (line.startsWith("REGISTRY_LIST")) {
      const parts = line.split(" ").filter(Boolean);
      const type = String(parts[1] || "").toLowerCase();
      const limit = Number(parts[2] || 50);

      // Allow bare REGISTRY_LIST to return an overview (useful for autonomy flows)
      if (!type) {
        const types = ["assets", "domains"];
        const overview = {};
        for (const t of types) {
          try {
            const ids = await registryGetIndex(env, t);
            overview[t] = { type: t, count: ids.length };
          } catch (e) {
            overview[t] = { type: t, count: null, error: String(e && e.message ? e.message : e) };
          }
        }
        push("REGISTRY_LIST", { registries: overview });
        continue;
      }

      const payload = await registryList(env, type, limit);
      push(`REGISTRY_LIST ${type}`, payload);
      continue;
    }

    if (line.startsWith("REGISTRY_FILTER")) {
      const raw = line.slice("REGISTRY_FILTER".length).trim();
      let type = "";
      let field = "";
      let value = "";
      let limit = 50;
      let where = null;

      if (raw.startsWith("{")) {
        const obj = safeJsonParse(raw);
        if (!obj || typeof obj !== "object") { push("REGISTRY_FILTER", "BAD_REQUEST"); continue; }
        type = String(obj.type || "").toLowerCase();
        limit = Number(obj.limit || 50);
        if (obj.where && typeof obj.where === "object") {
          where = obj.where;
        } else {
          field = String(obj.field || "").trim();
          value = String(obj.value ?? "").trim();
        }
      } else {
        const parts = line.split(" ").filter(Boolean);
        type = String(parts[1] || "").toLowerCase();
        field = String(parts[2] || "").trim();
        value = String(parts[3] || "").trim();
        limit = Number(parts[4] || 50);
      }

      if (!type) { push("REGISTRY_FILTER", "BAD_REQUEST"); continue; }
      const payload = where
        ? await registryFilterWhere(env, type, where, limit)
        : await registryFilter(env, type, field, value, limit);

      // Allow "REGISTRY_FILTER <type>" (no field/value) as a convenience alias for listing that type
      if (!where && (!field || !value)) {
        const payload2 = await registryList(env, type, limit);
        push(`REGISTRY_FILTER ${type}`, payload2);
        continue;
      }

      push(`REGISTRY_FILTER ${type}`, payload);
      continue;
    }

    if (line === "SNAPSHOT_STATE") {
      const safeHost = activeHost || "none";
      const caps = await getHostCaps(activeHost);
      const stored = activeHost ? await env.AURA_KV.get(evidenceKey(activeHost)) : null;
      const snapshot = {
        build: BUILD,
        stamp: new Date().toISOString(),
        operator: isOperator ? "YES" : "NO",
        active_host: safeHost,
        host_caps: caps || null,
        evidence_present_for_active_host: Boolean(stored)
      };
      push("SNAPSHOT_STATE", snapshot);
      continue;
    }

    

    if (line === "DEPLOYER_CAPS") {
      push("DEPLOYER_CAPS", __deployerCaps(env));
      continue;
    }

    if (line.startsWith("DEPLOYER_CALL ")) {
      if (!isOperator) { push("DEPLOYER_CALL", "UNAUTHORIZED"); continue; }
      const jsonPart = line.slice("DEPLOYER_CALL ".length).trim();
      const reqObj = safeJsonParse(jsonPart);
      if (!reqObj || typeof reqObj !== "object") { push("DEPLOYER_CALL", "BAD_REQUEST"); continue; }

      const serviceName = String(reqObj.service || "").trim();
      if (serviceName !== "AURA_DEPLOYER" && serviceName !== "AURA_CF") { push("DEPLOYER_CALL", "BAD_REQUEST"); continue; }
      if (!__hasService(env, serviceName)) { push("DEPLOYER_CALL", "DEPLOYER_CAPS_MISSING"); continue; }

      const path = String(reqObj.path || "").trim();
      if (!path.startsWith("/")) { push("DEPLOYER_CALL", "BAD_REQUEST"); continue; }

      // Enforce host caps: treat this as its own command token (DEPLOYER_CALL already host-capped upstream).
      // Evidence gating: callers must provide VERIFIED_FETCH_URL separately when making reachability claims.
      try {
        const svc = env[serviceName];
        const resp = await __serviceFetch(svc, {
          path,
          method: reqObj.method || "POST",
          headers: (reqObj.headers && typeof reqObj.headers === "object") ? reqObj.headers : {},
          content_type: reqObj.content_type || null,
          body: reqObj.body != null ? reqObj.body : undefined
        });
        push("DEPLOYER_CALL", { service: serviceName, path, ...resp });
      } catch (e) {
        push("DEPLOYER_CALL", { service: serviceName, path, http_status: 0, error: "EXCEPTION", message: String(e?.message || e) });
      }
      continue;
    }

// Any unknown tokens in a batch are ignored (deterministic).
  }

  return jsonReply(JSON.stringify(out, null, 2));
}


    // ----------------------------
    // Multi-line simple commands (e.g., HOST x + PING)
    // ----------------------------
    const hasLine = (cmd) => lines.some((l) => l === cmd);

    if (hasLine("PING")) return jsonReply("PONG");

    if (hasLine("PAUSE")) return jsonReply("PAUSED");

    if (hasLine("SHOW_ALLOWED_COMMANDS")) {
      return jsonReply(JSON.stringify(allowedCommands, null, 2));
    }

    if (hasLine("SHOW_BUILD")) {
      return jsonReply(
        JSON.stringify({ build: BUILD, stamp: new Date().toISOString() }, null, 2)
      );
    }

    if (hasLine("SHOW_CLAIM_GATE")) {
      return jsonReply(
        JSON.stringify(
          {
            trigger_words: [
              "live",
              "deployed",
              "launched",
              "resolving",
              "propagating",
              "successful",
              "verified",
              "up",
              "online",
              "working",
              "reachable",
              "available",
              "accessible"
            ],
            forced_message: "NOT WIRED: VERIFIED_FETCH REQUIRED",
            requires_verified_fetch_format: true
          },
          null,
          2
        )
      );
    }

    if (hasLine("RUN_SELF_TEST_EVIDENCE")) {
      return await runSelfTestEvidence();
    }





    if (hasLine("SNAPSHOT_STATE")) {
      const safeHost = activeHost || "none";
      const caps = await getHostCaps(activeHost);
      const stored = activeHost ? await env.AURA_KV.get(evidenceKey(activeHost)) : null;

      const snapshot = {
        build: BUILD,
        stamp: new Date().toISOString(),
        operator: isOperator ? "YES" : "NO",
        active_host: safeHost,
        host_caps: caps || null,
        evidence_present_for_active_host: Boolean(stored)
      };

      return jsonReply(JSON.stringify(snapshot, null, 2));

    if (hasLine("DEPLOYER_CAPS")) {
      return jsonReply(JSON.stringify(__deployerCaps(env), null, 2));
    }

    // DEPLOYER_CALL <json> (single-line only; operator-only)
    for (const line of lines) {
      if (!line.startsWith("DEPLOYER_CALL")) continue;
      if (!isOperator) return jsonReply("UNAUTHORIZED");
      const jsonPart = line.slice("DEPLOYER_CALL".length).trim();
      const reqObj = safeJsonParse(jsonPart);
      if (!reqObj || typeof reqObj !== "object") return jsonReply("BAD_REQUEST");

      const serviceName = String(reqObj.service || "").trim();
      if (serviceName !== "AURA_DEPLOYER" && serviceName !== "AURA_CF") return jsonReply("BAD_REQUEST");
      if (!__hasService(env, serviceName)) return jsonReply("DEPLOYER_CAPS_MISSING");

      const path = String(reqObj.path || "").trim();
      if (!path.startsWith("/")) return jsonReply("BAD_REQUEST");

      try {
        const svc = env[serviceName];
        const resp = await __serviceFetch(svc, {
          path,
          method: reqObj.method || "POST",
          headers: (reqObj.headers && typeof reqObj.headers === "object") ? reqObj.headers : {},
          content_type: reqObj.content_type || null,
          body: reqObj.body != null ? reqObj.body : undefined
        });
        return jsonReply(JSON.stringify({ service: serviceName, path, ...resp }, null, 2));
      } catch (e) {
        return jsonReply(JSON.stringify({ service: serviceName, path, http_status: 0, error: "EXCEPTION", message: String(e?.message || e) }, null, 2));
      }
    }

    }

    // ----------------------------
    // EVIDENCE_PRESENT (return stored evidence JSON for a host)
    // ----------------------------
    for (const line of lines) {
      if (line.startsWith("EVIDENCE_PRESENT")) {
        const parts = line.split(" ").filter(Boolean);
        const host = normalizeHostLoose(parts[1]) || activeHost;
        if (!host) return jsonReply("BAD_REQUEST");
        const stored = await env.AURA_KV.get(evidenceKey(host));
        if (!stored) return jsonReply("NO_EVIDENCE");
        try {
          return jsonReply(JSON.stringify(JSON.parse(stored), null, 2));
        } catch {
          return jsonReply(stored);
        }
      }
    }

    // ----------------------------
    // Self-test harness (unchanged)
    // ----------------------------
        async function runSelfTestEvidence() {
      const mk = (name, pass, observed, expected) => ({ name, pass, observed, expected });

      const hosts = {
        example: "example.com",
        http404: "httpstat.us"
      };

      const clearHost = async (host) => {
        await env.AURA_KV.delete(evidenceKey(host));
      };

      const getEvidence = async (host) => {
        const stored = await env.AURA_KV.get(evidenceKey(host));
        return stored ? JSON.parse(stored) : null;
      };

      const putEvidence = async (targetUrl) => {
        const host = new URL(targetUrl).host.toLowerCase();
        try {
          const res = await fetch(targetUrl);
          const text = await res.text();
          const evidence = {
            ok: true,
            url: targetUrl,
            host,
            http_status: res.status,
            first_line_html: text.split("\n")[0] || "",
            body_length: text.length
          };
          await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
          return evidence;
        } catch {
          const evidence = { ok: false, url: targetUrl, host, http_status: 0 };
          await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
          return evidence;
        }
      };

      const results = [];

      await clearHost(hosts.example);
      await clearHost(hosts.http404);

      const ev0 = await getEvidence(hosts.example);
      results.push(
        mk(
          "evidence_missing_example",
          ev0 === null,
          ev0 ? "EVIDENCE_PRESENT" : "EVIDENCE_MISSING",
          "EVIDENCE_MISSING"
        )
      );

      const ev1 = await putEvidence("https://example.com");
      const yes1 = ev1.ok && statusReachable(ev1.http_status) ? "YES" : "NO";
      results.push(mk("fetch_example_yes", yes1 === "YES", yes1, "YES"));

      const ev2 = await putEvidence("https://httpstat.us/404");
      const yes2 = ev2.ok && statusReachable(ev2.http_status) ? "YES" : "NO";
      results.push(mk("fetch_404_no", yes2 === "NO", yes2, "NO"));

      await clearHost(hosts.http404);
      const httpAfterClear = await getEvidence(hosts.http404);
      const shouldGate = httpAfterClear === null;
      results.push(
        mk(
          "cross_host_gate_http404",
          shouldGate,
          shouldGate ? "NOT WIRED: VERIFIED_FETCH REQUIRED" : "HAS_EVIDENCE",
          "NOT WIRED: VERIFIED_FETCH REQUIRED"
        )
      );

      await clearHost(hosts.example);
      await clearHost(hosts.http404);

      const ok = results.every((r) => r.pass);
      return jsonReply(JSON.stringify({ ok, tests: results }, null, 2));
        }


// CF direct commands in single-shot mode
if (bodyTrim.startsWith("CF_ZONE_GET")) {
  if (!operator) return json({ ok: false, reply: "UNAUTHORIZED" });
  const parts = bodyTrim.split(" ").filter(Boolean);
  const domain = normalizeHostLoose(parts[1]);
  if (!domain) return json({ ok: false, reply: "BAD_REQUEST" });
  const ev = await getEvidence(env, domain);
  if (!ev) return json({ ok: false, reply: "NOT_VERIFIED" });
  const zid = await __cfZoneIdFor(env, domain);
  return json({ ok: true, reply: JSON.stringify(zid, null, 2) });
}

if (bodyTrim.startsWith("CF_DNS_LIST")) {
  if (!operator) return json({ ok: false, reply: "UNAUTHORIZED" });
  const parts = bodyTrim.split(" ").filter(Boolean);
  const domain = normalizeHostLoose(parts[1]);
  if (!domain) return json({ ok: false, reply: "BAD_REQUEST" });
  const ev = await getEvidence(env, domain);
  if (!ev) return json({ ok: false, reply: "NOT_VERIFIED" });
  const zid = await __cfZoneIdFor(env, domain);
  if (!zid || zid.ok !== true) return json({ ok: true, reply: JSON.stringify(zid, null, 2) });
  const list = await __cfDnsList(env, zid.zone_id, { per_page: "100" });
  return json({ ok: true, reply: JSON.stringify({ zone_id: zid.zone_id, dns: list }, null, 2) });
}


if (bodyTrim.startsWith("CF_DNS_UPSERT ")) {
  if (!operator) return json({ ok: false, reply: "UNAUTHORIZED" });
  const rec = safeJsonParse(bodyTrim.slice("CF_DNS_UPSERT ".length));
  if (!rec) return json({ ok: false, reply: "BAD_JSON" });
  const zoneName = normalizeHostLoose(rec.zone);
  if (!zoneName) return json({ ok: false, reply: "BAD_REQUEST" });
  const ev = await getEvidence(env, zoneName);
  if (!ev) return json({ ok: false, reply: "NOT_VERIFIED" });
  const zid = await __cfZoneIdFor(env, zoneName);
  if (!zid || zid.ok !== true) return json({ ok: true, reply: JSON.stringify(zid, null, 2) });
  const up = await __cfDnsUpsert(env, zid.zone_id, rec);
  return json({ ok: true, reply: JSON.stringify({ zone_id: zid.zone_id, result: up }, null, 2) });
}


    // ----------------------------
    // Evidence engine (CLEAR runs first, then VERIFIED_FETCH_URL, then compute)
    // ----------------------------
    const hasReachabilityQuestion = /\breachable\b/i.test(body);

    // Response-shape controls
    const wantYesNo = /return\s+only\s*:\s*yes\s+or\s+no\b/i.test(body);
    const wantReachableUnreachable =
      /return\s+only\s*:\s*reachable\s+or\s+unreachable\b/i.test(body);
    const want200or000 = /return\s+only\s*:\s*200\s+or\s+000\b/i.test(body);
    const wantHttpStatus = /return\s+only\s+the\s+http_status\b/i.test(body);
    const isShapeRequest =
      wantYesNo || wantReachableUnreachable || want200or000 || wantHttpStatus;


    // ----------------------------
    // CLAIM GATE (wired): if user asks "live/deployed/online/etc" in the prompt,
    // require at least one VERIFIED_FETCH_URL line in the SAME request.
    // This prevents stale KV evidence from being used to claim reachability.
    // ----------------------------
    const claimGateTriggerWords = [
      "live",
      "deployed",
      "launched",
      "resolving",
      "propagating",
      "successful",
      "verified",
      "up",
      "online",
      "working",
      "reachable",
      "available",
      "accessible"
    ];
    const claimGateForcedMessage = "NOT WIRED: VERIFIED_FETCH REQUIRED";
    const isHerdRequest = lines.some((l) => /^HERD_(STATUS|SELF_TEST|SWEEP|ENABLE)/.test(l.trim()));
    const claimGateTriggered =
      !isHerdRequest &&
      new RegExp(`\b(${claimGateTriggerWords.join("|")})\b`, "i").test(body);
    const hasVerifiedFetchInThisRequest = lines.some((l) => l.startsWith("VERIFIED_FETCH_URL"));

    // Registry commands are explicitly bypassed (they are structured, not "claims").
    const hasRegistryBypass =
      lines.some((l) => __registryBypass(l.split(" ")[0]));

    if (claimGateTriggered && !hasVerifiedFetchInThisRequest && !hasRegistryBypass) {
      return jsonReply(claimGateForcedMessage);
    }

    const clearHosts = [];
    for (const line of lines) {
      if (line.startsWith("CLEAR_VERIFIED_FETCH")) {
        const parts = line.split(" ").filter(Boolean);
        const target = parts[1];
        const host = normalizeHost(target);
        if (host) clearHosts.push(host);
      }
    }

    if (clearHosts.length > 0) {
      for (const host of clearHosts) {
        await env.AURA_KV.delete(evidenceKey(host));
      }

      // If the message only clears evidence (plus optional HOST line), return deterministically.
      const hasOtherAction =
        lines.some((l) => {
          const t = l.split(" ")[0];
          return (
            t !== "HOST" &&
            t !== "CLEAR_VERIFIED_FETCH" &&
            allowedCommands.includes(t)
          );
        }) || hasReachabilityQuestion || isShapeRequest;

      if (!hasOtherAction) {
        return jsonReply(clearHosts.length === 1 ? "CLEARED" : `CLEARED (${clearHosts.length})`);
      }
    }

    let lastEvidence = null;
    const fetchEvidences = [];

    for (const line of lines) {
      if (!line.startsWith("VERIFIED_FETCH_URL")) continue;

      const parts = line.split(" ").filter(Boolean);
      const target = parts[1];
      const host = normalizeHost(target);
      if (!host) continue;

      const runFetch = async (probeUrl) => {
        const res = await fetch(probeUrl);
        const text = await res.text();
        return { res, text };
      };

      const nowTs = new Date().toISOString();

      // Prevent self-fetch recursion (auras.guide/* routes to this Worker).
      // Instead, record a synthetic "reachable" evidence based on the fact this request is being served.
      const selfHost = new URL(request.url).host.toLowerCase();
      if (host === selfHost) {
        const evidence = {
          ok: true,
          host,
          url: target,
          probe_url: null,
          http_status: 200,
          first_line_html: "SELF_HOST_SYNTHETIC_EVIDENCE",
          body_length: 0,
          synthetic: true,
          reason: "WORKER_SELF_ROUTE_ASSUME_REACHABLE",
          diagnostics: {
            cf: request.cf || null,
            self_host: selfHost,
            ts: nowTs
          }
        };

        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        lastEvidence = evidence;
        fetchEvidences.push(evidence);
        continue;
      }

      try {
        // 1) Try HTTPS (or whatever the user provided)
        const { res: res1, text: text1 } = await runFetch(target);

        // 2) If HTTPS returns 525, retry HTTP for same host/path/query
        if (res1.status === 525) {
          const u = new URL(target);
          if (u.protocol === "https:") {
            u.protocol = "http:";
            const httpUrl = u.toString();

            const { res: res2, text: text2 } = await runFetch(httpUrl);

            const evidence = {
              ok: true,
              host,
              public_url: target,
              probe_url: httpUrl,
              fallback_reason: "CF_HTTPS_525_HTTP_PROBE",
              http_status: res2.status,
              first_line_html: text2.split("\n")[0] || "",
              body_length: text2.length,
              diagnostics: {
                cf: request.cf || null,
                https_status: 525,
                ts: nowTs
              }
            };

            await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
            lastEvidence = evidence;
            fetchEvidences.push(evidence);
            continue;
          }
        }

        // Normal path: store what we got
        const evidence = {
          ok: true,
          host,
          url: target,
          http_status: res1.status,
          first_line_html: text1.split("\n")[0] || "",
          body_length: text1.length,
          diagnostics: {
            cf: request.cf || null,
            ts: nowTs
          }
        };

        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        lastEvidence = evidence;
        fetchEvidences.push(evidence);
      } catch (err) {
        const evidence = {
          ok: false,
          host,
          url: target,
          http_status: 0,
          error: String(err?.message || err),
          error_name: err?.name || "UNKNOWN",
          diagnostics: {
            cf: request.cf || null,
            ts: nowTs
          }
        };

        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        lastEvidence = evidence;
        fetchEvidences.push(evidence);
      }
    }

    // ----------------------------
    // Target selection for questions:
    // Prefer an asked host (URL or bare domain mention). Otherwise use active HOST context.
    // ----------------------------
    const targetHostForQuestion = askedHost || activeHost || null;

    // Inline compute from VERIFIED_FETCH_URL executed in THIS message when asked host matches
    if (lastEvidence && targetHostForQuestion && lastEvidence.host === targetHostForQuestion) {
      const st = Number(lastEvidence.http_status || 0);
      const r = lastEvidence.ok && statusReachable(st);

      if (wantHttpStatus) return jsonReply(String(st));
      if (want200or000) return jsonReply(st === 200 ? "200" : "000");
      if (wantReachableUnreachable) return jsonReply(r ? "REACHABLE" : "UNREACHABLE");
      if (wantYesNo) return jsonReply(r ? "YES" : "NO");
    }

    // If VERIFIED_FETCH_URL ran and there is NO reachability question, return the evidence JSON by default.
    if (fetchEvidences.length > 0 && !hasReachabilityQuestion && !isShapeRequest) {
      const payload = fetchEvidences.length === 1 ? fetchEvidences[0] : fetchEvidences;
      return jsonReply(JSON.stringify(payload, null, 2));
    }

    // ----------------------------
    // Shape-only queries (no "reachable" keyword) using HOST context + existing evidence.
    // Example: "HOST example.com\nReturn ONLY the http_status"
    // ----------------------------
    if (!hasReachabilityQuestion && isShapeRequest) {
      const hostToUse = targetHostForQuestion;
      if (!hostToUse) return jsonReply("NOT WIRED: VERIFIED_FETCH REQUIRED");

      const stored = await env.AURA_KV.get(evidenceKey(hostToUse));
      if (!stored) return jsonReply("NOT WIRED: VERIFIED_FETCH REQUIRED");

      const evidence = JSON.parse(stored);
      const st = Number(evidence.http_status || 0);
      const r = evidence.ok && statusReachable(st);

      if (wantHttpStatus) return jsonReply(String(st));
      if (want200or000) return jsonReply(st === 200 ? "200" : "000");
      if (wantReachableUnreachable) return jsonReply(r ? "REACHABLE" : "UNREACHABLE");
      if (wantYesNo) return jsonReply(r ? "YES" : "NO");

      return jsonReply(String(st));
    }

    // Evidence-memory reachability path (host-scoped KV)
    if (hasReachabilityQuestion) {
      const hostToUse = targetHostForQuestion;
      if (!hostToUse) return jsonReply("NOT WIRED: VERIFIED_FETCH REQUIRED");

      const stored = await env.AURA_KV.get(evidenceKey(hostToUse));
      if (!stored) return jsonReply("NOT WIRED: VERIFIED_FETCH REQUIRED");

      const evidence = JSON.parse(stored);
      const st = Number(evidence.http_status || 0);
      const r = evidence.ok && statusReachable(st);

      if (wantHttpStatus) return jsonReply(String(st));
      if (wantReachableUnreachable) return jsonReply(r ? "REACHABLE" : "UNREACHABLE");
      if (wantYesNo) return jsonReply(r ? "YES" : "NO");

      return jsonReply(r ? "YES" : "NO");
    }

// ----------------------------
// Memory Substrate Commands (explicit; storage-backed)
// ----------------------------

const importRegistryCore = async (typeName, items) => {
  const idsBefore = await registryGetIndex(env, typeName);
  const ids = [...idsBefore];

  let upserts = 0;
  for (const it of items) {
    if (!it || typeof it !== "object") continue;

    if (typeName === "domains") {
      const domainId = String(it.id || it.domain || "").trim().toLowerCase();
      if (!domainId) continue;

      const entry = {
        id: domainId,
        domain: String(it.domain || it.id || domainId).toLowerCase(),
        pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
        purpose: String(it.purpose || it.notes || "").trim(),
        priority: String(it.priority || "UNKNOWN").trim(),
        status: String(it.status || "UNKNOWN").trim()
      };

      const put = await registryPut(env, "domains", entry);
      if (put.ok) {
        upserts += 1;
        if (!ids.includes(entry.id)) ids.push(entry.id);
      }
      continue;
    }

    // assets
    const assetId = String(it.id || "").trim();
    if (!assetId) continue;

    const entry = {
      id: assetId,
      name: String(it.name || it.title || it.id || "").trim() || assetId,
      pillar: String(it.pillar || it.category || it.group || "").trim() || "UNKNOWN",
      notes: String(it.notes || "").trim(),
      tags: Array.isArray(it.tags) ? it.tags : [],
      sellability: String(it.sellability || "UNKNOWN").trim(),
      patent_cluster: String(it.patent_cluster || "").trim()
    };

    const put = await registryPut(env, "assets", entry);
    if (put.ok) {
      upserts += 1;
      if (!ids.includes(entry.id)) ids.push(entry.id);
    }
  }

  await registryPutIndex(env, typeName, ids);
  await auditWrite(env, { action: "REGISTRY_IMPORT", type: typeName, details: { upserts } });

  return jsonReply(
    JSON.stringify(
      { ok: true, type: typeName, upserts, total_index_count: ids.length, stamp: nowIso() },
      null,
      2
    )
  );
};

const importRegistry = async (typeName) => {
  const raw = body.replace(/^REGISTRY_IMPORT_(ASSETS|DOMAINS)\s*/i, "").trim();
  const parsed = safeJsonParse(raw);
  if (!parsed) return jsonReply("BAD_REQUEST");

  const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : null);
  if (!items) return jsonReply("BAD_REQUEST");

  return await importRegistryCore(typeName, items);
};

const importRegistryGeneric = async () => {
  // Accept: REGISTRY_IMPORT {"type":"assets","items":[...]} OR {"type":"domains","items":[...]} OR {"type":"assets","items":...}
  const raw = body.replace(/^REGISTRY_IMPORT\s*/i, "").trim();
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return jsonReply("BAD_REQUEST");

  const typeName = String(parsed.type || "").toLowerCase().trim();
  const normalized =
    typeName === "asset" || typeName === "assets" ? "assets" :
    typeName === "domain" || typeName === "domains" ? "domains" :
    "";

  if (!normalized) return jsonReply("BAD_REQUEST");

  const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed) ? parsed : null);
  if (!items) return jsonReply("BAD_REQUEST");

  return await importRegistryCore(normalized, items);
};


if (/^REGISTRY_IMPORT_ASSETS\b/i.test(bodyTrim)) {
  return await importRegistry("assets");
}

if (/^REGISTRY_IMPORT_DOMAINS\b/i.test(bodyTrim)) {
  return await importRegistry("domains");
}

// REGISTRY_IMPORT (generic): body is JSON object { type: "assets"|"domains", items: [...] }
if (/^REGISTRY_IMPORT\b/i.test(bodyTrim)) {
  return await importRegistryGeneric();
}


// REGISTRY_GET <type> <id>
for (const line of lines) {
  if (line.startsWith("REGISTRY_GET")) {
    const parts = line.split(" ").filter(Boolean);
    const type = String(parts[1] || "").toLowerCase();
    const id = String(parts[2] || "").trim();
    if (!type || !id) return jsonReply("BAD_REQUEST");
    const e = await registryGet(env, type, id);
    return jsonReply(e ? JSON.stringify(e, null, 2) : "MISSING");
  }
}

// REGISTRY_LIST <type> [limit]
for (const line of lines) {
  if (line.startsWith("REGISTRY_LIST")) {
    const parts = line.split(" ").filter(Boolean);
    const type = String(parts[1] || "").toLowerCase();
    const limit = Number(parts[2] || 50);
    if (!type) return jsonReply("BAD_REQUEST");
    const payload = await registryList(env, type, limit);
    return jsonReply(JSON.stringify(payload, null, 2));
  }
}

// REGISTRY_FILTER <type> <field> <value> [limit]
for (const line of lines) {
  if (line.startsWith("REGISTRY_FILTER")) {
    const raw = line.slice("REGISTRY_FILTER".length).trim();
    let type = "";
    let field = "";
    let value = "";
    let limit = 50;
    let where = null;

    if (raw.startsWith("{")) {
      const obj = safeJsonParse(raw);
      if (!obj || typeof obj !== "object") return jsonReply("BAD_REQUEST");
      type = String(obj.type || "").toLowerCase();
      limit = Number(obj.limit || 50);
      if (obj.where && typeof obj.where === "object") {
        where = obj.where;
      } else {
        field = String(obj.field || "").trim();
        value = String(obj.value ?? "").trim();
      }
    } else {
      const parts = line.split(" ").filter(Boolean);
      type = String(parts[1] || "").toLowerCase();
      field = String(parts[2] || "").trim();
      value = String(parts[3] || "").trim();
      limit = Number(parts[4] || 50);
    }

    if (!type) return jsonReply("BAD_REQUEST");
    if (!where && (!field || !value)) return jsonReply("BAD_REQUEST");

    const payload = where
      ? await registryFilterWhere(env, type, where, limit)
      : await registryFilter(env, type, field, value, limit);

    return jsonReply(JSON.stringify(payload, null, 2));
  }
}

if (bodyTrim === "AUDIT_CLEAR") {
  if (!isOperator) return jsonReply("UNAUTHORIZED");
  // Require a VERIFIED_FETCH seed for the active host before allowing audit mutation.
  if (!activeHost) return jsonReply("BAD_REQUEST");
  const evSeed = await env.AURA_KV.get(evidenceKey(activeHost));
  if (!evSeed) return jsonReply("NOT_WIRED: VERIFIED_FETCH REQUIRED");
  try {
    // Fast-clear: resetting seq makes prior events unreachable without KV list/delete.
    await env.AURA_KV.put(auditSeqKey, "0");
    await env.AURA_KV.put(auditClearedAtKey, nowIso());
    return jsonReply("CLEARED");
  } catch (e) {
    return jsonReply(JSON.stringify({ ok: false, error: "AUDIT_CLEAR_EXCEPTION", message: String(e?.message || e) }));
  }
}

    // ----------------------------
    // Consent-first Intent (explicit commands only)
    // ----------------------------
    for (const line of lines) {
      if (line.startsWith("INTENT_ADD")) {
        const m = line.match(/^INTENT_ADD\s+(\S+)\s+(\S+)\s+(.+)$/);
        if (!m) return jsonReply("BAD_REQUEST");
        const host = m[1].toLowerCase();
        const tag = m[2].toLowerCase();
        const text = m[3];

        const payload = {
          host,
          tag,
          text,
          created_at: new Date().toISOString(),
          consent: "EXPLICIT_COMMAND"
        };

        await env.AURA_KV.put(intentKey(host, tag), JSON.stringify(payload));
        return jsonReply("INTENT_SAVED");
      }

      if (line.startsWith("INTENT_GET")) {
        const parts = line.split(" ").filter(Boolean);
        const host = (parts[1] || "").toLowerCase();
        const tag = (parts[2] || "").toLowerCase();
        if (!host || !tag) return jsonReply("BAD_REQUEST");
        const stored = await env.AURA_KV.get(intentKey(host, tag));
        return jsonReply(stored ? stored : "INTENT_MISSING");
      }

      if (line.startsWith("INTENT_CLEAR")) {
        if (!isOperator) return jsonReply("UNAUTHORIZED");
        const parts = line.split(" ").filter(Boolean);
        const host = (parts[1] || "").toLowerCase();
        const tag = (parts[2] || "").toLowerCase();
        if (!host || !tag) return jsonReply("BAD_REQUEST");
        await env.AURA_KV.delete(intentKey(host, tag));
        return jsonReply("CLEARED");
      }
    }

    return jsonReply("NOT WIRED: VERIFIED_FETCH REQUIRED");
  },

  async scheduled(event, env, ctx) {
    // no-op (cron trigger present)
  }

};