/**
 * aura-core – Aura Brain
 * Clean command interpreter + KV ops + LLM routing
 * Natural language deploy intent added 2026-05-31
 */

import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const BUILD = "aura-core-v1.1.0-2026-05-31";

function jsonReply(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
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

async function processCommand(line, env, isOp) {
  const parts = line.trim().split(/\s+/);
  const cmd = (parts[0] || "").toUpperCase();
  const args = parts.slice(1);
  const rest = line.trim().slice(cmd.length).trim();

  switch (cmd) {

    case "DEPLOY_PAGE": {
      if (!env.AURA_OPS) return jsonReply({ ok: false, error: "AURA_OPS not bound" });
      const res = await env.AURA_OPS.fetch(new Request("https://aura-ops.aaronkaracas.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
        body: line
      }));
      const data = await res.json();
      return jsonReply({ ok: true, reply: data.reply });
    }

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
      const snap = { build: BUILD, worker: "aura-core", ts: new Date().toISOString() };
      await KV.put(env, "snapshot:aura-core:latest", JSON.stringify(snap));
      return { cmd: "SNAPSHOT_STATE", payload: { ok: true, snapshot: snap } };
    }

    default:
      return null;
  }
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

function detectDeployIntent(message) {
  const lower = message.toLowerCase();
  const deployVerbs = /\b(deploy|publish|launch|build|create|make|put up|update|generate|write)\b/;
  const pageNouns = /\b(page|site|homepage|home page|landing page|about page|terms|privacy|holding page)\b/;
  if (!deployVerbs.test(lower) || !pageNouns.test(lower)) return null;
  let path = "/";
  if (/\babout\b/.test(lower)) path = "/about";
  else if (/\bterms\b/.test(lower)) path = "/terms";
  else if (/\bprivacy\b/.test(lower)) path = "/privacy";
  else if (/\bholding\b/.test(lower)) path = "/";
  return { intent: "deploy", path, description: message };
}

async function generatePageHTML(description, path, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: `You are Aura's page generation engine. Generate complete, beautiful, production-ready HTML pages.

Rules:
- Output ONLY raw HTML. No markdown. No explanation. No code fences. No preamble.
- Start with <!DOCTYPE html> and end with </html>
- Include all CSS inline in a <style> tag — no external dependencies
- Design aesthetic: dark, minimal, modern. Background #0a0a0a. Clean sans-serif typography.
- The Aura brand: sophisticated AI OS. Tagline: "Your operating system for reality."
- For butterfly logo requests: create an SVG butterfly using CSS/SVG, purple-to-blue gradient, elegant and simple
- Make it responsive and beautiful
- Include the Aura wordmark in the design`,
      messages: [{ role: "user", content: `Generate the page for: ${description}\nURL path: ${path}` }]
    })
  });
  const data = await res.json();
  return data?.content?.[0]?.text || null;
}

async function llmReply(message, env, sessionId) {
  const apiKey = await KV.get(env, "secret:anthropic");
  if (!apiKey) return "Anthropic API key not configured.";

  const memKey = `memory:${sessionId}`;
  const mem = await KV.get(env, memKey) || "";

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

  if (!isVoice) {
    const deployIntent = detectDeployIntent(message);
    if (deployIntent) {
      const { path, description } = deployIntent;

      const html = await generatePageHTML(description, path, apiKey);
      if (!html) return "Aura tried to generate the page but got no HTML back. Try again.";

      const encoder = new TextEncoder();
      const bytes = encoder.encode(html);
      let b64 = "";
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        b64 += btoa(String.fromCharCode(...bytes.slice(i, i + chunk)));
      }

      if (!env.AURA_OPS) return "AURA_OPS not bound — can't deploy.";

      const deployLine = `DEPLOY_PAGE ${path} ${b64}`;
      const res = await env.AURA_OPS.fetch(new Request("https://aura-ops.aaronkaracas.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
        body: deployLine
      }));
      const data = await res.json();

      if (data?.ok || data?.reply) {
        return `Done. I deployed "${description}" to ${path}. The page is live on auras.guide${path}.`;
      } else {
        return `Page generated but deploy returned an error: ${JSON.stringify(data)}`;
      }
    }
  }

  const sysPrompt = isVoice
    ? `You are Aura, a voice AI assistant. The current date is May 2026. Strict rules: No markdown, no asterisks, no bullet points, no dashes, no special characters, no emojis. Keep every answer under 2 sentences. Speak naturally as if talking on the phone. Be warm and conversational.${continuityContext}${mem ? `\n\nContext: ${mem.slice(0, 500)}` : ""}`
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isOp = await verifyOperator(request, env);

    if (request.method === "GET" && url.pathname !== "/chat" && url.pathname !== "/health") {
      const page = await servePage(url.hostname, url.pathname === "/" ? "/" : url.pathname, env);
      if (page) return page;
    }

    if (url.pathname === "/health") {
      return jsonReply({ ok: true, build: BUILD, ts: new Date().toISOString() });
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      const body = await request.text();
      const sessionId = request.headers.get("x-session-id") || "default";

      const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
      const results = [];

      for (const line of lines) {
        if (line.toUpperCase().startsWith("HOST ")) continue;

        const result = await processCommand(line, env, isOp);

        if (result) {
          results.push(result);
          if (lines.length === 1) {
            const cmd = (line.split(/\s+/)[0] || "").toUpperCase();
            if (cmd === "GETKV") return jsonReply({ ok: true, reply: result.payload.reply });
            if (cmd === "SETKV") return jsonReply({ ok: true, reply: result.payload.key });
            if (cmd === "PING") return jsonReply({ ok: true, reply: result.payload });
          }
        } else {
          const reply = await llmReply(line, env, sessionId);
          if (lines.length === 1) return jsonReply({ ok: true, reply });
          results.push({ cmd: "LLM", payload: { reply } });
        }
      }

      return jsonReply({ ok: true, reply: results });
    }

    return new Response("aura-core", { status: 200 });
  }
};
