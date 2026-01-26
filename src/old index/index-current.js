
// Aura Core — single-file Cloudflare Worker
// - /core: ChatGPT-style UI (same visuals)
// - /core.js: UI logic (external JS so buttons always work)
// - /chat: OpenAI Responses API (text + vision)
// - /transcribe: OpenAI Whisper transcription

// FIXES (locked from your base):
// 1) UI buttons dead: move UI logic to /core.js (no inline script)
// 2) Composer overlap: update padding before scroll
// 3) Mic: proper record->stop->await finalize->/transcribe->insert transcript (no auto-send)
// 4) Upload: thumbnail preview + send with message (vision)
// 5) Image generation: "create image ..." returns an assistant image that UI renders

// ADD (this round, functional wiring only; /core visuals unchanged):
// 6) /malibu.city serves HTML (directory page)
// 7) /malibu.city/api/places proxies Google Places using GOOGLE_PLACES_API_KEY (server-side)

const VERSION = "AURA_CORE__2026-01-18__ONEFILE__CHATGPT_UI_LOCK_04__MALIBU_CITY_01__GATEFIX_03__DEPLOY_PAYLOAD_01__SELF_DEPLOY_OK_01__MACV3_5_STATE_AND_DEBUG_01";
const UI_BUILD = "AURA_UI_BUILD__2026-01-15__06";

/* =========================
// AURA — PERSISTENT IDENTITY (READ-ONLY)
// MAC V1
========================= */
const AURA_IDENTITY = Object.freeze({
  name: "Aura",
  role: "human-first companion intelligence",
  mission: "organize information so humans can act",
  guardrails: [
    "neutrality",
    "consent",
    "restraint",
    "transparency",
    "non-manipulation"
  ],
  authority: {
    may_propose: true,
    may_execute: false,
    requires_explicit_human_approval: true
  },
  identity_version: "AURA_IDENTITY__2026-01-18__V1"
});

// Functions for managing threads, local storage, and JSON utilities
const LS_THREADS_KEY = "aura_threads_v1";
const LS_ACTIVE_THREAD_KEY = "aura_active_thread_v1";

function safeJson(text) {
  const clean = (text || "").replace(/^﻿+/, "").trim();
  if (!clean) return null;
  try {
    return JSON.parse(clean);
  } catch (e) {
    return { __parse_error: true, __raw: clean, __message: String(e && e.message ? e.message : e) };
  }
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, headers || {}),
  });
}

// Image generation request processing
function isImagePrompt(text) {
  const t = safeStr(text).trim().toLowerCase();
  if (!t) return false;
  return (
    t.startsWith("create image") ||
    t.startsWith("generate image") ||
    t.startsWith("make an image") ||
    t.startsWith("make image") ||
    t.startsWith("create an image")
  );
}

function extractImagePrompt(text) {
  const raw = safeStr(text).trim();
  if (!raw) return "";
  return raw.replace(/^(create|generate|make)\s+(an\s+)?image\s*(of\s*)?/i, "").trim() || raw;
}

/* OpenAI Image generation */
async function openaiImage(env, prompt) {
  const apiKey = pickApiKey(env);
  if (!apiKey) return { ok: false, error: "missing_api_key" };

  const p = safeStr(prompt).trim();
  if (!p) return { ok: false, error: "missing_prompt" };

  const payload = { model: "gpt-image-1", prompt: p, size: "1024x1024" };

  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { authorization: "Bearer " + apiKey, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await resp.text();
  const j = safeJson(raw);

  if (!resp.ok) return { ok: false, error: "openai_image_error", status: resp.status, detail: j || raw };

  const b64 = j && j.data && j.data[0] && typeof j.data[0].b64_json === "string" ? j.data[0].b64_json : "";
  if (!b64) return { ok: false, error: "image_no_data", detail: j || raw };

  return { ok: true, data_url: "data:image/png;base64," + b64 };
}

// Ensuring UI is forced to update and reflect changes immediately after a command
function forceRenderUI(targetElement, newText) {
  const element = document.querySelector(targetElement);
  if (element) {
    element.innerText = newText; // Apply the updated text
    // Force reflow
    void element.offsetHeight;
    // Dispatch custom Aura event
    element.dispatchEvent(new CustomEvent('aura-ui-update', { bubbles: true }));
  }
}

// This can be integrated into Aura's UI update flow
forceRenderUI('.ask-anything-text', 'Ask anything Aaron');
forceRenderUI('.butterfly-icon', '🦋'); // Red butterfly emoji

// Self-correction: Automatically retry image generation if not successful
async function retryImageGeneration(env, prompt) {
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    const result = await openaiImage(env, prompt);
    if (result.ok) {
      return result;
    }
    retries++;
    console.log(`Retrying image generation attempt ${retries}...`);
  }
  return { ok: false, error: "image_generation_failed", detail: "Max retries reached." };
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/core.js") {
        return js(renderCoreJs(), 200, withNoCacheHeaders());
      }

      // Image handling and other features
      if (isImagePrompt(input)) {
        const prompt = extractImagePrompt(input);
        const img = await retryImageGeneration(env, prompt);
        if (!img.ok) return json(img, 500, withNoCacheHeaders());
        return json(
          { ok: true, kind: "image", image_data_url: img.data_url, caption: "Image generated." },
          200,
          withNoCacheHeaders()
        );
      }
    } catch (e) {
      return json({ ok: false, error: "unhandled_exception", detail: String(e && e.message ? e.message : e) }, 500);
    }
  }
};
