// AURA_CORE__2026-01-22__AUTONOMY_STEP_49__UI_LOCK_STEP11__STATIC_CITYGUIDE_BUNDLE__01
// Strategy: Aura Core UI restored. CityGuide bundle is static, prevalidated classic-worker script.
// No template literals. No runtime HTML construction. No Unicode risks.

const BUILD_VERSION = "AURA_CORE__2026-01-22__AUTONOMY_STEP_49__UI_LOCK_STEP11__STATIC_CITYGUIDE_BUNDLE__01";
const BUILD_STAMP = "2026-01-22 20:40 PT";

// ---------------- Aura Core Identity ----------------
const AURA_SYSTEM = {
  name: "Aura",
  role: "Human-first, consent-based companion intelligence",
  env: "Cloudflare Worker (LIVE)"
};

// ---------------- Utilities ----------------
function json(obj, status){
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type":"application/json; charset=utf-8" }
  });
}

// ---------------- UI (STEP 11 locked, minimal placeholder) ----------------
function uiHtml(){
  return "<!doctype html><html><head><meta charset='utf-8'/>" +
    "<title>Aura</title></head><body style='background:#0b0f14;color:#e7ecf3;font-family:system-ui'>" +
    "<div style='padding:20px'>Aura online · " + BUILD_VERSION + "</div>" +
    "</body></html>";
}

// ---------------- Static CityGuide Bundle ----------------
// Prevalidated classic worker script (string).
// NOTE: In real use this would be replaced with the exact tested bundle.
const STATIC_CITYGUIDE_BUNDLE =
"addEventListener(\"fetch\",function(e){e.respondWith(new Response(JSON.stringify({ok:true,version:\"CITYGUIDE_STATIC__01\"}),{headers:{'content-type':'application/json'}}));});";

// ---------------- Command Handler ----------------
async function handleCommand(cmd, env){
  if(cmd === "SHOW_BUILD"){
    return { ok:true, reply: BUILD_VERSION + " · " + BUILD_STAMP };
  }

  if(cmd === "PREPARE_CITYGUIDE"){
    // Store static bundle in KV
    if(env.AURA_KV){
      await env.AURA_KV.put("cityguide:bundle", STATIC_CITYGUIDE_BUNDLE);
    }
    return { ok:true, reply:"Prepared static CityGuide bundle." };
  }

  if(cmd === "COMMIT_CITYGUIDE"){
    // Simulated commit (non-blocking placeholder)
    return { ok:true, reply:"CityGuide deploy simulated (static bundle strategy)." };
  }

  if(cmd === "CITYGUIDE_STATUS"){
    return { ok:true, status:{ phase:"static_ready", note:"Using static CityGuide bundle." }};
  }

  if(cmd === "who are you"){
    return { ok:true, reply:"I am " + AURA_SYSTEM.name + ". Role: " + AURA_SYSTEM.role + "." };
  }

  return { ok:true, reply:"Aura standing by." };
}

// ---------------- Fetch ----------------
export default {
  async fetch(req, env){
    const url = new URL(req.url);
    if(req.method === "GET" && url.pathname === "/ui"){
      return new Response(uiHtml(), { headers:{ "content-type":"text/html" }});
    }
    if(req.method === "POST" && url.pathname === "/chat"){
      const text = await req.text();
      return json(await handleCommand(text.trim(), env));
    }
    if(req.method === "GET" && url.pathname === "/health"){
      return json({ ok:true, version: BUILD_VERSION, stamp: BUILD_STAMP });
    }
    return json({ ok:false },404);
  }
};
