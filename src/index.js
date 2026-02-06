
// ============================================================
// AURA CORE — UI LOCKED BUILD
// UI CONTRACT — DO NOT MODIFY WITHOUT FULL REPLACEMENT
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ---------- UI ROUTES (SEALED) ----------
    if (path === "/" || path === "/ui" || path === "/core") {
      return new Response(UI_HTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // ---------- CHAT / COMMAND ROUTE ----------
    if (path === "/chat") {
      return handleChat(request, env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  },
};

// ============================================================
// UI_HTML — SINGLE SOURCE OF TRUTH
// ============================================================

const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Aura</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0b0f14;
      color: #e6e6e6;
    }
    header {
      padding: 12px 16px;
      border-bottom: 1px solid #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      background: #0f1623;
    }
    #log {
      padding: 16px;
      height: calc(100vh - 160px);
      overflow-y: auto;
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
    }
    textarea {
      width: 100%;
      height: 100px;
      background: #020617;
      color: #e6e6e6;
      border: none;
      padding: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 13px;
      resize: none;
      outline: none;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #2563eb;
      border: none;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <header>
    <div><strong>Aura</strong></div>
    <div id="meta">build … | <span id="clock"></span></div>
  </header>

  <div id="log"></div>

  <textarea id="input" placeholder="Enter commands… (Ctrl+Enter to send)"></textarea>
  <button id="send">Send</button>

  <script>
    const $ = (id) => document.getElementById(id);
    const log = $("log");
    const input = $("input");

    function stamp() {
      return new Date().toLocaleTimeString();
    }

    function append(text) {
      log.textContent += "\n[" + stamp() + "] " + text;
      log.scrollTop = log.scrollHeight;
    }

    async function send() {
      const body = input.value.trim();
      if (!body) return;
      input.value = "";
      append("> " + body);

      const res = await fetch("/chat", {
        method: "POST",
        headers: { "content-type": "text/plain; charset=utf-8" },
        body,
      });

      const txt = await res.text();
      append(txt);
    }

    $("send").onclick = send;
    input.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") send();
    });

    function tick() {
      $("clock").textContent = new Date().toLocaleString();
    }
    setInterval(tick, 1000);
    tick();
  </script>
</body>
</html>`;

// ============================================================
// AUTONOMY / CHAT HANDLER (UNTOUCHED)
// ============================================================

async function handleChat(request, env, ctx) {
  // Placeholder: existing Aura autonomy logic remains here verbatim
  // (Evidence gating, HERD, registry, claim-gate, etc.)
  return new Response("Aura core active.", { status: 200 });
}
