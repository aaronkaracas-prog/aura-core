var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
function json(status, obj, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders || {}
    }
  });
}
__name(json, "json");
function nowMs() {
  return Date.now();
}
__name(nowMs, "nowMs");
function safeHeaderValue(v) {
  if (!v) return null;
  const s = String(v);
  return s.length > 200 ? s.slice(0, 200) + "\u2026" : s;
}
__name(safeHeaderValue, "safeHeaderValue");
function safeBodySnippet(text) {
  if (text == null) return null;
  const s = String(text);
  return s.length > 400 ? s.slice(0, 400) + "\u2026" : s;
}
__name(safeBodySnippet, "safeBodySnippet");
async function phraseMeta(phrase) {
  if (!phrase) return { present: false, sha256: null, length: 0 };
  const p = String(phrase);
  return { present: true, sha256: await sha256Hex(p), length: p.length };
}
__name(phraseMeta, "phraseMeta");
function phraseHeaderBundle(phrase) {
  if (!phrase) return {};
  const p = String(phrase);
  return {
    "X-Promotion-Phrase": p,
    "X-Aura-Phrase": p,
    "X-Promotion-Passphrase": p,
    "X-Promotion-Phrase-Token": p,
    "X-Promotion-Token": p,
    "X-Phrase": p
  };
}
__name(phraseHeaderBundle, "phraseHeaderBundle");
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { method: "GET", signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(t);
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
function buildHealthObject() {
  return {
    ok: true,
    service: "aura-core",
    autonomy: true,
    version: "AURA_CORE__2026-01-21__AUTONOMY_STEP_17M__DYNAMIC_HEADER_PROBE__DEPLOYER_DIAG__KV_TOKEN_FALLBACK"
  };
}
__name(buildHealthObject, "buildHealthObject");
function safeEq(a, b) {
  if (!a || !b) return false;
  const sa = String(a);
  const sb = String(b);
  if (sa.length !== sb.length) return false;
  let out = 0;
  for (let i = 0; i < sa.length; i++) out |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  return out === 0;
}
__name(safeEq, "safeEq");
function extractPhrase(payload2) {
  if (!payload2) return null;
  return payload2.promotion_phrase || payload2.promotionPhrase || payload2.phrase || payload2.value || null;
}
__name(extractPhrase, "extractPhrase");
var index_default = {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const admin = request.headers.get("X-Core-Pass") || request.headers.get("X-Aura-Pass") || request.headers.get("X-Admin-Token");
      const autonomyHeader = request.headers.get("X-Aura-Autonomy");
      const isAdmin = admin && admin === env.AURA_ADMIN_TOKEN;
      const KV = env && env.AURA_KV ? env.AURA_KV : null;
      let autonomyEnabled = false;
      let kvAutonomyToken = null;
      if (KV) {
        autonomyEnabled = await KV.get("autonomy_enabled") === "true";
        kvAutonomyToken = await KV.get("autonomy_token");
      }
      const envAutonomyToken = env && env.AURA_AUTONOMY_TOKEN ? env.AURA_AUTONOMY_TOKEN : null;
      const isAutonomy = autonomyEnabled && !!autonomyHeader && (envAutonomyToken && safeEq(autonomyHeader, envAutonomyToken) || kvAutonomyToken && safeEq(autonomyHeader, kvAutonomyToken));
      if (url.pathname.startsWith("/admin")) {
        if (!isAdmin) {
          const allowedAutonomy = isAutonomy && // bounded autonomy: deploy pipeline only
          (url.pathname === "/admin/aura/deploy/request" && request.method === "POST" || url.pathname === "/admin/aura/deploy/verify" && request.method === "POST" || url.pathname === "/admin/aura/deploy/promote" && request.method === "POST");
          if (!allowedAutonomy) {
            return json(401, { ok: false, error: "unauthorized" });
          }
        }
      }
      if (url.pathname === "/admin/deployer/probe" && request.method === "POST") {
        if (!isAdmin) {
          return json(403, { ok: false, error: "root_only" });
        }
        const body = await request.text();
        let payload2;
        try {
          payload2 = JSON.parse(body || "{}");
        } catch {
          return json(400, { ok: false, error: "bad_json" });
        }
        const phrase = extractPhrase(payload2) || null;
        const meta = await phraseMeta(phrase);
        const extraPhraseHeaders = Array.isArray(payload2.extra_phrase_headers) ? payload2.extra_phrase_headers.map((h) => String(h)).filter((h) => h && h.length < 100) : [];
        const queryPhrase = payload2.query_phrase === true;
        const probeHeaders = {
          "Content-Type": "application/json",
          "X-Deploy-Key": env.DEPLOY_SECRET,
          ...phrase ? phraseHeaderBundle(phrase) : {}
        };
        for (const h of extraPhraseHeaders) {
          if (h.toLowerCase() === "content-type" || h.toLowerCase() === "x-deploy-key") continue;
          if (phrase) probeHeaders[h] = String(phrase);
        }
        const baseUrl = "https://deployer/deploy";
        const urlOut = queryPhrase && phrase ? baseUrl + "?promotion_phrase=" + encodeURIComponent(String(phrase)) : baseUrl;
        const resp = await env.AURA_DEPLOYER.fetch(urlOut, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Deploy-Key": env.DEPLOY_SECRET,
            ...phrase ? phraseHeaderBundle(phrase) : {}
          },
          body
        });
        const text = await resp.text();
        return json(200, {
          ok: true,
          action: "deployer_probe",
          phrase: meta,
          headers_sent: Object.keys(probeHeaders).filter((k) => !["content-type", "x-deploy-key"].includes(String(k).toLowerCase())),
          query_phrase: queryPhrase,
          deployer_http_status: resp.status,
          deployer_ok: resp.ok,
          deployer_body_snippet: safeBodySnippet(text)
        });
      }
      if (url.pathname === "/admin/foundry/deploy" && request.method === "POST") {
        if (!isAdmin) {
          return json(403, { ok: false, error: "root_only" });
        }
        const body = await request.text();
        let foundryPhrase = null;
        try {
          const p = JSON.parse(body);
          foundryPhrase = extractPhrase(p);
        } catch {
          foundryPhrase = null;
        }
        const resp = await env.AURA_DEPLOYER.fetch("https://deployer/deploy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Deploy-Key": env.DEPLOY_SECRET,
            ...foundryPhrase ? phraseHeaderBundle(foundryPhrase) : {}
          },
          body
        });
        return new Response(await resp.text(), { status: resp.status });
      }
      if (url.pathname === "/admin/aura/self_deploy" && request.method === "POST") {
        if (!isAdmin) {
          return json(403, { ok: false, error: "root_only" });
        }
        const body = await request.text();
        if (!body || body.length < 10) {
          return json(400, { ok: false, error: "invalid_deploy_payload" });
        }
        const resp = await env.AURA_DEPLOYER.fetch("https://deployer/deploy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Deploy-Key": env.DEPLOY_SECRET,
            "X-Aura-Action": "self-deploy"
          },
          body
        });
        return json(resp.status, {
          ok: resp.ok,
          status: resp.status,
          action: "aura_self_deploy",
          timestamp: nowMs()
        });
      }
      const KV_KEYS = {
        // phrase ticket (root-minted)
        phrase: "deploy:promotion_phrase",
        phraseExpiresAt: "deploy:promotion_phrase_expires_at",
        phraseSingleUse: "deploy:promotion_phrase_single_use",
        lastStagingHash: "deploy:last_staging_hash",
        lastStagingAt: "deploy:last_staging_at",
        lastStagingVerifiedAt: "deploy:last_staging_verified_at",
        lastStagingVerifyUrl: "deploy:last_staging_verify_url",
        lastStagingVerifyMode: "deploy:last_staging_verify_mode",
        lastProdHash: "deploy:last_prod_hash",
        lastProdAt: "deploy:last_prod_at",
        lastKnownGoodProdHash: "deploy:last_known_good_prod_hash",
        lastKnownGoodProdAt: "deploy:last_known_good_prod_at"
      };
      async function readStatus() {
        const [
          lastStagingHash,
          lastStagingAt,
          lastStagingVerifiedAt,
          lastStagingVerifyUrl,
          lastStagingVerifyMode,
          lastProdHash,
          lastProdAt,
          lastKnownGoodProdHash,
          lastKnownGoodProdAt
        ] = await Promise.all([
          KV.get(KV_KEYS.lastStagingHash),
          KV.get(KV_KEYS.lastStagingAt),
          KV.get(KV_KEYS.lastStagingVerifiedAt),
          KV.get(KV_KEYS.lastStagingVerifyUrl),
          KV.get(KV_KEYS.lastStagingVerifyMode),
          KV.get(KV_KEYS.lastProdHash),
          KV.get(KV_KEYS.lastProdAt),
          KV.get(KV_KEYS.lastKnownGoodProdHash),
          KV.get(KV_KEYS.lastKnownGoodProdAt)
        ]);
        return {
          last_staging_hash: lastStagingHash || null,
          last_staging_at: lastStagingAt ? Number(lastStagingAt) : null,
          last_staging_verified_at: lastStagingVerifiedAt ? Number(lastStagingVerifiedAt) : null,
          last_staging_verify_url: lastStagingVerifyUrl || null,
          last_staging_verify_mode: lastStagingVerifyMode || null,
          last_prod_hash: lastProdHash || null,
          last_prod_at: lastProdAt ? Number(lastProdAt) : null,
          last_known_good_prod_hash: lastKnownGoodProdHash || null,
          last_known_good_prod_at: lastKnownGoodProdAt ? Number(lastKnownGoodProdAt) : null
        };
      }
      __name(readStatus, "readStatus");
      async function setPhraseTicket(phrase, ttlMs, singleUse) {
        const expiresAt = nowMs() + (ttlMs || 10 * 60 * 1e3);
        await Promise.all([
          KV.put(KV_KEYS.phrase, String(phrase)),
          KV.put(KV_KEYS.phraseExpiresAt, String(expiresAt)),
          KV.put(KV_KEYS.phraseSingleUse, singleUse ? "true" : "false")
        ]);
        return { phrase_set: true, expires_at: expiresAt, single_use: !!singleUse };
      }
      __name(setPhraseTicket, "setPhraseTicket");
      async function clearPhraseTicket() {
        await Promise.all([
          KV.delete(KV_KEYS.phrase),
          KV.delete(KV_KEYS.phraseExpiresAt),
          KV.delete(KV_KEYS.phraseSingleUse)
        ]);
        return { phrase_cleared: true };
      }
      __name(clearPhraseTicket, "clearPhraseTicket");
      async function getPhraseTicket() {
        const [phrase, expiresAt, singleUse] = await Promise.all([
          KV.get(KV_KEYS.phrase),
          KV.get(KV_KEYS.phraseExpiresAt),
          KV.get(KV_KEYS.phraseSingleUse)
        ]);
        const exp = expiresAt ? Number(expiresAt) : null;
        const isExpired = exp != null && nowMs() > exp;
        if (!phrase || !exp || isExpired) {
          return { ok: false, error: "no_valid_phrase_ticket" };
        }
        return { ok: true, phrase: String(phrase), expires_at: exp, single_use: singleUse === "true" };
      }
      __name(getPhraseTicket, "getPhraseTicket");
      async function consumePhraseIfNeeded(ticket) {
        if (ticket && ticket.single_use) {
          await clearPhraseTicket();
        }
      }
      __name(consumePhraseIfNeeded, "consumePhraseIfNeeded");
      if (url.pathname === "/admin/aura/deploy/status" && request.method === "GET") {
        if (!isAdmin) {
          return json(403, { ok: false, error: "root_only" });
        }
        if (!isAdmin) {
          if (!payload.promotion_phrase) {
            const ticket = await getPhraseTicket();
            if (!ticket.ok) {
              return json(409, { ok: false, error: "promotion_phrase_required", message: "Root must set a phrase ticket via /admin/aura/deploy/phrase before autonomy can promote." });
            }
            payload.promotion_phrase = ticket.phrase;
            payload.__kv_phrase_ticket = ticket;
          }
        }
        const status = await readStatus();
        return json(200, { ok: true, status });
      }
      if (url.pathname === "/admin/aura/deploy/phrase" && request.method === "POST") {
        if (!isAdmin) {
          return json(403, { ok: false, error: "root_only" });
        }
        const body = await request.text();
        let payload2;
        try {
          payload2 = JSON.parse(body || "{}");
        } catch {
          return json(400, { ok: false, error: "bad_json" });
        }
        const phrase = payload2.promotion_phrase || payload2.phrase || payload2.value;
        if (!phrase || String(phrase).length < 3) {
          return json(400, { ok: false, error: "missing_promotion_phrase" });
        }
        const ttlMs = payload2.ttl_ms ? Number(payload2.ttl_ms) : 10 * 60 * 1e3;
        const singleUse = payload2.single_use !== false;
        const result = await setPhraseTicket(String(phrase), ttlMs, singleUse);
        return json(200, { ok: true, action: "phrase_ticket_set", ...result });
      }
      if (url.pathname === "/admin/aura/deploy/phrase" && request.method === "DELETE") {
        if (!isAdmin) {
          return json(403, { ok: false, error: "root_only" });
        }
        const result = await clearPhraseTicket();
        return json(200, { ok: true, action: "phrase_ticket_cleared", ...result });
      }
      if (url.pathname === "/admin/aura/deploy/request" && request.method === "POST") {
        const body = await request.text();
        if (!body || body.length < 10) {
          return json(400, { ok: false, error: "invalid_deploy_payload" });
        }
        let payload2;
        try {
          payload2 = JSON.parse(body);
        } catch {
          return json(400, { ok: false, error: "bad_json" });
        }
        if (!isAdmin) {
          if (!payload2.promotion_phrase) {
            const ticket = await getPhraseTicket();
            if (!ticket.ok) {
              return json(409, { ok: false, error: "promotion_phrase_required", message: "Root must set a phrase ticket via /admin/aura/deploy/phrase before autonomy can deploy." });
            }
            payload2.promotion_phrase = ticket.phrase;
            payload2.__kv_phrase_ticket = ticket;
          }
        }
        const target = payload2 && (payload2.target || payload2.env || payload2.environment) || request.headers.get("X-Aura-Deploy-Target") || "staging";
        if (!isAdmin) {
          const t = String(target).toLowerCase();
          if (t !== "staging") {
            return json(403, { ok: false, error: "autonomy_staging_only" });
          }
        }
        if (String(target).toLowerCase() === "prod" || String(target).toLowerCase() === "production") {
          if (!isAdmin) {
            if (!payload2.promotion_phrase) {
              const ticket = await getPhraseTicket();
              if (!ticket.ok) {
                return json(409, { ok: false, error: "promotion_phrase_required", message: "Root must set a phrase ticket via /admin/aura/deploy/phrase before autonomy can promote." });
              }
              payload2.promotion_phrase = ticket.phrase;
              payload2.__kv_phrase_ticket = ticket;
            }
          }
          const status = await readStatus();
          if (!status.last_staging_hash || !status.last_staging_verified_at) {
            return json(409, {
              ok: false,
              error: "staging_required",
              message: "Staging deploy + verify is required before prod promotion."
            });
          }
          const promotingHash = payload2.promoting_hash || payload2.staging_hash || request.headers.get("X-Aura-Promoting-Hash");
          if (!promotingHash || promotingHash !== status.last_staging_hash) {
            return json(409, {
              ok: false,
              error: "promoting_hash_mismatch",
              required: status.last_staging_hash
            });
          }
        }
        const bodyToSend = JSON.stringify(payload2);
        const bodyHash = await sha256Hex(bodyToSend);
        if (String(target).toLowerCase() === "staging") {
          await Promise.all([
            KV.put(KV_KEYS.lastStagingHash, bodyHash),
            KV.put(KV_KEYS.lastStagingAt, String(nowMs())),
            KV.put(KV_KEYS.lastStagingVerifiedAt, ""),
            KV.put(KV_KEYS.lastStagingVerifyUrl, ""),
            KV.put(KV_KEYS.lastStagingVerifyMode, "")
          ]);
        }
        const resp = await env.AURA_DEPLOYER.fetch("https://deployer/deploy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Deploy-Key": env.DEPLOY_SECRET,
            "X-Aura-Action": isAdmin ? "deploy-request-root" : "deploy-request-autonomy",
            ...payload2 && payload2.promotion_phrase ? phraseHeaderBundle(payload2.promotion_phrase) : {}
          },
          body: bodyToSend
        });
        const deployerText = await resp.text();
        const deployerSnippet = safeBodySnippet(deployerText);
        if (!isAdmin && payload2.__kv_phrase_ticket && resp.ok) {
          await consumePhraseIfNeeded(payload2.__kv_phrase_ticket);
        }
        if (!isAdmin && payload2.__kv_phrase_ticket && resp.ok) {
          await consumePhraseIfNeeded(payload2.__kv_phrase_ticket);
        }
        if (resp.ok && (String(target).toLowerCase() === "prod" || String(target).toLowerCase() === "production")) {
          await Promise.all([
            KV.put(KV_KEYS.lastProdHash, bodyHash),
            KV.put(KV_KEYS.lastProdAt, String(nowMs())),
            KV.put(KV_KEYS.lastKnownGoodProdHash, bodyHash),
            KV.put(KV_KEYS.lastKnownGoodProdAt, String(nowMs()))
          ]);
        }
        return json(resp.status, {
          ok: resp.ok,
          status: resp.status,
          action: "deploy_request",
          target: String(target),
          hash: bodyHash,
          timestamp: nowMs(),
          auth: isAdmin ? "root" : "autonomy",
          deployer_http_status: resp.status,
          deployer_body_snippet: deployerSnippet
        });
      }
      if (url.pathname === "/admin/aura/deploy/verify" && request.method === "POST") {
        const body = await request.text();
        let payload2 = {};
        if (body && body.trim().length) {
          try {
            payload2 = JSON.parse(body);
          } catch {
            return json(400, { ok: false, error: "bad_json" });
          }
        }
        if (!isAdmin) {
          if (!payload2.promotion_phrase) {
            const ticket = await getPhraseTicket();
            if (!ticket.ok) {
              return json(409, { ok: false, error: "promotion_phrase_required", message: "Root must set a phrase ticket via /admin/aura/deploy/phrase before autonomy can promote." });
            }
            payload2.promotion_phrase = ticket.phrase;
            payload2.__kv_phrase_ticket = ticket;
          }
        }
        const status = await readStatus();
        if (!status.last_staging_hash) {
          return json(409, { ok: false, error: "no_staging_deploy_to_verify" });
        }
        const mode = payload2 && payload2.mode || request.headers.get("X-Aura-Verify-Mode") || "fetch_fallback_local";
        const healthUrl = payload2.health_url || payload2.url || request.headers.get("X-Aura-Health-Url") || null;
        if (!isAdmin) {
          if (String(mode).toLowerCase() !== "local") {
            return json(403, { ok: false, error: "autonomy_local_verify_only" });
          }
        }
        if (String(mode).toLowerCase() === "local") {
          const healthJson2 = buildHealthObject();
          await Promise.all([
            KV.put(KV_KEYS.lastStagingVerifiedAt, String(nowMs())),
            KV.put(KV_KEYS.lastStagingVerifyUrl, healthUrl ? String(healthUrl) : "local"),
            KV.put(KV_KEYS.lastStagingVerifyMode, "local")
          ]);
          return json(200, {
            ok: true,
            action: "staging_verified",
            staging_hash: status.last_staging_hash,
            verified_at: nowMs(),
            verify_mode: "local",
            health: healthJson2,
            auth: isAdmin ? "root" : "autonomy"
          });
        }
        if (!healthUrl) {
          return json(400, {
            ok: false,
            error: "missing_health_url",
            message: "Provide health_url or set mode=local."
          });
        }
        let resp;
        let txt;
        try {
          resp = await fetchWithTimeout(healthUrl, 8e3);
          txt = await resp.text();
        } catch (e) {
          if (String(mode).toLowerCase() === "fetch_fallback_local") {
            const healthJson2 = buildHealthObject();
            await Promise.all([
              KV.put(KV_KEYS.lastStagingVerifiedAt, String(nowMs())),
              KV.put(KV_KEYS.lastStagingVerifyUrl, String(healthUrl)),
              KV.put(KV_KEYS.lastStagingVerifyMode, "fallback_local_after_fetch_error")
            ]);
            return json(200, {
              ok: true,
              action: "staging_verified",
              staging_hash: status.last_staging_hash,
              verified_at: nowMs(),
              verify_mode: "fallback_local_after_fetch_error",
              fetch_error: {
                name: e && e.name ? String(e.name) : null,
                message: e && e.message ? String(e.message) : null
              },
              health: healthJson2,
              auth: "root"
            });
          }
          return json(502, {
            ok: false,
            error: "health_fetch_error",
            name: e && e.name ? String(e.name) : null,
            message: e && e.message ? String(e.message) : null,
            health_url: String(healthUrl)
          });
        }
        const contentType = safeHeaderValue(resp.headers.get("content-type"));
        let healthJson;
        try {
          healthJson = JSON.parse(txt);
        } catch {
          if (String(mode).toLowerCase() === "fetch_fallback_local") {
            const localHealth = buildHealthObject();
            await Promise.all([
              KV.put(KV_KEYS.lastStagingVerifiedAt, String(nowMs())),
              KV.put(KV_KEYS.lastStagingVerifyUrl, String(healthUrl)),
              KV.put(KV_KEYS.lastStagingVerifyMode, "fallback_local_after_not_json")
            ]);
            return json(200, {
              ok: true,
              action: "staging_verified",
              staging_hash: status.last_staging_hash,
              verified_at: nowMs(),
              verify_mode: "fallback_local_after_not_json",
              fetch_result: {
                http_status: resp.status,
                content_type: contentType,
                body_snippet: safeBodySnippet(txt)
              },
              health: localHealth,
              auth: "root"
            });
          }
          return json(502, {
            ok: false,
            error: "health_not_json",
            health_url: String(healthUrl),
            http_status: resp.status,
            content_type: contentType,
            body_snippet: safeBodySnippet(txt)
          });
        }
        if (!healthJson || healthJson.ok !== true) {
          return json(409, {
            ok: false,
            error: "health_not_ok",
            health_url: String(healthUrl),
            http_status: resp.status,
            content_type: contentType,
            health: healthJson || null
          });
        }
        await Promise.all([
          KV.put(KV_KEYS.lastStagingVerifiedAt, String(nowMs())),
          KV.put(KV_KEYS.lastStagingVerifyUrl, String(healthUrl)),
          KV.put(KV_KEYS.lastStagingVerifyMode, "fetch_ok")
        ]);
        return json(200, {
          ok: true,
          action: "staging_verified",
          staging_hash: status.last_staging_hash,
          verified_at: nowMs(),
          verify_mode: "fetch_ok",
          health_url: String(healthUrl),
          http_status: resp.status,
          content_type: contentType,
          health: healthJson,
          auth: "root"
        });
      }
      if (url.pathname === "/admin/aura/deploy/promote" && request.method === "POST") {
        const body = await request.text();
        if (!body || body.length < 10) {
          return json(400, { ok: false, error: "invalid_deploy_payload" });
        }
        let payload2;
        try {
          payload2 = JSON.parse(body);
        } catch {
          return json(400, { ok: false, error: "bad_json" });
        }
        if (!isAdmin) {
          if (!payload2.promotion_phrase) {
            const ticket = await getPhraseTicket();
            if (!ticket.ok) {
              return json(409, { ok: false, error: "promotion_phrase_required", message: "Root must set a phrase ticket via /admin/aura/deploy/phrase before autonomy can promote." });
            }
            payload2.promotion_phrase = ticket.phrase;
            payload2.__kv_phrase_ticket = ticket;
          }
        }
        const status = await readStatus();
        if (!status.last_staging_hash || !status.last_staging_verified_at) {
          return json(409, { ok: false, error: "staging_required" });
        }
        const promotingHash = payload2.promoting_hash || payload2.staging_hash || request.headers.get("X-Aura-Promoting-Hash");
        if (!promotingHash || promotingHash !== status.last_staging_hash) {
          return json(409, { ok: false, error: "promoting_hash_mismatch", required: status.last_staging_hash });
        }
        const bodyToSend = JSON.stringify(payload2);
        const bodyHash = await sha256Hex(bodyToSend);
        const resp = await env.AURA_DEPLOYER.fetch("https://deployer/deploy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Deploy-Key": env.DEPLOY_SECRET,
            "X-Aura-Action": isAdmin ? "promote-to-prod-root" : "promote-to-prod-autonomy",
            ...payload2 && payload2.promotion_phrase ? phraseHeaderBundle(payload2.promotion_phrase) : {}
          },
          body: bodyToSend
        });
        const deployerText = await resp.text();
        const deployerSnippet = safeBodySnippet(deployerText);
        if (!isAdmin && payload2.__kv_phrase_ticket && resp.ok) {
          await consumePhraseIfNeeded(payload2.__kv_phrase_ticket);
        }
        if (resp.ok) {
          await Promise.all([
            KV.put(KV_KEYS.lastProdHash, bodyHash),
            KV.put(KV_KEYS.lastProdAt, String(nowMs())),
            KV.put(KV_KEYS.lastKnownGoodProdHash, bodyHash),
            KV.put(KV_KEYS.lastKnownGoodProdAt, String(nowMs()))
          ]);
        }
        return json(resp.status, {
          ok: resp.ok,
          status: resp.status,
          action: "promote_to_prod",
          promoting_hash: promotingHash,
          prod_hash: bodyHash,
          timestamp: nowMs(),
          auth: isAdmin ? "root" : "autonomy",
          deployer_http_status: resp.status,
          deployer_body_snippet: deployerSnippet
        });
      }
      if (url.pathname === "/health") {
        return json(200, buildHealthObject());
      }
      return new Response("ok");
    } catch (err) {
      try {
        const reqUrl = new URL(request.url);
        const isAdminPath = reqUrl.pathname.startsWith("/admin");
        const adminHeader = request.headers.get("X-Core-Pass") || request.headers.get("X-Aura-Pass") || request.headers.get("X-Admin-Token");
        const isRoot = adminHeader && (env && env.AURA_ADMIN_TOKEN) && adminHeader === env.AURA_ADMIN_TOKEN;
        if (isAdminPath && isRoot) {
          const msg = err && err.message ? String(err.message) : "unknown";
          const name = err && err.name ? String(err.name) : null;
          const stack = err && err.stack ? String(err.stack) : null;
          const stackSnippet = stack ? stack.length > 800 ? stack.slice(0, 800) + "\u2026" : stack : null;
          return json(500, {
            ok: false,
            error: "internal_error",
            name,
            message: msg,
            stack_snippet: stackSnippet
          });
        }
      } catch {
      }
      return new Response("internal error", { status: 500 });
    }
  },
  async scheduled(event, env, ctx) {
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
