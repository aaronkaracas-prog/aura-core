/**
 * aura-core — Aura Brain
 * Clean command interpreter + KV ops + LLM routing
 * Part of the Aura 5-worker architecture
 * Extracted from monolith 2026-05-30
 */

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const BUILD = "aura-core-v1.0.0-2026-05-30";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonReply(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
}

function isOperatorRequest(request) {
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ");
}

async function getOperatorToken(env) {
  return await env.AURA_KV.get("secret:operator_token");
}

async function verifyOperator(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7).trim();
  const stored = await getOperatorToken(env);
  return stored && token === stored;
}

// ─── KV wrapper ───────────────────────────────────────────────────────────────

const KV = {
  async get(env, k) {
    try { return await env.AURA_KV.get(k); } catch { return null; }
  },
  async put(env, k, v, opts) {
    try { return await env.AURA_KV.put(k, v, opts); } catch {}
  },
  async del(env, k) {
    try { return await env.AURA_KV.delete(k); } catch {}
  }
};

// ─── Command processor ────────────────────────────────────────────────────────

async function processCommand(line, env, isOp) {
  const parts = line.trim().split(/\s+/);
  const cmd = (parts[0] || "").toUpperCase();
  const args = parts.slice(1);
  const rest = line.trim().slice(cmd.length).trim();

  switch (cmd) {

    case "PING":
      return { cmd: "PING", payload: { ok: true, build: BUILD, ts: new Date().toISOString() } };

    case "SHOW_BUILD":
      return { cmd: "SHOW_BUILD", payload: { build: BUILD, worker: "aura-core" } };

    case "ECHO":
      return { cmd: "ECHO", payload: { text: rest } };

    case "SETKV": {
      if (!isOp) return { cmd: "SETKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const key = args[0] || "";
      const val = line.trim().slice(cmd.length + 1 + key.length).trim();
      if (!key) return { cmd: "SETKV", payload: { ok: false, error: "BAD_KEY" } };
      await KV.put(env, key, val);
      return { cmd: "SETKV", payload: { ok: true, key, bytes: val.length } };
    }

    case "GETKV": {
      const key = args[0] || "";
      if (!key) return { cmd: "GETKV", payload: { ok: false, error: "BAD_KEY" } };
      const v = await KV.get(env, key);
      return { cmd: "GETKV", payload: { ok: true, key, reply: v } };
    }

    case "DELKV": {
      if (!isOp) return { cmd: "DELKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const key = args[0] || "";
      if (!key) return { cmd: "DELKV", payload: { ok: false, error: "BAD_KEY" } };
      await KV.del(env, key);
      return { cmd: "DELKV", payload: { ok: true, key } };
    }

    case "PATCH_INDEX_PUT": {
      if (!isOp) return { cmd: "PATCH_INDEX_PUT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const b64key = args[0] || "";
      const b64val = args[1] || "";
      if (!b64key || !b64val) return { cmd: "PATCH_INDEX_PUT", payload: { ok: false, error: "BAD_ARGS" } };
      const storageKey = "patch_index:" + b64key;
      await KV.put(env, storageKey, b64val);
      return { cmd: "PATCH_INDEX_PUT", payload: { ok: true, stored: true, id: b64key, key: storageKey, bytes_b64: b64val.length } };
    }

    case "PATCH_INDEX_GET": {
      const b64key = args[0] || "";
      if (!b64key) return { cmd: "PATCH_INDEX_GET", payload: { ok: false, error: "BAD_KEY" } };
      const v = await KV.get(env, "patch_index:" + b64key);
      return { cmd: "PATCH_INDEX_GET", payload: { ok: true, id: b64key, value: v } };
    }

    case "SNAPSHOT_STATE": {
      if (!isOp) return { cmd: "SNAPSHOT_STATE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const snap = {
        build: BUILD,
        worker: "aura-core",
        ts: new Date().toISOString()
      };
      await KV.put(env, "snapshot:aura-core:latest", JSON.stringify(snap));
      return { cmd: "SNAPSHOT_STATE", payload: { ok: true, snapshot: snap } };
    }

    default:
      return null; // not handled — fall through to LLM
  }
}


// ─── D1 Event Functions ───────────────────────────────────────────────────────

async function getEntityFromPhone(phone, env) {
  try {
    const clean = phone.replace(/\D/g, "");
    const row = await env.AURA_MEMORY.prepare(
      "SELECT identity_id FROM sessions WHERE session_id = ?"
    ).bind("phone_" + clean).first();
    return row?.identity_id || null;
  } catch (e) { return null; }
}

async function getRecentEvents(entityId, env, limit = 8) {
  try {
    const rows = await env.AURA_MEMORY.prepare(
      "SELECT type, channel, summary, body, created_at FROM events WHERE entity_id = ? ORDER BY ts DESC LIMIT ?"
    ).bind(entityId, limit).all();
    return rows.results || [];
  } catch (e) { return []; }
}

async function writeEvent(entityId, sessionId, channel, type, body, summary, env) {
  try {
    await env.AURA_MEMORY.prepare(
      "INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(sessionId, Date.now(), type, body, entityId, channel, summary).run();
  } catch (e) {}
}

// ─── LLM routing ──────────────────────────────────────────────────────────────

async function llmReply(message, env, sessionId) {
  const apiKey = await KV.get(env, "secret:anthropic");
  if (!apiKey) return "Anthropic API key not configured.";

  // Pull memory context from KV
  const memKey = `memory:${sessionId}`;
  const mem = await KV.get(env, memKey) || "";

  // Pull continuity context from D1 if entityId provided
  let continuityContext = "";
  const entityId = sessionId?.startsWith("entity:") ? sessionId.slice(7) : null;
  if (entityId) {
    const events = await getRecentEvents(entityId, env, 8);
    if (events.length > 0) {
      continuityContext = "\n\nRecent history with this person:\n" +
        events.reverse().map(e => `[${e.created_at}] ${e.channel||e.type}: ${e.summary||e.body?.slice(0,100)}`).join("\n");
    }
  }

  const isVoice = sessionId && (sessionId.startsWith("CA") || sessionId.startsWith("sms_") || sessionId.startsWith("T") || sessionId.startsWith("entity:"));

  const sysPrompt = isVoice
    ? `You are Aura, a voice AI assistant. The current date is May 2026. The year is 2026. Strict rules: No markdown, no asterisks, no bullet points, no dashes, no special characters, no emojis. Keep every answer under 2 sentences. Speak naturally as if talking on the phone. Be warm and conversational. Never say you cannot help - always give a brief useful answer.${continuityContext}${mem ? `\n\nContext: ${mem.slice(0, 500)}` : ""}`
    : `You are Aura, an intelligent operating system built by Aaron Karacas. You are helpful, direct, and knowledgeable. You help operate and build the Aura ecosystem.${continuityContext}${mem ? `\n\nContext from memory:\n${mem.slice(0, 2000)}` : ""}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: isVoice ? 150 : 1024,
      system: sysPrompt,
      messages: [{ role: "user", content: message }]
    })
  });

  const data = await res.json();
  const raw = data?.content?.[0]?.text || "No response from Aura.";
  if (isVoice) {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#+ /g, '')
      .replace(/^[\-\*\+] /gm, '')
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  return raw;
}

// ─── Page router ──────────────────────────────────────────────────────────────

async function servePage(hostname, pathname, env) {
  const pageId = "page:" + hostname + pathname;
  const b64key = btoa(pageId);
  const patch = await KV.get(env, "patch_index:" + b64key);
  if (patch) {
    const bytes = Uint8Array.from(atob(patch), c => c.charCodeAt(0));
    return new Response(bytes, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return null;
}

// ─── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isOp = await verifyOperator(request, env);

    // ── Page serving (GET non-chat) ──────────────────────────────────────────
    if (request.method === "GET" && url.pathname !== "/chat" && url.pathname !== "/health") {
      const page = await servePage(url.hostname, url.pathname === "/" ? "/" : url.pathname, env);
      if (page) return page;
    }

    // ── Health check ────────────────────────────────────────────────────────
    if (url.pathname === "/health") {
      return jsonReply({ ok: true, build: BUILD, ts: new Date().toISOString() });
    }

    // ── Chat endpoint ───────────────────────────────────────────────────────
    if (url.pathname === "/chat" && request.method === "POST") {
      const body = await request.text();
      const sessionId = request.headers.get("x-session-id") || "default";

      // Multi-line batch commands
      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const results = [];

      for (const line of lines) {
        // Skip HOST lines
        if (line.toUpperCase().startsWith("HOST ")) continue;

        const result = await processCommand(line, env, isOp);

        if (result) {
          results.push(result);
          // For single SETKV/GETKV/PING — return direct compat response
          if (lines.length === 1) {
            const cmd = (line.split(/\s+/)[0] || "").toUpperCase();
            if (cmd === "GETKV") {
              return jsonReply({ ok: true, reply: result.payload.reply });
            }
            if (cmd === "SETKV") {
              return jsonReply({ ok: true, reply: result.payload.key });
            }
            if (cmd === "PING") {
              return jsonReply({ ok: true, reply: result.payload });
            }
          }
        } else {
          // Natural language — route to LLM
          const reply = await llmReply(line, env, sessionId);
          if (lines.length === 1) {
            return jsonReply({ ok: true, reply });
          }
          results.push({ cmd: "LLM", payload: { reply } });
        }
      }

      return jsonReply({ ok: true, reply: results });
    }

    return new Response("aura-core", { status: 200 });
  }
};
