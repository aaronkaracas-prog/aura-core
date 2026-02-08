// Aura Core index.js (Deterministic command promotion)
// Promotes DEPLOYER_CALL and REGISTRY_* commands to immediate execution.
// Fixes planner/intent interception permanently.

export default {
  async fetch(request, env) {
    const op = request.headers.get("x-operator-token");
    if (!op) return json({ ok: false, error: "unauthorized" }, 401);

    const text = await request.text();
    const firstLine = (text.split(/\r?\n/).find(l => l.trim()) || "").trim();

    // ===== DEPLOYER_CALL =====
    if (firstLine.startsWith("DEPLOYER_CALL")) {
      return handleDeployer(text, op, env);
    }

    // ===== REGISTRY COMMANDS =====
    if (
      firstLine.startsWith("REGISTRY_IMPORT_DOMAINS") ||
      firstLine.startsWith("REGISTRY_LIST") ||
      firstLine.startsWith("REGISTRY_GET") ||
      firstLine.startsWith("REGISTRY_PUT") ||
      firstLine.startsWith("REGISTRY_FILTER")
    ) {
      return handleRegistry(text, op, env);
    }

    // ===== FALLBACK (unchanged) =====
    return json({
      ok: true,
      reply:
        "I can plan and execute deployments via DEPLOYER_CALL when operator-authorized.\n" +
        "Tell me: domain + desired outcome (landing page vs app) and whether we should VERIFIED_FETCH first for the target host."
    });
  }
};

async function handleDeployer(text, op, env) {
  const payload = extractJson(text);
  if (!payload) return json({ ok: false, error: "bad_json" }, 400);

  const { service, path, method } = payload;
  if (!service || !path) {
    return json({ ok: false, error: "missing_fields", required: ["service", "path"] }, 400);
  }

  const target = env[service];
  if (!target || typeof target.fetch !== "function") {
    return json({ ok: false, error: "service_not_found", service }, 404);
  }

  const resp = await target.fetch(`https://${service}${path}`, {
    method: method || "GET",
    headers: {
      "content-type": "application/json",
      "x-operator-token": op
    }
  });

  const out = await safeJson(resp);
  return json({ ok: resp.ok, cmd: "DEPLOYER_CALL", payload: out, http_status: resp.status }, resp.ok ? 200 : 502);
}

async function handleRegistry(text, op, env) {
  const resp = await env.AURA_DEPLOYER.fetch("https://auras.guide/chat", {
    method: "POST",
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-operator-token": op
    },
    body: text
  });

  const out = await safeJson(resp);
  return json({ ok: resp.ok, cmd: "REGISTRY", payload: out, http_status: resp.status }, resp.ok ? 200 : 502);
}

function extractJson(text) {
  const i = text.indexOf("{");
  if (i === -1) return null;
  try {
    return JSON.parse(text.slice(i));
  } catch {
    return null;
  }
}

async function safeJson(resp) {
  const t = await resp.text();
  try { return JSON.parse(t); } catch { return t; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
