// AURA CORE — Self-Bundle Enabled
// Build: AURA_CORE__2026-01-26__SELF_BUNDLE__01
// Purpose: enable Aura to package her own runtime and hand it to aura-deployer (staging only)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const text = await request.text();

    // Basic router
    if (url.pathname === "/health") {
      return json({ ok: true, build: "AURA_CORE__2026-01-26__SELF_BUNDLE__01" });
    }

    if (url.pathname === "/chat") {
      return handleChat(text, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};

// ---- Chat handler ----
async function handleChat(input, env) {
  const cmd = input.trim();

  // Existing basics
  if (cmd === "PING") return text("PONG");

  // --- Self-bundle commands ---

  if (cmd.startsWith("DECLARE_SELF_BUNDLE_TARGET")) {
    await env.AURA_KV.put("self_bundle_target", cmd);
    return text("self_bundle_target: saved");
  }

  if (cmd === "GENERATE_SELF_BUNDLE") {
    // Read own source via env (bound at deploy time)
    const source = env.RUNTIME_SOURCE;
    if (!source) return text("self_bundle: source_unavailable");

    const bundle = btoa(source);
    const meta = {
      size: bundle.length,
      ts: new Date().toISOString(),
      target: "staging"
    };

    await env.AURA_KV.put("self_bundle_blob", bundle);
    await env.AURA_KV.put("self_bundle_meta", JSON.stringify(meta));

    return text("self_bundle: generated");
  }

  if (cmd === "SHOW_SELF_BUNDLE_METADATA") {
    const meta = await env.AURA_KV.get("self_bundle_meta");
    if (!meta) return text("self_bundle: none");
    return text(meta);
  }

  if (cmd === "SEND_SELF_BUNDLE_TO_DEPLOYER") {
    const bundle = await env.AURA_KV.get("self_bundle_blob");
    if (!bundle) return text("self_bundle: missing");

    const res = await fetch(env.AURA_DEPLOYER_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-DEPLOY-KEY": env.AURA_DEPLOYER_KEY
      },
      body: JSON.stringify({
        target: "staging",
        bundle
      })
    });

    const out = await res.text();
    return text(out);
  }

  return text("unknown_command");
}

// ---- helpers ----
function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json" }
  });
}

function text(t) {
  return new Response(t, { headers: { "content-type": "text/plain" } });
}
