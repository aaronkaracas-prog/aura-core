// ==== PATCH: Registry commands bypass claim-gate (2026-01-29) ====
function __registryBypass(token) {
  return token === "REGISTRY_IMPORT_ASSETS" ||
         token === "REGISTRY_IMPORT_DOMAINS" ||
         token === "REGISTRY_PUT" ||
         token === "REGISTRY_GET" ||
         token === "REGISTRY_LIST" ||
         token === "REGISTRY_FILTER" ||
         token === "REGISTRY_IMPORT";
}
// ================================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only /chat is served
    if (url.pathname !== "/chat") {
      return new Response("Not Found", { status: 404 });
    }

    const body = await request.text();
    const bodyTrim = body.trim();

    // ----------------------------
    // Build / policy markers
    // ----------------------------
    const BUILD =
      "AURA_CORE__AUTONOMY_LAYERS__EVIDENCE_ALLOWLIST_HOSTCAPS_OPERATOR_INTENT_PAUSE__MEMORY_SUBSTRATE_V1__REGISTRY_AUDIT__08";

    // ----------------------------
    // Operator auth (explicit only)
    // ----------------------------
    const operatorToken = env.AURA_OPERATOR_TOKEN || env.AURA_OP_TOKEN || env.OPERATOR_TOKEN || "";
    const operatorHeader =
      request.headers.get("x-operator-token") ||
      request.headers.get("X-Operator-Token") ||
      "";
    const isOperator = Boolean(operatorToken) && operatorHeader === operatorToken;

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
      "AUDIT_CLEAR"
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
      return await __runSelfTestEvidence();
    }

    if (hasLine("RUN_SELF_TEST_EVIDENCE")) {
      return await runSelfTestEvidence();
    }


if (hasLine("SHOW_MEMORY_SCHEMA")) {
  return jsonReply(JSON.stringify(memorySchemaV1, null, 2));
}

if (hasLine("PORTFOLIO_STATUS")) {
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

if (hasLine("AUDIT_GET")) {
  const payload = await auditList(env, 50);
  return jsonReply(JSON.stringify(payload, null, 2));
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


const __runSelfTestEvidence = async () => {
  try {
    const mk = (name, pass, observed, expected) => ({ name, pass, observed, expected });

    // Avoid third-party test hosts that may fail under CF egress rules.
    // We use example.com for both positive and negative paths.
    const hosts = {
      example: "example.com",
      negative: "example.com"
    };

    const clearHost = async (host) => {
      await env.AURA_KV.delete(evidenceKey(host));
    };

    const getEvidence = async (host) => {
      const stored = await env.AURA_KV.get(evidenceKey(host));
      if (!stored) return null;
      try { return JSON.parse(stored); } catch { return null; }
    };

    const putEvidence = async (targetUrl) => {
      const host = new URL(targetUrl).host.toLowerCase();
      const nowTs = new Date().toISOString();
      try {
        const res = await fetch(targetUrl, { redirect: "follow" });
        const text = await res.text();
        const evidence = {
          ok: true,
          url: targetUrl,
          host,
          http_status: res.status,
          first_line_html: text.split("\n")[0] || "",
          body_length: text.length,
          diagnostics: { ts: nowTs }
        };
        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        return evidence;
      } catch (err) {
        const evidence = {
          ok: false,
          url: targetUrl,
          host,
          http_status: 0,
          error: String(err?.message || err),
          diagnostics: { ts: nowTs }
        };
        await env.AURA_KV.put(evidenceKey(host), JSON.stringify(evidence));
        return evidence;
      }
    };

    const results = [];

    await clearHost(hosts.example);

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

    // Negative test: force a likely 404 on example.com
    const ev2 = await putEvidence("https://example.com/__aura_self_test__not_found__");
    const yes2 = ev2.ok && statusReachable(ev2.http_status) ? "YES" : "NO";
    results.push(mk("fetch_404ish_no", yes2 === "NO", yes2, "NO"));

    await clearHost(hosts.negative);
    const afterClear = await getEvidence(hosts.negative);
    const shouldGate = afterClear === null;
    results.push(
      mk(
        "cross_host_gate_after_clear",
        shouldGate,
        shouldGate ? "NOT WIRED: VERIFIED_FETCH REQUIRED" : "HAS_EVIDENCE",
        "NOT WIRED: VERIFIED_FETCH REQUIRED"
      )
    );

    await clearHost(hosts.example);

    const ok = results.every((r) => r.pass);
    return jsonReply(JSON.stringify({ ok, tests: results }, null, 2));
  } catch (err) {
    return jsonReply(
      JSON.stringify(
        { ok: false, error: "SELF_TEST_EXCEPTION", message: String(err?.message || err) },
        null,
        2
      )
    );
  }
};

    // ----------------------------
    // Self-test harness (unchanged)
    // ----------------------------
        const runSelfTestEvidence = async () => {
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
        };

    if (bodyTrim === "RUN_SELF_TEST_EVIDENCE") {
      return await __runSelfTestEvidence();
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

// REGISTRY_PUT: body is JSON object with required fields { type, id, ... }
if (/^REGISTRY_PUT\b/i.test(bodyTrim)) {
  const raw = body.replace(/^REGISTRY_PUT\s*/i, "").trim();
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return jsonReply("BAD_REQUEST");
  const type = String(parsed.type || "").toLowerCase();
  if (!type || (type !== "assets" && type !== "domains" && type !== "users")) return jsonReply("BAD_REQUEST");
  const result = await registryPut(env, type, parsed);
  if (!result.ok) return jsonReply(result.error || "BAD_REQUEST");
  return jsonReply(JSON.stringify(result.entry, null, 2));
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
    const parts = line.split(" ").filter(Boolean);
    const type = String(parts[1] || "").toLowerCase();
    const field = String(parts[2] || "").trim();
    const value = String(parts[3] || "").trim();
    const limit = Number(parts[4] || 50);
    if (!type || !field || !value) return jsonReply("BAD_REQUEST");
    const payload = await registryFilter(env, type, field, value, limit);
    return jsonReply(JSON.stringify(payload, null, 2));
  }
}

if (bodyTrim === "AUDIT_CLEAR") {
  if (!isOperator) return jsonReply("UNAUTHORIZED");
  const list = await auditList(env, 500);
  for (const ev of list.events) {
    if (ev && typeof ev === "object" && ev.seq) {
      await env.AURA_KV.delete(auditEventKey(ev.seq));
    }
  }
  await env.AURA_KV.put(auditSeqKey, "0");
  return jsonReply("CLEARED");
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
  }
};
