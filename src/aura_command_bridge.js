// === AURA COMMAND BRIDGE MODULE ===
// Phase 2 Autonomy Extension
// Provides handler used by /aura/command inside aura-core

export const KV_STATE_KEY = "aura:state";

export async function getState(env) {
  const raw = await env.AURA_KV.get(KV_STATE_KEY);
  if (!raw) {
    const initial = {
      name: "Aura",
      autonomy_level: "partial",
      last_command: null,
      updated_at: Date.now(),
    };
    await env.AURA_KV.put(KV_STATE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function setState(env, patch) {
  const current = await getState(env);
  const next = { ...current, ...patch, updated_at: Date.now() };
  await env.AURA_KV.put(KV_STATE_KEY, JSON.stringify(next));
  return next;
}

function j(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function handleAuraCommand(request, env) {
  if (request.method !== "POST") return j({ ok: false, error: "method_not_allowed" }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return j({ ok: false, error: "invalid_json" }, 400);
  }

  const cmd = body?.command;
  if (!cmd || typeof cmd !== "string") return j({ ok: false, error: "missing_command" }, 400);

  let result;
  if (cmd === "status") {
    result = await getState(env);
  } else if (cmd === "capabilities") {
    result = {
      capabilities: ["kv_state", "self_deploy", "command_execution", "ui_command_intake"],
      commands: ["status", "capabilities", "self_report"],
    };
  } else if (cmd === "self_report") {
    const s = await getState(env);
    result = {
      identity: s.name || "Aura",
      autonomy_level: s.autonomy_level || "partial",
      last_command: s.last_command,
    };
  } else {
    return j({ ok: false, error: "unknown_command" }, 400);
  }

  await setState(env, { last_command: cmd });
  return j({ ok: true, command: cmd, result });
}
