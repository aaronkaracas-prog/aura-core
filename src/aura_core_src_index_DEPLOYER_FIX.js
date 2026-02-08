// Aura Core index.js (DEPLOYER_CALL deterministic execution fix)
// This file promotes DEPLOYER_CALL to immediate execution, bypassing planner/intent routing.
// No other command behavior is modified.

export default {
  async fetch(request, env) {
    const op = request.headers.get("x-operator-token");
    if (!op) return json({ ok: false, error: "unauthorized" }, 401);

    const text = await request.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // --- HARD PROMOTION: DEPLOYER_CALL ---
    if (lines[0].startsWith("DEPLOYER_CALL")) {
      let payloadText = lines.slice(1).join("\n");
      if (!payloadText.startsWith("{")) {
        const braceIndex = text.indexOf("{");
        if (braceIndex !== -1) payloadText = text.slice(braceIndex);
      }

      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (e) {
        return json({ ok: false, error: "bad_json", detail: "DEPLOYER_CALL payload invalid" }, 400);
      }

      const { service, path, method } = payload || {};
      if (!service || !path) {
        return json({ ok: false, error: "missing_fields", required: ["service", "path"] }, 400);
      }

      // Route directly to bound service
      const target = env[service];
      if (!target || typeof target.fetch !== "function") {
        return json({ ok: false, error: "service_not_found", service }, 404);
      }

      const resp = await target.fetch(`https://${service}${path}`, {
        method: method || "GET",
        headers: {
          "content-type": "application/json",
          "x-operator-token": op,
        },
      });

      const outText = await resp.text();
      let out;
      try { out = JSON.parse(outText); } catch { out = outText; }

      return json({
        ok: resp.ok,
        cmd: "DEPLOYER_CALL",
        payload: out,
        http_status: resp.status,
      }, resp.ok ? 200 : 502);
    }

    // --- DEFAULT FALLBACK (unchanged behavior) ---
    return json({
      ok: true,
      reply: "I can plan and execute deployments via DEPLOYER_CALL when operator-authorized.\nTell me: domain + desired outcome (landing page vs app) and whether we should VERIFIED_FETCH first for the target host."
    });
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
