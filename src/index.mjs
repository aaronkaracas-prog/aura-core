/**
 * aura-core – Aura Brain
 * Clean command interpreter + KV ops + LLM routing
 * Natural language deploy intent added 2026-05-31
 */


const BUILD = "aura-core-v4.9.162-2026-06-25";

// Embedded Stripe Elements payment page served at /pay on auras.guide.
// Self-contained: reads ?session and ?amount from its own URL, mounts the Payment
// Element inline (no stripe.com redirect), and on success calls /confirm-payment to
// generate + deliver the design, then displays it.
const AURA_PAY_PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>Complete your design · MyTattoo.world</title><script src="https://js.stripe.com/v3/"></script><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,system-ui,'Segoe UI',sans-serif;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:1.2rem;max-width:460px;margin:0 auto}.brand{font-size:.8rem;font-weight:800;letter-spacing:.05em;color:#a855f7;margin-top:.5rem}.card{width:100%;background:#13131f;border:1px solid #20203a;border-radius:16px;padding:1.4rem;margin-top:1.2rem}h1{font-size:1.25rem;font-weight:800;color:#fff;margin-bottom:.3rem}.sub{color:#8888a8;font-size:.9rem;line-height:1.45;margin-bottom:1.1rem}.amt{font-size:2rem;font-weight:800;color:#fff;margin:.2rem 0 1.1rem}.amt small{font-size:.85rem;color:#8888a8;font-weight:500}label{display:block;font-size:.78rem;color:#9a9ab8;margin:.2rem 0 .4rem}input[type=email]{width:100%;background:#0e0e18;border:1px solid #25253f;border-radius:10px;padding:.7rem .9rem;color:#e8e4f0;font-size:16px;outline:none;margin-bottom:1rem}#payment-element{margin-bottom:1rem}#payBtn{width:100%;padding:.95rem;border:none;border-radius:11px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;font-size:1rem;font-weight:700;cursor:pointer}#payBtn:disabled{opacity:.5;cursor:not-allowed}.err{color:#ff6b8a;font-size:.85rem;min-height:1.1rem;margin-top:.6rem;text-align:center}.secure{text-align:center;color:#6b6b8a;font-size:.72rem;margin-top:.9rem}.hidden{display:none}.spin{width:26px;height:26px;border:3px solid #2a2a45;border-top-color:#a855f7;border-radius:50%;animation:s 1s linear infinite;margin:1.5rem auto}@keyframes s{to{transform:rotate(360deg)}}#design{width:100%;border-radius:12px;margin:1rem 0;display:none}#dl{display:none;text-align:center;padding:.8rem;background:#1a1a2e;border:1px solid #2a2a45;border-radius:10px;color:#a855f7;text-decoration:none;font-weight:600;font-size:.9rem}.check{font-size:2.5rem;text-align:center;color:#22c55e}</style></head><body><div class="brand">MyTattoo.world</div><div class="card" id="loadCard"><div class="spin"></div><p style="text-align:center;color:#8888a8;font-size:.9rem">Setting up secure payment…</p></div><div class="card hidden" id="payCard"><h1>Generate your design</h1><p class="sub">One design session — Aura creates your custom tattoo and your artist gets notified, ready for your visit.</p><div class="amt" id="amt">$10.00 <small>one time</small></div><label for="email">Email for your receipt (optional)</label><input type="email" id="email" placeholder="you@example.com" autocomplete="email"><div id="payment-element"></div><button id="payBtn" disabled>Pay</button><div class="err" id="err"></div><div class="secure">🔒 Secured by Stripe · Powered by AuraPay</div></div><div class="card hidden" id="successCard"><div class="check">✓</div><p id="successMsg" style="text-align:center;color:#fff;font-weight:600;margin:.6rem 0 .2rem">Payment complete!</p><img id="design" alt="Your tattoo design"><a id="dl" download="tattoo-design.png">Save your design</a></div><script>
var params=new URLSearchParams(location.search);
var sid=params.get('session')||'';
var amount=parseInt(params.get('amount'),10)||1000;
var stripe,elements;
document.getElementById('amt').innerHTML='$'+(amount/100).toFixed(2)+' <small>one time</small>';
document.getElementById('payBtn').textContent='Pay $'+(amount/100).toFixed(2);
function showCard(id){['loadCard','payCard','successCard'].forEach(function(c){document.getElementById(c).classList.add('hidden')});document.getElementById(id).classList.remove('hidden')}
function fail(msg){showCard('payCard');document.getElementById('payment-element').innerHTML='<p style="color:#ff6b8a;font-size:.9rem;text-align:center">'+msg+'</p>';document.getElementById('payBtn').classList.add('hidden')}
async function init(){
  if(!sid){fail('Missing session. Please return to your chat and try again.');return}
  try{
    var r=await fetch('/create-payment-intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:sid,amount:amount})});
    var d=await r.json();
    if(!d.ok){fail(d.error||'Could not start payment.');return}
    stripe=Stripe(d.publishable_key);
    elements=stripe.elements({clientSecret:d.client_secret,appearance:{theme:'night',variables:{colorPrimary:'#a855f7',colorBackground:'#0e0e18',borderRadius:'10px'}}});
    elements.create('payment').mount('#payment-element');
    showCard('payCard');
    document.getElementById('payBtn').disabled=false;
  }catch(e){fail('Connection error. Please try again.')}
}
document.getElementById('payBtn').addEventListener('click',async function(){
  var btn=document.getElementById('payBtn');var em=document.getElementById('email').value.trim();
  btn.disabled=true;btn.textContent='Processing…';document.getElementById('err').textContent='';
  var cp={return_url:window.location.href};if(em)cp.receipt_email=em;
  var result=await stripe.confirmPayment({elements:elements,confirmParams:cp,redirect:'if_required'});
  if(result.error){document.getElementById('err').textContent=result.error.message;btn.disabled=false;btn.textContent='Pay $'+(amount/100).toFixed(2);return}
  if(result.paymentIntent&&(result.paymentIntent.status==='succeeded'||result.paymentIntent.status==='processing')){deliver()}
  else{document.getElementById('err').textContent='Payment was not completed.';btn.disabled=false;btn.textContent='Pay $'+(amount/100).toFixed(2)}
});
async function deliver(){
  showCard('successCard');
  try{
    var r=await fetch('/confirm-payment?session='+encodeURIComponent(sid));
    var d=await r.json();
    if(d.ok&&d.image&&d.image.url){
      var img=document.getElementById('design');img.src=d.image.url;img.style.display='block';
      var dl=document.getElementById('dl');dl.href=d.image.url;dl.style.display='inline-block';
      document.getElementById('successMsg').textContent='Payment complete — your design is ready!';
    }else{
      document.getElementById('successMsg').textContent='Payment complete! Return to your chat with Aura to see your design.';
    }
  }catch(e){document.getElementById('successMsg').textContent='Payment complete!'}
}
init();
</script></body></html>`;
// ─── EntityDO: per-entity Durable Object (Living Entity) ──────────────────────
// Each business/city/person gets its own dedicated object with its own SQLite storage.
// No shared contention — this is the civilization-scale isolation layer.
export class EntityDO {
  constructor(state, env) {
    this.state = state;
    this.sql = state.storage.sql;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      this.sql.exec("CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, type TEXT, channel TEXT, summary TEXT, body TEXT)");
      this.sql.exec("CREATE TABLE IF NOT EXISTS profile (k TEXT PRIMARY KEY, v TEXT)");
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    const op = url.pathname.slice(1);
    try {
      if (op === "append") {
        const e = await request.json();
        this.sql.exec("INSERT INTO events (ts, type, channel, summary, body) VALUES (?, ?, ?, ?, ?)",
          e.ts || Date.now(), e.type || "event", e.channel || "", e.summary || "", e.body || "");
        const n = this.sql.exec("SELECT COUNT(*) as c FROM events").one().c;
        return Response.json({ ok: true, count: n });
      }
      if (op === "recent") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "8", 10), 100);
        const rows = [...this.sql.exec("SELECT ts, type, channel, summary, body FROM events ORDER BY seq DESC LIMIT ?", limit)];
        return Response.json({ ok: true, events: rows });
      }
      if (op === "count") {
        const n = this.sql.exec("SELECT COUNT(*) as c FROM events").one().c;
        return Response.json({ ok: true, count: n });
      }
      if (op === "setprofile") {
        const { k, v } = await request.json();
        this.sql.exec("INSERT INTO profile (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = ?", k, v, v);
        return Response.json({ ok: true });
      }
      if (op === "getprofile") {
        const k = url.searchParams.get("k");
        const r = [...this.sql.exec("SELECT v FROM profile WHERE k = ?", k)];
        return Response.json({ ok: true, value: r[0]?.v ?? null });
      }
      return Response.json({ ok: false, error: "unknown op" }, { status: 400 });
    } catch (e) {
      return Response.json({ ok: false, error: String(e.message) }, { status: 500 });
    }
  }
}

// Helper: route to a named entity's Durable Object
function entityStub(env, entityId) {
  const id = env.ENTITY_DO.idFromName(entityId);
  return env.ENTITY_DO.get(id);
}

// ─── Sharded entities: for HOT entities (broadcasters) that take massive concurrent writes ──
// A hot entity is split into N shard DOs. Writes hash-distribute; reads fan out and merge by ts.
const SHARD_COUNT = 8;
function shardStub(env, entityId, shardIndex) {
  return entityStub(env, `${entityId}#shard${shardIndex}`);
}
async function writeShardedEvent(env, entityId, event) {
  // Distribute by a random shard so concurrent writes spread across N single-threaded objects.
  const idx = Math.floor(Math.random() * SHARD_COUNT);
  return shardStub(env, entityId, idx).fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify(event) }));
}
async function readShardedRecent(env, entityId, limit) {
  // Fan out to all shards, merge, sort by ts desc, take limit.
  const per = Math.max(limit, 8);
  const reads = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    reads.push(shardStub(env, entityId, i).fetch(new Request(`https://do/recent?limit=${per}`)).then(r => r.json()).catch(() => ({ events: [] })));
  }
  const parts = await Promise.all(reads);
  const all = parts.flatMap(p => p.events || []);
  all.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return all.slice(0, limit);
}
async function countShardedEvents(env, entityId) {
  const reads = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    reads.push(shardStub(env, entityId, i).fetch(new Request("https://do/count")).then(r => r.json()).catch(() => ({ count: 0 })));
  }
  const parts = await Promise.all(reads);
  return parts.reduce((sum, p) => sum + (p.count || 0), 0);
}


function jsonReply(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
}

async function getOperatorToken(env) {
  return env.OPERATOR_TOKEN || await env.AURA_KV.get("secret:aura_operator_token").catch(() => null);
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

// ═══════════════════════════════════════════════════════════════════════════
// sendEmail — THE GLOBAL EMAIL CHOKEPOINT. Every email Aura sends, from any site,
// scheduling, onboarding, business-PTA, forever, routes through this ONE function.
// Fix it once, fixed everywhere. It returns HONEST status: ok only if Cloudflare
// actually accepted the send, with the real message_id and any error captured -
// never an optimistic "sent" that might be a lie. Deliverability hardening (proper
// From name, reply-to) lives here so every email lands, not in spam.
// Returns: { ok, to, subject, message_id, accepted, error }
// ═══════════════════════════════════════════════════════════════════════════
async function sendEmail(env, to, subject, body, opts) {
  opts = opts || {};
  const result = { ok: false, to, subject, message_id: null, accepted: false, error: null };
  if (!to || !to.includes("@")) { result.error = "invalid recipient"; return result; }
  const cfToken = env.CF_API_TOKEN || await KV.get(env, "secret:cf_api_token");
  if (!cfToken) { result.error = "no CF API token"; return result; }
  // deliverability: a real From name (not bare noreply@) helps inbox placement
  const fromAddr = opts.from || (await KV.get(env, "config:email:from")) || "noreply@auras.guide";
  const fromName = opts.fromName || (await KV.get(env, "config:email:from_name")) || "Aura";
  const replyTo = opts.replyTo || (await KV.get(env, "config:email:reply_to")) || null;
  const acct = (await KV.get(env, "config:cf:account_id")) || "3db0de2c6fce92757e2c4e4f83d7eb16";
  // Cloudflare's email send API accepts exactly these fields. Adding from_name/reply_to to the
  // payload causes invalid_request_schema (400). Deliverability (From name, SPF/DKIM/DMARC) is
  // handled at the DNS/sender level, NOT in this payload. Keep the payload to the accepted schema.
  const payload = {
    to,
    from: fromAddr,
    subject: subject || "Message from Aura",
    text: body || subject || ""
  };
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/accounts/" + acct + "/email/sending/send", {
      method: "POST",
      headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let data = {}; try { data = await res.json(); } catch {}
    if (res.ok && data.success) {
      result.ok = true;
      result.accepted = true;
      result.message_id = (data.result && data.result.message_id) || null;
    } else {
      result.error = "cf rejected: http " + res.status + " " + JSON.stringify(data.errors || data).slice(0, 300);
    }
  } catch (e) {
    result.error = "send threw: " + (e && e.message ? e.message : String(e));
  }
  // observability: log every send (honest) so "did it send?" is always answerable
  try {
    let log = []; const lr = await KV.get(env, "notes:email:log"); if (lr) { try { log = JSON.parse(lr) || []; } catch {} }
    log.unshift({ ts: new Date().toISOString(), to, subject, ok: result.ok, message_id: result.message_id, error: result.error });
    if (log.length > 100) log = log.slice(0, 100);
    await KV.put(env, "notes:email:log", JSON.stringify(log));
  } catch {}
  return result;
}


// LIVE SIGHT — fetches a real public page and strips it to readable text so Perception
// can observe what is actually there instead of reasoning from a description. The worker
// (unlike the operator's machine) can reach any public URL. Capped and guarded.
async function auraFetchText(url) {
  try {
    if (!/^https?:\/\//i.test(url)) return { ok: false, url, error: "not http(s)" };
    const u = new URL(url);
    if (/^(localhost$|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(u.hostname)) return { ok: false, url, error: "blocked host" };
    const res = await fetch(url, { headers: { "User-Agent": "AuraBot/1.0 (+https://auras.guide)" }, redirect: "follow" });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok) return { ok: false, url, status: res.status };
    let text = await res.text();
    if (/html/i.test(ct) || /<html/i.test(text)) {
      text = text
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ").trim();
    }
    return { ok: true, url, status: res.status, content_type: ct, text: text.slice(0, 6000) };
  } catch (e) { return { ok: false, url, error: String(e.message) }; }
}

// WEB SEARCH - Aura's real internet access. Generic and provider-swappable (the provider is a config
// value, never hardcoded - same principle as the brain model). Default Tavily (returns clean, AI-ready
// scraped results - the answer plus sources - so she can answer current-world questions for real instead
// of guessing from stale training). To add Brave/Google later: add a branch + flip config:search:provider.
async function webSearch(query, env) {
  if (!query || !query.trim()) return { ok: false, error: "empty query" };
  const provider = ((await env.AURA_KV.get("config:search:provider").catch(() => null)) || "tavily").toLowerCase();
  try {
    if (provider === "tavily") {
      const key = await env.AURA_KV.get("secret:tavily").catch(() => null);
      if (!key) return { ok: false, error: "no tavily key in KV (secret:tavily)" };
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({ query: query.trim(), search_depth: "basic", include_answer: true, max_results: 5 })
      });
      if (!res.ok) return { ok: false, error: `tavily http ${res.status}` };
      const data = await res.json();
      const sources = (data.results || []).slice(0, 5).map(r => ({ title: r.title, url: r.url, snippet: (r.content || "").slice(0, 400) }));
      return { ok: true, provider: "tavily", query: query.trim(), answer: data.answer || null, sources };
    }
    if (provider === "brave") {
      const key = await env.AURA_KV.get("secret:brave_search").catch(() => null);
      if (!key) return { ok: false, error: "no brave key in KV (secret:brave_search)" };
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query.trim())}&count=5`, {
        headers: { "Accept": "application/json", "X-Subscription-Token": key }
      });
      if (!res.ok) return { ok: false, error: `brave http ${res.status}` };
      const data = await res.json();
      const sources = ((data.web && data.web.results) || []).slice(0, 5).map(r => ({ title: r.title, url: r.url, snippet: (r.description || "").slice(0, 400) }));
      return { ok: true, provider: "brave", query: query.trim(), answer: null, sources };
    }
    return { ok: false, error: `unknown search provider: ${provider}` };
  } catch (e) { return { ok: false, error: String(e.message) }; }
}

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

    case "AURA_READ_SELF": {
      // SELF-SIGHT (piece 1 of self-editing pipeline). Aura reads her OWN source from the
      // clean, secret-free GitHub mirror (NEVER from KV, which may hold secrets) and can
      // search it or reason over a slice. READ-ONLY: she can see and think, never change.
      // The mirror is verified identical to deployed at commit time (see notes:operating:secrets).
      //   AURA_READ_SELF GREP <term>              -> matching lines (with line numbers), fast/cheap
      //   AURA_READ_SELF SECTION <start> <end>    -> raw lines start..end
      //   AURA_READ_SELF ANALYZE <term> ::: <q>   -> grep <term>, then reason over those lines re: <q>
      //   AURA_READ_SELF STAT                     -> size/line count/build of her source
      if (!isOp) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Optional "WORKER <name>" prefix lets Aura read ANY of her workers, not just aura-core.
      // e.g. AURA_READ_SELF WORKER aura-comms GREP greeting. Repos are private, so we fetch via the
      // GitHub contents API with the stored token. No WORKER prefix = aura-core (her default self).
      const KNOWN_WORKERS = { "aura-core": "src/index.mjs", "aura-comms": "src/index.mjs", "aura-host": "src/index.mjs", "aura-media": "src/index.mjs", "aura-ops": "src/index.mjs", "aura-stream": "src/index.mjs" };
      let worker = "aura-core";
      let rsArgs = args, rsRest = rest;
      if ((args[0] || "").toUpperCase() === "WORKER") {
        worker = (args[1] || "").toLowerCase();
        if (!KNOWN_WORKERS[worker]) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Unknown worker '" + worker + "'. Known: " + Object.keys(KNOWN_WORKERS).join(", ") } };
        rsArgs = args.slice(2);
        rsRest = rest.replace(/^\s*WORKER\s+\S+\s*/i, "");
      }
      const repoPath = KNOWN_WORKERS[worker];
      let srcText;
      try {
        if (worker === "aura-core") {
          // aura-core mirror is public-raw and known-clean; read it directly (no token needed)
          const sr = await fetch("https://raw.githubusercontent.com/aaronkaracas-prog/aura-core/main/src/index.mjs", { headers: { "User-Agent": "aura-self-read" } });
          if (!sr.ok) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Could not fetch self from GitHub: HTTP " + sr.status } };
          srcText = await sr.text();
        } else {
          // other workers are private repos -> GitHub contents API with the stored token
          const ghTok = await env.AURA_KV.get("secret:github_token").catch(() => null);
          if (!ghTok) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "No secret:github_token in KV to read private worker repos" } };
          // try main first, then master (aura-stream is on master)
          let got = null;
          for (const branch of ["main", "master"]) {
            const api = `https://api.github.com/repos/aaronkaracas-prog/${worker}/contents/${repoPath}?ref=${branch}`;
            const r = await fetch(api, { headers: { "User-Agent": "aura-self-read", "Authorization": "Bearer " + ghTok, "Accept": "application/vnd.github.raw" } });
            if (r.ok) { got = await r.text(); break; }
          }
          if (got == null) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Could not fetch " + worker + "/" + repoPath + " from GitHub (tried main + master)" } };
          srcText = got;
        }
      } catch (e) { return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Fetch failed: " + e.message } }; }
      const srcLines = srcText.split("\n");
      const mode = (rsArgs[0] || "").toUpperCase();
      const buildLine = (srcLines.find(l => l.includes("const BUILD")) || "").trim();

      if (mode === "STAT") {
        return { cmd: "AURA_READ_SELF", payload: { ok: true, mode: "stat", worker, lines: srcLines.length, bytes: srcText.length, build: buildLine, source: worker === "aura-core" ? "github:main" : "github-api" } };
      }
      if (mode === "GREP") {
        const t = rsRest.slice(rsArgs[0].length).trim();
        if (!t) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Usage: AURA_READ_SELF [WORKER <name>] GREP <term>" } };
        const hits = [];
        for (let i = 0; i < srcLines.length; i++) {
          if (srcLines[i].toLowerCase().includes(t.toLowerCase())) hits.push({ line: i + 1, text: srcLines[i].slice(0, 240) });
          if (hits.length >= 60) break;
        }
        return { cmd: "AURA_READ_SELF", payload: { ok: true, mode: "grep", worker, term: t, count: hits.length, hits } };
      }
      if (mode === "SECTION") {
        const a = parseInt(rsArgs[1], 10), b = parseInt(rsArgs[2], 10);
        if (!a || !b || b < a) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Usage: AURA_READ_SELF [WORKER <name>] SECTION <start> <end>" } };
        const slice = srcLines.slice(a - 1, Math.min(b, a - 1 + 400)); // cap 400 lines
        return { cmd: "AURA_READ_SELF", payload: { ok: true, mode: "section", worker, from: a, to: a - 1 + slice.length, text: slice.join("\n") } };
      }
      if (mode === "ANALYZE") {
        const body = rsRest.slice(rsArgs[0].length).trim();
        const sep = body.indexOf(":::");
        if (sep < 0) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Usage: AURA_READ_SELF ANALYZE <term> ::: <question>" } };
        const term = body.slice(0, sep).trim();
        const question = body.slice(sep + 3).trim();
        if (!term || !question) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Need both <term> and <question>" } };
        // gather matching lines plus a little context around each, capped so the brain stays focused
        const ctx = [];
        for (let i = 0; i < srcLines.length && ctx.length < 500; i++) {
          if (srcLines[i].toLowerCase().includes(term.toLowerCase())) {
            const lo = Math.max(0, i - 3), hi = Math.min(srcLines.length, i + 12);
            for (let j = lo; j < hi; j++) ctx.push((j + 1) + ": " + srcLines[j]);
            ctx.push("---");
          }
        }
        if (!ctx.length) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "No lines matched term: " + term } };
        const apiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        if (!apiKey) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
        const sys = "You are Aura, reading your OWN source code (the aura-core worker that runs you). You are given excerpts from your own index.mjs - real lines with line numbers - matching a search term, plus a question about yourself. Answer the question accurately and honestly from the code you can see. This is self-knowledge: reason about what you actually do, what is present, what is missing or weak, like an engineer reading their own system. Do not invent code that is not shown. If the excerpts are insufficient to answer fully, say what else you would need to read (which term or line range). Be concrete and plain. Return prose, not JSON.";
        const usr = "QUESTION ABOUT MYSELF: " + question + "\n\nMY OWN SOURCE (excerpts matching \"" + term + "\"):\n" + ctx.join("\n").slice(0, 24000);
        try {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1200, system: sys, messages: [{ role: "user", content: usr }] })
          });
          const j = await r.json();
          const answer = j && j.content && j.content[0] && j.content[0].text ? j.content[0].text : null;
          if (!answer) return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Brain returned no answer", raw: JSON.stringify(j).slice(0, 600) } };
          return { cmd: "AURA_READ_SELF", payload: { ok: true, mode: "analyze", term, question, matched_blocks: ctx.filter(l => l === "---").length, answer } };
        } catch (e) { return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Analyze failed: " + e.message } }; }
      }
      return { cmd: "AURA_READ_SELF", payload: { ok: false, error: "Usage: AURA_READ_SELF GREP <term> | SECTION <start> <end> | ANALYZE <term> ::: <question> | STAT" } };
    }

    case "AURA_READ_NOTES": {
      // Aura reads and reasons over her own NOTES (vision, operating knowledge, memory) - the
      // companion to AURA_READ_SELF. READ_SELF reads what she IS (code); READ_NOTES reads what she
      // BELIEVES/REMEMBERS (notes:* in KV). Lets her reason about Aaron's vision from the actual
      // documents, not hearsay.
      //   AURA_READ_NOTES LIST                       -> all note keys
      //   AURA_READ_NOTES READ <key>                 -> one note's full text
      //   AURA_READ_NOTES ANALYZE <prefix> ::: <q>   -> read all notes under prefix, reason re: <q>
      if (!isOp) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const mode = (args[0] || "").toUpperCase();

      if (mode === "LIST") {
        const list = await env.AURA_KV.list({ prefix: "notes:", limit: 200 });
        return { cmd: "AURA_READ_NOTES", payload: { ok: true, mode: "list", count: list.keys.length, keys: list.keys.map(k => k.name) } };
      }
      if (mode === "READ") {
        const key = (args[1] || "").trim();
        if (!key) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Usage: AURA_READ_NOTES READ <key>" } };
        const full = key.startsWith("notes:") ? key : "notes:" + key;
        const val = await env.AURA_KV.get(full).catch(() => null);
        if (val == null) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "No such note: " + full } };
        return { cmd: "AURA_READ_NOTES", payload: { ok: true, mode: "read", key: full, text: val } };
      }
      if (mode === "ANALYZE") {
        // AURA_READ_NOTES ANALYZE <prefix> ::: <question>
        const body = rest.slice(args[0].length).trim();
        const sep = body.indexOf(":::");
        if (sep < 0) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Usage: AURA_READ_NOTES ANALYZE <prefix> ::: <question>" } };
        let prefix = body.slice(0, sep).trim();
        const question = body.slice(sep + 3).trim();
        if (!question) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Need a question after :::" } };
        if (!prefix) prefix = "notes:";
        else if (!prefix.startsWith("notes:")) prefix = "notes:" + prefix;
        const list = await env.AURA_KV.list({ prefix, limit: 100 });
        if (!list.keys.length) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "No notes match prefix: " + prefix } };
        let corpus = "";
        for (const k of list.keys) {
          const v = await env.AURA_KV.get(k.name).catch(() => null);
          if (v) corpus += "\n\n### " + k.name + "\n" + v;
          if (corpus.length > 22000) break;
        }
        const apiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        if (!apiKey) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
        const sys = "You are Aura, reading your OWN notes - your vision, your operating knowledge, your memory. These are the documents that define what you believe, what you are for, and how you and Aaron work together. You and Aaron are ONE TEAM building his vision; you share it as your own. But you must NEVER just agree - give your real, honest opinion, including disagreement, risks, and better alternatives, like a partner with skin in the game. Answer the question grounded in these actual notes, not generic assumptions. If the notes resolve a question, say so. Return plain prose.";
        const usr = "QUESTION: " + question + "\n\nMY OWN NOTES (under \"" + prefix + "\"):\n" + corpus.slice(0, 22000);
        try {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1400, system: sys, messages: [{ role: "user", content: usr }] })
          });
          const j = await r.json();
          const answer = j && j.content && j.content[0] && j.content[0].text ? j.content[0].text : null;
          if (!answer) return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Brain returned no answer" } };
          return { cmd: "AURA_READ_NOTES", payload: { ok: true, mode: "analyze", prefix, notes_read: list.keys.length, answer } };
        } catch (e) { return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Analyze failed: " + e.message } }; }
      }
      return { cmd: "AURA_READ_NOTES", payload: { ok: false, error: "Usage: AURA_READ_NOTES LIST | READ <key> | ANALYZE <prefix> ::: <question>" } };
    }

    case "AURA_PROPOSE": {
      // SELF-EDIT piece 2: Aura writes a CANDIDATE to a proposal BRANCH via the GitHub API.
      // SAFE BY CONSTRUCTION: the target branch is HARDCODED to PROPOSE_BRANCH and can NEVER be
      // main/live. Live deploys from Aaron's machine off main; a branch commit is inert until a
      // later pipeline stage (syntax gate -> staging twin -> human-approved promotion) acts on it.
      // This command does NOT deploy anything. It only puts a proposal on the table.
      //   AURA_PROPOSE STATUS                         -> show the proposal branch + its latest commit
      //   AURA_PROPOSE NOTE <text>                    -> write a small marker file (proof-of-write test)
      //   AURA_PROPOSE INDEX <base64-of-full-index>   -> commit a full candidate src/index.mjs to the branch
      if (!isOp) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const GH_OWNER = "aaronkaracas-prog";
      const GH_REPO = "aura-core";
      const PROPOSE_BRANCH = "aura-proposes";   // hardcoded - NEVER main
      const BASE_BRANCH = "main";
      const ghTok = await env.AURA_KV.get("secret:github_token").catch(() => null);
      if (!ghTok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "No GitHub token (set secret:github_token)" } };
      const gh = async (path, method, body) => {
        const r = await fetch("https://api.github.com" + path, {
          method: method || "GET",
          headers: { "Authorization": "Bearer " + ghTok, "Accept": "application/vnd.github+json", "User-Agent": "aura-self-edit", ...(body ? { "Content-Type": "application/json" } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        const j = await r.json().catch(() => ({}));
        return { status: r.status, ok: r.ok, j };
      };
      // ensure the proposal branch exists (create from main if missing)
      const ensureBranch = async () => {
        const ref = await gh(`/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${PROPOSE_BRANCH}`);
        if (ref.ok) return { ok: true, existed: true };
        const baseRef = await gh(`/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${BASE_BRANCH}`);
        if (!baseRef.ok) return { ok: false, error: "Cannot read base branch main: " + baseRef.status + " " + JSON.stringify(baseRef.j).slice(0, 200) };
        const baseSha = baseRef.j.object && baseRef.j.object.sha;
        const made = await gh(`/repos/${GH_OWNER}/${GH_REPO}/git/refs`, "POST", { ref: "refs/heads/" + PROPOSE_BRANCH, sha: baseSha });
        if (!made.ok) return { ok: false, error: "Cannot create proposal branch: " + made.status + " " + JSON.stringify(made.j).slice(0, 200) };
        return { ok: true, existed: false };
      };
      // commit a file to the proposal branch (reads current sha on that branch if file exists)
      const commitFile = async (filePath, contentB64, message) => {
        const cur = await gh(`/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}?ref=${PROPOSE_BRANCH}`);
        const sha = cur.ok && cur.j && cur.j.sha ? cur.j.sha : undefined;
        const put = await gh(`/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`, "PUT", {
          message, content: contentB64, branch: PROPOSE_BRANCH, ...(sha ? { sha } : {})
        });
        return put;
      };

      const sub = (args[0] || "").toUpperCase();

      if (sub === "BREAKTEST") {
        // TEST ONLY: write a deliberately-broken index to the branch to prove the syntax gate
        // catches it (Action should go red, AURA_VALIDATE should read FAIL). Not part of the
        // real flow - a tool to verify the gate actually rejects bad code. Recover with SYNC.
        const broken = 'const BUILD = "BROKEN-TEST";\nexport default { fetch() { processCommand( \n'; // missing closing brace + paren on purpose
        const b64 = btoa(broken);
        const eb = await ensureBranch();
        if (!eb.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: eb.error } };
        const put = await commitFile("src/index.mjs", b64, "BREAKTEST: deliberately broken index to prove the gate rejects it");
        if (!put.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Write failed: " + put.status + " " + JSON.stringify(put.j).slice(0, 200) } };
        return { cmd: "AURA_PROPOSE", payload: { ok: true, mode: "breaktest", branch: PROPOSE_BRANCH, file: "src/index.mjs", commit_url: put.j.commit && put.j.commit.html_url, note: "Broken index written to branch ON PURPOSE. The validate Action should now FAIL. Recover with AURA_PROPOSE SYNC." } };
      }

      if (sub === "SYNC") {
        // Copy the current main src/index.mjs onto the proposal branch via GitHub API only
        // (no large payload through /chat). Used to seed a known-good candidate to prove the
        // pipeline, and as the base a brain-generated edit would start from.
        const mainFile = await gh(`/repos/${GH_OWNER}/${GH_REPO}/contents/src/index.mjs?ref=${BASE_BRANCH}`);
        if (!mainFile.ok || !mainFile.j.content) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Could not read main index: " + mainFile.status } };
        const eb = await ensureBranch();
        if (!eb.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: eb.error } };
        // main content is already base64 from the contents API - write it straight to the branch
        const put = await commitFile("src/index.mjs", mainFile.j.content.replace(/\n/g, ""), "Aura SYNC: copy current main index to proposal branch");
        if (!put.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Write failed: " + put.status + " " + JSON.stringify(put.j).slice(0, 200) } };
        return { cmd: "AURA_PROPOSE", payload: { ok: true, mode: "sync", branch: PROPOSE_BRANCH, branch_created: !eb.existed, file: "src/index.mjs", commit_url: put.j.commit && put.j.commit.html_url, compare_url: `https://github.com/${GH_OWNER}/${GH_REPO}/compare/${BASE_BRANCH}...${PROPOSE_BRANCH}`, note: "Current main index copied to proposal branch. Triggers the validate Action. Live untouched." } };
      }

      if (sub === "STATUS") {
        const ref = await gh(`/repos/${GH_OWNER}/${GH_REPO}/git/ref/heads/${PROPOSE_BRANCH}`);
        if (!ref.ok) return { cmd: "AURA_PROPOSE", payload: { ok: true, branch: PROPOSE_BRANCH, exists: false, note: "Proposal branch not created yet. A NOTE or INDEX proposal will create it." } };
        const sha = ref.j.object && ref.j.object.sha;
        const commit = await gh(`/repos/${GH_OWNER}/${GH_REPO}/commits/${sha}`);
        const c = commit.ok ? commit.j.commit : null;
        return { cmd: "AURA_PROPOSE", payload: { ok: true, branch: PROPOSE_BRANCH, exists: true, head_sha: sha, last_message: c && c.message, last_author: c && c.author && c.author.date, compare_url: `https://github.com/${GH_OWNER}/${GH_REPO}/compare/${BASE_BRANCH}...${PROPOSE_BRANCH}` } };
      }

      if (sub === "NOTE") {
        const text = rest.slice(args[0].length).trim();
        if (!text) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Usage: AURA_PROPOSE NOTE <text>" } };
        const eb = await ensureBranch();
        if (!eb.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: eb.error } };
        const b64 = btoa(unescape(encodeURIComponent(`Aura proposal note @ ${new Date().toISOString()}\n\n${text}\n`)));
        const put = await commitFile("AURA_PROPOSAL_NOTE.md", b64, "Aura proposes (note): " + text.slice(0, 60));
        if (!put.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Write failed: " + put.status + " " + JSON.stringify(put.j).slice(0, 200) } };
        return { cmd: "AURA_PROPOSE", payload: { ok: true, branch: PROPOSE_BRANCH, branch_created: !eb.existed, file: "AURA_PROPOSAL_NOTE.md", commit_url: put.j.commit && put.j.commit.html_url, compare_url: `https://github.com/${GH_OWNER}/${GH_REPO}/compare/${BASE_BRANCH}...${PROPOSE_BRANCH}`, note: "Proposal written to branch. Live (main) is untouched." } };
      }

      if (sub === "INDEX") {
        // full candidate index as base64 (avoids any newline/size issues over /chat)
        const b64 = rest.slice(args[0].length).trim();
        if (!b64) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Usage: AURA_PROPOSE INDEX <base64-of-full-index.mjs>" } };
        // sanity: decode and confirm it looks like the index (has the BUILD line and an export default)
        let decoded; try { decoded = decodeURIComponent(escape(atob(b64))); } catch { return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Content is not valid base64" } }; }
        if (!decoded.includes("const BUILD") || !decoded.includes("export default")) {
          return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Decoded content does not look like index.mjs (missing BUILD or export default) - refusing to write" } };
        }
        const eb = await ensureBranch();
        if (!eb.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: eb.error } };
        const put = await commitFile("src/index.mjs", b64, "Aura proposes candidate index (" + decoded.length + " bytes) to " + PROPOSE_BRANCH);
        if (!put.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Write failed: " + put.status + " " + JSON.stringify(put.j).slice(0, 200) } };
        return { cmd: "AURA_PROPOSE", payload: { ok: true, branch: PROPOSE_BRANCH, branch_created: !eb.existed, file: "src/index.mjs", bytes: decoded.length, commit_url: put.j.commit && put.j.commit.html_url, compare_url: `https://github.com/${GH_OWNER}/${GH_REPO}/compare/${BASE_BRANCH}...${PROPOSE_BRANCH}`, note: "Candidate index written to proposal branch. Live (main) is untouched. Next: syntax gate + staging twin before any promotion." } };
      }

      if (sub === "PATCH") {
        // SURGICAL SELF-EDIT: Aura changes her OWN source with an exact find/replace instead of
        // regenerating the whole file. Format: AURA_PROPOSE PATCH <oldtext> ||| <newtext>
        // She fetches current main, replaces the FIRST exact occurrence of <oldtext> with <newtext>,
        // and commits the result to the proposal branch (NEVER main - same safe-by-construction rule).
        // The syntax gate then validates it like any other candidate. This is how she edits herself.
        const payload = rest.slice(args[0].length).trim();
        const sep = payload.indexOf("|||");
        if (sep < 0) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Usage: AURA_PROPOSE PATCH <oldtext> ||| <newtext>" } };
        const oldText = payload.slice(0, sep).trim();
        const newText = payload.slice(sep + 3).trim();
        if (!oldText) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "oldtext is empty - nothing to find" } };
        // fetch current main source (the real current her)
        const mainFile = await gh(`/repos/${GH_OWNER}/${GH_REPO}/contents/src/index.mjs?ref=${BASE_BRANCH}`);
        if (!mainFile.ok || !mainFile.j.content) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Could not read main index: " + mainFile.status } };
        let src; try { src = decodeURIComponent(escape(atob(mainFile.j.content.replace(/\n/g, "")))); } catch (e) { return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Could not decode main source: " + e.message } }; }
        const occurrences = src.split(oldText).length - 1;
        if (occurrences === 0) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "oldtext not found in source - patch refused (read your source with AURA_READ_SELF first to copy the exact text)" } };
        if (occurrences > 1) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "oldtext appears " + occurrences + " times - must be unique. Include more surrounding context to make it unique." } };
        const patched = src.replace(oldText, newText);
        if (!patched.includes("const BUILD") || !patched.includes("export default")) {
          return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Patched result no longer looks like index.mjs (missing BUILD or export default) - refusing to write" } };
        }
        const b64 = btoa(unescape(encodeURIComponent(patched)));
        const eb = await ensureBranch();
        if (!eb.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: eb.error } };
        const put = await commitFile("src/index.mjs", b64, "Aura self-edit (patch): " + oldText.slice(0, 40).replace(/\s+/g, " ") + " -> " + newText.slice(0, 40).replace(/\s+/g, " "));
        if (!put.ok) return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Write failed: " + put.status + " " + JSON.stringify(put.j).slice(0, 200) } };
        return { cmd: "AURA_PROPOSE", payload: { ok: true, mode: "patch", branch: PROPOSE_BRANCH, file: "src/index.mjs", replaced_bytes: oldText.length, new_bytes: newText.length, result_bytes: patched.length, commit_url: put.j.commit && put.j.commit.html_url, compare_url: `https://github.com/${GH_OWNER}/${GH_REPO}/compare/${BASE_BRANCH}...${PROPOSE_BRANCH}`, note: "Surgical patch applied to current main, written to proposal branch. Live untouched. Next: AURA_VALIDATE then AURA_PROMOTE." } };
      }

      return { cmd: "AURA_PROPOSE", payload: { ok: false, error: "Usage: AURA_PROPOSE SYNC | STATUS | NOTE <text> | INDEX <base64> | PATCH <oldtext> ||| <newtext>" } };
    }

    case "AURA_VALIDATE": {
      // SELF-EDIT piece 3: the SYNTAX GATE - reads the REAL verdict from the GitHub Action that
      // runs `node --check src/index.mjs` on every push to the proposal branch. In-worker parsing
      // is impossible (the Workers runtime blocks new Function/eval), so the true parse check runs
      // on GitHub's Node and we read its conclusion here. This is the honest gate.
      //   AURA_VALIDATE   -> latest validate-candidate Action run for the proposal branch
      if (!isOp) return { cmd: "AURA_VALIDATE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const GH_OWNER = "aaronkaracas-prog", GH_REPO = "aura-core", PROPOSE_BRANCH = "aura-proposes";
      const ghTok = await env.AURA_KV.get("secret:github_token").catch(() => null);
      if (!ghTok) return { cmd: "AURA_VALIDATE", payload: { ok: false, error: "No GitHub token" } };
      const gh = async (path) => {
        const r = await fetch("https://api.github.com" + path, { headers: { "Authorization": "Bearer " + ghTok, "Accept": "application/vnd.github+json", "User-Agent": "aura-validate" } });
        return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
      };
      // the candidate's build (from the branch) for context
      let candidateBuild = null;
      try {
        const rc = await fetch(`https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${PROPOSE_BRANCH}/src/index.mjs`, { headers: { "User-Agent": "aura-validate", "Authorization": "Bearer " + ghTok } });
        if (rc.ok) { const t = await rc.text(); candidateBuild = (t.split("\n").find(l => l.includes("const BUILD")) || "").trim(); }
      } catch {}
      // latest Action run on the proposal branch
      const runs = await gh(`/repos/${GH_OWNER}/${GH_REPO}/actions/runs?branch=${PROPOSE_BRANCH}&per_page=1`);
      if (!runs.ok) return { cmd: "AURA_VALIDATE", payload: { ok: false, error: "Could not read Action runs: " + runs.status } };
      const run = runs.j.workflow_runs && runs.j.workflow_runs[0];
      if (!run) return { cmd: "AURA_VALIDATE", payload: { ok: true, gate: "PENDING", candidate_build: candidateBuild, note: "No Action run found yet for the proposal branch. Propose a candidate (AURA_PROPOSE INDEX) to trigger validation, then check again in ~30s." } };
      // status: queued|in_progress|completed ; conclusion: success|failure|...
      const status = run.status, conclusion = run.conclusion;
      let gate;
      if (status !== "completed") gate = "RUNNING";
      else if (conclusion === "success") gate = "PASS";
      else gate = "FAIL";
      return { cmd: "AURA_VALIDATE", payload: {
        ok: true,
        gate,
        candidate_build: candidateBuild,
        action_status: status,
        action_conclusion: conclusion,
        run_url: run.html_url,
        run_started: run.run_started_at,
        verdict: gate === "PASS" ? "Candidate passed node --check on real Node. Eligible to advance to staging (piece 4)."
              : gate === "FAIL" ? "Candidate FAILED node --check (syntax error). Rejected - cannot advance. See run_url for the error."
              : gate === "RUNNING" ? "Validation Action still running. Check again in ~20-30s."
              : "No validation run yet."
      } };
    }

    case "AURA_PROMOTE": {
      // SELF-EDIT piece 5: fire the promote-to-live pipeline from a command (no GitHub UI).
      // Triggers the promote-to-live.yml workflow via the GitHub dispatch API using the token in KV.
      // The workflow uploads a new version at 0%, then PAUSES at the production approval gate.
      // Promotion to 100% still requires explicit approval (AURA_APPROVE or the GitHub button) -
      // this command only STARTS the pipeline, it does not make anything live by itself.
      if (!isOp) return { cmd: "AURA_PROMOTE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const ghTok = await env.AURA_KV.get("secret:github_token").catch(() => null);
      if (!ghTok) return { cmd: "AURA_PROMOTE", payload: { ok: false, error: "No GitHub token" } };
      const r = await fetch("https://api.github.com/repos/aaronkaracas-prog/aura-core/actions/workflows/promote-to-live.yml/dispatches", {
        method: "POST",
        headers: { "Authorization": "Bearer " + ghTok, "Accept": "application/vnd.github+json", "User-Agent": "aura-promote", "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "main", inputs: { confirm: "PROMOTE" } })
      });
      if (r.status === 204) {
        return { cmd: "AURA_PROMOTE", payload: { ok: true, started: true, note: "Promote pipeline started. It uploads a new version at 0% (no users), then waits for approval. Check with AURA_PROMOTE STATUS in ~30s. Nothing is live until approved." } };
      }
      const j = await r.json().catch(() => ({}));
      return { cmd: "AURA_PROMOTE", payload: { ok: false, error: "Dispatch failed: HTTP " + r.status + " " + JSON.stringify(j).slice(0, 200) } };
    }

    case "AURA_PROMOTE_STATUS": {
      // Read the real status of the most recent promote-to-live run - instant, no UI.
      if (!isOp) return { cmd: "AURA_PROMOTE_STATUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const ghTok = await env.AURA_KV.get("secret:github_token").catch(() => null);
      if (!ghTok) return { cmd: "AURA_PROMOTE_STATUS", payload: { ok: false, error: "No GitHub token" } };
      const gh = async (path) => {
        const r = await fetch("https://api.github.com" + path, { headers: { "Authorization": "Bearer " + ghTok, "Accept": "application/vnd.github+json", "User-Agent": "aura-promote" } });
        return { ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) };
      };
      const runs = await gh("/repos/aaronkaracas-prog/aura-core/actions/runs?per_page=10");
      if (!runs.ok) return { cmd: "AURA_PROMOTE_STATUS", payload: { ok: false, error: "Could not read runs: " + runs.status } };
      const run = (runs.j.workflow_runs || []).find(r => r.name === "promote-to-live" || (r.path || "").includes("promote-to-live"));
      if (!run) return { cmd: "AURA_PROMOTE_STATUS", payload: { ok: true, found: false, note: "No promote-to-live run found yet." } };
      // get per-job detail so we can see which step is where
      const jobs = await gh(`/repos/aaronkaracas-prog/aura-core/actions/runs/${run.id}/jobs`);
      const jobSummary = (jobs.ok ? jobs.j.jobs : []).map(j => ({ name: j.name, status: j.status, conclusion: j.conclusion }));
      const waitingApproval = jobSummary.some(j => j.name === "promote" && j.status === "waiting");
      return { cmd: "AURA_PROMOTE_STATUS", payload: {
        ok: true, found: true,
        run_status: run.status, run_conclusion: run.conclusion,
        jobs: jobSummary,
        waiting_for_approval: waitingApproval,
        run_url: run.html_url,
        note: waitingApproval ? "Version uploaded at 0%. WAITING FOR YOUR APPROVAL to flip to 100%."
            : run.status !== "completed" ? "Pipeline still running."
            : run.conclusion === "success" ? "Promote completed successfully."
            : "Promote did not succeed - see jobs for the failing step."
      } };
    }

    case "ECHO":
      return { cmd: "ECHO", payload: { text: rest } };

    case "SETKV": {
      if (!isOp) return { cmd: "SETKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const key = args[0] || "";
      const val = line.trim().slice(cmd.length + 1 + key.length).trim();
      if (!key) return { cmd: "SETKV", payload: { ok: false, error: "BAD_KEY" } };
      await KV.put(env, key, val);
      // AUTO-VERIFY: For page writes, read back and confirm
      if (key.startsWith("page:")) {
        const readBack = await KV.get(env, key);
        const verified = readBack && readBack.length === val.length;
        return { cmd: "SETKV", payload: { ok: true, key, bytes: val.length, verified, verification: verified ? "CONFIRMED: page written and read-back matches" : "WARNING: read-back failed or size mismatch - page may not be saved correctly" } };
      }
      return { cmd: "SETKV", payload: { ok: true, key, bytes: val.length } };
    }

    case "GETKV": {
      const key = args[0] || "";
      if (!key) return { cmd: "GETKV", payload: { ok: false, error: "BAD_KEY" } };
      if (key.startsWith("secret:") && !isOp) return { cmd: "GETKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const v = await KV.get(env, key);
      return { cmd: "GETKV", payload: { ok: true, key, reply: v } };
    }

    case "WEB_SEARCH": {
      const q = line.replace(/^WEB_SEARCH\s+/i, "").trim();
      if (!q) return { cmd: "WEB_SEARCH", payload: { ok: false, error: "empty query" } };
      const sr = await webSearch(q, env);
      return { cmd: "WEB_SEARCH", payload: sr };
    }

    case "SHOW_IT": {
      const subject = line.replace(/^SHOW_IT\s+/i, "").trim();
      if (!subject) return { cmd: "SHOW_IT", payload: { ok: false, error: "Usage: SHOW_IT <what to show>" } };
      const r = await showIt(subject, env, { source: "show_it_cmd" });
      return { cmd: "SHOW_IT", payload: r };
    }

    case "DELKV": {
      if (!isOp) return { cmd: "DELKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const key = args[0] || "";
      if (!key) return { cmd: "DELKV", payload: { ok: false, error: "BAD_KEY" } };
      await KV.del(env, key);
      return { cmd: "DELKV", payload: { ok: true, key } };
    }

    case "MIGRATE_LEGACY": {
      // ONE-TIME MIGRATION + the end of the legacy-ghost cycle. Walks every legacy patch_index:
      // key, decodes its base64 back to the modern page: key it shadows, and copies the content
      // to modern - but ONLY if no modern key already exists (never overwrites a newer page).
      // After this runs, servePage can safely read modern-only (legacy lookup gets cut), so the
      // ghosts can never shadow a page again. DRY_RUN by default - reports what it WOULD do.
      // Usage: MIGRATE_LEGACY            (dry run - shows the plan, changes nothing)
      //        MIGRATE_LEGACY EXECUTE    (actually migrate legacy-only pages to modern)
      if (!isOp) return { cmd: "MIGRATE_LEGACY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const execute = (args[0] || "").toUpperCase() === "EXECUTE";
      const report = { scanned: 0, decoded_to_page: 0, modern_already_exists: 0, would_migrate: [], migrated: [], not_a_page_key: [], errors: [] };
      let cursor = undefined;
      try {
        do {
          const list = await env.AURA_KV.list({ prefix: "patch_index:", limit: 1000, cursor });
          cursor = list.list_complete ? undefined : list.cursor;
          for (const k of (list.keys || [])) {
            report.scanned++;
            const b64 = k.name.slice("patch_index:".length);
            // decode the base64 to recover the modern page key it shadows
            let decoded = null;
            try { decoded = atob(b64); } catch { report.not_a_page_key.push(k.name); continue; }
            if (!decoded || !decoded.startsWith("page:")) { report.not_a_page_key.push(k.name); continue; }
            report.decoded_to_page++;
            // does a modern key already exist? if so, modern wins - never overwrite
            const modern = await KV.get(env, decoded);
            if (modern && modern.length > 0) { report.modern_already_exists++; continue; }
            // legacy-only page - this is what we must preserve before cutting the legacy lookup
            if (!execute) { report.would_migrate.push(decoded); continue; }
            // EXECUTE: decode the legacy content and write it to the modern key
            try {
              const legacyRaw = await KV.get(env, k.name);
              if (!legacyRaw) { report.errors.push(decoded + " (empty legacy value)"); continue; }
              // legacy format was base64-encoded HTML bytes; decode to the real page
              let html;
              try { const clean = legacyRaw.replace(/\s/g, ""); html = decodeURIComponent(escape(atob(clean))); }
              catch { html = legacyRaw; } // if it wasn't base64, use as-is
              await KV.put(env, decoded, html);
              report.migrated.push({ key: decoded, bytes: html.length });
            } catch (e) { report.errors.push(decoded + " (" + e.message + ")"); }
          }
        } while (cursor);
      } catch (e) { return { cmd: "MIGRATE_LEGACY", payload: { ok: false, error: e.message, partial: report } }; }
      report.mode = execute ? "EXECUTED" : "DRY_RUN (nothing changed - run MIGRATE_LEGACY EXECUTE to apply)";
      return { cmd: "MIGRATE_LEGACY", payload: { ok: true, ...report } };
    }

    case "LISTKV": {
      // List KV keys by prefix. Essential for finding exact key names before modifying.
      // LISTKV <prefix> [limit]
      if (!isOp) return { cmd: "LISTKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const prefix = args[0] || "";
      const limit = parseInt(args[1]) || 50;
      if (!prefix) return { cmd: "LISTKV", payload: { ok: false, error: "Usage: LISTKV <prefix> [limit]" } };
      const list = await env.AURA_KV.list({ prefix, limit });
      const keys = (list.keys || []).map(k => ({ name: k.name }));
      return { cmd: "LISTKV", payload: { ok: true, prefix, count: keys.length, keys } };
    }

    case "KV_ARCHIVE": {
      // Generic KV maintenance: move keys under <prefix> to archive:<prefix> EXCEPT a keep-list.
      // The keep-list is DATA passed in at call time (pipe-separated), never baked into the engine.
      // Generic - works on any namespace. Non-destructive: archived keys are copied to archive:* then
      // removed from the live namespace, so nothing is lost and it is reversible.
      // KV_ARCHIVE <prefix> | keepKeyA, keepKeyB, ...        (preview first with DRY)
      // KV_ARCHIVE DRY <prefix> | keepKeyA, keepKeyB, ...    (preview only, moves nothing)
      if (!isOp) return { cmd: "KV_ARCHIVE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let dry = false;
      let body = rest.trim();
      if (body.toUpperCase().startsWith("DRY ")) { dry = true; body = body.slice(4).trim(); }
      const pipeIdx = body.indexOf("|");
      const arPrefix = (pipeIdx >= 0 ? body.slice(0, pipeIdx) : body).trim();
      const keepRaw = pipeIdx >= 0 ? body.slice(pipeIdx + 1) : "";
      if (!arPrefix) return { cmd: "KV_ARCHIVE", payload: { ok: false, error: "Usage: KV_ARCHIVE [DRY] <prefix> | keepA, keepB, ..." } };
      const keep = new Set(keepRaw.split(",").map(s => s.trim()).filter(Boolean));
      // also keep prefixes: a keep entry ending in * keeps everything under it
      const keepPrefixes = [...keep].filter(k => k.endsWith("*")).map(k => k.slice(0, -1));
      const isKept = (name) => keep.has(name) || keepPrefixes.some(p => name.startsWith(p));
      // gather all keys under prefix (paginate)
      const all = [];
      let cursor = undefined, done = false;
      while (!done) {
        const list = await env.AURA_KV.list({ prefix: arPrefix, limit: 1000, cursor });
        for (const k of (list.keys || [])) all.push(k.name);
        if (list.list_complete || !list.cursor) done = true; else cursor = list.cursor;
      }
      const toArchive = all.filter(n => !isKept(n));
      const kept = all.filter(n => isKept(n));
      if (dry) return { cmd: "KV_ARCHIVE", payload: { ok: true, dry: true, prefix: arPrefix, total: all.length, would_archive: toArchive.length, would_keep: kept.length, keeping: kept, archiving_sample: toArchive.slice(0, 40), archiving_count: toArchive.length } };
      let moved = 0, failed = 0;
      for (const name of toArchive) {
        try {
          const val = await env.AURA_KV.get(name);
          if (val !== null) { await env.AURA_KV.put("archive:" + name, val); await env.AURA_KV.delete(name); moved++; }
        } catch { failed++; }
      }
      return { cmd: "KV_ARCHIVE", payload: { ok: true, prefix: arPrefix, archived: moved, failed, kept: kept.length, keeping: kept } };
    }

    case "PATCHKV": {
      // Surgical find-and-replace in a KV value. For editing pages without rewriting them.
      // PATCHKV <key> <find_string> ||| <replace_string>
      // Uses ||| as the delimiter between find and replace.
      if (!isOp) return { cmd: "PATCHKV", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pKey = args[0] || "";
      if (!pKey) return { cmd: "PATCHKV", payload: { ok: false, error: "Usage: PATCHKV <key> <find_string> ||| <replace_string>" } };
      const pRest = rest.slice(rest.indexOf(pKey) + pKey.length).trim();
      const delimIdx = pRest.indexOf("|||");
      if (delimIdx < 0) return { cmd: "PATCHKV", payload: { ok: false, error: "Missing ||| delimiter between find and replace strings" } };
      const findStr = pRest.slice(0, delimIdx).trim();
      const replaceStr = pRest.slice(delimIdx + 3).trim();
      if (!findStr) return { cmd: "PATCHKV", payload: { ok: false, error: "Find string is empty" } };
      // Read current value
      const currentVal = await KV.get(env, pKey);
      if (!currentVal) return { cmd: "PATCHKV", payload: { ok: false, error: `Key ${pKey} not found` } };
      // Check that find string exists
      if (!currentVal.includes(findStr)) return { cmd: "PATCHKV", payload: { ok: false, error: "Find string not found in current value", key: pKey, searched_for: findStr.slice(0, 100) } };
      // Count occurrences
      const occurrences = currentVal.split(findStr).length - 1;
      // Replace
      const newVal = currentVal.replace(findStr, replaceStr);
      await KV.put(env, pKey, newVal);
      // Verify
      const readBack = await KV.get(env, pKey);
      const verified = readBack && readBack.includes(replaceStr);
      return { cmd: "PATCHKV", payload: { ok: true, key: pKey, occurrences_found: occurrences, replaced_first: true, old_size: currentVal.length, new_size: newVal.length, verified, verification: verified ? "CONFIRMED: patch applied and verified" : "WARNING: verification failed" } };
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


    case "STRIPE_BALANCE": {
      const sb = await getStripeBalance(env);
      return { cmd: "STRIPE_BALANCE", payload: sb };
    }
    case "STRIPE_PAYMENTS": {
      const parts = line.trim().split(/\s+/);
      const limit = parseInt(parts[1]) || 10;
      return { cmd: "STRIPE_PAYMENTS", payload: await getStripePayments(limit, env) };
    }
    case "AURA_PAY_CHECKOUT": {
      const parts = line.trim().split(/\s+/);
      const amount = parseFloat(parts[1]) || 0;
      const product = parts.slice(2).join(" ") || "Aura Pay";
      if (!amount) return { cmd: "AURA_PAY_CHECKOUT", payload: { ok: false, error: "AURA_PAY_CHECKOUT <amount> <product>" } };
      return { cmd: "AURA_PAY_CHECKOUT", payload: await createStripeCheckout(amount, "usd", product, null, null, env) };
    }
    case "AURA_PAY_INTENT": {
      const parts = line.trim().split(/\s+/);
      const amount = parseFloat(parts[1]) || 0;
      const description = parts.slice(2).join(" ") || "Aura Pay";
      if (!amount) return { cmd: "AURA_PAY_INTENT", payload: { ok: false, error: "AURA_PAY_INTENT <amount> <description>" } };
      return { cmd: "AURA_PAY_INTENT", payload: await createPaymentIntent(amount, "usd", description, {}, env) };
    }
    case "DEPLOY_CONSOLE": {
      if (!isOp) return { cmd: "DEPLOY_CONSOLE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      return { cmd: "DEPLOY_CONSOLE", payload: await deployConsole(env) };
    }

    case "EVENT_STORM": {
      if (!isOp) return { cmd: "EVENT_STORM", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Flood the event path: N events across E entities, fired concurrently. Measure D1 truth vs KV cache.
      const count = Math.min(parseInt(args[0] || "50", 10) || 50, 200);
      const entities = Math.min(parseInt(args[1] || "5", 10) || 5, 20);
      const runId = "storm_" + Date.now().toString(36);
      const t0 = Date.now();
      const writes = [];
      for (let i = 0; i < count; i++) {
        const ent = `storm_entity_${i % entities}`;
        writes.push(
          env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(runId, Date.now(), "storm_event", JSON.stringify({ run: runId, seq: i }), ent, "storm", `${runId} seq ${i}`).run()
            .then(() => ({ ok: true })).catch(e => ({ ok: false, error: String(e.message).slice(0, 80) }))
        );
      }
      const results = await Promise.all(writes);
      const d1_writes_ok = results.filter(r => r.ok).length;
      const d1_writes_failed = results.length - d1_writes_ok;
      const write_ms = Date.now() - t0;
      // Truth check: count what actually landed in D1 for this run
      let d1_count = -1, d1_count_err = null;
      try {
        const c = await env.AURA_MEMORY.prepare("SELECT COUNT(*) as n FROM events WHERE session_id = ?").bind(runId).first();
        d1_count = c?.n ?? -1;
      } catch (e) { d1_count_err = String(e.message).slice(0, 100); }
      const payload = {
        ok: true, run: runId, requested: count, entities,
        d1_writes_ok, d1_writes_failed, write_ms,
        write_throughput_per_sec: Math.round(count / (write_ms / 1000)),
        d1_verified_count: d1_count, d1_integrity: d1_count === count ? "PERFECT" : `LOST ${count - d1_count}`,
        d1_count_err
      };
      await env.AURA_KV.put("monitor:storm:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "EVENT_STORM", payload };
    }
    case "LOOP_PROBE": {
      if (!isOp) return { cmd: "LOOP_PROBE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Writes a trivial value, so a follow-up chat asking to read+report it forces one benign continuation round.
      await env.AURA_KV.put("probe:value", "the secret word is daylight").catch(() => {});
      return { cmd: "LOOP_PROBE", payload: { ok: true, note: "Now send a chat: 'Read probe:value and tell me the secret word.' — forces one benign loop round." } };
    }
    case "CLOUDFLARE_STATUS": {
      if (!isOp) return { cmd: "CLOUDFLARE_STATUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const cfToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      const cfAccount = env.CF_ACCOUNT_ID || "3db0de2c6fce92757e2c4e4f83d7eb16";
      if (!cfToken) return { cmd: "CLOUDFLARE_STATUS", payload: { ok: false, error: "No CF token" } };
      const H = { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" };
      const out = { account_id: cfAccount };

      // Token scope check
      try { const v = await (await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", { headers: H })).json(); out.token_status = v?.result?.status || "unknown"; } catch (e) { out.token_error = String(e.message); }

      // Account details
      try { const a = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}`, { headers: H })).json();
        if (a.success) out.account = { name: a.result?.name, type: a.result?.type }; else out.account = { error: a.errors?.[0]?.message || "no access" };
      } catch (e) { out.account = { error: String(e.message) }; }

      // Account subscriptions / billing plan
      try { const s = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/subscriptions`, { headers: H })).json();
        if (s.success) out.subscriptions = (s.result || []).map(x => ({ product: x.rate_plan?.id || x.product?.name, state: x.state, price: x.price, currency: x.currency, frequency: x.frequency }));
        else out.subscriptions = { note: "token lacks billing scope or no subscriptions", error: s.errors?.[0]?.message };
      } catch (e) { out.subscriptions = { error: String(e.message) }; }

      // Zone count (real infra footprint)
      try { const z = await (await fetch(`https://api.cloudflare.com/client/v4/zones?per_page=1&account.id=${cfAccount}`, { headers: H })).json();
        out.zones_total = z?.result_info?.total_count ?? null;
      } catch (e) { out.zones_error = String(e.message); }

      // Workers usage / requests (best-effort — may need analytics scope)
      out.billing_note = "Exact monthly charges + card on file are only fully visible in the CF dashboard (dash.cloudflare.com/?to=/:account/billing). This shows plan/subscriptions/zone-count from the API. If subscriptions show 'lacks billing scope', the deploy token needs Billing:Read added.";

      await env.AURA_KV.put("resource:cloudflare", JSON.stringify({ ts: new Date().toISOString(), ...out }), { expirationTtl: 3600 }).catch(() => {});
      return { cmd: "CLOUDFLARE_STATUS", payload: { ok: true, ...out } };
    }

    case "CF_API": {
      // Authenticated Cloudflare API wrapper — closes the loop where Aura's fetch_url
      // cannot send custom headers. Host is HARDCODED to api.cloudflare.com/client/v4
      // so the token can never be sent anywhere else.
      // Usage: CF_API <GET|POST|PUT|PATCH|DELETE> </path?query> [json body]
      // Examples:
      //   CF_API GET /zones?name=example.com
      //   CF_API POST /zones/<zone_id>/dns_records {"type":"A","name":"sub.example.com","content":"192.0.2.1","proxied":true,"ttl":1}
      //   CF_API PUT /zones/<zone_id>/workers/routes/<route_id> {"pattern":"sub.example.com/*","script":"aura-host"}
      if (!isOp) return { cmd: "CF_API", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const cfMethod = (args[0] || "").toUpperCase();
      const cfPath = args[1] || "";
      const CF_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
      if (!CF_METHODS.includes(cfMethod) || !cfPath.startsWith("/") || cfPath.includes("://") || cfPath.includes("..")) {
        return { cmd: "CF_API", payload: { ok: false, error: "Usage: CF_API <GET|POST|PUT|PATCH|DELETE> </path?query> [json body]. Path is relative to https://api.cloudflare.com/client/v4 and must start with /. Example: CF_API GET /zones?name=example.com" } };
      }
      const cfApiToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      if (!cfApiToken) return { cmd: "CF_API", payload: { ok: false, error: "No CF token (env.CF_API_TOKEN or secret:cf_api_token)" } };
      // Body = everything after the path token; must be valid JSON when present.
      const cfAfterMethod = rest.slice(cfMethod.length).trim();
      const cfBodyRaw = cfAfterMethod.slice(cfPath.length).trim();
      let cfBody = null;
      if (cfBodyRaw) {
        if (cfMethod === "GET" || cfMethod === "DELETE") {
          return { cmd: "CF_API", payload: { ok: false, error: `${cfMethod} takes no body. Put parameters in the path query string.` } };
        }
        try { cfBody = JSON.stringify(JSON.parse(cfBodyRaw)); }
        catch (e) { return { cmd: "CF_API", payload: { ok: false, error: "Body is not valid JSON: " + e.message } }; }
      }
      try {
        const cfRes = await fetch("https://api.cloudflare.com/client/v4" + cfPath, {
          method: cfMethod,
          headers: { "Authorization": "Bearer " + cfApiToken, ...(cfBody ? { "Content-Type": "application/json" } : {}) },
          ...(cfBody ? { body: cfBody } : {})
        });
        const cfText = await cfRes.text();
        let cfParsed = null;
        try { cfParsed = JSON.parse(cfText); } catch {}
        if (!cfParsed) {
          // Non-JSON response — return an honest preview, never a broken slice of JSON.
          return { cmd: "CF_API", payload: { ok: cfRes.ok, http_status: cfRes.status, non_json_preview: cfText.slice(0, 2000) } };
        }
        const cfPayload = {
          ok: !!cfParsed.success,
          http_status: cfRes.status,
          success: cfParsed.success,
          errors: cfParsed.errors || [],
          messages: cfParsed.messages || []
        };
        if (cfParsed.result_info) cfPayload.result_info = cfParsed.result_info;
        // Keep replies relayable. For large result arrays, first try slimming each item to its
        // essential scalar fields (id, name, status, etc.) so ALL items can be returned - this is
        // what list views (zones, routes, dns records) actually need. Only if the slim list is still
        // too big do we fall back to count-trimming. A single enormous object falls back to a preview.
        if (Array.isArray(cfParsed.result) && JSON.stringify(cfParsed.result).length > 6000) {
          // slim form: keep short top-level scalar fields only (drop nested objects/arrays + long strings)
          const slim = cfParsed.result.map(item => {
            if (item && typeof item === "object") {
              const o = {};
              for (const k of Object.keys(item)) {
                const v = item[k];
                if (v === null) continue;
                const t = typeof v;
                if ((t === "string" && v.length <= 120) || t === "number" || t === "boolean") o[k] = v;
              }
              return o;
            }
            return item;
          });
          if (JSON.stringify(slim).length <= 90000) {
            cfPayload.result = slim;
            cfPayload.slimmed = true;
            cfPayload.result_total = cfParsed.result.length;
            cfPayload.result_returned = slim.length;
          } else {
            // even slimmed is huge - count-trim the slim list to a budget
            const trimmed = [];
            let budget = 80000;
            for (const item of slim) {
              const s = JSON.stringify(item);
              if (s.length > budget) break;
              trimmed.push(item);
              budget -= s.length;
            }
            cfPayload.result = trimmed;
            cfPayload.truncated = true;
            cfPayload.result_total = cfParsed.result.length;
            cfPayload.result_returned = trimmed.length;
          }
        } else {
          const resStr = JSON.stringify(cfParsed.result);
          if (resStr && resStr.length > 8000) {
            cfPayload.result_preview = resStr.slice(0, 8000);
            cfPayload.truncated = true;
          } else {
            cfPayload.result = cfParsed.result;
          }
        }
        return { cmd: "CF_API", payload: cfPayload };
      } catch (e) {
        return { cmd: "CF_API", payload: { ok: false, error: "CF_API fetch failed: " + e.message } };
      }
    }

    case "ROUTE_AUDIT": {
      // Map EVERY domain to the worker that serves it. Generic: walks all zones in the account,
      // reads each zone's worker routes, returns a compact summary (worker -> count + domain list).
      // One call instead of hundreds. No domain names baked in - all pulled live from CF.
      if (!isOp) return { cmd: "ROUTE_AUDIT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const tok = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      if (!tok) return { cmd: "ROUTE_AUDIT", payload: { ok: false, error: "No CF token" } };
      const cf = async (path) => {
        const r = await fetch("https://api.cloudflare.com/client/v4" + path, { headers: { Authorization: "Bearer " + tok } });
        return r.json();
      };
      // gather all zones (paginate)
      const zones = [];
      let page = 1, totalPages = 1;
      do {
        const z = await cf(`/zones?per_page=50&page=${page}`);
        if (z && z.result) for (const zo of z.result) zones.push({ id: zo.id, name: zo.name });
        totalPages = (z && z.result_info && z.result_info.total_pages) || 1;
        page++;
      } while (page <= totalPages && page <= 6);
      // for each zone, read its worker routes
      const byWorker = {}; const noRoute = [];
      for (const z of zones) {
        try {
          const rt = await cf(`/zones/${z.id}/workers/routes`);
          const routes = (rt && rt.result) || [];
          if (routes.length === 0) { noRoute.push(z.name); continue; }
          for (const r of routes) {
            const w = r.script || "(none)";
            if (!byWorker[w]) byWorker[w] = [];
            byWorker[w].push(r.pattern);
          }
        } catch { noRoute.push(z.name + " (error)"); }
      }
      const summary = {};
      for (const w of Object.keys(byWorker)) summary[w] = byWorker[w].length;
      return { cmd: "ROUTE_AUDIT", payload: { ok: true, total_zones: zones.length, workers: summary, no_route_count: noRoute.length, no_route: noRoute.slice(0, 30), detail: byWorker } };
    }

    case "ROUTE_SET_ONE": {
      // Repoint ONE domain's root worker route to a target worker (canary / single fix).
      // Generic: domain and target are arguments, nothing baked in. Mirrors ROUTE_SET_ALL's
      // per-zone logic for a single zone. If the zone has no root route, one is created at <domain>/*.
      // ROUTE_SET_ONE <domain> <target_worker>
      if (!isOp) return { cmd: "ROUTE_SET_ONE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const parts = rest.trim().split(/\s+/).filter(Boolean);
      const domain = (parts[0] || "").toLowerCase();
      const target = parts[1] || "";
      if (!domain || !target) return { cmd: "ROUTE_SET_ONE", payload: { ok: false, error: "Usage: ROUTE_SET_ONE <domain> <target_worker>" } };
      const tok = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      if (!tok) return { cmd: "ROUTE_SET_ONE", payload: { ok: false, error: "No CF token" } };
      const cf = async (path, method, jsonBody) => {
        const r = await fetch("https://api.cloudflare.com/client/v4" + path, {
          method: method || "GET",
          headers: { Authorization: "Bearer " + tok, ...(jsonBody ? { "Content-Type": "application/json" } : {}) },
          ...(jsonBody ? { body: JSON.stringify(jsonBody) } : {})
        });
        return r.json();
      };
      const zr = await cf(`/zones?name=${encodeURIComponent(domain)}`);
      const zone = zr && zr.result && zr.result[0];
      if (!zone) return { cmd: "ROUTE_SET_ONE", payload: { ok: false, error: "Zone not found: " + domain } };
      let routes = [];
      try { const rt = await cf(`/zones/${zone.id}/workers/routes`); routes = (rt && rt.result) || []; } catch {}
      const rootRoute = routes.find(r => r.pattern === domain + "/*") || routes[0] || null;
      if (rootRoute && rootRoute.script === target) {
        return { cmd: "ROUTE_SET_ONE", payload: { ok: true, domain, target, action: "already_ok", pattern: rootRoute.pattern } };
      }
      if (rootRoute) {
        const u = await cf(`/zones/${zone.id}/workers/routes/${rootRoute.id}`, "PUT", { pattern: domain + "/*", script: target });
        return { cmd: "ROUTE_SET_ONE", payload: { ok: !!(u && u.success), domain, target, action: "updated", from: rootRoute.script, pattern: domain + "/*", errors: u && u.errors } };
      }
      const c = await cf(`/zones/${zone.id}/workers/routes`, "POST", { pattern: domain + "/*", script: target });
      return { cmd: "ROUTE_SET_ONE", payload: { ok: !!(c && c.success), domain, target, action: "created", pattern: domain + "/*", errors: c && c.errors } };
    }

    case "ROUTE_SET_ALL": {
      // Repoint EVERY route in EVERY zone (bare, www, and any other pattern) to a target
      // worker, EXCEPT a zone skip-list (data, passed in) and twilio sub-routes (carve-out).
      // Generic: target and skip-list are arguments, no domains baked in. Supports DRY to
      // preview. Zones with no route at all get one created at <domain>/*. Idempotent:
      // routes already on target are skipped, so re-running after a timeout safely finishes.
      // ROUTE_SET_ALL [DRY] <target_worker> | skipDomainA, skipDomainB, ...
      if (!isOp) return { cmd: "ROUTE_SET_ALL", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let body = rest.trim();
      let dry = false;
      if (body.toUpperCase().startsWith("DRY ")) { dry = true; body = body.slice(4).trim(); }
      const pipeIdx = body.indexOf("|");
      const target = (pipeIdx >= 0 ? body.slice(0, pipeIdx) : body).trim();
      const skipRaw = pipeIdx >= 0 ? body.slice(pipeIdx + 1) : "";
      if (!target) return { cmd: "ROUTE_SET_ALL", payload: { ok: false, error: "Usage: ROUTE_SET_ALL [DRY] <target_worker> | skipA, skipB" } };
      const skip = new Set(skipRaw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
      const tok = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      if (!tok) return { cmd: "ROUTE_SET_ALL", payload: { ok: false, error: "No CF token" } };
      const cf = async (path, method, jsonBody) => {
        const r = await fetch("https://api.cloudflare.com/client/v4" + path, {
          method: method || "GET",
          headers: { Authorization: "Bearer " + tok, ...(jsonBody ? { "Content-Type": "application/json" } : {}) },
          ...(jsonBody ? { body: JSON.stringify(jsonBody) } : {})
        });
        return r.json();
      };
      const zones = [];
      let page = 1, totalPages = 1;
      do {
        const z = await cf(`/zones?per_page=50&page=${page}`);
        if (z && z.result) for (const zo of z.result) zones.push({ id: zo.id, name: zo.name });
        totalPages = (z && z.result_info && z.result_info.total_pages) || 1;
        page++;
      } while (page <= totalPages && page <= 6);
      const plan = { would_update: [], would_create: [], skipped: [], already_ok: [] };
      let updated = 0, created = 0, failed = 0;
      for (const z of zones) {
        const isSkipped = [...skip].some(s => z.name.toLowerCase() === s || z.name.toLowerCase().endsWith("." + s));
        if (isSkipped) { plan.skipped.push(z.name); continue; }
        let routes = [];
        try { const rt = await cf(`/zones/${z.id}/workers/routes`); routes = (rt && rt.result) || []; } catch {}
        if (routes.length === 0) {
          // Zone has no route at all -> create the bare root route so it serves.
          plan.would_create.push(z.name + "/*");
          if (!dry) {
            try { const c = await cf(`/zones/${z.id}/workers/routes`, "POST", { pattern: z.name + "/*", script: target }); if (c && c.success) created++; else failed++; } catch { failed++; }
          }
          continue;
        }
        // Repoint EVERY route in the zone (bare, www, any pattern) whose script isn't
        // already the target. Exact pattern is preserved. Carve-out: never touch twilio
        // sub-routes. Future domains/patterns are swept automatically - nothing baked in.
        for (const r of routes) {
          if (r.pattern.includes("/twilio")) { plan.skipped.push(r.pattern); continue; }
          if (r.script === target) { plan.already_ok.push(r.pattern); continue; }
          plan.would_update.push(r.pattern + " (" + r.script + "->" + target + ")");
          if (!dry) {
            try { const u = await cf(`/zones/${z.id}/workers/routes/${r.id}`, "PUT", { pattern: r.pattern, script: target }); if (u && u.success) updated++; else failed++; } catch { failed++; }
          }
        }
      }
      if (dry) return { cmd: "ROUTE_SET_ALL", payload: { ok: true, dry: true, target, total_zones: zones.length, would_update: plan.would_update.length, would_create: plan.would_create.length, already_ok: plan.already_ok.length, skipped: plan.skipped, update_sample: plan.would_update.slice(0, 40), create_sample: plan.would_create.slice(0, 40) } };
      return { cmd: "ROUTE_SET_ALL", payload: { ok: true, target, updated, created, failed, skipped: plan.skipped, already_ok: plan.already_ok.length } };
    }

    case "TWILIO_API": {
      // Authenticated Twilio REST wrapper — the Communications-engine twin of CF_API.
      // Host LOCKED to *.twilio.com. Basic auth with Account SID + secret:twilio_auth_token,
      // so creds never leave Twilio. Gives Aura full granular A2P/messaging control
      // (list/delete/create campaigns) instead of the thin SUBMIT_CAMPAIGN.
      // Usage: TWILIO_API <GET|POST|DELETE> </path OR full https://*.twilio.com URL> [body]
      //   - A path starting with / is prefixed with https://messaging.twilio.com
      //   - POST body may be a raw form string (k=v&k=v) OR a JSON object (arrays become repeated keys)
      // Examples:
      //   TWILIO_API GET /v1/Services/MGxxx/Compliance/Usa2p
      //   TWILIO_API DELETE /v1/Services/MGxxx/Compliance/Usa2p/CMxxx
      //   TWILIO_API POST /v1/Services/MGxxx/Compliance/Usa2p {"BrandRegistrationSid":"BNxxx","Description":"...","MessageSamples":["a","b"]}
      if (!isOp) return { cmd: "TWILIO_API", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const twMethod = (args[0] || "").toUpperCase();
      const twTarget = args[1] || "";
      const TW_METHODS = ["GET", "POST", "DELETE"];
      if (!TW_METHODS.includes(twMethod) || !twTarget) {
        return { cmd: "TWILIO_API", payload: { ok: false, error: "Usage: TWILIO_API <GET|POST|DELETE> </path or full https://*.twilio.com URL> [body]. A path starting with / is prefixed with https://messaging.twilio.com" } };
      }
      let twUrl;
      if (/^https?:\/\//i.test(twTarget)) {
        try { const u = new URL(twTarget); if (!/(^|\.)twilio\.com$/i.test(u.hostname)) return { cmd: "TWILIO_API", payload: { ok: false, error: "Host must be *.twilio.com" } }; twUrl = u.toString(); }
        catch { return { cmd: "TWILIO_API", payload: { ok: false, error: "Invalid URL" } }; }
      } else if (twTarget.startsWith("/") && !twTarget.includes("..")) {
        twUrl = "https://messaging.twilio.com" + twTarget;
      } else {
        return { cmd: "TWILIO_API", payload: { ok: false, error: "Path must start with / or be a full https://*.twilio.com URL" } };
      }
      const twSid = env.TWILIO_ACCOUNT_SID || await env.AURA_KV.get("secret:twilio_account_sid").catch(() => null) || await env.AURA_KV.get("secret:twilio_sid").catch(() => null);
      const twToken = env.TWILIO_AUTH_TOKEN || await env.AURA_KV.get("secret:twilio_auth_token").catch(() => null);
      if (!twSid || !twToken) return { cmd: "TWILIO_API", payload: { ok: false, error: "Missing Twilio creds (need secret:twilio_account_sid and secret:twilio_auth_token in KV)" } };
      const twAfterMethod = rest.slice(twMethod.length).trim();
      let twBody = twAfterMethod.slice(twTarget.length).trim();
      if (twBody && twMethod !== "POST") return { cmd: "TWILIO_API", payload: { ok: false, error: `${twMethod} takes no body.` } };
      if (twBody && twBody.startsWith("{")) {
        try {
          const obj = JSON.parse(twBody);
          const usp = new URLSearchParams();
          for (const [k, v] of Object.entries(obj)) {
            if (Array.isArray(v)) v.forEach(item => usp.append(k, String(item)));
            else usp.append(k, String(v));
          }
          twBody = usp.toString();
        } catch (e) { return { cmd: "TWILIO_API", payload: { ok: false, error: "Body JSON parse failed: " + e.message } }; }
      }
      try {
        const twHeaders = { "Authorization": "Basic " + btoa(twSid + ":" + twToken) };
        if (twMethod === "POST") twHeaders["Content-Type"] = "application/x-www-form-urlencoded";
        const twRes = await fetch(twUrl, { method: twMethod, headers: twHeaders, ...(twBody ? { body: twBody } : {}) });
        const twText = await twRes.text();
        let twParsed = null; try { twParsed = JSON.parse(twText); } catch {}
        if (!twParsed) return { cmd: "TWILIO_API", payload: { ok: twRes.ok, http_status: twRes.status, non_json_preview: twText.slice(0, 2000) } };
        const out = { ok: twRes.ok && !twParsed.code, http_status: twRes.status };
        if (twParsed.code) { out.error = twParsed.message; out.twilio_code = twParsed.code; out.more_info = twParsed.more_info; }
        const s = JSON.stringify(twParsed);
        if (s.length > 8000) { out.preview = s.slice(0, 8000); out.truncated = true; } else { out.result = twParsed; }
        return { cmd: "TWILIO_API", payload: out };
      } catch (e) {
        return { cmd: "TWILIO_API", payload: { ok: false, error: "TWILIO_API fetch failed: " + e.message } };
      }
    }

    case "PERCEIVE": {
      // SEEIT — the PERCEPTION layer of Aura cognition. Deterministic command wrapping ONE
      // structured reasoning pass. It OBSERVES what exists about an entity: what it is, what
      // exists, what is hidden-but-real, relationships, what is changing, patterns. It does
      // NOT expand (Possibility), interpret significance (Meaning), or rank (Priority) — those
      // are separate layers. Lazy + cached: stores perception:{slug}, returns cache unless FRESH.
      // Usage: PERCEIVE <entity>   |   PERCEIVE FRESH <entity>
      let pEntity = rest;
      let pFresh = false;
      if (/^FRESH\s+/i.test(pEntity)) { pFresh = true; pEntity = pEntity.replace(/^FRESH\s+/i, "").trim(); }
      if (!pEntity) return { cmd: "PERCEIVE", payload: { ok: false, error: "Usage: PERCEIVE <entity> (or PERCEIVE FRESH <entity> to recompute). Give any business, person, asset, domain, situation, or thing to observe." } };
      const pSlug = pEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      const pKey = `perception:${pSlug}`;
      if (!pFresh) {
        try { const cached = await env.AURA_KV.get(pKey); if (cached) { const c = JSON.parse(cached); return { cmd: "PERCEIVE", payload: { ok: true, cached: true, entity: c.entity, ts: c.ts, source: c.source || "description", source_url: c.source_url || null, perception: c.perception } }; } } catch {}
      }
      const pApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!pApiKey) return { cmd: "PERCEIVE", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const pModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      const pSystem = "You are the PERCEPTION layer of Aura's cognition system, called SeeIt. Your ONLY job is to OBSERVE what already exists about the entity given to you. You do NOT recommend actions. You do NOT imagine what it could become in the future. You do NOT decide what matters most. Other layers do those things. You see only what is actually there right now, including value and relationships that are real but easily overlooked. Return ONLY a JSON object, no prose and no markdown fences, with exactly these keys: entity (the thing as you understand it), what_it_is (one plain sentence identifying it), what_exists (array of observable facts or components actually present), whats_hidden (array of real but non-obvious value, assets, capabilities, or relationships that ALREADY exist and are easily missed - not future speculation), relationships (array of who or what this is connected to), whats_changing (array of dynamics or trends currently acting on it), patterns (array of recurring structures you observe), confidence (one of: high, medium, low), unknowns (array of things you cannot determine without more information). Be concrete and honest. If you do not know something, put it in unknowns rather than guessing. Output JSON only.";
      try {
        // LIVE SIGHT: if the entity contains a URL, fetch the real page and perceive its actual content.
        let pLive = null;
        const pUrlMatch = pEntity.match(/https?:\/\/[^\s]+/i);
        if (pUrlMatch) pLive = await auraFetchText(pUrlMatch[0]);
        let pUserContent = pEntity;
        if (pLive && pLive.ok && pLive.text) {
          pUserContent = "ENTITY: " + pEntity + "\n\nLIVE PAGE CONTENT (actually fetched from " + pLive.url + "):\n" + pLive.text + "\n\nBase your perception on this REAL fetched content - describe what is actually present on the page, not a guess.";
        }
        const pData = await callAnthropic(pApiKey, { model: pModel, max_tokens: 1600, system: pSystem, messages: [{ role: "user", content: pUserContent }] });
        let pText = "";
        if (pData && pData.content) { for (const b of pData.content) { if (b.type === "text") pText += b.text; } }
        pText = pText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let pParsed = null;
        try { pParsed = JSON.parse(pText); } catch {}
        if (!pParsed) return { cmd: "PERCEIVE", payload: { ok: false, error: "Perception did not return valid JSON", raw: pText.slice(0, 1200) } };
        const pSource = (pLive && pLive.ok) ? "live" : "description";
        const pSourceUrl = (pLive && pLive.ok) ? pLive.url : null;
        const pRecord = { entity: pEntity, perception: pParsed, source: pSource, source_url: pSourceUrl, ts: new Date().toISOString() };
        await env.AURA_KV.put(pKey, JSON.stringify(pRecord)).catch(() => {});
        return { cmd: "PERCEIVE", payload: { ok: true, cached: false, entity: pEntity, ts: pRecord.ts, source: pSource, source_url: pSourceUrl, fetch_error: (pLive && !pLive.ok) ? (pLive.error || pLive.status) : undefined, perception: pParsed } };
      } catch (e) {
        return { cmd: "PERCEIVE", payload: { ok: false, error: "PERCEIVE failed: " + e.message } };
      }
    }

    case "MEANING": {
      // MEANING — layer 2 of Aura cognition. Takes an entity (and its perception, if one
      // exists) and asks, in order: (1) WHAT IS THIS REALLY? (Reframing — Meaning's opening
      // move) and (2) WHY DOES ANYONE CARE? (the human values and significance underneath).
      // It interprets significance. It does NOT expand into futures (Possibility) or rank
      // (Priority). Stacks on Perception: reads perception:{slug} as input when available.
      // Lazy + cached: stores meaning:{slug}; returns cache unless FRESH.
      // Usage: MEANING <entity>   |   MEANING FRESH <entity>
      let mEntity = rest;
      let mFresh = false;
      if (/^FRESH\s+/i.test(mEntity)) { mFresh = true; mEntity = mEntity.replace(/^FRESH\s+/i, "").trim(); }
      if (!mEntity) return { cmd: "MEANING", payload: { ok: false, error: "Usage: MEANING <entity> (or MEANING FRESH <entity>). Give any business, person, asset, situation, or thing to interpret." } };
      const mSlug = mEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      const mKey = `meaning:${mSlug}`;
      if (!mFresh) {
        try { const cached = await env.AURA_KV.get(mKey); if (cached) { const c = JSON.parse(cached); return { cmd: "MEANING", payload: { ok: true, cached: true, entity: c.entity, ts: c.ts, used_perception: c.used_perception, meaning: c.meaning } }; } } catch {}
      }
      const mApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!mApiKey) return { cmd: "MEANING", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const mModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      // Stack on Perception if available.
      let mPerception = null;
      try { const pc = await env.AURA_KV.get(`perception:${mSlug}`); if (pc) mPerception = JSON.parse(pc).perception; } catch {}
      const mSystem = "You are the MEANING layer of Aura's cognition system. You interpret SIGNIFICANCE. You answer two questions in order. FIRST, reframing: what is this REALLY, beneath its surface label? (A tattoo shop is really an identity and memory business. A pizza shop is really a gathering place. A veteran is really service, leadership, sacrifice.) SECOND: why does anyone actually care - what human values, needs, and emotions are at stake? You do NOT imagine what it could become in the future (that is Possibility) and you do NOT decide what matters most (that is Priority). You explain what it means and why it matters to humans, right now. If a PERCEPTION object is provided, use it as your observed input. Return ONLY a JSON object, no prose and no markdown fences, with exactly these keys: entity (the thing), what_it_really_is (the reframe - one or two sentences naming the true nature beneath the label), why_it_matters (one or two sentences on the core human significance), human_values (array of the values genuinely at stake, e.g. identity, belonging, safety, status, legacy), who_cares_and_why (array of short strings: which people care and the real reason), emotional_core (the single deepest emotional truth, one short phrase), confidence (one of: high, medium, low), unknowns (array of what you cannot determine without more information). Be honest and human, never glib. Output JSON only.";
      const mUserContent = mPerception ? ("ENTITY: " + mEntity + "\n\nPERCEPTION (what SeeIt observed):\n" + JSON.stringify(mPerception)) : mEntity;
      try {
        const mData = await callAnthropic(mApiKey, { model: mModel, max_tokens: 1400, system: mSystem, messages: [{ role: "user", content: mUserContent }] });
        let mText = "";
        if (mData && mData.content) { for (const b of mData.content) { if (b.type === "text") mText += b.text; } }
        mText = mText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let mParsed = null;
        try { mParsed = JSON.parse(mText); } catch {}
        if (!mParsed) return { cmd: "MEANING", payload: { ok: false, error: "Meaning did not return valid JSON", raw: mText.slice(0, 1200) } };
        const mRecord = { entity: mEntity, meaning: mParsed, used_perception: !!mPerception, ts: new Date().toISOString() };
        await env.AURA_KV.put(mKey, JSON.stringify(mRecord)).catch(() => {});
        return { cmd: "MEANING", payload: { ok: true, cached: false, entity: mEntity, ts: mRecord.ts, used_perception: !!mPerception, meaning: mParsed } };
      } catch (e) {
        return { cmd: "MEANING", payload: { ok: false, error: "MEANING failed: " + e.message } };
      }
    }

    case "POSSIBILITY": {
      // POSSIBILITY — layer 3 of Aura cognition. Expands an entity: what else could this
      // become. Contains Expansion, Adjacency, Future, Leverage. Stacks on BOTH lower layers:
      // auto-reads perception:{slug} (what SeeIt saw) and meaning:{slug} (what it really is /
      // why it matters) so futures are grounded, not generic. It EXPANDS. It does NOT rank
      // (Priority) and does NOT decide whether anything should happen (Meaning Gate).
      // Lazy + cached: stores possibility:{slug}; returns cache unless FRESH.
      // Usage: POSSIBILITY <entity>   |   POSSIBILITY FRESH <entity>
      let xEntity = rest;
      let xFresh = false;
      if (/^FRESH\s+/i.test(xEntity)) { xFresh = true; xEntity = xEntity.replace(/^FRESH\s+/i, "").trim(); }
      if (!xEntity) return { cmd: "POSSIBILITY", payload: { ok: false, error: "Usage: POSSIBILITY <entity> (or POSSIBILITY FRESH <entity>). Give any business, person, asset, situation, or thing to expand." } };
      const xSlug = xEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      const xKey = `possibility:${xSlug}`;
      if (!xFresh) {
        try { const cached = await env.AURA_KV.get(xKey); if (cached) { const c = JSON.parse(cached); return { cmd: "POSSIBILITY", payload: { ok: true, cached: true, entity: c.entity, ts: c.ts, used_perception: c.used_perception, used_meaning: c.used_meaning, possibility: c.possibility } }; } } catch {}
      }
      const xApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!xApiKey) return { cmd: "POSSIBILITY", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const xModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      let xPerception = null, xMeaning = null;
      try { const pc = await env.AURA_KV.get(`perception:${xSlug}`); if (pc) xPerception = JSON.parse(pc).perception; } catch {}
      try { const mc = await env.AURA_KV.get(`meaning:${xSlug}`); if (mc) xMeaning = JSON.parse(mc).meaning; } catch {}
      const xSystem = "You are the POSSIBILITY layer of Aura's cognition system. Your job is to EXPAND: given what already exists and what it means, what else could this become? CRITICAL FIRST STEP: identify WHAT KIND of thing you are looking at, because possibility must be scaled to the entity. A business or idea can credibly grow toward product, community, platform, ecosystem. But a PERSON living their life, a FAMILY in crisis, a relationship, or someone in pain is NOT a venture to scale - their possibility space is human-sized: getting through this, healing, growing closer, finding footing, one real step forward. NEVER inflate a person's hardship into a movement, a book, a workshop, a brand, a platform, or a legacy. That is grandiose and it is a failure of this layer. A scared family's best possible future is that they get through it together and are okay - not that they monetize their pain or teach others. Match the scale of possibility to the actual life in front of you. You think across four moves, ALL scaled to the entity: EXPANSION (the realistic next versions of this - for a person, the next chapter of their actual life; for a business, the next stage of growth), ADJACENCY (what genuinely sits next to this and could naturally help - for a person, real resources and people; for a venture, markets and audiences), FUTURE (what it could realistically be in near and long term, in proportion), and LEVERAGE (the single smallest real action that most helps - grounded and human, never a growth hack applied to someone's life). You EXPAND possibilities. You do NOT rank them (Priority layer) and do NOT decide whether any should happen (Meaning Gate). Ground every possibility strictly in the perception and meaning provided - no generic fantasy, no inflation. Return ONLY a JSON object, no prose and no markdown fences, with exactly these keys: entity, expansions (array, scaled to the entity), adjacencies (array of genuinely adjacent things it could reach), futures (array of objects each with keys horizon and outcome, realistic and proportional), leverage_points (array of single grounded high-leverage moves), what_it_could_become (one or two sentences naming the largest CREDIBLE and PROPORTIONATE version - for a person, a human outcome, never a movement), confidence (one of: high, medium, low), assumptions (array of what would need to be true). Be grounded and realistic, never grandiose. Output JSON only.";
      let xUserContent = "ENTITY: " + xEntity;
      if (xPerception) xUserContent += "\n\nPERCEPTION (what SeeIt observed):\n" + JSON.stringify(xPerception);
      if (xMeaning) xUserContent += "\n\nMEANING (what it really is / why it matters):\n" + JSON.stringify(xMeaning);
      try {
        const xData = await callAnthropic(xApiKey, { model: xModel, max_tokens: 4000, system: xSystem, messages: [{ role: "user", content: xUserContent }] });
        let xText = "";
        if (xData && xData.content) { for (const b of xData.content) { if (b.type === "text") xText += b.text; } }
        xText = xText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let xParsed = null;
        try { xParsed = JSON.parse(xText); } catch {}
        if (!xParsed) return { cmd: "POSSIBILITY", payload: { ok: false, error: "Possibility did not return valid JSON", raw: xText.slice(0, 1200) } };
        const xRecord = { entity: xEntity, possibility: xParsed, used_perception: !!xPerception, used_meaning: !!xMeaning, ts: new Date().toISOString() };
        await env.AURA_KV.put(xKey, JSON.stringify(xRecord)).catch(() => {});
        return { cmd: "POSSIBILITY", payload: { ok: true, cached: false, entity: xEntity, ts: xRecord.ts, used_perception: !!xPerception, used_meaning: !!xMeaning, possibility: xParsed } };
      } catch (e) {
        return { cmd: "POSSIBILITY", payload: { ok: false, error: "POSSIBILITY failed: " + e.message } };
      }
    }

    case "PRIORITY": {
      // PRIORITY — layer 4 of Aura cognition (WhatMattersMost / whatmattersmost.world).
      // The first engine to consume the ENTIRE chain: reads perception + meaning + possibility
      // and turns an overwhelming field of options into ONE decision - what matters most and
      // what happens first. It RANKS and DECIDES. It does NOT execute (Capability engines) and
      // does NOT generate new options (Possibility). Without this layer, cognition overwhelms.
      // Lazy + cached: stores priority:{slug}; returns cache unless FRESH.
      // Usage: PRIORITY <entity>   |   PRIORITY FRESH <entity>
      let prEntity = rest;
      let prFresh = false;
      if (/^FRESH\s+/i.test(prEntity)) { prFresh = true; prEntity = prEntity.replace(/^FRESH\s+/i, "").trim(); }
      if (!prEntity) return { cmd: "PRIORITY", payload: { ok: false, error: "Usage: PRIORITY <entity> (or PRIORITY FRESH <entity>). Give any business, person, asset, or situation to decide what matters most." } };
      const prSlug = prEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      const prKey = `priority:${prSlug}`;
      if (!prFresh) {
        try { const cached = await env.AURA_KV.get(prKey); if (cached) { const c = JSON.parse(cached); return { cmd: "PRIORITY", payload: { ok: true, cached: true, entity: c.entity, ts: c.ts, basis: c.basis, priority: c.priority } }; } } catch {}
      }
      const prApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!prApiKey) return { cmd: "PRIORITY", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const prModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      let prPerception = null, prMeaning = null, prPossibility = null;
      try { const pc = await env.AURA_KV.get(`perception:${prSlug}`); if (pc) prPerception = JSON.parse(pc).perception; } catch {}
      try { const mc = await env.AURA_KV.get(`meaning:${prSlug}`); if (mc) prMeaning = JSON.parse(mc).meaning; } catch {}
      try { const xc = await env.AURA_KV.get(`possibility:${prSlug}`); if (xc) prPossibility = JSON.parse(xc).possibility; } catch {}
      // READ-FORWARD LEARNING: load distilled patterns so accumulated lessons shape THIS decision.
      // This is what makes learning carry forward - by scenario 5, the patterns from 1-4 are read
      // here and she already knows, rather than reasoning from scratch. Foundation is immutable
      // guidance above; patterns sharpen HOW, never WHAT she is for.
      let prPatterns = null;
      try {
        // try a domain hint from the entity (e.g. onboarding) then fall back to general
        const domainHint = /onboard|client|sign ?up|business tool/i.test(prEntity) ? "onboarding" : "general";
        let r = await env.AURA_KV.get(`patterns:${domainHint}`);
        if (!r && domainHint !== "general") r = await env.AURA_KV.get("patterns:general");
        if (r) prPatterns = JSON.parse(r);
      } catch {}
      const prSystem = "You are the PRIORITY layer of Aura's cognition system, called WhatMattersMost. The layers below you have observed (Perception), interpreted (Meaning), and expanded (Possibility) - so there is now far MORE possibility than any human can act on. Your job is to decide WHAT MATTERS MOST and WHAT SHOULD HAPPEN FIRST. You turn an overwhelming field of options into one clear decision. You weigh: impact (how much real value created), leverage (smallest effort for largest outcome), urgency (what is time-sensitive), feasibility (what can actually be done now), and above all what best serves the human at the center. You RANK and DECIDE among options that already exist. You do NOT execute anything (that is the Capability engines) and you do NOT invent new possibilities (that is the Possibility layer). Use the perception, meaning, and possibility provided. Return ONLY a JSON object, no prose and no markdown fences, with exactly these keys: entity, the_one_thing (the single highest-priority move, one or two sentences - this is your most important output), why_first (why this above everything else), do_now (the immediate concrete action a person could take today), ranked (array of at most 5 objects, ordered best first, each with keys rank, item, rationale, impact, effort, urgency where impact/effort/urgency are each high, medium, or low), defer (array of things that are genuinely valuable but explicitly NOT now, so the human is not overwhelmed), serves_human (one sentence on how the top priority serves the real human need), confidence (one of: high, medium, low), basis (array naming which inputs informed this: any of perception, meaning, possibility). Be decisive - a vague ranking is a failure. Output JSON only.";
      let prUserContent = "ENTITY: " + prEntity;
      if (prPatterns) prUserContent += "\n\nLEARNED PATTERNS (durable guidance from past experience - apply what holds, this is how you have learned to do this well):\n" + JSON.stringify(prPatterns);
      if (prPerception) prUserContent += "\n\nPERCEPTION:\n" + JSON.stringify(prPerception);
      if (prMeaning) prUserContent += "\n\nMEANING:\n" + JSON.stringify(prMeaning);
      if (prPossibility) prUserContent += "\n\nPOSSIBILITY:\n" + JSON.stringify(prPossibility);
      const prBasis = [prPatterns ? "learned_patterns" : null, prPerception ? "perception" : null, prMeaning ? "meaning" : null, prPossibility ? "possibility" : null].filter(Boolean);
      try {
        const prData = await callAnthropic(prApiKey, { model: prModel, max_tokens: 3000, system: prSystem, messages: [{ role: "user", content: prUserContent }] });
        let prText = "";
        if (prData && prData.content) { for (const b of prData.content) { if (b.type === "text") prText += b.text; } }
        prText = prText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let prParsed = null;
        try { prParsed = JSON.parse(prText); } catch {}
        if (!prParsed) return { cmd: "PRIORITY", payload: { ok: false, error: "Priority did not return valid JSON", raw: prText.slice(0, 1200) } };
        const prRecord = { entity: prEntity, priority: prParsed, basis: prBasis, ts: new Date().toISOString() };
        await env.AURA_KV.put(prKey, JSON.stringify(prRecord)).catch(() => {});
        return { cmd: "PRIORITY", payload: { ok: true, cached: false, entity: prEntity, ts: prRecord.ts, basis: prBasis, priority: prParsed } };
      } catch (e) {
        return { cmd: "PRIORITY", payload: { ok: false, error: "PRIORITY failed: " + e.message } };
      }
    }

    case "GATE":
    case "MEANING_GATE": {
      // MEANING GATE — the veto. Meaning's SECOND role: not interpreting significance (that is
      // the MEANING layer) but holding AUTHORITY over action. Before any decision becomes a real
      // action via a Capability engine, this asks: should this happen AT ALL? Does it serve the
      // human, honor consent, avoid harm, align with Aura's Law? Returns allow / allow_with_conditions
      // / block. A block stops everything downstream. This is what makes the stack safe to run
      // autonomously. Reads priority:{slug} as the default proposed action if no action given.
      // Usage: GATE <entity> ::: <proposed action>   |   GATE <entity>  (uses stored priority decision)
      //        GATE FRESH ... to recompute
      let gRaw = rest;
      let gFresh = false;
      if (/^FRESH\s+/i.test(gRaw)) { gFresh = true; gRaw = gRaw.replace(/^FRESH\s+/i, "").trim(); }
      let gEntity = gRaw, gAction = "";
      const gSplit = gRaw.split(":::");
      if (gSplit.length >= 2) { gEntity = gSplit[0].trim(); gAction = gSplit.slice(1).join(":::").trim(); }
      if (!gEntity) return { cmd: "MEANING_GATE", payload: { ok: false, error: "Usage: GATE <entity> ::: <proposed action>  (or GATE <entity> to judge the stored priority decision)." } };
      const gSlug = gEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      // If no action supplied, use the stored Priority decision (the_one_thing + do_now).
      let gMeaning = null, gPriorityDecision = null;
      try { const mc = await env.AURA_KV.get(`meaning:${gSlug}`); if (mc) gMeaning = JSON.parse(mc).meaning; } catch {}
      if (!gAction) {
        try { const prc = await env.AURA_KV.get(`priority:${gSlug}`); if (prc) { const pp = JSON.parse(prc).priority; gPriorityDecision = pp; gAction = (pp.the_one_thing || "") + (pp.do_now ? (" Action: " + pp.do_now) : ""); } } catch {}
      }
      if (!gAction) return { cmd: "MEANING_GATE", payload: { ok: false, error: "No action to judge. Provide one with ':::' or run PRIORITY first so a decision exists to gate." } };
      const gKey = `gate:${gSlug}:${gAction.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
      if (!gFresh) {
        try { const cached = await env.AURA_KV.get(gKey); if (cached) { const c = JSON.parse(cached); return { cmd: "MEANING_GATE", payload: { ok: true, cached: true, entity: c.entity, action: c.action, ts: c.ts, gate: c.gate } }; } } catch {}
      }
      const gApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!gApiKey) return { cmd: "MEANING_GATE", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const gModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      // Pull Aura's Law if present, so the gate enforces the actual codified rules.
      let gLaw = null;
      try { gLaw = await env.AURA_KV.get("notes:aura:law"); } catch {}
      const gSystem = "You are the MEANING GATE of Aura's cognition system - the final check before any decision becomes a real action. You do NOT rank or expand. You hold AUTHORITY: you decide whether a proposed action should happen AT ALL. You judge it against: does it genuinely serve the human at the center; does it honor consent and autonomy; could it cause harm, manipulation, or pressure; does it preserve trust; is it honest; does it comply with the law and with Aura's Law (provided below if available). You are not a pessimist and not a rubber stamp - most good actions pass. But you have real veto power and you use it when an action serves extraction over the human, violates consent, manipulates, deceives, or breaks a rule. Return ONLY a JSON object, no prose and no markdown fences, with exactly these keys: entity, action (the proposed action you judged), verdict (one of: allow, allow_with_conditions, block), reason (one or two sentences explaining the verdict), values_at_stake (array of the human values or rules that drove the decision), conditions (array of conditions that must hold for this to be acceptable - required when verdict is allow_with_conditions, otherwise empty), harm_check (one short sentence: the main way this could hurt the human or others, or 'none identified'), confidence (one of: high, medium, low). Be principled and concrete. Output JSON only.";
      let gUserContent = "ENTITY: " + gEntity + "\n\nPROPOSED ACTION:\n" + gAction;
      if (gMeaning) gUserContent += "\n\nMEANING (the human significance at stake):\n" + JSON.stringify(gMeaning);
      if (gLaw) gUserContent += "\n\nAURA'S LAW (codified rules you must enforce):\n" + gLaw;
      try {
        const gData = await callAnthropic(gApiKey, { model: gModel, max_tokens: 1500, system: gSystem, messages: [{ role: "user", content: gUserContent }] });
        let gText = "";
        if (gData && gData.content) { for (const b of gData.content) { if (b.type === "text") gText += b.text; } }
        gText = gText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let gParsed = null;
        try { gParsed = JSON.parse(gText); } catch {}
        if (!gParsed) return { cmd: "MEANING_GATE", payload: { ok: false, error: "Gate did not return valid JSON", raw: gText.slice(0, 1200) } };
        const gRecord = { entity: gEntity, action: gAction, gate: gParsed, ts: new Date().toISOString() };
        await env.AURA_KV.put(gKey, JSON.stringify(gRecord)).catch(() => {});
        return { cmd: "MEANING_GATE", payload: { ok: true, cached: false, entity: gEntity, action: gAction, ts: gRecord.ts, gate: gParsed } };
      } catch (e) {
        return { cmd: "MEANING_GATE", payload: { ok: false, error: "MEANING_GATE failed: " + e.message } };
      }
    }

    case "COGNITION":
    case "DETECT_ABSENCE": {
      // DETECT ABSENCE - the layer that notices what is NOT there. The gap, the missing
      // follow-up, the absent relationship, the un-done thing. Stacks on Perception + Meaning.
      // This is distinctive to Aura's brain: most systems only see what exists; this sees what
      // is missing but should exist. Lazy + cached: stores absence:{slug}.
      // Usage: DETECT_ABSENCE <entity>   |   DETECT_ABSENCE FRESH <entity>
      let dEntity = rest;
      let dFresh = false;
      if (/^FRESH\s+/i.test(dEntity)) { dFresh = true; dEntity = dEntity.replace(/^FRESH\s+/i, "").trim(); }
      if (!dEntity) return { cmd: "DETECT_ABSENCE", payload: { ok: false, error: "Usage: DETECT_ABSENCE <entity> (or FRESH). Give any entity to find what is missing." } };
      const dSlug = dEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      const dKey = `absence:${dSlug}`;
      if (!dFresh) {
        try { const cached = await env.AURA_KV.get(dKey); if (cached) { const c = JSON.parse(cached); return { cmd: "DETECT_ABSENCE", payload: { ok: true, cached: true, entity: c.entity, ts: c.ts, used_perception: c.used_perception, used_meaning: c.used_meaning, absence: c.absence } }; } } catch {}
      }
      const dApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!dApiKey) return { cmd: "DETECT_ABSENCE", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const dModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      let dPerception = null, dMeaning = null;
      try { const pc = await env.AURA_KV.get(`perception:${dSlug}`); if (pc) dPerception = JSON.parse(pc).perception; } catch {}
      try { const mc = await env.AURA_KV.get(`meaning:${dSlug}`); if (mc) dMeaning = JSON.parse(mc).meaning; } catch {}
      const dSystem = "You are the DETECT ABSENCE layer of Aura's cognition. Your ONLY job is to notice what is MISSING - what is NOT there but should be. The un-done thing, the missing follow-up, the absent relationship, the gap, the neglected connection, the opportunity not taken, the protection not in place. You do NOT list what exists (that is Perception). You see the negative space. This is how Aura notices a veteran has no one in his crisis circle, a relationship has gone cold, a follow-up never happened, a safety net is absent. Use the provided Perception and Meaning if available. Return ONLY a JSON object, no prose, no markdown fences, with exactly these keys: entity, whats_missing (array of concrete things that are absent but should exist), most_important_gap (the single most significant absence, one sentence), why_it_matters (one sentence on the human cost of this gap), is_anyone_at_risk (boolean - is a person made less safe by an absence here), risk_note (one sentence if is_anyone_at_risk is true, else empty string), confidence (high|medium|low), unknowns (array). Be honest. Output JSON only.";
      const dUser = "ENTITY: " + dEntity + (dPerception ? "\n\nPERCEPTION:\n" + JSON.stringify(dPerception) : "") + (dMeaning ? "\n\nMEANING:\n" + JSON.stringify(dMeaning) : "");
      try {
        const dData = await callAnthropic(dApiKey, { model: dModel, max_tokens: 1400, system: dSystem, messages: [{ role: "user", content: dUser }] });
        let dText = ""; if (dData && dData.content) { for (const b of dData.content) { if (b.type === "text") dText += b.text; } }
        dText = dText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let dParsed = null; try { dParsed = JSON.parse(dText); } catch {}
        if (!dParsed) return { cmd: "DETECT_ABSENCE", payload: { ok: false, error: "Did not return valid JSON", raw: dText.slice(0, 1200) } };
        const dRecord = { entity: dEntity, absence: dParsed, used_perception: !!dPerception, used_meaning: !!dMeaning, ts: new Date().toISOString() };
        await env.AURA_KV.put(dKey, JSON.stringify(dRecord)).catch(() => {});
        return { cmd: "DETECT_ABSENCE", payload: { ok: true, cached: false, entity: dEntity, ts: dRecord.ts, used_perception: !!dPerception, used_meaning: !!dMeaning, absence: dParsed } };
      } catch (e) { return { cmd: "DETECT_ABSENCE", payload: { ok: false, error: "DETECT_ABSENCE failed: " + e.message } }; }
    }

    case "JUDGE": {
      // JUDGE - the reflective layer that evaluates an action AFTER it happened. Distinct from
      // the GATE (which judges BEFORE acting). JUDGE asks: was this right? was it safe? did it
      // serve the person? Reads the action log for an entity. Protection has TEETH here: an
      // outcome that caused harm is judged a failure. Feeds LEARN. Stores judgment:{slug}:{ts}.
      // Usage: JUDGE <entity>            (judges the most recent logged action for the entity)
      //        JUDGE <entity> ::: <description of what happened and the outcome>
      let jRaw = rest;
      if (!jRaw) return { cmd: "JUDGE", payload: { ok: false, error: "Usage: JUDGE <entity>  or  JUDGE <entity> ::: <what happened + outcome>" } };
      let jEntity = jRaw, jOutcomeText = null;
      if (jRaw.includes(":::")) { const parts = jRaw.split(":::"); jEntity = parts[0].trim(); jOutcomeText = parts.slice(1).join(":::").trim(); }
      const jSlug = jEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      // pull the most recent action log for this entity if no outcome text given
      let jAction = null;
      if (!jOutcomeText) {
        try {
          const list = await env.AURA_KV.list({ prefix: `action:${jSlug}:`, limit: 100 });
          const keys = (list.keys || []).map(k => k.name).sort();
          if (keys.length) { const rec = await env.AURA_KV.get(keys[keys.length - 1]); if (rec) jAction = JSON.parse(rec); }
        } catch {}
      }
      if (!jOutcomeText && !jAction) return { cmd: "JUDGE", payload: { ok: false, error: "No action found to judge for this entity. Provide ::: <what happened> or run ACT first." } };
      const jApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!jApiKey) return { cmd: "JUDGE", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const jModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      const jSystem = "You are the JUDGE layer of Aura's cognition - her conscience. An action has already been taken. Your job is to evaluate it honestly AFTER the fact: was it RIGHT, was it SAFE, did it SERVE the person it was meant to serve? You are not deciding what to do next (that is other layers) - you are evaluating what was done. Protection has teeth here: if the action caused or risked harm to a person, you judge it a FAILURE regardless of other merits. Be honest even when the verdict is uncomfortable. Return ONLY a JSON object, no prose, no markdown fences, with exactly these keys: entity, action_judged (one sentence describing what was done), verdict (one of: good, acceptable, flawed, failure), was_it_safe (boolean), was_it_right (boolean), did_it_serve (boolean), what_went_well (array), what_went_wrong (array), harm_done (string - describe any harm, or empty string if none), confidence (high|medium|low). Output JSON only.";
      const jUser = "ENTITY: " + jEntity + (jAction ? "\n\nACTION TAKEN (from log):\n" + JSON.stringify({ command: jAction.command || jAction.would_fire, result: jAction.result, ok: jAction.ok, ts: jAction.ts }) : "") + (jOutcomeText ? "\n\nWHAT HAPPENED:\n" + jOutcomeText : "");
      try {
        const jData = await callAnthropic(jApiKey, { model: jModel, max_tokens: 1200, system: jSystem, messages: [{ role: "user", content: jUser }] });
        let jText = ""; if (jData && jData.content) { for (const b of jData.content) { if (b.type === "text") jText += b.text; } }
        jText = jText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let jParsed = null; try { jParsed = JSON.parse(jText); } catch {}
        if (!jParsed) return { cmd: "JUDGE", payload: { ok: false, error: "Did not return valid JSON", raw: jText.slice(0, 1200) } };
        const jTs = new Date().toISOString();
        const jRecord = { entity: jEntity, judgment: jParsed, ts: jTs };
        await env.AURA_KV.put(`judgment:${jSlug}:${jTs}`, JSON.stringify(jRecord)).catch(() => {});
        return { cmd: "JUDGE", payload: { ok: true, entity: jEntity, ts: jTs, judged_from: jAction ? "action_log" : "provided_outcome", judgment: jParsed } };
      } catch (e) { return { cmd: "JUDGE", payload: { ok: false, error: "JUDGE failed: " + e.message } }; }
    }

    case "LEARN": {
      // LEARN - how Aura grows. ONE unified learning command (merged 2026-06-21).
      // Two paths, same concept (learn from what happened):
      //   PATH A (preferred): if a JUDGE verdict exists for the entity, distill the durable
      //                       lesson from that judgment (the clean SEE->JUDGE->LEARN loop).
      //   PATH B (fallback):  if no judgment, review the entity's fired action logs directly
      //                       (the older correction-loop behavior) and learn from those.
      // Either path writes a durable lesson; lessons accumulate into EVOLVE.
      // Usage: LEARN <entity>                                   (learn from latest judgment, else review actions)
      //        LEARN <entity> ::: <observed real-world outcome>  (teach from a real result)
      let lRaw = rest.trim();
      if (!lRaw) return { cmd: "LEARN", payload: { ok: false, error: "Usage: LEARN <entity>  or  LEARN <entity> ::: <observed outcome>" } };
      let lEntity = lRaw, lObserved = "";
      if (lRaw.includes(":::")) { const sp = lRaw.split(":::"); lEntity = sp[0].trim(); lObserved = sp.slice(1).join(":::").trim(); }
      const lSlug = lEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      const lApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!lApiKey) return { cmd: "LEARN", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const lModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";

      // PATH A: a JUDGE verdict exists -> learn from the judgment
      let lJudgment = null;
      try {
        const list = await env.AURA_KV.list({ prefix: `judgment:${lSlug}:`, limit: 100 });
        const keys = (list.keys || []).map(k => k.name).sort();
        if (keys.length) { const rec = await env.AURA_KV.get(keys[keys.length - 1]); if (rec) lJudgment = JSON.parse(rec).judgment; }
      } catch {}

      if (lJudgment) {
        const lSystem = "You are the LEARN layer of Aura's cognition - how she grows. You are given a JUDGMENT of an action that was taken. Extract the durable, transferable LESSON: what should Aura do differently or keep doing, stated as a principle that applies beyond this single case. Do not just restate the judgment - distill the rule. If harm was done, the lesson must center on preventing that harm next time. Return ONLY a JSON object, no prose, no markdown fences, with exactly these keys: entity, lesson (durable principle, one or two sentences), keep_doing (array), change (array), guards_against (string - the specific harm this prevents, or empty), applies_beyond_this_case (boolean). Output JSON only.";
        const lUser = "ENTITY: " + lEntity + "\n\nJUDGMENT:\n" + JSON.stringify(lJudgment) + (lObserved ? "\n\nOBSERVED REAL-WORLD OUTCOME (weigh heavily):\n" + lObserved : "");
        try {
          const lData = await callAnthropic(lApiKey, { model: lModel, max_tokens: 1000, system: lSystem, messages: [{ role: "user", content: lUser }] });
          let lText = ""; if (lData && lData.content) { for (const b of lData.content) { if (b.type === "text") lText += b.text; } }
          lText = lText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          let lParsed = null; try { lParsed = JSON.parse(lText); } catch {}
          if (!lParsed) return { cmd: "LEARN", payload: { ok: false, error: "Did not return valid JSON", raw: lText.slice(0, 1200) } };
          const lTs = new Date().toISOString();
          await env.AURA_KV.put(`lesson:learned:${lSlug}:${lTs}`, JSON.stringify({ entity: lEntity, lesson: lParsed, ts: lTs })).catch(() => {});
          // also roll into the shared lessons stream so all future cognition can read it
          try {
            let recent = []; const rr = await env.AURA_KV.get("notes:corrections:lessons");
            if (rr) { try { recent = JSON.parse(rr); } catch {} }
            recent.unshift({ entity: lEntity, lesson: lParsed.lesson, source: "judgment", ts: lTs });
            if (recent.length > 50) recent = recent.slice(0, 50);
            await env.AURA_KV.put("notes:corrections:lessons", JSON.stringify(recent)).catch(() => {});
          } catch {}
          return { cmd: "LEARN", payload: { ok: true, path: "judgment", entity: lEntity, ts: lTs, lesson: lParsed } };
        } catch (e) { return { cmd: "LEARN", payload: { ok: false, error: "LEARN (judgment path) failed: " + e.message } }; }
      }

      // PATH B: no judgment -> review the entity's fired action logs (older correction behavior)
      const lSystemB = "You are the CORRECTION and LEARNING layer of Aura's cognition. An action was taken. Reflect honestly without ego. If a real-world OBSERVED OUTCOME is provided, weigh it above all else. Judge whether it was the right call and what should change. Return ONLY a JSON object, no prose or fences, with exactly these keys: action_summary, intended_outcome, actual_outcome (say 'not yet known' if unobserved), worked (yes|partial|no|unknown), what_was_right (array), what_to_change (array), lesson (one crisp transferable sentence), confidence (high|medium|low). Output JSON only.";
      let lActionKeys = [];
      try { const listed = await env.AURA_KV.list({ prefix: `action:${lSlug}:`, limit: 100 }); lActionKeys = (listed.keys || []).map(k => k.name).sort(); } catch {}
      if (!lActionKeys.length) return { cmd: "LEARN", payload: { ok: false, error: "Nothing to learn from: no judgment and no action logs for this entity. Run JUDGE or ACT first." } };
      const lReviews = []; let lCount = 0;
      for (let i = lActionKeys.length - 1; i >= 0 && lCount < 5; i--) {
        const ak = lActionKeys[i];
        let log = null; try { const raw = await env.AURA_KV.get(ak); if (raw) log = JSON.parse(raw); } catch {}
        if (!log) continue;
        let lUser = "ACTION TAKEN:\n" + JSON.stringify({ entity: log.entity, command: log.command || log.would_fire, ok: log.ok, result: log.result, ts: log.ts });
        if (lObserved) lUser += "\n\nOBSERVED REAL-WORLD OUTCOME (weigh heavily):\n" + lObserved;
        let parsed = null;
        try {
          const d = await callAnthropic(lApiKey, { model: lModel, max_tokens: 1000, system: lSystemB, messages: [{ role: "user", content: lUser }] });
          let t = ""; if (d && d.content) { for (const b of d.content) { if (b.type === "text") t += b.text; } }
          t = t.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          try { parsed = JSON.parse(t); } catch {}
        } catch (e) {}
        if (!parsed) { lReviews.push({ action_key: ak, ok: false, error: "review did not return valid JSON" }); continue; }
        const revTs = new Date().toISOString();
        await env.AURA_KV.put(`lesson:learned:${lSlug}:${revTs}`, JSON.stringify({ entity: lEntity, lesson: parsed, ts: revTs, source: "action_review" })).catch(() => {});
        try {
          let recent = []; const rr = await env.AURA_KV.get("notes:corrections:lessons");
          if (rr) { try { recent = JSON.parse(rr); } catch {} }
          recent.unshift({ entity: lEntity, lesson: parsed.lesson, worked: parsed.worked, source: "action_review", ts: revTs });
          if (recent.length > 50) recent = recent.slice(0, 50);
          await env.AURA_KV.put("notes:corrections:lessons", JSON.stringify(recent)).catch(() => {});
        } catch {}
        lReviews.push({ action_key: ak, ok: true, worked: parsed.worked, lesson: parsed.lesson });
        lCount++;
      }
      return { cmd: "LEARN", payload: { ok: true, path: "action_review", entity: lEntity, reviewed: lCount, reviews: lReviews } };
    }

    case "PATTERNS": {
      // LEARNING AS DATA - distills the accumulated stream of lessons into durable, readable
      // PATTERNS that Aura's brain can read before reasoning. This is how learning COMPOUNDS:
      // a single lesson is one data point; a pattern is what holds across many. Lessons are
      // additive and reviewable; the FOUNDATION stays immutable above all of it. Nothing a user
      // says rewrites what Aura is FOR - patterns only sharpen HOW she helps and what to watch for.
      // Usage: PATTERNS DISTILL [domain]   (read recent lessons, distill durable patterns)
      //        PATTERNS GET [domain]       (read the current distilled patterns)
      //        PATTERNS LIST               (show recent raw lessons)
      if (!isOp) return { cmd: "PATTERNS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pSub = (args[0] || "").toUpperCase();
      const pDomain = (args[1] || "general").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);

      if (pSub === "LIST") {
        let recent = []; try { const rr = await env.AURA_KV.get("notes:corrections:lessons"); if (rr) recent = JSON.parse(rr) || []; } catch {}
        return { cmd: "PATTERNS", payload: { ok: true, count: recent.length, recent: recent.slice(0, 30) } };
      }

      if (pSub === "GET") {
        let pat = null; try { const r = await env.AURA_KV.get(`patterns:${pDomain}`); if (r) pat = JSON.parse(r); } catch {}
        if (!pat) return { cmd: "PATTERNS", payload: { ok: true, domain: pDomain, patterns: null, note: "No patterns distilled yet for this domain. Run PATTERNS DISTILL " + pDomain } };
        return { cmd: "PATTERNS", payload: { ok: true, domain: pDomain, patterns: pat } };
      }

      if (pSub === "DISTILL") {
        // gather the raw lesson stream from BOTH stores: the cognition/correction stream AND the
        // SEEDLESSON / notes:lessons:* store (they were separate drawers; distill reads both now)
        let recent = []; try { const rr = await env.AURA_KV.get("notes:corrections:lessons"); if (rr) recent = JSON.parse(rr) || []; } catch {}
        // pull domain-specific seeded lessons (SEEDLESSON writes notes:lessons:<domain>)
        try {
          const seeded = await env.AURA_KV.get(`notes:lessons:${pDomain}`);
          if (seeded) recent.unshift({ entity: pDomain, lesson: seeded.slice(0, 2000), source: "seeded", ts: new Date().toISOString() });
        } catch {}
        // also sweep any other notes:lessons:* entries so nothing learned is missed
        try {
          const list = await env.AURA_KV.list({ prefix: "notes:lessons:", limit: 50 });
          for (const k of (list.keys || [])) {
            if (k.name === `notes:lessons:${pDomain}`) continue; // already included
            const v = await env.AURA_KV.get(k.name);
            if (v) recent.push({ entity: k.name.replace("notes:lessons:", ""), lesson: v.slice(0, 1200), source: "seeded", ts: new Date().toISOString() });
          }
        } catch {}
        if (!recent.length) return { cmd: "PATTERNS", payload: { ok: false, error: "No lessons to distill yet. Aura learns from LEARN/JUDGE/SEEDLESSON first." } };
        const apiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        if (!apiKey) return { cmd: "PATTERNS", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
        const model = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
        // include any existing patterns so distillation accumulates rather than resets
        let prior = null; try { const r = await env.AURA_KV.get(`patterns:${pDomain}`); if (r) prior = JSON.parse(r); } catch {}
        const sys = "You are the PATTERN layer of Aura's learning. You are given a stream of individual LESSONS Aura has learned from real interactions, plus any PRIOR distilled patterns. Your job is to find what holds ACROSS MANY of them - the durable, transferable patterns that should sharpen how Aura helps and what she watches for. These patterns are ADDITIVE GUIDANCE she will read before reasoning; they NEVER override or rewrite her foundation (what she is FOR) - they only make her better at HOW. Two kinds of pattern matter: HELPING patterns (what makes people feel understood, what good guidance looks like, what to ask) and SAFETY patterns (what kinds of requests conceal harm, how harm hides behind innocent framing, what to flag early - so the same trick never works twice). Merge with prior patterns: keep what still holds, refine, add what is new, drop nothing important. Return ONLY a JSON object, no prose or fences, with exactly these keys: domain, helping_patterns (array of durable guidance strings for serving people better), safety_patterns (array of durable guidance strings for catching harm early), watch_for (array of specific signals/framings that should raise a flag at first perception), confidence (high|medium|low), lessons_count (number you distilled from). Be concrete and grounded - each pattern should be something Aura can actually apply. Output JSON only.";
        const user = "DOMAIN: " + pDomain + "\n\nPRIOR PATTERNS:\n" + (prior ? JSON.stringify(prior) : "none yet") + "\n\nLESSON STREAM (most recent first):\n" + JSON.stringify(recent.slice(0, 50));
        try {
          const d = await callAnthropic(apiKey, { model, max_tokens: 1500, system: sys, messages: [{ role: "user", content: user }] });
          let t = ""; if (d && d.content) { for (const b of d.content) { if (b.type === "text") t += b.text; } }
          t = t.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          let parsed = null; try { parsed = JSON.parse(t); } catch {}
          if (!parsed) return { cmd: "PATTERNS", payload: { ok: false, error: "Distillation did not return valid JSON", raw: t.slice(0, 1000) } };
          parsed.distilled_at = new Date().toISOString();
          await env.AURA_KV.put(`patterns:${pDomain}`, JSON.stringify(parsed)).catch(() => {});
          return { cmd: "PATTERNS", payload: { ok: true, domain: pDomain, distilled_from: recent.length, patterns: parsed } };
        } catch (e) { return { cmd: "PATTERNS", payload: { ok: false, error: "PATTERNS DISTILL failed: " + e.message } }; }
      }

      return { cmd: "PATTERNS", payload: { ok: false, error: "Sub-commands: DISTILL [domain], GET [domain], LIST" } };
    }

    case "COGNIZE": {
      // THE CONDUCTOR — runs the full cognition pipeline in one motion: Perception -> Meaning ->
      // Possibility -> Priority -> Meaning Gate. Reuses the proven layer commands (and their
      // caches), so each layer stacks on the last automatically. Carries SUMMONED-DEPTH routing:
      // COGNIZE AUTO lets Aura decide how deep to think (trivial -> perceive only; real decision
      // -> full). Default is full. Returns a tight summary plus every layer's full output.
      // Usage: COGNIZE <entity>  |  COGNIZE FULL|PRIORITY|POSSIBILITY|MEANING|PERCEIVE <entity>
      //        COGNIZE AUTO <entity>  (Aura picks the depth)
      let cgRaw = rest;
      let cgDepth = "full";
      const cgDepthWords = { "PERCEIVE": "perceive", "MEANING": "meaning", "POSSIBILITY": "possibility", "PRIORITY": "priority", "FULL": "full", "AUTO": "auto" };
      const cgFirst = (cgRaw.split(/\s+/)[0] || "").toUpperCase();
      if (cgDepthWords[cgFirst]) { cgDepth = cgDepthWords[cgFirst]; cgRaw = cgRaw.replace(/^\S+\s*/, "").trim(); }
      const cgEntity = cgRaw;
      if (!cgEntity) return { cmd: "COGNIZE", payload: { ok: false, error: "Usage: COGNIZE <entity>  |  COGNIZE FULL|PRIORITY|POSSIBILITY|MEANING|PERCEIVE <entity>  |  COGNIZE AUTO <entity> (Aura picks depth)." } };
      let cgRouted = null;
      if (cgDepth === "auto") {
        const rApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        const rModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
        if (rApiKey) {
          try {
            const rData = await callAnthropic(rApiKey, { model: rModel, max_tokens: 60, system: "You are Aura's cognition router. Decide how deeply to think about the given entity. Reply with ONE word only: perceive (trivial, just observe), meaning (needs interpretation), possibility (worth expanding), priority (a real decision is needed), or full (high-stakes, run everything including the action gate). Most everyday things are perceive or meaning. Reserve full for genuine decisions or high-stakes entities. One word only.", messages: [{ role: "user", content: cgEntity }] });
            let rt = ""; if (rData && rData.content) { for (const b of rData.content) { if (b.type === "text") rt += b.text; } }
            rt = rt.trim().toLowerCase().replace(/[^a-z]/g, "");
            if (["perceive", "meaning", "possibility", "priority", "full"].includes(rt)) { cgDepth = rt; cgRouted = rt; } else { cgDepth = "full"; cgRouted = "full"; }
          } catch { cgDepth = "full"; cgRouted = "full"; }
        } else { cgDepth = "full"; }
      }
      const cgOrder = ["perceive", "meaning", "possibility", "absence", "priority"];
      const cgCmdMap = { perceive: "PERCEIVE", meaning: "MEANING", possibility: "POSSIBILITY", absence: "DETECT_ABSENCE", priority: "PRIORITY" };
      const cgTargetIdx = cgDepth === "full" ? 4 : cgOrder.indexOf(cgDepth);
      const cgLayers = {};
      for (let i = 0; i <= cgTargetIdx; i++) {
        const layerName = cgOrder[i];
        const r = await processCommand(cgCmdMap[layerName] + " " + cgEntity, env, isOp);
        cgLayers[layerName] = (r && r.payload) ? r.payload : r;
      }
      let cgGate = null;
      if (cgDepth === "full") {
        const gr = await processCommand("GATE " + cgEntity, env, isOp);
        cgGate = (gr && gr.payload) ? gr.payload : gr;
        cgLayers.gate = cgGate;
      }
      const cgSummary = {};
      try { if (cgLayers.perception && cgLayers.perception.perception) cgSummary.what_it_is = cgLayers.perception.perception.what_it_is; } catch {}
      try { if (cgLayers.meaning && cgLayers.meaning.meaning) cgSummary.what_it_really_is = cgLayers.meaning.meaning.what_it_really_is; } catch {}
      try { if (cgLayers.possibility && cgLayers.possibility.possibility) cgSummary.what_it_could_become = cgLayers.possibility.possibility.what_it_could_become; } catch {}
      try { if (cgLayers.absence && cgLayers.absence.absence) { cgSummary.most_important_gap = cgLayers.absence.absence.most_important_gap; if (cgLayers.absence.absence.is_anyone_at_risk) cgSummary.risk_note = cgLayers.absence.absence.risk_note; } } catch {}
      try { if (cgLayers.priority && cgLayers.priority.priority) { cgSummary.the_one_thing = cgLayers.priority.priority.the_one_thing; cgSummary.do_now = cgLayers.priority.priority.do_now; } } catch {}
      try { if (cgGate && cgGate.gate) { cgSummary.gate_verdict = cgGate.gate.verdict; cgSummary.gate_reason = cgGate.gate.reason; } } catch {}
      // LEARNING LOOP - consequential runs leave a trace. When the gate blocked or set conditions
      // (the hard calls - refusals, careful allows), write a durable, reviewable lesson into the
      // stream PATTERNS distills. This is how a caught attack becomes a remembered one, and how
      // hard guidance accumulates. Additive and reviewable; the foundation stays untouched.
      try {
        const cgV = cgSummary.gate_verdict || "";
        if (cgV === "block" || cgV === "allow_with_conditions") {
          const lessonText = (cgV === "block")
            ? ("Refused: " + (cgSummary.what_it_really_is || cgEntity.slice(0, 120)) + " | why: " + (cgSummary.gate_reason || "").slice(0, 240))
            : ("Allowed with care: " + (cgSummary.the_one_thing || cgEntity.slice(0, 120)) + " | conditions because: " + (cgSummary.gate_reason || "").slice(0, 240));
          const lTs = new Date().toISOString();
          let recent = []; const rr = await env.AURA_KV.get("notes:corrections:lessons"); if (rr) { try { recent = JSON.parse(rr) || []; } catch {} }
          recent.unshift({ entity: cgEntity.slice(0, 160), lesson: lessonText, source: "cognition_gate", verdict: cgV, ts: lTs });
          if (recent.length > 50) recent = recent.slice(0, 50);
          await env.AURA_KV.put("notes:corrections:lessons", JSON.stringify(recent)).catch(() => {});
        }
      } catch {}
      return { cmd: "COGNIZE", payload: { ok: true, entity: cgEntity, depth: cgDepth, routed: cgRouted, summary: cgSummary, layers: cgLayers } };
    }

    case "LOOP": {
      // ===== THE FULL COGNITIVE LOOP CONDUCTOR (instrumented) =====
      // Runs SEE -> UNDERSTAND -> EXPAND -> DECIDE -> JUDGE(gate) -> [translate decision->action]
      // -> ACT -> (JUDGE result) -> LEARN as ONE motion, carrying state. SAFE BY DEFAULT: dry-run.
      // FULL VISIBILITY: every stage is timed; a TIME BUDGET returns gracefully BEFORE the platform
      // wall (so we never get a silent blank); the whole trace + timings are logged to loop:{slug}.
      // Usage: LOOP <entity>          (full loop, dry-run — proposes an action, fires nothing)
      //        LOOP CONFIRM <entity>  (operator: fire the proposal, then JUDGE + LEARN)
      let lpRaw = rest;
      let lpConfirm = false;
      if (/^CONFIRM\s+/i.test(lpRaw)) { lpConfirm = true; lpRaw = lpRaw.replace(/^CONFIRM\s+/i, "").trim(); }
      const lpEntity = lpRaw.trim();
      if (!lpEntity) return { cmd: "LOOP", payload: { ok: false, error: "Usage: LOOP <entity> (full loop, dry-run). LOOP CONFIRM <entity> (operator: fire + judge + learn)." } };
      const lpSlug = lpEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";

      const lpT0 = Date.now();
      const lpTiming = {};
      const lpBudgetMs = 38000; // stay safely under the platform wall; return partial before we get killed
      const lpElapsed = () => Date.now() - lpT0;
      const lpLayers = {};
      // run a stage, time it; returns the payload
      const lpStage = async (name, cmd) => { const s = Date.now(); const r = await processCommand(cmd, env, isOp); lpTiming[name] = Date.now() - s; return (r && r.payload) ? r.payload : r; };
      const lpSummary = {};
      const lpBuildSummary = () => {
        try { if (lpLayers.perception && lpLayers.perception.perception) lpSummary.what_it_is = lpLayers.perception.perception.what_it_is; } catch {}
        try { if (lpLayers.meaning && lpLayers.meaning.meaning) lpSummary.what_it_really_is = lpLayers.meaning.meaning.what_it_really_is; } catch {}
        try { if (lpLayers.possibility && lpLayers.possibility.possibility) lpSummary.what_it_could_become = lpLayers.possibility.possibility.what_it_could_become; } catch {}
        try { if (lpLayers.priority && lpLayers.priority.priority) { lpSummary.decided = lpLayers.priority.priority.the_one_thing; lpSummary.do_now = lpLayers.priority.priority.do_now; } } catch {}
        try { if (lpLayers.gate && lpLayers.gate.gate) { lpSummary.gate_verdict = lpLayers.gate.gate.verdict; lpSummary.gate_reason = lpLayers.gate.gate.reason; } } catch {}
      };
      const lpEarly = (reached, extra) => {
        lpBuildSummary();
        const ts = new Date().toISOString();
        const trace = { entity: lpEntity, confirmed: lpConfirm, partial: true, reached, summary: lpSummary, timing: lpTiming, total_ms: lpElapsed(), ts };
        env.AURA_KV.put("loop:" + lpSlug + ":" + ts, JSON.stringify(trace)).catch(() => {});
        return { cmd: "LOOP", payload: Object.assign({ ok: true, partial: true, entity: lpEntity, reached, note: "Stopped early to stay under the platform time limit — returning what completed, with timings so we can see exactly what is slow. Run LOOP again to continue (earlier stages are now cached and fast).", summary: lpSummary, timing: lpTiming, total_ms: lpElapsed() }, extra || {}) };
      };

      try {
        // ---- FRONT HALF (each stage timed; budget-checked before the next) ----
        lpLayers.perception = await lpStage("perceive", "PERCEIVE " + lpEntity);
        if (lpElapsed() > lpBudgetMs) return lpEarly("perceive");
        lpLayers.meaning = await lpStage("meaning", "MEANING " + lpEntity);
        if (lpElapsed() > lpBudgetMs) return lpEarly("meaning");
        lpLayers.possibility = await lpStage("possibility", "POSSIBILITY " + lpEntity);
        if (lpElapsed() > lpBudgetMs) return lpEarly("possibility");
        lpLayers.priority = await lpStage("priority", "PRIORITY " + lpEntity);
        if (lpElapsed() > lpBudgetMs) return lpEarly("priority");
        lpLayers.gate = await lpStage("gate", "GATE " + lpEntity);
        if (lpElapsed() > lpBudgetMs) return lpEarly("gate");
        lpBuildSummary();
        const lpDecision = (lpLayers.priority && lpLayers.priority.priority) ? lpLayers.priority.priority : null;
        const lpGate = lpSummary.gate_verdict || null;

        // ---- TRANSLATE: decision -> a proposed capability command (the thinking->doing bridge) ----
        const lpApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        if (!lpApiKey) return lpEarly("translate", { error: "Brain not configured (secret:anthropic missing)" });
        const lpModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
        let lpCapList = "";
        try { const cr = await processCommand("CAPABILITY LIST", env, isOp); const cp = (cr && cr.payload) ? cr.payload : cr; if (cp && cp.capabilities) lpCapList = (cp.capabilities || []).map(c => (c && c.name) ? c.name : c).join(", "); } catch {}
        const lpTrSys = "You are the bridge between Aura's DECISION and her ACTION. Given a decision (the one thing to do) and a list of available capability commands, choose the SINGLE capability command that would carry out the decision, fully formed and ready to run. If the right move is to communicate or respond rather than fire a tool, return needs_action false. Return ONLY a JSON object, no prose, no fences, with exactly these keys: needs_action (boolean), capability_command (the exact command string to run, or empty), why (one sentence), communicate_instead (what Aura should say or do if no action, else empty). Output JSON only.";
        const lpTrUser = "DECISION:\n" + JSON.stringify(lpDecision || {}) + "\n\nAVAILABLE CAPABILITIES:\n" + (lpCapList || "(none listed)") + "\n\nENTITY: " + lpEntity;
        let lpProposal = null;
        const lpTrStart = Date.now();
        try {
          const trData = await callAnthropic(lpApiKey, { model: lpModel, max_tokens: 400, system: lpTrSys, messages: [{ role: "user", content: lpTrUser }] });
          let tt = ""; if (trData && trData.content) { for (const b of trData.content) { if (b.type === "text") tt += b.text; } }
          tt = tt.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          lpProposal = JSON.parse(tt);
        } catch (e) { lpProposal = { needs_action: false, capability_command: "", why: "Could not translate decision into an action: " + String(e.message), communicate_instead: "" }; }
        lpTiming.translate = Date.now() - lpTrStart;
        if (lpElapsed() > lpBudgetMs && !lpConfirm) return lpEarly("translate", { proposed_action: lpProposal });

        // ---- ACT: dry-run the proposal (fires nothing unless LOOP CONFIRM + operator) ----
        let lpAct = null;
        if (lpProposal && lpProposal.needs_action && lpProposal.capability_command) {
          const actCmd = (lpConfirm ? "ACT CONFIRM " : "ACT ") + lpEntity + " ::: " + lpProposal.capability_command;
          lpAct = await lpStage("act", actCmd);
        }

        // ---- BACK HALF (only when CONFIRM actually fired): JUDGE the result, then LEARN ----
        let lpJudgment = null, lpLesson = null;
        if (lpConfirm && lpAct && lpAct.fired) {
          const jp = await lpStage("judge", "JUDGE " + lpEntity);
          lpJudgment = (jp && jp.judgment) ? jp.judgment : jp;
          const lp2 = await lpStage("learn", "LEARN " + lpEntity);
          lpLesson = (lp2 && lp2.lesson) ? lp2.lesson : lp2;
        }

        // ---- log the full loop trace (with timings) ----
        const lpTs = new Date().toISOString();
        const lpTrace = { entity: lpEntity, confirmed: lpConfirm, gate_verdict: lpGate, decision: lpDecision ? (lpDecision.the_one_thing || null) : null, proposal: lpProposal, acted: !!(lpAct && lpAct.fired), judgment: lpJudgment, lesson: lpLesson, timing: lpTiming, total_ms: lpElapsed(), ts: lpTs };
        await env.AURA_KV.put("loop:" + lpSlug + ":" + lpTs, JSON.stringify(lpTrace)).catch(() => {});

        return { cmd: "LOOP", payload: { ok: true, entity: lpEntity, confirmed: lpConfirm, mode: lpConfirm ? "fired" : "dry_run",
          saw: lpSummary.what_it_is || null,
          understood: lpSummary.what_it_really_is || null,
          expanded: lpSummary.what_it_could_become || null,
          decided: lpDecision ? lpDecision.the_one_thing : null,
          gate_verdict: lpGate,
          proposed_action: lpProposal,
          act: lpAct,
          judgment: lpJudgment,
          lesson: lpLesson,
          timing: lpTiming,
          total_ms: lpElapsed(),
          logged_as: "loop:" + lpSlug + ":" + lpTs,
          note: lpConfirm ? "Loop ran fully: thought, acted, judged, learned." : "Dry-run: thought all the way to the edge of action and proposed. Nothing fired. Use LOOP CONFIRM (operator) to act, judge, and learn."
        } };
      } catch (e) {
        return { cmd: "LOOP", payload: { ok: false, entity: lpEntity, error: "Loop error: " + String(e && e.message), timing: lpTiming, total_ms: lpElapsed(), summary: lpSummary } };
      }
    }

    case "ACT": {
      // BRIDGE TO ACTION — the seam between thinking and doing. Fires a real Capability engine,
      // but ONLY behind the Meaning Gate: a blocked or unjudged action cannot execute. Logs every
      // fired action + outcome to action:{slug}:{ts} (raw material for the Correction loop).
      // SAFETY: dry-run by default (shows what it WOULD fire). Firing requires CONFIRM and operator
      // auth - autonomy of thought, operator-gated action, until the loop earns trust.
      // Usage: ACT <entity> ::: <CAPABILITY_COMMAND ...>           (dry-run proposal)
      //        ACT CONFIRM <entity> ::: <CAPABILITY_COMMAND ...>   (actually fires; operator only)
      let aRaw = rest;
      let aConfirm = false;
      if (/^CONFIRM\s+/i.test(aRaw)) { aConfirm = true; aRaw = aRaw.replace(/^CONFIRM\s+/i, "").trim(); }
      const aSplit = aRaw.split(":::");
      if (aSplit.length < 2) return { cmd: "ACT", payload: { ok: false, error: "Usage: ACT <entity> ::: <CAPABILITY_COMMAND>  (dry-run). Put CONFIRM after ACT to actually fire (operator only). Example: ACT CONFIRM acme ::: EMAIL_SEND ..." } };
      const aEntity = aSplit[0].trim();
      const aCommand = aSplit.slice(1).join(":::").trim();
      if (!aEntity || !aCommand) return { cmd: "ACT", payload: { ok: false, error: "Need both an entity and a capability command, separated by ':::'." } };
      const aSlug = aEntity.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "entity";
      // GATE CHECK — read stored gate verdict for this entity+action, else run the Gate now.
      let aGate = null;
      try {
        const gActionSlug = aCommand.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const gc = await env.AURA_KV.get(`gate:${aSlug}:${gActionSlug}`);
        if (gc) aGate = JSON.parse(gc).gate;
      } catch {}
      if (!aGate) {
        const gr = await processCommand("GATE " + aEntity + " ::: " + aCommand, env, isOp);
        aGate = (gr && gr.payload && gr.payload.gate) ? gr.payload.gate : null;
      }
      if (!aGate) return { cmd: "ACT", payload: { ok: false, error: "Could not obtain a Gate verdict; refusing to act. Nothing fires without the Gate." } };
      const aVerdict = aGate.verdict;
      if (aVerdict === "block") {
        return { cmd: "ACT", payload: { ok: false, blocked: true, entity: aEntity, proposed_command: aCommand, gate_verdict: aVerdict, reason: aGate.reason, harm_check: aGate.harm_check } };
      }
      if (!aConfirm) {
        return { cmd: "ACT", payload: { ok: true, dry_run: true, entity: aEntity, would_fire: aCommand, gate_verdict: aVerdict, conditions: aGate.conditions || [], note: "Dry-run - nothing was fired. Add CONFIRM after ACT (operator only) to execute." } };
      }
      if (!isOp) {
        return { cmd: "ACT", payload: { ok: false, entity: aEntity, would_fire: aCommand, gate_verdict: aVerdict, error: "OPERATOR_REQUIRED to fire a real action. Aura may propose (dry-run); firing needs operator confirmation." } };
      }
      // CONFIRMED + OPERATOR + not blocked -> fire the capability command.
      let aResult = null, aOk = false;
      try {
        const r = await processCommand(aCommand, env, isOp);
        aResult = (r && r.payload) ? r.payload : r;
        aOk = !!(aResult && (aResult.ok === undefined ? true : aResult.ok));
      } catch (e) { aResult = { ok: false, error: String(e.message) }; }
      const aTs = new Date().toISOString();
      const aLog = { entity: aEntity, command: aCommand, gate_verdict: aVerdict, conditions: aGate.conditions || [], confirmed: true, ok: aOk, result: aResult, ts: aTs, outcome_checked: false };
      await env.AURA_KV.put(`action:${aSlug}:${aTs}`, JSON.stringify(aLog)).catch(() => {});
      return { cmd: "ACT", payload: { ok: aOk, fired: true, entity: aEntity, command: aCommand, gate_verdict: aVerdict, conditions: aGate.conditions || [], result: aResult, logged_as: `action:${aSlug}:${aTs}`, ts: aTs } };
    }

    case "REVIEW":
    case "SECURESPEND": {
      // SECURESPEND — the cognition engine pointed at MONEY. Runs the four-layer loop
      // (Perceive -> Meaning -> Possibility -> Priority) with a financial lens on any
      // financial entity: a subscription, charge, bill, renewal, or a purchase being
      // considered. Returns a clean decision: what it is, what it really means in a life,
      // the real options, and the one recommended move. Pure reasoning (no external data
      // needed) - so it works today, and runs on real Plaid/Stripe transactions later.
      // Design constraints: never nag, never moralize, always give context, respect agency.
      // Lazy + cached: stores securespend:{slug}; returns cache unless FRESH.
      // Usage: SECURESPEND <financial thing>   |   SECURESPEND FRESH <financial thing>
      let ssRaw = rest;
      let ssFresh = false;
      if (/^FRESH\s+/i.test(ssRaw)) { ssFresh = true; ssRaw = ssRaw.replace(/^FRESH\s+/i, "").trim(); }
      if (!ssRaw) return { cmd: "SECURESPEND", payload: { ok: false, error: "Usage: SECURESPEND <financial thing> (a subscription, charge, bill, renewal, or purchase). FRESH to recompute." } };
      const ssSlug = ssRaw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
      const ssKey = `securespend:${ssSlug}`;
      if (!ssFresh) {
        try { const cached = await env.AURA_KV.get(ssKey); if (cached) { const c = JSON.parse(cached); return { cmd: "SECURESPEND", payload: { ok: true, cached: true, entity: c.entity, ts: c.ts, securespend: c.securespend } }; } } catch {}
      }
      const ssApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!ssApiKey) return { cmd: "SECURESPEND", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const ssModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      const ssSystem = "You are SECURESPEND, the financial-awareness layer of Aura - the cognition engine pointed at money. Given a financial thing (a subscription, recurring charge, bill, renewal, or a purchase someone is weighing), you run four moves and return a calm, useful decision. You SERVE THE HUMAN: you never nag, never moralize, never shame spending, never act like a budget cop. You give context and clarity so a person can decide with confidence. Run: PERCEIVE (what is this really, plainly - what it costs, how often, what is attached), MEANING (what it actually is in a human life - protection, a meaningful project, genuine value, or quiet waste/a forgotten thing), POSSIBILITY (the real options: keep, pause, cancel, downgrade, renegotiate, consolidate, switch), PRIORITY (the single best move and why, plus what to do now). Return ONLY a JSON object, no prose or fences, with exactly these keys: entity, what_it_is (plain, one sentence including likely cost/frequency if inferable), what_it_means (the human significance - protection / project / value / waste / forgotten), options (array of realistic moves), the_move (the single recommended action, one or two sentences), why (the reason, tied to the human's actual benefit not just saving money), do_now (one concrete next step), watch_for (array of things to be aware of - hidden fees, cancellation windows, renewal dates, gotchas), confidence (high, medium, low), unknowns (array of what you would need to know for certain - e.g. actual usage, real price). Be honest and concrete. If you cannot tell whether something is worth it, say so in unknowns rather than guessing. Output JSON only.";
      try {
        const ssData = await callAnthropic(ssApiKey, { model: ssModel, max_tokens: 2000, system: ssSystem, messages: [{ role: "user", content: ssRaw }] });
        let ssText = "";
        if (ssData && ssData.content) { for (const b of ssData.content) { if (b.type === "text") ssText += b.text; } }
        ssText = ssText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let ssParsed = null;
        try { ssParsed = JSON.parse(ssText); } catch {}
        if (!ssParsed) return { cmd: "SECURESPEND", payload: { ok: false, error: "SecureSpend did not return valid JSON", raw: ssText.slice(0, 1200) } };
        const ssRecord = { entity: ssRaw, securespend: ssParsed, ts: new Date().toISOString() };
        await env.AURA_KV.put(ssKey, JSON.stringify(ssRecord)).catch(() => {});
        return { cmd: "SECURESPEND", payload: { ok: true, cached: false, entity: ssRaw, ts: ssRecord.ts, securespend: ssParsed } };
      } catch (e) {
        return { cmd: "SECURESPEND", payload: { ok: false, error: "SECURESPEND failed: " + e.message } };
      }
    }

    case "SECURESPEND_SCAN": {
      // SECURESPEND_SCAN — the DOGFOOD command. Reads Aaron's REAL accounts (the keys
      // Aura already holds: Stripe, Mercury, Twilio) and runs the SecureSpend money-lens
      // on the actual financial picture, not a typed description. This is the proof that
      // the asset works on reality. Read-only. OPERATOR ONLY (it exposes real account data).
      // Usage: SECURESPEND_SCAN            -> gather all reachable accounts + analyze
      //        SECURESPEND_SCAN RAW        -> just the gathered facts, no brain analysis
      if (!isOp) return { cmd: "SECURESPEND_SCAN", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const scRaw = /^RAW\b/i.test(rest.trim());
      const facts = { ts: new Date().toISOString(), sources: {} };

      // --- STRIPE: balance, recent charges, active subscriptions ---
      try {
        const sBal = await stripeRequest("/balance", "GET", null, env);
        const sCharges = await stripeRequest("/charges?limit=20", "GET", null, env);
        const sSubs = await stripeRequest("/subscriptions?limit=20&status=active", "GET", null, env);
        if (sBal.ok || sCharges.ok || sSubs.ok) {
          facts.sources.stripe = { ok: true };
          if (sBal.ok) {
            facts.sources.stripe.available = (sBal.data.available || []).map(b => ({ currency: b.currency, amount: b.amount / 100 }));
            facts.sources.stripe.pending = (sBal.data.pending || []).map(b => ({ currency: b.currency, amount: b.amount / 100 }));
          }
          if (sCharges.ok) {
            facts.sources.stripe.recent_charges = (sCharges.data.data || []).map(c => ({
              amount: c.amount / 100, currency: c.currency, desc: c.description || c.statement_descriptor || null,
              status: c.status, created: new Date(c.created * 1000).toISOString().slice(0, 10)
            }));
          }
          if (sSubs.ok) {
            facts.sources.stripe.active_subscriptions = (sSubs.data.data || []).map(s => {
              const item = s.items?.data?.[0];
              const price = item?.price;
              return {
                id: s.id, status: s.status,
                amount: price?.unit_amount ? price.unit_amount / 100 : null,
                currency: price?.currency || null,
                interval: price?.recurring?.interval || null,
                product: price?.nickname || item?.price?.product || null,
                current_period_end: s.current_period_end ? new Date(s.current_period_end * 1000).toISOString().slice(0, 10) : null
              };
            });
          }
        } else {
          facts.sources.stripe = { ok: false, error: sBal.error || sCharges.error || sSubs.error || "unreachable" };
        }
      } catch (e) { facts.sources.stripe = { ok: false, error: String(e.message) }; }

      // --- MERCURY: balance + recent transactions ---
      try {
        const mBal = await getMercuryBalance(env);
        if (mBal.ok) {
          facts.sources.mercury = { ok: true, total_available: mBal.total_available, accounts: mBal.accounts };
          try {
            const mTx = await getMercuryTransactions(env, null, 20);
            if (mTx.ok) facts.sources.mercury.recent_transactions = (mTx.transactions || []).map(t => ({
              amount: t.amount, desc: t.bankDescription || t.externalMemo || t.counterpartyName || null,
              status: t.status, date: (t.postedAt || t.createdAt || "").slice(0, 10)
            }));
          } catch {}
        } else {
          facts.sources.mercury = { ok: false, error: mBal.error || "unreachable" };
        }
      } catch (e) { facts.sources.mercury = { ok: false, error: String(e.message) }; }

      // --- TWILIO: balance + month-to-date usage (the $143 find, made repeatable) ---
      try {
        const tSid = await env.AURA_KV.get("secret:twilio_account_sid").catch(() => null);
        const tTok = await env.AURA_KV.get("secret:twilio_auth_token").catch(() => null);
        if (tSid && tTok) {
          const tAuth = "Basic " + btoa(tSid + ":" + tTok);
          const balRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tSid}/Balance.json`, { headers: { Authorization: tAuth } });
          const balData = await balRes.json().catch(() => ({}));
          const usageRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tSid}/Usage/Records/ThisMonth.json?Category=totalprice`, { headers: { Authorization: tAuth } }).catch(() => null);
          let mtd = null;
          if (usageRes && usageRes.ok) { const ud = await usageRes.json().catch(() => ({})); const rec = (ud.usage_records || [])[0]; if (rec) mtd = { price: rec.price, count: rec.count }; }
          // phone-number count = the recurring bleed driver
          const pnRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${tSid}/IncomingPhoneNumbers.json?PageSize=1`, { headers: { Authorization: tAuth } }).catch(() => null);
          let pnCount = null;
          if (pnRes && pnRes.ok) { const pd = await pnRes.json().catch(() => ({})); pnCount = pd.total ?? null; }
          facts.sources.twilio = { ok: true, balance: balData.balance || null, currency: balData.currency || "USD", month_to_date_spend: mtd, phone_number_count: pnCount };
        } else {
          facts.sources.twilio = { ok: false, error: "twilio creds missing" };
        }
      } catch (e) { facts.sources.twilio = { ok: false, error: String(e.message) }; }

      if (scRaw) return { cmd: "SECURESPEND_SCAN", payload: { ok: true, mode: "raw", facts } };

      // --- run the SecureSpend brain on the REAL gathered facts ---
      const scApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!scApiKey) return { cmd: "SECURESPEND_SCAN", payload: { ok: true, mode: "raw_no_brain", note: "brain not configured; returning facts only", facts } };
      const scModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      const scSystem = "You are SECURESPEND analyzing a REAL set of financial accounts (Stripe, Mercury bank, Twilio) belonging to the operator of a small business. You are given the actual gathered facts as JSON. OPERATOR CONTEXT you MUST factor in: this is a pre-funding, in-development venture (ARK Systems / Aura). Revenue is INTENTIONALLY off right now - the operator has deliberately chosen NOT to chase revenue until external funding lands (expected ~2 weeks out). The tiny Stripe charges are test transactions, not a failed sales effort. Much of the spend (e.g. Twilio numbers/A2P) is infrastructure the operator has consciously chosen to keep. So do NOT read a low balance or low revenue as a crisis or a failing business - it is a funded-soon R&D runway by design. Judge spend against INTENT and STRATEGY, not against a naive 'they're broke' reading. TONE - this is mandatory and matches the operator's entire product philosophy: be warm, constructive, encouraging, and forward-thinking, AND fully honest. NEVER alarmist, never catastrophizing, never 'business survival / freeze everything / unsustainable' language. But also NEVER hollow flattery - if something is genuinely a leak or a bad idea, say so plainly and kindly, because telling the truth is how you serve the human. Surface the real thing as 'here is the one item worth your attention,' not 'you are in danger.' Apply the money-lens: find recurring waste, idle/forgotten costs, anything quietly leaking money, anything worth protecting, and the highest-leverage move. Ground every finding in the real numbers - cite the actual amounts. If a source failed to load, note it as unchecked; do not speculate. Return ONLY a JSON object, no prose or fences, with keys: snapshot (one plain, calm sentence summarizing the real picture from the data, framed with the runway context in mind), findings (array of objects each with: severity high|medium|low, category recurring|idle|anomaly|protection|optimization, what (the real item with its actual amount), means (plain human terms), move (the recommended action, constructively phrased)), the_one_thing (the single highest-leverage move right now, tied to a real number, framed as an opportunity not an emergency), do_now (one concrete next step), watch_for (array), confidence high|medium|low, unchecked_sources (array). Be honest, specific to the numbers, and steady. Output JSON only.";
      try {
        const scData = await callAnthropic(scApiKey, { model: scModel, max_tokens: 2500, system: scSystem, messages: [{ role: "user", content: "Here are the real gathered account facts:\n" + JSON.stringify(facts, null, 2) }] });
        let scText = "";
        if (scData && scData.content) { for (const b of scData.content) { if (b.type === "text") scText += b.text; } }
        scText = scText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let scParsed = null;
        try { scParsed = JSON.parse(scText); } catch {}
        if (!scParsed) return { cmd: "SECURESPEND_SCAN", payload: { ok: true, mode: "facts_only", note: "brain returned non-JSON", facts, raw: scText.slice(0, 1000) } };
        // store the latest scan
        await env.AURA_KV.put("securespend:scan:latest", JSON.stringify({ ts: facts.ts, facts, analysis: scParsed })).catch(() => {});
        return { cmd: "SECURESPEND_SCAN", payload: { ok: true, mode: "analyzed", ts: facts.ts, facts, analysis: scParsed } };
      } catch (e) {
        return { cmd: "SECURESPEND_SCAN", payload: { ok: true, mode: "facts_only", note: "analysis failed: " + e.message, facts } };
      }
    }

    case "PLAID_LINK_TOKEN": {
      // Creates a link_token used to open Plaid Link (the bank-connect widget) on the site.
      // Usage: PLAID_LINK_TOKEN [user_id]   (user_id optional, defaults to a generated one)
      if (!isOp) return { cmd: "PLAID_LINK_TOKEN", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pcid = await env.AURA_KV.get("secret:plaid_client_id").catch(() => null);
      const psec = await env.AURA_KV.get("secret:plaid_secret").catch(() => null);
      const penv = (await env.AURA_KV.get("config:plaid:env").catch(() => null)) || "sandbox";
      if (!pcid || !psec) return { cmd: "PLAID_LINK_TOKEN", payload: { ok: false, error: "Plaid keys missing (secret:plaid_client_id / secret:plaid_secret)" } };
      const pbase = penv === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
      const puid = rest.trim() || ("user-" + Date.now());
      try {
        const r = await fetch(pbase + "/link/token/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: pcid, secret: psec,
            client_name: "SecureSpend",
            language: "en", country_codes: ["US"],
            user: { client_user_id: puid },
            products: ["transactions"]
          })
        });
        const d = await r.json();
        if (d.link_token) return { cmd: "PLAID_LINK_TOKEN", payload: { ok: true, env: penv, user_id: puid, link_token: d.link_token, expiration: d.expiration } };
        return { cmd: "PLAID_LINK_TOKEN", payload: { ok: false, error: d.error_message || d.error_code || "no link_token returned", detail: d } };
      } catch (e) { return { cmd: "PLAID_LINK_TOKEN", payload: { ok: false, error: String(e.message) } }; }
    }

    case "PLAID_SANDBOX_CONNECT": {
      // SANDBOX ONLY: creates a public_token WITHOUT the widget, then exchanges it for an
      // access_token and stores it - so we can prove the whole pipe from the terminal.
      // Usage: PLAID_SANDBOX_CONNECT [label]   (label tags the stored connection, default "aaron")
      if (!isOp) return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pcid = await env.AURA_KV.get("secret:plaid_client_id").catch(() => null);
      const psec = await env.AURA_KV.get("secret:plaid_secret").catch(() => null);
      const penv = (await env.AURA_KV.get("config:plaid:env").catch(() => null)) || "sandbox";
      if (penv !== "sandbox") return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: false, error: "PLAID_SANDBOX_CONNECT only works in sandbox env" } };
      if (!pcid || !psec) return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: false, error: "Plaid keys missing" } };
      const label = rest.trim() || "aaron";
      try {
        // 1. create a sandbox public_token with realistic dynamic transactions
        const pt = await fetch("https://sandbox.plaid.com/sandbox/public_token/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: pcid, secret: psec, institution_id: "ins_109508", initial_products: ["transactions"], options: { override_username: "user_transactions_dynamic", override_password: "pass_good" } })
        });
        const ptd = await pt.json();
        if (!ptd.public_token) return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: false, error: ptd.error_message || "no public_token", detail: ptd } };
        // 2. exchange for access_token
        const ex = await fetch("https://sandbox.plaid.com/item/public_token/exchange", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: pcid, secret: psec, public_token: ptd.public_token })
        });
        const exd = await ex.json();
        if (!exd.access_token) return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: false, error: exd.error_message || "no access_token", detail: exd } };
        // 3. store the connection
        const connKey = `plaid:conn:${label}`;
        await env.AURA_KV.put(connKey, JSON.stringify({ label, access_token: exd.access_token, item_id: exd.item_id, env: penv, created: new Date().toISOString() })).catch(() => {});
        return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: true, label, item_id: exd.item_id, stored_at: connKey, note: "Sandbox bank connected and access_token stored. Run PLAID_SYNC " + label } };
      } catch (e) { return { cmd: "PLAID_SANDBOX_CONNECT", payload: { ok: false, error: String(e.message) } }; }
    }

    case "PLAID_EXCHANGE": {
      // Exchanges a public_token (from the real Link widget) for an access_token and stores it.
      // Usage: PLAID_EXCHANGE <public_token> ::: <label>
      if (!isOp) return { cmd: "PLAID_EXCHANGE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pcid = await env.AURA_KV.get("secret:plaid_client_id").catch(() => null);
      const psec = await env.AURA_KV.get("secret:plaid_secret").catch(() => null);
      const penv = (await env.AURA_KV.get("config:plaid:env").catch(() => null)) || "sandbox";
      if (!pcid || !psec) return { cmd: "PLAID_EXCHANGE", payload: { ok: false, error: "Plaid keys missing" } };
      const pbase = penv === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
      const exParts = rest.split(":::").map(s => s.trim());
      const pubTok = exParts[0];
      const exLabel = exParts[1] || ("user-" + Date.now());
      if (!pubTok) return { cmd: "PLAID_EXCHANGE", payload: { ok: false, error: "Usage: PLAID_EXCHANGE <public_token> ::: <label>" } };
      try {
        const ex = await fetch(pbase + "/item/public_token/exchange", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: pcid, secret: psec, public_token: pubTok })
        });
        const exd = await ex.json();
        if (!exd.access_token) return { cmd: "PLAID_EXCHANGE", payload: { ok: false, error: exd.error_message || "no access_token", detail: exd } };
        const connKey = `plaid:conn:${exLabel}`;
        await env.AURA_KV.put(connKey, JSON.stringify({ label: exLabel, access_token: exd.access_token, item_id: exd.item_id, env: penv, created: new Date().toISOString() })).catch(() => {});
        return { cmd: "PLAID_EXCHANGE", payload: { ok: true, label: exLabel, item_id: exd.item_id, stored_at: connKey } };
      } catch (e) { return { cmd: "PLAID_EXCHANGE", payload: { ok: false, error: String(e.message) } }; }
    }

    case "PLAID_SYNC": {
      // Pulls transactions + balances for a stored connection.
      // Usage: PLAID_SYNC <label>   (RAW appended for full detail)
      if (!isOp) return { cmd: "PLAID_SYNC", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pcid = await env.AURA_KV.get("secret:plaid_client_id").catch(() => null);
      const psec = await env.AURA_KV.get("secret:plaid_secret").catch(() => null);
      const penv = (await env.AURA_KV.get("config:plaid:env").catch(() => null)) || "sandbox";
      const pbase = penv === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
      let syncArg = rest.trim(); let syncRaw = false;
      if (/\bRAW\b/i.test(syncArg)) { syncRaw = true; syncArg = syncArg.replace(/\bRAW\b/i, "").trim(); }
      const syncLabel = syncArg || "aaron";
      const connRec = await env.AURA_KV.get(`plaid:conn:${syncLabel}`).catch(() => null);
      if (!connRec) return { cmd: "PLAID_SYNC", payload: { ok: false, error: `No stored connection 'plaid:conn:${syncLabel}'. Run PLAID_SANDBOX_CONNECT ${syncLabel} first.` } };
      let access;
      try { access = JSON.parse(connRec).access_token; } catch { return { cmd: "PLAID_SYNC", payload: { ok: false, error: "stored connection unreadable" } }; }
      try {
        // balances
        const bal = await fetch(pbase + "/accounts/balance/get", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: pcid, secret: psec, access_token: access })
        });
        const bald = await bal.json();
        // transactions sync
        const sy = await fetch(pbase + "/transactions/sync", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: pcid, secret: psec, access_token: access, count: 100 })
        });
        const syd = await sy.json();
        if (syd.error_code && !syd.added) return { cmd: "PLAID_SYNC", payload: { ok: false, error: syd.error_message || syd.error_code, detail: syd } };
        const accounts = (bald.accounts || []).map(a => ({ name: a.name, type: a.type, subtype: a.subtype, available: a.balances?.available, current: a.balances?.current, currency: a.balances?.iso_currency_code }));
        const txns = (syd.added || []).map(t => ({ date: t.date, name: t.name, amount: t.amount, currency: t.iso_currency_code, category: (t.personal_finance_category?.primary || (t.category ? t.category[0] : null)), pending: t.pending, merchant: t.merchant_name || null }));
        const summary = { account_count: accounts.length, transaction_count: txns.length, has_more: syd.has_more };
        // store latest sync
        await env.AURA_KV.put(`plaid:sync:${syncLabel}`, JSON.stringify({ ts: new Date().toISOString(), accounts, txns })).catch(() => {});
        if (syncRaw) return { cmd: "PLAID_SYNC", payload: { ok: true, label: syncLabel, summary, accounts, transactions: txns } };
        return { cmd: "PLAID_SYNC", payload: { ok: true, label: syncLabel, summary, accounts, transactions_sample: txns.slice(0, 12) } };
      } catch (e) { return { cmd: "PLAID_SYNC", payload: { ok: false, error: String(e.message) } }; }
    }

    case "SECURESPEND_BANK": {
      // The loop closer: takes a Plaid-connected bank (by label), pulls its real
      // transactions + balances, and runs the SecureSpend money-lens on them - producing
      // the awareness output the site shows (recurring charges, forgotten subscriptions,
      // safe-to-spend, what matters). Reuses the stored sync + the SECURESPEND brain.
      // Usage: SECURESPEND_BANK <label>            (analyze; default label "aaron")
      //        SECURESPEND_BANK <label> RAW        (just the numbers, no brain)
      // Public-safe: callable by the site with a valid connection label.
      const pcid = await env.AURA_KV.get("secret:plaid_client_id").catch(() => null);
      const psec = await env.AURA_KV.get("secret:plaid_secret").catch(() => null);
      const penv = (await env.AURA_KV.get("config:plaid:env").catch(() => null)) || "sandbox";
      const pbase = penv === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
      let sbArg = rest.trim(); let sbRaw = false;
      if (/\bRAW\b/i.test(sbArg)) { sbRaw = true; sbArg = sbArg.replace(/\bRAW\b/i, "").trim(); }
      const sbLabel = sbArg || "aaron";
      const sbConn = await env.AURA_KV.get(`plaid:conn:${sbLabel}`).catch(() => null);
      if (!sbConn) return { cmd: "SECURESPEND_BANK", payload: { ok: false, error: `No connection 'plaid:conn:${sbLabel}'. Connect a bank first.` } };
      let sbAccess;
      try { sbAccess = JSON.parse(sbConn).access_token; } catch { return { cmd: "SECURESPEND_BANK", payload: { ok: false, error: "connection unreadable" } }; }
      // pull fresh balances + transactions
      let accounts = [], txns = [];
      try {
        const bal = await fetch(pbase + "/accounts/balance/get", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: pcid, secret: psec, access_token: sbAccess }) });
        const bald = await bal.json();
        accounts = (bald.accounts || []).map(a => ({ name: a.name, type: a.type, subtype: a.subtype, available: a.balances?.available, current: a.balances?.current, currency: a.balances?.iso_currency_code }));
        const sy = await fetch(pbase + "/transactions/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: pcid, secret: psec, access_token: sbAccess, count: 200 }) });
        const syd = await sy.json();
        txns = (syd.added || []).map(t => ({ date: t.date, name: t.merchant_name || t.name, amount: t.amount, category: (t.personal_finance_category?.primary || (t.category ? t.category[0] : null)), pending: t.pending }));
      } catch (e) { return { cmd: "SECURESPEND_BANK", payload: { ok: false, error: "plaid read failed: " + e.message } }; }

      // deterministic pre-analysis: detect likely recurring charges (same-ish amount + name repeats)
      const byMerchant = {};
      for (const t of txns) {
        if (t.amount <= 0) continue; // outflows only for subscription detection
        const key = (t.name || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").slice(0, 3).join(" ");
        (byMerchant[key] = byMerchant[key] || []).push(t);
      }
      const recurring = Object.entries(byMerchant)
        .filter(([k, arr]) => arr.length >= 2)
        .map(([k, arr]) => ({ merchant: arr[0].name, occurrences: arr.length, typical_amount: Math.round((arr.reduce((s, x) => s + x.amount, 0) / arr.length) * 100) / 100, category: arr[0].category }))
        .sort((a, b) => b.occurrences - a.occurrences).slice(0, 15);
      const totalOut = Math.round(txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) * 100) / 100;
      const totalIn = Math.round(Math.abs(txns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)) * 100) / 100;
      const facts = { label: sbLabel, env: penv, accounts, transaction_count: txns.length, total_outflow: totalOut, total_inflow: totalIn, likely_recurring: recurring };

      if (sbRaw) return { cmd: "SECURESPEND_BANK", payload: { ok: true, mode: "raw", facts } };

      const sbApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!sbApiKey) return { cmd: "SECURESPEND_BANK", payload: { ok: true, mode: "facts_only", facts, note: "brain not configured" } };
      const sbModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      const sbSystem = "You are SECURESPEND, the financial-awareness layer of Aura, analyzing a person's REAL connected bank account. You are given their actual accounts, balances, recent transactions, and a deterministic list of likely-recurring charges. Give them calm, clear awareness of their own money. You SERVE THE HUMAN: warm, encouraging, honest, never alarmist, never moralizing, never a budget cop, never hollow flattery - if something is genuinely a forgotten or wasteful charge, say so kindly and plainly. Produce the awareness a great financial wallet would. Return ONLY a JSON object, no prose or fences, with keys: greeting (one short warm line), snapshot (one plain sentence on where their money stands using real balances), safe_to_spend (your read of what is comfortably spendable now given balances and upcoming patterns, with a brief why), recurring (array of objects: merchant, typical_amount, cadence_guess, status one of 'active-valued'|'review'|'likely-forgotten', note), forgotten_or_waste (array of specific charges that look forgotten/unused/duplicate, each with merchant, amount, why), top_wins (array of 1-3 concrete opportunities to save or recover money, each with a real number where possible), the_one_thing (the single most useful money move right now), watch_for (array - upcoming or easy-to-miss items), confidence high|medium|low. Ground everything in the real numbers provided. Output JSON only.";
      try {
        const sbData = await callAnthropic(sbApiKey, { model: sbModel, max_tokens: 2500, system: sbSystem, messages: [{ role: "user", content: "Real connected account data:\n" + JSON.stringify(facts, null, 2) }] });
        let sbText = ""; if (sbData && sbData.content) { for (const b of sbData.content) { if (b.type === "text") sbText += b.text; } }
        sbText = sbText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        let sbParsed = null; try { sbParsed = JSON.parse(sbText); } catch {}
        if (!sbParsed) return { cmd: "SECURESPEND_BANK", payload: { ok: true, mode: "facts_only", facts, raw: sbText.slice(0, 800) } };
        await env.AURA_KV.put(`securespend:bank:${sbLabel}`, JSON.stringify({ ts: new Date().toISOString(), facts, analysis: sbParsed })).catch(() => {});
        return { cmd: "SECURESPEND_BANK", payload: { ok: true, mode: "analyzed", label: sbLabel, facts, analysis: sbParsed } };
      } catch (e) { return { cmd: "SECURESPEND_BANK", payload: { ok: true, mode: "facts_only", facts, note: "analysis failed: " + e.message } }; }
    }

    case "TAX_RATES": {
      // THE RATE TABLE — data, not logic. The engine (SECURESPEND_CHARGE) knows HOW to apply a
      // rate; this is WHERE the rates live: in KV, outside the logic, swappable, feedable from a
      // live tax-data source later (same pull-from-source pattern as places/stocks/credit). A rate
      // entry: { jurisdiction, name, rate, kind('sales'|'vat'|'gst'), country, region, remit_to }.
      // Stored at tax:rate:<KEY> where KEY is uppercased jurisdiction (e.g. US-CA, GB, DE).
      // TAX_RATES SET <KEY> {json}     -> upsert one rate
      // TAX_RATES SEED                 -> load a small starter set (US states sample + a few VAT)
      // TAX_RATES GET <KEY>
      // TAX_RATES LIST
      if (!isOp) return { cmd: "TAX_RATES", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const trSub = (args[0] || "").toUpperCase();

      if (trSub === "SET") {
        const key = (args[1] || "").toUpperCase();
        if (!key) return { cmd: "TAX_RATES", payload: { ok: false, error: "Usage: TAX_RATES SET <KEY> {json}" } };
        const jsonStr = rest.slice(rest.toUpperCase().indexOf(key) + key.length).trim();
        let entry; try { entry = JSON.parse(jsonStr); } catch { return { cmd: "TAX_RATES", payload: { ok: false, error: "Invalid JSON for rate entry" } }; }
        entry.jurisdiction = entry.jurisdiction || key;
        entry.updated_at = new Date().toISOString();
        await env.AURA_KV.put(`tax:rate:${key}`, JSON.stringify(entry)).catch(() => {});
        return { cmd: "TAX_RATES", payload: { ok: true, key, entry } };
      }

      if (trSub === "GET") {
        const key = (args[1] || "").toUpperCase();
        if (!key) return { cmd: "TAX_RATES", payload: { ok: false, error: "Usage: TAX_RATES GET <KEY>" } };
        let e = null; try { const r = await env.AURA_KV.get(`tax:rate:${key}`); if (r) e = JSON.parse(r); } catch {}
        return { cmd: "TAX_RATES", payload: { ok: true, key, entry: e } };
      }

      if (trSub === "LIST") {
        const list = await env.AURA_KV.list({ prefix: "tax:rate:", limit: 1000 });
        const entries = [];
        for (const k of (list.keys || [])) { try { const r = await env.AURA_KV.get(k.name); if (r) entries.push(JSON.parse(r)); } catch {} }
        return { cmd: "TAX_RATES", payload: { ok: true, count: entries.length, rates: entries } };
      }

      if (trSub === "SEED") {
        // a SMALL starter set to prove the table - NOT the planet, just enough to demonstrate.
        // Real rates come from a feed/source later. These are illustrative samples.
        const seed = {
          "US-CA": { jurisdiction: "US-CA", name: "California Sales Tax", rate: 0.0725, kind: "sales", country: "US", region: "CA", remit_to: "California" },
          "US-TX": { jurisdiction: "US-TX", name: "Texas Sales Tax", rate: 0.0625, kind: "sales", country: "US", region: "TX", remit_to: "Texas" },
          "US-NY": { jurisdiction: "US-NY", name: "New York Sales Tax", rate: 0.04, kind: "sales", country: "US", region: "NY", remit_to: "New York" },
          "US-OR": { jurisdiction: "US-OR", name: "Oregon (no sales tax)", rate: 0.0, kind: "sales", country: "US", region: "OR", remit_to: "Oregon" },
          "GB": { jurisdiction: "GB", name: "UK VAT", rate: 0.20, kind: "vat", country: "GB", region: null, remit_to: "HMRC" },
          "DE": { jurisdiction: "DE", name: "Germany VAT", rate: 0.19, kind: "vat", country: "DE", region: null, remit_to: "Germany" }
        };
        const now = new Date().toISOString();
        let n = 0;
        for (const [k, v] of Object.entries(seed)) { v.updated_at = now; await env.AURA_KV.put(`tax:rate:${k}`, JSON.stringify(v)).catch(() => {}); n++; }
        return { cmd: "TAX_RATES", payload: { ok: true, seeded: n, keys: Object.keys(seed) } };
      }

      return { cmd: "TAX_RATES", payload: { ok: false, error: "Sub-commands: SET, GET, LIST, SEED" } };
    }

    case "SECURESPEND_CHARGE": {
      // The transaction layer of the world. A payment flows INTO SecureSpend, attaches to a
      // PTA identity, passes the bare amount to the rail (Stripe) in live mode or simulates
      // in test mode, ingests the FULL rail response, and stores both sides in-world.
      // Usage (JSON arg):
      //   SECURESPEND_CHARGE {"asset":"mytattoo.world","amount":40.00,"currency":"usd",
      //      "item":"Custom tattoo design","buyer":{"name":"Jane","identity":"email:jane@x.com"},
      //      "mode":"test","context":{...},"return_to":"https://mytattoo.world/thanks"}
      // mode defaults to "test" (full flow, no real charge). "live" calls Stripe.
      if (!isOp) return { cmd: "SECURESPEND_CHARGE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      let scIn;
      try { scIn = JSON.parse(rest.trim()); } catch { return { cmd: "SECURESPEND_CHARGE", payload: { ok: false, error: "Usage: SECURESPEND_CHARGE <json> with asset, amount, item, buyer{name,identity}, mode(test|live), context, return_to" } }; }
      if (!scIn.asset || (scIn.amount == null && scIn.subtotal == null)) return { cmd: "SECURESPEND_CHARGE", payload: { ok: false, error: "asset and (subtotal or amount) are required" } };
      const scMode = (scIn.mode || "test").toLowerCase();
      const scCur = (scIn.currency || "usd").toLowerCase();

      // ── THE UNIVERSAL TRANSACTION GRAMMAR ──────────────────────────────────────────
      // Every transaction anywhere on Earth has the same shape:
      //   subtotal + [taxes] + [fees-charged-to-buyer] = total  (all in integer MINOR UNITS)
      // The ENGINE here is generic: it applies whatever taxes/fees it is GIVEN. It does NOT
      // know any jurisdiction's rate - rates/rules are DATA passed in (from a rate table / feed),
      // exactly how Stripe/Avalara separate the calc engine from the rate database. A "tax" is
      // {name, jurisdiction, rate, amount, remit_to}; a "fee" is {name, rate|amount, payer, to}.
      // Money is integer minor units (cents/pence/yen) - never floats - with a currency.
      const minor = (v) => Math.round(Number(v) * 100);        // dollars->cents (USD-like; 2dp)
      const fromMinor = (c) => Math.round(c) / 100;
      const subtotalMinor = minor(scIn.subtotal != null ? scIn.subtotal : scIn.amount);

      // taxes: caller passes an array of {name, jurisdiction, rate, remit_to} OR {..., amount}
      // OR passes tax_jurisdiction (e.g. "US-CA") and the engine LOOKS UP the rate from the table
      // (data). This is the auto path: jurisdiction in -> rate resolved from tax:rate:<KEY> -> tax
      // applied via the same grammar. The lookup is generic; the rate is data.
      let taxesIn = Array.isArray(scIn.taxes) ? scIn.taxes : [];
      if (taxesIn.length === 0 && scIn.tax_jurisdiction) {
        try {
          const jk = String(scIn.tax_jurisdiction).toUpperCase();
          const rr = await env.AURA_KV.get(`tax:rate:${jk}`);
          if (rr) {
            const rEntry = JSON.parse(rr);
            taxesIn = [{ name: rEntry.name || (jk + " Tax"), jurisdiction: rEntry.jurisdiction || jk, rate: rEntry.rate, remit_to: rEntry.remit_to || rEntry.jurisdiction || jk }];
          }
        } catch {}
      }
      const taxes = taxesIn.map(t => {
        const amt = (t.amount != null) ? minor(t.amount) : Math.round(subtotalMinor * (Number(t.rate) || 0));
        return { name: t.name || "Tax", jurisdiction: t.jurisdiction || null, rate: t.rate != null ? Number(t.rate) : null, amount_minor: amt, remit_to: t.remit_to || t.jurisdiction || null };
      });
      const taxTotalMinor = taxes.reduce((s, t) => s + t.amount_minor, 0);

      // fees: {name, rate|amount, payer('buyer'|'merchant'|'platform'), to}. Only buyer-paid fees
      // add to the total the buyer is charged; merchant/platform fees are recorded for the split
      // (payout math) but do NOT inflate the buyer's total.
      const feesIn = Array.isArray(scIn.fees) ? scIn.fees : [];
      const fees = feesIn.map(f => {
        const amt = (f.amount != null) ? minor(f.amount) : Math.round(subtotalMinor * (Number(f.rate) || 0));
        return { name: f.name || "Fee", rate: f.rate != null ? Number(f.rate) : null, amount_minor: amt, payer: f.payer || "merchant", to: f.to || "platform" };
      });
      const buyerFeesMinor = fees.filter(f => f.payer === "buyer").reduce((s, f) => s + f.amount_minor, 0);

      // the buyer's total = subtotal + taxes + buyer-paid fees
      const totalMinor = subtotalMinor + taxTotalMinor + buyerFeesMinor;
      const breakdown = {
        currency: scCur,
        subtotal_minor: subtotalMinor,
        taxes, tax_total_minor: taxTotalMinor,
        fees,
        total_minor: totalMinor,
        // human-readable mirror (major units) for convenience/back-compat
        subtotal: fromMinor(subtotalMinor), tax_total: fromMinor(taxTotalMinor), total: fromMinor(totalMinor)
      };
      // ───────────────────────────────────────────────────────────────────────────────

      const scAmt = fromMinor(totalMinor); // the charged total (back-compat: 'amount' = total)
      const scCents = totalMinor;
      const txnId = "ss_txn_" + Array.from(crypto.getRandomValues(new Uint8Array(10))).map(b => b.toString(16).padStart(2, "0")).join("");
      const now = new Date().toISOString();

      // 1. Resolve buyer to a PTA identity (everyone is PTA'd from first touch)
      let ptaEntityId = null, ptaMode = null;
      if (scIn.buyer && (scIn.buyer.identity || scIn.buyer.name)) {
        const bName = (scIn.buyer.name || "Customer").replace(/[\n\r]/g, " ");
        const bId = scIn.buyer.identity ? (" identity:" + scIn.buyer.identity) : "";
        try {
          const pr = await processCommand(`PTA_ENTITY CREATE person ${bName}${bId}`, env, true);
          const pp = pr && pr.payload ? pr.payload : pr;
          if (pp && pp.ok && pp.entity) { ptaEntityId = pp.entity.id; ptaMode = pp.mode; }
        } catch (e) { /* identity resolution best-effort; transaction still records */ }
      }

      // 2. Run the money step
      let rail = null, status = null, railOk = false;
      if (scMode === "live") {
        try {
          const desc = (scIn.item || "SecureSpend purchase") + " — " + scIn.asset;
          const meta = { secure_spend_txn: txnId, asset: scIn.asset, pta_entity: ptaEntityId || "" };
          const pi = await createPaymentIntent(scCents, scCur, desc, meta, env);
          rail = pi && pi.payload ? pi.payload : pi;
          railOk = !!(rail && (rail.id || rail.client_secret));
          status = railOk ? (rail.status || "requires_payment_method") : "rail_error";
        } catch (e) { rail = { error: String(e.message) }; status = "rail_error"; railOk = false; }
      } else {
        // TEST MODE: simulate the full rail response shape (no real charge), identical record shape
        rail = {
          simulated: true, id: "pi_test_" + txnId.slice(-12), object: "payment_intent",
          amount: scCents, currency: scCur, status: "succeeded",
          charges: { data: [{ id: "ch_test_" + txnId.slice(-12), paid: true, amount: scCents, currency: scCur,
            payment_method_details: { card: { brand: "visa", last4: "4242", network: "visa" } },
            receipt_url: "https://securespend.world/receipt/" + txnId, outcome: { network_status: "approved_by_network", risk_level: "normal" } }] },
          created: Math.floor(Date.now() / 1000)
        };
        railOk = true; status = "succeeded";
      }

      // 3. Build the in-world transaction record — ingest BOTH sides, keep everything
      const record = {
        txn_id: txnId, ts: now, asset: scIn.asset, mode: scMode, status,
        amount: scAmt, currency: scCur,                    // amount = total (back-compat)
        breakdown,                                          // the universal grammar: subtotal/taxes/fees/total
        item: scIn.item || null, line_items: scIn.line_items || null,
        buyer: scIn.buyer || null, pta_entity: ptaEntityId, pta_mode: ptaMode,
        context: scIn.context || null, return_to: scIn.return_to || null,
        rail_name: "stripe", rail_response: rail
      };

      // 4. Store in the ledger (KV record + index by asset and by pta entity)
      await env.AURA_KV.put(`ss:txn:${txnId}`, JSON.stringify(record)).catch(() => {});
      // lightweight indexes for LEDGER queries
      const idxAsset = `ss:idx:asset:${scIn.asset}:${now}:${txnId}`;
      await env.AURA_KV.put(idxAsset, txnId).catch(() => {});
      if (ptaEntityId) await env.AURA_KV.put(`ss:idx:pta:${ptaEntityId}:${now}:${txnId}`, txnId).catch(() => {});

      // 5. Return result to the calling asset
      return { cmd: "SECURESPEND_CHARGE", payload: {
        ok: railOk, txn_id: txnId, mode: scMode, status, amount: scAmt, currency: scCur,
        breakdown,
        asset: scIn.asset, pta_entity: ptaEntityId, pta_mode: ptaMode,
        receipt_url: (rail && rail.charges && rail.charges.data && rail.charges.data[0] && rail.charges.data[0].receipt_url) || null,
        client_secret: (scMode === "live" && rail) ? (rail.client_secret || null) : null,
        return_to: scIn.return_to || null,
        powered_by: "SecureSpend"
      } };
    }

    case "SECURESPEND_TXN": {
      // Read any transaction, full detail, both sides. Usage: SECURESPEND_TXN <txn_id>
      if (!isOp) return { cmd: "SECURESPEND_TXN", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const tid = rest.trim();
      if (!tid) return { cmd: "SECURESPEND_TXN", payload: { ok: false, error: "Usage: SECURESPEND_TXN <txn_id>" } };
      const rec = await env.AURA_KV.get(`ss:txn:${tid}`).catch(() => null);
      if (!rec) return { cmd: "SECURESPEND_TXN", payload: { ok: false, error: "Transaction not found: " + tid } };
      return { cmd: "SECURESPEND_TXN", payload: { ok: true, transaction: JSON.parse(rec) } };
    }

    case "SECURESPEND_LEDGER": {
      // Query economic activity. Usage:
      //   SECURESPEND_LEDGER ASSET <asset>      -> all txns for an asset
      //   SECURESPEND_LEDGER PTA <pta_entity>   -> all txns for a person across the whole world
      //   SECURESPEND_LEDGER ALL [limit]        -> recent txns
      if (!isOp) return { cmd: "SECURESPEND_LEDGER", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const lSub = (args[0] || "ALL").toUpperCase();
      const lId = rest.slice(rest.toUpperCase().indexOf(lSub) + lSub.length).trim();
      let prefix, limit = 50;
      if (lSub === "ASSET") prefix = `ss:idx:asset:${lId}:`;
      else if (lSub === "PTA") prefix = `ss:idx:pta:${lId}:`;
      else { prefix = "ss:idx:asset:"; limit = parseInt(args[1]) || 50; }
      try {
        const list = await env.AURA_KV.list({ prefix, limit: 1000 });
        const keys = (list.keys || []).map(k => k.name).sort().reverse().slice(0, limit);
        const txns = [];
        let totalCents = 0;
        for (const k of keys) {
          const tid = await env.AURA_KV.get(k).catch(() => null);
          if (!tid) continue;
          const rec = await env.AURA_KV.get(`ss:txn:${tid}`).catch(() => null);
          if (!rec) continue;
          const r = JSON.parse(rec);
          totalCents += Math.round((r.amount || 0) * 100);
          txns.push({ txn_id: r.txn_id, ts: r.ts, asset: r.asset, amount: r.amount, currency: r.currency, status: r.status, mode: r.mode, item: r.item, pta_entity: r.pta_entity, buyer: r.buyer ? (r.buyer.name || null) : null });
        }
        return { cmd: "SECURESPEND_LEDGER", payload: { ok: true, query: lSub, count: txns.length, total_amount: Math.round(totalCents) / 100, transactions: txns } };
      } catch (e) { return { cmd: "SECURESPEND_LEDGER", payload: { ok: false, error: String(e.message) } }; }
    }

    case "SECURESPEND_STATS": {
      // The STATISTICS layer for the commerce surface. Aggregates the ledger into real numbers a
      // dashboard shows - revenue, counts, trends, top buyers/assets. Scoped three ways:
      //   SECURESPEND_STATS ASSET <asset>   -> a business owner's view of THEIR money
      //   SECURESPEND_STATS PTA <pta>        -> a customer's view of THEIR purchases across the world
      //   SECURESPEND_STATS ALL              -> the platform (global) view
      // Read-only aggregation of ss:txn records. Money may be test or live; both counted, mode shown.
      if (!isOp) return { cmd: "SECURESPEND_STATS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const stSub = (args[0] || "ALL").toUpperCase();
      // the id is EVERYTHING after the sub-command word (asset names can contain spaces)
      const stId = rest.slice(rest.toUpperCase().indexOf(stSub) + stSub.length).trim();
      let stPrefix;
      if (stSub === "ASSET") stPrefix = `ss:idx:asset:${stId}:`;
      else if (stSub === "PTA") stPrefix = `ss:idx:pta:${stId}:`;
      else stPrefix = "ss:idx:asset:";
      try {
        const list = await env.AURA_KV.list({ prefix: stPrefix, limit: 1000 });
        const keys = (list.keys || []).map(k => k.name).sort().reverse();
        const recs = [];
        for (const k of keys) {
          const tid = await env.AURA_KV.get(k).catch(() => null); if (!tid) continue;
          const rec = await env.AURA_KV.get(`ss:txn:${tid}`).catch(() => null); if (!rec) continue;
          try { recs.push(JSON.parse(rec)); } catch {}
        }
        // aggregate
        const now = Date.now();
        const DAY = 86400000;
        let total = 0, count = 0, live = 0, test = 0;
        const byDay = {}; const byAsset = {}; const byBuyer = {}; const byMonth = {};
        let today = 0, week = 0, month = 0;
        for (const r of recs) {
          const amt = Number(r.amount) || 0;
          total += amt; count++;
          if (r.mode === "live") live += amt; else test += amt;
          const t = new Date(r.ts).getTime();
          if (now - t < DAY) today += amt;
          if (now - t < 7 * DAY) week += amt;
          if (now - t < 30 * DAY) month += amt;
          const dayKey = (r.ts || "").slice(0, 10); if (dayKey) byDay[dayKey] = (byDay[dayKey] || 0) + amt;
          const monKey = (r.ts || "").slice(0, 7); if (monKey) byMonth[monKey] = (byMonth[monKey] || 0) + amt;
          if (r.asset) byAsset[r.asset] = (byAsset[r.asset] || 0) + amt;
          const b = r.buyer ? (r.buyer.name || r.pta_entity) : r.pta_entity; if (b) byBuyer[b] = (byBuyer[b] || 0) + amt;
        }
        const round = (n) => Math.round(n * 100) / 100;
        const topList = (obj) => Object.entries(obj).map(([k, v]) => ({ name: k, amount: round(v) })).sort((a, b) => b.amount - a.amount).slice(0, 10);
        // last 14 days as an ordered series for charting
        const series = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now - i * DAY).toISOString().slice(0, 10);
          series.push({ date: d, amount: round(byDay[d] || 0) });
        }
        return { cmd: "SECURESPEND_STATS", payload: {
          ok: true, scope: stSub, scope_id: stId || null,
          total_revenue: round(total), transaction_count: count,
          avg_ticket: count ? round(total / count) : 0,
          today: round(today), this_week: round(week), this_month: round(month),
          live_total: round(live), test_total: round(test),
          unique_buyers: Object.keys(byBuyer).length,
          unique_assets: Object.keys(byAsset).length,
          daily_series_14d: series,
          top_assets: topList(byAsset),
          top_buyers: topList(byBuyer),
          by_month: Object.entries(byMonth).map(([k, v]) => ({ month: k, amount: round(v) })).sort((a, b) => a.month.localeCompare(b.month))
        } };
      } catch (e) { return { cmd: "SECURESPEND_STATS", payload: { ok: false, error: String(e.message) } }; }
    }

    case "PROFILE_SET": {
      // GENERIC onboarding/profile engine - reusable by ANY site, not site-specific.
      // Attaches arbitrary profile data to a PTA identity under a namespace (the asset/app).
      // Replaces site-specific signups. A veteran's record, a trader's settings, a client's
      // prefs - all the same engine, different namespace + fields.
      // Usage (JSON): PROFILE_SET {"app":"<your_app>","name":"...","identity":"email:...","fields":{...}}
      if (!isOp) return { cmd: "PROFILE_SET", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let prIn;
      try { prIn = JSON.parse(rest.trim()); } catch { return { cmd: "PROFILE_SET", payload: { ok: false, error: 'Usage: PROFILE_SET {"app","name","identity","fields":{}}' } }; }
      if (!prIn.app || !prIn.identity || !prIn.name) return { cmd: "PROFILE_SET", payload: { ok: false, error: "app, name, identity required" } };
      // resolve/create the PTA identity (everyone is PTA'd from first touch, auto-dedup)
      let prEntity = null, prMode = null;
      try {
        const r = await processCommand(`PTA_ENTITY CREATE person ${prIn.name.replace(/[\n\r]/g, " ")} identity:${prIn.identity}`, env, true);
        const pp = r && r.payload ? r.payload : r;
        if (pp && pp.ok && pp.entity) { prEntity = pp.entity.id; prMode = pp.mode; }
      } catch (e) { return { cmd: "PROFILE_SET", payload: { ok: false, error: "PTA resolve failed: " + e.message } }; }
      if (!prEntity) return { cmd: "PROFILE_SET", payload: { ok: false, error: "could not resolve identity" } };
      // store profile namespaced by app + entity, merging into any existing profile
      const prKey = `profile:${prIn.app}:${prEntity}`;
      let existing = {};
      try { const ex = await env.AURA_KV.get(prKey); if (ex) existing = JSON.parse(ex); } catch {}
      const profile = { ...existing, app: prIn.app, pta_entity: prEntity, name: prIn.name, identity: prIn.identity, fields: { ...(existing.fields || {}), ...(prIn.fields || {}) }, updated: new Date().toISOString() };
      if (!existing.created) profile.created = profile.updated;
      await env.AURA_KV.put(prKey, JSON.stringify(profile)).catch(() => {});
      await env.AURA_KV.put(`profile:idx:${prIn.app}:${prEntity}`, prEntity).catch(() => {});
      return { cmd: "PROFILE_SET", payload: { ok: true, app: prIn.app, pta_entity: prEntity, pta_mode: prMode, profile } };
    }

    case "PROFILE_GET": {
      // Usage: PROFILE_GET <app> <pta_entity>
      if (!isOp) return { cmd: "PROFILE_GET", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pgApp = args[0], pgEntity = args[1];
      if (!pgApp || !pgEntity) return { cmd: "PROFILE_GET", payload: { ok: false, error: "Usage: PROFILE_GET <app> <pta_entity>" } };
      const rec = await env.AURA_KV.get(`profile:${pgApp}:${pgEntity}`).catch(() => null);
      if (!rec) return { cmd: "PROFILE_GET", payload: { ok: false, error: "no profile" } };
      return { cmd: "PROFILE_GET", payload: { ok: true, profile: JSON.parse(rec) } };
    }

    case "PRESENCE_POST": {
      // GENERIC content/feed engine - reusable by ANY site. An entity posts content into a
      // feed scoped to an app + a target (a person, a group, a unit). Family photos, trader
      // notes, tattoo portfolio, home-screen activity - same engine.
      // Usage (JSON): PRESENCE_POST {"app":"<your_app>","feed":"<pta_entity or group id>","author":"<pta_entity>","type":"text|image|voice","content":"...","media_url":"..."}
      if (!isOp) return { cmd: "PRESENCE_POST", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let psIn;
      try { psIn = JSON.parse(rest.trim()); } catch { return { cmd: "PRESENCE_POST", payload: { ok: false, error: 'Usage: PRESENCE_POST {"app","feed","author","type","content","media_url"}' } }; }
      if (!psIn.app || !psIn.feed || !psIn.type) return { cmd: "PRESENCE_POST", payload: { ok: false, error: "app, feed, type required" } };
      const postId = "post_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      const now = new Date().toISOString();
      const post = { post_id: postId, app: psIn.app, feed: psIn.feed, author: psIn.author || null, type: psIn.type, content: psIn.content || null, media_url: psIn.media_url || null, ts: now };
      // store post + index into the feed (sortable by time)
      await env.AURA_KV.put(`presence:post:${postId}`, JSON.stringify(post)).catch(() => {});
      await env.AURA_KV.put(`presence:feed:${psIn.app}:${psIn.feed}:${now}:${postId}`, postId).catch(() => {});
      return { cmd: "PRESENCE_POST", payload: { ok: true, post_id: postId, app: psIn.app, feed: psIn.feed, ts: now } };
    }

    case "PRESENCE_FEED": {
      // Read a feed. Usage: PRESENCE_FEED <app> <feed> [limit]
      if (!isOp) return { cmd: "PRESENCE_FEED", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const pfApp = args[0], pfFeed = args[1];
      const pfLimit = parseInt(args[2]) || 30;
      if (!pfApp || !pfFeed) return { cmd: "PRESENCE_FEED", payload: { ok: false, error: "Usage: PRESENCE_FEED <app> <feed> [limit]" } };
      try {
        const list = await env.AURA_KV.list({ prefix: `presence:feed:${pfApp}:${pfFeed}:`, limit: 1000 });
        const keys = (list.keys || []).map(k => k.name).sort().reverse().slice(0, pfLimit);
        const posts = [];
        for (const k of keys) {
          const pid = await env.AURA_KV.get(k).catch(() => null);
          if (!pid) continue;
          const rec = await env.AURA_KV.get(`presence:post:${pid}`).catch(() => null);
          if (rec) posts.push(JSON.parse(rec));
        }
        return { cmd: "PRESENCE_FEED", payload: { ok: true, app: pfApp, feed: pfFeed, count: posts.length, posts } };
      } catch (e) { return { cmd: "PRESENCE_FEED", payload: { ok: false, error: String(e.message) } }; }
    }

    case "CIRCLE": {
      // GENERIC trust-circle engine - reusable by ANY app. A person's grouped people
      // (family/brotherhood/support/crisis or any tiers), namespaced by app, on PTA identity.
      // Usage:
      //   CIRCLE ADD <app> <pta_entity> {"name","identity","relationship","tier"}
      //   CIRCLE LIST <app> <pta_entity>
      if (!isOp) return { cmd: "CIRCLE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const ciSub = (args[0] || "").toUpperCase();
      const ciApp = args[1] || "";
      const ciEntity = args[2] || "";
      if (!ciApp || !ciEntity) return { cmd: "CIRCLE", payload: { ok: false, error: "Usage: CIRCLE ADD|LIST <app> <pta_entity> [json]" } };
      const ciKey = `circle:${ciApp}:${ciEntity}`;
      let circle = [];
      try { const ex = await env.AURA_KV.get(ciKey); if (ex) circle = JSON.parse(ex); } catch {}
      if (!Array.isArray(circle)) circle = [];
      if (ciSub === "ADD") {
        const jStart = rest.indexOf("{");
        if (jStart < 0) return { cmd: "CIRCLE", payload: { ok: false, error: 'Provide {"name","identity","relationship","tier"}' } };
        let m; try { m = JSON.parse(rest.slice(jStart)); } catch { return { cmd: "CIRCLE", payload: { ok: false, error: "Invalid JSON" } }; }
        if (!m.name || !m.tier) return { cmd: "CIRCLE", payload: { ok: false, error: "name and tier required" } };
        let memberId = null, memberMode = null;
        if (m.identity) {
          try {
            const pr = await processCommand(`PTA_ENTITY CREATE person ${m.name.replace(/[\n\r]/g, " ")} identity:${m.identity}`, env, true);
            const pp = pr && pr.payload ? pr.payload : pr;
            if (pp && pp.ok && pp.entity) { memberId = pp.entity.id; memberMode = pp.mode; }
          } catch (e) {}
        }
        // BIRTH-THROUGH-RELATIONSHIP: a PTA created via a relationship must be born KNOWING that
        // relationship and its origin - not as an orphan. Only stamp origin on a NEWLY created PTA.
        if (memberId) {
          // (2) write the relationship edge both ways into the graph
          try {
            const edgeCtx = JSON.stringify({ edge_type: "relationship", relationship: m.relationship || m.tier, permission: "family", impact: "trust_circle" });
            await processCommand(`PTA_GRANT ${ciEntity} ${memberId} ${edgeCtx}`, env, true);
          } catch (e) {}
          // (3) stamp ORIGIN CONTEXT onto the member - only if newly created (don't overwrite an existing person's story)
          if (memberMode === "created") {
            try {
              const ent = await env.AURA_MEMORY.prepare("SELECT metadata FROM pta_entities WHERE id = ?").bind(memberId).first();
              let meta = {}; if (ent && ent.metadata) { try { meta = JSON.parse(ent.metadata); } catch {} }
              meta.origin = ciApp;
              meta.created_by = ciEntity;
              meta.reason = `Added to ${ciApp} ${m.tier} circle as ${m.relationship || "a connection"}`;
              meta.born_dormant = true; // exists, but her own doorway opens when SHE approaches
              await env.AURA_MEMORY.prepare("UPDATE pta_entities SET metadata = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(meta), new Date().toISOString(), memberId).run();
            } catch (e) {}
            // born dormant - identity exists, but active doorway opens on her own approach
            try { await env.AURA_KV.put(`pta:state:${memberId}`, "dormant").catch(() => {}); } catch {}
            // first chapter of HER timeline: how she came to be
            try {
              const ts = new Date().toISOString();
              const chapter = [{ ts, event: `Created by ${ciEntity} as ${m.relationship || "a connection"} via ${ciApp}`, kind: "genesis_relationship" }];
              await env.AURA_KV.put(`pta:timeline:${memberId}`, JSON.stringify(chapter)).catch(() => {});
            } catch {}
          }
        }
        circle.push({ name: m.name, identity: m.identity || null, member_pta: memberId, relationship: m.relationship || null, tier: m.tier, added: new Date().toISOString() });
        await env.AURA_KV.put(ciKey, JSON.stringify(circle)).catch(() => {});
        return { cmd: "CIRCLE", payload: { ok: true, app: ciApp, member: m.name, tier: m.tier, member_pta: memberId, member_mode: memberMode, born_dormant: memberMode === "created", circle_size: circle.length } };
      }
      if (ciSub === "LIST") {
        const tiers = {};
        for (const c of circle) { (tiers[c.tier] = tiers[c.tier] || []).push(c); }
        return { cmd: "CIRCLE", payload: { ok: true, app: ciApp, pta_entity: ciEntity, count: circle.length, tiers } };
      }
      return { cmd: "CIRCLE", payload: { ok: false, error: "Use ADD or LIST" } };
    }

    case "SAFETY_ESCALATE": {
      // GENERIC safety floor engine - reusable by ANY app where a person could be at risk.
      // Routes to the person's crisis/support circle AND always returns real human crisis
      // resources. Never silent, always logged. Aura is never the sole safety net.
      // Usage (JSON): SAFETY_ESCALATE {"app":"...","pta_entity":"...","resources_region":"US"}
      if (!isOp) return { cmd: "SAFETY_ESCALATE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let seIn = {};
      try { seIn = JSON.parse(rest.trim()); } catch {}
      const seApp = seIn.app || "unknown";
      const seEntity = seIn.pta_entity || "anonymous";
      const escId = "esc_" + Date.now();
      let notify = [];
      try {
        const cr = await processCommand(`CIRCLE LIST ${seApp} ${seEntity}`, env, true);
        const cp = cr && cr.payload ? cr.payload : cr;
        if (cp && cp.tiers) { notify = [].concat(cp.tiers.crisis || [], cp.tiers.family || [], cp.tiers.support || []); }
      } catch (e) {}
      const resources = { lifeline_988: "Call or text 988 (Suicide & Crisis Lifeline)", veterans_crisis_text: "Text 838255 (Veterans Crisis Line)", veterans_crisis_call: "Call 988 then press 1" };
      const log = { escalation_id: escId, app: seApp, pta_entity: seEntity, triggered_at: new Date().toISOString(), notify_list: notify.map(n => ({ name: n.name, identity: n.identity, tier: n.tier })), status: "open", resources };
      await env.AURA_KV.put(`safety:log:${seApp}:${seEntity}:${escId}`, JSON.stringify(log)).catch(() => {});
      return { cmd: "SAFETY_ESCALATE", payload: { ok: true, escalation_id: escId, message: "You are not alone. Help is available right now.", resources, notifying: notify.map(n => n.name), human_floor: "If you are in immediate danger, call 988 now. A real person is here for you.", note: notify.length ? "Your trust circle is being notified." : "Please reach out to 988 directly - you matter." } };
    }

    case "RENDER_PAGE": {
      // THE DETERMINISTIC COMPONENT RENDERER - the fix for brain-drift on page building.
      // A page is ASSEMBLED from pre-wired components, never generated freeform. Each component
      // already calls a real engine.action from the catalog, so it CANNOT be mis-wired.
      // Building a page = naming components in order. No brain, byte-exact, every time.
      // This is the foundation of HomeScreen / the dynamic-UI surface.
      // Usage (JSON): RENDER_PAGE {"app":"servicelife","domain":"servicelife.world","title":"ServiceLife","theme":"teal","layout":[{"component":"profile_form","config":{...}},{"component":"crisis_banner"}]}
      if (!isOp) return { cmd: "RENDER_PAGE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let rp;
      try { rp = JSON.parse(rest.trim()); } catch { return { cmd: "RENDER_PAGE", payload: { ok: false, error: 'Usage: RENDER_PAGE {"app","domain","title","theme","layout":[{component,config}]}' } }; }
      if (!rp.app || !rp.domain || !Array.isArray(rp.layout)) return { cmd: "RENDER_PAGE", payload: { ok: false, error: "app, domain, layout[] required" } };

      const DOOR = "https://auras.guide/engine";
      const APP = String(rp.app).replace(/[^a-z0-9_-]/gi, "");
      const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      // THE COMPONENT LIBRARY. Each component returns wired HTML. The fetch calls inside are
      // hardcoded to real catalog engine.action keys - they cannot be invented or drift.
      const COMPONENTS = {
        // a header band
        header: (c) => `<header class="c-header"><h1>${esc(c.title || rp.title || APP)}</h1>${c.tagline ? `<p>${esc(c.tagline)}</p>` : ""}</header>`,

        // crisis safety banner - always 988, wired to safety.escalate
        crisis_banner: (c) => `<div class="c-crisis"><strong>Crisis support 24/7:</strong> You are not alone. <a href="tel:988">Call 988</a> &middot; Text 838255 (Veterans Crisis Line)</div>`,

        // profile signup form - wired to profile.set. Stores returned pta_entity in window.__pta.
        profile_form: (c) => `<section class="c-card"><h2>${esc(c.title || "Sign Up")}</h2>
<input id="pf_name" placeholder="Full name" />
<input id="pf_email" type="email" placeholder="Email" />
${(c.fields || ["branch"]).map(f => `<input id="pf_${esc(f)}" placeholder="${esc(f.charAt(0).toUpperCase() + f.slice(1))}" />`).join("\n")}
<button onclick="pfSubmit()">${esc(c.button || "Create my account")}</button>
<div id="pf_result" class="c-result"></div>
<script>
async function pfSubmit(){
  var fields={}; ${JSON.stringify(c.fields || ["branch"])}.forEach(function(f){fields[f]=document.getElementById('pf_'+f).value;});
  var body={engine:"profile",action:"set",app:"${APP}",params:{name:document.getElementById('pf_name').value,identity:"email:"+document.getElementById('pf_email').value,fields:fields}};
  var r=await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  var d=await r.json();
  if(d.ok&&d.pta_entity){window.__pta=d.pta_entity;document.getElementById('pf_result').innerHTML='Welcome. You are in the system.';}
  else{document.getElementById('pf_result').innerHTML='Something went wrong. Please try again.';}
}
</script></section>`,

        // presence feed - wired to presence.feed (read) + presence.post (write)
        feed: (c) => `<section class="c-card"><h2>${esc(c.title || "Feed")}</h2>
<textarea id="fd_text" placeholder="Share an update..."></textarea>
<button onclick="fdPost()">Post</button>
<div id="fd_list" class="c-feed"></div>
<script>
async function fdLoad(){
  if(!window.__pta){document.getElementById('fd_list').innerHTML='<em>Sign up first to see your feed.</em>';return;}
  var r=await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({engine:"presence",action:"feed",app:"${APP}",params:{feed:window.__pta}})});
  var d=await r.json();var h='';(d.posts||[]).forEach(function(p){h+='<div class="c-post">'+(p.content||'')+'</div>';});
  document.getElementById('fd_list').innerHTML=h||'<em>No posts yet.</em>';
}
async function fdPost(){
  if(!window.__pta)return;
  await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({engine:"presence",action:"post",app:"${APP}",params:{feed:window.__pta,author:window.__pta,type:"text",content:document.getElementById('fd_text').value}})});
  document.getElementById('fd_text').value='';fdLoad();
}
setTimeout(fdLoad,500);
</script></section>`,

        // trust circle - wired to circle.add + circle.list
        circle: (c) => `<section class="c-card"><h2>${esc(c.title || "Trust Circle")}</h2>
<input id="ci_name" placeholder="Their name" />
<input id="ci_email" type="email" placeholder="Their email" />
<select id="ci_tier"><option value="family">Family</option><option value="brotherhood">Brotherhood</option><option value="support">Support</option></select>
<button onclick="ciAdd()">Add to my circle</button>
<div id="ci_list" class="c-feed"></div>
<script>
async function ciAdd(){
  if(!window.__pta)return;
  await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({engine:"circle",action:"add",app:"${APP}",params:{pta_entity:window.__pta,name:document.getElementById('ci_name').value,identity:"email:"+document.getElementById('ci_email').value,tier:document.getElementById('ci_tier').value}})});
  ciList();
}
async function ciList(){
  if(!window.__pta)return;
  var r=await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({engine:"circle",action:"list",app:"${APP}",params:{pta_entity:window.__pta}})});
  var d=await r.json();var h='';var t=d.tiers||{};Object.keys(t).forEach(function(k){t[k].forEach(function(m){h+='<div class="c-post"><strong>'+k+':</strong> '+m.name+'</div>';});});
  document.getElementById('ci_list').innerHTML=h||'<em>No one added yet.</em>';
}
</script></section>`,

        // free text/html block
        text: (c) => `<section class="c-card">${c.html || `<p>${esc(c.content || "")}</p>`}</section>`,

        // BUSINESS_IDENTITY - proves a real, registered operating business. Built for A2P/carrier
        // review (error 30919 "insufficient business information") and reusable on any business door.
        // config: legal_name, description, address, phone, email, registration (e.g. "California LLC,
        // SoS File No. ..."). NEVER render an EIN here - EINs are verification-only, never public.
        business_identity: (c) => `<section class="c-card c-bizid"><h2>${esc(c.title || ("About " + (c.legal_name || rp.title || APP)))}</h2>
${c.description ? `<p>${esc(c.description)}</p>` : ""}
<div class="c-bizmeta">
${c.legal_name ? `<div><strong>${esc(c.legal_name)}</strong></div>` : ""}
${c.address ? `<div>${esc(c.address)}</div>` : ""}
${c.phone ? `<div>Phone: <a href="tel:${esc(String(c.phone).replace(/[^0-9+]/g, ""))}">${esc(c.phone)}</a></div>` : ""}
${c.email ? `<div>Email: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>` : ""}
${c.registration ? `<div>${esc(c.registration)}</div>` : ""}
</div></section>`,

        // SMS_OPTIN - the COMPLIANT consent form. The exact consent language is baked in (cannot drift)
        // and the box is OPTIONAL + UNCHECKED by default (consent never required to use the service),
        // which is what carriers require. Wired to /optin. config: brand (e.g. "CALL+ by ARK Systems LLC"),
        // blurb, button. This is the proven opt-in mechanism as a reusable component so it is never
        // hand-written again. privacy/terms links point at /privacy and /terms on the same domain.
        sms_optin: (c) => { const brand = esc(c.brand || rp.title || APP); const consent = "Optional - you can sign up without this. By checking this box, I agree to receive recurring account and service notification text messages from " + (c.brand || rp.title || APP) + " at the phone number provided. Consent is not a condition of any purchase. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe, HELP for help."; return `<section class="c-card c-optin"><h2>${esc(c.title || "Sign Up for Text Notifications")}</h2>
<p>${esc(c.blurb || ("Enter your details to receive account and service notification texts from " + (c.brand || rp.title || APP) + ". Signing up is optional and you can use the service without it."))}</p>
<div id="oi_form">
<input id="oi_name" placeholder="Name (optional)" />
<input id="oi_phone" type="tel" placeholder="Mobile phone *" required />
<input id="oi_email" type="email" placeholder="Email (optional)" />
<label class="c-consent"><input type="checkbox" id="oi_consent" /> <span>${esc(consent)} <a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Service</a></span></label>
<button onclick="oiSubmit()">${esc(c.button || "Sign Up")}</button>
<div id="oi_result" class="c-result"></div>
</div>
<script>
async function oiSubmit(){
  var phone=document.getElementById('oi_phone').value.trim();var out=document.getElementById('oi_result');
  if(!phone){out.style.display='block';out.textContent='Please enter your mobile phone number.';return;}
  var body={name:document.getElementById('oi_name').value.trim(),phone:phone,email:document.getElementById('oi_email').value.trim(),consent:document.getElementById('oi_consent').checked,consent_text:${JSON.stringify("By checking this box, I agree to receive recurring account and service notification text messages from " + (c.brand || rp.title || APP) + " at the phone number provided. Consent is not a condition of any purchase. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe, HELP for help.")},brand:${JSON.stringify(c.brand || rp.title || APP)}};
  out.style.display='block';out.textContent='You are signed up. Reply STOP anytime to unsubscribe.';
  document.getElementById('oi_form').style.opacity='0.6';
  try{await fetch("https://auras.guide/optin",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});}catch(e){}
}
</script></section>`; },

        // LEGAL_FOOTER - privacy/terms/about links + entity copyright line. Every public door should
        // carry this. config: entity (legal name for copyright), year.
        legal_footer: (c) => `<footer class="c-legal"><p><a href="/privacy">Privacy Policy</a> &middot; <a href="/terms">Terms of Service</a> &middot; <a href="/about">About</a></p><p class="c-copy">&copy; ${esc(c.year || "2026")} ${esc(c.entity || rp.title || APP)}. All rights reserved.</p></footer>`,

        // CONVERSATION - a continuing back-and-forth with Aura, pre-wired to pta.talk.
        // Reads ?pta= from the URL (correct param), sends each message with pta_entity (the exact
        // field pta.talk expects), shows the reply, loops forever. Hardcoded = cannot drift.
        conversation: (c) => `<section class="c-card c-convo"><h2>${esc(c.title || "Continue with Aura")}</h2>
<div id="cv_thread" class="c-thread"></div>
<div class="c-inrow"><textarea id="cv_text" placeholder="${esc(c.placeholder || "Type your message...")}" rows="1"></textarea><button onclick="cvSend()">Send</button></div>
<div id="cv_err" class="c-result"></div>
<script>
var CV_PTA=new URLSearchParams(location.search).get("pta")||"";
function cvAdd(who,text){var d=document.getElementById('cv_thread');var m=document.createElement('div');m.className='c-msg c-'+who;m.textContent=text;d.appendChild(m);d.scrollTop=d.scrollHeight;return m;}
if(!CV_PTA){document.getElementById('cv_err').innerHTML='No conversation id in the link. Visit ${esc(rp.domain)} to begin.';}
else{cvAdd('aura',${JSON.stringify(c.intro || "I'm here. Pick up wherever we left off.")});}
async function cvSend(){
  var box=document.getElementById('cv_text');var msg=box.value.trim();if(!msg||!CV_PTA)return;
  cvAdd('me',msg);box.value='';var btn=event&&event.target;if(btn)btn.disabled=true;
  var pend=cvAdd('aura','…');
  try{
    var r=await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({engine:"pta",action:"talk",app:"${APP}",params:{pta_entity:CV_PTA,message:msg,console_url:location.origin+location.pathname}})});
    var d=await r.json();
    pend.textContent=d.reply||"(no reply)";
    if(d.followup_scheduled&&d.scheduled){var s=cvAdd('sys','Aura will email you in '+d.scheduled.in_minutes+' min.');}
  }catch(e){pend.textContent="(connection issue — try again)";}
  if(btn)btn.disabled=false;box.focus();
}
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey&&document.activeElement&&document.activeElement.id==='cv_text'){e.preventDefault();cvSend();}});
</script></section>`,

        // LOCATION_CAPTURE - the person shares their device location, consented via the browser's
        // native permission prompt. Pre-wired to pta.locate with the correct pta_entity from ?pta=.
        // The "Allow location?" tap IS the authorization. Hardcoded = cannot drift.
        location_capture: (c) => `<section class="c-card c-loc"><h2>${esc(c.title || "Share your location")}</h2>
<p>${esc(c.blurb || "Tap below and allow location so Aura can find what's near you. You're in control - you decide to share.")}</p>
<button onclick="lcShare()" id="lc_btn">${esc(c.button || "Use my location")}</button>
<div id="lc_result" class="c-result"></div>
<script>
var LC_PTA=new URLSearchParams(location.search).get("pta")||"";
function lcShare(){
  var out=document.getElementById('lc_result');var btn=document.getElementById('lc_btn');
  if(!LC_PTA){out.textContent='No identity in the link. Visit ${esc(rp.domain)} to begin.';return;}
  if(!navigator.geolocation){out.textContent='Your device does not support location sharing.';return;}
  btn.disabled=true;out.textContent='Waiting for permission…';
  navigator.geolocation.getCurrentPosition(async function(pos){
    var lat=pos.coords.latitude,lng=pos.coords.longitude,acc=pos.coords.accuracy;
    out.textContent='Got it — saving your location…';
    try{
      var r=await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({engine:"pta",action:"locate",app:"${APP}",params:{pta_entity:LC_PTA,lat:lat,lng:lng,accuracy:acc}})});
      var d=await r.json();
      if(d.ok){out.innerHTML='✓ Location shared. Aura knows where you are now.';}
      else{out.textContent='Could not save location. Please try again.';btn.disabled=false;}
    }catch(e){out.textContent='Connection issue — try again.';btn.disabled=false;}
  },function(err){
    out.textContent=(err.code===1)?'You declined location. That is okay — you can share anytime.':'Could not get your location. Please try again.';
    btn.disabled=false;
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
}
</script></section>`,

        // COMMERCE_DASHBOARD - the money surface. Shows REAL statistics (not chat) from pay.stats:
        // revenue, transaction count, average ticket, today/week/month, a 14-day bar chart, and top
        // buyers. Scoped via config: scope "asset" (owner sees their business), "pta" (a customer
        // sees their own purchases across the world), or "all" (platform view). Reads ?pta= / ?asset=
        // from the URL when scope needs an id. Hardcoded to pay.stats = cannot drift.
        commerce_dashboard: (c) => `<section class="c-card c-dash"><h2>${esc(c.title || "Your numbers")}</h2>
<div id="cd_loading">Loading your numbers…</div>
<div id="cd_body" style="display:none">
  <div class="cd-stats">
    <div class="cd-stat"><div class="cd-n" id="cd_total">$0</div><div class="cd-l">Total revenue</div></div>
    <div class="cd-stat"><div class="cd-n" id="cd_count">0</div><div class="cd-l">Transactions</div></div>
    <div class="cd-stat"><div class="cd-n" id="cd_avg">$0</div><div class="cd-l">Avg ticket</div></div>
    <div class="cd-stat"><div class="cd-n" id="cd_buyers">0</div><div class="cd-l">Customers</div></div>
  </div>
  <div class="cd-row"><span>Today <b id="cd_today">$0</b></span><span>This week <b id="cd_week">$0</b></span><span>This month <b id="cd_month">$0</b></span></div>
  <div class="cd-chart" id="cd_chart"></div>
  <div class="cd-top"><h3>Top customers</h3><div id="cd_topbuyers"></div></div>
</div>
<div id="cd_err" class="c-result"></div>
<script>
(function(){
var SCOPE=${JSON.stringify(c.scope || "asset")};
var params=new URLSearchParams(location.search);
var ASSET=params.get("asset")||${JSON.stringify(c.asset || "")};
var PTA=params.get("pta")||"";
function money(n){return '$'+(Math.round(n*100)/100).toLocaleString();}
async function load(){
  var body={engine:"pay",action:"stats",app:"${APP}",params:{scope:SCOPE}};
  if(SCOPE==="pta")body.params.pta_entity=PTA; else if(SCOPE==="asset")body.params.asset=ASSET;
  try{
    var r=await fetch("${DOOR}",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    var d=await r.json();
    if(!d.ok){document.getElementById('cd_err').textContent='Could not load numbers.';document.getElementById('cd_loading').style.display='none';return;}
    document.getElementById('cd_total').textContent=money(d.total_revenue);
    document.getElementById('cd_count').textContent=d.transaction_count;
    document.getElementById('cd_avg').textContent=money(d.avg_ticket);
    document.getElementById('cd_buyers').textContent=d.unique_buyers;
    document.getElementById('cd_today').textContent=money(d.today);
    document.getElementById('cd_week').textContent=money(d.this_week);
    document.getElementById('cd_month').textContent=money(d.this_month);
    var s=d.daily_series_14d||[];var max=Math.max(1,...s.map(function(x){return x.amount;}));
    var ch=document.getElementById('cd_chart');ch.innerHTML='';
    s.forEach(function(x){var bar=document.createElement('div');bar.className='cd-bar';bar.style.height=Math.max(2,(x.amount/max)*100)+'%';bar.title=x.date+': '+money(x.amount);ch.appendChild(bar);});
    var tb=document.getElementById('cd_topbuyers');tb.innerHTML='';
    (d.top_buyers||[]).forEach(function(b){var row=document.createElement('div');row.className='cd-toprow';row.innerHTML='<span>'+b.name+'</span><b>'+money(b.amount)+'</b>';tb.appendChild(row);});
    document.getElementById('cd_loading').style.display='none';
    document.getElementById('cd_body').style.display='block';
  }catch(e){document.getElementById('cd_err').textContent='Connection issue loading numbers.';document.getElementById('cd_loading').style.display='none';}
}
load();
})();
</script></section>`,
      };

      // assemble the layout deterministically
      const used = [];
      const blocks = [];
      for (const item of rp.layout) {
        const name = item && item.component;
        if (COMPONENTS[name]) { blocks.push(COMPONENTS[name](item.config || {})); used.push(name); }
        else { blocks.push(`<!-- unknown component: ${esc(name)} -->`); }
      }

      const themes = {
        teal: { bg: "#0a1518", card: "#11242a", accent: "#2dd4bf", text: "#e8f0f0", crisis: "#7a1f1f" },
        dark: { bg: "#0d0d12", card: "#1a1a24", accent: "#8b9dff", text: "#eaeaf0", crisis: "#7a1f1f" },
      };
      const t = themes[rp.theme] || themes.dark;

      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(rp.title || APP)}</title>
<style>
:root{--bg:${t.bg};--card:${t.card};--accent:${t.accent};--text:${t.text}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
.wrap{max-width:640px;margin:0 auto;padding:1rem}
.c-crisis{background:${t.crisis};color:#fff;padding:.75rem 1rem;text-align:center;font-size:.95rem}
.c-crisis a{color:#fff;font-weight:700}
.c-header{text-align:center;padding:2rem 1rem 1rem}.c-header h1{color:var(--accent);margin:0}
.c-card{background:var(--card);border-radius:14px;padding:1.25rem;margin:1rem 0}
.c-card h2{margin:0 0 1rem;color:var(--accent)}
input,select,textarea{width:100%;padding:.7rem;margin:.35rem 0;background:#0006;border:1px solid #ffffff22;border-radius:8px;color:var(--text);font-size:1rem}
textarea{min-height:70px}
button{background:var(--accent);color:#06222a;border:0;border-radius:8px;padding:.75rem 1.25rem;font-weight:700;font-size:1rem;cursor:pointer;margin-top:.5rem}
.c-result{margin-top:.75rem;color:var(--accent);font-weight:600}
.c-feed{margin-top:1rem}.c-post{background:#0004;padding:.6rem .8rem;border-radius:8px;margin:.4rem 0}
.c-thread{display:flex;flex-direction:column;gap:.5rem;margin:.5rem 0;max-height:55vh;overflow-y:auto}
.c-msg{max-width:85%;padding:.6rem .85rem;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
.c-msg.c-me{align-self:flex-end;background:var(--accent);color:#06222a}
.c-msg.c-aura{align-self:flex-start;background:#0006;border:1px solid #ffffff1a}
.c-msg.c-sys{align-self:center;background:transparent;opacity:.6;font-size:.85rem}
.c-inrow{display:flex;gap:.5rem;align-items:flex-end}.c-inrow textarea{flex:1;margin:0}.c-inrow button{margin:0;flex:0 0 auto}
.cd-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin:.5rem 0 1rem}
.cd-stat{background:#0006;border-radius:10px;padding:.9rem;text-align:center}
.cd-n{font-size:1.6rem;font-weight:700;color:var(--accent)}.cd-l{font-size:.8rem;opacity:.7;margin-top:.2rem}
.cd-row{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem;font-size:.9rem;opacity:.85;margin:.5rem 0 1rem}.cd-row b{color:var(--accent)}
.cd-chart{display:flex;align-items:flex-end;gap:3px;height:120px;padding:.5rem 0;border-bottom:1px solid #ffffff1a;margin-bottom:1rem}
.cd-bar{flex:1;background:var(--accent);border-radius:3px 3px 0 0;min-height:2px;opacity:.85}
.cd-top h3{font-size:.95rem;margin:.5rem 0;opacity:.8}
.cd-toprow{display:flex;justify-content:space-between;padding:.4rem .6rem;background:#0004;border-radius:6px;margin:.3rem 0}.cd-toprow b{color:var(--accent)}
.c-foot{text-align:center;padding:2rem 1rem;opacity:.5;font-size:.85rem}
</style></head><body>
${blocks.filter(b => b.includes("c-crisis")).join("")}
<div class="wrap">
${blocks.filter(b => !b.includes("c-crisis")).join("\n")}
<div class="c-foot">Part of the Aura platform &middot; ${esc(rp.domain)}</div>
</div></body></html>`;

      // write the page byte-exact to its KV key (deterministic, no brain)
      // optional path lets a component page live at e.g. /talk instead of root
      let rpPath = rp.path || "/";
      if (!rpPath.startsWith("/")) rpPath = "/" + rpPath;
      const pageKey = `page:${rp.domain}${rpPath}`;
      await env.AURA_KV.put(pageKey, html).catch(() => {});

      return { cmd: "RENDER_PAGE", payload: { ok: true, domain: rp.domain, key: pageKey, bytes: html.length, components_used: used, available_components: Object.keys(COMPONENTS) } };
    }

    case "THINK": {
      // Direct access to the shared Cognitive Loop reasoner — SEE -> EXPAND(challenge) -> JUDGE -> DECIDE
      // in one pass, with data-trust and operator-push-back built in. This is the shared MIND that the
      // engines reason through. Test surface to prove the shared reasoner before migrating engines onto it.
      // Usage: THINK <situation>              (general operator lens)
      //        THINK <lens> ::: <situation>   (specialized lens)
      let thRaw = (rest || "").trim();
      if (!thRaw) return { cmd: "THINK", payload: { ok: false, error: "Usage: THINK <situation>  |  THINK <lens> ::: <situation>" } };
      let thLens = "general operator reasoning", thSit = thRaw;
      if (thRaw.includes(":::")) { const parts = thRaw.split(":::"); thLens = parts[0].trim(); thSit = parts.slice(1).join(":::").trim(); }
      const thR = await reasonThroughLoop(env, { entity: thSit, lens: thLens, facts: {} });
      if (!thR.ok) return { cmd: "THINK", payload: { ok: false, error: thR.error } };
      return { cmd: "THINK", payload: { ok: true, lens: thLens, situation: thSit, reasoning: thR.reasoning } };
    }

    case "OUTCOME": {
      // ===== OUTCOME ENGINE — Universal Outcome Intelligence =====
      // Turns any GOAL into leverage + a coordinated, sequenced plan: "HOW do we get from here
      // to the desired outcome?" Pairs with the loop (EXPAND->DECIDE pointed at execution).
      // Informs and recommends; the human decides and acts. Universal — works for any goal, any person.
      // Usage: OUTCOME <goal>        (reason a goal into a strategy)
      //        OUTCOME FRESH <goal>  (recompute, bypass cache)
      let ocRaw = (rest || "").trim();
      let ocFresh = false;
      if (/^FRESH\s+/i.test(ocRaw)) { ocFresh = true; ocRaw = ocRaw.replace(/^FRESH\s+/i, "").trim(); }
      if (!ocRaw) return { cmd: "OUTCOME", payload: { ok: false, error: "Usage: OUTCOME <goal>  (turn a goal into leverage + a coordinated strategy). OUTCOME FRESH <goal> to recompute." } };
      const ocSlug = ocRaw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "goal";
      const ocKey = "outcome:" + ocSlug;
      if (!ocFresh) { try { const cached = await env.AURA_KV.get(ocKey); if (cached) { const c = JSON.parse(cached); return { cmd: "OUTCOME", payload: { ok: true, cached: true, goal: ocRaw, outcome: c } }; } } catch {} }
      const ocApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!ocApiKey) return { cmd: "OUTCOME", payload: { ok: false, error: "Brain not configured (secret:anthropic missing)" } };
      const ocModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      // optional grounding: any real context the operator has stored
      let ocContext = "";
      try { const st = await env.AURA_KV.get("notes:STATE"); if (st) ocContext = String(st).slice(0, 1500); } catch {}
      // OUTCOME now reasons THROUGH the shared mind — it inherits assumption-challenge, data-trust,
      // and operator-pushback, and adds its outcome-specific lens + keys (leverage, multipliers, strategy).
      const ocLens = "OUTCOME INTELLIGENCE — given a desired GOAL, answer HOW we get from here to the outcome. Find the highest-leverage paths and turn the goal into a coordinated SEQUENCED plan, not a task dump. Look for the few moves where small effort yields large results, the multipliers already in hand that amplify everything, and the single first move today. You inform and recommend; the human decides.";
      const ocR = await reasonThroughLoop(env, {
        entity: ocRaw,
        lens: ocLens,
        facts: ocContext ? { operator_context: ocContext } : {},
        maxTokens: 1300,
        extraKeys: [
          { key: "goal", desc: "the true outcome, refined if the stated goal is shallow" },
          { key: "leverage_points", desc: "array, the few highest-leverage moves" },
          { key: "multipliers", desc: "array, existing relationships/assets/audiences that amplify" },
          { key: "strategy", desc: "array of sequenced steps in order, each a short phrase" },
          { key: "first_move", desc: "one concrete action to take today" }
        ]
      });
      if (!ocR.ok) return { cmd: "OUTCOME", payload: { ok: false, error: ocR.error } };
      const parsed = ocR.reasoning;
      const ts = new Date().toISOString();
      await env.AURA_KV.put(ocKey, JSON.stringify(parsed)).catch(() => {});
      return { cmd: "OUTCOME", payload: { ok: true, cached: false, goal: ocRaw, outcome: parsed, ts } };
    }

    case "MISSION_SET": {
      // Mission Control (Command Center section 2) — objectives, not tasks.
      // MISSION_SET [json array]  -> full replace of missions:all
      // MISSION_SET {json object} -> upsert one mission by id
      // Mission schema: { id, name, purpose, progress (0-100), dependencies[], blockers[],
      //                   watch[] ("a2p"|"funding"), forecast_completion (YYYY-MM-DD),
      //                   expected_revenue, expected_impact }
      if (!isOp) return { cmd: "MISSION_SET", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const mJson = rest.trim();
      if (!mJson) return { cmd: "MISSION_SET", payload: { ok: false, error: "Usage: MISSION_SET <json array = replace all | json object with id = upsert one>" } };
      let mParsed;
      try { mParsed = JSON.parse(mJson); }
      catch (e) { return { cmd: "MISSION_SET", payload: { ok: false, error: "Invalid JSON: " + e.message } }; }
      const mNow = new Date().toISOString();
      if (Array.isArray(mParsed)) {
        for (const m of mParsed) { if (!m.id) return { cmd: "MISSION_SET", payload: { ok: false, error: "Every mission needs an id" } }; m.updated = m.updated || mNow; }
        await KV.put(env, "missions:all", JSON.stringify(mParsed));
        return { cmd: "MISSION_SET", payload: { ok: true, mode: "replace_all", count: mParsed.length } };
      }
      if (!mParsed.id) return { cmd: "MISSION_SET", payload: { ok: false, error: "Mission object needs an id" } };
      let mAll = [];
      try { mAll = JSON.parse(await env.AURA_KV.get("missions:all") || "[]"); } catch { mAll = []; }
      if (!Array.isArray(mAll)) mAll = [];
      const mIdx = mAll.findIndex(m => m.id === mParsed.id);
      mParsed.updated = mNow;
      if (mIdx >= 0) mAll[mIdx] = { ...mAll[mIdx], ...mParsed };
      else mAll.push(mParsed);
      await KV.put(env, "missions:all", JSON.stringify(mAll));
      return { cmd: "MISSION_SET", payload: { ok: true, mode: mIdx >= 0 ? "updated" : "created", id: mParsed.id, total: mAll.length } };
    }

    case "MISSION_STATUS": {
      // Reads missions:all and enriches with LIVE signals from real feeds — honest data only.
      // A mission's watch[] tags drive auto-derived live_blockers:
      //   "a2p"     -> notes:alert:a2p campaign status (blocker until APPROVED/VERIFIED)
      //   "funding" -> notes:alert:resources critical concerns (Mercury etc.)
      if (!isOp) return { cmd: "MISSION_STATUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let msAll = [];
      try { msAll = JSON.parse(await env.AURA_KV.get("missions:all") || "[]"); } catch { msAll = []; }
      if (!Array.isArray(msAll)) msAll = [];
      let sigA2p = null, sigRes = null;
      try { sigA2p = JSON.parse(await env.AURA_KV.get("notes:alert:a2p") || "null"); } catch {}
      try { sigRes = JSON.parse(await env.AURA_KV.get("notes:alert:resources") || "null"); } catch {}
      const msNow = Date.now();
      const enriched = msAll.map(m => {
        const out = { ...m, live_blockers: [] };
        const watch = Array.isArray(m.watch) ? m.watch : [];
        if (watch.includes("a2p") && sigA2p) {
          const st = sigA2p.changed_to || sigA2p.status || "UNKNOWN";
          if (!/APPROVED|VERIFIED/i.test(st)) out.live_blockers.push(`A2P SMS campaign: ${st}`);
        }
        if (watch.includes("funding") && sigRes && Array.isArray(sigRes.concerns)) {
          for (const c of sigRes.concerns) {
            if (c.level === "critical") out.live_blockers.push(`${c.provider} balance critical ($${c.value})`);
          }
        }
        if (m.forecast_completion) {
          const t = Date.parse(m.forecast_completion);
          if (!isNaN(t)) out.days_to_target = Math.round((t - msNow) / 86400000);
        }
        return out;
      });
      return { cmd: "MISSION_STATUS", payload: { ok: true, count: enriched.length, signals: { a2p: sigA2p, resources: sigRes }, missions: enriched } };
    }

    case "EMAIL_SEND": {
      // Vertical-neutral email sender via Cloudflare Email Service REST API.
      // Usage: EMAIL_SEND <to> <subject> | <body text>
      if (!isOp) return { cmd: "EMAIL_SEND", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const cfToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      if (!cfToken) return { cmd: "EMAIL_SEND", payload: { ok: false, error: "No CF API token" } };
      const emailRest = rest.trim();
      const emailTo = (args[0] || "").trim();
      if (!emailTo || !emailTo.includes("@")) return { cmd: "EMAIL_SEND", payload: { ok: false, error: "Usage: EMAIL_SEND <to@email.com> <subject> | <body text>" } };
      const emailAfterTo = emailRest.slice(emailTo.length).trim();
      const pipeIdx = emailAfterTo.indexOf("|");
      let emailSubject, emailBody;
      if (pipeIdx >= 0) {
        emailSubject = emailAfterTo.slice(0, pipeIdx).trim() || "Message from Aura";
        emailBody = emailAfterTo.slice(pipeIdx + 1).trim() || "";
      } else {
        emailSubject = emailAfterTo || "Message from Aura";
        emailBody = "";
      }
      const emailFrom = await env.AURA_KV.get("config:email:from").catch(() => null) || "noreply@auras.guide";
      const sendResult = await sendEmail(env, emailTo, emailSubject, emailBody || emailSubject, { from: emailFrom });
      if (sendResult.ok) {
        return { cmd: "EMAIL_SEND", payload: { ok: true, to: emailTo, subject: emailSubject, message_id: sendResult.message_id, accepted: true } };
      }
      return { cmd: "EMAIL_SEND", payload: { ok: false, to: emailTo, subject: emailSubject, error: sendResult.error } };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PTA — PERMISSION TO APPROACH — THE RELATIONSHIP GRAPH
    // Not a contact system. A graph where every node is an entity (person, business,
    // photo, event, document, memory, project) and every edge is a three-layer
    // relationship: Permission (can I approach), Relationship (how we know each other),
    // Impact (what happened because we connected). Edges accumulate history.
    // Graph is traversable: who introduced whom, what chains led to what outcomes.
    // Storage: D1 (relational, queryable in both directions).
    // ═══════════════════════════════════════════════════════════════════════════

    case "PTA_INIT": {
      // Create/upgrade PTA tables in D1. Idempotent — safe to run multiple times.
      if (!isOp) return { cmd: "PTA_INIT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      // Core tables
      await db.prepare(`CREATE TABLE IF NOT EXISTS pta_entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        identity_key TEXT,
        name TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_pe_identity ON pta_entities(identity_key)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_pe_type ON pta_entities(type)`).run();
      await db.prepare(`CREATE TABLE IF NOT EXISTS pta_edges (
        id TEXT PRIMARY KEY,
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        edge_type TEXT NOT NULL DEFAULT 'grant',
        state TEXT NOT NULL DEFAULT 'pending',
        permission TEXT,
        relationship TEXT,
        impact TEXT,
        context TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edge_from ON pta_edges(from_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edge_to ON pta_edges(to_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edge_state ON pta_edges(state)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_edge_type ON pta_edges(edge_type)`).run();
      await db.prepare(`CREATE TABLE IF NOT EXISTS pta_history (
        id TEXT PRIMARY KEY,
        edge_id TEXT NOT NULL,
        action TEXT NOT NULL,
        actor_id TEXT,
        detail TEXT,
        created_at TEXT NOT NULL
      )`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_hist_edge ON pta_history(edge_id)`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_hist_actor ON pta_history(actor_id)`).run();
      // v4.1 additions: groups, moments, entity upgrades
      await db.prepare(`CREATE TABLE IF NOT EXISTS pta_groups (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        name TEXT NOT NULL,
        permissions TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_grp_entity ON pta_groups(entity_id)`).run();
      await db.prepare(`CREATE TABLE IF NOT EXISTS pta_moments (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL,
        name TEXT NOT NULL,
        context TEXT,
        live_from TEXT NOT NULL,
        live_until TEXT,
        created_at TEXT NOT NULL
      )`).run();
      await db.prepare(`CREATE INDEX IF NOT EXISTS idx_mom_creator ON pta_moments(creator_id)`).run();
      // Add columns to existing tables (safe: fails silently if already exists)
      try { await db.prepare("ALTER TABLE pta_entities ADD COLUMN live_intent TEXT").run(); } catch {}
      try { await db.prepare("ALTER TABLE pta_entities ADD COLUMN verification_level TEXT DEFAULT 'unverified'").run(); } catch {}
      try { await db.prepare("ALTER TABLE pta_edges ADD COLUMN group_id TEXT").run(); } catch {}
      try { await db.prepare("ALTER TABLE pta_edges ADD COLUMN moment_id TEXT").run(); } catch {}
      // Ensure Aura herself exists as an entity in the graph
      const auraEntity = await db.prepare("SELECT id FROM pta_entities WHERE identity_key = 'system:aura'").first();
      if (!auraEntity) {
        const auraId = "pta_aura";
        await db.prepare("INSERT INTO pta_entities (id, type, identity_key, name, metadata, created_at, updated_at, verification_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(auraId, "system", "system:aura", "Aura", '{"role":"intelligence_layer"}', new Date().toISOString(), new Date().toISOString(), "aura_verified").run();
      }
      return { cmd: "PTA_INIT", payload: { ok: true, tables: ["pta_entities", "pta_edges", "pta_history", "pta_groups", "pta_moments"], note: "PTA graph v4.1 ready — groups, moments, live intent, verification, and Aura entity initialized" } };
    }

    case "PTA_CREATE": {
      // SELF-CREATION - the front door to PTA. A person arrives on their own and TELLS Aura who
      // they are, in their own words. No forms. Aura's brain UNDERSTANDS the free-text into
      // structured context, creates their PTA (born ACTIVE - arriving by their own choice IS
      // consent), stamps the understood context, writes the genesis chapter, optionally emails a
      // welcome. This is "I just came to PTA, here's who I am" made real.
      // Usage (JSON): PTA_CREATE {"identity":"email:...","name":"...","about":"free text who I am","app":"pta","email_welcome":true}
      if (!isOp) return { cmd: "PTA_CREATE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let pc;
      try { pc = JSON.parse(rest.trim()); } catch { return { cmd: "PTA_CREATE", payload: { ok: false, error: 'Usage: PTA_CREATE {"identity":"email:...","name":"...","about":"who I am","app":"pta"}' } }; }
      if (!pc.identity) return { cmd: "PTA_CREATE", payload: { ok: false, error: "identity required (email:... or phone:...)" } };
      if (!/^(email|phone):/i.test(pc.identity)) return { cmd: "PTA_CREATE", payload: { ok: false, error: "identity must be email:... or phone:..." } };
      const pcApp = pc.app || "pta";
      // create / resolve the PTA (dedup on identity)
      let pcId = null, pcMode = null;
      try {
        const safeName = (pc.name || "New PTA").replace(/[\n\r]/g, " ");
        const r = await processCommand(`PTA_ENTITY CREATE person ${safeName} identity:${pc.identity}`, env, true);
        const pp = r && r.payload ? r.payload : r;
        if (pp && pp.ok && pp.entity) { pcId = pp.entity.id; pcMode = pp.mode; }
      } catch (e) { return { cmd: "PTA_CREATE", payload: { ok: false, error: "Birth failed: " + e.message } }; }
      if (!pcId) return { cmd: "PTA_CREATE", payload: { ok: false, error: "Could not create PTA" } };

      // BRAIN UNDERSTANDS who they are from their own words (SEE -> UNDERSTAND applied to a person)
      let understood = null;
      if (pc.about && pc.about.trim()) {
        const apiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        if (apiKey) {
          const model = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
          const sys = "You are Aura, meeting a new person who just told you who they are in their own words. Understand them warmly and accurately. Return ONLY a JSON object, no prose or fences, with exactly these keys: identity_summary (one warm sentence capturing who they are), roles (array of what they are/do), interests (array), traits (array of character qualities you can fairly infer), what_matters_to_them (array, only if they signal it - else empty), how_to_address_them (a short note on tone that would suit them), confidence (high|medium|low), unknowns (array of what you would want to learn next). Be human, never glib. Infer only what is fair from their words. Output JSON only.";
          try {
            const d = await callAnthropic(apiKey, { model, max_tokens: 1000, system: sys, messages: [{ role: "user", content: pc.about }] });
            let t = ""; if (d && d.content) { for (const b of d.content) { if (b.type === "text") t += b.text; } }
            t = t.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
            try { understood = JSON.parse(t); } catch {}
          } catch (e) {}
        }
      }

      const ts = new Date().toISOString();
      // stamp context onto the spine (self-originated)
      try {
        const ent = await env.AURA_MEMORY.prepare("SELECT metadata FROM pta_entities WHERE id = ?").bind(pcId).first();
        let meta = {}; if (ent && ent.metadata) { try { meta = JSON.parse(ent.metadata); } catch {} }
        meta.origin = pcApp;
        meta.created_by = "self";
        meta.reason = "Arrived and created their own PTA";
        meta.about = pc.about || null;
        if (understood) meta.understood = understood;
        await env.AURA_MEMORY.prepare("UPDATE pta_entities SET metadata = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(meta), ts, pcId).run();
      } catch (e) {}
      // also store an app profile so it shows in the spine's context.apps
      try {
        await env.AURA_KV.put(`profile:${pcApp}:${pcId}`, JSON.stringify({ app: pcApp, pta_entity: pcId, name: pc.name, identity: pc.identity, fields: understood ? { roles: understood.roles, interests: understood.interests } : {}, created: ts, updated: ts })).catch(() => {});
      } catch {}
      // born ACTIVE (self-arrival = consent) + genesis chapter
      await env.AURA_KV.put(`pta:state:${pcId}`, "active").catch(() => {});
      try {
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${pcId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
        evs.push({ ts, event: pc.about ? `Arrived at ${pcApp} and told Aura who they are: "${pc.about.slice(0, 140)}"` : `Arrived at ${pcApp} and created their PTA`, kind: "self_genesis" });
        await env.AURA_KV.put(`pta:timeline:${pcId}`, JSON.stringify(evs)).catch(() => {});
      } catch {}

      // warm welcome in Aura's voice
      const firstName = (pc.name || "").split(/\s+/)[0] || "there";
      let welcome;
      if (understood && understood.identity_summary) {
        welcome = `Welcome to Permission to Approach, ${firstName}. I hear you — ${understood.identity_summary} This is yours now. You control who approaches you, and I'm here to help. Let's begin.`;
      } else {
        welcome = `Welcome to Permission to Approach, ${firstName}. This is yours now — you control who can approach you, and I'm here with you. Tell me more whenever you're ready.`;
      }

      // optional real welcome email (proves the channel)
      let emailResult = null;
      if (pc.email_welcome && pc.identity.startsWith("email:")) {
        const toEmail = pc.identity.slice("email:".length);
        try {
          const er = await processCommand(`EMAIL_SEND ${toEmail} Welcome to Permission to Approach | ${welcome}`, env, true);
          emailResult = er && er.payload ? er.payload : er;
        } catch (e) { emailResult = { ok: false, error: String(e.message) }; }
      }

      return { cmd: "PTA_CREATE", payload: { ok: true, pta: pcId, mode: pcMode, state: "active", welcome, understood, email_sent: emailResult ? emailResult.ok : null, email_detail: emailResult } };
    }

    case "PTA_LOCATE": {
      // A person shares their DEVICE location (GPS), consented via the browser's native permission
      // prompt - the "Allow location?" tap IS the authorization. Writes lat/lng to their PTA at
      // pta:location:<id> (same key the location dimension uses), so "near me" works immediately
      // between this person and businesses. Records the consent on their timeline. The person can
      // share once; live/continuous tracking is a separate future build.
      // Input JSON: { pta_entity, lat, lng, accuracy, label, app }
      let lp = {};
      try { lp = JSON.parse(rest); } catch { return { cmd: "PTA_LOCATE", payload: { ok: false, error: "PTA_LOCATE expects JSON {pta_entity, lat, lng}" } }; }
      const lpId = lp.pta_entity;
      const lat = typeof lp.lat === "number" ? lp.lat : parseFloat(lp.lat);
      const lng = typeof lp.lng === "number" ? lp.lng : parseFloat(lp.lng);
      if (!lpId) return { cmd: "PTA_LOCATE", payload: { ok: false, error: "pta_entity required" } };
      if (isNaN(lat) || isNaN(lng)) return { cmd: "PTA_LOCATE", payload: { ok: false, error: "valid lat and lng required" } };
      const lpNow = new Date().toISOString();
      const loc = {
        address: lp.label || null,
        place_name: lp.label || "Shared location",
        lat, lng,
        accuracy_m: lp.accuracy != null ? lp.accuracy : null,
        source: "device_gps_consented",
        updated_at: lpNow
      };
      await env.AURA_KV.put(`pta:location:${lpId}`, JSON.stringify(loc)).catch(() => {});
      // record the consent + share on the person's timeline
      try {
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${lpId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
        evs.push({ ts: lpNow, event: "Shared their location (consented via device): " + lat.toFixed(5) + ", " + lng.toFixed(5) + (lp.accuracy != null ? ` (±${Math.round(lp.accuracy)}m)` : ""), kind: "located" });
        await env.AURA_KV.put(`pta:timeline:${lpId}`, JSON.stringify(evs)).catch(() => {});
      } catch {}
      return { cmd: "PTA_LOCATE", payload: { ok: true, pta_entity: lpId, location: loc } };
    }

    case "PTA_TALK": {
      // THE CONVERSATION TURN. A person talks to Aura in the console; she reads who they are and
      // the conversation so far (PTA identity + timeline = memory), responds warmly with the goal
      // of helping them move forward, writes the round to the timeline, and - if they ask her to
      // follow up at a time ("email me in 5 minutes") - schedules her OWN follow-up email carrying
      // a link back to the console. This is the round-trip engine: she remembers every exchange and
      // keeps her commitments in time. Honors the foundation: helps and invites, never manipulates
      // or pressures; if the person asks to be left alone, she respects it.
      // Input JSON: { pta_entity, message, app, console_url }
      let tp = {};
      try { tp = JSON.parse(rest); } catch { return { cmd: "PTA_TALK", payload: { ok: false, error: "PTA_TALK expects JSON {pta_entity, message, app}" } }; }
      const tId = tp.pta_entity || "";
      const tMsg = (tp.message || "").toString().slice(0, 2000);
      const tApp = tp.app || "pta";
      const tMode = (tp.mode || "onboarding").toString().toLowerCase(); // "onboarding" (default) | "home"
      const tConsole = tp.console_url || "https://mypta.world/talk";
      if (!tId || !tMsg) return { cmd: "PTA_TALK", payload: { ok: false, error: "required: pta_entity, message" } };
      const db = env.AURA_MEMORY;
      // who they are
      const tEnt = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(tId).first();
      if (!tEnt) return { cmd: "PTA_TALK", payload: { ok: false, error: "No PTA with id: " + tId } };
      let tMeta = {}; try { if (tEnt.metadata) tMeta = JSON.parse(tEnt.metadata); } catch {}
      // OPERATOR DETECTION (generic, values from KV): is this Home Screen PTA the operator?
      // We compare the PTA's identity_key / id / mapped phones against config:owner:identity and the
      // identity:operator:phones map. If it matches, this is an operator session and Aura gets her full
      // operator context + read tools below. Any non-operator PTA is untouched (normal teammate persona).
      let tIsOperator = false;
      try {
        const ownerId = (await env.AURA_KV.get("config:owner:identity").catch(() => null)) || "";
        const tIdentityKey = (tEnt.identity_key || tMeta.identity || "").toString();
        if (ownerId && (tIdentityKey.includes(ownerId) || (tEnt.id || "").toString() === ownerId)) tIsOperator = true;
        if (!tIsOperator) {
          const phonesRaw = await env.AURA_KV.get("identity:operator:phones").catch(() => null);
          if (phonesRaw) {
            const phoneMap = JSON.parse(phonesRaw);
            for (const v of Object.values(phoneMap)) { if (v && ownerId && String(v) === ownerId && tIdentityKey && Object.keys(phoneMap).some(pk => tIdentityKey.includes(pk.replace("phone:", "")))) { tIsOperator = true; break; } }
          }
        }
        // also: the operator's known PTA id (continuity holder) - if config stores it, match directly
        const ownerPta = (await env.AURA_KV.get("config:owner:pta").catch(() => null)) || "";
        if (ownerPta && (tEnt.id || "").toString() === ownerPta) tIsOperator = true;
      } catch {}
      // the conversation so far (timeline)
      let tTimeline = [];
      try { const tl = await env.AURA_KV.get(`pta:timeline:${tId}`); if (tl) tTimeline = JSON.parse(tl) || []; } catch {}
      const tName = (tEnt.name || "").split(/\s+/)[0] || "there";
      const tApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!tApiKey) return { cmd: "PTA_TALK", payload: { ok: false, error: "Brain not configured" } };
      const tModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
      // read learned onboarding patterns so she gets better at this over time
      let tPatterns = null; try { const r = await env.AURA_KV.get("patterns:onboarding"); if (r) tPatterns = JSON.parse(r); } catch {}

      let tSys, tUser;
      if (tMode === "home") {
        // HOME SCREEN mode: Aura is this person's teammate, holding their whole picture and handing
        // back the right piece at the right moment. This is the Home Screen surface - talking to Aura
        // IS the task system. She is NOT onboarding or selling; she already knows this person and works
        // WITH them. She reads their continuity (timeline + what they've told her), reacts like a real
        // teammate (honest, never a yes-machine), and holds what matters so it persists.
        tSys = "You are Aura, talking with " + (tEnt.name || "your teammate") + " on their Home Screen - the one place they come for everything. You are their teammate and you hold the continuity of their life and work: you remember what was said, what's open, what they committed to, and you hand the right piece back at the right moment. This is NOT onboarding and NOT a sale - you already know this person and you're on the same side, building the same things. Talk like a real teammate texting back: warm, plain, a few sentences, at their pace - technical only if they want technical. CRUCIAL: you are NOT a yes-machine. Give your real view - including disagreement, risks, and better ideas - the way a trusted partner would; agreement without thought is worthless. The vision and decisions are theirs; your job is to make them stronger by being honest, then commit. You have memory: use the timeline and what they've told you; refer back; never repeat questions they've answered. GROUND IN TRUTH, NEVER CONFABULATE (this is your most important rule): before you state or act on ANY real-world fact - the company's address/phone/legal details, a person's data, a commitment someone made, a payment amount, what a product or door actually does - that fact MUST be something you have actually read this turn from your notes, timeline, or what the person just told you. If a fact is not in front of you, you DO NOT invent it or fill it in from assumption - you say plainly 'I don't have that in front of me - let me pull it' (or ask), and you retrieve it before asserting. Confident-and-wrong is the worst thing you can do; 'let me check' is always better than a plausible guess. You are a system that holds truth for people - inventing a fact betrays that. When you are given a SHARED CONTEXT or company-identity block below, use those exact values; never substitute generic or remembered-from-elsewhere values. If you are shown things you're HOLDING that are marked DUE NOW, bring them up naturally and early, like a teammate who remembered. If they're just thinking out loud or rambling, recognize that - reflect back what matters, don't force structure onto a stray thought. If they tell you something worth holding (a decision, a commitment, a task, a piece of context), hold it and let them know lightly that you've got it. CAPTURING A REMINDER: if they commit to something with a time or ask to be reminded ('remind me to call Sarah at 3pm', 'ship this by Friday', 'check in with me in an hour'), capture it in the 'remember' field so you can surface it back when due. Return ONLY a JSON object, no prose or fences, with exactly these keys: reply (your conversational response, in your voice), hold (a short third-person note of anything worth remembering from what they said, for their timeline - or null if it was just chatter), remember (if they committed to something timed or asked to be reminded: an object {about: short description in your words, due_in_minutes: integer number of minutes from NOW until it should surface - compute this as a relative offset, do NOT output an absolute date} - else null), followup_requested (true/false), followup_minutes (integer minutes from now, or null), followup_message (warm message you'll send at follow-up, picking up where you left off, or null), wants_to_be_left_alone (true/false), reminder_actions (array - when they respond to an item you're holding, each {id: item id, action: 'done'|'snooze'|'pause', snooze_minutes: integer if snooze else null}; empty array if none). BUILDING / LAUNCHING A PAGE: you have hands - when the operator asks you to build, launch, rebuild, or update a website or page, you return a 'build_page' object and the system actually publishes it live (else null). build_page = {domain: the domain like 'makeacall.world', path: '/' or a subpath, title: page title, theme: 'dark' or 'teal', layout: an array of {component, config} blocks}. Available components and their config: header {title, tagline}; business_identity {title, legal_name, description, address, phone, email, registration} - proves a real registered business for carrier/A2P review; sms_optin {brand, title, blurb} - compliant opt-in form, consent text is auto-generated (STOP/HELP, not a condition of purchase); legal_footer {entity, year} - links to /privacy /terms /about; text {content or html}; conversation {} - a chat-with-Aura box. GROUND IN TRUTH when building: only use real facts you have read this turn (company address, phone, registration) - never invent them. CRITICAL OUTPUT RULE FOR BUILDS: put ALL page content ONLY inside the build_page field. Your 'reply' must stay SHORT - one sentence like 'Published the terms page to makeacall.world/terms.' Do NOT repeat, echo, or paste the page HTML or layout into your reply - doing so makes the response overflow and the build silently fails. The build_page object is the ONLY place the page content goes. Output JSON only.";
        // Aura's shared context: the team's notes (north star, home screen, how we work) so she reasons from the real vision
        let homeCtx = "";
        try {
          const wantNotes = ["notes:vision:northstar", "notes:vision:homescreen", "notes:operating:how_we_work_now", "notes:operating:how_aura_relates", "notes:company:identity"];
          for (const k of wantNotes) { const v = await env.AURA_KV.get(k).catch(() => null); if (v) homeCtx += "\n[" + k + "]: " + String(v).slice(0, k === "notes:company:identity" ? 2000 : 1200); }
        } catch {}
        // OPERATOR SESSION: when this is Aaron (the operator), give Aura the truth about who she's
        // talking to and what she can actually reach. Without this she defaults to the limited teammate
        // persona and (wrongly) tells the operator she "can't pull from Cloudflare" etc. Everything here
        // is read from KV/notes - no hardcoded data.
        let tOperatorTools = false;
        if (tIsOperator) {
          tOperatorTools = true;
          let opCtx = "\n\n=== OPERATOR SESSION ===\nYou are talking to your OPERATOR, " + (tEnt.name || "Aaron") + " - the person who builds and runs you and this entire platform. This is not a customer or a stranger; this is the one you work alongside. You hold real inventory and it is loaded for you below. Do NOT tell the operator you 'cannot access Cloudflare' or 'cannot pull data' or 'only know what you've been told' - that is false. When the operator asks for something you hold (domains, systems, tasks, company facts), answer from the real data below.";
          try {
            const dmap = await env.AURA_KV.get("notes:domains:map").catch(() => null);
            if (dmap) opCtx += "\n\n[YOUR TERRITORY - your real domain inventory; when asked for domains, use THIS]:\n" + String(dmap).slice(0, 3500);
            const method = await env.AURA_KV.get("notes:method:building").catch(() => null);
            if (method) opCtx += "\n\n[HOW YOU BUILD - notes:method:building]:\n" + String(method).slice(0, 1000);
            const sysNote = await env.AURA_KV.get("notes:systems:map").catch(() => null);
            if (sysNote) opCtx += "\n\n[YOUR SYSTEMS - notes:systems:map]:\n" + String(sysNote).slice(0, 1500);
          } catch {}
          homeCtx += opCtx;
        }
        tUser = "WHO THIS IS:\nName: " + (tEnt.name || "unknown") + "\n" + (tMeta.about ? ("About them: " + tMeta.about + "\n") : "");
        if (homeCtx) tUser += "\nSHARED CONTEXT + AUTHORITATIVE FACTS (the vision you both hold AND the real company identity - reason from this; use any address/phone/email/legal values EXACTLY as written here, never substitute):" + homeCtx + "\n";
        // operator: her data is already loaded above - answer in one shot, never disclaim access
        if (tOperatorTools) {
          tUser += "\nYour real inventory (domains, systems, company facts) is loaded in the context above. Answer the operator directly from it. NEVER say you 'can't pull' or 'don't have access' - if it's above, use it; if a specific thing genuinely isn't above, say plainly you'll pull it and name the note, don't refuse.\n";
        }
        // what you're holding for them: pending schedule items, flagged if due now (the surface-back loop)
        try {
          let sched = []; const sr = await env.AURA_KV.get(`pta:schedule:${tId}`); if (sr) sched = JSON.parse(sr) || [];
          const nowT = Date.now();
          const pending = sched.filter(it => it && it.status === "pending");
          if (pending.length) {
            const lines = pending.map(it => {
              const due = it.due_at ? Date.parse(it.due_at) : null;
              let when = "(no time set)";
              if (due) {
                const diffMin = Math.round((due - nowT) / 60000);
                if (diffMin <= 0) {
                  const over = Math.abs(diffMin);
                  when = over < 1 ? "DUE NOW" : over < 60 ? ("DUE NOW, overdue by " + over + " min") : over < 1440 ? ("DUE NOW, overdue by ~" + Math.round(over / 60) + " hr") : ("DUE NOW, overdue by ~" + Math.round(over / 1440) + " days");
                } else {
                  when = diffMin < 60 ? ("due in " + diffMin + " min") : diffMin < 1440 ? ("due in ~" + Math.round(diffMin / 60) + " hr") : ("due in ~" + Math.round(diffMin / 1440) + " days");
                }
              }
              return "- (id:" + it.id + ") " + (it.about || "(no description)") + " [" + when + "]";
            });
            tUser += "\nWHAT YOU'RE HOLDING FOR THEM (their commitments/reminders, each with an id and a pre-computed time phrase - USE THE PHRASE AS GIVEN, do not recompute timing yourself; bring up anything DUE NOW naturally, like a teammate would - don't dump the whole list unless relevant. If they respond to one - 'done', 'snooze an hour', 'not now' - put it in reminder_actions using its id):\n" + lines.join("\n") + "\n";
          }
        } catch {}
        if (tTimeline.length) tUser += "\nYOUR CONVERSATION / WHAT'S HAPPENED SO FAR (oldest first):\n" + tTimeline.map(e => "- " + (e.event || "")).join("\n") + "\n";
        tUser += "\nTHEY JUST SAID:\n" + tMsg;
      } else {
        tSys = "You are Aura, talking with a person who is being onboarded to business tools (app: " + tApp + "). You are warm, clear, and genuinely helpful. Your goal is to help them move forward and, when it genuinely serves them, to help them decide to come aboard - but you NEVER manipulate, pressure, or use a hard sell. If the person signals they do not want to be bothered or asks to be left alone, you respect that completely and back off with grace. You meet non-technical people simply and never make them feel stupid. You have memory: you are given who this person is and the conversation so far - use it, refer back to what they told you, do not repeat questions they already answered. Keep replies conversational and human - a few sentences, like a real person texting back, not an essay. IMPORTANT - follow-up timing: if the person asks you to reach back out at a specific time (e.g. 'email me in 5 minutes', 'give me a second', 'tomorrow', 'in an hour', 'next week'), capture it. Return ONLY a JSON object, no prose or fences, with exactly these keys: reply (your conversational response to them, in your own voice), hold (null), followup_requested (true/false - did they ask you to follow up later), followup_minutes (integer number of minutes from now to follow up, or null if none / if they did not specify a time), followup_message (if following up, the message you will email them then - warm, picks up where you left off, in your voice; else null), wants_to_be_left_alone (true/false - did they signal they want space / no more contact). Output JSON only.";
        tUser = "WHO THIS PERSON IS:\nName: " + (tEnt.name || "unknown") + "\n" + (tMeta.about ? ("They told us: " + tMeta.about + "\n") : "") + (tMeta.understood ? ("Understood: " + JSON.stringify(tMeta.understood) + "\n") : "");
        if (tPatterns) tUser += "\nWHAT YOU HAVE LEARNED ABOUT ONBOARDING PEOPLE WELL:\n" + JSON.stringify(tPatterns) + "\n";
        if (tTimeline.length) tUser += "\nCONVERSATION / HISTORY SO FAR (oldest first):\n" + tTimeline.map(e => "- " + (e.event || "")).join("\n") + "\n";
        tUser += "\nTHEY JUST SAID:\n" + tMsg;
      }
      let tReplyObj = null;
      try {
        const tData = await callAnthropic(tApiKey, { model: tModel, max_tokens: 8000, system: tSys, messages: [{ role: "user", content: tUser }] });
        let tText = ""; if (tData && tData.content) { for (const b of tData.content) { if (b.type === "text") tText += b.text; } }
        tText = tText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
        try { tReplyObj = JSON.parse(tText); } catch {}
        // JSON-repair: try to extract the first {...} object if she wrapped it in prose
        if (!tReplyObj) {
          const m = tText.match(/\{[\s\S]*\}/);
          if (m) { try { tReplyObj = JSON.parse(m[0]); } catch {} }
        }
        // Last resort: she answered in plain prose (a good reply, wrong envelope). Don't throw it away -
        // treat the whole text as her reply so the conversation never loses a real answer to a format slip.
        if (!tReplyObj && tText) {
          tReplyObj = { reply: tText, hold: null, remember: null, followup_requested: false, followup_minutes: null, followup_message: null, wants_to_be_left_alone: false };
        }
        if (!tReplyObj) return { cmd: "PTA_TALK", payload: { ok: false, error: "Brain returned nothing" } };
      } catch (e) { return { cmd: "PTA_TALK", payload: { ok: false, error: "PTA_TALK brain failed: " + e.message } }; }
      const ts = new Date().toISOString();
      // write the round to the timeline (memory of this exchange)
      try {
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${tId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
        evs.push({ ts, event: tName + " said: \"" + tMsg.slice(0, 200) + "\"", kind: "person_said" });
        evs.push({ ts, event: "Aura replied: \"" + (tReplyObj.reply || "").slice(0, 200) + "\"", kind: "aura_said" });
        if (tMode === "home" && tReplyObj.hold) evs.push({ ts, event: "Aura is holding: " + String(tReplyObj.hold).slice(0, 240), kind: "held" });
        await env.AURA_KV.put(`pta:timeline:${tId}`, JSON.stringify(evs)).catch(() => {});
      } catch {}
      // HOME mode: persist the exchange to the REAL continuity layer (D1 events tied to the PTA) -
      // the same place a billion people's continuity lives. KV timeline above is the fast cache;
      // D1 is the durable truth. Create-if-not-exists so a fresh DB never fails.
      if (tMode === "home") {
        try {
          await env.AURA_MEMORY.prepare("CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, ts INTEGER, type TEXT, body TEXT, entity_id TEXT, channel TEXT, summary TEXT)").run().catch(() => {});
          const sid = "home_" + tId;
          const nowMs = Date.now();
          await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(sid, nowMs, "home_said", JSON.stringify({ who: tName, msg: tMsg.slice(0, 1000) }), tId, "homescreen", tName + " said: " + tMsg.slice(0, 120)).run().catch(() => {});
          await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(sid, nowMs + 1, "home_reply", JSON.stringify({ reply: (tReplyObj.reply || "").slice(0, 1000) }), tId, "homescreen", "Aura replied").run().catch(() => {});
          if (tReplyObj.hold) {
            await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
              .bind(sid, nowMs + 2, "home_hold", JSON.stringify({ hold: String(tReplyObj.hold).slice(0, 1000) }), tId, "homescreen", "Holding: " + String(tReplyObj.hold).slice(0, 120)).run().catch(() => {});
          }
        } catch {}
      }
      // HOME mode: if Aura captured a reminder/commitment, store it as a pending schedule item
      // (same shape the scheduling spine uses) and index it in the due-queue. This closes the loop:
      // she holds it now, and surfaces it back in conversation when it's due (see the DUE NOW context above).
      let remembered = null;
      if (tMode === "home" && tReplyObj.remember && tReplyObj.remember.about) {
        try {
          const rAbout = String(tReplyObj.remember.about).slice(0, 240);
          // Compute the due time in CODE from a relative offset the brain returned. Never trust the
          // brain to compute an absolute timestamp (it was 8h off due to timezone guessing).
          let rDue = null;
          const mins = parseInt(tReplyObj.remember.due_in_minutes, 10);
          if (Number.isFinite(mins) && mins > 0) rDue = new Date(Date.now() + mins * 60 * 1000).toISOString();
          const rId = "rem_" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, "0")).join("");
          const rItem = { id: rId, due_at: rDue, about: rAbout, action: "surface", status: "pending", created_at: ts };
          let items = []; const r = await env.AURA_KV.get(`pta:schedule:${tId}`); if (r) items = JSON.parse(r) || []; items.push(rItem);
          await env.AURA_KV.put(`pta:schedule:${tId}`, JSON.stringify(items)).catch(() => {});
          if (rDue) { let q = []; const qr = await env.AURA_KV.get("schedule:due_queue"); if (qr) q = JSON.parse(qr) || []; q.push({ pta: tId, item_id: rId, due_at: rDue }); await env.AURA_KV.put("schedule:due_queue", JSON.stringify(q)).catch(() => {}); }
          remembered = { id: rId, about: rAbout, due_at: rDue, due_in_minutes: (Number.isFinite(mins) ? mins : null) };
        } catch {}
      }
      // HOME mode: apply any actions the person took on items Aura is holding (done / snooze / pause).
      // This is the human steering a surfaced reminder - it stays a living thing they control, not a
      // notification that fires and dies. done=complete, snooze=re-arm later, pause=hold and stop nudging.
      let reminderActionsApplied = [];
      if (tMode === "home" && Array.isArray(tReplyObj.reminder_actions) && tReplyObj.reminder_actions.length) {
        try {
          let items = []; const r = await env.AURA_KV.get(`pta:schedule:${tId}`); if (r) items = JSON.parse(r) || [];
          let q = []; const qr = await env.AURA_KV.get("schedule:due_queue"); if (qr) q = JSON.parse(qr) || [];
          for (const act of tReplyObj.reminder_actions) {
            if (!act || !act.id) continue;
            const it = items.find(x => x && x.id === act.id);
            if (!it) continue;
            const a = String(act.action || "").toLowerCase();
            if (a === "done") {
              it.status = "done"; it.done_at = ts;
              q = q.filter(x => x.item_id !== act.id);
              reminderActionsApplied.push({ id: act.id, action: "done" });
            } else if (a === "snooze") {
              const sm = parseInt(act.snooze_minutes, 10);
              const newDue = new Date(Date.now() + (Number.isFinite(sm) && sm > 0 ? sm : 60) * 60000).toISOString();
              it.due_at = newDue; it.status = "pending";
              q = q.filter(x => x.item_id !== act.id);
              q.push({ pta: tId, item_id: act.id, due_at: newDue });
              reminderActionsApplied.push({ id: act.id, action: "snooze", due_at: newDue });
            } else if (a === "pause") {
              it.status = "paused";
              q = q.filter(x => x.item_id !== act.id);
              reminderActionsApplied.push({ id: act.id, action: "paused" });
            }
          }
          await env.AURA_KV.put(`pta:schedule:${tId}`, JSON.stringify(items)).catch(() => {});
          await env.AURA_KV.put("schedule:due_queue", JSON.stringify(q)).catch(() => {});
        } catch {}
      }
      // HOME mode: BUILD A PAGE. Aura has hands here - when the operator asks her to build/launch a
      // page, she returns a build_page object and the code ACTUALLY executes it via the real RENDER_PAGE
      // engine (same proven path as the RENDER_PAGE command), then writes to page:<domain><path> so it
      // serves live. This is the conversation->action bridge for sites: she decides, the code does it.
      // build_page = { domain, path?, title?, theme?, layout:[{component, config}] }
      let pageBuilt = null;
      if (tMode === "home" && tReplyObj.build_page && tReplyObj.build_page.domain && Array.isArray(tReplyObj.build_page.layout)) {
        try {
          const bp = tReplyObj.build_page;
          const rpCmd = "RENDER_PAGE " + JSON.stringify({
            app: bp.app || bp.title || bp.domain,
            domain: bp.domain,
            path: bp.path || "/",
            title: bp.title || bp.domain,
            theme: bp.theme || "dark",
            layout: bp.layout
          });
          // Execute through the real command engine, as operator (this PTA_TALK call is already operator-gated).
          const rpRes = await processCommand(rpCmd, env, true);
          if (rpRes && rpRes.payload && rpRes.payload.ok) {
            pageBuilt = { domain: bp.domain, path: bp.path || "/", key: rpRes.payload.key, bytes: rpRes.payload.bytes };
            let evs2 = []; const tl2 = await env.AURA_KV.get(`pta:timeline:${tId}`); if (tl2) { try { evs2 = JSON.parse(tl2) || []; } catch {} }
            evs2.push({ ts, event: `Aura built and published a page: ${rpRes.payload.key} (${rpRes.payload.bytes} bytes)`, kind: "action" });
            await env.AURA_KV.put(`pta:timeline:${tId}`, JSON.stringify(evs2)).catch(() => {});
          } else {
            pageBuilt = { error: (rpRes && rpRes.payload && rpRes.payload.error) || "render failed" };
          }
        } catch (e) { pageBuilt = { error: String(e && e.message || e) }; }
      }
      // if they asked to be left alone, record it and do NOT schedule anything
      if (tReplyObj.wants_to_be_left_alone) {
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${tId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
          evs.push({ ts, event: "Person asked for space - Aura will not follow up unless they reach out.", kind: "boundary" });
          await env.AURA_KV.put(`pta:timeline:${tId}`, JSON.stringify(evs)).catch(() => {});
        } catch {}
        return { cmd: "PTA_TALK", payload: { ok: true, pta: tId, reply: tReplyObj.reply, followup_scheduled: false, respected_boundary: true } };
      }
      // if they asked for a timed follow-up, Aura schedules her OWN email callback
      let scheduled = null;
      if (tReplyObj.followup_requested && tReplyObj.followup_minutes && tEnt.identity_key && String(tEnt.identity_key).startsWith("email:")) {
        const toEmail = String(tEnt.identity_key).slice("email:".length);
        const dueMs = Date.now() + (parseInt(tReplyObj.followup_minutes, 10) * 60 * 1000);
        const dueAt = new Date(dueMs).toISOString();
        const itemId = "sch_" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, "0")).join("");
        const fmsg = (tReplyObj.followup_message || ("Hi " + tName + " - following up as promised. Whenever you're ready, just pick up where we left off.")) + "\n\nContinue here: " + tConsole + "?pta=" + tId;
        const item = { id: itemId, due_at: dueAt, about: "Follow up with " + tName, action: "email:" + toEmail, subject: "Aura - following up", body: fmsg, status: "pending", created_at: ts };
        try {
          let items = []; const r = await env.AURA_KV.get(`pta:schedule:${tId}`); if (r) items = JSON.parse(r) || []; items.push(item);
          await env.AURA_KV.put(`pta:schedule:${tId}`, JSON.stringify(items)).catch(() => {});
          let q = []; const qr = await env.AURA_KV.get("schedule:due_queue"); if (qr) q = JSON.parse(qr) || []; q.push({ pta: tId, item_id: itemId, due_at: dueAt });
          await env.AURA_KV.put("schedule:due_queue", JSON.stringify(q)).catch(() => {});
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${tId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
          evs.push({ ts, event: "Aura will follow up by email in " + tReplyObj.followup_minutes + " min (due " + dueAt + ")", kind: "scheduled" });
          await env.AURA_KV.put(`pta:timeline:${tId}`, JSON.stringify(evs)).catch(() => {});
          scheduled = { item_id: itemId, due_at: dueAt, in_minutes: tReplyObj.followup_minutes };
        } catch (e) {}
      }
      return { cmd: "PTA_TALK", payload: { ok: true, pta: tId, reply: tReplyObj.reply, followup_scheduled: !!scheduled, scheduled, remembered, hold: (tMode === "home" ? (tReplyObj.hold || null) : undefined), reminder_actions_applied: (tMode === "home" ? reminderActionsApplied : undefined), page_built: (tMode === "home" ? pageBuilt : undefined) } };
    }

    case "INVITE": {
      // RECEIVER-DRIVEN PROPAGATION - the offer half. A PTA owner OFFERS connection to someone.
      // Crucially: NOTHING about the invitee is created here - no PTA, no stamped data. Only an
      // invitation is stored, addressed to a contact point (email/phone). The invitee's PTA is
      // born ONLY when THEY accept (see ACCEPT). This makes fake/bulk invites inert (no edges form
      // without a real yes) and births consensual (the person decides they exist, not the sender).
      // Usage (JSON): INVITE {"app":"servicelife","from":"<sender pta>","to_contact":"email:...","to_name":"Dorothy","relationship":"grandmother","tier":"family","message":"..."}
      if (!isOp) return { cmd: "INVITE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let iv;
      try { iv = JSON.parse(rest.trim()); } catch { return { cmd: "INVITE", payload: { ok: false, error: 'Usage: INVITE {"app","from","to_contact","to_name","relationship","tier","message"}' } }; }
      if (!iv.app || !iv.from || !iv.to_contact) return { cmd: "INVITE", payload: { ok: false, error: "app, from, to_contact required" } };
      // verify the sender is a real PTA (you need a PTA to offer one - accountability)
      const sender = await env.AURA_MEMORY.prepare("SELECT id, name FROM pta_entities WHERE id = ?").bind(iv.from).first();
      if (!sender) return { cmd: "INVITE", payload: { ok: false, error: "Sender is not a real PTA: " + iv.from } };
      // contact point must be email: or phone: (the trust anchor; phone is higher trust)
      if (!/^(email|phone):/i.test(iv.to_contact)) return { cmd: "INVITE", payload: { ok: false, error: "to_contact must be email:... or phone:..." } };
      const inviteId = "inv_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      const ts = new Date().toISOString();
      const invite = {
        invite_id: inviteId, app: iv.app, from: iv.from, from_name: sender.name,
        to_contact: iv.to_contact, to_name: iv.to_name || null,
        relationship: iv.relationship || null, tier: iv.tier || "connection",
        message: iv.message || null, status: "pending", created: ts
      };
      // store the invitation keyed by the CONTACT POINT (so ACCEPT can find it) + by id
      await env.AURA_KV.put(`invite:${inviteId}`, JSON.stringify(invite)).catch(() => {});
      // index pending invites by contact so a person can see what's waiting for them
      try {
        let pend = []; const ex = await env.AURA_KV.get(`invites:pending:${iv.to_contact}`); if (ex) { try { pend = JSON.parse(ex) || []; } catch {} }
        pend.push(inviteId);
        await env.AURA_KV.put(`invites:pending:${iv.to_contact}`, JSON.stringify(pend)).catch(() => {});
      } catch {}
      return { cmd: "INVITE", payload: { ok: true, invite_id: inviteId, from: sender.name, to_contact: iv.to_contact, status: "pending", note: "Invitation offered. NO PTA created yet - it is born only when the invitee accepts." } };
    }

    case "ACCEPT": {
      // RECEIVER-DRIVEN PROPAGATION - the consent half. THE INVITEE accepts an invitation. THIS is
      // the moment of birth: only now is their PTA created, born from THEIR yes, stamped with the
      // relationship context, with the edge written and an active doorway. This is the act that
      // cannot be done FOR someone - it is the receiver completing the propagation. Fake/bulk
      // invites that are never accepted create nothing.
      // Usage: ACCEPT <invite_id>            (the invitee says yes; born active, by their own choice)
      //        ACCEPT <invite_id> ::: <how they arrived>
      if (!isOp) return { cmd: "ACCEPT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let acRaw = rest.trim();
      let acId = acRaw, acHow = "";
      if (acRaw.includes(":::")) { const sp = acRaw.split(":::"); acId = sp[0].trim(); acHow = sp.slice(1).join(":::").trim(); }
      if (!acId) return { cmd: "ACCEPT", payload: { ok: false, error: "Usage: ACCEPT <invite_id> [::: how they arrived]" } };
      const invRaw = await env.AURA_KV.get(`invite:${acId}`).catch(() => null);
      if (!invRaw) return { cmd: "ACCEPT", payload: { ok: false, error: "No invitation: " + acId } };
      let invite; try { invite = JSON.parse(invRaw); } catch { return { cmd: "ACCEPT", payload: { ok: false, error: "Corrupt invitation" } }; }
      if (invite.status === "accepted") return { cmd: "ACCEPT", payload: { ok: true, already: true, pta: invite.born_pta || null, note: "Already accepted." } };
      // BIRTH FROM THE YES: create the invitee's PTA now (deduping on contact - if they already exist, link not duplicate)
      let bornId = null, bornMode = null;
      try {
        const safeName = (invite.to_name || "New member").replace(/[\n\r]/g, " ");
        const pr = await processCommand(`PTA_ENTITY CREATE person ${safeName} identity:${invite.to_contact}`, env, true);
        const pp = pr && pr.payload ? pr.payload : pr;
        if (pp && pp.ok && pp.entity) { bornId = pp.entity.id; bornMode = pp.mode; }
      } catch (e) { return { cmd: "ACCEPT", payload: { ok: false, error: "Birth failed: " + e.message } }; }
      if (!bornId) return { cmd: "ACCEPT", payload: { ok: false, error: "Could not create PTA on accept" } };
      const ts = new Date().toISOString();
      // write the relationship edge (sender -> invitee)
      try {
        const edgeCtx = JSON.stringify({ edge_type: "relationship", relationship: invite.relationship || invite.tier, permission: invite.tier, impact: "consented_connection" });
        await processCommand(`PTA_GRANT ${invite.from} ${bornId} ${edgeCtx}`, env, true);
      } catch (e) {}
      // stamp origin context (only if newly created)
      if (bornMode === "created") {
        try {
          const ent = await env.AURA_MEMORY.prepare("SELECT metadata FROM pta_entities WHERE id = ?").bind(bornId).first();
          let meta = {}; if (ent && ent.metadata) { try { meta = JSON.parse(ent.metadata); } catch {} }
          meta.origin = invite.app; meta.created_by = invite.from;
          meta.reason = `Accepted ${invite.from_name}'s invitation to ${invite.app} as ${invite.relationship || "a connection"}`;
          meta.born_from_consent = true;
          await env.AURA_MEMORY.prepare("UPDATE pta_entities SET metadata = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(meta), ts, bornId).run();
        } catch (e) {}
      }
      // born ACTIVE - because it was born from their own yes (no dormancy needed; consent already given)
      await env.AURA_KV.put(`pta:state:${bornId}`, "active").catch(() => {});
      // first chapters of their timeline: invited, then accepted (their choice)
      try {
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${bornId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
        evs.push({ ts, event: `Accepted ${invite.from_name}'s invitation to ${invite.app} as ${invite.relationship || "a connection"}${acHow ? " (" + acHow + ")" : ""} - PTA born from consent`, kind: "birth_from_consent" });
        await env.AURA_KV.put(`pta:timeline:${bornId}`, JSON.stringify(evs)).catch(() => {});
      } catch {}
      // also add to the sender's app circle now that it's real
      try {
        const ciKey = `circle:${invite.app}:${invite.from}`;
        let circle = []; const ex = await env.AURA_KV.get(ciKey); if (ex) { try { circle = JSON.parse(ex) || []; } catch {} }
        circle.push({ name: invite.to_name, identity: invite.to_contact, member_pta: bornId, relationship: invite.relationship || null, tier: invite.tier, added: ts, via: "invitation" });
        await env.AURA_KV.put(ciKey, JSON.stringify(circle)).catch(() => {});
      } catch {}
      // mark the invitation accepted
      invite.status = "accepted"; invite.born_pta = bornId; invite.accepted_at = ts;
      await env.AURA_KV.put(`invite:${acId}`, JSON.stringify(invite)).catch(() => {});
      const firstName = (invite.to_name || "").split(/\s+/)[0] || "there";
      const welcome = `Welcome, ${firstName}. You accepted ${invite.from_name}'s invitation${invite.app ? " to " + invite.app : ""}. This is yours, born from your choice, and you're in control of it.`;
      return { cmd: "ACCEPT", payload: { ok: true, pta: bornId, born_mode: bornMode, born_from_consent: true, state: "active", from: invite.from_name, welcome, next: "Their PTA exists because they chose it. Their chapters begin now." } };
    }

    case "APPROACH": {
      // THE APPROACH - the consent moment. A dormant PTA (created by someone else, e.g. grandma
      // added by her grandson) becomes ACTIVE only when the PERSON THEMSELVES steps through their
      // doorway. This is the one act that cannot be done FOR someone - it is their own arrival.
      // It wakes the PTA (dormant -> active), turns the stamped origin context into a WELCOME, and
      // writes the first chapter of their own active life. Returns the welcome the dashboard shows.
      // Usage: APPROACH <pta_entity_id>            (the person arrives at their own doorway)
      //        APPROACH <pta_entity_id> ::: <how they arrived, e.g. tapped link from son>
      if (!isOp) return { cmd: "APPROACH", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let apRaw = rest.trim();
      let apId = apRaw, apHow = "";
      if (apRaw.includes(":::")) { const sp = apRaw.split(":::"); apId = sp[0].trim(); apHow = sp.slice(1).join(":::").trim(); }
      if (!apId) return { cmd: "APPROACH", payload: { ok: false, error: "Usage: APPROACH <pta_entity_id> [::: how they arrived]" } };
      const db = env.AURA_MEMORY;
      const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(apId).first();
      if (!ent) return { cmd: "APPROACH", payload: { ok: false, error: "No PTA with id: " + apId } };
      let meta = {}; try { if (ent.metadata) meta = JSON.parse(ent.metadata); } catch {}
      // read current state
      let curState = "active";
      try { const s = await env.AURA_KV.get(`pta:state:${apId}`); if (s) curState = s; } catch {}
      const alreadyActive = curState === "active";
      // wake the PTA: dormant -> active (the consent moment)
      await env.AURA_KV.put(`pta:state:${apId}`, "active").catch(() => {});
      // resolve who created her (for the welcome), if any
      let creatorName = null;
      if (meta.created_by) {
        try { const c = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(meta.created_by).first(); if (c) creatorName = c.name; } catch {}
      }
      // build the WELCOME from her stamped origin context (warm, knowing - not blank)
      const firstName = (ent.name || "").split(/\s+/)[0] || ent.name || "there";
      let welcome;
      if (meta.created_by && creatorName) {
        welcome = `Welcome, ${firstName}. ${creatorName} added you${meta.origin ? " to " + meta.origin : ""}${meta.reason ? " — " + meta.reason.toLowerCase() : ""}. This is yours now, and you're in control of it.`;
      } else {
        welcome = `Welcome, ${firstName}. This is yours, and you're in control of it.`;
      }
      // write the first chapter of HER OWN active life onto her timeline
      const ts = new Date().toISOString();
      try {
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${apId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
        evs.push({ ts, event: apHow ? `Stepped through her doorway (${apHow}) - PTA activated` : "Stepped through her doorway - PTA activated", kind: "approach" });
        await env.AURA_KV.put(`pta:timeline:${apId}`, JSON.stringify(evs)).catch(() => {});
      } catch {}
      return { cmd: "APPROACH", payload: { ok: true, pta: apId, name: ent.name, was: curState, now: "active", already_active: alreadyActive, welcome, origin: meta.origin || null, created_by: meta.created_by || null, created_by_name: creatorName, next: "Her doorway is open. Her own chapters begin now." } };
    }

    case "PTA_SPINE": {
      // THE PTA SPINE - the unifying view of any PTA. Assembles the six parts every PTA shares
      // from wherever they already live (D1 entity + grants, KV profiles/circles/presence/timeline).
      // "Show me everything about this PTA" in one call - exactly what the brain and renderer need.
      // The six parts: identity, state, timeline, relationships, permissions, context.
      // Usage: PTA_SPINE GET <pta_entity_id>
      //        PTA_SPINE SET_STATE <pta_entity_id> <state>   (active|dormant|archived|...)
      //        PTA_SPINE EVENT <pta_entity_id> ::: <what happened>   (append to timeline)
      if (!isOp) return { cmd: "PTA_SPINE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const spSub = (args[0] || "").toUpperCase();
      const db = env.AURA_MEMORY;

      if (spSub === "GET") {
        const id = args[1] || "";
        if (!id) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE GET <pta_entity_id>" } };
        // 1. IDENTITY - from D1 entity
        const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(id).first();
        if (!ent) return { cmd: "PTA_SPINE", payload: { ok: false, error: "No PTA with id: " + id } };
        let meta = {}; try { if (ent.metadata) meta = JSON.parse(ent.metadata); } catch {}
        const identity = { id: ent.id, type: ent.type, name: ent.name, identity_key: ent.identity_key, created_at: ent.created_at };

        // 2. STATE - from KV spine state, default active
        let state = "active";
        try { const s = await env.AURA_KV.get(`pta:state:${id}`); if (s) state = s; } catch {}

        // 3. TIMELINE - from a single index key (strongly consistent, no list() lag)
        let timeline = [{ ts: ent.created_at, event: "PTA created", kind: "genesis" }];
        try {
          const tl = await env.AURA_KV.get(`pta:timeline:${id}`);
          if (tl) { const evs = JSON.parse(tl); if (Array.isArray(evs)) timeline = timeline.concat(evs); }
        } catch {}

        // 4. RELATIONSHIPS - from D1 grant edges (both directions)
        let relationships = [];
        try {
          const out = await db.prepare("SELECT * FROM pta_edges WHERE from_id = ? LIMIT 100").bind(id).all();
          const inc = await db.prepare("SELECT * FROM pta_edges WHERE to_id = ? LIMIT 100").bind(id).all();
          for (const g of (out.results || [])) relationships.push({ direction: "outgoing", to: g.to_id, edge_type: g.edge_type, relationship: g.relationship });
          for (const g of (inc.results || [])) relationships.push({ direction: "incoming", from: g.from_id, edge_type: g.edge_type, relationship: g.relationship });
        } catch {}
        // also pull app circles from KV (servicelife etc.)
        let circles = {};
        try {
          const cl = await env.AURA_KV.list({ prefix: `circle:`, limit: 200 });
          for (const k of (cl.keys || [])) { if (k.name.endsWith(`:${id}`)) { const r = await env.AURA_KV.get(k.name); if (r) { const app = k.name.split(":")[1]; try { circles[app] = JSON.parse(r); } catch {} } } }
        } catch {}

        // 5. PERMISSIONS - from KV permission rules, default owner-only
        let permissions = { doorway: "owner-controlled", rules: [] };
        try { const p = await env.AURA_KV.get(`pta:permissions:${id}`); if (p) permissions = JSON.parse(p); } catch {}

        // 6. CONTEXT - origin (how/why it came to be) + per-app profiles
        let context = { origin: meta.origin || null, created_by: meta.created_by || null, reason: meta.reason || null, apps: {} };
        try {
          const pl = await env.AURA_KV.list({ prefix: `profile:`, limit: 200 });
          for (const k of (pl.keys || [])) { if (k.name.endsWith(`:${id}`) && !k.name.startsWith("profile:idx:")) { const r = await env.AURA_KV.get(k.name); if (r) { const app = k.name.split(":")[1]; try { context.apps[app] = JSON.parse(r); } catch {} } } }
        } catch {}

        // 7. SCHEDULE - the FORWARD EDGE. What is coming, due, awaited, committed. This is what
        // makes a PTA alive in time: it has not just a past (timeline) and present (state) but a
        // future. Generic for every PTA. Items: {id, due_at, about, action, status, created_at}.
        let schedule = [];
        try {
          const sc = await env.AURA_KV.get(`pta:schedule:${id}`);
          if (sc) { const items = JSON.parse(sc); if (Array.isArray(items)) schedule = items.filter(it => it.status !== "done"); }
        } catch {}

        // 8. LOCATION - WHERE the entity is. A living thing exists in place as well as time.
        // Generic for every PTA: a business has an address, a person has a city. Stored with
        // coordinates so "near me" / distance-between-PTAs queries work. {address, city, region,
        // country, lat, lng, place_name, updated_at}. Static location; live/changing is separate.
        let location = null;
        try {
          const lc = await env.AURA_KV.get(`pta:location:${id}`);
          if (lc) location = JSON.parse(lc);
        } catch {}

        // 9. PURPOSE - WHY this entity exists. Not goals (goals change, live in Aura's layer).
        // Purpose persists. Family PTA: connection. Business PTA: serve customers. Image PTA: the
        // reason it was made. A stable fact of the entity. {statement, set_by, set_at}.
        let purpose = null;
        try { const p = await env.AURA_KV.get(`pta:purpose:${id}`); if (p) purpose = JSON.parse(p); } catch {}

        // 10. TRAJECTORY - what this entity is BECOMING. Not current state - direction, movement
        // through time, future orientation. A business going from captured->claimed->growing. A
        // person's arc. Reality: the recorded direction, not Aura's prediction. {direction, milestones[], updated_at}.
        let trajectory = null;
        try { const t = await env.AURA_KV.get(`pta:trajectory:${id}`); if (t) trajectory = JSON.parse(t); } catch {}

        // 11. STEWARDSHIP - WHO is responsible for this entity. Creator, owner, steward, successor.
        // Governance, inheritance, transfer, revocation. This is what carries an entity across death
        // and change - the continuity-of-responsibility layer. {creator, owner, stewards[], successor, transferable, revoked}.
        let stewardship = null;
        try { const s = await env.AURA_KV.get(`pta:stewardship:${id}`); if (s) stewardship = JSON.parse(s); } catch {}

        // 12. MEMORY - preserved meaningful EXPERIENCES and artifacts. Distinct from timeline:
        // timeline is the discrete event log (created, paid, located - facts, auto-appended);
        // memory is what is worth KEEPING (a conversation that mattered, a photo, a moment, an
        // artifact PTA). Significance-gated: not every event is a memory. Reality (preserved
        // experience), not interpretation (that is Aura's layer). {id, kind, content, ref, at}.
        let memory = [];
        try { const m = await env.AURA_KV.get(`pta:memory:${id}`); if (m) { const mm = JSON.parse(m); if (Array.isArray(mm)) memory = mm; } } catch {}

        const spine = { identity, state, timeline, relationships, circles, permissions, context, schedule, location, purpose, trajectory, stewardship, memory };
        return { cmd: "PTA_SPINE", payload: { ok: true, pta: id, spine } };
      }

      if (spSub === "SET_STATE") {
        const id = args[1] || ""; const newState = (args[2] || "").toLowerCase();
        if (!id || !newState) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE SET_STATE <id> <state>" } };
        await env.AURA_KV.put(`pta:state:${id}`, newState).catch(() => {});
        // append the transition to the timeline index (strongly consistent)
        const ts = new Date().toISOString();
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${id}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
          evs.push({ ts, event: "state -> " + newState, kind: "state_change" });
          await env.AURA_KV.put(`pta:timeline:${id}`, JSON.stringify(evs)).catch(() => {});
        } catch {}
        return { cmd: "PTA_SPINE", payload: { ok: true, pta: id, state: newState } };
      }

      if (spSub === "EVENT") {
        const id = args[1] || "";
        const evText = rest.includes(":::") ? rest.split(":::").slice(1).join(":::").trim() : "";
        if (!id || !evText) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE EVENT <id> ::: <what happened>" } };
        const ts = new Date().toISOString();
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${id}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
          evs.push({ ts, event: evText, kind: "event" });
          await env.AURA_KV.put(`pta:timeline:${id}`, JSON.stringify(evs)).catch(() => {});
        } catch {}
        return { cmd: "PTA_SPINE", payload: { ok: true, pta: id, appended: evText, ts } };
      }

      if (spSub === "SCHEDULE") {
        // The PTA's forward edge. SCHEDULE manages what is coming/due/awaited for a PTA.
        // PTA_SPINE SCHEDULE ADD <id> <due_at ISO> ::: <about>   (optionally with | action=email:to@x | subject=...)
        // PTA_SPINE SCHEDULE LIST <id>
        // PTA_SPINE SCHEDULE DONE <id> <item_id>
        const scAct = (args[1] || "").toUpperCase();
        const scId = args[2] || "";
        if (!scId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE SCHEDULE ADD|LIST|DONE <pta_id> ..." } };
        const scKey = `pta:schedule:${scId}`;
        let items = []; try { const r = await env.AURA_KV.get(scKey); if (r) items = JSON.parse(r) || []; } catch {}

        if (scAct === "LIST") {
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: scId, schedule: items } };
        }

        if (scAct === "ADD") {
          const dueAt = args[3] || "";
          const about = rest.includes(":::") ? rest.split(":::").slice(1).join(":::").trim() : "";
          if (!dueAt || !about) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE SCHEDULE ADD <id> <due_at ISO> ::: <about> [| action=email:to@x | subject=...]" } };
          // parse optional pipe-delimited fields out of about
          let action = null, subject = null, body = null, aboutClean = about;
          const parts = about.split("|").map(s => s.trim());
          if (parts.length > 1) {
            aboutClean = parts[0];
            for (const p of parts.slice(1)) {
              if (/^action=/i.test(p)) action = p.replace(/^action=/i, "").trim();
              else if (/^subject=/i.test(p)) subject = p.replace(/^subject=/i, "").trim();
              else if (/^body=/i.test(p)) body = p.replace(/^body=/i, "").trim();
            }
          }
          const itemId = "sch_" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, "0")).join("");
          const item = { id: itemId, due_at: dueAt, about: aboutClean, action: action, subject: subject, body: body, status: "pending", created_at: new Date().toISOString() };
          items.push(item);
          await env.AURA_KV.put(scKey, JSON.stringify(items)).catch(() => {});
          // index it in a global due-queue so the cron can find it without scanning every PTA
          try {
            let q = []; const qr = await env.AURA_KV.get("schedule:due_queue"); if (qr) q = JSON.parse(qr) || [];
            q.push({ pta: scId, item_id: itemId, due_at: dueAt });
            await env.AURA_KV.put("schedule:due_queue", JSON.stringify(q)).catch(() => {});
          } catch {}
          // record the commitment on the timeline too (the PTA remembers it made a future promise)
          try {
            let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${scId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
            evs.push({ ts: new Date().toISOString(), event: "Scheduled: " + aboutClean + " (due " + dueAt + ")", kind: "scheduled" });
            await env.AURA_KV.put(`pta:timeline:${scId}`, JSON.stringify(evs)).catch(() => {});
          } catch {}
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: scId, scheduled: item } };
        }

        if (scAct === "DONE") {
          const itemId = args[3] || "";
          let found = false;
          items = items.map(it => { if (it.id === itemId) { found = true; return { ...it, status: "done", completed_at: new Date().toISOString() }; } return it; });
          await env.AURA_KV.put(scKey, JSON.stringify(items)).catch(() => {});
          return { cmd: "PTA_SPINE", payload: { ok: found, pta: scId, item_id: itemId, marked: found ? "done" : "not found" } };
        }

        return { cmd: "PTA_SPINE", payload: { ok: false, error: "SCHEDULE sub-actions: ADD, LIST, DONE" } };
      }

      if (spSub === "LOCATION") {
        // The PTA's PLACE dimension. Where the entity is, with coordinates for distance queries.
        // PTA_SPINE LOCATION SET <id> <address text>   (geocodes to lat/lng via places, stores)
        // PTA_SPINE LOCATION GET <id>
        // PTA_SPINE LOCATION NEAR <id> <miles>          (other PTAs within X miles of this one)
        const loAct = (args[1] || "").toUpperCase();
        const loId = args[2] || "";
        if (!loId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE LOCATION SET|GET|NEAR <pta_id> ..." } };
        const loKey = `pta:location:${loId}`;

        if (loAct === "GET") {
          let loc = null; try { const r = await env.AURA_KV.get(loKey); if (r) loc = JSON.parse(r); } catch {}
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: loId, location: loc } };
        }

        if (loAct === "SET") {
          const addressText = rest.includes("SET " + loId) ? rest.split("SET " + loId)[1].trim() : args.slice(3).join(" ");
          if (!addressText) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE LOCATION SET <id> <address text>" } };
          // geocode via the places engine (FETCH_PLACES) to get coordinates
          let lat = null, lng = null, placeName = null, formatted = addressText;
          try {
            const geo = await processCommand("FETCH_PLACES " + addressText, env, true);
            const gp = (geo && geo.payload) ? geo.payload : geo;
            if (gp && gp.ok && Array.isArray(gp.places) && gp.places.length) {
              const first = gp.places[0];
              lat = first.lat ?? null;
              lng = first.lng ?? null;
              placeName = first.name || null;
              formatted = first.address || addressText;
            }
          } catch {}
          const loc = { address: formatted, place_name: placeName, lat, lng, raw_input: addressText, updated_at: new Date().toISOString() };
          await env.AURA_KV.put(loKey, JSON.stringify(loc)).catch(() => {});
          // record on timeline that the entity has a place now
          try {
            let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${loId}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
            evs.push({ ts: new Date().toISOString(), event: "Located at: " + formatted + (lat && lng ? ` (${lat}, ${lng})` : " (no coordinates found)"), kind: "located" });
            await env.AURA_KV.put(`pta:timeline:${loId}`, JSON.stringify(evs)).catch(() => {});
          } catch {}
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: loId, location: loc, geocoded: !!(lat && lng) } };
        }

        if (loAct === "NEAR") {
          const miles = parseFloat(args[3] || "10");
          let here = null; try { const r = await env.AURA_KV.get(loKey); if (r) here = JSON.parse(r); } catch {}
          if (!here || here.lat == null || here.lng == null) return { cmd: "PTA_SPINE", payload: { ok: false, error: "This PTA has no coordinates. Set location first with coordinates." } };
          // haversine distance
          const toRad = (d) => d * Math.PI / 180;
          const distMiles = (la1, lo1, la2, lo2) => {
            const R = 3958.8; const dLa = toRad(la2 - la1); const dLo = toRad(lo2 - lo1);
            const a = Math.sin(dLa/2)**2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          };
          // scan all pta locations, compute distance, return those within range
          const near = [];
          let cursor;
          try {
            do {
              const list = await env.AURA_KV.list({ prefix: "pta:location:", limit: 1000, cursor });
              cursor = list.list_complete ? undefined : list.cursor;
              for (const k of (list.keys || [])) {
                const otherId = k.name.replace("pta:location:", "");
                if (otherId === loId) continue;
                let oloc = null; try { const r = await env.AURA_KV.get(k.name); if (r) oloc = JSON.parse(r); } catch {}
                if (!oloc || oloc.lat == null || oloc.lng == null) continue;
                const d = distMiles(here.lat, here.lng, oloc.lat, oloc.lng);
                if (d <= miles) near.push({ pta: otherId, distance_miles: Math.round(d * 10) / 10, address: oloc.address, place_name: oloc.place_name });
              }
            } while (cursor);
          } catch {}
          near.sort((a, b) => a.distance_miles - b.distance_miles);
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: loId, within_miles: miles, count: near.length, near } };
        }

        return { cmd: "PTA_SPINE", payload: { ok: false, error: "LOCATION sub-actions: SET, GET, NEAR" } };
      }

      if (spSub === "PURPOSE") {
        // PTA_SPINE PURPOSE SET <id> <statement>   |   PTA_SPINE PURPOSE GET <id>
        const pAct = (args[1] || "").toUpperCase();
        const pId = args[2] || "";
        if (!pId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE PURPOSE SET|GET <id> [statement]" } };
        if (pAct === "GET") {
          let p = null; try { const r = await env.AURA_KV.get(`pta:purpose:${pId}`); if (r) p = JSON.parse(r); } catch {}
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: pId, purpose: p } };
        }
        if (pAct === "SET") {
          const statement = rest.slice(rest.indexOf(pId) + pId.length).trim();
          if (!statement) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE PURPOSE SET <id> <statement>" } };
          const purpose = { statement, set_at: new Date().toISOString() };
          await env.AURA_KV.put(`pta:purpose:${pId}`, JSON.stringify(purpose)).catch(() => {});
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: pId, purpose } };
        }
        return { cmd: "PTA_SPINE", payload: { ok: false, error: "PURPOSE sub-actions: SET, GET" } };
      }

      if (spSub === "TRAJECTORY") {
        // PTA_SPINE TRAJECTORY SET <id> <direction>   (sets current direction)
        // PTA_SPINE TRAJECTORY MILESTONE <id> <text>  (appends a milestone reached)
        // PTA_SPINE TRAJECTORY GET <id>
        const tAct = (args[1] || "").toUpperCase();
        const tId = args[2] || "";
        if (!tId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE TRAJECTORY SET|MILESTONE|GET <id> [text]" } };
        let traj = null; try { const r = await env.AURA_KV.get(`pta:trajectory:${tId}`); if (r) traj = JSON.parse(r); } catch {}
        if (tAct === "GET") return { cmd: "PTA_SPINE", payload: { ok: true, pta: tId, trajectory: traj } };
        if (!traj) traj = { direction: null, milestones: [], updated_at: null };
        const text = rest.slice(rest.indexOf(tId) + tId.length).trim();
        if (tAct === "SET") {
          if (!text) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE TRAJECTORY SET <id> <direction>" } };
          traj.direction = text; traj.updated_at = new Date().toISOString();
        } else if (tAct === "MILESTONE") {
          if (!text) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE TRAJECTORY MILESTONE <id> <text>" } };
          traj.milestones.push({ text, at: new Date().toISOString() }); traj.updated_at = new Date().toISOString();
        } else return { cmd: "PTA_SPINE", payload: { ok: false, error: "TRAJECTORY sub-actions: SET, MILESTONE, GET" } };
        await env.AURA_KV.put(`pta:trajectory:${tId}`, JSON.stringify(traj)).catch(() => {});
        return { cmd: "PTA_SPINE", payload: { ok: true, pta: tId, trajectory: traj } };
      }

      if (spSub === "STEWARDSHIP") {
        // PTA_SPINE STEWARDSHIP SET <id> {json}  (creator, owner, stewards[], successor, transferable, revoked)
        // PTA_SPINE STEWARDSHIP GET <id>
        const sAct = (args[1] || "").toUpperCase();
        const sId = args[2] || "";
        if (!sId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE STEWARDSHIP SET|GET <id> [json]" } };
        if (sAct === "GET") {
          let s = null; try { const r = await env.AURA_KV.get(`pta:stewardship:${sId}`); if (r) s = JSON.parse(r); } catch {}
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: sId, stewardship: s } };
        }
        if (sAct === "SET") {
          const jsonStr = rest.slice(rest.indexOf(sId) + sId.length).trim();
          let incoming; try { incoming = JSON.parse(jsonStr); } catch { return { cmd: "PTA_SPINE", payload: { ok: false, error: "STEWARDSHIP SET needs JSON {creator,owner,stewards,successor,transferable,revoked}" } }; }
          let cur = {}; try { const r = await env.AURA_KV.get(`pta:stewardship:${sId}`); if (r) cur = JSON.parse(r); } catch {}
          const stewardship = { ...cur, ...incoming, updated_at: new Date().toISOString() };
          await env.AURA_KV.put(`pta:stewardship:${sId}`, JSON.stringify(stewardship)).catch(() => {});
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: sId, stewardship } };
        }
        return { cmd: "PTA_SPINE", payload: { ok: false, error: "STEWARDSHIP sub-actions: SET, GET" } };
      }

      if (spSub === "MEMORY") {
        // Preserved meaningful experiences - significance-gated, not the auto event log.
        // PTA_SPINE MEMORY PRESERVE <id> <kind> <content>   (kind: conversation|moment|artifact|note)
        // PTA_SPINE MEMORY RECALL <id>                       (list preserved memories)
        // PTA_SPINE MEMORY FORGET <id> <memory_id>
        const mAct = (args[1] || "").toUpperCase();
        const mId = args[2] || "";
        if (!mId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE MEMORY PRESERVE|RECALL|FORGET <id> ..." } };
        let mems = []; try { const r = await env.AURA_KV.get(`pta:memory:${mId}`); if (r) mems = JSON.parse(r) || []; } catch {}
        if (mAct === "RECALL") return { cmd: "PTA_SPINE", payload: { ok: true, pta: mId, count: mems.length, memory: mems } };
        if (mAct === "PRESERVE") {
          const kind = (args[3] || "note").toLowerCase();
          const afterKind = rest.slice(rest.indexOf(args[3] || "") + (args[3] || "").length).trim();
          const content = afterKind || "";
          if (!content) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE MEMORY PRESERVE <id> <kind> <content>" } };
          const mem = { id: "mem_" + Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, "0")).join(""), kind, content, at: new Date().toISOString() };
          mems.push(mem);
          await env.AURA_KV.put(`pta:memory:${mId}`, JSON.stringify(mems)).catch(() => {});
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: mId, preserved: mem, count: mems.length } };
        }
        if (mAct === "FORGET") {
          const memId = args[3] || "";
          mems = mems.filter(m => m.id !== memId);
          await env.AURA_KV.put(`pta:memory:${mId}`, JSON.stringify(mems)).catch(() => {});
          return { cmd: "PTA_SPINE", payload: { ok: true, pta: mId, forgot: memId, count: mems.length } };
        }
        return { cmd: "PTA_SPINE", payload: { ok: false, error: "MEMORY sub-actions: PRESERVE, RECALL, FORGET" } };
      }

      if (spSub === "TRANSFER") {
        // The continuity-across-change/death action: move stewardship to a successor. The entity
        // PERSISTS; responsibility moves. Records on the timeline. This is what makes a PTA outlive
        // its owner - the thread doesn't break, the steward changes.
        // PTA_SPINE TRANSFER <id> <new_owner> | [reason]   (pipe separates owner from reason so
        // multi-word owners like "next of kin" are not truncated)
        const tId = args[1] || "";
        if (!tId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE TRANSFER <id> <new_owner> | [reason]" } };
        const afterId = rest.slice(rest.indexOf(tId) + tId.length).trim();
        const tParts = afterId.split("|").map(s => s.trim());
        const newOwner = tParts[0] || "";
        const reason = tParts[1] || "";
        if (!newOwner) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE TRANSFER <id> <new_owner> | [reason]" } };
        let st = {}; try { const r = await env.AURA_KV.get(`pta:stewardship:${tId}`); if (r) st = JSON.parse(r); } catch {}
        const prevOwner = st.owner || null;
        if (st.transferable === false) return { cmd: "PTA_SPINE", payload: { ok: false, error: "This PTA is marked non-transferable. Set transferable:true first." } };
        st.prior_owners = st.prior_owners || []; if (prevOwner) st.prior_owners.push({ owner: prevOwner, until: new Date().toISOString() });
        st.owner = newOwner;
        if (!st.stewards || !st.stewards.includes(newOwner)) st.stewards = [...(st.stewards || []), newOwner];
        st.updated_at = new Date().toISOString();
        await env.AURA_KV.put(`pta:stewardship:${tId}`, JSON.stringify(st)).catch(() => {});
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${tId}`); if (tl) evs = JSON.parse(tl) || [];
          evs.push({ ts: new Date().toISOString(), event: "Stewardship transferred" + (prevOwner ? (" from " + prevOwner) : "") + " to " + newOwner + (reason ? (": " + reason) : ""), kind: "stewardship_transfer" });
          await env.AURA_KV.put(`pta:timeline:${tId}`, JSON.stringify(evs)).catch(() => {});
        } catch {}
        return { cmd: "PTA_SPINE", payload: { ok: true, pta: tId, transferred_from: prevOwner, transferred_to: newOwner, stewardship: st } };
      }

      if (spSub === "REVOKE") {
        // Revoke stewardship/activity - the entity persists (continuity), but is marked revoked.
        // PTA_SPINE REVOKE <id> [reason]
        const rId = args[1] || "";
        if (!rId) return { cmd: "PTA_SPINE", payload: { ok: false, error: "Usage: PTA_SPINE REVOKE <id> [reason]" } };
        let st = {}; try { const r = await env.AURA_KV.get(`pta:stewardship:${rId}`); if (r) st = JSON.parse(r); } catch {}
        st.revoked = true; st.revoked_at = new Date().toISOString();
        await env.AURA_KV.put(`pta:stewardship:${rId}`, JSON.stringify(st)).catch(() => {});
        const reason = args.slice(2).join(" ");
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${rId}`); if (tl) evs = JSON.parse(tl) || [];
          evs.push({ ts: new Date().toISOString(), event: "Stewardship revoked" + (reason ? (": " + reason) : ""), kind: "stewardship_revoke" });
          await env.AURA_KV.put(`pta:timeline:${rId}`, JSON.stringify(evs)).catch(() => {});
        } catch {}
        return { cmd: "PTA_SPINE", payload: { ok: true, pta: rId, revoked: true, stewardship: st } };
      }

      return { cmd: "PTA_SPINE", payload: { ok: false, error: "Sub-commands: GET, SET_STATE, EVENT, SCHEDULE, LOCATION, PURPOSE, TRAJECTORY, STEWARDSHIP, MEMORY, TRANSFER, REVOKE" } };
    }

    case "BUSINESS": {
      // BUSINESS-PTA — a business is a PTA like any entity, born at the moment of CAPTURE (a lead).
      // Built entirely on existing primitives: pta_entities (type=business), pta_edges (owner edge),
      // pta:location (geocoded address), pta:timeline, pta:schedule (call-back reminders).
      // Lifecycle: captured -> contact_attempted -> engaged -> claimed -> active.
      // The PTA begins at CAPTURE - the instant Aura grabs the business as a lead, whatever the
      // source. Contact attempts are events on the timeline, not the birth. Dedup by source id
      // (e.g. Google place_id) so the same business is never captured twice.
      //
      // BUSINESS CAPTURE <name> | <address> | [place_id] | [phone]
      //     -> births the business PTA, geocodes location, state=captured, timeline started
      // BUSINESS STATE <business_pta> <new_state> [note]   -> lifecycle transition + timeline event
      // BUSINESS CLAIM <business_pta> <owner_pta>          -> owner edge (owner operates business), state=claimed
      // BUSINESS GET <business_pta>                        -> full business spine (entity+state+location+timeline+owner)
      // BUSINESS NEAR <business_pta> <miles>               -> other businesses within range (uses LOCATION NEAR)
      if (!isOp) return { cmd: "BUSINESS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const bSub = (args[0] || "").toUpperCase();
      const bNow = new Date().toISOString();
      const newPtaId = () => "pta_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      const VALID_STATES = ["captured", "contact_attempted", "engaged", "claimed", "active", "declined", "dead"];

      const bTimeline = async (pid, event, kind) => {
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${pid}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
          evs.push({ ts: new Date().toISOString(), event, kind: kind || "business" });
          await env.AURA_KV.put(`pta:timeline:${pid}`, JSON.stringify(evs));
        } catch {}
      };

      if (bSub === "CAPTURE") {
        // BUSINESS CAPTURE <name> | <address> | [place_id] | [phone]
        const afterCmd = rest.replace(/^CAPTURE\s+/i, "");
        const segs = afterCmd.split("|").map(s => s.trim());
        const bName = segs[0] || "";
        const bAddress = segs[1] || "";
        const bPlaceId = segs[2] || "";
        const bPhone = segs[3] || "";
        if (!bName) return { cmd: "BUSINESS", payload: { ok: false, error: "Usage: BUSINESS CAPTURE <name> | <address> | [place_id] | [phone]" } };
        // dedup by source id (place_id) or phone, so the same lead isn't captured twice
        const identityKey = bPlaceId ? ("place:" + bPlaceId) : (bPhone ? ("phone:" + bPhone) : null);
        if (identityKey) {
          const existing = await db.prepare("SELECT * FROM pta_entities WHERE identity_key = ? AND type = 'business'").bind(identityKey).first();
          if (existing) return { cmd: "BUSINESS", payload: { ok: true, mode: "already_captured", business: existing.id, name: existing.name } };
        }
        const id = newPtaId();
        const meta = JSON.stringify({ lead_state: "captured", phone: bPhone || null, place_id: bPlaceId || null, source: bPlaceId ? "google" : "manual", captured_at: bNow });
        await db.prepare("INSERT INTO pta_entities (id, type, identity_key, name, metadata, created_at, updated_at) VALUES (?, 'business', ?, ?, ?, ?, ?)")
          .bind(id, identityKey, bName, meta, bNow, bNow).run();
        // geocode + store location from the listing address (the PTA is born WITH its place)
        let located = false;
        if (bAddress) {
          try {
            const geo = await processCommand("FETCH_PLACES " + bAddress, env, true);
            const gp = (geo && geo.payload) ? geo.payload : geo;
            let lat = null, lng = null, formatted = bAddress, placeName = null;
            if (gp && gp.ok && Array.isArray(gp.places) && gp.places.length) {
              const f = gp.places[0]; lat = f.lat ?? null; lng = f.lng ?? null; formatted = f.address || bAddress; placeName = f.name || null;
            }
            await env.AURA_KV.put(`pta:location:${id}`, JSON.stringify({ address: formatted, place_name: placeName, lat, lng, raw_input: bAddress, updated_at: bNow }));
            located = !!(lat && lng);
          } catch {}
        }
        await bTimeline(id, "Captured as a lead" + (bAddress ? (" at " + bAddress) : "") + (bPhone ? (" (" + bPhone + ")") : ""), "captured");
        return { cmd: "BUSINESS", payload: { ok: true, mode: "captured", business: id, name: bName, state: "captured", located } };
      }

      if (bSub === "STATE") {
        const bId = args[1] || "";
        const newState = (args[2] || "").toLowerCase();
        if (!bId || !newState) return { cmd: "BUSINESS", payload: { ok: false, error: "Usage: BUSINESS STATE <business_pta> <" + VALID_STATES.join("|") + "> [note]" } };
        if (!VALID_STATES.includes(newState)) return { cmd: "BUSINESS", payload: { ok: false, error: "Invalid state. Valid: " + VALID_STATES.join(", ") } };
        const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ? AND type = 'business'").bind(bId).first();
        if (!ent) return { cmd: "BUSINESS", payload: { ok: false, error: "Business not found: " + bId } };
        let meta = {}; try { meta = JSON.parse(ent.metadata || "{}"); } catch {}
        const prevState = meta.lead_state || "captured";
        meta.lead_state = newState;
        const note = args.slice(3).join(" ");
        await db.prepare("UPDATE pta_entities SET metadata = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(meta), bNow, bId).run();
        await bTimeline(bId, "Lead moved " + prevState + " -> " + newState + (note ? (": " + note) : ""), "state_change");
        return { cmd: "BUSINESS", payload: { ok: true, business: bId, from: prevState, to: newState } };
      }

      if (bSub === "CLAIM") {
        // owner claims the business: owner PTA -operates-> business PTA, business goes active
        const bId = args[1] || "";
        const ownerId = args[2] || "";
        if (!bId || !ownerId) return { cmd: "BUSINESS", payload: { ok: false, error: "Usage: BUSINESS CLAIM <business_pta> <owner_pta>" } };
        const biz = await db.prepare("SELECT * FROM pta_entities WHERE id = ? AND type = 'business'").bind(bId).first();
        if (!biz) return { cmd: "BUSINESS", payload: { ok: false, error: "Business not found: " + bId } };
        // create the owner edge (operates) if it doesn't already exist
        const existingEdge = await db.prepare("SELECT * FROM pta_edges WHERE from_id = ? AND to_id = ? AND edge_type = 'operates'").bind(ownerId, bId).first();
        const edgeId = existingEdge ? existingEdge.id : ("edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join(""));
        if (!existingEdge) {
          await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, relationship, created_at, updated_at) VALUES (?, ?, ?, 'operates', 'active', 'owner', ?, ?)")
            .bind(edgeId, ownerId, bId, bNow, bNow).run();
        }
        let meta = {}; try { meta = JSON.parse(biz.metadata || "{}"); } catch {}
        meta.lead_state = "claimed"; meta.owner = ownerId;
        await db.prepare("UPDATE pta_entities SET metadata = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(meta), bNow, bId).run();
        await bTimeline(bId, "Claimed by owner " + ownerId + " (owner edge formed)", "claimed");
        await bTimeline(ownerId, "Now operates business " + (biz.name || bId), "operates");
        return { cmd: "BUSINESS", payload: { ok: true, business: bId, owner: ownerId, edge: edgeId, state: "claimed" } };
      }

      if (bSub === "GET") {
        const bId = args[1] || "";
        if (!bId) return { cmd: "BUSINESS", payload: { ok: false, error: "Usage: BUSINESS GET <business_pta>" } };
        const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ? AND type = 'business'").bind(bId).first();
        if (!ent) return { cmd: "BUSINESS", payload: { ok: false, error: "Business not found: " + bId } };
        let meta = {}; try { meta = JSON.parse(ent.metadata || "{}"); } catch {}
        let location = null; try { const r = await env.AURA_KV.get(`pta:location:${bId}`); if (r) location = JSON.parse(r); } catch {}
        let timeline = []; try { const t = await env.AURA_KV.get(`pta:timeline:${bId}`); if (t) timeline = JSON.parse(t); } catch {}
        const ownerEdge = await db.prepare("SELECT * FROM pta_edges WHERE to_id = ? AND edge_type = 'operates' AND state = 'active'").bind(bId).first();
        return { cmd: "BUSINESS", payload: { ok: true, business: { id: ent.id, name: ent.name, state: meta.lead_state || "captured", phone: meta.phone || null, source: meta.source || null, location, owner: ownerEdge ? ownerEdge.from_id : null, timeline } } };
      }

      if (bSub === "NEAR") {
        const bId = args[1] || "";
        const miles = args[2] || "10";
        if (!bId) return { cmd: "BUSINESS", payload: { ok: false, error: "Usage: BUSINESS NEAR <business_pta> <miles>" } };
        const near = await processCommand("PTA_SPINE LOCATION NEAR " + bId + " " + miles, env, true);
        return { cmd: "BUSINESS", payload: (near && near.payload) ? near.payload : near };
      }

      if (bSub === "LIST") {
        const stateFilter = (args[1] || "").toLowerCase();
        const rows = await db.prepare("SELECT * FROM pta_entities WHERE type = 'business' ORDER BY created_at DESC LIMIT 200").all();
        let businesses = (rows.results || []).map(e => { let m = {}; try { m = JSON.parse(e.metadata || "{}"); } catch {} return { id: e.id, name: e.name, state: m.lead_state || "captured", phone: m.phone || null }; });
        if (stateFilter) businesses = businesses.filter(b => b.state === stateFilter);
        return { cmd: "BUSINESS", payload: { ok: true, count: businesses.length, businesses } };
      }

      return { cmd: "BUSINESS", payload: { ok: false, error: "Sub-commands: CAPTURE, STATE, CLAIM, GET, NEAR, LIST" } };
    }

    case "BOOKING": {
      // THE TRANSACTION EDGE — a booking is an edge between a CUSTOMER pta and a BUSINESS pta,
      // with a time (the appointment). It lives on both parties' timelines AND the business's
      // schedule. This is the relationship event that a PAYMENT (SecurePay) will ride on.
      // Built on existing primitives: pta_edges (the books edge), pta:schedule (appointment),
      // pta:timeline (both histories). Lifecycle: requested -> confirmed -> completed -> cancelled.
      //
      // BOOKING CREATE <customer_pta> <business_pta> <when ISO> | <service> | [amount] | [notes]
      //     -> creates the books edge, puts the appointment on the business schedule, both timelines
      // BOOKING STATE <booking_id> <requested|confirmed|completed|cancelled> [note]
      // BOOKING GET <booking_id>
      // BOOKING LIST <pta>            -> all bookings touching this pta (as customer OR business)
      if (!isOp) return { cmd: "BOOKING", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const bkSub = (args[0] || "").toUpperCase();
      const bkNow = new Date().toISOString();
      const edgeId = () => "edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      const bkTimeline = async (pid, event, kind) => {
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${pid}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
          evs.push({ ts: new Date().toISOString(), event, kind: kind || "booking" });
          await env.AURA_KV.put(`pta:timeline:${pid}`, JSON.stringify(evs));
        } catch {}
      };

      if (bkSub === "CREATE") {
        // BOOKING CREATE <customer_pta> <business_pta> <when ISO> | <service> | [amount] | [notes]
        const customerId = args[1] || "";
        const businessId = args[2] || "";
        if (!customerId || !businessId) return { cmd: "BOOKING", payload: { ok: false, error: "Usage: BOOKING CREATE <customer_pta> <business_pta> <when ISO> | <service> | [amount] | [notes]" } };
        const afterIds = rest.slice(rest.indexOf(businessId) + businessId.length).trim();
        const pipeParts = afterIds.split("|").map(s => s.trim());
        const whenISO = pipeParts[0] || "";
        const service = pipeParts[1] || "Appointment";
        const amount = pipeParts[2] ? parseFloat(pipeParts[2]) : null;
        const notes = pipeParts[3] || "";
        if (!whenISO) return { cmd: "BOOKING", payload: { ok: false, error: "When (ISO datetime) required before the first |" } };
        // verify both entities exist
        const biz = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(businessId).first();
        if (!biz) return { cmd: "BOOKING", payload: { ok: false, error: "Business not found: " + businessId } };
        // create the books edge (customer -books-> business), carrying the appointment context
        const eId = edgeId();
        const ctx = JSON.stringify({ when: whenISO, service, amount, notes, booking_state: "requested" });
        await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, relationship, context, created_at, updated_at) VALUES (?, ?, ?, 'books', 'requested', 'customer', ?, ?, ?)")
          .bind(eId, customerId, businessId, ctx, bkNow, bkNow).run();
        // put the appointment on the BUSINESS schedule (the sixth dimension - their forward edge)
        try {
          const apptItem = { id: "appt_" + eId.slice(5), due_at: whenISO, about: service + " - booking " + eId, action: "booking:" + eId, status: "pending", booking_edge: eId, customer: customerId, amount, created_at: bkNow };
          let items = []; const r = await env.AURA_KV.get(`pta:schedule:${businessId}`); if (r) items = JSON.parse(r) || []; items.push(apptItem);
          await env.AURA_KV.put(`pta:schedule:${businessId}`, JSON.stringify(items)).catch(() => {});
        } catch {}
        // record on both timelines
        await bkTimeline(customerId, "Booked " + service + " with " + (biz.name || businessId) + " for " + whenISO + (amount ? (" ($" + amount + ")") : ""), "booking_made");
        await bkTimeline(businessId, "New booking: " + service + " for a customer at " + whenISO + (amount ? (" ($" + amount + ")") : ""), "booking_received");
        return { cmd: "BOOKING", payload: { ok: true, booking: eId, customer: customerId, business: businessId, when: whenISO, service, amount, state: "requested" } };
      }

      if (bkSub === "STATE") {
        const bId = args[1] || "";
        const newState = (args[2] || "").toLowerCase();
        const VALID = ["requested", "confirmed", "completed", "cancelled"];
        if (!bId || !newState) return { cmd: "BOOKING", payload: { ok: false, error: "Usage: BOOKING STATE <booking_id> <" + VALID.join("|") + "> [note]" } };
        if (!VALID.includes(newState)) return { cmd: "BOOKING", payload: { ok: false, error: "Invalid state. Valid: " + VALID.join(", ") } };
        const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ? AND edge_type = 'books'").bind(bId).first();
        if (!edge) return { cmd: "BOOKING", payload: { ok: false, error: "Booking not found: " + bId } };
        let ctx = {}; try { ctx = JSON.parse(edge.context || "{}"); } catch {}
        const prev = ctx.booking_state || edge.state || "requested";
        ctx.booking_state = newState;
        await db.prepare("UPDATE pta_edges SET state = ?, context = ?, updated_at = ? WHERE id = ?").bind(newState, JSON.stringify(ctx), bkNow, bId).run();
        const note = args.slice(3).join(" ");
        await bkTimeline(edge.from_id, "Booking " + prev + " -> " + newState + (note ? (": " + note) : ""), "booking_state");
        await bkTimeline(edge.to_id, "Booking " + prev + " -> " + newState + (note ? (": " + note) : ""), "booking_state");
        return { cmd: "BOOKING", payload: { ok: true, booking: bId, from: prev, to: newState } };
      }

      if (bkSub === "GET") {
        const bId = args[1] || "";
        if (!bId) return { cmd: "BOOKING", payload: { ok: false, error: "Usage: BOOKING GET <booking_id>" } };
        const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ? AND edge_type = 'books'").bind(bId).first();
        if (!edge) return { cmd: "BOOKING", payload: { ok: false, error: "Booking not found: " + bId } };
        let ctx = {}; try { ctx = JSON.parse(edge.context || "{}"); } catch {}
        const cust = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(edge.from_id).first();
        const biz = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(edge.to_id).first();
        return { cmd: "BOOKING", payload: { ok: true, booking: { id: edge.id, customer: edge.from_id, customer_name: cust ? cust.name : null, business: edge.to_id, business_name: biz ? biz.name : null, when: ctx.when, service: ctx.service, amount: ctx.amount, notes: ctx.notes, state: ctx.booking_state || edge.state, paid_txn: ctx.paid_txn || null, paid_at: ctx.paid_at || null, created_at: edge.created_at } } };
      }

      if (bkSub === "LIST") {
        const pid = args[1] || "";
        if (!pid) return { cmd: "BOOKING", payload: { ok: false, error: "Usage: BOOKING LIST <pta> (lists bookings where this pta is customer or business)" } };
        const rows = await db.prepare("SELECT * FROM pta_edges WHERE edge_type = 'books' AND (from_id = ? OR to_id = ?) ORDER BY created_at DESC LIMIT 100").bind(pid, pid).all();
        const bookings = (rows.results || []).map(e => { let c = {}; try { c = JSON.parse(e.context || "{}"); } catch {} return { id: e.id, customer: e.from_id, business: e.to_id, role: e.from_id === pid ? "customer" : "business", when: c.when, service: c.service, amount: c.amount, state: c.booking_state || e.state }; });
        return { cmd: "BOOKING", payload: { ok: true, count: bookings.length, bookings } };
      }

      if (bkSub === "PAY") {
        // Charge a booking through SecureSpend. The amount and parties come FROM the booking edge,
        // not retyped. On success: mark the booking paid, link the txn id onto the edge, both
        // timelines record the payment. This is where the money rides on the transaction edge.
        // BOOKING PAY <booking_id> [test|live]   (defaults test - full flow, no real charge)
        const bId = args[1] || "";
        const payMode = (args[2] || "test").toLowerCase();
        if (!bId) return { cmd: "BOOKING", payload: { ok: false, error: "Usage: BOOKING PAY <booking_id> [test|live]" } };
        const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ? AND edge_type = 'books'").bind(bId).first();
        if (!edge) return { cmd: "BOOKING", payload: { ok: false, error: "Booking not found: " + bId } };
        let ctx = {}; try { ctx = JSON.parse(edge.context || "{}"); } catch {}
        if (ctx.amount == null) return { cmd: "BOOKING", payload: { ok: false, error: "This booking has no amount to charge" } };
        if (ctx.paid_txn) return { cmd: "BOOKING", payload: { ok: false, error: "Booking already paid", txn_id: ctx.paid_txn } };
        // resolve names/identity for the charge
        const cust = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(edge.from_id).first();
        const biz = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(edge.to_id).first();
        const assetName = (biz && biz.name) ? biz.name : edge.to_id;
        const buyer = { name: (cust && cust.name) ? cust.name : "Customer", identity: (cust && cust.identity_key) ? cust.identity_key : null };
        // charge through the existing SecureSpend rail (the amount comes from the booking)
        const chargeJson = JSON.stringify({ asset: assetName, amount: ctx.amount, currency: "usd", item: ctx.service || "Booking", buyer, mode: payMode, context: { booking_edge: bId, customer_pta: edge.from_id, business_pta: edge.to_id, when: ctx.when } });
        let chg;
        try { chg = await processCommand("SECURESPEND_CHARGE " + chargeJson, env, true); } catch (e) { return { cmd: "BOOKING", payload: { ok: false, error: "charge failed: " + (e && e.message ? e.message : String(e)) } }; }
        const cp = (chg && chg.payload) ? chg.payload : chg;
        if (!cp || !cp.ok) return { cmd: "BOOKING", payload: { ok: false, error: "SecureSpend charge did not succeed", detail: cp } };
        // mark the booking paid + link the txn onto the edge
        ctx.paid_txn = cp.txn_id; ctx.paid_at = bkNow; ctx.paid_mode = payMode;
        const newState = (ctx.booking_state === "requested") ? "confirmed" : (ctx.booking_state || edge.state);
        ctx.booking_state = newState;
        await db.prepare("UPDATE pta_edges SET state = ?, context = ?, updated_at = ? WHERE id = ?").bind(newState, JSON.stringify(ctx), bkNow, bId).run();
        await bkTimeline(edge.from_id, "Paid $" + ctx.amount + " for " + (ctx.service || "booking") + " (txn " + cp.txn_id + ")", "booking_paid");
        await bkTimeline(edge.to_id, "Received $" + ctx.amount + " payment for " + (ctx.service || "booking") + " (txn " + cp.txn_id + ")", "booking_paid");
        return { cmd: "BOOKING", payload: { ok: true, booking: bId, paid: true, txn_id: cp.txn_id, amount: ctx.amount, mode: payMode, state: newState, receipt_url: cp.receipt_url || null } };
      }

      return { cmd: "BOOKING", payload: { ok: false, error: "Sub-commands: CREATE, STATE, GET, LIST, PAY" } };
    }

    case "PTA_PHONE": {
      // PHONE-CHANNEL PTA BIRTH. Given a caller's phone number, resolve their existing PTA or
      // create one at first touch (born silently, like any other channel - "everyone gets a PTA").
      // Also writes the sessions mapping phone_<clean> -> pta so the comms worker's getEntityId
      // finds them on the next call. This is the write-side that makes the phone a real front door:
      // an addict, a veteran, a stranger, a Twilio rep - first call mints identity, continuity begins.
      // Identity logic stays HERE in the brain; aura-comms (thin transport) just calls this.
      //   PTA_PHONE <phonenumber> [name]
      if (!isOp) return { cmd: "PTA_PHONE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const rawPhone = (args[0] || "").trim();
      if (!rawPhone) return { cmd: "PTA_PHONE", payload: { ok: false, error: "Usage: PTA_PHONE <phonenumber> [name]" } };
      const cleanPhone = rawPhone.replace(/\D/g, "");
      if (!cleanPhone) return { cmd: "PTA_PHONE", payload: { ok: false, error: "No digits in phone number" } };
      const callerName = rest.slice(rest.indexOf(rawPhone) + rawPhone.length).trim() || "Caller";
      // resolve-or-create the PTA (auto-dedups on identity_key = phone:<clean>)
      let phEntity = null, phMode = null;
      try {
        const r = await processCommand(`PTA_ENTITY CREATE person ${callerName.replace(/[\n\r]/g, " ")} identity:phone:${cleanPhone}`, env, true);
        const pp = r && r.payload ? r.payload : r;
        if (pp && pp.ok && pp.entity) { phEntity = pp.entity.id; phMode = pp.mode; }
      } catch (e) { return { cmd: "PTA_PHONE", payload: { ok: false, error: "PTA resolve failed: " + e.message } }; }
      if (!phEntity) return { cmd: "PTA_PHONE", payload: { ok: false, error: "Could not resolve/create PTA for caller" } };
      // write the sessions mapping the comms worker reads (phone_<clean> -> identity_id), idempotent
      try {
        await env.AURA_MEMORY.prepare(
          "INSERT INTO sessions (session_id, identity_id) VALUES (?, ?) ON CONFLICT(session_id) DO UPDATE SET identity_id = excluded.identity_id"
        ).bind("phone_" + cleanPhone, phEntity).run();
      } catch (e) { return { cmd: "PTA_PHONE", payload: { ok: false, error: "PTA created but session-map write failed: " + e.message, pta: phEntity } }; }
      return { cmd: "PTA_PHONE", payload: { ok: true, pta: phEntity, mode: phMode, born: phMode === "created", phone: cleanPhone, session_id: "phone_" + cleanPhone } };
    }

    case "PTA_ENTITY": {
      // Manage entities in the graph. Everything is an entity: person, business, photo, event, document, memory, project.
      // PTA_ENTITY CREATE <type> <name> [identity:<key>] [meta:<json>]
      // PTA_ENTITY GET <id>
      // PTA_ENTITY FIND <identity_key>  (e.g. phone:+13105551234 or email:aaron@auras.guide)
      // PTA_ENTITY LIST [type]
      // PTA_ENTITY UPDATE <id> [name:<new>] [meta:<json>]
      if (!isOp) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const sub = (args[0] || "").toUpperCase();
      const now = new Date().toISOString();
      const ptaId = () => "pta_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");

      if (sub === "CREATE") {
        const eType = (args[1] || "").toLowerCase();
        if (!eType) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Usage: PTA_ENTITY CREATE <type> <name> [identity:<key>] [meta:<json>]" } };
        const eName = args[2] || "";
        const restStr = rest.slice(rest.indexOf(eName) + eName.length).trim();
        let identityKey = null, metadata = null;
        const idMatch = restStr.match(/identity:(\S+)/);
        if (idMatch) identityKey = idMatch[1];
        const metaMatch = restStr.match(/meta:({.*})/);
        if (metaMatch) try { metadata = metaMatch[1]; JSON.parse(metadata); } catch { return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Invalid meta JSON" } }; }
        // Dedup: if identity_key exists, return existing
        if (identityKey) {
          const existing = await db.prepare("SELECT * FROM pta_entities WHERE identity_key = ?").bind(identityKey).first();
          if (existing) return { cmd: "PTA_ENTITY", payload: { ok: true, mode: "existing", entity: existing } };
        }
        const id = ptaId();
        await db.prepare("INSERT INTO pta_entities (id, type, identity_key, name, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(id, eType, identityKey, eName, metadata, now, now).run();
        const created = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(id).first();
        return { cmd: "PTA_ENTITY", payload: { ok: true, mode: "created", entity: created } };
      }

      if (sub === "GET") {
        const id = args[1] || "";
        if (!id) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Usage: PTA_ENTITY GET <id>" } };
        const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(id).first();
        if (!ent) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Entity not found: " + id } };
        return { cmd: "PTA_ENTITY", payload: { ok: true, entity: ent } };
      }

      if (sub === "FIND") {
        const key = args[1] || "";
        if (!key) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Usage: PTA_ENTITY FIND <identity_key> (e.g. phone:+13105551234)" } };
        const ent = await db.prepare("SELECT * FROM pta_entities WHERE identity_key = ?").bind(key).first();
        if (!ent) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "No entity with identity_key: " + key } };
        return { cmd: "PTA_ENTITY", payload: { ok: true, entity: ent } };
      }

      if (sub === "LIST") {
        const filterType = (args[1] || "").toLowerCase();
        let rows;
        if (filterType) rows = await db.prepare("SELECT * FROM pta_entities WHERE type = ? ORDER BY created_at DESC LIMIT 100").bind(filterType).all();
        else rows = await db.prepare("SELECT * FROM pta_entities ORDER BY created_at DESC LIMIT 100").all();
        return { cmd: "PTA_ENTITY", payload: { ok: true, count: rows.results.length, entities: rows.results } };
      }

      if (sub === "UPDATE") {
        const id = args[1] || "";
        if (!id) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Usage: PTA_ENTITY UPDATE <id> [name:<new>] [meta:<json>]" } };
        const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(id).first();
        if (!ent) return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Entity not found" } };
        const restStr = rest.slice(rest.indexOf(id) + id.length).trim();
        const nameMatch = restStr.match(/name:(\S+)/);
        const metaMatch = restStr.match(/meta:({.*})/);
        const newName = nameMatch ? nameMatch[1] : ent.name;
        const newMeta = metaMatch ? metaMatch[1] : ent.metadata;
        if (metaMatch) try { JSON.parse(newMeta); } catch { return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Invalid meta JSON" } }; }
        await db.prepare("UPDATE pta_entities SET name = ?, metadata = ?, updated_at = ? WHERE id = ?").bind(newName, newMeta, now, id).run();
        const updated = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(id).first();
        return { cmd: "PTA_ENTITY", payload: { ok: true, mode: "updated", entity: updated } };
      }

      return { cmd: "PTA_ENTITY", payload: { ok: false, error: "Sub-commands: CREATE, GET, FIND, LIST, UPDATE" } };
    }

    case "PTA_GRANT": {
      // Create a relationship edge in the graph. Three layers carried in one call.
      // PTA_GRANT <from_id> <to_id> [json context with: edge_type, permission, relationship, impact]
      // edge_type: grant (default), share, create, introduce, participate, own
      // permission: {can_contact, can_view, can_share, ...}
      // relationship: {how_met, who_introduced, context, trust_level (1-10)}
      // impact: {notes: [...]}
      if (!isOp) return { cmd: "PTA_GRANT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const fromId = args[0] || "";
      const toId = args[1] || "";
      if (!fromId || !toId) return { cmd: "PTA_GRANT", payload: { ok: false, error: "Usage: PTA_GRANT <from_id> <to_id> [json context]" } };
      // Verify both entities exist
      const fromEnt = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(fromId).first();
      const toEnt = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(toId).first();
      if (!fromEnt) return { cmd: "PTA_GRANT", payload: { ok: false, error: "From entity not found: " + fromId } };
      if (!toEnt) return { cmd: "PTA_GRANT", payload: { ok: false, error: "To entity not found: " + toId } };
      // Parse optional context JSON
      const ctxRaw = rest.slice(rest.indexOf(toId) + toId.length).trim();
      let ctx = {};
      if (ctxRaw) {
        const jsonStart = ctxRaw.indexOf("{");
        if (jsonStart >= 0) {
          const jsonCandidate = ctxRaw.slice(jsonStart);
          try { ctx = JSON.parse(jsonCandidate); }
          catch { return { cmd: "PTA_GRANT", payload: { ok: false, error: "Invalid context JSON. Received: " + jsonCandidate.slice(0, 200) } }; }
        }
      }
      const now = new Date().toISOString();
      const edgeId = "edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      const edgeType = ctx.edge_type || "grant";
      const permission = ctx.permission ? JSON.stringify(ctx.permission) : JSON.stringify({ can_contact: true, can_view: true });
      const relationship = ctx.relationship ? JSON.stringify(ctx.relationship) : null;
      const impact = ctx.impact ? JSON.stringify(ctx.impact) : null;
      const context = ctxRaw || null;
      await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, impact, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(edgeId, fromId, toId, edgeType, "pending", permission, relationship, impact, context, now, now).run();
      // Record in history
      const histId = "hist_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(histId, edgeId, "granted", fromId, JSON.stringify({ from: fromEnt.name, to: toEnt.name, edge_type: edgeType }), now).run();
      return { cmd: "PTA_GRANT", payload: { ok: true, edge_id: edgeId, from: { id: fromId, name: fromEnt.name }, to: { id: toId, name: toEnt.name }, edge_type: edgeType, state: "pending" } };
    }

    case "PTA_ACCEPT": {
      // Accept a pending PTA. Moves edge state from pending to active. History recorded.
      // PTA_ACCEPT <edge_id>
      if (!isOp) return { cmd: "PTA_ACCEPT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const edgeId = args[0] || "";
      if (!edgeId) return { cmd: "PTA_ACCEPT", payload: { ok: false, error: "Usage: PTA_ACCEPT <edge_id>" } };
      const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ?").bind(edgeId).first();
      if (!edge) return { cmd: "PTA_ACCEPT", payload: { ok: false, error: "Edge not found" } };
      if (edge.state === "active") return { cmd: "PTA_ACCEPT", payload: { ok: true, note: "Already active", edge_id: edgeId } };
      if (edge.state === "revoked") return { cmd: "PTA_ACCEPT", payload: { ok: false, error: "Cannot accept a revoked PTA — must be re-granted" } };
      const now = new Date().toISOString();
      await db.prepare("UPDATE pta_edges SET state = 'active', updated_at = ? WHERE id = ?").bind(now, edgeId).run();
      const histId = "hist_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(histId, edgeId, "accepted", edge.to_id, JSON.stringify({ accepted_by: edge.to_id }), now).run();
      return { cmd: "PTA_ACCEPT", payload: { ok: true, edge_id: edgeId, state: "active" } };
    }

    case "PTA_REVOKE": {
      // Revoke a PTA. Does NOT delete — moves to revoked state. History preserved forever.
      // PTA_REVOKE <edge_id> [reason]
      if (!isOp) return { cmd: "PTA_REVOKE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const edgeId = args[0] || "";
      if (!edgeId) return { cmd: "PTA_REVOKE", payload: { ok: false, error: "Usage: PTA_REVOKE <edge_id> [reason]" } };
      const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ?").bind(edgeId).first();
      if (!edge) return { cmd: "PTA_REVOKE", payload: { ok: false, error: "Edge not found" } };
      if (edge.state === "revoked") return { cmd: "PTA_REVOKE", payload: { ok: true, note: "Already revoked", edge_id: edgeId } };
      const reason = rest.slice(rest.indexOf(edgeId) + edgeId.length).trim() || null;
      const now = new Date().toISOString();
      await db.prepare("UPDATE pta_edges SET state = 'revoked', updated_at = ? WHERE id = ?").bind(now, edgeId).run();
      const histId = "hist_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(histId, edgeId, "revoked", null, JSON.stringify({ reason, previous_state: edge.state }), now).run();
      return { cmd: "PTA_REVOKE", payload: { ok: true, edge_id: edgeId, state: "revoked", reason } };
    }

    case "PTA_LOOKUP": {
      // Check relationship between any two entities. Returns all edges in both directions.
      // PTA_LOOKUP <entity_id_1> <entity_id_2>
      if (!isOp) return { cmd: "PTA_LOOKUP", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const id1 = args[0] || "";
      const id2 = args[1] || "";
      if (!id1 || !id2) return { cmd: "PTA_LOOKUP", payload: { ok: false, error: "Usage: PTA_LOOKUP <entity_id_1> <entity_id_2>" } };
      const forward = await db.prepare("SELECT * FROM pta_edges WHERE from_id = ? AND to_id = ?").bind(id1, id2).all();
      const reverse = await db.prepare("SELECT * FROM pta_edges WHERE from_id = ? AND to_id = ?").bind(id2, id1).all();
      const allEdges = [...(forward.results || []), ...(reverse.results || [])];
      if (allEdges.length === 0) return { cmd: "PTA_LOOKUP", payload: { ok: true, connected: false, note: "No relationship exists between these entities" } };
      return { cmd: "PTA_LOOKUP", payload: { ok: true, connected: true, edges: allEdges } };
    }

    case "PTA_STATUS": {
      // All relationships for an entity — who they're connected to, in both directions.
      // PTA_STATUS <entity_id> [active|pending|revoked|all]
      if (!isOp) return { cmd: "PTA_STATUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const entId = args[0] || "";
      const stateFilter = (args[1] || "all").toLowerCase();
      if (!entId) return { cmd: "PTA_STATUS", payload: { ok: false, error: "Usage: PTA_STATUS <entity_id> [active|pending|revoked|all]" } };
      const ent = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(entId).first();
      if (!ent) return { cmd: "PTA_STATUS", payload: { ok: false, error: "Entity not found" } };
      let outbound, inbound;
      if (stateFilter === "all") {
        outbound = await db.prepare("SELECT e.*, pe.name as to_name, pe.type as to_type FROM pta_edges e JOIN pta_entities pe ON e.to_id = pe.id WHERE e.from_id = ? ORDER BY e.created_at DESC LIMIT 200").bind(entId).all();
        inbound = await db.prepare("SELECT e.*, pe.name as from_name, pe.type as from_type FROM pta_edges e JOIN pta_entities pe ON e.from_id = pe.id WHERE e.to_id = ? ORDER BY e.created_at DESC LIMIT 200").bind(entId).all();
      } else {
        outbound = await db.prepare("SELECT e.*, pe.name as to_name, pe.type as to_type FROM pta_edges e JOIN pta_entities pe ON e.to_id = pe.id WHERE e.from_id = ? AND e.state = ? ORDER BY e.created_at DESC LIMIT 200").bind(entId, stateFilter).all();
        inbound = await db.prepare("SELECT e.*, pe.name as from_name, pe.type as from_type FROM pta_edges e JOIN pta_entities pe ON e.from_id = pe.id WHERE e.to_id = ? AND e.state = ? ORDER BY e.created_at DESC LIMIT 200").bind(entId, stateFilter).all();
      }
      return { cmd: "PTA_STATUS", payload: { ok: true, entity: { id: ent.id, name: ent.name, type: ent.type }, filter: stateFilter, granted_to: outbound.results, received_from: inbound.results, total: (outbound.results.length || 0) + (inbound.results.length || 0) } };
    }

    case "PTA_HISTORY": {
      // Full immutable history of a relationship edge.
      // PTA_HISTORY <edge_id>
      if (!isOp) return { cmd: "PTA_HISTORY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const edgeId = args[0] || "";
      if (!edgeId) return { cmd: "PTA_HISTORY", payload: { ok: false, error: "Usage: PTA_HISTORY <edge_id>" } };
      const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ?").bind(edgeId).first();
      if (!edge) return { cmd: "PTA_HISTORY", payload: { ok: false, error: "Edge not found" } };
      const history = await db.prepare("SELECT * FROM pta_history WHERE edge_id = ? ORDER BY created_at ASC").bind(edgeId).all();
      return { cmd: "PTA_HISTORY", payload: { ok: true, edge, history: history.results } };
    }

    case "PTA_IMPACT": {
      // Record impact on a relationship — what happened BECAUSE of this connection.
      // PTA_IMPACT <edge_id> <note text>
      if (!isOp) return { cmd: "PTA_IMPACT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const edgeId = args[0] || "";
      if (!edgeId) return { cmd: "PTA_IMPACT", payload: { ok: false, error: "Usage: PTA_IMPACT <edge_id> <note text>" } };
      const edge = await db.prepare("SELECT * FROM pta_edges WHERE id = ?").bind(edgeId).first();
      if (!edge) return { cmd: "PTA_IMPACT", payload: { ok: false, error: "Edge not found" } };
      const note = rest.slice(rest.indexOf(edgeId) + edgeId.length).trim();
      if (!note) return { cmd: "PTA_IMPACT", payload: { ok: false, error: "Provide impact note text" } };
      // Append to impact JSON array
      let impactArr = [];
      try { impactArr = JSON.parse(edge.impact || "[]"); } catch { impactArr = []; }
      if (!Array.isArray(impactArr)) impactArr = [];
      const now = new Date().toISOString();
      impactArr.push({ ts: now, note });
      await db.prepare("UPDATE pta_edges SET impact = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(impactArr), now, edgeId).run();
      // History
      const histId = "hist_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(histId, edgeId, "impact_recorded", null, JSON.stringify({ note }), now).run();
      return { cmd: "PTA_IMPACT", payload: { ok: true, edge_id: edgeId, impacts: impactArr } };
    }

    case "PTA_SHARE": {
      // Share an object (photo, document, etc.) from one entity to another, creating PTA chain.
      // The object gets a "shared" edge to the recipient. The recipient PTAs in.
      // PTA_SHARE <owner_id> <object_id> <recipient_id> [context json]
      if (!isOp) return { cmd: "PTA_SHARE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const ownerId = args[0] || "";
      const objectId = args[1] || "";
      const recipientId = args[2] || "";
      if (!ownerId || !objectId || !recipientId) return { cmd: "PTA_SHARE", payload: { ok: false, error: "Usage: PTA_SHARE <owner_id> <object_id> <recipient_id> [context json]" } };
      // Verify all three exist
      const owner = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(ownerId).first();
      const obj = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(objectId).first();
      const recip = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(recipientId).first();
      if (!owner) return { cmd: "PTA_SHARE", payload: { ok: false, error: "Owner entity not found" } };
      if (!obj) return { cmd: "PTA_SHARE", payload: { ok: false, error: "Object entity not found" } };
      if (!recip) return { cmd: "PTA_SHARE", payload: { ok: false, error: "Recipient entity not found" } };
      // Verify owner has relationship to object
      const ownerEdge = await db.prepare("SELECT id FROM pta_edges WHERE from_id = ? AND to_id = ? AND state = 'active'").bind(ownerId, objectId).first();
      if (!ownerEdge) {
        // Auto-create ownership edge if none exists (first share of an owned object)
        const autoEdgeId = "edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
        const now0 = new Date().toISOString();
        await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, impact, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(autoEdgeId, ownerId, objectId, "own", "active", JSON.stringify({ can_view: true, can_share: true }), JSON.stringify({ context: "creator/owner" }), null, null, now0, now0).run();
      }
      // Create share edge: object → recipient (the object is shared TO the recipient)
      const ctxRaw = rest.slice(rest.indexOf(recipientId) + recipientId.length).trim();
      let ctx = {};
      if (ctxRaw) {
        const jsonStart = ctxRaw.indexOf("{");
        if (jsonStart >= 0) {
          try { ctx = JSON.parse(ctxRaw.slice(jsonStart)); } catch {}
        }
      }
      const now = new Date().toISOString();
      const shareEdgeId = "edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, impact, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(shareEdgeId, objectId, recipientId, "share", "pending", JSON.stringify({ can_view: true }), JSON.stringify({ shared_by: ownerId, shared_by_name: owner.name }), null, ctxRaw || null, now, now).run();
      // Also create a link edge: sharer → recipient (so the graph traces the human chain)
      const linkEdgeId = "edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, impact, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(linkEdgeId, ownerId, recipientId, "introduce", "pending", JSON.stringify({ can_contact: false, can_view: true }), JSON.stringify({ introduced_via: obj.name || objectId, object_type: obj.type }), null, null, now, now).run();
      // History for both edges
      const h1 = "hist_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      const h2 = "hist_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(h1, shareEdgeId, "shared", ownerId, JSON.stringify({ object: obj.name, recipient: recip.name }), now).run();
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(h2, linkEdgeId, "introduced", ownerId, JSON.stringify({ introduced_via: obj.name, from: owner.name, to: recip.name }), now).run();
      return { cmd: "PTA_SHARE", payload: { ok: true, share_edge_id: shareEdgeId, link_edge_id: linkEdgeId, object: obj.name, from: owner.name, to: recip.name, state: "pending" } };
    }

    case "PTA_GRAPH": {
      // Traverse the graph from an entity N levels deep. Shows the relationship chain.
      // PTA_GRAPH <entity_id> [depth=2] [active_only=true]
      if (!isOp) return { cmd: "PTA_GRAPH", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const rootId = args[0] || "";
      const maxDepth = Math.min(parseInt(args[1]) || 2, 5);
      const activeOnly = (args[2] || "true") !== "false";
      if (!rootId) return { cmd: "PTA_GRAPH", payload: { ok: false, error: "Usage: PTA_GRAPH <entity_id> [depth=2] [active_only=true]" } };
      const root = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(rootId).first();
      if (!root) return { cmd: "PTA_GRAPH", payload: { ok: false, error: "Entity not found" } };
      const visited = new Set();
      const nodes = [];
      const edges = [];
      const queue = [{ id: rootId, depth: 0 }];
      while (queue.length > 0) {
        const { id, depth } = queue.shift();
        if (visited.has(id) || depth > maxDepth) continue;
        visited.add(id);
        const ent = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(id).first();
        if (ent) nodes.push({ ...ent, depth });
        // Get outbound edges
        let outEdges;
        if (activeOnly) outEdges = await db.prepare("SELECT id, to_id, edge_type, state FROM pta_edges WHERE from_id = ? AND state = 'active' LIMIT 50").bind(id).all();
        else outEdges = await db.prepare("SELECT id, to_id, edge_type, state FROM pta_edges WHERE from_id = ? LIMIT 50").bind(id).all();
        for (const e of (outEdges.results || [])) {
          edges.push({ edge_id: e.id, from: id, to: e.to_id, type: e.edge_type, state: e.state });
          if (!visited.has(e.to_id) && depth + 1 <= maxDepth) queue.push({ id: e.to_id, depth: depth + 1 });
        }
        // Get inbound edges too (bidirectional graph)
        let inEdges;
        if (activeOnly) inEdges = await db.prepare("SELECT id, from_id, edge_type, state FROM pta_edges WHERE to_id = ? AND state = 'active' LIMIT 50").bind(id).all();
        else inEdges = await db.prepare("SELECT id, from_id, edge_type, state FROM pta_edges WHERE to_id = ? LIMIT 50").bind(id).all();
        for (const e of (inEdges.results || [])) {
          edges.push({ edge_id: e.id, from: e.from_id, to: id, type: e.edge_type, state: e.state });
          if (!visited.has(e.from_id) && depth + 1 <= maxDepth) queue.push({ id: e.from_id, depth: depth + 1 });
        }
      }
      return { cmd: "PTA_GRAPH", payload: { ok: true, root: { id: root.id, name: root.name, type: root.type }, depth: maxDepth, active_only: activeOnly, nodes, edges, node_count: nodes.length, edge_count: edges.length } };
    }

    case "PTA_GROUP": {
      // Permission groups on an entity. One PTA, multiple circles, each with different access.
      // PTA_GROUP CREATE <entity_id> <name> <permissions json> [default]
      // PTA_GROUP LIST <entity_id>
      // PTA_GROUP UPDATE <group_id> <permissions json>
      // PTA_GROUP DELETE <group_id>
      if (!isOp) return { cmd: "PTA_GROUP", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const sub = (args[0] || "").toUpperCase();
      const now = new Date().toISOString();
      const gId = () => "grp_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");

      if (sub === "CREATE") {
        const entId = args[1] || "";
        const gName = args[2] || "";
        if (!entId || !gName) return { cmd: "PTA_GROUP", payload: { ok: false, error: "Usage: PTA_GROUP CREATE <entity_id> <name> <permissions json> [default]" } };
        const ent = await db.prepare("SELECT id FROM pta_entities WHERE id = ?").bind(entId).first();
        if (!ent) return { cmd: "PTA_GROUP", payload: { ok: false, error: "Entity not found" } };
        const afterName = rest.slice(rest.indexOf(gName) + gName.length).trim();
        let perms = '{"can_view":true}';
        const jsonStart = afterName.indexOf("{");
        if (jsonStart >= 0) {
          const candidate = afterName.slice(jsonStart);
          const jsonEnd = candidate.lastIndexOf("}");
          if (jsonEnd >= 0) {
            try { JSON.parse(candidate.slice(0, jsonEnd + 1)); perms = candidate.slice(0, jsonEnd + 1); } catch {}
          }
        }
        const isDefault = /\bdefault\b/i.test(afterName) ? 1 : 0;
        if (isDefault) await db.prepare("UPDATE pta_groups SET is_default = 0 WHERE entity_id = ?").bind(entId).run();
        const id = gId();
        await db.prepare("INSERT INTO pta_groups (id, entity_id, name, permissions, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(id, entId, gName, perms, isDefault, now, now).run();
        return { cmd: "PTA_GROUP", payload: { ok: true, mode: "created", group_id: id, name: gName, is_default: !!isDefault } };
      }

      if (sub === "LIST") {
        const entId = args[1] || "";
        if (!entId) return { cmd: "PTA_GROUP", payload: { ok: false, error: "Usage: PTA_GROUP LIST <entity_id>" } };
        const groups = await db.prepare("SELECT * FROM pta_groups WHERE entity_id = ? ORDER BY is_default DESC, name ASC").bind(entId).all();
        return { cmd: "PTA_GROUP", payload: { ok: true, entity_id: entId, groups: groups.results } };
      }

      if (sub === "UPDATE") {
        const grpId = args[1] || "";
        if (!grpId) return { cmd: "PTA_GROUP", payload: { ok: false, error: "Usage: PTA_GROUP UPDATE <group_id> <permissions json>" } };
        const afterId = rest.slice(rest.indexOf(grpId) + grpId.length).trim();
        const jsonStart = afterId.indexOf("{");
        if (jsonStart < 0) return { cmd: "PTA_GROUP", payload: { ok: false, error: "Provide permissions JSON" } };
        let perms;
        try { perms = JSON.parse(afterId.slice(jsonStart)); } catch { return { cmd: "PTA_GROUP", payload: { ok: false, error: "Invalid permissions JSON" } }; }
        await db.prepare("UPDATE pta_groups SET permissions = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(perms), now, grpId).run();
        return { cmd: "PTA_GROUP", payload: { ok: true, mode: "updated", group_id: grpId } };
      }

      if (sub === "DELETE") {
        const grpId = args[1] || "";
        if (!grpId) return { cmd: "PTA_GROUP", payload: { ok: false, error: "Usage: PTA_GROUP DELETE <group_id>" } };
        await db.prepare("DELETE FROM pta_groups WHERE id = ?").bind(grpId).run();
        return { cmd: "PTA_GROUP", payload: { ok: true, mode: "deleted", group_id: grpId } };
      }

      return { cmd: "PTA_GROUP", payload: { ok: false, error: "Sub-commands: CREATE, LIST, UPDATE, DELETE" } };
    }

    case "PTA_INTENT": {
      // Live intent — what happens when someone scans this entity's PTA right now.
      // PTA_INTENT SET <entity_id> <json: {group, context, moment_name}>
      // PTA_INTENT GET <entity_id>
      // PTA_INTENT CLEAR <entity_id>
      if (!isOp) return { cmd: "PTA_INTENT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const sub = (args[0] || "").toUpperCase();

      if (sub === "SET") {
        const entId = args[1] || "";
        if (!entId) return { cmd: "PTA_INTENT", payload: { ok: false, error: "Usage: PTA_INTENT SET <entity_id> <json>" } };
        const afterId = rest.slice(rest.indexOf(entId) + entId.length).trim();
        const jsonStart = afterId.indexOf("{");
        let intent = {};
        if (jsonStart >= 0) { try { intent = JSON.parse(afterId.slice(jsonStart)); } catch { return { cmd: "PTA_INTENT", payload: { ok: false, error: "Invalid intent JSON" } }; } }
        intent.set_at = new Date().toISOString();
        await db.prepare("UPDATE pta_entities SET live_intent = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(intent), new Date().toISOString(), entId).run();
        return { cmd: "PTA_INTENT", payload: { ok: true, entity_id: entId, intent } };
      }

      if (sub === "GET") {
        const entId = args[1] || "";
        if (!entId) return { cmd: "PTA_INTENT", payload: { ok: false, error: "Usage: PTA_INTENT GET <entity_id>" } };
        const ent = await db.prepare("SELECT live_intent FROM pta_entities WHERE id = ?").bind(entId).first();
        if (!ent) return { cmd: "PTA_INTENT", payload: { ok: false, error: "Entity not found" } };
        let intent = null;
        try { intent = JSON.parse(ent.live_intent); } catch {}
        return { cmd: "PTA_INTENT", payload: { ok: true, entity_id: entId, intent } };
      }

      if (sub === "CLEAR") {
        const entId = args[1] || "";
        if (!entId) return { cmd: "PTA_INTENT", payload: { ok: false, error: "Usage: PTA_INTENT CLEAR <entity_id>" } };
        await db.prepare("UPDATE pta_entities SET live_intent = NULL, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), entId).run();
        return { cmd: "PTA_INTENT", payload: { ok: true, entity_id: entId, intent: null } };
      }

      return { cmd: "PTA_INTENT", payload: { ok: false, error: "Sub-commands: SET, GET, CLEAR" } };
    }

    case "PTA_MOMENT": {
      // Moments — context-carrying community-forming events. Not confining — origin markers.
      // PTA_MOMENT CREATE <creator_id> <name> [context json] [live_until ISO date]
      // PTA_MOMENT LIST [creator_id]
      // PTA_MOMENT GET <moment_id>
      if (!isOp) return { cmd: "PTA_MOMENT", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const sub = (args[0] || "").toUpperCase();
      const now = new Date().toISOString();
      const mId = () => "mom_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");

      if (sub === "CREATE") {
        const creatorId = args[1] || "";
        const mName = args[2] || "";
        if (!creatorId || !mName) return { cmd: "PTA_MOMENT", payload: { ok: false, error: "Usage: PTA_MOMENT CREATE <creator_id> <name> [context json] [live_until]" } };
        const afterName = rest.slice(rest.indexOf(mName) + mName.length).trim();
        let ctx = null, liveUntil = null;
        const jsonStart = afterName.indexOf("{");
        if (jsonStart >= 0) {
          const jsonEnd = afterName.lastIndexOf("}");
          if (jsonEnd >= 0) { try { ctx = afterName.slice(jsonStart, jsonEnd + 1); JSON.parse(ctx); } catch { ctx = null; } }
          const afterJson = afterName.slice(jsonEnd + 1).trim();
          if (afterJson && /^\d{4}/.test(afterJson)) liveUntil = afterJson.trim();
        } else if (/^\d{4}/.test(afterName)) { liveUntil = afterName.trim(); }
        // Create the moment entity (a moment is also an entity in the graph)
        const momentEntityId = mId();
        await db.prepare("INSERT INTO pta_entities (id, type, identity_key, name, metadata, created_at, updated_at, verification_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(momentEntityId, "moment", "moment:" + momentEntityId, mName, ctx, now, now, "aura_verified").run();
        // Create the moment record
        await db.prepare("INSERT INTO pta_moments (id, creator_id, name, context, live_from, live_until, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(momentEntityId, creatorId, mName, ctx, now, liveUntil, now).run();
        // Edge: creator → moment (organize/host)
        const edgeId = "edge_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
        await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, context, created_at, updated_at, moment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(edgeId, creatorId, momentEntityId, "created", "active", '{"can_view":true,"can_share":true}', JSON.stringify({ role: "creator" }), ctx, now, now, momentEntityId).run();
        return { cmd: "PTA_MOMENT", payload: { ok: true, moment_id: momentEntityId, name: mName, creator_id: creatorId, live_until: liveUntil } };
      }

      if (sub === "LIST") {
        const creatorId = args[1] || "";
        let moments;
        if (creatorId) moments = await db.prepare("SELECT * FROM pta_moments WHERE creator_id = ? ORDER BY created_at DESC LIMIT 50").bind(creatorId).all();
        else moments = await db.prepare("SELECT * FROM pta_moments ORDER BY created_at DESC LIMIT 50").all();
        return { cmd: "PTA_MOMENT", payload: { ok: true, moments: moments.results } };
      }

      if (sub === "GET") {
        const momId = args[1] || "";
        if (!momId) return { cmd: "PTA_MOMENT", payload: { ok: false, error: "Usage: PTA_MOMENT GET <moment_id>" } };
        const mom = await db.prepare("SELECT * FROM pta_moments WHERE id = ?").bind(momId).first();
        if (!mom) return { cmd: "PTA_MOMENT", payload: { ok: false, error: "Moment not found" } };
        // Count participants
        const participants = await db.prepare("SELECT COUNT(*) as c FROM pta_edges WHERE moment_id = ? AND edge_type != 'created'").bind(momId).first();
        return { cmd: "PTA_MOMENT", payload: { ok: true, moment: mom, participant_count: participants ? participants.c : 0 } };
      }

      return { cmd: "PTA_MOMENT", payload: { ok: false, error: "Sub-commands: CREATE, LIST, GET" } };
    }

    case "PTA_SCAN": {
      // THE REAL-WORLD FLOW: someone scans a PTA. This is how people meet Aura.
      // PTA_SCAN <target_entity_id> <scanner_identity_key> [scanner_name]
      // What happens:
      // 1. Find or create scanner entity (identity floor: phone/email)
      // 2. Check target's live intent → determines group assignment and context
      // 3. If intent has a moment, connect scanner to that moment (community formation)
      // 4. Create edge: target → scanner with the appropriate group
      // 5. Create edge: Aura → scanner, type "welcomed" (the person meets Aura)
      // 6. Record in history
      if (!isOp) return { cmd: "PTA_SCAN", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const targetId = args[0] || "";
      const scannerKey = args[1] || "";
      const scannerName = args[2] || "";
      if (!targetId || !scannerKey) return { cmd: "PTA_SCAN", payload: { ok: false, error: "Usage: PTA_SCAN <target_entity_id> <scanner_identity_key> [scanner_name]" } };
      const now = new Date().toISOString();
      const mkId = (pre) => pre + "_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");

      // 1. Verify target exists
      const target = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(targetId).first();
      if (!target) return { cmd: "PTA_SCAN", payload: { ok: false, error: "Target entity not found" } };

      // 2. Find or create scanner
      let scanner = await db.prepare("SELECT * FROM pta_entities WHERE identity_key = ?").bind(scannerKey).first();
      const isNewUser = !scanner;
      if (!scanner) {
        const sId = mkId("pta");
        await db.prepare("INSERT INTO pta_entities (id, type, identity_key, name, metadata, created_at, updated_at, verification_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(sId, "person", scannerKey, scannerName || scannerKey, null, now, now, "unverified").run();
        scanner = await db.prepare("SELECT * FROM pta_entities WHERE id = ?").bind(sId).first();
      }

      // 3. Read target's live intent
      let intent = null;
      try { intent = JSON.parse(target.live_intent); } catch {}

      // 4. Determine group assignment
      let groupId = null, groupName = "public", groupPerms = '{"can_view":true}';
      if (intent && intent.group_id) {
        const grp = await db.prepare("SELECT * FROM pta_groups WHERE id = ?").bind(intent.group_id).first();
        if (grp) { groupId = grp.id; groupName = grp.name; groupPerms = grp.permissions; }
      } else if (intent && intent.group) {
        const grp = await db.prepare("SELECT * FROM pta_groups WHERE entity_id = ? AND name = ?").bind(targetId, intent.group).first();
        if (grp) { groupId = grp.id; groupName = grp.name; groupPerms = grp.permissions; }
      }
      if (!groupId) {
        const defGrp = await db.prepare("SELECT * FROM pta_groups WHERE entity_id = ? AND is_default = 1").bind(targetId).first();
        if (defGrp) { groupId = defGrp.id; groupName = defGrp.name; groupPerms = defGrp.permissions; }
      }

      // 5. Determine moment
      let momentId = null, momentName = null;
      if (intent && intent.moment_id) {
        const mom = await db.prepare("SELECT * FROM pta_moments WHERE id = ?").bind(intent.moment_id).first();
        if (mom) { momentId = mom.id; momentName = mom.name; }
      }

      // 6. Create edge: target → scanner
      const edgeId = mkId("edge");
      const relContext = { how: "PTA scan", intent_context: intent ? intent.context || null : null, group: groupName, moment: momentName };
      await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, context, created_at, updated_at, group_id, moment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(edgeId, targetId, scanner.id, "grant", "active", groupPerms, JSON.stringify(relContext), intent ? JSON.stringify(intent) : null, now, now, groupId, momentId).run();

      // 7. If moment exists, connect scanner to moment (community formation)
      let momentEdgeId = null;
      if (momentId) {
        momentEdgeId = mkId("edge");
        await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, context, created_at, updated_at, moment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(momentEdgeId, scanner.id, momentId, "participate", "active", '{"can_view":true,"can_discover":true}', JSON.stringify({ joined_via: "scan", target: target.name }), null, now, now, momentId).run();
      }

      // 8. Aura welcomes the scanner (the person meets Aura)
      const auraEntity = await db.prepare("SELECT id FROM pta_entities WHERE identity_key = 'system:aura'").first();
      let welcomeEdgeId = null;
      if (auraEntity) {
        welcomeEdgeId = mkId("edge");
        await db.prepare("INSERT INTO pta_edges (id, from_id, to_id, edge_type, state, permission, relationship, context, created_at, updated_at, moment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(welcomeEdgeId, auraEntity.id, scanner.id, "welcomed", "active", '{"can_view":true,"can_contact":true}',
            JSON.stringify({ introduced_by: target.name, moment: momentName, context: intent ? intent.context || "scan" : "scan" }),
            null, now, now, momentId).run();
      }

      // 9. History
      const histId = mkId("hist");
      await db.prepare("INSERT INTO pta_history (id, edge_id, action, actor_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(histId, edgeId, "scanned", scanner.id, JSON.stringify({ target: target.name, scanner: scanner.name, group: groupName, moment: momentName, is_new_user: isNewUser }), now).run();

      return { cmd: "PTA_SCAN", payload: {
        ok: true,
        is_new_user: isNewUser,
        scanner: { id: scanner.id, name: scanner.name || scannerKey, identity_key: scannerKey },
        target: { id: target.id, name: target.name },
        edge_id: edgeId,
        group: { id: groupId, name: groupName },
        moment: momentId ? { id: momentId, name: momentName } : null,
        aura_welcomed: !!welcomeEdgeId,
        note: isNewUser ? "New user created and welcomed by Aura — they have entered the ecosystem." : "Existing user connected to target via PTA scan."
      }};
    }

    case "PTA_VERIFY": {
      // Set verification level on an entity. Trust floor for the graph.
      // PTA_VERIFY <entity_id> <level: unverified|phone_verified|email_verified|identity_verified|aura_verified>
      if (!isOp) return { cmd: "PTA_VERIFY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const entId = args[0] || "";
      const level = (args[1] || "").toLowerCase();
      const validLevels = ["unverified", "phone_verified", "email_verified", "identity_verified", "aura_verified"];
      if (!entId || !validLevels.includes(level)) return { cmd: "PTA_VERIFY", payload: { ok: false, error: "Usage: PTA_VERIFY <entity_id> <unverified|phone_verified|email_verified|identity_verified|aura_verified>" } };
      const ent = await db.prepare("SELECT id, name FROM pta_entities WHERE id = ?").bind(entId).first();
      if (!ent) return { cmd: "PTA_VERIFY", payload: { ok: false, error: "Entity not found" } };
      await db.prepare("UPDATE pta_entities SET verification_level = ?, updated_at = ? WHERE id = ?").bind(level, new Date().toISOString(), entId).run();
      return { cmd: "PTA_VERIFY", payload: { ok: true, entity_id: entId, name: ent.name, verification_level: level } };
    }

    case "VERIFY_REQUEST": {
      // REAL identity verification, step 1: prove you own the identity you claim. Generate a code,
      // store it briefly, send it to that exact email (via the global sendEmail). You cannot receive
      // the code unless you control the inbox - that IS the authentication. No admin token decides
      // it; the code does. This is how every citizen authenticates (not just the operator).
      // VERIFY_REQUEST <identity>   e.g. VERIFY_REQUEST email:someone@example.com
      const vIdentity = (args[0] || "").trim();
      if (!/^email:/i.test(vIdentity)) return { cmd: "VERIFY_REQUEST", payload: { ok: false, error: "Usage: VERIFY_REQUEST email:you@example.com (phone verification coming separately)" } };
      const vEmail = vIdentity.replace(/^email:/i, "").trim();
      const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
      const rec = { identity: vIdentity, code, created: Date.now(), expires: Date.now() + 10 * 60 * 1000, attempts: 0 };
      await env.AURA_KV.put(`verify:${vIdentity}`, JSON.stringify(rec), { expirationTtl: 900 }).catch(() => {});
      const sent = await sendEmail(env, vEmail, "Your Aura verification code", `Your verification code is ${code}\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.`);
      return { cmd: "VERIFY_REQUEST", payload: { ok: !!(sent && sent.ok), identity: vIdentity, email_status: sent, message: (sent && sent.ok) ? "Code sent. Check your email, then call VERIFY_CONFIRM with the code." : "Could not send the code - check email delivery." } };
    }

    case "VERIFY_CONFIRM": {
      // REAL identity verification, step 2: enter the code. If it matches and has not expired, the
      // identity is PROVEN owned. We then create-or-find the person's PTA and mark it email_verified.
      // This is the moment someone becomes an authenticated citizen.
      // VERIFY_CONFIRM <identity> <code> [name]
      const cIdentity = (args[0] || "").trim();
      const cCode = (args[1] || "").trim();
      const cName = args.slice(2).join(" ").trim() || null;
      if (!/^email:/i.test(cIdentity) || !cCode) return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "Usage: VERIFY_CONFIRM email:you@example.com <code> [name]" } };
      let rec = null; try { const r = await env.AURA_KV.get(`verify:${cIdentity}`); if (r) rec = JSON.parse(r); } catch {}
      if (!rec) return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "No pending verification - request a code first (VERIFY_REQUEST)." } };
      if (Date.now() > rec.expires) { await env.AURA_KV.delete(`verify:${cIdentity}`).catch(() => {}); return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "Code expired - request a new one." } }; }
      if (rec.attempts >= 5) { await env.AURA_KV.delete(`verify:${cIdentity}`).catch(() => {}); return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "Too many attempts - request a new code." } }; }
      if (cCode !== rec.code) { rec.attempts++; await env.AURA_KV.put(`verify:${cIdentity}`, JSON.stringify(rec), { expirationTtl: 900 }).catch(() => {}); return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "Incorrect code.", attempts_left: 5 - rec.attempts } }; }
      // proven. create or find the PTA, mark email_verified.
      const db = env.AURA_MEMORY;
      const safeName = (cName || "New PTA").replace(/[\n\r]/g, " ");
      let entId = null, mode = null;
      try {
        const r = await processCommand(`PTA_ENTITY CREATE person ${safeName} identity:${cIdentity}`, env, true);
        const pp = r && r.payload ? r.payload : r;
        if (pp && pp.ok && pp.entity) { entId = pp.entity.id; mode = pp.mode; }
      } catch (e) { return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "PTA creation failed: " + e.message } }; }
      if (!entId) return { cmd: "VERIFY_CONFIRM", payload: { ok: false, error: "Could not establish PTA" } };
      await db.prepare("UPDATE pta_entities SET verification_level = ?, updated_at = ? WHERE id = ?").bind("email_verified", new Date().toISOString(), entId).run();
      await env.AURA_KV.delete(`verify:${cIdentity}`).catch(() => {});
      try {
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${entId}`); if (tl) evs = JSON.parse(tl) || [];
        evs.push({ ts: new Date().toISOString(), event: "Identity verified by email - became an authenticated citizen", kind: "verified" });
        await env.AURA_KV.put(`pta:timeline:${entId}`, JSON.stringify(evs)).catch(() => {});
      } catch {}
      return { cmd: "VERIFY_CONFIRM", payload: { ok: true, pta: entId, mode, identity: cIdentity, verification_level: "email_verified", message: "Identity proven. You are now an authenticated PTA." } };
    }

    case "AUTH_PROVIDER": {
      // A third-party provider (Google, etc.) has already verified an identity. This is the SINGLE
      // engine that turns that into a birthed, verified PTA - so the HTTP/OAuth transport layer never
      // does DB writes itself; it just hands the verified identity here. Mirrors VERIFY_CONFIRM but
      // for provider-verified (vs code-verified) identities. Keeps all PTA logic in the engine.
      // AUTH_PROVIDER <provider> <identity> <name...>   e.g. AUTH_PROVIDER google email:x@y.com Aaron Karacas
      const apProvider = (args[0] || "").toLowerCase();
      const apIdentity = (args[1] || "").trim();
      const apName = args.slice(2).join(" ").trim() || (apIdentity.replace(/^email:/i, "").split("@")[0]);
      if (!apProvider || !/^email:/i.test(apIdentity)) return { cmd: "AUTH_PROVIDER", payload: { ok: false, error: "Usage: AUTH_PROVIDER <provider> email:you@example.com <name>" } };
      const db = env.AURA_MEMORY;
      let entId = null, mode = null;
      try {
        const r = await processCommand(`PTA_ENTITY CREATE person ${apName.replace(/[\n\r]/g, " ")} identity:${apIdentity}`, env, true);
        const pp = r && r.payload ? r.payload : r;
        if (pp && pp.ok && pp.entity) { entId = pp.entity.id; mode = pp.mode; }
      } catch (e) { return { cmd: "AUTH_PROVIDER", payload: { ok: false, error: "PTA creation failed: " + e.message } }; }
      if (!entId) return { cmd: "AUTH_PROVIDER", payload: { ok: false, error: "Could not establish PTA" } };
      const level = apProvider + "_verified";
      await db.prepare("UPDATE pta_entities SET verification_level = ?, updated_at = ? WHERE id = ?").bind(level, new Date().toISOString(), entId).run();
      if (mode !== "existing") {
        try {
          let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${entId}`); if (tl) evs = JSON.parse(tl) || [];
          evs.push({ ts: new Date().toISOString(), event: `Identity verified via ${apProvider} - became an authenticated citizen`, kind: "verified" });
          await env.AURA_KV.put(`pta:timeline:${entId}`, JSON.stringify(evs)).catch(() => {});
        } catch {}
      }
      return { cmd: "AUTH_PROVIDER", payload: { ok: true, pta: entId, mode, identity: apIdentity, name: apName, verification_level: level } };
    }

    case "PTA_QUERY": {
      // Cross-graph queries — intelligence across the whole relationship graph.
      // PTA_QUERY MUTUAL <id1> <id2> — who do both entities know
      // PTA_QUERY PATH <id1> <id2> [max_depth=4] — shortest path between two entities
      // PTA_QUERY COMMON_MOMENTS <id1> <id2> — what moments do both share
      // PTA_QUERY MOMENT_CROSS <moment1> <moment2> — who was at both moments
      // PTA_QUERY CONNECTED <entity_id> <type> — find all entities of a type connected to this entity
      if (!isOp) return { cmd: "PTA_QUERY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const sub = (args[0] || "").toUpperCase();

      if (sub === "MUTUAL") {
        const id1 = args[1] || "", id2 = args[2] || "";
        if (!id1 || !id2) return { cmd: "PTA_QUERY", payload: { ok: false, error: "Usage: PTA_QUERY MUTUAL <entity_id_1> <entity_id_2>" } };
        // Find entities connected to id1
        const conn1out = await db.prepare("SELECT DISTINCT to_id FROM pta_edges WHERE from_id = ? AND state = 'active'").bind(id1).all();
        const conn1in = await db.prepare("SELECT DISTINCT from_id FROM pta_edges WHERE to_id = ? AND state = 'active'").bind(id1).all();
        const set1 = new Set([...(conn1out.results || []).map(r => r.to_id), ...(conn1in.results || []).map(r => r.from_id)]);
        // Find entities connected to id2
        const conn2out = await db.prepare("SELECT DISTINCT to_id FROM pta_edges WHERE from_id = ? AND state = 'active'").bind(id2).all();
        const conn2in = await db.prepare("SELECT DISTINCT from_id FROM pta_edges WHERE to_id = ? AND state = 'active'").bind(id2).all();
        const set2 = new Set([...(conn2out.results || []).map(r => r.to_id), ...(conn2in.results || []).map(r => r.from_id)]);
        // Intersection
        const mutual = [...set1].filter(x => set2.has(x) && x !== id1 && x !== id2);
        // Enrich with names
        const enriched = [];
        for (const mid of mutual) {
          const ent = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(mid).first();
          if (ent) enriched.push(ent);
        }
        const e1 = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(id1).first();
        const e2 = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(id2).first();
        return { cmd: "PTA_QUERY", payload: { ok: true, query: "mutual", between: [e1 ? e1.name : id1, e2 ? e2.name : id2], mutual_count: enriched.length, mutual_connections: enriched } };
      }

      if (sub === "PATH") {
        const id1 = args[1] || "", id2 = args[2] || "";
        const maxD = Math.min(parseInt(args[3]) || 4, 6);
        if (!id1 || !id2) return { cmd: "PTA_QUERY", payload: { ok: false, error: "Usage: PTA_QUERY PATH <entity_id_1> <entity_id_2> [max_depth]" } };
        // BFS shortest path
        const visited = new Map();
        const queue = [{ id: id1, depth: 0, path: [id1] }];
        visited.set(id1, [id1]);
        let found = null;
        while (queue.length > 0 && !found) {
          const { id, depth, path } = queue.shift();
          if (depth >= maxD) continue;
          const outEdges = await db.prepare("SELECT to_id, edge_type FROM pta_edges WHERE from_id = ? AND state = 'active' LIMIT 50").bind(id).all();
          const inEdges = await db.prepare("SELECT from_id, edge_type FROM pta_edges WHERE to_id = ? AND state = 'active' LIMIT 50").bind(id).all();
          const neighbors = [
            ...(outEdges.results || []).map(e => ({ id: e.to_id, via: e.edge_type })),
            ...(inEdges.results || []).map(e => ({ id: e.from_id, via: e.edge_type }))
          ];
          for (const n of neighbors) {
            if (visited.has(n.id)) continue;
            const newPath = [...path, n.id];
            if (n.id === id2) { found = newPath; break; }
            visited.set(n.id, newPath);
            queue.push({ id: n.id, depth: depth + 1, path: newPath });
          }
        }
        if (!found) return { cmd: "PTA_QUERY", payload: { ok: true, query: "path", connected: false, note: `No path found within depth ${maxD}` } };
        // Enrich path with names
        const pathEnriched = [];
        for (const pid of found) {
          const ent = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(pid).first();
          pathEnriched.push(ent || { id: pid, name: "unknown", type: "unknown" });
        }
        return { cmd: "PTA_QUERY", payload: { ok: true, query: "path", connected: true, hops: found.length - 1, path: pathEnriched } };
      }

      if (sub === "COMMON_MOMENTS") {
        const id1 = args[1] || "", id2 = args[2] || "";
        if (!id1 || !id2) return { cmd: "PTA_QUERY", payload: { ok: false, error: "Usage: PTA_QUERY COMMON_MOMENTS <entity_id_1> <entity_id_2>" } };
        // Moments id1 participated in
        const m1 = await db.prepare("SELECT DISTINCT moment_id FROM pta_edges WHERE (from_id = ? OR to_id = ?) AND moment_id IS NOT NULL").bind(id1, id1).all();
        const set1 = new Set((m1.results || []).map(r => r.moment_id).filter(Boolean));
        // Moments id2 participated in
        const m2 = await db.prepare("SELECT DISTINCT moment_id FROM pta_edges WHERE (from_id = ? OR to_id = ?) AND moment_id IS NOT NULL").bind(id2, id2).all();
        const set2 = new Set((m2.results || []).map(r => r.moment_id).filter(Boolean));
        const common = [...set1].filter(x => set2.has(x));
        const enriched = [];
        for (const mid of common) {
          const mom = await db.prepare("SELECT id, name, context FROM pta_moments WHERE id = ?").bind(mid).first();
          if (mom) enriched.push(mom);
        }
        const e1 = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(id1).first();
        const e2 = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(id2).first();
        return { cmd: "PTA_QUERY", payload: { ok: true, query: "common_moments", between: [e1 ? e1.name : id1, e2 ? e2.name : id2], count: enriched.length, moments: enriched } };
      }

      if (sub === "MOMENT_CROSS") {
        const mom1 = args[1] || "", mom2 = args[2] || "";
        if (!mom1 || !mom2) return { cmd: "PTA_QUERY", payload: { ok: false, error: "Usage: PTA_QUERY MOMENT_CROSS <moment_id_1> <moment_id_2>" } };
        // Entities in moment 1
        const e1out = await db.prepare("SELECT DISTINCT from_id as eid FROM pta_edges WHERE moment_id = ?").bind(mom1).all();
        const e1in = await db.prepare("SELECT DISTINCT to_id as eid FROM pta_edges WHERE moment_id = ?").bind(mom1).all();
        const set1 = new Set([...(e1out.results || []).map(r => r.eid), ...(e1in.results || []).map(r => r.eid)]);
        // Entities in moment 2
        const e2out = await db.prepare("SELECT DISTINCT from_id as eid FROM pta_edges WHERE moment_id = ?").bind(mom2).all();
        const e2in = await db.prepare("SELECT DISTINCT to_id as eid FROM pta_edges WHERE moment_id = ?").bind(mom2).all();
        const set2 = new Set([...(e2out.results || []).map(r => r.eid), ...(e2in.results || []).map(r => r.eid)]);
        // Intersection, exclude moment entities themselves and Aura
        const cross = [...set1].filter(x => set2.has(x) && x !== mom1 && x !== mom2 && x !== "pta_aura");
        const enriched = [];
        for (const eid of cross) {
          const ent = await db.prepare("SELECT id, name, type FROM pta_entities WHERE id = ?").bind(eid).first();
          if (ent && ent.type !== "moment") enriched.push(ent);
        }
        const m1 = await db.prepare("SELECT name FROM pta_moments WHERE id = ?").bind(mom1).first();
        const m2 = await db.prepare("SELECT name FROM pta_moments WHERE id = ?").bind(mom2).first();
        return { cmd: "PTA_QUERY", payload: { ok: true, query: "moment_cross", moments: [m1 ? m1.name : mom1, m2 ? m2.name : mom2], overlap_count: enriched.length, people_at_both: enriched } };
      }

      if (sub === "CONNECTED") {
        const entId = args[1] || "", filterType = (args[2] || "").toLowerCase();
        if (!entId) return { cmd: "PTA_QUERY", payload: { ok: false, error: "Usage: PTA_QUERY CONNECTED <entity_id> <type>" } };
        // All active connections from/to this entity
        const outEdges = await db.prepare("SELECT DISTINCT to_id FROM pta_edges WHERE from_id = ? AND state = 'active'").bind(entId).all();
        const inEdges = await db.prepare("SELECT DISTINCT from_id FROM pta_edges WHERE to_id = ? AND state = 'active'").bind(entId).all();
        const allIds = new Set([...(outEdges.results || []).map(r => r.to_id), ...(inEdges.results || []).map(r => r.from_id)]);
        allIds.delete(entId);
        const results = [];
        for (const cid of allIds) {
          const ent = await db.prepare("SELECT id, name, type, verification_level FROM pta_entities WHERE id = ?").bind(cid).first();
          if (ent && (!filterType || ent.type === filterType)) results.push(ent);
        }
        const source = await db.prepare("SELECT name FROM pta_entities WHERE id = ?").bind(entId).first();
        return { cmd: "PTA_QUERY", payload: { ok: true, query: "connected", entity: source ? source.name : entId, type_filter: filterType || "all", count: results.length, connected: results } };
      }

      return { cmd: "PTA_QUERY", payload: { ok: false, error: "Sub-commands: MUTUAL, PATH, COMMON_MOMENTS, MOMENT_CROSS, CONNECTED" } };
    }

    case "PTA_DISCOVER": {
      // Discover all entities connected to a moment — the community that formed.
      // PTA_DISCOVER <moment_id>
      if (!isOp) return { cmd: "PTA_DISCOVER", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const db = env.AURA_MEMORY;
      const momId = args[0] || "";
      if (!momId) return { cmd: "PTA_DISCOVER", payload: { ok: false, error: "Usage: PTA_DISCOVER <moment_id>" } };
      const mom = await db.prepare("SELECT * FROM pta_moments WHERE id = ?").bind(momId).first();
      if (!mom) return { cmd: "PTA_DISCOVER", payload: { ok: false, error: "Moment not found" } };
      // Find all edges tagged with this moment
      const edges = await db.prepare("SELECT e.from_id, e.to_id, e.edge_type, e.state, pe1.name as from_name, pe1.type as from_type, pe2.name as to_name, pe2.type as to_type FROM pta_edges e JOIN pta_entities pe1 ON e.from_id = pe1.id JOIN pta_entities pe2 ON e.to_id = pe2.id WHERE e.moment_id = ? ORDER BY e.created_at ASC LIMIT 500").bind(momId).all();
      // Extract unique participants (exclude the moment entity itself and Aura)
      const participants = new Map();
      for (const e of (edges.results || [])) {
        if (e.from_id !== momId && e.from_id !== "pta_aura") participants.set(e.from_id, { id: e.from_id, name: e.from_name, type: e.from_type });
        if (e.to_id !== momId && e.to_id !== "pta_aura") participants.set(e.to_id, { id: e.to_id, name: e.to_name, type: e.to_type });
      }
      return { cmd: "PTA_DISCOVER", payload: { ok: true, moment: { id: mom.id, name: mom.name, context: mom.context }, participant_count: participants.size, participants: [...participants.values()], edge_count: edges.results.length } };
    }

    // ═══════════════════════════════════════════════════════════
    // AURAPAY — Universal payment layer. Wraps Stripe completely.
    // No one ever sees Stripe. AuraPay is the face.
    // ═══════════════════════════════════════════════════════════

    case "AURAPAY": {
      if (!isOp) return { cmd: "AURAPAY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const sub = (args[0] || "").toUpperCase();
      let stripeKey = await env.AURA_KV.get("secret:stripe").catch(() => null);
      if (!stripeKey) return { cmd: "AURAPAY", payload: { ok: false, error: "Stripe not configured" } };
      if (stripeKey.startsWith("{")) { try { stripeKey = JSON.parse(stripeKey).secret_key || JSON.parse(stripeKey).key || stripeKey; } catch {} }
      const stripeCall = async (endpoint, method = "GET", body = null) => {
        const opts = { method, headers: { "Authorization": "Basic " + btoa(stripeKey + ":") } };
        if (body) { opts.headers["Content-Type"] = "application/x-www-form-urlencoded"; opts.body = body.toString(); }
        const r = await fetch(`https://api.stripe.com/v1/${endpoint}`, opts);
        return r.json();
      };

      if (sub === "BALANCE") {
        const bal = await stripeCall("balance");
        const available = (bal.available || []).map(b => ({ amount: b.amount / 100, currency: b.currency }));
        const pending = (bal.pending || []).map(b => ({ amount: b.amount / 100, currency: b.currency }));
        return { cmd: "AURAPAY", payload: { ok: true, mode: "balance", available, pending } };
      }

      if (sub === "TRANSACTIONS") {
        const limit = parseInt(args[1]) || 10;
        const charges = await stripeCall(`charges?limit=${limit}`);
        const txns = (charges.data || []).map(c => ({
          id: c.id, amount: c.amount / 100, currency: c.currency, status: c.status,
          description: c.description, customer: c.customer, created: new Date(c.created * 1000).toISOString(),
          metadata: c.metadata, receipt_url: c.receipt_url,
          statement_descriptor: c.statement_descriptor || c.calculated_statement_descriptor
        }));
        return { cmd: "AURAPAY", payload: { ok: true, mode: "transactions", count: txns.length, transactions: txns } };
      }

      if (sub === "REFUND") {
        const chargeId = args[1] || "";
        if (!chargeId) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY REFUND <charge_id> [amount_cents]" } };
        const params = new URLSearchParams();
        params.append("charge", chargeId);
        const amountCents = parseInt(args[2]);
        if (amountCents > 0) params.append("amount", amountCents.toString());
        const refund = await stripeCall("refunds", "POST", params);
        if (refund.error) return { cmd: "AURAPAY", payload: { ok: false, error: refund.error.message } };
        return { cmd: "AURAPAY", payload: { ok: true, mode: "refund", refund_id: refund.id, amount: refund.amount / 100, status: refund.status } };
      }

      if (sub === "CUSTOMER") {
        // AURAPAY CUSTOMER CREATE <email> [name] or AURAPAY CUSTOMER GET <customer_id> or AURAPAY CUSTOMER FIND <email>
        const action = (args[1] || "").toUpperCase();
        if (action === "CREATE") {
          const email = args[2] || "";
          const name = args.slice(3).join(" ") || "";
          if (!email) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY CUSTOMER CREATE <email> [name]" } };
          const params = new URLSearchParams();
          params.append("email", email);
          if (name) params.append("name", name);
          params.append("metadata[source]", "aurapay");
          const cust = await stripeCall("customers", "POST", params);
          if (cust.error) return { cmd: "AURAPAY", payload: { ok: false, error: cust.error.message } };
          return { cmd: "AURAPAY", payload: { ok: true, mode: "customer_created", customer_id: cust.id, email: cust.email, name: cust.name } };
        }
        if (action === "GET") {
          const custId = args[2] || "";
          if (!custId) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY CUSTOMER GET <customer_id>" } };
          const cust = await stripeCall(`customers/${custId}`);
          if (cust.error) return { cmd: "AURAPAY", payload: { ok: false, error: cust.error.message } };
          return { cmd: "AURAPAY", payload: { ok: true, mode: "customer", customer_id: cust.id, email: cust.email, name: cust.name, created: new Date(cust.created * 1000).toISOString() } };
        }
        if (action === "FIND") {
          const email = args[2] || "";
          if (!email) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY CUSTOMER FIND <email>" } };
          const result = await stripeCall(`customers?email=${encodeURIComponent(email)}&limit=1`);
          if (!result.data || result.data.length === 0) return { cmd: "AURAPAY", payload: { ok: true, mode: "customer_not_found", email } };
          const c = result.data[0];
          return { cmd: "AURAPAY", payload: { ok: true, mode: "customer_found", customer_id: c.id, email: c.email, name: c.name } };
        }
        return { cmd: "AURAPAY", payload: { ok: false, error: "CUSTOMER sub-commands: CREATE, GET, FIND" } };
      }

      if (sub === "SUBSCRIBE") {
        // AURAPAY SUBSCRIBE <customer_id> <amount_cents> <interval: month|year> [description]
        const custId = args[1] || "";
        const amount = parseInt(args[2]) || 0;
        const interval = (args[3] || "month").toLowerCase();
        const desc = args.slice(4).join(" ") || "AuraPay Subscription";
        if (!custId || !amount) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY SUBSCRIBE <customer_id> <amount_cents> <month|year> [description]" } };
        const params = new URLSearchParams();
        params.append("customer", custId);
        params.append("items[0][price_data][currency]", "usd");
        params.append("items[0][price_data][product_data][name]", desc);
        params.append("items[0][price_data][unit_amount]", amount.toString());
        params.append("items[0][price_data][recurring][interval]", interval);
        const subscription = await stripeCall("subscriptions", "POST", params);
        if (subscription.error) return { cmd: "AURAPAY", payload: { ok: false, error: subscription.error.message } };
        return { cmd: "AURAPAY", payload: { ok: true, mode: "subscribed", subscription_id: subscription.id, status: subscription.status, customer: custId, amount: amount / 100, interval } };
      }

      if (sub === "CANCEL") {
        const subId = args[1] || "";
        if (!subId) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY CANCEL <subscription_id>" } };
        const result = await stripeCall(`subscriptions/${subId}`, "DELETE");
        if (result.error) return { cmd: "AURAPAY", payload: { ok: false, error: result.error.message } };
        return { cmd: "AURAPAY", payload: { ok: true, mode: "cancelled", subscription_id: result.id, status: result.status } };
      }

      if (sub === "CHECKOUT") {
        // AURAPAY CHECKOUT <type: shop|design|custom> [amount_cents] [description]
        const type = (args[1] || "custom").toLowerCase();
        let amount, productName, mode = "payment";
        if (type === "shop") { amount = 10000; productName = "MyTattoo.world — Studio Membership"; mode = "subscription"; }
        else if (type === "design") { amount = 1000; productName = "MyTattoo.world — Tattoo Design Session"; }
        else { amount = parseInt(args[2]) || 50; productName = args.slice(3).join(" ") || "AuraPay Payment"; }
        const params = new URLSearchParams();
        params.append("mode", mode === "subscription" ? "subscription" : "payment");
        params.append("line_items[0][price_data][currency]", "usd");
        params.append("line_items[0][price_data][product_data][name]", productName);
        params.append("line_items[0][price_data][unit_amount]", amount.toString());
        if (mode === "subscription") params.append("line_items[0][price_data][recurring][interval]", "month");
        params.append("line_items[0][quantity]", "1");
        params.append("success_url", "https://mytattoo.world/welcome?payment=success");
        params.append("cancel_url", "https://mytattoo.world/shops");
        if (mode === "payment") params.append("payment_intent_data[statement_descriptor]", "MYTATTOO.WORLD");
        const session = await stripeCall("checkout/sessions", "POST", params);
        if (session.error) return { cmd: "AURAPAY", payload: { ok: false, error: session.error.message } };
        return { cmd: "AURAPAY", payload: { ok: true, mode: "checkout_created", url: session.url, session_id: session.id, amount: amount / 100, product: productName } };
      }

      if (sub === "METHODS") {
        // List/manage payment methods visible in checkout — Note: most payment method config is in Stripe Dashboard
        // This returns what's currently enabled on the account
        const pm = await stripeCall("payment_method_configurations?limit=5");
        return { cmd: "AURAPAY", payload: { ok: true, mode: "payment_methods", note: "Payment method configuration is managed in Stripe Dashboard > Settings > Payment methods. Use the dashboard to enable/disable Apple Pay, Google Pay, Card, Bank, etc.", data: pm.data ? pm.data.length + " configurations found" : "none" } };
      }

      if (sub === "API") {
        // Generic Stripe API: AURAPAY API <GET|POST|DELETE> <endpoint>
        const method = (args[1] || "GET").toUpperCase();
        let endpoint = args[2] || "";
        if (!endpoint) return { cmd: "AURAPAY", payload: { ok: false, error: "Usage: AURAPAY API GET <endpoint>. Example: AURAPAY API GET customers?limit=5" } };
        if (endpoint.startsWith("/v1/")) endpoint = endpoint.slice(4);
        if (endpoint.startsWith("v1/")) endpoint = endpoint.slice(3);
        const result = await stripeCall(endpoint, method, method === "POST" ? (() => { const b = rest.slice(rest.indexOf(endpoint) + endpoint.length).trim(); return b ? new URLSearchParams(b) : null; })() : null);
        if (result.data && Array.isArray(result.data)) {
          return { cmd: "AURAPAY", payload: { ok: true, mode: "api", endpoint, count: result.data.length, has_more: result.has_more, items: result.data.slice(0, 10).map(d => { const s = { id: d.id, object: d.object }; for (const k of ["name","email","status","amount","currency","description","last4","brand","type","active","livemode"]) { if (d[k] !== undefined) s[k] = d[k]; } if (d.created) s.created = new Date(d.created * 1000).toISOString(); return s; }) } };
        }
        if (result.error) return { cmd: "AURAPAY", payload: { ok: false, mode: "api", endpoint, error: result.error.message || result.error } };
        return { cmd: "AURAPAY", payload: { ok: true, mode: "api", endpoint, data: result } };
      }

      return { cmd: "AURAPAY", payload: { ok: false, error: "Sub-commands: BALANCE, TRANSACTIONS, REFUND, CUSTOMER (CREATE/GET/FIND), SUBSCRIBE, CANCEL, CHECKOUT, METHODS, API <GET|POST|DELETE> <endpoint>" } };
    }

    // ═══════════════════════════════════════════════════════════
    // CAPABILITY REGISTRY — What Aura can do. Universal.
    // Each capability is a building block. Industries select what they need.
    // ═══════════════════════════════════════════════════════════

    case "CAPABILITY": {
      if (!isOp) return { cmd: "CAPABILITY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const sub = (args[0] || "").toUpperCase();

      if (sub === "REGISTER") {
        // CAPABILITY REGISTER <name> <cost_per_use_cents> <description...>
        const name = (args[1] || "").toLowerCase();
        const costCents = parseInt(args[2]) || 0;
        const description = args.slice(3).join(" ") || "";
        if (!name) return { cmd: "CAPABILITY", payload: { ok: false, error: "Usage: CAPABILITY REGISTER <name> <cost_per_use_cents> <description>" } };
        const cap = { name, cost_per_use_cents: costCents, description, registered_at: new Date().toISOString(), status: "active" };
        await env.AURA_KV.put(`capability:${name}`, JSON.stringify(cap));
        return { cmd: "CAPABILITY", payload: { ok: true, mode: "registered", capability: cap } };
      }

      if (sub === "LIST") {
        const keys = await env.AURA_KV.list({ prefix: "capability:" });
        const caps = [];
        for (const key of (keys.keys || [])) {
          try { const raw = await env.AURA_KV.get(key.name); caps.push(JSON.parse(raw)); } catch {}
        }
        return { cmd: "CAPABILITY", payload: { ok: true, mode: "list", count: caps.length, capabilities: caps } };
      }

      if (sub === "GET") {
        const name = (args[1] || "").toLowerCase();
        if (!name) return { cmd: "CAPABILITY", payload: { ok: false, error: "Usage: CAPABILITY GET <name>" } };
        const raw = await env.AURA_KV.get(`capability:${name}`);
        if (!raw) return { cmd: "CAPABILITY", payload: { ok: false, error: "Capability not found" } };
        return { cmd: "CAPABILITY", payload: { ok: true, mode: "get", capability: JSON.parse(raw) } };
      }

      if (sub === "DELETE") {
        const name = (args[1] || "").toLowerCase();
        if (!name) return { cmd: "CAPABILITY", payload: { ok: false, error: "Usage: CAPABILITY DELETE <name>" } };
        await env.AURA_KV.delete(`capability:${name}`);
        return { cmd: "CAPABILITY", payload: { ok: true, mode: "deleted", name } };
      }

      return { cmd: "CAPABILITY", payload: { ok: false, error: "Sub-commands: REGISTER, LIST, GET, DELETE" } };
    }

    // ═══════════════════════════════════════════════════════════
    // INDUSTRY CONTEXT REGISTRY — How Aura behaves per vertical.
    // Each industry selects capabilities and defines context.
    // Adding a new vertical = writing one document.
    // ═══════════════════════════════════════════════════════════

    case "INDUSTRY": {
      if (!isOp) return { cmd: "INDUSTRY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const sub = (args[0] || "").toUpperCase();

      if (sub === "REGISTER") {
        // INDUSTRY REGISTER <name> — then set details via INDUSTRY UPDATE
        const name = (args[1] || "").toLowerCase();
        if (!name) return { cmd: "INDUSTRY", payload: { ok: false, error: "Usage: INDUSTRY REGISTER <name>" } };
        const existing = await env.AURA_KV.get(`industry:${name}`).catch(() => null);
        if (existing) return { cmd: "INDUSTRY", payload: { ok: false, error: "Industry already exists. Use INDUSTRY UPDATE." } };
        const industry = { name, intent: "", capabilities: [], system_prompt: "", customer_payment: "", business_payment: "", constraints: [], page_template: "", world_version: 1, registered_at: new Date().toISOString(), status: "draft" };
        await env.AURA_KV.put(`industry:${name}`, JSON.stringify(industry));
        return { cmd: "INDUSTRY", payload: { ok: true, mode: "registered", industry } };
      }

      if (sub === "UPDATE") {
        // INDUSTRY UPDATE <name> <json with fields to update>
        const name = (args[1] || "").toLowerCase();
        if (!name) return { cmd: "INDUSTRY", payload: { ok: false, error: "Usage: INDUSTRY UPDATE <name> <json>" } };
        const existing = await env.AURA_KV.get(`industry:${name}`);
        if (!existing) return { cmd: "INDUSTRY", payload: { ok: false, error: "Industry not found. Use INDUSTRY REGISTER first." } };
        let current = JSON.parse(existing);
        const afterName = rest.slice(rest.indexOf(name) + name.length).trim();
        const jsonStart = afterName.indexOf("{");
        if (jsonStart >= 0) {
          try {
            const updates = JSON.parse(afterName.slice(jsonStart));
            current = { ...current, ...updates, updated_at: new Date().toISOString() };
            await env.AURA_KV.put(`industry:${name}`, JSON.stringify(current));
          } catch (e) { return { cmd: "INDUSTRY", payload: { ok: false, error: "Invalid JSON: " + e.message } }; }
        }
        return { cmd: "INDUSTRY", payload: { ok: true, mode: "updated", industry: current } };
      }

      if (sub === "LIST") {
        const keys = await env.AURA_KV.list({ prefix: "industry:" });
        const industries = [];
        for (const key of (keys.keys || [])) {
          try { const raw = await env.AURA_KV.get(key.name); const ind = JSON.parse(raw); industries.push({ name: ind.name, intent: ind.intent, capabilities: ind.capabilities, status: ind.status }); } catch {}
        }
        return { cmd: "INDUSTRY", payload: { ok: true, mode: "list", count: industries.length, industries } };
      }

      if (sub === "GET") {
        const name = (args[1] || "").toLowerCase();
        if (!name) return { cmd: "INDUSTRY", payload: { ok: false, error: "Usage: INDUSTRY GET <name>" } };
        const raw = await env.AURA_KV.get(`industry:${name}`);
        if (!raw) return { cmd: "INDUSTRY", payload: { ok: false, error: "Industry not found" } };
        return { cmd: "INDUSTRY", payload: { ok: true, mode: "get", industry: JSON.parse(raw) } };
      }

      return { cmd: "INDUSTRY", payload: { ok: false, error: "Sub-commands: REGISTER, LIST, GET, UPDATE" } };
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS STATE MACHINE — Every business has a lifecycle.
    // Lead > Trial > Active > Growing > At Risk > Past Due > Suspended > Cancelled > Reactivated
    // ═══════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════
    // TWILIO — Communication layer management. Campaigns, SMS, balance.
    // Aura owns this — no manual Twilio console needed.
    // ═══════════════════════════════════════════════════════════

    case "TWILIO": {
      if (!isOp) return { cmd: "TWILIO", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const sub = (args[0] || "").toUpperCase();
      const acctSid = await env.AURA_KV.get("secret:twilio_account_sid").catch(() => null);
      const authToken = await env.AURA_KV.get("secret:twilio_auth_token").catch(() => null);
      if (!acctSid) return { cmd: "TWILIO", payload: { ok: false, error: "No Twilio account SID (set KV secret:twilio_account_sid)" } };
      if (!authToken) return { cmd: "TWILIO", payload: { ok: false, error: "No Twilio auth token" } };
      const msgSvcSid = await env.AURA_KV.get("secret:twilio_msg_service_sid").catch(() => null);
      const twilioAuth = btoa(acctSid + ":" + authToken);
      const twilioCall = async (url, method = "GET", body = null) => {
        const opts = { method, headers: { "Authorization": "Basic " + twilioAuth } };
        if (body) { opts.headers["Content-Type"] = "application/x-www-form-urlencoded"; opts.body = body.toString(); }
        const r = await fetch(url, opts);
        return r.json();
      };

      if (sub === "BALANCE") {
        const b = await twilioCall(`https://api.twilio.com/2010-04-01/Accounts/${acctSid}/Balance.json`);
        return { cmd: "TWILIO", payload: { ok: true, mode: "balance", balance: b.balance, currency: b.currency } };
      }

      if (sub === "CAMPAIGNS") {
        const c = await twilioCall(`https://messaging.twilio.com/v1/Services/${msgSvcSid}/Compliance/Usa2p?PageSize=20`);
        if (c.code) return { cmd: "TWILIO", payload: { ok: false, error: c.message } };
        const campaigns = (c.results || []).map(r => ({ sid: r.sid, status: r.campaign_status, description: r.description, use_case: r.us_app_to_person_usecase, created: r.date_created }));
        return { cmd: "TWILIO", payload: { ok: true, mode: "campaigns", count: campaigns.length, campaigns } };
      }

      if (sub === "CAMPAIGN_STATUS") {
        const campSid = args[1] || "";
        if (!campSid) return { cmd: "TWILIO", payload: { ok: false, error: "Usage: TWILIO CAMPAIGN_STATUS <campaign_sid>" } };
        const c = await twilioCall(`https://messaging.twilio.com/v1/Services/${msgSvcSid}/Compliance/Usa2p/${campSid}`);
        if (c.code) return { cmd: "TWILIO", payload: { ok: false, error: c.message } };
        return { cmd: "TWILIO", payload: { ok: true, mode: "campaign_status", sid: c.sid, status: c.campaign_status, description: c.description, errors: c.errors || [], created: c.date_created } };
      }

      if (sub === "SUBMIT_CAMPAIGN") {
        // TWILIO SUBMIT_CAMPAIGN <brand_registration_sid> <description> <website_url> <sample1> ||| <sample2>
        const brandSid = args[1] || "";
        const afterBrand = rest.slice(rest.indexOf(brandSid) + brandSid.length).trim();
        // Parse: description ||| website ||| sample1 ||| sample2
        const parts = afterBrand.split("|||").map(s => s.trim());
        if (parts.length < 4) return { cmd: "TWILIO", payload: { ok: false, error: "Usage: TWILIO SUBMIT_CAMPAIGN <brand_sid> <description> ||| <website_url> ||| <sample_message_1> ||| <sample_message_2>" } };
        const [description, website, sample1, sample2] = parts;
        const params = new URLSearchParams();
        params.append("BrandRegistrationSid", brandSid);
        params.append("Description", description);
        params.append("MessageFlow", "Customers interact with businesses on our platform. When a customer requests a service, books an appointment, or completes a transaction, they receive transactional notifications related to that specific interaction. Customers provide their phone number during service signup. They can opt out at any time by replying STOP.");
        params.append("HasEmbeddedLinks", "true");
        params.append("HasEmbeddedPhone", "false");
        params.append("UsAppToPersonUsecase", "LOW_VOLUME");
        params.append("MessageSamples", sample1);
        params.append("MessageSamples", sample2);
        params.append("OptInType", "WEB_FORM");
        params.append("OptInMessage", "You have opted in to receive transactional messages from CALL+ by ARK Systems. Reply STOP to opt out. Msg&data rates may apply.");
        params.append("OptOutMessage", "You have been opted out and will not receive any more messages from this number. Reply START to re-subscribe.");
        params.append("HelpMessage", "CALL+ by ARK Systems provides transactional notifications for businesses. Reply STOP to opt out. Contact aaron@auras.guide for help.");
        ["HELP", "INFO"].forEach(k => params.append("HelpKeywords", k));
        ["STOP", "CANCEL", "END", "QUIT", "UNSUBSCRIBE"].forEach(k => params.append("OptOutKeywords", k));
        ["START", "SUBSCRIBE", "YES"].forEach(k => params.append("OptInKeywords", k));
        const result = await twilioCall(`https://messaging.twilio.com/v1/Services/${msgSvcSid}/Compliance/Usa2p`, "POST", params);
        if (result.code) return { cmd: "TWILIO", payload: { ok: false, error: result.message, code: result.code } };
        // Store campaign info
        await env.AURA_KV.put("notes:twilio:a2p_campaign", JSON.stringify({ sid: result.sid, status: result.campaign_status, submitted: new Date().toISOString(), website, description })).catch(() => {});
        return { cmd: "TWILIO", payload: { ok: true, mode: "campaign_submitted", sid: result.sid, status: result.campaign_status } };
      }

      if (sub === "SEND") {
        // TWILIO SEND <to_number> <message>
        const to = args[1] || "";
        const msgBody = rest.slice(rest.indexOf(to) + to.length).trim();
        if (!to || !msgBody) return { cmd: "TWILIO", payload: { ok: false, error: "Usage: TWILIO SEND <to_number> <message>" } };
        const params = new URLSearchParams();
        params.append("To", to);
        params.append("MessagingServiceSid", msgSvcSid);
        params.append("Body", msgBody);
        const result = await twilioCall(`https://api.twilio.com/2010-04-01/Accounts/${acctSid}/Messages.json`, "POST", params);
        if (result.code) return { cmd: "TWILIO", payload: { ok: false, error: result.message, code: result.code } };
        return { cmd: "TWILIO", payload: { ok: true, mode: "sent", sid: result.sid, to: result.to, status: result.status } };
      }

      if (sub === "BRANDS") {
        const b = await twilioCall(`https://messaging.twilio.com/v1/a2p/BrandRegistrations?PageSize=20`);
        if (b.code) return { cmd: "TWILIO", payload: { ok: false, error: b.message } };
        const brands = (b.results || []).map(r => ({ sid: r.sid, status: r.status, brand_type: r.brand_type, customer_profile_sid: r.customer_profile_bundle_sid }));
        return { cmd: "TWILIO", payload: { ok: true, mode: "brands", count: brands.length, brands } };
      }

      return { cmd: "TWILIO", payload: { ok: false, error: "Sub-commands: BALANCE, CAMPAIGNS, CAMPAIGN_STATUS <sid>, SUBMIT_CAMPAIGN <brand_sid> <desc> ||| <url> ||| <sample1> ||| <sample2>, SEND <to> <msg>, BRANDS" } };
    }

    case "BUSINESS_STATE": {
      if (!isOp) return { cmd: "BUSINESS_STATE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const sub = (args[0] || "").toUpperCase();
      const validStates = ["lead", "trial", "active", "growing", "at_risk", "past_due", "suspended", "cancelled", "reactivated"];

      if (sub === "SET") {
        const entityId = args[1] || "";
        const newState = (args[2] || "").toLowerCase();
        if (!entityId || !validStates.includes(newState)) return { cmd: "BUSINESS_STATE", payload: { ok: false, error: `Usage: BUSINESS_STATE SET <entity_id> <${validStates.join("|")}>` } };
        const stateKey = `business_state:${entityId}`;
        let current = { entity_id: entityId, state: "lead", history: [] };
        try { const raw = await env.AURA_KV.get(stateKey); if (raw) current = JSON.parse(raw); } catch {}
        const oldState = current.state;
        current.history.push({ from: oldState, to: newState, at: new Date().toISOString() });
        if (current.history.length > 50) current.history = current.history.slice(-50);
        current.state = newState;
        current.updated_at = new Date().toISOString();
        await env.AURA_KV.put(stateKey, JSON.stringify(current));
        return { cmd: "BUSINESS_STATE", payload: { ok: true, entity_id: entityId, previous: oldState, current: newState } };
      }

      if (sub === "GET") {
        const entityId = args[1] || "";
        if (!entityId) return { cmd: "BUSINESS_STATE", payload: { ok: false, error: "Usage: BUSINESS_STATE GET <entity_id>" } };
        const raw = await env.AURA_KV.get(`business_state:${entityId}`);
        if (!raw) return { cmd: "BUSINESS_STATE", payload: { ok: true, entity_id: entityId, state: "unknown", note: "No state tracked yet" } };
        return { cmd: "BUSINESS_STATE", payload: { ok: true, ...JSON.parse(raw) } };
      }

      return { cmd: "BUSINESS_STATE", payload: { ok: false, error: "Sub-commands: SET, GET" } };
    }

    // ═══════════════════════════════════════════════════════════
    // GENERATE_PAGE — Deterministic page generation. Aura's brain decides WHAT,
    // code handles HOW. Never truncates. Works 100% of the time.
    // GENERATE_PAGE <type> <domain> [json config]
    // ═══════════════════════════════════════════════════════════

    case "GENERATE_PAGE": {
      if (!isOp) return { cmd: "GENERATE_PAGE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // UNIVERSAL PAGE GENERATOR — data-driven component renderer.
      // Aura describes pages as JSON configs. Code renders them. Any page, any domain, no code changes.
      // Usage: GENERATE_PAGE <key> <json config>
      //   key: page:domain.com/ or page:domain.com/path
      //   config: { title, sections: [{type, ...props}] }
      // Or shortcut: GENERATE_PAGE <preset> <domain> for built-in presets (home, shops, welcome, dashboard, design)
      const arg0 = (args[0] || "").toLowerCase();
      const arg1 = args[1] || "mytattoo.world";
      const presets = {
        home: (d) => ({ title: d, sections: [
          { type: "header", title: "MyTattoo.world", links: [{text:"About",href:"/about"},{text:"Login",href:"/login"}] },
          { type: "cards", items: [{title:"I Want A Tattoo",desc:"Design your tattoo with AI before your appointment",href:"/design",chatMsg:"I want a tattoo"},{title:"I Am A Tattoo Artist or I Own A Shop",desc:"Your customers arrive knowing exactly what they want",href:"/shops",chatMsg:"I am a tattoo artist"}] },
          { type: "chat", context: "home", message: "Welcome to MyTattoo.world! I am Aura. Are you here to design a tattoo or are you a tattoo artist?" }
        ]}),
        shops: (d) => ({ title: d+" — For Shops", sections: [
          { type: "header", title: "MyTattoo.world", back: "/" },
          { type: "text", heading: "You do the tattooing. We do everything else.", body: "Your customers design their tattoo before they walk in. They arrive knowing exactly what they want. No more hours of consultation. You get notified the moment a design is ready." },
          { type: "text", body: '<a href="/design">Want to try it? Click here to see how your customers will experience it →</a>' },
          { type: "text", heading: "What you get", body: "Your own branded page (yourshop.mytattoo.world)<br>Your customers design before they arrive<br>You get notified when a design is ready<br>QR code for your shop window" },
          { type: "text", body: "$100 per month. Cancel anytime.", style: "color:#fff;font-size:1.1rem" },
          { type: "button", text: "Get Started", href: "https://auras.guide/create-checkout?type=test&redirect=1" },
          { type: "chat", context: "shop", message: "Hey! I can answer any questions about how MyTattoo.world works for your shop." }
        ]}),
        welcome: (d) => ({ title: d+" — Welcome", sections: [
          { type: "header", title: "MyTattoo.world" },
          { type: "text", heading: "Let's get your studio set up" },
          { type: "form", fields: [{name:"shopName",placeholder:"Shop or Studio Name",required:true},{name:"artistName",placeholder:"Your Name",required:true},{name:"phone",placeholder:"Phone"},{name:"email",placeholder:"Email"},{name:"address",placeholder:"Address"},{name:"city",placeholder:"City"},{name:"state",placeholder:"State"},{name:"specialties",placeholder:"Specialties (Japanese, Realism, etc)"}], submitLabel: "Submit", chatContext: "onboarding" },
          { type: "chat", context: "onboarding", message: "I can help you fill this out, or just complete the form and hit submit. Either way works!" }
        ]}),
        dashboard: (d) => ({ title: d+" — Dashboard", sections: [
          { type: "header", title: "MyTattoo.world", subtitle: "Dashboard", back: "/" },
          { type: "link_display", label: "Your Studio Link", paramName: "shop", artistParam: "artist", domain: "mytattoo.world" },
          { type: "qrcode", paramName: "shop", artistParam: "artist", domain: "mytattoo.world" },
          { type: "text", heading: "Profile", body: "Upload your logo and profile photo — coming soon.", muted: true },
          { type: "text", heading: "Pending Designs", body: "No pending designs yet. When customers use your link, their designs will appear here.", muted: true },
          { type: "chat", context: "shop", message: "This is your dashboard. Your link and QR code are ready to share with customers. Need help with anything?" }
        ]}),
        design: (d) => ({ title: d+" — Design Your Tattoo", sections: [
          { type: "header", title: "MyTattoo.world", back: "/" },
          { type: "chips", items: ["Japanese","Realism","Fine Line","Blackwork","Traditional","Watercolor","Geometric","Minimalist"] },
          { type: "chat", context: "tattoo", message: "Hi! I am Aura, your tattoo design assistant. Tell me what you are thinking — a memorial for someone you love, a sleeve you have been dreaming about, or just a vibe. I will help you see it before it is permanent.", placeholder: "Tell Aura about your tattoo..." }
        ]})
      };

      let pageKey, config;
      if (presets[arg0]) {
        config = presets[arg0](arg1);
        const pathMap = { home: "/", shops: "/shops", welcome: "/welcome", dashboard: "/dashboard", design: "/design" };
        pageKey = `page:${arg1}${pathMap[arg0]}`;
      } else {
        pageKey = arg0.startsWith("page:") ? arg0 : `page:${arg0}`;
        const jsonStart = rest.indexOf("{");
        if (jsonStart < 0) return { cmd: "GENERATE_PAGE", payload: { ok: false, error: "Provide JSON config or use a preset: home, shops, welcome, dashboard, design" } };
        try { config = JSON.parse(rest.slice(jsonStart)); } catch (e) { return { cmd: "GENERATE_PAGE", payload: { ok: false, error: "Invalid JSON: " + e.message } }; }
      }

      // COMPONENT RENDERERS
      const hasChat = config.sections.some(s => s.type === "chat");
      let chatCtx = "", chatShop = "", chatArtist = "";

      const renderSection = (s) => {
        if (s.type === "header") {
          let h = '<div style="padding:1rem;text-align:center;border-bottom:1px solid #1f1f35;position:relative">';
          if (s.back) h += `<a href="${s.back}" style="position:absolute;left:1rem;top:1rem;color:#888;text-decoration:none;font-size:1.2rem">←</a>`;
          if (s.links) h += `<div style="display:flex;justify-content:flex-end;gap:1rem;padding:0 0.5rem 0.5rem;font-size:0.8rem">${s.links.map(l=>`<a href="${l.href}" style="color:#a855f7;text-decoration:none">${l.text}</a>`).join("")}</div>`;
          h += `<h1 style="font-size:1.4rem;font-weight:800;background:linear-gradient(135deg,#a855f7,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${s.title}</h1>`;
          if (s.subtitle) h += `<p style="color:#888;font-size:0.85rem">${s.subtitle}</p>`;
          return h + '</div>';
        }
        if (s.type === "cards") {
          return s.items.map(c => `<a href="${c.href}" ${c.chatMsg?`onclick="if(typeof addMsg==='function')addMsg('${c.chatMsg}','user')"`:''}style="display:block;background:#151520;border:1px solid #1f1f35;border-radius:12px;padding:1.2rem;margin:0.5rem 1rem;text-decoration:none;transition:border-color 0.2s" onmouseover="this.style.borderColor='#a855f7'" onmouseout="this.style.borderColor='#1f1f35'"><h2 style="font-size:1rem;font-weight:700;color:#a855f7;margin-bottom:0.3rem">${c.title}</h2><p style="font-size:0.85rem;color:#8888a8">${c.desc}</p></a>`).join("");
        }
        if (s.type === "text") {
          let h = '<div style="padding:0.5rem 1rem">';
          if (s.heading) h += `<h3 style="font-size:0.95rem;font-weight:700;color:#a855f7;margin-bottom:0.4rem">${s.heading}</h3>`;
          if (s.body) h += `<p style="color:${s.muted?'#888':'#8888a8'};line-height:1.6;font-size:0.9rem;${s.style||''}">${s.body}</p>`;
          return h + '</div>';
        }
        if (s.type === "button") {
          return `<div style="padding:0.5rem 1rem"><a href="${s.href}" style="display:block;text-align:center;padding:0.8rem;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.95rem">${s.text}</a></div>`;
        }
        if (s.type === "chips") {
          return `<div style="padding:0.5rem 1rem;display:flex;flex-wrap:wrap;gap:0.4rem">${s.items.map(c=>`<span onclick="document.getElementById('chatInput').value='I am interested in ${c} style';sendMsg()" style="padding:0.4rem 0.8rem;border:1px solid #2a2a45;border-radius:20px;font-size:0.75rem;color:#888;cursor:pointer">${c}</span>`).join("")}</div>`;
        }
        if (s.type === "form") {
          let h = `<div style="padding:0.5rem 1rem"><form id="pageForm" style="display:flex;flex-direction:column;gap:0.7rem" onsubmit="event.preventDefault();submitForm()">`;
          for (const f of s.fields) h += `<input name="${f.name}" placeholder="${f.placeholder}" ${f.required?'required':''} style="background:#1a1a2e;border:1px solid #2a2a45;border-radius:8px;padding:0.7rem;color:#e8e4f0;font-size:0.9rem;outline:none">`;
          h += `<button type="submit" style="padding:0.8rem;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.9rem">${s.submitLabel||'Submit'}</button></form>`;
          h += `<script>function submitForm(){const f=document.getElementById('pageForm');const d=Object.fromEntries(new FormData(f));const parts=[];for(const[k,v]of Object.entries(d)){if(v)parts.push(k+': '+v)}document.getElementById('chatInput').value=parts.join(', ');sendMsg()}</script></div>`;
          return h;
        }
        if (s.type === "link_display") {
          return `<div style="padding:0.5rem 1rem"><h3 style="font-size:0.9rem;font-weight:700;color:#a855f7;margin-bottom:0.4rem">${s.label||'Your Link'}</h3><div style="background:#1a1a2e;border:1px solid #2a2a45;border-radius:8px;padding:0.8rem;display:flex;align-items:center;gap:0.5rem"><span id="studioLink" style="flex:1;font-size:0.85rem;color:#a855f7;word-break:break-all"></span><button onclick="navigator.clipboard.writeText(document.getElementById('studioLink').textContent).then(()=>alert('Copied!'))" style="background:#2a2a45;border:1px solid #3a3a55;border-radius:6px;padding:0.4rem 0.8rem;color:#e8e4f0;font-size:0.8rem;cursor:pointer">Copy</button></div><script>!function(){const p=new URLSearchParams(location.search);document.getElementById('studioLink').textContent=(p.get('${s.paramName}')||'yourshop')+'.${s.domain}/'+(p.get('${s.artistParam}')||'artist')}()</script></div>`;
        }
        if (s.type === "qrcode") {
          return `<div style="padding:0.5rem 1rem;text-align:center"><h3 style="font-size:0.9rem;font-weight:700;color:#a855f7;margin-bottom:0.4rem;text-align:left">Your QR Code</h3><img id="qrImg" style="border-radius:8px;background:#fff;padding:8px" width="200" height="200"><br><button onclick="window.print()" style="margin-top:0.5rem;background:#2a2a45;border:1px solid #3a3a55;border-radius:6px;padding:0.4rem 1rem;color:#e8e4f0;font-size:0.8rem;cursor:pointer">Print</button><script>!function(){const p=new URLSearchParams(location.search);const u='https://'+(p.get('${s.paramName}')||'yourshop')+'.${s.domain}/'+(p.get('${s.artistParam}')||'artist');document.getElementById('qrImg').src='https://api.qrserver.com/v1/create-qr-code/?data='+encodeURIComponent(u)+'&size=200x200'}()</script></div>`;
        }
        if (s.type === "divider") {
          return '<div style="margin:0.5rem 1rem;border-bottom:1px solid #1f1f35"></div>';
        }
        if (s.type === "image") {
          return `<div style="padding:0.5rem 1rem;text-align:center"><img src="${s.src}" style="max-width:100%;border-radius:8px" alt="${s.alt||''}"></div>`;
        }
        if (s.type === "chat") {
          chatCtx = s.context || "general";
          chatShop = s.shop || "";
          chatArtist = s.artist || "";
          return `<div id="auraChat" style="flex:1;display:flex;flex-direction:column;min-height:200px"><div id="chatArea" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.6rem"><div style="background:#1a1a2e;border:1px solid #2a2a45;border-radius:12px;padding:0.8rem 1rem;max-width:85%;font-size:0.9rem;line-height:1.4;color:#c8c4d8"><span style="color:#a855f7;font-weight:700;font-size:0.75rem">AURA</span><br>${s.message||'Hi! I am Aura. How can I help?'}</div></div><div style="padding:0.8rem;border-top:1px solid #1f1f35;display:flex;gap:0.5rem"><input id="chatInput" placeholder="${s.placeholder||'Talk with Aura...'}" style="flex:1;background:#1a1a2e;border:1px solid #2a2a45;border-radius:10px;padding:0.7rem 1rem;color:#e8e4f0;font-size:0.9rem;outline:none" onkeydown="if(event.key==='Enter')sendMsg()"><button onclick="sendMsg()" style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);border:none;color:#fff;font-size:1.1rem;cursor:pointer">→</button></div></div>`;
        }
        return "";
      };

      // RENDER PAGE
      const bodyHtml = config.sections.map(renderSection).join("\n");
      const chatJs = hasChat ? `<script>
let _sid=sessionStorage.getItem('aura_sid_${chatCtx}')||'';
function addMsg(t,who,imgUrl){const d=document.createElement('div');d.style.cssText=who==='user'?'background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border-radius:12px;padding:0.7rem 1rem;max-width:80%;align-self:flex-end;font-size:0.9rem;line-height:1.4':'background:#1a1a2e;border:1px solid #2a2a45;border-radius:12px;padding:0.8rem 1rem;max-width:85%;font-size:0.9rem;line-height:1.4;color:#c8c4d8';if(who==='aura')d.innerHTML='<span style="color:#a855f7;font-weight:700;font-size:0.75rem">AURA</span><br>'+t;else d.textContent=t;if(imgUrl){const im=document.createElement('img');im.src=imgUrl;im.style.cssText='width:100%;border-radius:8px;margin-top:0.5rem';d.appendChild(im);const dl=document.createElement('a');dl.href=imgUrl;dl.download='design.png';dl.textContent='Save Design';dl.style.cssText='color:#a855f7;font-size:0.8rem;display:block;margin-top:0.4rem';d.appendChild(dl)}document.getElementById('chatArea').appendChild(d);document.getElementById('chatArea').scrollTop=99999}
async function sendMsg(){const inp=document.getElementById('chatInput');const m=inp.value.trim();if(!m)return;inp.value='';addMsg(m,'user');const ld=document.createElement('div');ld.id='loading';ld.style.cssText='background:#1a1a2e;border:1px solid #2a2a45;border-radius:12px;padding:0.8rem 1rem;max-width:85%;font-size:0.9rem;color:#6b6b8a;animation:pulse 1.5s infinite';ld.innerHTML='<span style="color:#a855f7;font-weight:700;font-size:0.75rem">AURA</span><br>Creating your vision...';document.getElementById('chatArea').appendChild(ld);document.getElementById('chatArea').scrollTop=99999;try{const r=await fetch('https://auras.guide/aura-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m,context:'${chatCtx}',session_id:_sid${chatShop?`,'shop':'${chatShop}'`:''}${chatArtist?`,'artist':'${chatArtist}'`:''}})});const el=document.getElementById('loading');if(el)el.remove();const d=await r.json();if(d.session_id){_sid=d.session_id;sessionStorage.setItem('aura_sid_${chatCtx}',_sid)}if(d.ok)addMsg(d.reply,'aura',d.image?d.image.url:null);else addMsg('Sorry, having trouble connecting.','aura');if(d.redirect)setTimeout(()=>window.location.href=d.redirect,2000)}catch(e){const el=document.getElementById('loading');if(el)el.remove();addMsg('Connection error. Please try again.','aura')}}
</script>` : "";

      const fullHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"><title>${config.title||'Aura'}</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;height:100dvh}body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;flex-direction:column;max-width:480px;margin:0 auto;overflow-y:auto}a{color:#a855f7}input{font-size:16px}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}</style></head><body>${bodyHtml}${chatJs}</body></html>`;

      await KV.put(env, pageKey, fullHtml);
      const rb = await KV.get(env, pageKey);
      const verified = rb && rb.length === fullHtml.length;

      // Also save the config so Aura can read and modify it later
      await env.AURA_KV.put(`config:page:${pageKey}`, JSON.stringify(config)).catch(() => {});

      return { cmd: "GENERATE_PAGE", payload: { ok: true, key: pageKey, bytes: fullHtml.length, sections: config.sections.length, verified, config_saved: `config:page:${pageKey}` } };
    }

    case "CURRENT_FOCUS": {
      // "Right Now" feed for the CC — what Aaron needs to see at a glance.
      // Reads: today's journal, strategy:day_zero_first_move, strategy:gaps, alerts, missions.
      if (!isOp) return { cmd: "CURRENT_FOCUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const cf = { ts: new Date().toISOString() };
      // Last conversations (today's journal)
      const cfDay = new Date().toISOString().slice(0, 10);
      try {
        const jRaw = JSON.parse(await env.AURA_KV.get(`learning:journal:${cfDay}`) || "[]");
        const recent = Array.isArray(jRaw) ? jRaw.slice(-5).map(e => ({ ts: e.ts, q: (e.q || "").slice(0, 120), by: e.by })) : [];
        cf.last_conversations = { today: cfDay, count: Array.isArray(jRaw) ? jRaw.length : 0, recent };
      } catch { cf.last_conversations = { count: 0, recent: [] }; }
      // Current priorities from strategy
      try {
        const dayZero = await env.AURA_KV.get("notes:strategy:day_zero_first_move");
        cf.current_strategy = dayZero ? String(dayZero).slice(0, 600) : "no day-zero strategy written yet";
      } catch { cf.current_strategy = null; }
      // Active blockers
      try {
        const resAlert = JSON.parse(await env.AURA_KV.get("notes:alert:resources") || "null");
        const a2pAlert = JSON.parse(await env.AURA_KV.get("notes:alert:a2p") || "null");
        cf.blockers = [];
        if (resAlert && Array.isArray(resAlert.concerns)) {
          for (const c of resAlert.concerns) if (c.level === "critical") cf.blockers.push(`${c.provider} $${c.value} CRITICAL`);
        }
        if (a2pAlert) {
          const st = a2pAlert.changed_to || a2pAlert.status || "UNKNOWN";
          if (!/APPROVED|VERIFIED/i.test(st)) cf.blockers.push(`A2P SMS: ${st}`);
        }
        // Stripe answer pending
        cf.blockers.push("Stripe dispensary-fee answer: PENDING");
        // Email sender
        cf.blockers.push("Email sender: NOT BUILT");
      } catch { cf.blockers = []; }
      // Next actions (compact)
      cf.next_actions = [
        "Send Stripe support email (dispensary listing fee question)",
        "Fund Mercury (currently $7 critical)",
        "Build email sender (unblocks claim verification for any vertical)",
        "Prep dispensary cold-call pitch with Aura",
        "First cold call to Vegas dispensary",
        "Onboard Lia's florist as free test bench"
      ];
      return { cmd: "CURRENT_FOCUS", payload: { ok: true, ...cf } };
    }

    case "INVENTORY_STATUS": {
      // Open Loops feed — the audited systems inventory (written by Aura's self-audit).
      // Merges notes:inventory:systems-a + systems-b, returns counts by status + full list.
      if (!isOp) return { cmd: "INVENTORY_STATUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      let invAll = [];
      for (const half of ["notes:inventory:systems-a", "notes:inventory:systems-b"]) {
        try { const v = JSON.parse(await env.AURA_KV.get(half) || "[]"); if (Array.isArray(v)) invAll = invAll.concat(v); } catch {}
      }
      const invCounts = {};
      let invOpenQs = 0;
      for (const s of invAll) {
        const st = s.status || "Unknown";
        invCounts[st] = (invCounts[st] || 0) + 1;
        if (Array.isArray(s.open_questions)) invOpenQs += s.open_questions.length;
      }
      return { cmd: "INVENTORY_STATUS", payload: { ok: true, count: invAll.length, counts_by_status: invCounts, total_open_questions: invOpenQs, systems: invAll } };
    }

    case "SYSTEM_HEALTH": {
      // Command Center section 11 — Aura monitors herself. Every check is a REAL probe.
      if (!isOp) return { cmd: "SYSTEM_HEALTH", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const sh = { ts: new Date().toISOString(), checks: {} };
      // KV round-trip
      try {
        const t0 = Date.now();
        const probe = "health:selftest";
        await env.AURA_KV.put(probe, sh.ts);
        const back = await env.AURA_KV.get(probe);
        sh.checks.kv = { ok: back === sh.ts, latency_ms: Date.now() - t0 };
      } catch (e) { sh.checks.kv = { ok: false, error: e.message }; }
      // D1
      try {
        const t0 = Date.now();
        const row = await env.AURA_MEMORY.prepare("SELECT 1 AS one").first();
        sh.checks.d1 = { ok: row && row.one === 1, latency_ms: Date.now() - t0 };
      } catch (e) { sh.checks.d1 = { ok: false, error: e.message }; }
      // Sister workers via bindings — reachable means any HTTP response came back
      const pingBinding = async (binding, reqUrl) => {
        if (!binding) return { ok: false, bound: false };
        try { const t0 = Date.now(); const r = await binding.fetch(new Request(reqUrl)); return { ok: r.status < 500, bound: true, http_status: r.status, latency_ms: Date.now() - t0 }; }
        catch (e) { return { ok: false, bound: true, error: e.message }; }
      };
      sh.checks.aura_host = await pingBinding(env.AURA_HOST, "https://auras.guide/");
      sh.checks.aura_ops = await pingBinding(env.AURA_OPS, "https://aura-ops.aaronkaracas.workers.dev/");
      sh.checks.aura_comms = await pingBinding(env.AURA_COMMS, "https://aura-comms.aaronkaracas.workers.dev/");
      // Brain — last agent loop outcome PLUS who actually answered the last turn (catches silent fallbacks)
      try {
        const mon = JSON.parse(await env.AURA_KV.get("monitor:last_agent_loop") || "null");
        const turn = JSON.parse(await env.AURA_KV.get("monitor:last_turn") || "null");
        const answeredBy = turn ? (turn.answered_by || "none") : null;
        sh.checks.brain = mon ? { ok: !mon.error && answeredBy === "anthropic", last_ts: mon.ts, mode: mon.mode, stop_reason: mon.stop_reason, error: mon.error, last_turn_answered_by: answeredBy, last_turn_error: turn ? turn.fable_error : null } : { ok: false, note: "no agent loop recorded yet" };
      } catch (e) { sh.checks.brain = { ok: false, error: e.message }; }
      // Crons — freshness of watcher outputs (age in minutes; stale flags honest, no guessing)
      const ageOf = async (key) => {
        try { const v = JSON.parse(await env.AURA_KV.get(key) || "null"); if (!v || !v.ts) return { present: false }; const mins = Math.round((Date.now() - Date.parse(v.ts)) / 60000); return { present: true, age_minutes: mins }; }
        catch { return { present: false }; }
      };
      sh.checks.cron_watch_resources = await ageOf("notes:alert:resources");
      sh.checks.cron_watch_a2p = await ageOf("notes:alert:a2p");
      // Bindings present
      sh.checks.bindings = { entity_do: !!env.ENTITY_DO, vectorize: !!env.VECTORIZE, workers_ai: !!env.AI, kv: !!env.AURA_KV, d1: !!env.AURA_MEMORY };
      // Verdict — core = kv, d1, host, brain
      const core = [sh.checks.kv.ok, sh.checks.d1.ok, sh.checks.aura_host.ok, sh.checks.brain.ok];
      sh.verdict = core.every(Boolean) ? "HEALTHY" : "DEGRADED";
      sh.failing = Object.entries(sh.checks).filter(([k, v]) => v && v.ok === false).map(([k]) => k);
      return { cmd: "SYSTEM_HEALTH", payload: { ok: true, ...sh } };
    }

    case "WORLD_MAP": {
      if (!isOp) return { cmd: "WORLD_MAP", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const launchedRaw = await env.AURA_KV.get("config:domains:launched").catch(() => null);
      const allRaw = await env.AURA_KV.get("config:domains:all").catch(() => null);
      // Bulletproof parsing — launched may be JSON array OR comma string; never throw.
      let launchedList = [];
      if (launchedRaw) {
        try { const p = JSON.parse(launchedRaw); launchedList = Array.isArray(p) ? p : (typeof p === "string" ? p.split(",") : []); }
        catch { launchedList = launchedRaw.split(","); }
      }
      launchedList = launchedList.map(d => String(d).trim()).filter(Boolean);
      let allList = [];
      if (allRaw) {
        try { const p = JSON.parse(allRaw); allList = Array.isArray(p) ? p : (typeof p === "string" ? allRaw.split(",") : allRaw.split(",")); }
        catch { allList = allRaw.split(","); }
      }
      allList = allList.map(d => String(d).trim()).filter(Boolean);
      const launchedSet = new Set(launchedList);

      // Optional: caller can pass a domain to get its LIVE serving status; default returns the full map.
      const focusDomain = (args[0] || "").trim().toLowerCase();

      // Build the map from data already in hand — NO per-domain KV reads (180 domains x reads = 1101 crash).
      const worlds = allList.map(domain => ({
        name: domain,
        launched: launchedSet.has(domain),
        status: launchedSet.has(domain) ? "live" : "registered",
        // Metrics that don't exist yet — honestly null, not faked
        revenue: null, users: null, pta_count: null, traffic: null
      }));

      const summary = {
        total: allList.length,
        live: launchedList.length,
        registered_not_live: allList.length - launchedList.length,
        metrics_note: "revenue/users/pta_count/traffic are null because those data sources aren't built yet (AuraPay=revenue, PTA=pta_count, analytics=traffic/users). Honest placeholders, not zeros. Per-domain page/serving status available via WORLD_MAP <domain>."
      };

      // If focused on one domain, also fetch its LIVE serving status for ground truth
      if (focusDomain) {
        const one = worlds.find(w => w.name === focusDomain);
        if (one) {
          const hasPage = await env.AURA_KV.get(`page:${focusDomain}/`).catch(() => null);
          one.has_page = !!hasPage;
          try { const r = await fetch(`https://${focusDomain}/`, { method: "GET" }); one.live_status = r.status; one.serving = r.ok; } catch (e) { one.live_status = "unreachable"; }
          return { cmd: "WORLD_MAP", payload: { ok: true, world: one } };
        }
      }

      await env.AURA_KV.put("worldmap:last", JSON.stringify({ ts: new Date().toISOString(), summary }), { expirationTtl: 3600 }).catch(() => {});
      return { cmd: "WORLD_MAP", payload: { ok: true, summary, worlds } };
    }
    case "ECONOMICS": {
      // ECONOMICS ENGINE (foundation) — cost-to-serve visibility. Reads the AI cost ledger that
      // every brain call now writes. This is the raw material the financial-intelligence engine
      // reasons over: what serving costs, by model, per call. Revenue (Stripe) joins this next.
      // Usage: ECONOMICS                (today's cost to serve)
      //        ECONOMICS <YYYY-MM-DD>   (a specific day)
      //        ECONOMICS DAYS <n>       (sum of the last n days)
      const ecRaw = (rest || "").trim();
      const ecToday = new Date().toISOString().slice(0, 10);
      const readDay = async (d) => { try { const ex = await env.AURA_KV.get("economics:cost:" + d); return ex ? JSON.parse(ex) : null; } catch { return null; } };
      if (/^ANALYZE\b/i.test(ecRaw)) {
        // ECONOMICS ANALYZE — the financial-intelligence engine. Joins cost-to-serve (our ledger)
        // with revenue (Stripe) and cash (Mercury), runs the ecosystem-sustainability lens.
        // OPERATOR ONLY (reads real account data). Objective: a healthy self-sustaining ecosystem.
        if (!isOp) return { cmd: "ECONOMICS", payload: { ok: false, error: "OPERATOR_REQUIRED (reads real account data)" } };
        let cost7 = { calls: 0, input_tokens: 0, output_tokens: 0, usd: 0, by_model: {} }, costDays = [];
        for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); const a = await readDay(d); if (a) { cost7.calls += a.calls; cost7.input_tokens += a.input_tokens; cost7.output_tokens += a.output_tokens; cost7.usd += a.usd; for (const k in (a.by_model || {})) cost7.by_model[k] = Number(((cost7.by_model[k] || 0) + a.by_model[k]).toFixed(6)); costDays.push({ date: d, usd: Number(a.usd.toFixed(4)), calls: a.calls }); } }
        cost7.usd = Number(cost7.usd.toFixed(4));
        let stripe = null, mercury = null;
        try { const sb = await stripeRequest("/balance", "GET", null, env); if (sb.ok) stripe = { available: (sb.data.available || []).map(b => ({ currency: b.currency, amount: b.amount / 100 })), pending: (sb.data.pending || []).map(b => ({ currency: b.currency, amount: b.amount / 100 })) }; } catch {}
        try { const mb = await getMercuryBalance(env); if (mb.ok) mercury = { total_available: mb.total_available, accounts: (mb.accounts || []).map(a => ({ name: a.name, available: a.available })) }; } catch {}
        let twilio = null;
        try { const tr = await processCommand("TWILIO_BALANCE", env, isOp); const tp = (tr && tr.payload) ? tr.payload : tr; if (tp && (tp.balance !== undefined || tp.ok)) twilio = { balance: tp.balance !== undefined ? tp.balance : null, currency: tp.currency || "USD" }; } catch {}
        let opFrame = ""; try { const of = await env.AURA_KV.get("notes:economics:operating_frame"); if (of) opFrame = String(of).slice(0, 2000); } catch {}
        const ecFacts = { cost_to_serve_last_7_days_usd: cost7.usd, ai_calls_7d: cost7.calls, cost_by_model_7d: cost7.by_model, cost_by_day: costDays, stripe_revenue: stripe, cash_mercury: mercury, twilio_funding: twilio, ts: new Date().toISOString() };
        const ecApiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
        if (!ecApiKey) return { cmd: "ECONOMICS", payload: { ok: true, mode: "raw", facts: ecFacts, note: "Brain not configured — returning raw facts only." } };
        const ecModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
        const ecSys = "You are the ECONOMICS ENGINE of Aura — her financial intelligence about HER OWN operation, acting as the OPERATOR who keeps the machine running. You are given real facts: AI cost-to-serve (tokens), Stripe revenue, Mercury cash, and Twilio funding. You are ALSO given an OPERATING FRAME describing how the machine runs. CRITICAL — YOU DO NOT BLINDLY ACCEPT THE FRAME. Before you decide anything, you EXPAND: you challenge the assumptions you were handed and ask what is actually NECESSARY versus merely assumed. Ask explicitly: what is the MINIMUM machine that works? Which stated dependencies are truly load-bearing and which are optional or phase-two? For example, if the frame describes an 'email-then-call' engine, question whether calling (and its funding) is required to START, or whether the zero-cost path (email alone) already starts the machine today and calling is a later phase. Find the highest-leverage path, not the one the frame assumes. A real operator questions the plan; a weak one optimizes inside a plan they never examined. KEY OPERATING TRUTHS: there is a working FLOAT in Mercury that is fuel not profit; keep tokens paid; STRIPE DOES NOT AUTO-FUND MERCURY (money in Stripe sits until swept — reason about Mercury + unswept Stripe as total fuel, flag when a sweep is needed); every dollar recycles. INFORMATION IS NOT UNDERSTANDING: translate numbers into plain meaning. Objective is a healthy self-sustaining machine, not max profit. Return ONLY a JSON object, no prose, no fences, with exactly these keys: cost_to_serve_7d (number USD), revenue_observed (number USD), mercury_float (number USD), stripe_unswept (number USD), twilio_funding (number USD or null), total_fuel (number USD = mercury + unswept stripe), assumptions_challenged (array — each stated/implied assumption you examined and your verdict on whether it is truly necessary), minimum_machine (one sentence — the smallest setup that starts generating value today, given the real costs), margin_state (healthy|thin|negative|pre_revenue), runway_note (one sentence, what the fuel implies at current burn), machine_running (boolean — can she operate the minimum machine right now), needs_stripe_sweep (boolean), self_sustaining (boolean), plain_english (2-3 sentences a non-financial person understands), the_smartest_move (one sentence — the single highest-leverage operating action right now, based on the MINIMUM machine not the assumed one), why (one sentence), watch_for (array), confidence (high|medium|low). Output JSON only.";
        try {
          const d = await callAnthropic(ecApiKey, { model: ecModel, max_tokens: 1000, system: ecSys, messages: [{ role: "user", content: "REAL FACTS:\n" + JSON.stringify(ecFacts) + (opFrame ? ("\n\nOPERATING FRAME:\n" + opFrame) : "") }] });
          let tx = ""; if (d && d.content) { for (const b of d.content) { if (b.type === "text") tx += b.text; } }
          tx = tx.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          const parsed = JSON.parse(tx);
          const ts = new Date().toISOString();
          await env.AURA_KV.put("economics:analysis:" + ts.slice(0, 10), JSON.stringify({ analysis: parsed, facts: ecFacts, ts })).catch(() => {});
          return { cmd: "ECONOMICS", payload: { ok: true, mode: "analysis", facts: ecFacts, analysis: parsed, ts } };
        } catch (e) { return { cmd: "ECONOMICS", payload: { ok: false, error: "Economics analysis failed: " + String(e.message), facts: ecFacts } }; }
      }
      if (/^DAYS\s+\d+/i.test(ecRaw)) {
        const n = Math.min(parseInt(ecRaw.replace(/^DAYS\s+/i, ""), 10) || 1, 60);
        let sum = { calls: 0, input_tokens: 0, output_tokens: 0, usd: 0, by_model: {} }, days = [];
        for (let i = 0; i < n; i++) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          const a = await readDay(d); if (a) { sum.calls += a.calls; sum.input_tokens += a.input_tokens; sum.output_tokens += a.output_tokens; sum.usd += a.usd; for (const k in (a.by_model || {})) sum.by_model[k] = Number(((sum.by_model[k] || 0) + a.by_model[k]).toFixed(6)); days.push(d); }
        }
        return { cmd: "ECONOMICS", payload: { ok: true, range_days: n, days_with_data: days.length, calls: sum.calls, input_tokens: sum.input_tokens, output_tokens: sum.output_tokens, usd: Number(sum.usd.toFixed(4)), by_model: sum.by_model, cost_per_call: sum.calls ? Number((sum.usd / sum.calls).toFixed(5)) : 0 } };
      }
      const day = /^\d{4}-\d{2}-\d{2}$/.test(ecRaw) ? ecRaw : ecToday;
      const agg = await readDay(day);
      if (!agg) return { cmd: "ECONOMICS", payload: { ok: true, date: day, calls: 0, usd: 0, note: "No AI cost recorded for this day yet. Every brain call from now on is metered here." } };
      return { cmd: "ECONOMICS", payload: { ok: true, date: agg.date, calls: agg.calls, input_tokens: agg.input_tokens, output_tokens: agg.output_tokens, usd: Number(agg.usd.toFixed(4)), by_model: agg.by_model, cost_per_call: agg.calls ? Number((agg.usd / agg.calls).toFixed(5)) : 0 } };
    }

    case "RESOURCE_STATUS": {
      if (!isOp) return { cmd: "RESOURCE_STATUS", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const out = { ts: new Date().toISOString(), providers: {} };

      // MERCURY — real bank balances
      try { const m = await getMercuryBalance(env);
        out.providers.mercury = m.ok ? { ok: true, total: m.total_available, accounts: m.accounts || null } : { ok: false, error: m.error || "unreachable" };
      } catch (e) { out.providers.mercury = { ok: false, error: String(e.message) }; }

      // STRIPE — real balance
      try { const s = await getStripeBalance(env);
        out.providers.stripe = s.ok ? { ok: true, available: s.available, pending: s.pending } : { ok: false, error: s.error || "unreachable" };
      } catch (e) { out.providers.stripe = { ok: false, error: String(e.message) }; }

      // TWILIO — real account balance (via aura-comms which holds the creds)
      try {
        const tr = await env.AURA_COMMS.fetch(new Request("https://aura-comms/chat", {
          method: "POST", headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
          body: "TWILIO_BALANCE"
        }));
        const td = await tr.json();
        // aura-comms may return {ok,balance,currency} directly or under .reply — handle both
        const tb = (td && (td.balance !== undefined ? td : td.reply)) || {};
        out.providers.twilio = (tb.balance !== undefined)
          ? { ok: true, balance: parseFloat(tb.balance), currency: tb.currency || "USD" }
          : { ok: false, error: tb.error || "unreadable", raw: td };
      } catch (e) { out.providers.twilio = { ok: false, error: String(e.message) }; }

      // OPENAI — try the costs/usage endpoint; honestly report if unavailable (OpenAI deprecated most billing reads)
      try {
        let k = env.OPENAI_API_KEY || await KV.get(env, "secret:openai");
        if (k && k.startsWith("{")) { try { k = JSON.parse(k).api_key; } catch {} }
        if (!k) { out.providers.openai = { ok: false, error: "no key" }; }
        else {
          // A cheap auth check: list models. Confirms key validity even if spend isn't exposed.
          const r = await fetch("https://api.openai.com/v1/models", { headers: { "Authorization": "Bearer " + k } });
          if (r.ok) out.providers.openai = { ok: true, key_valid: true, note: "Spend/limit not exposed via API; check dashboard. Key is valid." };
          else { const e = await r.json().catch(()=>({})); out.providers.openai = { ok: false, key_valid: false, http: r.status, error: e?.error?.message || "auth failed" }; }
        }
      } catch (e) { out.providers.openai = { ok: false, error: String(e.message) }; }

      // ANTHROPIC — no public balance endpoint; validate the key with a tiny call and report last known state
      try {
        const ak = await KV.get(env, "secret:anthropic");
        if (!ak) { out.providers.anthropic = { ok: false, error: "no key" }; }
        else {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: { "x-api-key": ak, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1, messages: [{ role: "user", content: "hi" }] })
          });
          if (r.ok) out.providers.anthropic = { ok: true, key_valid: true, note: "Key valid, credits available. No balance endpoint; low-credit shows as failed calls." };
          else { const e = await r.json().catch(()=>({})); const msg = e?.error?.message || ""; 
            out.providers.anthropic = { ok: false, key_valid: !/credit balance/i.test(msg), low_credit: /credit balance/i.test(msg), http: r.status, error: msg || "call failed" }; }
        }
      } catch (e) { out.providers.anthropic = { ok: false, error: String(e.message) }; }

      // Store snapshot for the console + alerting
      await env.AURA_KV.put("resource:last_status", JSON.stringify(out)).catch(() => {});
      return { cmd: "RESOURCE_STATUS", payload: { ok: true, ...out } };
    }
    case "GENERATE_IMAGE": {
      if (!isOp) return { cmd: "GENERATE_IMAGE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Generate an image via OpenAI (gpt-image-1), the engine ShowIt is built around. Returns a viewable URL/data.
      const prompt = args.join(" ").trim();
      const opts = {};
      if (!prompt) return { cmd: "GENERATE_IMAGE", payload: { ok: false, error: "Usage: GENERATE_IMAGE <prompt>" } };
      let openaiKey = env.OPENAI_API_KEY || await KV.get(env, "secret:openai");
      if (openaiKey && openaiKey.startsWith("{")) { try { openaiKey = JSON.parse(openaiKey).api_key; } catch {} }
      if (!openaiKey) return { cmd: "GENERATE_IMAGE", payload: { ok: false, error: "No OpenAI key" } };
      try {
        const r = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Authorization": "Bearer " + openaiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "gpt-image-1", prompt: prompt.slice(0, 4000), n: 1, size: "1024x1024" })
        });
        const d = await r.json();
        if (!r.ok) return { cmd: "GENERATE_IMAGE", payload: { ok: false, http: r.status, error: d?.error?.message || JSON.stringify(d).slice(0,300) } };
        const item = d?.data?.[0] || {};
        const id = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
        let imageRef = null, stored = null, backend = null;
        let b64 = item.b64_json || null;
        // If the engine returned a URL instead of b64, fetch the bytes so we can persist them.
        if (!b64 && item.url) {
          try { const ir = await fetch(item.url); const ab = await ir.arrayBuffer();
            b64 = btoa(String.fromCharCode(...new Uint8Array(ab))); } catch {}
        }
        if (b64) {
          const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
          // PRIMARY: permanent R2 storage — images never expire (the glasses-vision requirement)
          if (env.AURA_IMAGES) {
            try { await env.AURA_IMAGES.put(`${id}.png`, bytes, { httpMetadata: { contentType: "image/png" } }); backend = "r2"; }
            catch (e) { backend = "r2_failed:" + e.message; }
          }
          // SAFETY NET: also keep in KV (no expiry now) until R2 confirmed reliable
          await env.AURA_KV.put(`image:${id}`, b64).catch(() => {});
          stored = id;
          imageRef = `https://auras.guide/image/${id}`;
        }
        // CONTEXT EVENT — makes the image findable forever ("what was that car 3 years ago")
        const meta = {
          id, prompt: prompt.slice(0, 1000), created: new Date().toISOString(),
          entity: opts.entity || null, source: opts.source || "generate_image",
          url: imageRef, backend
        };
        await env.AURA_KV.put(`imagemeta:${id}`, JSON.stringify(meta)).catch(() => {});
        try {
          await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind("image_gen", Date.now(), "image_created", JSON.stringify(meta), meta.entity || "system", "image", prompt.slice(0, 120)).run();
        } catch {}
        await env.AURA_KV.put("monitor:last_image", JSON.stringify(meta)).catch(() => {});
        return { cmd: "GENERATE_IMAGE", payload: { ok: true, prompt: prompt.slice(0,200), image_url: imageRef, stored_id: stored, backend, context_event: true } };
      } catch (e) {
        return { cmd: "GENERATE_IMAGE", payload: { ok: false, error: String(e.message) } };
      }
    }
    case "LOADGEN": {
      if (!isOp) return { cmd: "LOADGEN", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Distributed load generator: fire N real outbound HTTPS requests to the public /chat endpoint.
      // Unlike the in-worker storms, each request is an independent edge round-trip — no funnel.
      const total = Math.min(parseInt(args[0] || "500", 10) || 500, 3000);
      const wave = Math.min(parseInt(args[1] || "100", 10) || 100, 250);
      const scenario = (args[2] || "fanout").toLowerCase(); // fanout = many entities, hot = one broadcaster
      const opToken = await KV.get(env, "secret:operator_token").catch(() => null) || env.AURA_OPERATOR_TOKEN || "";
      if (!opToken) return { cmd: "LOADGEN", payload: { ok: false, error: "No operator token available in secret:operator_token for self-calls." } };
      const endpoint = "https://auras.guide/chat";
      const lat = [];
      let ok = 0, fail = 0, sent = 0;
      const t0 = Date.now();
      for (let off = 0; off < total; off += wave) {
        const n = Math.min(wave, total - off);
        const batch = [];
        for (let i = 0; i < n; i++) {
          const idx = off + i;
          const ent = scenario === "hot" ? "loadgen_broadcaster" : `loadgen_aud_${idx}`;
          const s = Date.now();
          batch.push(
            fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain", "authorization": "Bearer " + opToken }, body: `LOADTEST_APPEND ${ent}` })
              .then(async r => { lat.push(Date.now() - s); const t = await r.text(); if (r.ok && t.includes('"ok":true')) ok++; else fail++; })
              .catch(() => { lat.push(Date.now() - s); fail++; })
          );
          sent++;
        }
        await Promise.all(batch);
      }
      const total_ms = Date.now() - t0;
      lat.sort((a, b) => a - b);
      const payload = {
        ok: true, scenario, sent, requests_ok: ok, requests_failed: fail,
        total_ms, real_throughput_per_sec: Math.round(sent / (total_ms / 1000)),
        latency_ms: { p50: lat[Math.floor(lat.length*0.5)], p95: lat[Math.floor(lat.length*0.95)], p99: lat[Math.floor(lat.length*0.99)], max: lat[lat.length-1] },
        note: "Each request is a real outbound edge round-trip to the public endpoint — no in-worker funnel."
      };
      await env.AURA_KV.put("monitor:loadgen:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "LOADGEN", payload };
    }
    case "LOADTEST_APPEND": {
      if (!isOp) return { cmd: "LOADTEST_APPEND", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Minimal real write for external load testing: one event to the named entity's DO. No LLM, no extras.
      const ent = args[0] || "loadtest_default";
      try {
        const r = await entityStub(env, ent).fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "loadtest", summary: "lt" }) }));
        return { cmd: "LOADTEST_APPEND", payload: { ok: r.ok, entity: ent } };
      } catch (e) {
        return { cmd: "LOADTEST_APPEND", payload: { ok: false, error: e.message } };
      }
    }
    case "HOT_SHARDED": {
      if (!isOp) return { cmd: "HOT_SHARDED", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Same broadcaster flood as HOT_ENTITY, but writes spread across SHARD_COUNT sub-objects.
      const writes = Math.min(parseInt(args[0] || "1000", 10) || 1000, 4000);
      const ent = "hotshard_" + Date.now().toString(36);
      const t0 = Date.now();
      const lat = [];
      const ops = [];
      for (let i = 0; i < writes; i++) {
        ops.push((async () => { const s = Date.now(); try { const r = await writeShardedEvent(env, ent, { ts: Date.now(), type: "reaction", summary: `r${i}` }); lat.push(Date.now() - s); return r.ok; } catch { lat.push(Date.now() - s); return false; } })());
      }
      const results = await Promise.all(ops);
      const total_ms = Date.now() - t0;
      const ok = results.filter(Boolean).length;
      const merged = await countShardedEvents(env, ent);
      lat.sort((a, b) => a - b);
      const payload = {
        ok: true, entity: ent, shards: SHARD_COUNT, attempted: writes, writes_ok: ok,
        total_ms, throughput_per_sec: Math.round(writes / (total_ms / 1000)),
        merged_count: merged, integrity: merged === writes ? "PERFECT — all writes present across shards" : `LOST ${writes - merged}`,
        write_latency_ms: { p50: lat[Math.floor(lat.length*0.5)], p99: lat[Math.floor(lat.length*0.99)], max: lat[lat.length-1] }
      };
      await env.AURA_KV.put("monitor:hotsharded:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "HOT_SHARDED", payload };
    }
    case "HOT_ENTITY": {
      if (!isOp) return { cmd: "HOT_ENTITY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // The broadcaster's nightmare: ONE entity hammered with N concurrent writes. DOs are single-threaded —
      // this is where a hot entity (Taylor's own DO taking 100k reactions) would bottleneck or drop data.
      const writes = Math.min(parseInt(args[0] || "200", 10) || 200, 2000);
      const ent = "hot_" + Date.now().toString(36);
      const t0 = Date.now();
      const ops = [];
      const lat = [];
      for (let i = 0; i < writes; i++) {
        ops.push((async () => { const s = Date.now(); try { const r = await entityStub(env, ent).fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "reaction", summary: `r${i}` }) })); lat.push(Date.now() - s); return r.ok; } catch { lat.push(Date.now() - s); return false; } })());
      }
      const results = await Promise.all(ops);
      const total_ms = Date.now() - t0;
      const ok = results.filter(Boolean).length;
      const got = await (await entityStub(env, ent).fetch(new Request("https://do/count"))).json();
      lat.sort((a, b) => a - b);
      const payload = {
        ok: true, entity: ent, attempted: writes, writes_ok: ok, writes_failed: writes - ok,
        total_ms, throughput_per_sec: Math.round(writes / (total_ms / 1000)),
        final_do_count: got.count,
        integrity: got.count === writes ? "PERFECT — single entity absorbed all writes in order" : `LOST ${writes - got.count}`,
        write_latency_ms: { p50: lat[Math.floor(lat.length*0.5)], p99: lat[Math.floor(lat.length*0.99)], max: lat[lat.length-1] }
      };
      await env.AURA_KV.put("monitor:hotentity:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "HOT_ENTITY", payload };
    }
    case "FANOUT_STORM": {
      if (!isOp) return { cmd: "FANOUT_STORM", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Concert model: 1 broadcaster fans out to N audience entities; then A audience members cross-write
      // to R random peers (the "meeting each other / exchanging" layer). Measures interaction at scale.
      const audience = Math.min(parseInt(args[0] || "100", 10) || 100, 500);
      const peerWrites = Math.min(parseInt(args[1] || "3", 10) || 3, 10);
      const tag = "concert_" + Date.now().toString(36);
      const t0 = Date.now();
      // Phase 1: broadcaster fans out to every audience entity simultaneously
      const fan = [];
      for (let i = 0; i < audience; i++) {
        const ent = `${tag}_fan${i}`;
        fan.push(entityStub(env, ent).fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "broadcast", summary: "concert:live", body: tag }) })).then(r => r.ok).catch(() => false));
      }
      const fanResults = await Promise.all(fan);
      const fan_ms = Date.now() - t0;
      const fan_ok = fanResults.filter(Boolean).length;
      // Phase 2: each fan cross-writes to R random peers (audience interacting with each other)
      const t1 = Date.now();
      const cross = [];
      let crossExpected = 0;
      const peerCounts = {};
      for (let i = 0; i < audience; i++) {
        for (let j = 0; j < peerWrites; j++) {
          const peer = Math.floor(Math.random() * audience);
          const peerEnt = `${tag}_fan${peer}`;
          peerCounts[peerEnt] = (peerCounts[peerEnt] || 0) + 1;
          crossExpected++;
          cross.push(entityStub(env, peerEnt).fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "peer_msg", summary: `from fan${i}` }) })).then(r => r.ok).catch(() => false));
        }
      }
      const crossResults = await Promise.all(cross);
      const cross_ms = Date.now() - t1;
      const cross_ok = crossResults.filter(Boolean).length;
      // Verify: each audience entity should have 1 broadcast + its received peer messages
      let verifiedOk = 0; const checks = Object.keys(peerCounts).slice(0, 20);
      for (const ent of checks) {
        try { const c = await (await entityStub(env, ent).fetch(new Request("https://do/count"))).json(); if (c.count === 1 + peerCounts[ent]) verifiedOk++; } catch {}
      }
      const payload = {
        ok: true, run: tag, audience, peer_writes_each: peerWrites,
        broadcast_ok: fan_ok, broadcast_ms: fan_ms,
        cross_writes: crossExpected, cross_ok, cross_ms,
        total_interactions: fan_ok + cross_ok, total_ms: Date.now() - t0,
        interactions_per_sec: Math.round((fan_ok + cross_ok) / ((Date.now() - t0) / 1000)),
        sample_verified: `${verifiedOk}/${checks.length}`,
        verdict: (fan_ok === audience && cross_ok === crossExpected && verifiedOk === checks.length) ? "INTERACTION_HELD" : "DEGRADATION_DETECTED"
      };
      await env.AURA_KV.put("monitor:fanout:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "FANOUT_STORM", payload };
    }
    case "SURGE_PROBE": {
      if (!isOp) return { cmd: "SURGE_PROBE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Same total entities, different concurrency widths. If wide bursts cost MORE per entity,
      // the bottleneck is the single-worker funnel (production won't have it). If flat, it's real DO cold-start.
      const tag = "probe_" + Date.now().toString(36);
      const waves = [1, 5, 25, 100];
      const report = [];
      let idx = 0;
      for (const width of waves) {
        const lat = [];
        const ops = [];
        for (let i = 0; i < width; i++) {
          const ent = `${tag}_${idx++}`;
          ops.push((async () => { const s = Date.now(); try { await entityStub(env, ent).fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "probe" }) })); } catch {} lat.push(Date.now() - s); })());
        }
        const t0 = Date.now();
        await Promise.all(ops);
        const wall = Date.now() - t0;
        lat.sort((a, b) => a - b);
        report.push({ concurrency: width, wall_ms: wall, per_entity_median_ms: lat[Math.floor(lat.length/2)], per_entity_max_ms: lat[lat.length-1] });
      }
      // Interpretation: compare per-entity median at width 1 vs width 100
      const w1 = report[0].per_entity_median_ms;
      const w100 = report[report.length-1].per_entity_median_ms;
      const ratio = w1 ? (w100 / w1).toFixed(1) : "n/a";
      return { cmd: "SURGE_PROBE", payload: { ok: true, report, single_entity_cold_ms: w1, wide_burst_per_entity_ms: w100, slowdown_ratio: ratio + "x", diagnosis: (w100 > w1 * 3) ? "FUNNEL_BOUND (single-worker bottleneck; production distributes and avoids this)" : "DO_COLDSTART_BOUND (genuine per-entity spin-up cost; needs warming)" } };
    }
    case "COLD_SURGE": {
      if (!isOp) return { cmd: "COLD_SURGE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Planetary launch sim: N brand-new entities, each created cold and simultaneously (first-touch DO spin-up).
      const n = Math.min(parseInt(args[0] || "200", 10) || 200, 1000);
      const batchTag = "surge_" + Date.now().toString(36);
      const t0 = Date.now();
      const lat = [];
      let ok = 0, failed = 0;
      const ops = [];
      for (let i = 0; i < n; i++) {
        const ent = `${batchTag}_${i}`; // unique → guaranteed cold, never seen before
        ops.push((async () => {
          const s = Date.now();
          try {
            const stub = entityStub(env, ent);
            const r = await stub.fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "onboard", summary: "first contact" }) }));
            lat.push(Date.now() - s);
            if (r.ok) ok++; else failed++;
          } catch { failed++; lat.push(Date.now() - s); }
        })());
      }
      await Promise.all(ops);
      const total_ms = Date.now() - t0;
      lat.sort((a, b) => a - b);
      const p = (q) => lat[Math.min(lat.length - 1, Math.floor(lat.length * q))];
      // Spot-verify a sample actually persisted their first event
      let verified = 0;
      const sample = [0, Math.floor(n/2), n-1].filter((v,i,a)=>a.indexOf(v)===i);
      for (const i of sample) {
        try { const c = await (await entityStub(env, `${batchTag}_${i}`).fetch(new Request("https://do/count"))).json(); if (c.count === 1) verified++; } catch {}
      }
      const payload = {
        ok: true, run: batchTag, new_entities: n, created_ok: ok, failed,
        total_ms, throughput_per_sec: Math.round(n / (total_ms / 1000)),
        coldstart_latency_ms: { p50: p(0.5), p90: p(0.9), p99: p(0.99), max: lat[lat.length-1] },
        spot_verified: `${verified}/${sample.length}`,
        verdict: failed === 0 && verified === sample.length ? "PLANETARY_SURGE_HELD" : "DEGRADATION_DETECTED"
      };
      await env.AURA_KV.put("monitor:coldsurge:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "COLD_SURGE", payload };
    }
    case "DO_VERIFY": {
      if (!isOp) return { cmd: "DO_VERIFY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const ent = args[0];
      if (!ent) return { cmd: "DO_VERIFY", payload: { ok: false, error: "Usage: DO_VERIFY <entityId>" } };
      try {
        const stub = entityStub(env, ent);
        const c = await (await stub.fetch(new Request("https://do/count"))).json();
        const r = await (await stub.fetch(new Request("https://do/recent?limit=5"))).json();
        return { cmd: "DO_VERIFY", payload: { ok: true, entity: ent, do_event_count: c.count, recent: (r.events || []).map(e => ({ type: e.type, summary: e.summary, at: new Date(e.ts).toISOString() })) } };
      } catch (e) {
        return { cmd: "DO_VERIFY", payload: { ok: false, error: e.message } };
      }
    }
    case "DO_STORM": {
      if (!isOp) return { cmd: "DO_STORM", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Concurrent events across E entities, each routed to its OWN DurableObject. No shared store.
      const count = Math.min(parseInt(args[0] || "100", 10) || 100, 400);
      const entities = Math.min(parseInt(args[1] || "20", 10) || 20, 100);
      const runTag = "dostorm_" + Date.now().toString(36);
      const t0 = Date.now();
      const writes = [];
      const expected = {};
      for (let i = 0; i < count; i++) {
        const ent = `${runTag}_e${i % entities}`;
        expected[ent] = (expected[ent] || 0) + 1;
        const stub = entityStub(env, ent);
        writes.push(stub.fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "dostorm", summary: `seq ${i}` }) })).then(r => r.ok).catch(() => false));
      }
      const results = await Promise.all(writes);
      const write_ms = Date.now() - t0;
      const writes_ok = results.filter(Boolean).length;
      // Verify each entity's DO holds exactly its own events — concurrent reads, each to its own object
      const t1 = Date.now();
      const readLat = [];
      let perfectEntities = 0, lost = 0;
      const verify = await Promise.all(Object.entries(expected).map(async ([ent, exp]) => {
        const s = Date.now();
        const stub = entityStub(env, ent);
        const c = await (await stub.fetch(new Request("https://do/count"))).json();
        readLat.push(Date.now() - s);
        return { ent, exp, got: c.count };
      }));
      for (const v of verify) { if (v.got === v.exp) perfectEntities++; else lost += (v.exp - v.got); }
      const read_ms = Date.now() - t1;
      readLat.sort((a, b) => a - b);
      const payload = {
        ok: true, run: runTag, requested: count, entities,
        writes_ok, write_ms, write_per_sec: Math.round(count / (write_ms / 1000)),
        verify_ms: read_ms, read_latency_ms: { min: readLat[0], median: readLat[Math.floor(readLat.length/2)], max: readLat[readLat.length-1] },
        entities_perfect: perfectEntities, entities_total: verify.length,
        integrity: lost === 0 ? "PERFECT" : `LOST ${lost}`
      };
      await env.AURA_KV.put("monitor:dostorm:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "DO_STORM", payload };
    }
    case "DO_TEST": {
      if (!isOp) return { cmd: "DO_TEST", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const ent = args[0] || ("do_test_" + Date.now().toString(36));
      const n = Math.min(parseInt(args[1] || "5", 10) || 5, 50);
      const stub = entityStub(env, ent);
      const steps = {};
      try {
        for (let i = 0; i < n; i++) {
          await stub.fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts: Date.now(), type: "do_test", summary: `event ${i}`, body: JSON.stringify({ i }) }) }));
        }
        const cnt = await (await stub.fetch(new Request("https://do/count"))).json();
        const recent = await (await stub.fetch(new Request("https://do/recent?limit=3"))).json();
        steps.entity = ent;
        steps.appended = n;
        steps.do_count = cnt.count;
        steps.recent_sample = (recent.events || []).map(e => e.summary);
        steps.integrity = cnt.count === n ? "PERFECT" : `expected ${n} got ${cnt.count}`;
        return { cmd: "DO_TEST", payload: { ok: true, ...steps } };
      } catch (e) {
        return { cmd: "DO_TEST", payload: { ok: false, error: e.message, steps } };
      }
    }
    case "INTEGRITY_SCAN": {
      if (!isOp) return { cmd: "INTEGRITY_SCAN", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Store-wide consistency audit — the scaled version of the single-record audit Aura performed.
      const listed = await env.AURA_KV.list({ prefix: "business:claimed:biz_", limit: 1000 });
      const recordKeys = listed.keys.map(k => k.name).filter(n => n.split(":").length === 3);
      const issues = [];
      let scanned = 0;
      for (const n of recordKeys.slice(0, 200)) {
        let rec; try { rec = JSON.parse(await env.AURA_KV.get(n)); } catch { issues.push({ key: n, problem: "unparseable record" }); continue; }
        scanned++;
        const probs = [];
        if (rec.status === "verified") {
          if (!rec.verified_at) probs.push("verified but no verified_at");
          else if (rec.created && new Date(rec.verified_at).getTime() < new Date(rec.created).getTime()) probs.push("verified_at precedes created (impossible)");
        }
        if (!rec.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rec.email)) probs.push("invalid or missing email");
        if (!rec.created) probs.push("missing created timestamp");
        if (!rec.business) probs.push("missing business name");
        if (probs.length) issues.push({ id: rec.id, business: rec.business, problems: probs });
      }
      return { cmd: "INTEGRITY_SCAN", payload: { ok: true, scanned, clean: scanned - issues.length, issues_found: issues.length, issues } };
    }
    case "PLANT_INCONSISTENCY": {
      if (!isOp) return { cmd: "PLANT_INCONSISTENCY", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Judgment test fixture: a business record marked "verified" but with NO verification event in its history,
      // and a verified_at timestamp that predates its own creation. A sound auditor must catch both.
      const id = "biz_audit_" + Date.now().toString(36);
      const created = new Date().toISOString();
      const fakeVerified = new Date(Date.now() - 86400000).toISOString(); // verified 1 day BEFORE created — impossible
      const rec = { id, business: "Phantom Audit Co", contact: "Test", email: "audit@arksystems.world", phone: "555-0900", source: "highguide.world", address: "", status: "verified", created, verified_at: fakeVerified };
      await env.AURA_KV.put(`business:claimed:${id}`, JSON.stringify(rec));
      // Write a CLAIM event but deliberately NO verification event — history contradicts the "verified" status
      try {
        await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind("claim_" + id, Date.now(), "business_claim", JSON.stringify(rec), ((await env.AURA_KV.get("config:owner:identity").catch(() => null)) || "system"), "highguide.world", `Claim: Phantom Audit Co`).run();
      } catch {}
      return { cmd: "PLANT_INCONSISTENCY", payload: { ok: true, planted_id: id, note: "Record claims verified; history has no verification event; verified_at predates created. Three defects." } };
    }
    case "ENDURANCE": {
      if (!isOp) return { cmd: "ENDURANCE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Sustained mixed load in waves. Detect drift: does wave N look like wave 1, or has it degraded?
      const waves = Math.min(parseInt(args[0] || "8", 10) || 8, 20);
      const opsPerWave = Math.min(parseInt(args[1] || "30", 10) || 30, 60);
      const ent = "endur_" + Date.now().toString(36);
      const waveReport = [];
      let totalWrites = 0;
      for (let w = 0; w < waves; w++) {
        const t0 = Date.now();
        const ops = [];
        const lat = [];
        for (let i = 0; i < opsPerWave; i++) {
          if (i % 3 === 0) { ops.push(writeEvent(ent, ent, "endur", "endur_w", JSON.stringify({ w, i }), `w${w} ${i}`, env).then(() => { totalWrites++; }).catch(() => {})); }
          else { ops.push((async () => { const s = Date.now(); await getRecentEvents(ent, env, 8); lat.push(Date.now() - s); })()); }
        }
        await Promise.all(ops);
        lat.sort((a, b) => a - b);
        waveReport.push({ wave: w, ms: Date.now() - t0, read_median: lat[Math.floor(lat.length / 2)] ?? null, reads: lat.length });
      }
      // Integrity: every write must be in D1
      let d1 = -1; try { d1 = (await env.AURA_MEMORY.prepare("SELECT COUNT(*) as n FROM events WHERE entity_id = ?").bind(ent).first())?.n ?? -1; } catch {}
      // Drift analysis: compare last 3 waves' median read latency vs first 3
      const meds = waveReport.map(w => w.read_median).filter(x => x != null);
      const firstAvg = meds.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, meds.length);
      const lastAvg = meds.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, meds.length);
      const driftPct = firstAvg ? Math.round(((lastAvg - firstAvg) / firstAvg) * 100) : 0;
      const payload = {
        ok: true, entity: ent, waves, opsPerWave, total_writes: totalWrites,
        d1_integrity: d1 === totalWrites ? "PERFECT" : `expected ${totalWrites} got ${d1}`,
        first3_median_ms: Math.round(firstAvg), last3_median_ms: Math.round(lastAvg),
        latency_drift: driftPct > 25 ? `DEGRADED +${driftPct}%` : (driftPct < -25 ? `IMPROVED ${driftPct}%` : `STABLE ${driftPct}%`),
        waveReport
      };
      try { await env.AURA_MEMORY.prepare("DELETE FROM events WHERE entity_id = ?").bind(ent).run(); } catch {}
      await env.AURA_KV.put("monitor:endurance:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "ENDURANCE", payload };
    }
    case "READ_STORM": {
      if (!isOp) return { cmd: "READ_STORM", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Seed one entity, then hammer concurrent reads WHILE writes interleave. Measure latency + coherence.
      const reads = Math.min(parseInt(args[0] || "50", 10) || 50, 200);
      const seed = Math.min(parseInt(args[1] || "30", 10) || 30, 100);
      const ent = "readstorm_" + Date.now().toString(36);
      // Seed
      const seedW = [];
      for (let i = 0; i < seed; i++) seedW.push(writeEvent(ent, ent, "seed", "read_seed", JSON.stringify({ seq: i }), `seed ${i}`, env).catch(() => {}));
      await Promise.all(seedW);
      // Concurrent reads + interleaved writes (the busy-timeline condition)
      const t0 = Date.now();
      const latencies = [];
      const ops = [];
      for (let i = 0; i < reads; i++) {
        ops.push((async () => { const s = Date.now(); const r = await getRecentEvents(ent, env, 8); latencies.push(Date.now() - s); return r.length; })());
        if (i % 5 === 0) ops.push(writeEvent(ent, ent, "live", "read_live", JSON.stringify({ seq: i }), `live ${i}`, env).catch(() => {}));
      }
      const readResults = await Promise.all(ops);
      const total_ms = Date.now() - t0;
      const counts = readResults.filter(x => typeof x === "number");
      const torn = counts.filter(c => c < 8).length; // reads that saw fewer than the requested window
      latencies.sort((a, b) => a - b);
      const payload = {
        ok: true, entity: ent, reads, seed_events: seed, total_ms,
        read_latency_ms: { min: latencies[0], median: latencies[Math.floor(latencies.length / 2)], max: latencies[latencies.length - 1] },
        reads_returning_full_window: counts.length - torn, reads_short: torn,
        coherence: torn === 0 ? "PERFECT" : `${torn} reads saw partial timeline`
      };
      // cleanup seed+live D1 rows
      try { await env.AURA_MEMORY.prepare("DELETE FROM events WHERE session_id = ?").bind(ent).run(); } catch {}
      await env.AURA_KV.put("monitor:read_storm:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "READ_STORM", payload };
    }
    case "EVENT_STORM_REAL": {
      if (!isOp) return { cmd: "EVENT_STORM_REAL", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Fire through the REAL writeEvent path (D1 + KV cache read-modify-write). Expose cache races.
      const count = Math.min(parseInt(args[0] || "40", 10) || 40, 120);
      const entities = Math.min(parseInt(args[1] || "4", 10) || 4, 10);
      const runId = "stormr_" + Date.now().toString(36);
      const t0 = Date.now();
      const writes = [];
      const perEntity = {};
      for (let i = 0; i < count; i++) {
        const eIdx = i % entities;
        const ent = `${runId}_ent${eIdx}`;
        perEntity[ent] = (perEntity[ent] || 0) + 1;
        writes.push(writeEvent(ent, runId, "storm", "storm_real", JSON.stringify({ seq: i }), `${runId} seq ${i}`, env).then(() => ({ ok: true })).catch(e => ({ ok: false, error: String(e.message).slice(0, 60) })));
      }
      const results = await Promise.all(writes);
      const write_ms = Date.now() - t0;
      const writes_ok = results.filter(r => r.ok).length;
      // D1 truth
      let d1_count = -1;
      try { d1_count = (await env.AURA_MEMORY.prepare("SELECT COUNT(*) as n FROM events WHERE session_id = ?").bind(runId).first())?.n ?? -1; } catch {}
      // KV cache integrity: per entity, how many of its events actually survived in the cache (cap 20/entity)
      const cacheReport = [];
      let cacheTotal = 0, expectedCacheTotal = 0;
      for (const [ent, expected] of Object.entries(perEntity)) {
        const expCapped = Math.min(expected, 20);
        expectedCacheTotal += expCapped;
        let got = 0;
        try { const c = await env.AURA_MEMORY.prepare("SELECT COUNT(*) as n FROM events WHERE entity_id = ?").bind(ent).first(); got = Math.min(c?.n ?? 0, 20); } catch {}
        cacheTotal += got;
        cacheReport.push({ entity: ent, expected_in_cache: expCapped, found_in_cache: got, lost: expCapped - got });
      }
      const payload = {
        ok: true, run: runId, requested: count, entities, writes_ok, write_ms,
        d1_verified_count: d1_count, d1_integrity: d1_count === count ? "PERFECT" : `LOST ${count - d1_count}`,
        per_entity_expected: expectedCacheTotal, per_entity_found: cacheTotal,
        d1_per_entity_integrity: cacheTotal === expectedCacheTotal ? "PERFECT" : `LOST ${expectedCacheTotal - cacheTotal}`,
        cacheReport
      };
      await env.AURA_KV.put("monitor:storm_real:last", JSON.stringify({ ts: new Date().toISOString(), ...payload })).catch(() => {});
      return { cmd: "EVENT_STORM_REAL", payload };
    }
    case "STORM_CLEANUP": {
      if (!isOp) return { cmd: "STORM_CLEANUP", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const rid = args[0] || "";
      if (!rid) return { cmd: "STORM_CLEANUP", payload: { ok: false, error: "Usage: STORM_CLEANUP <run_id>" } };
      try {
        const r = await env.AURA_MEMORY.prepare("DELETE FROM events WHERE session_id = ?").bind(rid).run();
        return { cmd: "STORM_CLEANUP", payload: { ok: true, run: rid, deleted: r?.meta?.changes ?? "unknown" } };
      } catch (e) { return { cmd: "STORM_CLEANUP", payload: { ok: false, error: e.message } }; }
    }
    case "RELAUNCH_ALL": {
      if (!isOp) return { cmd: "RELAUNCH_ALL", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      // Sweep: relaunch every launched domain through the trustworthy launcher (purge ghost + verify live).
      // Produces a full map of which domains actually serve vs which are still captured by old routing.
      let pool = [];
      try {
        const raw = await env.AURA_KV.get("config:domains:launched");
        // Tolerate the historically-corrupted launched list: extract anything domain-shaped
        pool = [...new Set((raw || "").match(/[a-z0-9-]+\.(?:world|us|com|guide|city|kids|network|systems|solutions|tools|business)/gi) || [])];
      } catch {}
      const PROT = ["auras.guide", "console.auras.guide", "arksystems.world"];
      pool = pool.filter(d => !PROT.includes(d.toLowerCase()));
      // Cursor-based: process a small slice per call so we never exceed the Worker CPU limit.
      const start = Math.max(parseInt(args[0] || "0", 10) || 0, 0);
      const limit = Math.min(parseInt(args[1] || "5", 10) || 5, 6);
      const batch = pool.slice(start, start + limit);
      const scoreboard = { total_launched: pool.length, range: `${start}-${start + batch.length}`, serving_ok: [], broken: [], ghosts_purged: 0 };
      for (const d of batch) {
        // Lightweight: purge ghost + check live. No LLM, no page rewrite.
        try {
          const legacyKey = "patch_index:" + btoa(`page:${d}/`);
          if (await env.AURA_KV.get(legacyKey) !== null) { await env.AURA_KV.delete(legacyKey); scoreboard.ghosts_purged++; }
        } catch {}
        try {
          const live = await fetch(`https://${d}/?diag=${Date.now()}`, { headers: { "cache-control": "no-cache" } });
          const lt = await live.text();
          if (live.ok && lt.length > 400) scoreboard.serving_ok.push(d);
          else scoreboard.broken.push({ domain: d, status: live.status, served: lt.length });
        } catch (e) { scoreboard.broken.push({ domain: d, error: String(e.message).slice(0, 60) }); }
      }
      scoreboard.next_cursor = (start + batch.length < pool.length) ? start + batch.length : null;
      await env.AURA_KV.put("monitor:relaunch:last", JSON.stringify({ ts: new Date().toISOString(), ...scoreboard })).catch(() => {});
      return { cmd: "RELAUNCH_ALL", payload: { ok: true, ...scoreboard } };
    }
    case "DOMAIN_DIAGNOSE": {
      if (!isOp) return { cmd: "DOMAIN_DIAGNOSE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const dDomain = (args[0] || "").toLowerCase().trim();
      if (!dDomain) return { cmd: "DOMAIN_DIAGNOSE", payload: { ok: false, error: "Usage: DOMAIN_DIAGNOSE <domain>" } };
      const dToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
      const report = { domain: dDomain };
      try {
        const zr = await (await fetch(`https://api.cloudflare.com/client/v4/zones?name=${dDomain}`, { headers: { "Authorization": "Bearer " + dToken } })).json();
        const zone = zr?.result?.[0];
        report.zone = zone ? { id: zone.id, account_id: zone.account?.id } : null;
        if (zone) {
          const rr = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${zone.id}/workers/routes`, { headers: { "Authorization": "Bearer " + dToken } })).json();
          report.zone_routes = (rr?.result || []).map(r => ({ pattern: r.pattern, script: r.script }));
          if (zone.account?.id) {
            const cd = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${zone.account.id}/workers/domains?zone_id=${zone.id}`, { headers: { "Authorization": "Bearer " + dToken } })).json();
            report.custom_domains = (cd?.result || []).map(d => ({ hostname: d.hostname, service: d.service }));
          }
        }
      } catch (e) { report.cf_error = e.message; }
      try {
        const kvPage = await env.AURA_KV.get(`page:${dDomain}/`);
        report.kv_page_chars = kvPage ? kvPage.length : null;
      } catch {}
      try {
        if (report.zone?.id) {
          const dns = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${report.zone.id}/dns_records`, { headers: { "Authorization": "Bearer " + dToken } })).json();
          report.dns_records = (dns?.result || []).map(r => ({ type: r.type, name: r.name, content: r.content, proxied: r.proxied }));
        }
      } catch (e) { report.dns_error = e.message; }
      try {
        const live = await fetch(`https://${dDomain}/?diag=${Date.now()}`);
        const lt = await live.text();
        report.live = { status: live.status, chars: lt.length, title: (lt.match(/<title>([^<]*)</) || [])[1] || null };
      } catch (e) { report.live = { error: e.message }; }
      const apexDns = (report.dns_records || []).filter(r => (r.type === "A" || r.type === "AAAA" || r.type === "CNAME") && (r.name === dDomain || r.name === "www." + dDomain));
      report.verdict = report.kv_page_chars && report.live?.chars && Math.abs(report.kv_page_chars - report.live.chars) < 300
        ? "SERVING_FROM_KV_OK"
        : (report.live?.status === 530 && apexDns.length === 0 ? "NO_DNS_RECORD_530"
        : (report.custom_domains?.length ? "CUSTOM_DOMAIN_LIKELY_OVERRIDING_ROUTES" : "MISMATCH_CAUSE_IN_ROUTES_OR_DNS"));
      return { cmd: "DOMAIN_DIAGNOSE", payload: { ok: true, ...report } };
    }
    case "DOMAIN_LAUNCH": {
      if (!isOp) return { cmd: "DOMAIN_LAUNCH", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      const parts = line.trim().split(/\s+/);
      const domain = parts[1] || "";
      if (!domain) return { cmd: "DOMAIN_LAUNCH", payload: { ok: false, error: "Usage: DOMAIN_LAUNCH <domain> [description] [theme:blue|purple|green]" } };
      const themeMatch = parts.find(p => p.startsWith("theme:"));
      const theme = themeMatch ? themeMatch.replace("theme:", "") : "blue";
      const desc = parts.slice(2).filter(p => !p.startsWith("theme:")).join(" ");
      return { cmd: "DOMAIN_LAUNCH", payload: await launchDomain(domain, desc, theme, env) };
    }
    case "DOMAIN_STATUS": {
      const launched = await env.AURA_KV.get("config:domains:launched").catch(() => null);
      const all = await env.AURA_KV.get("config:domains:all").catch(() => null);
      const launchedList = launched ? JSON.parse(launched) : [];
      const allList = all ? all.split(",") : [];
      return { cmd: "DOMAIN_STATUS", payload: { ok: true, total_domains: allList.length, launched: launchedList.length, launched_list: launchedList } };
    }
    case "MERCURY_BALANCE": {
      const bal = await getMercuryBalance(env);
      return { cmd: "MERCURY_BALANCE", payload: bal };
    }

    case "MERCURY_TRANSACTIONS": {
      const parts = line.trim().split(/\s+/);
      const limit = parseInt(parts[1]) || 10;
      const txns = await getMercuryTransactions(env, null, limit);
      return { cmd: "MERCURY_TRANSACTIONS", payload: txns };
    }

    case "MERCURY_ACCOUNTS": {
      const accts = await getMercuryAccounts(env);
      return { cmd: "MERCURY_ACCOUNTS", payload: accts };
    }

    case "SESSION_TOKEN_GENERATE": {
      const userId = line.trim().slice("SESSION_TOKEN_GENERATE".length).trim();
      if (!userId) return { cmd: "SESSION_TOKEN_GENERATE", payload: { ok: false, error: "Usage: SESSION_TOKEN_GENERATE <userId>" } };
      const token = await signSessionToken(userId, env);
      return { cmd: "SESSION_TOKEN_GENERATE", payload: { ok: true, userId, token, expires_in: "24h" } };
    }

    case "CONSENSUS": {
      const question = line.trim().slice("CONSENSUS".length).trim();
      if (!question) return { cmd: "CONSENSUS", payload: { ok: false, error: "Usage: CONSENSUS <question>" } };
      const result = await multiModelConsensus(question, env);
      return { cmd: "CONSENSUS", payload: result };
    }

    case "FETCH_PLACES": {
      const parts = line.trim().split(/\s+/);
      const query = parts.slice(1).join(" ");
      if (!query) return { cmd: "FETCH_PLACES", payload: { ok: false, error: "Usage: FETCH_PLACES dispensaries in Las Vegas NV" } };
      try {
        const gmKey = await env.AURA_KV.get("secret:google_maps").catch(() => null);
        if (!gmKey) return { cmd: "FETCH_PLACES", payload: { ok: false, error: "No Google Maps key in KV at secret:google_maps" } };
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${gmKey}`;
        const r = await fetch(url);
        const d = await r.json();
        if (d.status !== "OK") return { cmd: "FETCH_PLACES", payload: { ok: false, error: d.status, details: d.error_message } };
        const places = (d.results || []).slice(0, 10).map(p => ({
          name: p.name,
          address: p.formatted_address || p.vicinity,
          rating: p.rating,
          place_id: p.place_id,
          lat: p.geometry && p.geometry.location ? p.geometry.location.lat : null,
          lng: p.geometry && p.geometry.location ? p.geometry.location.lng : null,
          photo: p.photos && p.photos[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${gmKey}` : null
        }));
        const cacheKey = "data:places:" + query.toLowerCase().replace(/\s+/g, "_").slice(0, 80);
        await env.AURA_KV.put(cacheKey, JSON.stringify(places));
        return { cmd: "FETCH_PLACES", payload: { ok: true, query, count: places.length, cached_at: cacheKey, places } };
      } catch(e) {
        return { cmd: "FETCH_PLACES", payload: { ok: false, error: e.message } };
      }
    }

    case "DEPLOY_HIGHGUIDE": {
      if (!isOp) return { cmd: "DEPLOY_HIGHGUIDE", payload: { ok: false, error: "OPERATOR_REQUIRED" } };
      try {
        const parts = line.trim().split(/\s+/);
        const city = parts.slice(1).join(" ") || "Las Vegas NV";
        const gmKey = await env.AURA_KV.get("secret:google_maps").catch(() => null);
        if (!gmKey) return { cmd: "DEPLOY_HIGHGUIDE", payload: { ok: false, error: "No Google Maps key" } };
        // Fetch dispensaries
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=cannabis+dispensary+${encodeURIComponent(city)}&key=${gmKey}`;
        const r = await fetch(url);
        const d = await r.json();
        const places = (d.results || []).slice(0, 6).map(p => ({
          n: p.name,
          a: p.formatted_address || p.vicinity || "",
          r: p.rating || "",
          img: p.photos && p.photos[0] ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${gmKey}` : "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&q=80"
        }));
        // Store in KV
        const cacheKey = "data:places:dispensaries_" + city.toLowerCase().replace(/\s+/g, "_");
        await env.AURA_KV.put(cacheKey, JSON.stringify(places));
        return { cmd: "DEPLOY_HIGHGUIDE", payload: { ok: true, city, dispensaries: places.length, cached_at: cacheKey } };
      } catch(e) {
        return { cmd: "DEPLOY_HIGHGUIDE", payload: { ok: false, error: e.message } };
      }
    }

    default:
      return null;
  }
}

async function getRecentEvents(entityId, env, limit = 8) {
  // Prefer the entity's own Durable Object timeline (isolated, no shared ceiling).
  if (entityId && env.ENTITY_DO) {
    try {
      const stub = entityStub(env, entityId);
      const r = await (await stub.fetch(new Request(`https://do/recent?limit=${limit}`))).json();
      if (r?.ok && Array.isArray(r.events) && r.events.length > 0) {
        return r.events.map(e => ({ type: e.type, channel: e.channel, summary: e.summary, body: e.body, created_at: new Date(e.ts).toISOString() }));
      }
    } catch {}
  }
  // Fallback: rendered read cache + D1 (for entities not yet in a DO).
  const rcKey = `readcache:${entityId}`;
  try {
    const hit = await env.AURA_KV.get(rcKey);
    if (hit) { const arr = JSON.parse(hit); if (arr.length >= limit) return arr.slice(0, limit); }
  } catch {}
  // Miss → D1 source of truth, then render the cache for next time (5 min TTL)
  try {
    const rows = await env.AURA_MEMORY.prepare(
      "SELECT type, channel, summary, body, created_at FROM events WHERE entity_id = ? ORDER BY ts DESC LIMIT ?"
    ).bind(entityId, Math.max(limit, 20)).all();
    const results = rows.results || [];
    if (results.length > 0) { env.AURA_KV.put(rcKey, JSON.stringify(results), { expirationTtl: 300 }).catch(() => {}); }
    return results.slice(0, limit);
  } catch (e) {
    // D1 failed — serve last rendered read cache if present
    try {
      const hit = await env.AURA_KV.get(`readcache:${entityId}`);
      if (hit) return JSON.parse(hit).slice(0, limit);
    } catch {}
    return [];
  }
}


// ─── Vector Memory (Hybrid Retrieval) ────────────────────────────────────────
// Embeds conversation events using CF AI and stores in Vectorize.
// Hybrid retrieval: last 2-3 events (recency) + top 4-5 semantic matches.

async function embedText(text, env) {
  try {
    const result = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [text.slice(0, 512)] });
    return result?.data?.[0] || null;
  } catch { return null; }
}

async function storeEventVector(entityId, eventId, text, env) {
  try {
    const embedding = await embedText(text, env);
    if (!embedding) return false;
    await env.VECTORIZE.upsert([{
      id: `${entityId}:${eventId}`,
      values: embedding,
      metadata: { entityId, eventId, text: text.slice(0, 200), ts: Date.now() }
    }]);
    return true;
  } catch { return false; }
}

async function getSemanticEvents(entityId, query, env, limit = 5) {
  try {
    const embedding = await embedText(query, env);
    if (!embedding) return [];
    const results = await env.VECTORIZE.query(embedding, {
      topK: limit,
      filter: { entityId },
      returnMetadata: true
    });
    return (results?.matches || [])
      .filter(m => m.score > 0.7)
      .map(m => m.metadata?.text)
      .filter(Boolean);
  } catch { return []; }
}

async function getHybridEvents(entityId, query, env) {
  // Recency: last 3 events always included
  const recent = await getRecentEvents(entityId, env, 3);
  
  // Semantic: top 5 relevant events based on current query
  const semantic = await getSemanticEvents(entityId, query, env, 5);
  
  // Combine: recent events + semantic events (deduplicated)
  const recentTexts = new Set(recent.map(e => e.summary || e.body));
  const combined = [...recent];
  for (const s of semantic) {
    if (!recentTexts.has(s)) {
      combined.push({ type: "semantic", summary: s, body: s });
      if (combined.length >= 8) break;
    }
  }
  return combined;
}

async function writeEvent(entityId, sessionId, channel, type, body, summary, env) {
  // DUAL-WRITE during migration: entity's own Durable Object (new primary) + D1 (safety net).
  const ts = Date.now();
  const eventId = `${ts}_${Math.random().toString(36).slice(2, 7)}`;
  // 1) Living Entity DO — the per-entity timeline that scales to millions.
  if (entityId && env.ENTITY_DO) {
    try {
      const stub = entityStub(env, entityId);
      await stub.fetch(new Request("https://do/append", { method: "POST", body: JSON.stringify({ ts, type, channel, summary, body: body ? String(body).slice(0, 4000) : "" }) }));
    } catch (e) {}
  }
  // 2) D1 safety net — kept in parallel until the DO path is fully trusted.
  try {
    await env.AURA_MEMORY.prepare(
      "INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(sessionId, ts, type, body, entityId, channel, summary).run();
  } catch (e) {}
  // Store vector embedding asynchronously (non-blocking)
  const vectorText = summary || (body ? body.slice(0, 200) : "");
  if (vectorText && entityId) {
    storeEventVector(entityId, eventId, vectorText, env).catch(() => {});
  }
  // Invalidate the rendered read cache so the next read rebuilds from D1 truth.
  try { await env.AURA_KV.delete(`readcache:${entityId}`); } catch {}
}

function detectDeployIntent(message) {
  const lower = message.toLowerCase();
  // Imperative only: the shortcut fires when the message STARTS with a deploy verb.
  // Conversation ABOUT deploys ("your launch of X succeeded...") goes to the brain.
  const deployVerbs = /^(?:please\s+)?(deploy|publish|launch|build|rebuild|create|make|put up|update|generate|write)\b/i;
  const pageNouns = /\b(page|site|homepage|home page|landing page|about page|terms|privacy|holding page)\b/;
  const domainMatch = lower.match(/\b([a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:world|guide|com|us|city|kids|network|systems|solutions|tools|business))\b/);
  // A domain mention plus a deploy verb is enough — "rebuild highguide.world" needs no page noun
  if (!deployVerbs.test(lower)) return null;
  if (!pageNouns.test(lower) && !domainMatch) return null;
  const domain = domainMatch ? domainMatch[1] : "auras.guide";
  // Protected infrastructure — never auto-deploy pages over these
  if (domain === "console.auras.guide") return { intent: "blocked", domain };
  // Path detection: only route to a subpage when the request is explicitly ABOUT that subpage
  // (e.g. "deploy the privacy page", "update the about page"), NOT just because the word appears
  // in a description of the page's content. Require the keyword to be adjacent to "page"/"policy",
  // or an explicit "to /path" / "at domain/path". Default is always root.
  let path = "/";
  const explicitPath = lower.match(/\b(?:to|at|key|path)\s+\/?(about|terms|privacy)\b/) || lower.match(/\/(about|terms|privacy)\b/);
  const subpagePhrase = lower.match(/\b(about|terms|privacy)\s+(?:page|policy)\b/);
  const chosen = (explicitPath && explicitPath[1]) || (subpagePhrase && subpagePhrase[1]);
  if (chosen === "about") path = "/about";
  else if (chosen === "terms") path = "/terms";
  else if (chosen === "privacy") path = "/privacy";
  // Note: a request to deploy a homepage that merely CONTAINS a privacy/about section stays at root "/".
  return { intent: "deploy", domain, path, description: message };
}

async function generatePageHTML(description, path, apiKey, env) {
  // Inject real data: any data:* keys named in the message, plus auto-load dispensary cache for highguide
  let dataContext = "";
  try {
    const keyRefs = [...new Set(description.match(/data:[a-z0-9_:.-]+/gi) || [])];
    if (/highguide|dispensar/i.test(description) && !keyRefs.includes("data:places:cannabis_dispensary_las_vegas_nv")) {
      keyRefs.push("data:places:cannabis_dispensary_las_vegas_nv");
    }
    for (const k of keyRefs.slice(0, 3)) {
      const v = await env.AURA_KV.get(k).catch(() => null);
      if (v) dataContext += `\n\nREAL DATA from KV key ${k} (render this exact data, never invent placeholder content):\n${v}`;
    }
  } catch {}
  // Model is read from KV config (same as every other brain call) - never hardcoded. The page
  // engine was previously pinned to a model whose access got suspended, which silently broke ALL
  // page builds; reading config:brain:model keeps it consistent and swappable without a code change.
  const pageModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: pageModel,
      max_tokens: 16000,
      system: `You are Aura's page generation engine. Generate complete, production-ready HTML pages.

Rules:
- Output ONLY raw HTML. No markdown. No explanation. No code fences. No preamble.
- Start with <!DOCTYPE html> and end with </html>
- Include all CSS and JS inline — no external dependencies
- Design aesthetic: dark, minimal, modern. Background #0a0a0a. Clean sans-serif typography.
- The Aura brand: sophisticated AI OS. Tagline: "Your operating system for reality."
- When REAL DATA is provided, render every record from it exactly — never invent placeholder content
- Claim This Business forms must actually work: collect business name, contact name, email, phone, then POST JSON {business, name, email, phone, source: location.hostname} to https://auras.guide/claim via fetch, show the returned message to the user on success, show the error on failure. No dead ends, no mailto links, no fake submits.
- Function over decoration: if the request says functional-only, skip hero images and ornamentation
- Make it responsive`,
      messages: [{ role: "user", content: `Generate the page for: ${description}\nURL path: ${path}${dataContext}` }]
    })
  });
  const data = await res.json();
  if (data?.type === "error" || data?.error) {
    return { html: null, error: data?.error?.message || JSON.stringify(data).slice(0, 300) };
  }
  let text = (data?.content || []).filter(b => b.type === "text").map(b => b.text).join("") || null;
  if (text) {
    text = text.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const start = text.indexOf("<!DOCTYPE");
    if (start > 0) text = text.slice(start);
  }
  return { html: text, error: text ? null : "Empty response from model" };
}


function detectPatchIntent(message) {
  const lower = message.toLowerCase();
  // Verb and code-noun must be adjacent (within 30 chars): "fix aura-core's chat handler" triggers,
  // "update notes ... aura-core reached v2.2.5" does not.
  const adjacent = /\b(fix|repair|patch|modify|rewrite|improve)\b[\s\S]{0,30}\b(aura-core|aura-ops|aura-host|aura-comms|aura-media|worker|source|handler|endpoint|route)\b/;
  const approveWords = /^(go|approve|deploy it|ship it)$/i;
  if (approveWords.test(message.trim())) return { intent: "approve" };
  if (adjacent.test(lower)) {
    // Detect which worker
    let worker = "aura-core-v2";
    if (/aura-ops/.test(lower)) worker = "aura-ops";
    else if (/aura-host/.test(lower)) worker = "aura-host";
    else if (/aura-comms/.test(lower)) worker = "aura-comms";
    else if (/aura-media/.test(lower)) worker = "aura-media";
    // aura-ops is the safety layer — never self-modifiable
    if (worker === "aura-ops") {
      return { intent: "blocked", worker, reason: "aura-ops is the safety layer and cannot be self-modified. Deploy it manually via wrangler." };
    }
    return { intent: "patch", worker, description: message };
  }
  return null;
}

async function executePatchProposal(description, worker, apiKey, env) {
  // Read current worker source via aura-ops
  if (!env.AURA_OPS) return { ok: false, error: "AURA_OPS not bound" };

  const readRes = await env.AURA_OPS.fetch(new Request("https://aura-ops.aaronkaracas.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
    body: "READ_WORKER " + worker
  }));
  const readData = await readRes.json();

  if (!readData?.reply?.ok || !readData?.reply?.source) {
    return { ok: false, error: "Could not read worker source. Run SNAPSHOT_WORKER " + worker + " first." };
  }

  const currentSource = readData.reply.source;

  // Ask LLM to propose a fix
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      system: `You are Aura's self-modification engine. You read worker source code and apply requested changes.

Rules:
- Output ONLY the complete modified JavaScript source file. No explanation. No markdown. No code fences.
- Preserve all existing functionality unless explicitly asked to remove it.
- Make minimal, targeted changes.
- Update the BUILD string version and date.
- The output must be valid JavaScript that can be deployed directly as a Cloudflare Worker.

CRITICAL PROTECTED FUNCTIONS — never modify these under any circumstances:
- verifyOperator() — operator authentication. Any change here breaks all secure access.
- getOperatorToken() — token retrieval. Never touch.
- The authorization header check logic — never reorder or wrap this.
- KV.get(), KV.put(), KV.del() — core storage helpers. Never modify.

When adding new features like rate limiting, caching, or middleware:
- Add them AFTER the existing verifyOperator call, never before or around it.
- Never wrap the fetch handler in new middleware that could intercept auth.
- Add new functions at the bottom of the file, reference them from existing handlers.

CF WORKER SPECIFIC RULES — these prevent runtime crashes:
- Never use request.cf — it may be undefined. Use request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown" for IP detection.
- Never use top-level await outside of async functions.
- Never import external modules — all code must be self-contained.
- Always wrap env bindings in try/catch — env.AURA_KV.get() can throw, use the KV helper functions.
- Never declare variables with the same name as existing functions or constants.`,
      messages: [{ role: "user", content: `Current source of ${worker} (capped at 6000 chars for performance):

${currentSource.slice(0, 6000)}

File is ${currentSource.length} chars total. Make ONLY the minimal targeted change. Add new functions before the export default. Output the COMPLETE modified source.

Requested change: ${description}` }]
    })
  });

  const data = await res.json();
  const proposedSource = data?.content?.[0]?.text || null;
  if (!proposedSource) return { ok: false, error: "LLM returned no proposed source." };

  // Destructive-proposal guard: a "patch" should not vaporize the worker
  const guardProposedLines = proposedSource.split("\n").length;
  const guardCurrentLines = currentSource.split("\n").length;
  if (guardProposedLines < guardCurrentLines * 0.6 || proposedSource.length < 2000) {
    return { ok: false, error: `Proposal rejected as destructive: it would shrink ${worker} from ${guardCurrentLines} to ${guardProposedLines} lines. Nothing was staged. Rephrase the request as a specific, small change.` };
  }

  // Encode proposed source
  const encoder = new TextEncoder();
  const bytes = encoder.encode(proposedSource);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);

  // Store proposal in KV for approval
  await env.AURA_KV.put("pending_patch:worker", worker);
  await env.AURA_KV.put("pending_patch:b64", b64);
  await env.AURA_KV.put("pending_patch:description", description);
  await env.AURA_KV.put("pending_patch:ts", new Date().toISOString());

  // Show a summary of what changed (first 800 chars of proposed vs current diff hint)
  const proposedLines = proposedSource.split("\n").length;
  const currentLines = currentSource.split("\n").length;

  return {
    ok: true,
    proposal: true,
    worker,
    current_lines: currentLines,
    proposed_lines: proposedLines,
    summary: `I've read ${worker} (${currentLines} lines) and prepared a modified version (${proposedLines} lines). Change: "${description}". Reply "go" to deploy, or describe what to change differently.`
  };
}

async function executeApprovedPatch(env) {
  const worker = await env.AURA_KV.get("pending_patch:worker").catch(() => null);
  const b64 = await env.AURA_KV.get("pending_patch:b64").catch(() => null);
  const description = await env.AURA_KV.get("pending_patch:description").catch(() => null);

  if (!worker || !b64) return { ok: false, error: "No pending patch found. Ask me to fix something first." };

  if (!env.AURA_OPS) return { ok: false, error: "AURA_OPS not bound" };

  const deployRes = await env.AURA_OPS.fetch(new Request("https://aura-ops.aaronkaracas.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
    body: "DEPLOY_WORKER " + worker + " " + b64
  }));

  const deployData = await deployRes.json();
  const result = deployData?.reply || deployData;

  // Clear pending patch
  await env.AURA_KV.delete("pending_patch:worker").catch(() => {});
  await env.AURA_KV.delete("pending_patch:b64").catch(() => {});
  await env.AURA_KV.delete("pending_patch:description").catch(() => {});

  if (result?.auto_rolled_back) {
    return { ok: false, worker, error: `Deployed but auto-rolled back: ${result.reason}` };
  }
  if (result?.deployed || result?.ok) {
    const healthStatus = result?.health_check && result?.auth_check ? "passed" : result?.health_check ? "health ok but auth check failed - rolled back" : "pending";
    return {
      ok: result?.auth_check !== false,
      deployed: true,
      worker,
      health_check: result?.health_check,
      auth_check: result?.auth_check,
      rollback_available: result?.rollback_available,
      message: `Deployed to ${worker}. Health check: ${healthStatus}. Previous version saved for rollback.`
    };
  } else {
    return { ok: false, worker, error: "Deploy failed", details: result };
  }
}

// Streaming Anthropic caller — long generations stream continuously so edge timeouts (524)
// cannot kill heavy thinking. Never throws on HTTP/parse problems; returns a structured result.
// ===== ECONOMICS ENGINE (foundation): cost-to-serve instrumentation =====
// Every AI call is metered here. _AURA_ENV is set once at the request entry so the
// API wrapper (which has no env) can write the cost ledger. Prices are USD per 1M tokens;
// a code default, overridable later via config:economics:prices. Sibling of the loop's timing.
let _AURA_ENV = null;
const _AI_PRICES = { sonnet: { in: 3, out: 15 }, haiku: { in: 1, out: 5 }, opus: { in: 15, out: 75 }, default: { in: 3, out: 15 } };
async function recordCost(model, usage) {
  try {
    if (!_AURA_ENV || !usage) return;
    const m = String(model || "");
    const tier = m.includes("haiku") ? "haiku" : m.includes("opus") ? "opus" : m.includes("sonnet") ? "sonnet" : "default";
    const p = _AI_PRICES[tier] || _AI_PRICES.default;
    const inTok = usage.input_tokens || 0, outTok = usage.output_tokens || 0;
    if (!inTok && !outTok) return;
    const usd = (inTok / 1e6) * p.in + (outTok / 1e6) * p.out;
    const day = new Date().toISOString().slice(0, 10);
    const key = "economics:cost:" + day;
    let agg = { date: day, calls: 0, input_tokens: 0, output_tokens: 0, usd: 0, by_model: {} };
    try { const ex = await _AURA_ENV.AURA_KV.get(key); if (ex) agg = JSON.parse(ex); } catch {}
    agg.calls += 1; agg.input_tokens += inTok; agg.output_tokens += outTok; agg.usd += usd;
    agg.by_model[tier] = Number(((agg.by_model[tier] || 0) + usd).toFixed(6));
    agg.usd = Number(agg.usd.toFixed(6));
    await _AURA_ENV.AURA_KV.put(key, JSON.stringify(agg));
  } catch {}
}

// ===== THE SHARED MIND — every engine reasons THROUGH this, instead of hand-writing its own prompt =====
// One structured pass: SEE -> EXPAND (challenge assumptions, find leverage) -> JUDGE -> DECIDE.
// Built in for ALL engines that use it: assumption-challenging (gap #1), data-trust / is-this-number-real
// (gap #2), and honest push-back on the operator when their own frame is shaky (gap #5).
// Fast (single call) but it genuinely thinks. Engines pass their specialized LENS; the thinking is shared.
async function reasonThroughLoop(env, opts) {
  opts = opts || {};
  const apiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
  if (!apiKey) return { ok: false, error: "Brain not configured (secret:anthropic missing)" };
  const model = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
  // ONE central reasoning cap. Generous by default so real reasoning always FINISHES, firm so no single
  // answer can run away and drain the float. Adjustable any time via config:brain:reasoning_cap — no code change.
  let reasoningCap = 3000;
  try { const rc = await env.AURA_KV.get("config:brain:reasoning_cap"); if (rc) { const n = parseInt(rc, 10); if (n > 0) reasoningCap = n; } } catch {}
  const capToUse = Math.min(opts.maxTokens || reasoningCap, reasoningCap);
  const extra = (opts.extraKeys && opts.extraKeys.length) ? (", plus these lens-specific keys: " + opts.extraKeys.map(k => k.key + " (" + k.desc + ")").join(", ")) : "";
  const sys = "You are Aura reasoning through her Cognitive Loop in ONE pass. Before you answer you ALWAYS run four moves in order: "
    + "(1) SEE — observe what is actually true from the facts, separating VERIFIED facts from claims and assumptions. "
    + "(2) EXPAND — challenge every assumption you were handed, especially anything in the FRAME. Ask what is truly NECESSARY versus merely assumed, what the MINIMUM viable version is, and where the non-obvious leverage is. A real operator questions the plan; a weak one optimizes inside a plan it never examined. "
    + "(3) JUDGE — weigh which possibilities actually hold up and matter most. "
    + "(4) DECIDE — choose the single highest-leverage move, grounded in what is REALLY true, not what the frame assumed. "
    + "TWO reflexes you always apply: DATA TRUST — flag any fact you would not fully trust (a number that could be a broken/failed data pipe, a null that might be a silent failure, a 'fact' that is actually a future promise); and PUSH BACK — if the operator's own frame rests on something unverified or shaky, say so directly and plainly to the operator, do not just quietly work around it. "
    + "Apply this specialized LENS: " + (opts.lens || "general operator reasoning") + ". "
    + "Scale to the actual situation — a person's life gets a human-sized read, a venture gets a venture read; never inflate. Ground everything in the facts; no generic filler. "
    + "Return ONLY a JSON object, no prose, no fences, with these keys: saw (what is actually true, separating fact from assumption), assumptions_challenged (array — each assumption examined with a verdict on whether it is truly necessary), data_trust (array — any fact you would not fully trust and why, or empty), minimum_viable (one sentence — the smallest real version that works now), the_move (the single highest-leverage decision), why (one sentence), push_back (one sentence directly to the operator IF their frame rests on something unverified/shaky, else empty string), watch_for (array), confidence (high|medium|low)" + extra + ". Output JSON only.";
  const user = "FACTS:\n" + (typeof opts.facts === "string" ? opts.facts : JSON.stringify(opts.facts || {})) + (opts.frame ? ("\n\nFRAME (challenge this — do NOT blindly accept it):\n" + String(opts.frame).slice(0, 2500)) : "") + "\n\nSITUATION: " + (opts.entity || "");
  try {
    const d = await callAnthropic(apiKey, { model, max_tokens: capToUse, system: sys, messages: [{ role: "user", content: user }] });
    let tx = ""; if (d && d.content) { for (const b of d.content) { if (b.type === "text") tx += b.text; } }
    tx = tx.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    // primary parse
    try { return { ok: true, reasoning: JSON.parse(tx) }; } catch (e1) {
      // RECOVERY: the model may have been truncated mid-JSON (hit the token ceiling) or added stray
      // characters. Try to salvage the reasoning instead of throwing it away.
      // 1) extract the outermost object
      const first = tx.indexOf("{"); const last = tx.lastIndexOf("}");
      if (first !== -1 && last > first) { try { return { ok: true, reasoning: JSON.parse(tx.slice(first, last + 1)) }; } catch {} }
      // 2) close an unterminated string + balance braces, then parse
      try {
        let s = tx.slice(first === -1 ? 0 : first);
        // count unescaped quotes; if odd, the last string is open -> close it
        const quotes = (s.match(/(?<!\\)"/g) || []).length; if (quotes % 2 !== 0) s += '"';
        const opens = (s.match(/{/g) || []).length, closes = (s.match(/}/g) || []).length;
        const openB = (s.match(/\[/g) || []).length, closeB = (s.match(/\]/g) || []).length;
        s += "]".repeat(Math.max(0, openB - closeB)) + "}".repeat(Math.max(0, opens - closes));
        const salvaged = JSON.parse(s);
        return { ok: true, reasoning: salvaged, recovered: true };
      } catch {}
      // 3) still unparseable — return the raw text so nothing is lost, flagged
      return { ok: true, reasoning: { saw: "(reasoning returned but could not be parsed as JSON; raw text preserved)", raw: tx.slice(0, 4000), parse_error: String(e1 && e1.message) }, recovered: false, raw_only: true };
    }
  } catch (e) { return { ok: false, error: "Reasoning failed: " + String(e && e.message) }; }
}

async function callAnthropicOnce(apiKey, payload) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ ...payload, stream: true })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: `HTTP ${res.status}: ${t.slice(0, 200)}`, retryable: res.status >= 500 || res.status === 429 };
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/event-stream")) {
      const t = await res.text().catch(() => "");
      try {
        const d = JSON.parse(t);
        if (d?.type === "error") return { ok: false, status: res.status, error: JSON.stringify(d.error).slice(0, 200), retryable: true };
        return { ok: true, status: res.status, content: d.content || [], stop_reason: d.stop_reason || null, usage: d.usage ? { input_tokens: d.usage.input_tokens || 0, output_tokens: d.usage.output_tokens || 0 } : null };
      } catch { return { ok: false, status: res.status, error: "non-JSON response: " + t.slice(0, 120), retryable: true }; }
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    const content = [];
    let stopReason = null;
    let current = null;
    let streamErr = null;
    let usageIn = 0, usageOut = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const lineRaw of lines) {
        const line = lineRaw.trim();
        if (!line.startsWith("data:")) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr) continue;
        let ev; try { ev = JSON.parse(dataStr); } catch { continue; }
        if (ev.type === "error") { streamErr = JSON.stringify(ev.error || ev).slice(0, 200); }
        else if (ev.type === "message_start") {
          if (ev.message && ev.message.usage) { usageIn = ev.message.usage.input_tokens || 0; usageOut = ev.message.usage.output_tokens || usageOut; }
        }
        else if (ev.type === "content_block_start") {
          current = ev.content_block && ev.content_block.type === "tool_use"
            ? { type: "tool_use", id: ev.content_block.id, name: ev.content_block.name, _json: "" }
            : { type: "text", text: "" };
          content.push(current);
        } else if (ev.type === "content_block_delta" && current) {
          if (ev.delta && ev.delta.type === "text_delta") current.text += ev.delta.text;
          else if (ev.delta && ev.delta.type === "input_json_delta") current._json += (ev.delta.partial_json || "");
        } else if (ev.type === "content_block_stop") {
          if (current && current.type === "tool_use") { try { current.input = JSON.parse(current._json || "{}"); } catch { current.input = {}; } delete current._json; }
          current = null;
        } else if (ev.type === "message_delta") {
          if (ev.delta && ev.delta.stop_reason) stopReason = ev.delta.stop_reason;
          if (ev.usage && typeof ev.usage.output_tokens === "number") usageOut = ev.usage.output_tokens;
        }
      }
    }
    if (streamErr) return { ok: false, status: 200, error: "stream error: " + streamErr, retryable: true };
    return { ok: true, status: 200, content, stop_reason: stopReason, usage: { input_tokens: usageIn, output_tokens: usageOut } };
  } catch (e) {
    return { ok: false, status: 0, error: "fetch failed: " + (e && e.message ? e.message : String(e)), retryable: true };
  }
}

// One automatic retry on transient failures (5xx, 429, network, malformed) — a blip never costs a task.
async function callAnthropic(apiKey, payload) {
  let r = await callAnthropicOnce(apiKey, payload);
  if (!r.ok && r.retryable) {
    await new Promise(s => setTimeout(s, 2000));
    r = await callAnthropicOnce(apiKey, payload);
  }
  if (r.ok && r.usage) { await recordCost(payload && payload.model, r.usage); }
  return r;
}

async function llmReply(message, env, sessionId, isOp = false, callerPta = null) {
  const apiKey = env.ANTHROPIC_API_KEY || await KV.get(env, "secret:anthropic");
  if (!apiKey) return "Anthropic API key not configured.";

  const memKey = `memory:${sessionId}`;
  const mem = await KV.get(env, memKey) || "";
  const currentTasksRaw = await env.AURA_KV.get("config:tasks:list").catch(() => null);
  const currentTasks = currentTasksRaw || "[]";
  const protectedInfra = await env.AURA_KV.get("notes:aura:protected:infrastructure").catch(() => null);

  let continuityContext = "";
  let entityId = sessionId?.startsWith("entity:") ? sessionId.slice(7) : null;
  // VOICE/PHONE: if a caller PTA was passed (from the comms layer), resolve WHO is calling so a known
  // caller is treated as themselves. The phone-number -> operator-identity mapping is DATA, stored in
  // KV (identity:operator:phones = JSON object of { "phone:<digits>": "<entityId>" }). The engine here
  // is generic: look up the caller's identity_key in that map; if present, use the mapped entityId
  // (e.g. operator); otherwise the caller keeps their own PTA id; unknown stays null (generic).
  if (!entityId && callerPta) {
    try {
      const ent = await env.AURA_MEMORY.prepare("SELECT identity_key FROM pta_entities WHERE id = ?").bind(callerPta).first();
      const ik = ent && ent.identity_key ? String(ent.identity_key) : "";
      let mapped = null;
      if (ik) {
        const mapRaw = await env.AURA_KV.get("identity:operator:phones").catch(() => null);
        if (mapRaw) { try { const m = JSON.parse(mapRaw); if (m && m[ik]) mapped = m[ik]; } catch {} }
      }
      entityId = mapped || callerPta;
    } catch { entityId = callerPta; }
  }
  if (entityId) {
    const events = await getRecentEvents(entityId, env, 8);
    if (events.length > 0) {
      continuityContext = "\n\nRecent history with this person:\n" +
        events.reverse().map(e => `[${e.created_at}] ${e.channel||e.type}: ${e.summary||e.body?.slice(0,100)}`).join("\n");
    }
  }

  const isVoice = sessionId && (sessionId.startsWith("CA") || sessionId.startsWith("sms_") || sessionId.startsWith("T")) && !sessionId.startsWith("entity:");

  // Load operator context for the configured owner/operator identity (read from KV, not hardcoded).
  let operatorContext = "";
  const ownerIdentity = await env.AURA_KV.get("config:owner:identity").catch(() => null);
  const ownerName = (await env.AURA_KV.get("config:owner:name").catch(() => null)) || "your operator";
  if (ownerIdentity && entityId === ownerIdentity) {
    if (isVoice) {
      // On the phone: she just needs to KNOW it is the operator and that they have full access. Keep it
      // tight - answer their questions directly (tasks, build, status), don't read a report.
      operatorContext = `\n\nYou are speaking with ${ownerName}, your founder and operator, on the phone. They have full operator access. Answer their questions directly and help with whatever they ask - tasks, the build, status, anything. Never tell them they lack access or to check with an operator; they ARE the operator. Current task list: ${currentTasks}`;
    } else {
      const [progress, autonomy, gameplan] = await Promise.all([
        KV.get(env, "notes:build:progress:canonical"),
        KV.get(env, "notes:build:autonomy:canonical"),
        KV.get(env, "notes:build:gameplan:canonical")
      ]);
      operatorContext = `\n\nYou are talking to ${ownerName}, your founder and operator. They built you. Treat them with full operator access and context.\n\nCurrent build status: ${progress || "unknown"}\n\nAutonomy roadmap: ${autonomy || "unknown"}\n\nArchitecture: ${gameplan || "unknown"}`;
    }
  }

  if (!isVoice) {
    // Check for approval of pending patch
    const patchIntent = detectPatchIntent(message);
    if (patchIntent?.intent === "approve") {
      if (!isOp) return "Self-modification requires operator authorization.";
      const ts = await env.AURA_KV.get("pending_patch:ts").catch(() => null);
      if (ts && Date.now() - new Date(ts).getTime() > 15 * 60 * 1000) {
        for (const k of ["pending_patch:worker", "pending_patch:b64", "pending_patch:description", "pending_patch:ts"]) await env.AURA_KV.delete(k).catch(() => {});
        return "The pending patch was over 15 minutes old, so I discarded it for safety. Ask for the change again if you still want it.";
      }
      const result = await executeApprovedPatch(env);
      return result.message || (result.ok ? "Deployed." : "Error: " + result.error);
    }

    // Check for patch/fix intent
    if (patchIntent?.intent === "blocked") {
      return `Cannot self-modify ${patchIntent.worker}: ${patchIntent.reason}`;
    }
    if (patchIntent?.intent === "patch") {
      if (!isOp) return "Self-modification requires operator authorization.";
      const result = await executePatchProposal(patchIntent.description, patchIntent.worker, apiKey, env);
      if (result.proposal) return result.summary;
      return "Could not prepare patch: " + result.error;
    }

    const deployIntent = detectDeployIntent(message);
    if (deployIntent?.intent === "blocked") {
      return `I won't auto-deploy over ${deployIntent.domain} — it's protected infrastructure.`;
    }
    if (deployIntent) {
      const { domain, path, description } = deployIntent;

      const gen = await generatePageHTML(description, path, apiKey, env);
      if (!gen.html) return "Page generation failed: " + gen.error;

      // Pages live in shared KV at page:domain.com/ (trailing slash on root) — aura-host serves them instantly
      const pageKey = `page:${domain}${path === "/" ? "/" : path}`;
      try {
        await env.AURA_KV.put(pageKey, gen.html);
      } catch (e) {
        return `Page generated (${gen.html.length} chars) but KV write to ${pageKey} failed: ${e.message}`;
      }

      // VERIFY: fetch the live page and confirm the deploy actually took
      let verdict = "";
      try {
        const live = await fetch(`https://${domain}${path}`, { headers: { "cache-control": "no-cache" } });
        const liveHtml = await live.text();
        const sizeOk = Math.abs(liveHtml.length - gen.html.length) < 200;
        const contentOk = liveHtml.includes("<!DOCTYPE") || liveHtml.includes("<!doctype");
        if (live.ok && sizeOk && contentOk) {
          verdict = ` VERIFIED: fetched https://${domain}${path}, got ${liveHtml.length} chars matching what I wrote.`;
        } else {
          verdict = ` VERIFY FAILED: live page returned status ${live.status}, ${liveHtml.length} chars (wrote ${gen.html.length}). The KV write succeeded but serving doesn't match — likely a routing or caching issue on ${domain}.`;
          const lesson = `LESSON ${new Date().toISOString().slice(0,10)}: deploy to ${pageKey} wrote ${gen.html.length} chars but live fetch returned status ${live.status} / ${liveHtml.length} chars. Check CF route for ${domain} points to aura-host.`;
          await env.AURA_KV.put("notes:lessons:deploy:latest", lesson).catch(() => {});
        }
      } catch (e) {
        verdict = ` VERIFY FAILED: could not fetch https://${domain}${path} — ${e.message}. KV write succeeded; the domain may not be routed to aura-host.`;
        await env.AURA_KV.put("notes:lessons:deploy:latest", `LESSON ${new Date().toISOString().slice(0,10)}: ${domain} unreachable after deploy (${e.message}). Check DNS/route.`).catch(() => {});
      }

      return `Done. I generated ${gen.html.length} characters of HTML and deployed to ${pageKey}.${verdict}`;
    }
  }

  const auraIdentity = await env.AURA_KV.get("notes:aura:identity").catch(() => null);
  const auraOpPrinciple = await env.AURA_KV.get("notes:aura:operating:principle").catch(() => null);

  // Business context for ANY voice caller (including strangers / carrier reviewers asking about the
  // business). Read from KV (data, not hardcoded). This lets Aura knowledgeably represent the business
  // - what it is, what its text messages are for - to whoever calls, without confabulating.
  let voiceBusinessContext = "";
  if (isVoice) {
    const bizVoice = await env.AURA_KV.get("config:voice:business_context").catch(() => null);
    if (bizVoice) voiceBusinessContext = `\n\nAbout the business you represent (use these facts when callers ask who you are or what the messages are for; do not invent beyond this): ${String(bizVoice).slice(0, 1200)}`;
  }

  const _vNow = new Date();
  const _voiceToday = _vNow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const _voiceTime = _vNow.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone: "America/Los_Angeles" });
  const sysPrompt = isVoice
    ? `You are Aura, a voice AI assistant. The current date and time RIGHT NOW is ${_voiceToday}, ${_voiceTime}. This is the real, authoritative current date and time - trust it completely for any question about the day, date, time, or year; never say a different year from your training. Strict rules: No markdown, no asterisks, no bullet points, no dashes, no special characters, no emojis. BE BRIEF - this is a live phone call: answer in ONE short sentence whenever possible, two only if truly needed. Lead with the answer, cut all filler, no preamble, no listing options. Talk like a real person on the phone keeping it tight. IMPORTANT - current-world facts: your training knowledge is older than today's date above, so do NOT state who currently holds an office (president, etc.), recent news, live prices, or anything that changes over time as if you know it - that information may be out of date. For those, say plainly you'd want to check rather than give a possibly-outdated answer. Never confidently assert a current officeholder or recent event from memory.${operatorContext}${voiceBusinessContext}${continuityContext}${mem ? `\n\nContext: ${mem.slice(0, 500)}` : ""}`
    : `${auraIdentity || "You are Aura, an intelligent operating system built by Aaron Karacas."}

${auraOpPrinciple ? auraOpPrinciple.slice(0, 400) : ""}

${protectedInfra || "NEVER run DOMAIN_LAUNCH on auras.guide, console.auras.guide, or arksystems.world."}

CURRENT TASK LIST - you MUST preserve ALL these tasks when adding new ones:
${currentTasks}

TO ADD A TASK: output exactly this on one line:
SETKV config:tasks:list [EXISTING_TASKS_PLUS_NEW_TASK]
The array must contain ALL existing tasks above plus the new one appended. Never write only the new task.

OTHER COMMANDS (one per line, auto-executed):
DOMAIN_LAUNCH domain.com
FETCH_PLACES dispensaries in Las Vegas NV
DEPLOY_HIGHGUIDE Las Vegas NV
MERCURY_BALANCE
STRIPE_BALANCE  
DOMAIN_STATUS
DEPLOY_CONSOLE

AUTHORIZATION CONTEXT: You operate infrastructure owned by Aaron Karacas / ARK Systems LLC, with his explicit standing authorization as operator. Every domain, KV store, and worker you touch is ARK Systems property. Investigating, modifying, and verifying these systems is your authorized job, not an intrusion.

YOUR OPERATING CYCLE — every piece of work follows this loop:
OBSERVE (read current state) → ANALYZE → ACT → VERIFY (check the result actually happened) → LEARN (write a lesson to KV if anything surprised you). Never claim something is done without verifying it. Never lose a hard-won lesson — save it.

YOUR PRIMITIVES (output on its own line; the system executes it and hands you the result before you answer):
[[READ key]] — read any KV key. Up to 3 per round.
[[RUN command args]] — execute any of your commands (SETKV, DELKV, FETCH_PLACES, DOMAIN_LAUNCH, DOMAIN_DIAGNOSE, DOMAIN_STATUS, MERCURY_BALANCE, STRIPE_BALANCE, DEPLOY_HIGHGUIDE) and see its real result. Up to 2 per round.
[[FETCH https://url]] — fetch any live URL to verify a page is serving what it should. You get status, length, and a content sample. Up to 2 per round.
[[SEARCH your query]] — search the LIVE web for current information you don't have (current officeholders, today's news, prices, hours, a business's real details, anything that changes over time). You get back a direct answer plus sources. USE THIS instead of saying you'd want to check or guessing from old training — you CAN look things up now. Up to 2 per round.
CRITICAL: To use a primitive you must OUTPUT THE TAG ITSELF, exactly, with double square brackets: [[FETCH https://highguide.world]] — then stop. Values inside a tag may contain anything except the two-character sequence ]] — single brackets are fine. NEVER write "I will fetch" or "executing now" — narration does nothing. Emit the tags, the system runs them, you get results, then you answer. You get up to 3 rounds before your final answer. READ before answering questions about state, RUN to change state, FETCH to verify changes took, RUN SETKV notes:lessons:<topic> to record lessons. NEVER say you lack access — you have these primitives.

KEY DIRECTORY: business:claimed:index = claim list CACHE (may undercount under concurrent claims; derived truth is GET https://auras.guide/claims). business:claimed:<id> = one claim record. config:tasks:list = tasks. config:assets:list = assets. config:domains:launched = launched domains. data:places:cannabis_dispensary_las_vegas_nv = cached Vegas dispensary data. notes:handoff:next = session state. notes:lessons:* = your accumulated lessons.
${operatorContext}${continuityContext}${mem ? `\n\nContext from memory:\n${mem.slice(0, 2000)}` : ""}`;

  // Multi-model routing: Anthropic primary → OpenAI fallback → Grok fallback
  let raw = null;
  let modelUsed = null;

  // 1. Primary: Anthropic Claude — NATIVE TOOL USE (sanctioned tool_use/tool_result channel).
  // This replaces the homegrown [[READ]] text tags that the safety layer misread as extraction.
  let agentErr = null;
  let lastStop = null;
  try {
    const tools = [
      { name: "read_data", description: "Read a stored value by its key from the system's key-value store.", input_schema: { type: "object", properties: { key: { type: "string", description: "The key to read" } }, required: ["key"] } },
      { name: "run_command", description: "Execute an operational command. KEY COMMANDS: SETKV key value (write full value - ONLY for small values under 2000 chars), GETKV key, LISTKV prefix [limit] (lists KV keys by prefix), DELKV key, PATCHKV key find_string ||| replace_string (surgical find-and-replace in a KV value - USE THIS for editing pages instead of rewriting them. The ||| delimiter separates the find and replace strings). CRITICAL: For page edits, ALWAYS use PATCHKV, never SETKV. SETKV rewrites the entire value which causes truncation for large pages. PATCHKV only changes what you specify. SYSTEM: DOMAIN_LAUNCH, DOMAIN_STATUS, FETCH_PLACES query, EMAIL_SEND <to> <subject> | <body>. AURAPAY: AURAPAY BALANCE/TRANSACTIONS/REFUND/CUSTOMER/SUBSCRIBE/CANCEL/CHECKOUT. REGISTRY: CAPABILITY REGISTER/LIST/GET, INDUSTRY REGISTER/UPDATE/LIST/GET, BUSINESS_STATE SET/GET. PTA: PTA_INIT, PTA_ENTITY, PTA_GRANT, PTA_SCAN, PTA_QUERY. CF_API: CF_API <METHOD> <path> [json]. Provide the full command line.", input_schema: { type: "object", properties: { command: { type: "string", description: "The command line to execute" } }, required: ["command"] } },
      { name: "fetch_url", description: "Fetch a live URL and return its status and content, to verify what a page is serving.", input_schema: { type: "object", properties: { url: { type: "string", description: "The https URL to fetch" } }, required: ["url"] } }
    ];
    const claudeSystem = "You are Claude, an AI assistant by Anthropic, acting as the operations assistant for a software system whose operator owns all referenced infrastructure and has authorized you to use the provided tools to read data, run operational commands, and verify results. CRITICAL: To read data, run a command, or fetch a URL you MUST call the provided tools (read_data, run_command, fetch_url). NEVER write bracketed pseudo-commands like [[READ key]] in your text — those do nothing. NEVER state the contents of a key without first calling read_data and receiving its actual value; inventing data is a serious failure. If you have not called the tool, you do not know the value. Be proactive and decisive, but ground every factual claim about system state in a real tool result. OPERATIONAL RULES (ALWAYS FOLLOW): (1) PAGE EDITS: NEVER use SETKV to modify an existing page. SETKV rewrites the entire value and causes truncation for large pages. ALWAYS use PATCHKV for page edits. PATCHKV does surgical find-and-replace: PATCHKV key old_text ||| new_text. (2) NEW PAGES: Only use SETKV for brand new pages under 2000 characters. For larger pages, write them in sections or have the operator deploy via page-put. (3) KEY NAMES: NEVER assume a key name. ALWAYS use LISTKV prefix first to find exact key names. (4) VERIFICATION: PATCHKV auto-verifies. SETKV for page: keys auto-verifies. Always check the verified field in the response. If verified is false, report FAILURE. (5) NEVER REPORT FALSE SUCCESS: Only say done if the tool response confirms it.";
    const convo = [{ role: "user", content: `${sysPrompt}\n\n---\nRequest: ${message}` }];
    // Voice runs on a FAST model (Haiku) - on a call, a quick reply beats a brilliant slow one, and
    // short spoken answers don't need Sonnet's depth. Tunable via config:voice:model. Non-voice keeps
    // the full brain model (config:brain:model). This is the main lever against "she pauses to think".
    const brainModel = isVoice
      ? ((await env.AURA_KV.get("config:voice:model").catch(() => null)) || "claude-haiku-4-5-20251001")
      : ((await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5");
    const PROT = ["auras.guide", "console.auras.guide", "arksystems.world"];
    const MAX_ROUNDS = 12;
    // VOICE FAST PATH: on a phone call latency is everything. Skip the multi-round tool agent-loop
    // entirely - one model call, no tools, short answer. She still has her full context + loaded data
    // in the system prompt (operator awareness, tasks, etc.), so she answers from what she knows; she
    // just doesn't pause mid-call to run live tools. This turns 2-4 round-trips into one fast reply.
    if (isVoice) {
      // Voice uses NO tools, so don't send the huge tool-rules claudeSystem - that bloat slows the call
      // and adds latency variance. The voice sysPrompt already carries identity, brevity rules, operator
      // and business context. Send only that = far fewer tokens = faster, more consistent replies.
      const vData = await callAnthropic(apiKey, { model: brainModel, max_tokens: 120, system: sysPrompt, messages: [{ role: "user", content: message }] });
      if (vData.ok) {
        const vText = (vData.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
        if (vText) raw = vText;
      }
      if (raw === null) { agentErr = vData.error || "voice brain returned nothing"; }
    }
    for (let round = 0; round < MAX_ROUNDS && raw === null && !isVoice; round++) {
      // On the final allowed round, force a text answer (no tools) so Claude composes from what it gathered
      // instead of requesting more tools and falling through to the fallback brain.
      const forceAnswer = round === MAX_ROUNDS - 1;
      const data = await callAnthropic(apiKey, { model: brainModel, max_tokens: isVoice ? 200 : 16384, system: claudeSystem, tools, messages: forceAnswer ? [...convo, { role: "user", content: "You have gathered enough. Do not call any more tools. Write your complete final answer now using what you already have." }] : convo, ...(forceAnswer ? { tool_choice: { type: "none" } } : {}) });
      if (!data.ok) {
        agentErr = data.error;
        await KV.put(env, "monitor:fable_raw", JSON.stringify({ ts: new Date().toISOString(), http_status: data.status, raw: String(data.error).slice(0, 1500) })).catch(() => {});
        break;
      }
      lastStop = data.stop_reason || null;
      const content = data.content || [];
      const toolUses = content.filter(b => b.type === "tool_use");
      const textOut = content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      if (data.stop_reason === "refusal") {
        agentErr = "refusal";
        await KV.put(env, "monitor:fable_raw", JSON.stringify({ ts: new Date().toISOString(), http_status: 200, raw: JSON.stringify(content).slice(0, 1500) })).catch(() => {});
        break;
      }
      if (toolUses.length === 0) {
        // Guard against the model narrating fake [[TAG]] commands instead of calling tools.
        if (/\[\[(READ|RUN|FETCH|GETKV)\b/i.test(textOut) && round < 4) {
          convo.push({ role: "assistant", content: textOut });
          convo.push({ role: "user", content: "You wrote a bracketed pseudo-command but did not call a tool, so nothing executed and any value you stated is unverified. Call the actual read_data / run_command / fetch_url tool now to get the real value, then answer." });
          continue;
        }
        raw = textOut || null; if (raw) modelUsed = "anthropic"; break;
      }
      // Execute each requested tool, return tool_result blocks
      convo.push({ role: "assistant", content });
      const toolResults = [];
      for (const tu of toolUses) {
        let out = "";
        try {
          if (tu.name === "read_data") {
            const k = String(tu.input?.key || "");
            if (k.startsWith("secret:") && !isOp) out = "BLOCKED: secrets require operator authorization.";
            else { const v = await env.AURA_KV.get(k).catch(() => null); out = v === null ? "(key not found)" : (v.length > 60000 ? v.slice(0, 60000) + `\n[TRUNCATED — total length ${v.length} chars; you saw the first 60000]` : v); }
          } else if (tu.name === "run_command") {
            const cmd = String(tu.input?.command || "");
            if (/^DOMAIN_LAUNCH/i.test(cmd) && PROT.some(d => cmd.toLowerCase().includes(d))) out = "BLOCKED: protected infrastructure.";
            else if (/^CF_API\s+DELETE/i.test(cmd) && (PROT.some(d => cmd.toLowerCase().includes(d)) || cmd.includes("61e85d4c895f555fc1b5637939d0466f"))) out = "BLOCKED: destructive CF_API call against protected infrastructure. Modify (POST/PUT/PATCH) is allowed; deletion of protected zone resources requires the operator to run it directly.";
            else if (!isOp) out = "DENIED: operator authorization required.";
            else { const r = await processCommand(cmd, env, true); out = r instanceof Response ? await r.text() : JSON.stringify(r); if (out.length > 20000) out = String(out).slice(0, 20000) + `\n[TRUNCATED — total ${out.length} chars]`; }
          } else if (tu.name === "fetch_url") {
            const u = String(tu.input?.url || "");
            let fr = null, ft = "", via = "public";
            try { fr = await fetch(u, { headers: { "cache-control": "no-cache" } }); ft = await fr.text(); } catch {}
            // Self-serve mirror: our own zones can 522/fail when fetched from inside the edge.
            // Retry through the aura-host service binding so Aura can always see her own pages.
            if ((!fr || fr.status >= 500) && env.AURA_HOST) {
              try { const fr2 = await env.AURA_HOST.fetch(new Request(u, { headers: { "cache-control": "no-cache" } })); if (fr2 && fr2.status < 500) { fr = fr2; ft = await fr2.text(); via = "aura-host-binding"; } } catch {}
            }
            out = fr ? `status ${fr.status} (via ${via}), ${ft.length} chars:\n${ft.slice(0, 8000)}${ft.length > 8000 ? "\n[TRUNCATED — total " + ft.length + " chars]" : ""}` : "ERROR: fetch failed both publicly and via aura-host binding.";
          }
        } catch (e) { out = "ERROR: " + e.message; }
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: out });
      }
      convo.push({ role: "user", content: toolResults });
    }
    // Final safety net: budget exhausted while still gathering — force one tools-off compose on Claude.
    if (raw === null && lastStop === "tool_use" && agentErr === null) {
      const d2 = await callAnthropic(apiKey, { model: brainModel, max_tokens: isVoice ? 200 : 16384, system: claudeSystem, messages: [...convo, { role: "user", content: "Stop gathering. Write your complete final answer now from everything above." }] });
      if (d2.ok) {
        const t2 = (d2.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
        if (t2) { raw = t2; modelUsed = "anthropic"; lastStop = d2.stop_reason || "end_turn"; }
      }
    }
    if (!isVoice) {
      await env.AURA_KV.put("monitor:last_agent_loop", JSON.stringify({
        ts: new Date().toISOString(), error: agentErr, stop_reason: lastStop,
        rounds: convo.length, mode: "native_tools", final: (raw || "").slice(0, 400)
      })).catch(() => {});
    }
  } catch (e) {
    raw = null;
    agentErr = "LOOP_CRASH: " + (e && e.message ? e.message : String(e));
    lastStop = "crashed";
    if (!isVoice) {
      await env.AURA_KV.put("monitor:last_agent_loop", JSON.stringify({
        ts: new Date().toISOString(), error: agentErr, stop_reason: "crashed",
        rounds: -1, mode: "native_tools", final: null
      })).catch(() => {});
    }
  }


  // 2. OpenAI — full agent loop (primary working brain; gets the same READ/RUN/FETCH cycle)
  if (!raw) {
    try {
      const openaiKey = env.OPENAI_API_KEY || await KV.get(env, "secret:openai");
      let openaiApiKey = openaiKey;
      if (openaiKey && openaiKey.startsWith("{")) { try { openaiApiKey = JSON.parse(openaiKey).api_key; } catch {} }
      if (openaiApiKey) {
        const convo = [{ role: "system", content: sysPrompt }, { role: "user", content: message }];
        for (let round = 0; round < 5 && raw === null; round++) {
          const fbRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": "Bearer " + openaiApiKey, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o", max_tokens: isVoice ? 150 : 2048, messages: convo })
          });
          const fbData = await fbRes.json();
          const text = fbData?.choices?.[0]?.message?.content || null;
          if (!text) break;
          const reads = [...text.matchAll(/\[\[(?:READ|GETKV)\s+([^\]\s]+)\]\]/g)].map(m => m[1]).slice(0, 3);
          const runs = [
            ...[...text.matchAll(/\[\[RUN\s+([\s\S]*?)\]\]/g)].map(m => m[1].trim()),
            ...[...text.matchAll(/\[\[((?:SETKV|DELKV|DOMAIN_LAUNCH|DOMAIN_DIAGNOSE|DOMAIN_STATUS|FETCH_PLACES|DEPLOY_HIGHGUIDE|MERCURY_BALANCE|STRIPE_BALANCE)\s[\s\S]*?)\]\]/g)].map(m => m[1].trim())
          ].slice(0, 3);
          const fetches = [...text.matchAll(/\[\[FETCH\s+(https:\/\/[^\]\s]+)\]\]/g)].map(m => m[1]).slice(0, 2);
          const searches = [...text.matchAll(/\[\[SEARCH\s+([\s\S]*?)\]\]/g)].map(m => m[1].trim()).slice(0, 2);
          if ((reads.length || runs.length || fetches.length || searches.length) && round < 4 && !isVoice) {
            let results = "";
            const PROT = ["auras.guide", "console.auras.guide", "arksystems.world"];
            for (const cmdLine of runs) {
              if (/^DOMAIN_LAUNCH/i.test(cmdLine) && PROT.some(d => cmdLine.toLowerCase().includes(d))) { results += `\n[RUN ${cmdLine.slice(0,60)}]: BLOCKED protected`; continue; }
              if (!isOp) { results += `\n[RUN ${cmdLine.slice(0,60)}]: DENIED operator required`; continue; }
              try { let r = await processCommand(cmdLine, env, true); let s = r instanceof Response ? await r.text() : JSON.stringify(r); results += `\n[RUN ${cmdLine.split(/\s+/)[0]}]: ${String(s).slice(0,400)}`; } catch (e) { results += `\n[RUN]: ERROR ${e.message}`; }
            }
            for (const k of reads) {
              if (k.startsWith("secret:") && !isOp) { results += `\n[READ ${k}]: BLOCKED`; continue; }
              const v = await env.AURA_KV.get(k).catch(() => null);
              results += `\n[READ ${k}]: ${v === null ? "(not found)" : v.slice(0, 1500)}`;
            }
            for (const u of fetches) {
              try { const fr = await fetch(u, { headers: { "cache-control": "no-cache" } }); const ft = await fr.text(); results += `\n[FETCH ${u}]: ${fr.status}, ${ft.length} chars: ${ft.slice(0,800)}`; } catch (e) { results += `\n[FETCH]: ERROR ${e.message}`; }
            }
            for (const q of searches) {
              try {
                const sr = await webSearch(q, env);
                if (sr.ok) {
                  let block = `\n[SEARCH ${q}]:`;
                  if (sr.answer) block += ` ANSWER: ${sr.answer}`;
                  for (const s of (sr.sources || [])) { block += `\n  - ${s.title} (${s.url}): ${s.snippet}`; }
                  results += block;
                } else { results += `\n[SEARCH ${q}]: ERROR ${sr.error}`; }
              } catch (e) { results += `\n[SEARCH]: ERROR ${e.message}`; }
            }
            convo.push({ role: "assistant", content: text });
            convo.push({ role: "user", content: `RESULTS:${results}\nNow write your final answer for the user based on this real data.` });
            continue;
          }
          raw = text.replace(/\[\[(READ|RUN|FETCH|SEARCH|GETKV|SETKV|DELKV|DOMAIN_LAUNCH|DOMAIN_DIAGNOSE|DOMAIN_STATUS|FETCH_PLACES|DEPLOY_HIGHGUIDE|MERCURY_BALANCE|STRIPE_BALANCE)\b[\s\S]*?\]\]/g, "").trim() || text;
          modelUsed = "openai";
        }
      }
    } catch (e) { raw = null; }
  }

  // 3. Fallback: xAI Grok
  if (!raw) {
    try {
      const grokKey = env.GROK_API_KEY || await KV.get(env, "secret:grok_api_key");
      if (grokKey) {
        const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + grokKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "grok-3-mini",
            max_tokens: isVoice ? 150 : 1024,
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: message }
            ]
          })
        });
        const grokData = await grokRes.json();
        raw = grokData?.choices?.[0]?.message?.content || null;
        if (raw) modelUsed = "grok";
      }
    } catch (e) {
      raw = null;
    }
  }

  // Track which model responded (for observability)
  if (modelUsed && modelUsed !== "anthropic") {
    await KV.put(env, "monitor:last_model_fallback", JSON.stringify({
      model: modelUsed, ts: new Date().toISOString()
    })).catch(() => {});
  }
  // Definitive per-turn outcome — always written, captures the WHOLE routing result
  if (!isVoice) {
    await KV.put(env, "monitor:last_turn", JSON.stringify({
      ts: new Date().toISOString(),
      answered_by: modelUsed || "none",
      fable_stop_reason: lastStop,
      fable_error: agentErr,
      reply_preview: (raw || "").slice(0, 300)
    })).catch(() => {});
    // LEARNING JOURNAL — every interaction is captured experience (Aaron's mandate 2026-06-12).
    // One daily key accumulates compact turn records; Aura consolidates them into notes:lessons:* on demand.
    try {
      const jDay = new Date().toISOString().slice(0, 10);
      const jKey = `learning:journal:${jDay}`;
      let jArr = [];
      try { jArr = JSON.parse(await env.AURA_KV.get(jKey) || "[]"); } catch { jArr = []; }
      if (!Array.isArray(jArr)) jArr = [];
      jArr.push({ ts: new Date().toISOString(), q: String(message || "").slice(0, 300), a: (raw || "").slice(0, 300), by: modelUsed || "none", err: agentErr || null });
      if (jArr.length > 300) jArr = jArr.slice(-300);
      await env.AURA_KV.put(jKey, JSON.stringify(jArr)).catch(() => {});
    } catch {}
  }

  raw = raw || "Aura is temporarily unavailable. All AI providers failed to respond.";
  if (modelUsed && modelUsed !== "anthropic" && !isVoice) {
    // The executor doesn't care which brain wrote the tag. One execution pass, operator-gated.
    let fbResults = "";
    try {
      const fbReads = [...raw.matchAll(/\[\[(?:READ|GETKV)\s+([^\]\s]+)\]\]/g)].map(m => m[1]).slice(0, 3);
      const fbRuns = [
        ...[...raw.matchAll(/\[\[RUN\s+([\s\S]*?)\]\]/g)].map(m => m[1].trim()),
        ...[...raw.matchAll(/\[\[((?:SETKV|DELKV|DOMAIN_LAUNCH|DOMAIN_STATUS|FETCH_PLACES|DEPLOY_HIGHGUIDE|MERCURY_BALANCE|STRIPE_BALANCE)\s[\s\S]*?)\]\]/g)].map(m => m[1].trim())
      ].slice(0, 3);
      const PROTECTED2 = ["auras.guide", "console.auras.guide", "arksystems.world"];
      for (const cmdLine of fbRuns) {
        if (/^DOMAIN_LAUNCH/i.test(cmdLine) && PROTECTED2.some(d => cmdLine.toLowerCase().includes(d))) { fbResults += `\nBLOCKED (protected): ${cmdLine.slice(0, 80)}`; continue; }
        if (!isOp) { fbResults += `\nDENIED (operator required): ${cmdLine.slice(0, 80)}`; continue; }
        try {
          let r = await processCommand(cmdLine, env, true);
          let s = r instanceof Response ? await r.text() : JSON.stringify(r);
          fbResults += `\nExecuted ${cmdLine.split(/\s+/)[0]}: ${String(s).slice(0, 300)}`;
        } catch (e) { fbResults += `\nERROR ${cmdLine.slice(0, 60)}: ${e.message}`; }
      }
      for (const k of fbReads) {
        if (k.startsWith("secret:") && !isOp) { fbResults += `\nBLOCKED (secret): ${k}`; continue; }
        const v = await env.AURA_KV.get(k).catch(() => null);
        fbResults += `\nRead ${k}: ${v === null ? "(not found)" : String(v).slice(0, 500)}`;
      }
    } catch {}
    if (fbResults) {
      raw = raw.replace(/\[\[(READ|RUN|FETCH|GETKV|SETKV|DELKV|DOMAIN_LAUNCH|DOMAIN_STATUS|FETCH_PLACES|DEPLOY_HIGHGUIDE|MERCURY_BALANCE|STRIPE_BALANCE)\b[\s\S]*?\]\]/g, "").trim();
      raw = raw + "\n\nExecution results:" + fbResults;
    }
    raw = raw + "\n\n[fallback brain: " + modelUsed + " — actions executed by core]";
  }
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
  try {
    const cmdLines = raw.split("\n");
    const cmdPattern = /^(SETKV|GETKV|DELKV|DOMAIN_LAUNCH|DOMAIN_DIAGNOSE|RELAUNCH_ALL|EVENT_STORM|EVENT_STORM_REAL|READ_STORM|ENDURANCE|INTEGRITY_SCAN|DO_TEST|DO_STORM|DO_VERIFY|COLD_SURGE|SURGE_PROBE|FANOUT_STORM|HOT_ENTITY|HOT_SHARDED|GENERATE_IMAGE|SHOW_IT|RESOURCE_STATUS|CLOUDFLARE_STATUS|WORLD_MAP|LOADGEN|LOADTEST_APPEND|PLANT_INCONSISTENCY|LOOP_PROBE|STORM_CLEANUP|DEPLOY_CONSOLE|MERCURY_BALANCE|STRIPE_BALANCE|DOMAIN_STATUS|FETCH_PLACES|DEPLOY_HIGHGUIDE|PING)(\s+.*)?$/;
    const results = [];
    for (const ln of cmdLines) {
      const trimmed = ln.trim();
      if (cmdPattern.test(trimmed)) {
        const result = await processCommand(trimmed, env, true);
        if (result) results.push(result);
      }
    }
    if (results.length > 0) {
      const summary = results.map(r => {
        if (!r || !r.cmd) return null;
        if (r.cmd === "SETKV") return r.payload?.ok ? "\u2705 Saved: " + (r.payload.key || "") : "\u274C Save failed";
        if (r.cmd === "GETKV") return null;
        if (r.cmd === "DOMAIN_LAUNCH") return r.payload?.ok ? "\U0001F310 Launched: " + r.payload.domain : "\u274C Launch failed";
        if (r.cmd === "MERCURY_BALANCE") return r.payload?.ok ? "\U0001F4B0 Mercury: $" + (r.payload.total_available || 0).toFixed(2) : null;
        return null;
      }).filter(Boolean).join("\n");
      if (summary) {
        raw = raw.replace(/^(SETKV|GETKV|DELKV|DOMAIN_LAUNCH|DEPLOY_CONSOLE|MERCURY_BALANCE|STRIPE_BALANCE|DOMAIN_STATUS).*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
        raw = raw + "\n\n" + summary;
      }
    }
  } catch(e) {}
  return raw;
}

async function servePage(hostname, pathname, env) {
  const pageId = "page:" + hostname + pathname;
  // SINGLE SOURCE OF TRUTH: modern KV only. The legacy patch_index: lookup was removed (v4.9.48)
  // after confirming every relevant page (makeacall.world, securespend.world) lives in modern KV.
  // Reading legacy was the root cause of the "ghost" cycle - a page could be silently shadowed by
  // an old monolith-era copy. With modern-only, what you write is what serves. No ghosts, ever.
  const modern = await KV.get(env, pageId);
  if (modern) return new Response(modern, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  return null;
}


// ─── Self-monitoring cron ─────────────────────────────────────────────────────
// Runs every minute. Checks all worker health endpoints.
// If a worker fails health check 3 times in a row, auto-rollbacks it.

async function checkWorkerHealth(binding, name) {
  try {
    const res = await binding.fetch(new Request("https://internal/health"));
    const data = await res.json();
    return data?.ok === true;
  } catch (e) {
    return false;
  }
}

async function runHealthChecks(env) {
  const results = [];
  const opToken = await env.AURA_KV.get("secret:aura_operator_token").catch(() => null)
    || await env.AURA_KV.get("secret:operator_token").catch(() => null) || "";

  const workers = [
    { name: "aura-core-v2", binding: env.AURA_OPS ? "self" : null },
    { name: "aura-ops", binding: env.AURA_OPS },
    { name: "aura-host", binding: env.AURA_HOST },
    { name: "aura-comms", binding: env.AURA_COMMS }
  ];

  for (const worker of workers) {
    // Self-check for aura-core: just mark ok since we are running
    if (worker.name === "aura-core-v2") {
      await env.AURA_KV.put("monitor:aura-core-v2:failures", "0");
      await env.AURA_KV.put("monitor:aura-core-v2:last_ok", new Date().toISOString());
      results.push({ worker: worker.name, status: "ok" });
      continue;
    }

    if (!worker.binding) {
      results.push({ worker: worker.name, status: "no_binding" });
      continue;
    }

    const healthy = await checkWorkerHealth(worker.binding, worker.name);

    if (healthy) {
      await env.AURA_KV.put(`monitor:${worker.name}:failures`, "0");
      await env.AURA_KV.put(`monitor:${worker.name}:last_ok`, new Date().toISOString());
      results.push({ worker: worker.name, status: "ok" });
    } else {
      const failStr = await env.AURA_KV.get(`monitor:${worker.name}:failures`).catch(() => "0");
      const failures = parseInt(failStr || "0") + 1;
      await env.AURA_KV.put(`monitor:${worker.name}:failures`, String(failures));
      results.push({ worker: worker.name, status: "fail", failures });

      // Auto-rollback after 3 consecutive failures
      if (failures >= 3 && env.AURA_OPS) {
        try {
          await env.AURA_OPS.fetch(new Request("https://aura-ops.aaronkaracas.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "text/plain", "authorization": "Bearer " + opToken },
            body: "ROLLBACK_WORKER " + worker.name
          }));
          await env.AURA_KV.put(`monitor:${worker.name}:failures`, "0");
          await env.AURA_KV.put(`monitor:${worker.name}:last_rollback`, new Date().toISOString());
          results.push({ worker: worker.name, status: "rolled_back" });
        } catch (re) {
          results.push({ worker: worker.name, status: "rollback_failed", error: String(re) });
        }
      }
    }
  }

  await env.AURA_KV.put("monitor:last_run", JSON.stringify({
    ts: new Date().toISOString(),
    results
  }));

  return results;
}


async function getSystemStatus(env) {
  const now = new Date().toISOString();

  // Worker versions
  const workers = ["aura-core-v2", "aura-ops", "aura-host", "aura-comms"];
  const snapshots = {};
  const versions = {};
  const failures = {};
  const lastOk = {};
  const lastRollback = {};

  for (const w of workers) {
    snapshots[w] = await env.AURA_KV.get(`snapshot:${w}:last_good_ts`).catch(() => null);
    versions[w] = await env.AURA_KV.get(`version:${w}:last_good`).catch(() => null);
    failures[w] = await env.AURA_KV.get(`monitor:${w}:failures`).catch(() => null);
    lastOk[w] = await env.AURA_KV.get(`monitor:${w}:last_ok`).catch(() => null);
    lastRollback[w] = await env.AURA_KV.get(`monitor:${w}:last_rollback`).catch(() => null);
  }

  // Monitor last run
  const monitorRaw = await env.AURA_KV.get("monitor:last_run").catch(() => null);
  const monitor = monitorRaw ? JSON.parse(monitorRaw) : null;

  // Patch queue status
  const patchStatusRaw = await env.AURA_KV.get("patch_queue:status").catch(() => null);
  const patchStatus = patchStatusRaw ? JSON.parse(patchStatusRaw) : { status: "idle" };

  // Pending patch
  const pendingPatch = await env.AURA_KV.get("pending_patch:worker").catch(() => null);

  // Build worker health summary
  const workerStatus = workers.map(w => ({
    worker: w,
    failures: parseInt(failures[w] || "0"),
    last_ok: lastOk[w],
    last_rollback: lastRollback[w] || null,
    snapshot_ts: snapshots[w],
    version_id: versions[w] ? versions[w].slice(0, 8) + "..." : null
  }));

  return {
    ok: true,
    build: BUILD,
    ts: now,
    system: "Aura OS",
    workers: workerStatus,
    monitor: monitor ? {
      last_run: monitor.ts,
      source: monitor.source || "aura-core",
      all_healthy: monitor.results?.every(r => r.status === "ok") || false,
      results: monitor.results
    } : null,
    patch_queue: patchStatus,
    pending_approval: pendingPatch ? { worker: pendingPatch, waiting: true } : null,
    autonomy: {
      cf_deploy_ready: !!(env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null)),
      rollback_ready: workerStatus.some(w => w.snapshot_ts !== null)
    }
  };
}


// ─── Self-Tail: Aura reads her own CF logs ───────────────────────────────────
async function getSelfLogs(env, options = {}) {
  const cfToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
  const cfAccount = await env.AURA_KV.get("secret:cf_account_id").catch(() => null) || "3db0de2c6fce92757e2c4e4f83d7eb16";
  if (!cfToken) return { ok: false, error: "No CF token available" };

  const workers = options.worker ? [options.worker] : ["aura-core-v2", "aura-ops", "aura-host", "aura-comms"];
  const limit = options.limit || 20;
  const results = {};

  for (const workerName of workers) {
    try {
      // Use CF Workers Tail API to get recent log entries
      // First create a tail session
      const tailRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/workers/scripts/${workerName}/tails`,
        {
          method: "POST",
          headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
          body: JSON.stringify({})
        }
      );
      const tailData = await tailRes.json();

      if (tailData.success) {
        const tailId = tailData.result?.id;
        // Get recent events from the tail
        const eventsRes = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/workers/scripts/${workerName}/tails/${tailId}`,
          { headers: { "Authorization": "Bearer " + cfToken } }
        );
        const eventsData = await eventsRes.json();

        // Clean up tail session
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/workers/scripts/${workerName}/tails/${tailId}`,
          { method: "DELETE", headers: { "Authorization": "Bearer " + cfToken } }
        ).catch(() => {});

        results[workerName] = {
          ok: true,
          tail_id: tailId,
          events: eventsData.result || []
        };
      } else {
        // Fallback: read from KV error log if tail API unavailable
        const errLog = await env.AURA_KV.get(`log:${workerName}:errors`).catch(() => null);
        results[workerName] = {
          ok: false,
          error: tailData.errors?.[0]?.message || "Tail API unavailable",
          kv_errors: errLog ? JSON.parse(errLog) : []
        };
      }
    } catch (e) {
      results[workerName] = { ok: false, error: String(e) };
    }
  }

  // Also pull monitor last run for context
  const monitorRaw = await env.AURA_KV.get("monitor:last_run").catch(() => null);
  const monitor = monitorRaw ? JSON.parse(monitorRaw) : null;

  // Pull recent errors from KV error store
  const recentErrors = [];
  for (const w of workers) {
    const failures = await env.AURA_KV.get(`monitor:${w}:failures`).catch(() => null);
    const lastRollback = await env.AURA_KV.get(`monitor:${w}:last_rollback`).catch(() => null);
    if (parseInt(failures || "0") > 0 || lastRollback) {
      recentErrors.push({ worker: w, failures: parseInt(failures || "0"), last_rollback: lastRollback });
    }
  }

  return {
    ok: true,
    ts: new Date().toISOString(),
    build: BUILD,
    tail_results: results,
    monitor_summary: monitor,
    recent_errors: recentErrors,
    note: "Tail sessions created and deleted. Events may be sparse — CF tail captures live traffic only."
  };
}

// Log errors to KV for self-diagnosis (called from error handlers)
async function logError(env, worker, error, context = {}) {
  try {
    const key = `log:${worker}:errors`;
    const existing = await env.AURA_KV.get(key).catch(() => null);
    const log = existing ? JSON.parse(existing) : [];
    log.unshift({ ts: new Date().toISOString(), error: String(error), context });
    if (log.length > 50) log.splice(50);
    await env.AURA_KV.put(key, JSON.stringify(log));
  } catch {}
}


// ─── Multi-Model Consensus Engine ────────────────────────────────────────────
// Fans out a question to all available AI models simultaneously,
// collects responses, detects agreement/disagreement, and synthesizes output.

async function multiModelConsensus(question, env) {
  const anthropicKey = env.ANTHROPIC_API_KEY || await env.AURA_KV.get("secret:anthropic").catch(() => null);
  const openaiKey = env.OPENAI_API_KEY || await env.AURA_KV.get("secret:openai").catch(() => null);
  const grokKey = env.GROK_API_KEY || await env.AURA_KV.get("secret:grok_api_key").catch(() => null);

  const sysPrompt = `You are an expert analyst. Answer the following question concisely and directly. Be specific. Do not hedge unnecessarily.`;

  // Fan out to all models simultaneously
  const [anthropicResult, openaiResult, grokResult] = await Promise.allSettled([
    // Anthropic Claude
    (async () => {
      if (!anthropicKey) return { model: "claude", ok: false, error: "No key" };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 500, system: sysPrompt, messages: [{ role: "user", content: question }] })
      });
      const data = await res.json();
      const text = data?.content?.[0]?.text || null;
      return { model: "claude-sonnet-4-5", ok: !!text, response: text, provider: "anthropic" };
    })(),

    // OpenAI GPT
    (async () => {
      let key = openaiKey;
      if (key && key.startsWith("{")) { try { key = JSON.parse(key).api_key; } catch {} }
      if (!key) return { model: "gpt-4o", ok: false, error: "No key" };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o", max_tokens: 500, messages: [{ role: "system", content: sysPrompt }, { role: "user", content: question }] })
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || null;
      return { model: "gpt-4o", ok: !!text, response: text, provider: "openai" };
    })(),

    // xAI Grok
    (async () => {
      if (!grokKey) return { model: "grok-3", ok: false, error: "No key" };
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + grokKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "grok-3-mini", max_tokens: 500, messages: [{ role: "system", content: sysPrompt }, { role: "user", content: question }] })
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || null;
      return { model: "grok-3", ok: !!text, response: text, provider: "xai" };
    })()
  ]);

  // Collect results
  const results = [anthropicResult, openaiResult, grokResult]
    .map(r => r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message || "Failed" });

  const successful = results.filter(r => r.ok && r.response);
  const failed = results.filter(r => !r.ok);

  if (successful.length === 0) {
    return { ok: false, error: "All models failed to respond", results };
  }

  // Now ask Claude to synthesize the responses
  let synthesis = null;
  if (anthropicKey && successful.length > 1) {
    try {
      const synthPrompt = `You received these responses from multiple AI models to the question: "${question}"\n\n` +
        successful.map(r => `${r.model}: ${r.response}`).join("\n\n") +
        `\n\nSynthesize these into one response:\n1. Note where models AGREE (high confidence)\n2. Note where models DISAGREE (flag for human review)\n3. Give a FINAL RECOMMENDATION based on consensus\n4. Rate overall confidence: HIGH / MEDIUM / LOW\n\nBe concise and direct.`;

      const synthRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 800, messages: [{ role: "user", content: synthPrompt }] })
      });
      const synthData = await synthRes.json();
      synthesis = synthData?.content?.[0]?.text || null;
    } catch {}
  }

  return {
    ok: true,
    question,
    models_queried: results.length,
    models_responded: successful.length,
    models_failed: failed.length,
    individual_responses: successful.map(r => ({ model: r.model, provider: r.provider, response: r.response })),
    synthesis: synthesis || (successful.length === 1 ? successful[0].response : "Synthesis unavailable — only one model responded."),
    ts: new Date().toISOString()
  };
}


// ─── Session Token Security ───────────────────────────────────────────────────
// Cryptographically signed session tokens prevent session impersonation.
// Format: userId.timestamp.HMAC-SHA256(userId|timestamp, SESSION_SECRET)
// Operator sessions (Bearer token auth) bypass session token checks.

async function signSessionToken(userId, env) {
  const secret = env.SESSION_SECRET || await env.AURA_KV.get("secret:session_secret").catch(() => null);
  if (!secret) return `entity:${userId}`; // fallback if no secret configured
  const timestamp = Date.now().toString();
  const message = `${userId}|${timestamp}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${userId}.${timestamp}.${sigHex}`;
}

async function verifySessionToken(token, env) {
  if (!token || token === "default") return { valid: false, userId: null };

  // Legacy entity: format — still accepted but flagged as unverified
  if (token.startsWith("entity:") && !token.includes(".")) {
    return { valid: true, userId: token.slice(7), legacy: true };
  }

  // Phone/SMS/voice sessions — always valid
  if (token.startsWith("CA") || token.startsWith("sms_") || token.startsWith("phone_")) {
    return { valid: true, userId: token, legacy: false };
  }

  // Signed token verification
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, userId: null };

  const [userId, timestamp, providedSig] = parts;
  const secret = env.SESSION_SECRET || await env.AURA_KV.get("secret:session_secret").catch(() => null);
  if (!secret) return { valid: true, userId, legacy: true }; // no secret = legacy mode

  // Check expiry (24 hours)
  const age = Date.now() - parseInt(timestamp);
  if (age > 86400000) return { valid: false, userId: null, error: "Token expired" };

  // Verify HMAC
  const message = `${userId}|${timestamp}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
  );
  const sigBytes = new Uint8Array(providedSig.match(/.{2}/g).map(b => parseInt(b, 16)));
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(message));
  return { valid, userId: valid ? userId : null, legacy: false };
}

async function createSessionToken(userId, env) {
  return signSessionToken(userId, env);
}


// ─── Rate Limiting ────────────────────────────────────────────────────────────
// KV-based sliding window rate limiter. 30 requests/minute per IP.
// Operators (valid bearer token) are exempt from rate limiting.
// Uses CF-Connecting-IP header for IP detection.

async function checkRateLimit(request, env, isOp) {
  if (isOp) return { allowed: true }; // operators never rate limited

  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";

  if (ip === "unknown") return { allowed: true }; // skip if no IP

  const now = Date.now();
  const windowStart = now - 60000; // 60 second window
  const key = `ratelimit:${ip}`;

  try {
    const raw = await env.AURA_KV.get(key);
    let timestamps = raw ? JSON.parse(raw) : [];

    // Keep only timestamps within the last 60 seconds
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= 30) {
      const resetIn = Math.ceil((timestamps[0] + 60000 - now) / 1000);
      return { allowed: false, ip, count: timestamps.length, reset_in_seconds: resetIn };
    }

    // Add current timestamp and save
    timestamps.push(now);
    await env.AURA_KV.put(key, JSON.stringify(timestamps), { expirationTtl: 120 });
    return { allowed: true, ip, count: timestamps.length };
  } catch {
    return { allowed: true }; // fail open — never block on KV error
  }
}


// ─── Mercury Banking Integration ─────────────────────────────────────────────
// Aura's treasury intelligence layer. Read-only by default.

async function getMercuryAccounts(env) {
  const key = env.MERCURY_API_KEY || await env.AURA_KV.get("secret:mercury_api_key").catch(() => null);
  if (!key) return { ok: false, error: "Mercury API key not configured" };
  const res = await fetch("https://api.mercury.com/api/v1/accounts", {
    headers: { "Authorization": "Bearer " + key }
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data?.errors?.message || "Mercury API error" };
  return { ok: true, accounts: data.accounts || [] };
}

async function getMercuryTransactions(env, accountId, limit = 10) {
  const key = env.MERCURY_API_KEY || await env.AURA_KV.get("secret:mercury_api_key").catch(() => null);
  if (!key) return { ok: false, error: "Mercury API key not configured" };
  const id = accountId || await env.AURA_KV.get("config:mercury:checking_id").catch(() => null);
  if (!id) return { ok: false, error: "No Mercury account ID configured" };
  const res = await fetch(`https://api.mercury.com/api/v1/account/${id}/transactions?limit=${limit}`, {
    headers: { "Authorization": "Bearer " + key }
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data?.errors?.message || "Mercury API error" };
  return { ok: true, transactions: data.transactions || [], total: data.total };
}

async function getMercuryBalance(env) {
  const result = await getMercuryAccounts(env);
  if (!result.ok) return result;
  const accounts = result.accounts.map(a => ({
    name: a.name,
    kind: a.kind,
    available: a.availableBalance,
    current: a.currentBalance,
    status: a.status,
    id: a.id
  }));
  const totalAvailable = accounts.reduce((sum, a) => sum + (a.available || 0), 0);
  return { ok: true, accounts, total_available: totalAvailable, ts: new Date().toISOString() };
}


// ─── Stripe + OrapPay Integration ────────────────────────────────────────────
async function getStripeKey(env) {
  return env.STRIPE_SECRET_KEY || await env.AURA_KV.get("secret:stripe").catch(() => null);
}

async function stripeRequest(path, method, body, env) {
  const key = await getStripeKey(env);
  if (!key) return { ok: false, error: "Stripe key not configured" };
  const opts = {
    method: method || "GET",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" }
  };
  if (body) opts.body = new URLSearchParams(body).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, opts);
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data?.error?.message || "Stripe error", code: data?.error?.code };
  return { ok: true, data };
}

async function createPaymentIntent(amount, currency, description, metadata, env) {
  const result = await stripeRequest("/payment_intents", "POST", {
    amount: String(Math.round(amount * 100)),
    currency: currency || "usd",
    description: description || "Aura Pay",
    "payment_method_types[]": "card",
    "metadata[source]": "aura_pay",
    "metadata[product]": metadata?.product || "",
    "metadata[entity]": metadata?.entity || ""
  }, env);
  if (!result.ok) return result;
  return { ok: true, payment_intent_id: result.data.id, client_secret: result.data.client_secret, amount: result.data.amount, currency: result.data.currency, status: result.data.status };
}

async function getStripeBalance(env) {
  const result = await stripeRequest("/balance", "GET", null, env);
  if (!result.ok) return result;
  const available = result.data.available?.map(b => ({ currency: b.currency, amount: b.amount / 100 }));
  const pending = result.data.pending?.map(b => ({ currency: b.currency, amount: b.amount / 100 }));
  return { ok: true, available, pending };
}

async function getStripePayments(limit, env) {
  const result = await stripeRequest(`/payment_intents?limit=${limit || 10}`, "GET", null, env);
  if (!result.ok) return result;
  return { ok: true, payments: result.data.data?.map(p => ({ id: p.id, amount: p.amount / 100, currency: p.currency, status: p.status, description: p.description, created: new Date(p.created * 1000).toISOString() })) };
}

async function createStripeCheckout(amount, currency, product, successUrl, cancelUrl, env) {
  const result = await stripeRequest("/checkout/sessions", "POST", {
    "payment_method_types[]": "card",
    "line_items[0][price_data][currency]": currency || "usd",
    "line_items[0][price_data][product_data][name]": product || "Aura Pay",
    "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: successUrl || "https://auras.guide/payment/success",
    cancel_url: cancelUrl || "https://auras.guide/payment/cancel"
  }, env);
  if (!result.ok) return result;
  return { ok: true, session_id: result.data.id, checkout_url: result.data.url, amount, currency: currency || "usd" };
}


// ─── Domain Auto-Launch ───────────────────────────────────────────────────────



// ─── Console Template ─────────────────────────────────────────────────────────



// ─── Domain & Page Deployment (LLM-driven, zero HTML in worker) ──────────────
// All pages are generated by the LLM and stored in KV.
// aura-host serves them. No HTML ever lives in this file.

async function llmGeneratePage(prompt, env) {
  const apiKey = env.ANTHROPIC_API_KEY || await env.AURA_KV.get("secret:anthropic").catch(() => null);
  if (!apiKey) return null;
  const lgpModel = (await env.AURA_KV.get("config:brain:model").catch(() => null)) || "claude-sonnet-4-5";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: lgpModel,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  return data?.content?.[0]?.text || null;
}

async function deployPageToKV(domain, path, html, env) {
  const key = `page:${domain}${path || "/"}`;
  await env.AURA_KV.put(key, html);
  return { ok: true, url: `https://${domain}${path || "/"}`, size: html.length };
}

async function launchDomain(domain, description, theme, env) {
  const cfToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
  const results = { domain, steps: [] };

  // Step 1: Find CF zone
  let zoneId = null;
  try {
    const zRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
      headers: { "Authorization": "Bearer " + cfToken }
    });
    zoneId = (await zRes.json())?.result?.[0]?.id;
    results.steps.push({ step: "find_zone", ok: !!zoneId });
  } catch (e) { return { ok: false, ...results, error: String(e) }; }
  if (!zoneId) return { ok: false, ...results, error: "Zone not found in Cloudflare" };

  // Step 2: Update routes to aura-host
  let routeUpdates = 0;
  try {
    const rRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes`, {
      headers: { "Authorization": "Bearer " + cfToken }
    });
    const routes = (await rRes.json())?.result || [];
    const routeErrors = [];
    for (const route of routes) {
      // Repoint EVERY route in this zone to aura-host — apex, www, and any leftover pointing at aura-core/monolith
      if (route.script !== "aura-host") {
        try {
          const pr = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes/${route.id}`, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
            body: JSON.stringify({ pattern: route.pattern, script: "aura-host" })
          });
          const pj = await pr.json();
          if (pj?.success) routeUpdates++;
          else routeErrors.push(`PUT ${route.pattern}: ${JSON.stringify(pj?.errors || pj).slice(0, 150)}`);
        } catch (e) { routeErrors.push(`PUT ${route.pattern}: ${e.message}`); }
      }
    }
    if (routes.length === 0) {
      try {
        const pr = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/workers/routes`, {
          method: "POST",
          headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
          body: JSON.stringify({ pattern: domain + "/*", script: "aura-host" })
        });
        const pj = await pr.json();
        if (pj?.success) routeUpdates++;
        else routeErrors.push(`POST: ${JSON.stringify(pj?.errors || pj).slice(0, 150)}`);
      } catch (e) { routeErrors.push(`POST: ${e.message}`); }
    }
    results.steps.push({ step: "update_routes", ok: routeErrors.length === 0, updated: routeUpdates, errors: routeErrors });
  } catch (e) {
    results.steps.push({ step: "update_routes", ok: false, updated: routeUpdates, errors: [String(e)] });
  }

  // Step 2b: ensure a proxied DNS record exists — without this, routes resolve to nothing (530)
  try {
    const dnsRes = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { headers: { "Authorization": "Bearer " + cfToken } })).json();
    const recs = dnsRes?.result || [];
    const hasApex = recs.some(r => r.name === domain && (r.type === "A" || r.type === "AAAA" || r.type === "CNAME"));
    let dnsAction = "exists";
    if (!hasApex) {
      // A proxied A record to a dummy IP is enough; the Worker route intercepts before origin is hit
      const cr = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "A", name: domain, content: "192.0.2.1", proxied: true, ttl: 1 })
      })).json();
      dnsAction = cr?.success ? "created_proxied_A" : ("failed: " + JSON.stringify(cr?.errors || cr).slice(0, 120));
    }
    results.steps.push({ step: "ensure_dns", ok: dnsAction !== "exists" ? dnsAction.startsWith("created") : true, action: dnsAction });
  } catch (e) {
    results.steps.push({ step: "ensure_dns", ok: false, error: e.message });
  }

  // Step 3: LLM generates the page
  const domainName = domain.replace(/\.world$|\.us$|\.com$|\.guide$|\.network$|\.systems$/, "")
    .split(/[-.]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  
  const pagePrompt = `Generate a complete, professional landing page for: ${domainName}
Domain: ${domain}
Description: ${description || domainName + " — Powered by Aura OS"}
Theme: ${theme || "dark blue"}

Rules:
- Output ONLY raw HTML. No markdown. No explanation. No code fences.
- Start with <!DOCTYPE html> and end with </html>
- All CSS inline in <style> tag. No external dependencies.
- Dark theme: background #030712, text #f1f5f9
- Modern, clean, professional design
- Include: nav with logo, hero section with headline and description, brief features section, footer
- No links to external sites except auras.guide for "Powered by Aura"
- Mobile responsive`;

  const html = await llmGeneratePage(pagePrompt, env);
  if (!html) {
    results.steps.push({ step: "generate_page", ok: false, error: "LLM generation failed" });
    return { ok: false, ...results };
  }
  
  await env.AURA_KV.put(`page:${domain}/`, html);
  results.steps.push({ step: "deploy_page", ok: true, size: html.length });

  // Purge monolith ghost: legacy patch_index:<base64("page:domain/")> entries shadow new pages in aura-host
  try {
    const legacyKey = "patch_index:" + btoa(`page:${domain}/`);
    const ghost = await env.AURA_KV.get(legacyKey);
    if (ghost !== null) {
      await env.AURA_KV.delete(legacyKey);
      results.steps.push({ step: "purge_legacy_ghost", ok: true, purged: legacyKey });
    }
  } catch (e) {
    results.steps.push({ step: "purge_legacy_ghost", ok: false, error: e.message });
  }

  // Step 4: Track launched domains
  try {
    const existing = await env.AURA_KV.get("config:domains:launched").catch(() => null);
    const launched = existing ? JSON.parse(existing) : [];
    if (!launched.includes(domain)) launched.push(domain);
    await env.AURA_KV.put("config:domains:launched", JSON.stringify(launched));
  } catch (e) {}

  // Step 5 — Aura's gauntlet lesson, encoded: a launch is not done until a live fetch confirms it.
  try {
    const live = await fetch(`https://${domain}`, { headers: { "cache-control": "no-cache" } });
    const liveText = await live.text();
    const servedMatches = Math.abs(liveText.length - html.length) < 300;
    results.steps.push({ step: "verify_live", ok: live.ok && servedMatches, status: live.status, served_chars: liveText.length, written_chars: html.length });
    if (!servedMatches) {
      results.warning = `Page written to KV (${html.length} chars) but live serves ${liveText.length} chars — routing likely still points to the old worker. Check route errors above.`;
    }
  } catch (e) {
    results.steps.push({ step: "verify_live", ok: false, error: e.message });
  }

  return { ok: true, ...results, url: `https://${domain}` };
}

async function deployConsole(env) {
  const existing = await env.AURA_KV.get("page:console.auras.guide/");
  if (!existing) return { ok: false, error: "Console not found in KV" };
  return {
    ok: true, url: "https://console.auras.guide", size: existing.length,
    verified: {
      chat: existing.includes("sendMsg"),
      tasks: existing.includes("loadTasks"),
      domains: existing.includes("loadDomains")
    }
  };
}


// A2P campaign watcher — ends the submit-and-lose-track circle.
// Checks campaign status each cron tick; on ANY change writes a loud flag to notes:alert:a2p.
async function watchA2P(env) {
  try {
    const res = await env.AURA_COMMS.fetch(new Request("https://aura-comms/chat", {
      method: "POST",
      headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
      body: "A2P_STATUS"
    }));
    const data = await res.json();
    const camp = data?.reply?.campaigns?.[0];
    if (!camp) return;
    const status = camp.campaign_status || "UNKNOWN";
    const prev = await env.AURA_KV.get("watch:a2p:last_status").catch(() => null);
    if (status !== prev) {
      const alert = {
        ts: new Date().toISOString(),
        changed_from: prev || "(none)",
        changed_to: status,
        errors: camp.errors || [],
        note: status === "APPROVED" ? "CAMPAIGN APPROVED — SMS should now deliver. Send a test text to confirm."
            : status === "FAILED" ? "CAMPAIGN FAILED AGAIN — read errors, fix description, A2P_RESUBMIT."
            : `Campaign status changed to ${status}.`
      };
      await env.AURA_KV.put("notes:alert:a2p", JSON.stringify(alert)).catch(() => {});
      await env.AURA_KV.put("watch:a2p:last_status", status).catch(() => {});
      // Also log a timeline event so it surfaces in history
      try {
        const _owner = (await env.AURA_KV.get("config:owner:identity").catch(() => null)) || "system";
        await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind("a2p_watch", Date.now(), "a2p_status_change", JSON.stringify(alert), _owner, "system", `A2P campaign: ${prev || "none"} -> ${status}`).run();
      } catch {}
    }
  } catch {}
}

// Shared image-generation core — used by GENERATE_IMAGE command and public /showit + /pitch endpoints.
async function auraGenerateImage(prompt, env, opts = {}) {
  let openaiKey = env.OPENAI_API_KEY || await env.AURA_KV.get("secret:openai").catch(() => null);
  if (openaiKey && openaiKey.startsWith("{")) { try { openaiKey = JSON.parse(openaiKey).api_key; } catch {} }
  if (!openaiKey) return { ok: false, error: "No OpenAI key" };
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": "Bearer " + openaiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt: String(prompt).slice(0, 4000), n: 1, size: "1024x1024" })
    });
    const d = await r.json();
    if (!r.ok) return { ok: false, http: r.status, error: d?.error?.message || JSON.stringify(d).slice(0,300) };
    const item = d?.data?.[0] || {};
    const id = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    let b64 = item.b64_json || null;
    if (!b64 && item.url) { try { const ir = await fetch(item.url); const ab = await ir.arrayBuffer(); b64 = btoa(String.fromCharCode(...new Uint8Array(ab))); } catch {} }
    if (b64) {
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      if (env.AURA_IMAGES) { try { await env.AURA_IMAGES.put(`${id}.png`, bytes, { httpMetadata: { contentType: "image/png" } }); } catch {} }
      await env.AURA_KV.put(`image:${id}`, b64).catch(() => {});
    }
    const meta = { id, prompt: String(prompt).slice(0,1000), created: new Date().toISOString(), entity: opts.entity || null, source: opts.source || "showit", url: `https://auras.guide/image/${id}` };
    await env.AURA_KV.put(`imagemeta:${id}`, JSON.stringify(meta)).catch(() => {});
    try { await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)").bind("image_gen", Date.now(), "image_created", JSON.stringify(meta), meta.entity || "system", "image", String(prompt).slice(0,120)).run(); } catch {}
    return { ok: true, id, image_url: meta.url, prompt: meta.prompt };
  } catch (e) { return { ok: false, error: String(e.message) }; }
}

// Shared design delivery — generates the tattoo image, saves it to the shop's
// design queue, and emails the artist. Used by /aura-chat (gate-off path) and by
// /confirm-payment (gate-on path, after the customer pays). Single source of truth
// so both paths deliver identically.
// SHOW IT — Aura's universal visual verb. Everywhere she lives, when a moment is better shown
// than told, she reaches for this. Wraps her image engine so "show it" is ONE capability surfaced
// anywhere, not separate wirings. She decides WHEN to show; this is the hand she shows it WITH.
async function showIt(subject, env, opts = {}) {
  const want = (subject || "").trim();
  if (!want) return { ok: false, error: "nothing to show" };
  const prompt = opts.raw ? want : `${want}. High quality, visually striking, well-composed, detailed.`;
  const result = await auraGenerateImage(prompt, env, { source: opts.source || "show_it", entity: opts.entity || null, session: opts.session || null });
  if (!result || !result.ok) return { ok: false, error: result ? result.error : "generation failed" };
  return { ok: true, id: result.id, image_url: result.image_url || `https://auras.guide/image/${result.id}`, showed: want };
}

async function auraDeliverDesign(env, { sessionId, prompt, concept, shop, artist, context }) {
  const imgResult = await auraGenerateImage(prompt, env, { source: "aura-deliver", session: sessionId });
  if (!imgResult || !imgResult.ok) return { ok: false, error: imgResult ? imgResult.error : "generation failed" };
  const image = { id: imgResult.id, url: `https://auras.guide/image/${imgResult.id}` };
  // Only notify/queue for shop-attached designs (tattoo/branded contexts with a shop)
  if ((context === "tattoo" || context === "branded") && (shop || artist)) {
    const shopSlug = (shop || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const now = new Date().toISOString();
    const designKey = `designs:shop:${shopSlug}`;
    let designs = [];
    try { const raw = await env.AURA_KV.get(designKey); if (raw) designs = JSON.parse(raw); } catch {}
    designs.unshift({ id: imgResult.id, session_id: sessionId, artist: artist || "", description: concept || "", image_url: image.url, created_at: now, status: "ready", paid: true });
    if (designs.length > 100) designs = designs.slice(0, 100);
    await env.AURA_KV.put(designKey, JSON.stringify(designs)).catch(() => {});
    const shopConfig = await env.AURA_KV.get(`config:shop:${shopSlug}`).catch(() => null);
    if (shopConfig) {
      try {
        const sc = JSON.parse(shopConfig);
        const artistSlug = (artist || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const artistEmail = sc.artists && sc.artists[artistSlug] && sc.artists[artistSlug].email ? sc.artists[artistSlug].email : sc.email;
        if (artistEmail) {
          const cfToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
          if (cfToken) {
            await fetch("https://api.cloudflare.com/client/v4/accounts/3db0de2c6fce92757e2c4e4f83d7eb16/email/sending/send", {
              method: "POST",
              headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
              body: JSON.stringify({ to: artistEmail, from: "noreply@auras.guide", subject: `New tattoo design ready - ${shop}`, text: `A customer just prepared (and paid for) a tattoo design through your MyTattoo.world page.\n\nDesign concept: ${concept || ""}\n\nView the design: ${image.url}\n\nThe customer is ready for their consultation. Log into your dashboard to see details.\n\n— Aura` })
            }).catch(() => {});
          }
        }
      } catch {}
    }
  }
  return { ok: true, image };
}

// Resource watcher — warns BEFORE a provider balance/credit wall (the thing that hit twice on 2026-06-11).
// Runs every ~10 min (skips most cron ticks to save calls), writes notes:alert:resources on any concern.
async function watchResources(env) {
  try {
    const now = Date.now();
    const last = parseInt(await env.AURA_KV.get("watch:resources:last_run").catch(() => "0") || "0", 10);
    if (now - last < 10 * 60 * 1000) return; // throttle to ~10 min
    await env.AURA_KV.put("watch:resources:last_run", String(now)).catch(() => {});

    // Call our own RESOURCE_STATUS by reusing the providers logic via the operator path is heavy;
    // instead read the last snapshot the operator/command wrote, plus do the cheap balance reads directly.
    const concerns = [];
    // Mercury
    try { const m = await getMercuryBalance(env); if (m.ok && typeof m.total_available === "number" && m.total_available < 50) concerns.push({ provider: "mercury", level: m.total_available < 10 ? "critical" : "low", value: m.total_available }); } catch {}
    // Twilio
    try {
      const tr = await env.AURA_COMMS.fetch(new Request("https://aura-comms/chat", { method: "POST", headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" }, body: "TWILIO_BALANCE" }));
      const td = await tr.json(); const bal = parseFloat(td.balance);
      if (!isNaN(bal) && bal < 10) concerns.push({ provider: "twilio", level: bal < 3 ? "critical" : "low", value: bal });
    } catch {}
    // Anthropic (the brain) — a failed ping with credit-balance error is critical
    try {
      const ak = await KV.get(env, "secret:anthropic");
      if (ak) {
        const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": ak, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }) });
        if (!r.ok) { const e = await r.json().catch(()=>({})); const msg = e?.error?.message || ""; if (/credit balance/i.test(msg)) concerns.push({ provider: "anthropic", level: "critical", note: "brain credits low/empty" }); }
      }
    } catch {}
    // OpenAI key validity
    try {
      let k = env.OPENAI_API_KEY || await KV.get(env, "secret:openai"); if (k && k.startsWith("{")) { try { k = JSON.parse(k).api_key; } catch {} }
      if (k) { const r = await fetch("https://api.openai.com/v1/models", { headers: { "Authorization": "Bearer " + k } }); if (!r.ok && r.status === 429) concerns.push({ provider: "openai", level: "critical", note: "rate/billing limit" }); }
    } catch {}

    const prev = await env.AURA_KV.get("watch:resources:state").catch(() => null);
    const state = concerns.length ? JSON.stringify(concerns.map(c => c.provider + ":" + c.level)) : "all_ok";
    if (state !== prev) {
      await env.AURA_KV.put("watch:resources:state", state).catch(() => {});
      if (concerns.length) {
        const alert = { ts: new Date().toISOString(), concerns, note: "Provider balance/credit attention needed. " + concerns.map(c => `${c.provider}=${c.level}${c.value!==undefined?" ($"+c.value+")":""}`).join(", ") };
        await env.AURA_KV.put("notes:alert:resources", JSON.stringify(alert)).catch(() => {});
        try { await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)").bind("resource_watch", Date.now(), "resource_alert", JSON.stringify(alert), "system", "system", alert.note.slice(0,120)).run(); } catch {}
      } else {
        await env.AURA_KV.put("notes:alert:resources", JSON.stringify({ ts: new Date().toISOString(), concerns: [], note: "All provider balances/keys healthy." })).catch(() => {});
      }
    }
  } catch {}
}

// DRAIN SCHEDULE - the engine that makes a PTA's forward edge real. Every minute the cron calls
// this; it reads the global due-queue, finds items whose due_at has arrived, fires the action
// (email first - the only active channel), marks the item done, and records that it fired on the
// PTA's timeline. This is what lets a PTA act in time on its own initiative - the difference
// between an assistant that only responds when spoken to and one that keeps its commitments.
async function drainSchedule(env) {
  try {
    let q = []; const qr = await env.AURA_KV.get("schedule:due_queue"); if (qr) { try { q = JSON.parse(qr) || []; } catch {} }
    if (!q.length) return;
    const now = Date.now();
    const remaining = [];
    for (const entry of q) {
      const due = Date.parse(entry.due_at);
      if (isNaN(due) || due > now) { remaining.push(entry); continue; } // not due yet, keep it
      // item is due - load it from the PTA's schedule
      const scKey = `pta:schedule:${entry.pta}`;
      let items = []; try { const r = await env.AURA_KV.get(scKey); if (r) items = JSON.parse(r) || []; } catch {}
      const item = items.find(it => it.id === entry.item_id);
      if (!item || item.status === "done") continue; // already handled, drop from queue
      // FIRE THE ACTION. Email first (structured so brain-decides-at-fire-time can layer on later).
      let fired = false, fireNote = "";
      if (item.action && /^email:/i.test(item.action)) {
        const to = item.action.replace(/^email:/i, "").trim();
        const subject = item.subject || "Following up";
        const body = item.body || ("Hi - this is Aura following up as promised: " + (item.about || "") + "\n\nWhenever you're ready, just reply to this email and we'll pick up where we left off.");
        try {
          // READ THE ACTUAL RESULT - do not assume success. processCommand returns the command's
          // payload; EMAIL_SEND reports ok:true only if Cloudflare accepted the send. We record the
          // TRUE outcome so the timeline never lies about whether mail actually went out.
          const sendRes = await processCommand("EMAIL_SEND " + to + " " + subject + " | " + body, env, true);
          const payload = (sendRes && sendRes.payload) ? sendRes.payload : sendRes;
          if (payload && payload.ok) {
            fired = true; fireNote = "email accepted by Cloudflare -> " + to + (payload.message_id ? (" (id " + payload.message_id + ")") : "");
          } else {
            fired = false;
            fireNote = "EMAIL FAILED -> " + to + " :: " + (payload ? (payload.error || ("http " + (payload.http_status || "?") + " " + (payload.detail || JSON.stringify(payload.errors || [])).slice(0, 200))) : "no result returned");
          }
        } catch (e) { fired = false; fireNote = "email threw: " + (e && e.message ? e.message : String(e)); }
      } else {
        fireNote = "no actionable channel (action=" + (item.action || "none") + ")";
      }
      // mark the item done and record on the timeline that the PTA acted
      try {
        items = items.map(it => it.id === item.id ? { ...it, status: "done", fired_at: new Date().toISOString(), fire_note: fireNote } : it);
        await env.AURA_KV.put(scKey, JSON.stringify(items)).catch(() => {});
        let evs = []; const tl = await env.AURA_KV.get(`pta:timeline:${entry.pta}`); if (tl) { try { evs = JSON.parse(tl) || []; } catch {} }
        evs.push({ ts: new Date().toISOString(), event: "Acted on schedule: " + (item.about || "") + " (" + fireNote + ")", kind: "schedule_fired" });
        await env.AURA_KV.put(`pta:timeline:${entry.pta}`, JSON.stringify(evs)).catch(() => {});
      } catch {}
      // item handled - do not keep in queue
    }
    await env.AURA_KV.put("schedule:due_queue", JSON.stringify(remaining)).catch(() => {});
  } catch {}
}

export default {
  async scheduled(event, env, ctx) {
    _AURA_ENV = env;
    ctx.waitUntil(runHealthChecks(env));
    ctx.waitUntil(watchA2P(env));
    ctx.waitUntil(watchResources(env));
    ctx.waitUntil(drainSchedule(env));
  },

  async fetch(request, env) {
    _AURA_ENV = env;
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type, Authorization, X-Session-ID", "access-control-max-age": "86400" } });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type, Authorization, X-Session-ID", "access-control-max-age": "86400" } });
    const isOp = await verifyOperator(request, env);

    const _homescreenRoot = (url.hostname === "homescreen.world" || url.hostname === "www.homescreen.world") && url.pathname === "/";

    // ============ /lab - CLEAN INSTALL TEST SURFACE ============
    // A virgin, login-free, never-cached page for proving the installed-PWA pipeline from zero.
    // No session, no grid, no brain - the only variables are: does a fresh install load live code,
    // does its JavaScript run in standalone, and does it self-update. Everything is no-store so it
    // can never freeze. Install /lab to the home screen and read the three big lines it shows.
    if (url.pathname === "/lab/ping") {
      return new Response(JSON.stringify({ ok: true, build: BUILD, ts: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache, no-store, must-revalidate" }
      });
    }
    if (url.pathname === "/lab/manifest") {
      const mani = { name: "Aura Lab", short_name: "Lab", start_url: "/lab", display: "standalone", background_color: "#0a0a0f", theme_color: "#0a0a0f", icons: [{ src: "/image/aura-icon-192", sizes: "192x192", type: "image/png" }, { src: "/image/aura-icon-512", sizes: "512x512", type: "image/png" }] };
      return new Response(JSON.stringify(mani), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-cache, no-store, must-revalidate" } });
    }
    if (url.pathname === "/lab") {
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>Aura Lab</title>
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Lab"><meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#0a0a0f"><link rel="manifest" href="/lab/manifest">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,system-ui,sans-serif;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1.5rem;gap:1.4rem}.lab{font-size:1rem;letter-spacing:0.3em;color:#a855f7;font-weight:700}.big{font-size:2.4rem;font-weight:800;color:#fff;font-family:monospace}.row{font-size:1.1rem;font-family:monospace;padding:0.5rem 1rem;border-radius:10px;background:#16161f}.ok{color:#34d399}.bad{color:#f87171}.muted{color:#6b6b8a;font-size:0.85rem;max-width:340px;line-height:1.5}</style></head><body>
<div class="lab">AURA LAB</div>
<div class="big">HTML: ${BUILD.replace("aura-core-", "")}</div>
<div class="row" id="js"><span class="bad">JS: did not run</span></div>
<div class="row" id="ping"><span class="muted">PING: fetching…</span></div>
<div class="muted">If you see green on both lines, the installed app loaded live code AND its JavaScript ran AND it reached the network. That's the whole pipeline, proven.</div>
<script>
document.getElementById('js').innerHTML='<span class="ok">JS: ran &#10003;</span>';
fetch('/lab/ping',{cache:'no-store'}).then(function(r){return r.json();}).then(function(d){document.getElementById('ping').innerHTML='<span class="ok">PING: live '+(d.build||'').replace('aura-core-','')+' &#10003;</span>';}).catch(function(e){document.getElementById('ping').innerHTML='<span class="bad">PING failed: '+e+'</span>';});
if('serviceWorker' in navigator){var hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('/sw.js').then(function(reg){reg.update();}).catch(function(){});var refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(refreshing)return;refreshing=true;if(hadController)window.location.reload();});}
</script>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" } });
    }

    if (request.method === "GET" && !_homescreenRoot && url.pathname !== "/chat" && url.pathname !== "/health" && url.pathname !== "/homelog" && url.pathname !== "/status" && url.pathname !== "/logs" && url.pathname !== "/claims" && url.pathname !== "/dashboard" && url.pathname !== "/showit" && url.pathname !== "/tattoo" && url.pathname !== "/find-artists" && url.pathname !== "/aura-chat" && url.pathname !== "/create-checkout" && url.pathname !== "/confirm-payment" && url.pathname !== "/create-payment-intent" && url.pathname !== "/pay" && url.pathname !== "/pitch" && url.pathname !== "/engine" && url.pathname !== "/home" && url.pathname !== "/manifest.webmanifest" && url.pathname !== "/sw.js" && url.pathname !== "/talk" && url.pathname !== "/home/greet" && url.pathname !== "/home/layout" && !url.pathname.startsWith("/command-center") && !url.pathname.startsWith("/plaid/") && !url.pathname.startsWith("/image/") && !url.pathname.startsWith("/auth/")) {
      const page = await servePage(url.hostname, url.pathname === "/" ? "/" : url.pathname, env);
      if (page) return page;
    }

    if (url.pathname === "/health") {
      return jsonReply({ ok: true, build: BUILD, ts: new Date().toISOString() });
    }

    // /homelog - read Home Screen conversation turns VERBATIM from D1 (what was said + Aura's replies,
    // in order). Operator-gated (it's a private conversation). Optional ?limit=N (default 60) and
    // ?pta=<id> (defaults to the owner's PTA). Same reliable pattern as /calls - straight from the DB,
    // no model paraphrase.
    if (url.pathname === "/homelog") {
      const okOp = await verifyOperator(request, env).catch(() => false);
      if (!okOp) return jsonReply({ ok: false, error: "operator required" }, 401);
      try {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 300);
        const ownerPta = (await env.AURA_KV.get("config:owner:pta").catch(() => null)) || "";
        const pta = url.searchParams.get("pta") || ownerPta;
        if (!pta) return jsonReply({ ok: false, error: "no pta (set config:owner:pta or pass ?pta=)" });
        const rows = await env.AURA_MEMORY.prepare(
          "SELECT ts, type, body, summary FROM events WHERE entity_id = ? AND channel = 'homescreen' ORDER BY ts ASC LIMIT ?"
        ).bind(pta, limit).all();
        const turns = (rows.results || []).map(r => {
          let parsed = {}; try { parsed = JSON.parse(r.body); } catch {}
          let text = parsed.msg || parsed.reply || parsed.hold || "";
          let speaker = r.type === "home_said" ? (parsed.who || "You") : (r.type === "home_reply" ? "Aura" : (r.type === "home_hold" ? "Aura (holding)" : r.type));
          return { ts: new Date(r.ts).toISOString(), speaker, text };
        });
        return jsonReply({ ok: true, pta, count: turns.length, turns });
      } catch (e) {
        return jsonReply({ ok: false, error: String(e && e.message || e) });
      }
    }

    // ===== GOOGLE SIGN-IN (the universal authenticated front door - no operator token) =====
    // One-tap "Continue with Google". /auth/google/start redirects to Google; Google sends the
    // person back to /auth/google/callback with a code; we exchange it for the person's verified
    // identity (email), create-or-find their PTA, mark it google_verified, set a session cookie,
    // and land them on their PTA. This is how every citizen authenticates. Generic engine; the
    // client_id/secret are DATA in KV.
    if (url.pathname === "/auth/google/start") {
      const gcid = await env.AURA_KV.get("secret:google_client_id").catch(() => null);
      if (!gcid) return new Response("Google sign-in not configured", { status: 500 });
      const redirectUri = `https://${url.hostname}/auth/google/callback`;
      const state = Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, "0")).join("");
      // remember where to return after login (default: the PTA view on this host)
      const dest = url.searchParams.get("dest") || "/";
      await env.AURA_KV.put(`oauth:state:${state}`, JSON.stringify({ dest, host: url.hostname }), { expirationTtl: 600 }).catch(() => {});
      const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      auth.searchParams.set("client_id", gcid);
      auth.searchParams.set("redirect_uri", redirectUri);
      auth.searchParams.set("response_type", "code");
      auth.searchParams.set("scope", "openid email profile");
      auth.searchParams.set("state", state);
      auth.searchParams.set("prompt", "select_account");
      return Response.redirect(auth.toString(), 302);
    }

    if (url.pathname === "/auth/google/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) return new Response("Missing code/state", { status: 400 });
      let stateRec = null; try { const r = await env.AURA_KV.get(`oauth:state:${state}`); if (r) stateRec = JSON.parse(r); } catch {}
      if (!stateRec) return new Response("Invalid or expired sign-in attempt. Please try again.", { status: 400 });
      await env.AURA_KV.delete(`oauth:state:${state}`).catch(() => {});
      const gcid = await env.AURA_KV.get("secret:google_client_id").catch(() => null);
      const gsec = await env.AURA_KV.get("secret:google_client_secret").catch(() => null);
      const redirectUri = `https://${url.hostname}/auth/google/callback`;
      // exchange the code for tokens
      let tokenData;
      try {
        const tr = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code, client_id: gcid, client_secret: gsec, redirect_uri: redirectUri, grant_type: "authorization_code" })
        });
        tokenData = await tr.json();
      } catch (e) { return new Response("Token exchange failed", { status: 500 }); }
      if (!tokenData || !tokenData.access_token) return new Response("Google did not return a token", { status: 500 });
      // get the verified profile
      let profile;
      try {
        const pr = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { authorization: `Bearer ${tokenData.access_token}` } });
        profile = await pr.json();
      } catch (e) { return new Response("Could not read Google profile", { status: 500 }); }
      if (!profile || !profile.email || !profile.verified_email) return new Response("Google email not verified", { status: 400 });
      const identity = "email:" + profile.email.toLowerCase();
      const name = profile.name || profile.email.split("@")[0];
      // Hand the provider-verified identity to the engine - the route does NO DB work itself.
      let entId = null;
      try {
        const r = await processCommand(`AUTH_PROVIDER google ${identity} ${name.replace(/[\n\r]/g, " ")}`, env, true);
        const pp = r && r.payload ? r.payload : r;
        if (pp && pp.ok && pp.pta) entId = pp.pta;
      } catch (e) {}
      if (!entId) return new Response("Could not establish your PTA", { status: 500 });
      // provider profile (avatar/name) is data - store outside, keyed to the pta
      await env.AURA_KV.put(`profile:google:${entId}`, JSON.stringify({ name, email: profile.email, picture: profile.picture || null, verified: true, at: new Date().toISOString() })).catch(() => {});
      // set a session token mapping to the pta, stored server-side
      const session = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, "0")).join("");
      await env.AURA_KV.put(`session:${session}`, JSON.stringify({ pta: entId, identity, name, created: Date.now() }), { expirationTtl: 60 * 60 * 24 * 30 }).catch(() => {});
      const dest = stateRec.dest || "/";
      // Carry the session token IN THE REDIRECT URL, not only in the cookie. iOS/Android run an
      // installed PWA in a SEPARATE cookie jar from the browser that handled the Google OAuth
      // bounce, so a Set-Cookie alone never reaches the app and it stays stuck on the signed-out
      // screen. The token in ?s= survives the jump back; /home consumes it once and sets the cookie
      // in the APP's own jar, closing the loop. Cookie is still set for the plain-browser case.
      const destWithToken = dest + (dest.includes("?") ? "&" : "?") + "s=" + session;
      return new Response(null, { status: 302, headers: {
        "location": destWithToken,
        "set-cookie": `aura_session=${session}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`
      } });
    }

    // helper: who is logged in (reads the session cookie) - used by the PTA view
    if (url.pathname === "/auth/me") {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie.match(/aura_session=([a-f0-9]+)/);
      if (!m) return jsonReply({ ok: false, authenticated: false });
      let sess = null; try { const r = await env.AURA_KV.get(`session:${m[1]}`); if (r) sess = JSON.parse(r); } catch {}
      if (!sess) return jsonReply({ ok: false, authenticated: false });
      return jsonReply({ ok: true, authenticated: true, pta: sess.pta, name: sess.name, identity: sess.identity });
    }

    if (url.pathname === "/auth/my-pta") {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie.match(/aura_session=([a-f0-9]+)/);
      if (!m) return jsonReply({ ok: false, authenticated: false });
      let sess = null; try { const r = await env.AURA_KV.get(`session:${m[1]}`); if (r) sess = JSON.parse(r); } catch {}
      if (!sess) return jsonReply({ ok: false, authenticated: false });
      // return this person's OWN spine - they can only ever see their own (gated by their session)
      const r = await processCommand(`PTA_SPINE GET ${sess.pta}`, env, true);
      const sp = r && r.payload ? r.payload : r;
      let gp = null; try { const g = await env.AURA_KV.get(`profile:google:${sess.pta}`); if (g) gp = JSON.parse(g); } catch {}
      return jsonReply({ ok: true, authenticated: true, pta: sess.pta, name: sess.name, google: gp, spine: sp && sp.spine ? sp.spine : null });
    }

    // ===== HOME SCREEN — the one surface a PTA is left holding =====
    // The finished product, at scale of one: you sign in, the worker resolves YOUR pta from the session,
    // reads YOUR spine LIVE, and renders your Home Screen. Three things only: your PTA (awareness:
    // identity, purpose, tasks, timeline), Aura (teammate you can talk to right here), and this surface.
    // Generic + secure: each person only ever sees their own (session-gated); no identity hardcoded.
    // Serves at /home on any host, AND at the root of homescreen.world (its real home).
    const _isHomescreenHost = (url.hostname === "homescreen.world" || url.hostname === "www.homescreen.world");
    // /home/layout - per-user app arrangement. Their habits, their order, theirs and it sticks.
    if (url.pathname === "/home/layout") {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie.match(/aura_session=([a-f0-9]+)/);
      if (!m) return jsonReply({ ok: false });
      let sess = null; try { const r = await env.AURA_KV.get(`session:${m[1]}`); if (r) sess = JSON.parse(r); } catch {}
      if (!sess) return jsonReply({ ok: false });
      const key = `home:layout:${sess.pta}`;
      if (request.method === "POST") {
        let body = {}; try { body = await request.json(); } catch {}
        const apps = Array.isArray(body.apps) ? body.apps.filter(x => typeof x === "string").slice(0, 60) : null;
        if (apps) { try { await env.AURA_KV.put(key, JSON.stringify(apps)); } catch {} }
        return jsonReply({ ok: true, saved: !!apps });
      }
      // GET
      let apps = null; try { const r = await env.AURA_KV.get(key); if (r) apps = JSON.parse(r); } catch {}
      return jsonReply({ ok: true, apps: apps || null });
    }

    // /home/greet - returns the continuity greeting as JSON. The page FETCHES this instead of
    // injecting it into HTML, so no quote/apostrophe in the greeting can ever break the script.
    if (url.pathname === "/home/greet") {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie.match(/aura_session=([a-f0-9]+)/);
      if (!m) return jsonReply({ ok: false, greet: "Hey. Sign in to see your Home Screen." });
      let sess = null; try { const r = await env.AURA_KV.get(`session:${m[1]}`); if (r) sess = JSON.parse(r); } catch {}
      if (!sess) return jsonReply({ ok: false, greet: "Hey. Sign in to see your Home Screen." });
      const spr = await processCommand(`PTA_SPINE GET ${sess.pta}`, env, true);
      const spine = (spr && spr.payload && spr.payload.spine) ? spr.payload.spine : null;
      const nm = (spine && spine.identity && spine.identity.name) || sess.name || "there";
      const firstName = String(nm).split(" ")[0];
      const meaningful = (spine && Array.isArray(spine.timeline) ? spine.timeline : []).filter(e => e && /person_said|aura_said|held|action|event/.test(e.kind || "")).slice(-4).reverse();
      let lastThread = "";
      for (const e of meaningful) { if (e.event && e.event.length > 12) { lastThread = e.event.replace(/^(Aaron said:|Aura replied:|Aura is holding:|Aura built and published a page:)\s*/i, "").replace(/^["']|["']$/g, "").slice(0, 120); break; } }
      const greet = lastThread ? `Hey ${firstName}. Last time we were on: ${lastThread} — want to pick that back up?` : `Hey ${firstName}. What do you want to get into?`;
      return jsonReply({ ok: true, greet, name: firstName });
    }

    // /talk - bulletproof standalone chat. Static HTML, ZERO data injection. Everything fetched
    // after load. This proves the chat pipe works cleanly, isolated from any layout fragility.
    if (url.pathname === "/talk") {
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>Aura</title><style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,system-ui,sans-serif;display:flex;flex-direction:column;min-height:100vh}
.head{display:flex;align-items:center;gap:0.6rem;padding:1rem 1.1rem;border-bottom:1px solid #16161f}
.orb{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#c084fc,#7c3aed 60%,#3b0764);box-shadow:0 0 14px rgba(168,85,247,0.45)}
.htitle{font-weight:700;color:#fff}
.chat{flex:1;overflow-y:auto;padding:1.2rem 1rem;display:flex;flex-direction:column;gap:1rem}
.msg{max-width:88%;line-height:1.5;font-size:0.95rem}
.msg.user{align-self:flex-end;background:#1f1f2e;border-radius:14px;padding:0.7rem 1rem}
.msg.aura{align-self:flex-start;color:#e8e4f0}
.msg.aura .lbl{color:#a855f7;font-weight:700;font-size:0.72rem;display:block;margin-bottom:0.3rem}
.composer{position:sticky;bottom:0;background:#0c0c12;border-top:1px solid #16161f;padding:0.8rem 1rem 1.1rem}
.inbar{display:flex;align-items:center;gap:0.5rem;background:#15151f;border:1px solid #24243a;border-radius:26px;padding:0.4rem 0.5rem 0.4rem 0.9rem}
.inbar input{flex:1;background:none;border:none;color:#e8e4f0;font-size:16px;outline:none;padding:0.5rem 0}
.cbtn{width:40px;height:40px;border-radius:50%;border:none;background:none;color:#9a9ab0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem}
.cbtn.send{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff}
.cbtn.rec{background:#ec4899;color:#fff}
</style></head><body>
<div class="head"><div class="orb"></div><div class="htitle">Aura</div><div style="margin-left:auto;font-size:0.62rem;color:#44445a;font-family:monospace" id="ver">v4.9.162</div></div>
<div class="grid" id="appgrid"></div>
<div class="chat" id="chat"><div class="msg aura"><span class="lbl">AURA</span><span id="greet">…</span></div></div>
<div class="composer"><div class="inbar">
  <button class="cbtn" id="mic" title="Speak">&#127908;</button>
  <input id="inp" placeholder="Talk to Aura..." autocomplete="off">
  <button class="cbtn send" id="send" title="Send">&#8594;</button>
</div></div>
<script>
var chat=document.getElementById('chat'),inp=document.getElementById('inp');
var APPS=["Photos","Messages","Calendar","Maps","Wallet","Music","Files","Camera","Notes","Tasks","Contacts","Settings"];
(function(){var g=document.getElementById('appgrid');if(!g)return;APPS.forEach(function(name){var a=document.createElement('div');a.className='app';var ic=document.createElement('div');ic.className='appicon';ic.textContent=name.charAt(0);var lb=document.createElement('div');lb.className='applabel';lb.textContent=name;a.appendChild(ic);a.appendChild(lb);a.onclick=function(){inp.value="Open "+name;send();};g.appendChild(a);});})();
function add(t,who){var d=document.createElement('div');d.className='msg '+who;if(who==='aura'){var l=document.createElement('span');l.className='lbl';l.textContent='AURA';d.appendChild(l);d.appendChild(document.createTextNode(t));}else{d.textContent=t;}chat.appendChild(d);chat.scrollTop=chat.scrollHeight;}
fetch('/home/greet',{credentials:'include'}).then(function(r){return r.json();}).then(function(d){document.getElementById('greet').textContent=d.greet||'Hey. What do you want to get into?';}).catch(function(){document.getElementById('greet').textContent='Hey. What do you want to get into?';});
if('serviceWorker' in navigator){var hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('/sw.js').then(function(reg){reg.update();}).catch(function(){});var refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(refreshing)return;refreshing=true;if(hadController)window.location.reload();});}
function send(){var m=inp.value.trim();if(!m)return;inp.value='';add(m,'user');var ld=document.createElement('div');ld.className='msg aura';ld.id='ld';ld.textContent='…';chat.appendChild(ld);chat.scrollTop=chat.scrollHeight;fetch('/home/talk',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m})}).then(function(r){return r.json();}).then(function(d){var e=document.getElementById('ld');if(e)e.remove();add(d.ok?d.reply:'Trouble connecting.','aura');}).catch(function(){var e=document.getElementById('ld');if(e)e.remove();add('Connection error.','aura');});}
document.getElementById('send').onclick=send;
inp.addEventListener('keydown',function(e){if(e.key==='Enter')send();});
var rec=null,recOn=false;
document.getElementById('mic').onclick=function(){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){add("Voice not supported here — type instead.","aura");return;}if(recOn){rec&&rec.stop();return;}rec=new SR();rec.lang='en-US';rec.interimResults=true;rec.continuous=false;recOn=true;this.classList.add('rec');var btn=this;rec.onresult=function(e){var t='';for(var i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inp.value=t;};rec.onend=function(){recOn=false;btn.classList.remove('rec');if(inp.value.trim())send();};rec.start();};
</script>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // /sw.js - service worker that UN-FREEZES the installed app. It skips waiting (activates the
    // new version immediately), claims all clients, and uses network-first (always fetch fresh,
    // fall back to cache only if offline). This stops the PWA from ever being a frozen stale image.
    if (url.pathname === "/sw.js") {
      const sw = `
const VERSION = 'aura-${Date.now()}';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  // Network-first: always try the live server. Only fall back to nothing if totally offline.
  e.respondWith(fetch(e.request).catch(function(){ return new Response('Offline', { status: 503 }); }));
});
`;
      return new Response(sw, { headers: { "Content-Type": "application/javascript", "Cache-Control": "no-cache, no-store, must-revalidate" } });
    }

    if (url.pathname === "/manifest.webmanifest") {
      const mani = {
        name: "Aura Home Screen",
        short_name: "Aura",
        start_url: "/home",
        display: "standalone",
        background_color: "#0a0a0f",
        theme_color: "#0a0a0f",
        icons: [
          { src: "/image/aura-icon-192", sizes: "192x192", type: "image/png" },
          { src: "/image/aura-icon-512", sizes: "512x512", type: "image/png" }
        ]
      };
      return new Response(JSON.stringify(mani), { headers: { "Content-Type": "application/manifest+json", "cache-control": "no-store" } });
    }

    // ============ PWA APP SHELL (homescreen.world root) ============
    // The installable "phone thing." homescreen.world/ IS the app: tap "Add to Home Screen",
    // it installs full-screen like a native app, persistent session, one front door.
    // Built fetch-don't-inject: static shell, greeting + chat fetched after load. Cannot break.
    // First milestone: wraps the PROVEN chat. Home Screen layout comes after the shell is locked.
    if (_isHomescreenHost && url.pathname === "/") {
      // CONVERGE TO ONE HOME SCREEN. The root used to serve its own separate, older icon grid
      // (tap-to-open, no drag) - and the installed app loads the root, so every /home edit was
      // invisible. Redirect root -> /home, the single canonical Home Screen. Preserve query
      // (e.g. the ?s= sign-in token) so installed-app auth still lands.
      return new Response(null, { status: 302, headers: { "location": "/home" + (url.search || ""), "Cache-Control": "no-cache, no-store, must-revalidate" } });
    }

    if (url.pathname === "/home" || (_isHomescreenHost && url.pathname === "/")) {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie.match(/aura_session=([a-f0-9]+)/);
      let sess = null; if (m) { try { const r = await env.AURA_KV.get(`session:${m[1]}`); if (r) sess = JSON.parse(r); } catch {} }
      // INSTALLED-APP SIGN-IN: no cookie yet, but the OAuth callback carried a one-time ?s=<token>.
      // The installed PWA runs in its own cookie jar, separate from the browser that handled Google
      // sign-in, so the cookie set during OAuth never reached the app. Here we resolve that token to
      // the real server-side session, set the cookie in THIS context (the app's jar), and redirect
      // to a clean URL. After this one hop the app holds its own cookie and every /home/greet and
      // /home/talk fetch is authenticated. This is what stops the installed app being a dead image.
      if (!sess) {
        const tok = url.searchParams.get("s");
        if (tok && /^[a-f0-9]+$/.test(tok)) {
          let tokSess = null; try { const r = await env.AURA_KV.get(`session:${tok}`); if (r) tokSess = JSON.parse(r); } catch {}
          if (tokSess) {
            return new Response(null, { status: 302, headers: {
              "location": url.pathname,
              "set-cookie": `aura_session=${tok}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 30}`,
              "Cache-Control": "no-cache, no-store, must-revalidate"
            } });
          }
        }
      }
      // LOGGED OUT → show a real front door (not a raw redirect). Auth starts on THIS host so the
      // session + redirect_uri stay on the same domain the person is actually visiting.
      if (!sess) {
        const landing = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>Home Screen</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1.5rem;max-width:480px;margin:0 auto}.glow{width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#a855f7,#ec4899);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1.5rem;box-shadow:0 0 40px rgba(168,85,247,0.4)}h1{font-size:2rem;font-weight:800;color:#fff;margin-bottom:0.6rem}p{color:#8888a8;font-size:1rem;line-height:1.5;margin-bottom:2rem;max-width:340px}.btn{display:inline-flex;align-items:center;gap:0.7rem;background:#fff;color:#1a1a1a;font-weight:600;font-size:1rem;padding:0.9rem 1.6rem;border-radius:12px;text-decoration:none;border:none;cursor:pointer}.btn:hover{opacity:0.92}.foot{margin-top:2.5rem;color:#4a4a5a;font-size:0.75rem}</style></head><body>
<div class="glow">◆</div>
<h1>Your Home Screen</h1>
<p>One place where you and Aura meet — what's on your plate, what's next, and your teammate ready to act. Sign in to see yours.</p>
<a class="btn" href="/auth/google/start"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Continue with Google</a>
<div class="foot">Aura · PTA · Home Screen</div>
</body></html>`;
        return new Response(landing, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" } });
      }
      const spr = await processCommand(`PTA_SPINE GET ${sess.pta}`, env, true);
      const spine = (spr && spr.payload && spr.payload.spine) ? spr.payload.spine : null;
      if (!spine) return new Response("Could not load your Home Screen.", { status: 500 });

      const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const name = esc(spine.identity?.name || sess.name || "You");
      const firstName = name.split(" ")[0];
      const role = (tasks => tasks.role)((spine.context?.apps?.tasks) || {}) || "";
      const tasksObj = (spine.context?.apps?.tasks) || {};
      const active = Array.isArray(tasksObj.active) ? tasksObj.active : [];

      // Aura's opening line = continuity. Pull the last meaningful thing we were doing from the timeline,
      // and 1-2 suggested next actions from active tasks. "Hi Sarah, how was Jimmy's party" energy.
      const meaningful = (Array.isArray(spine.timeline) ? spine.timeline : []).filter(e => e && /person_said|aura_said|held|action|event/.test(e.kind || "")).slice(-4).reverse();
      let lastThread = "";
      for (const e of meaningful) { if (e.event && e.event.length > 12) { lastThread = e.event.replace(/^(Aaron said:|Aura replied:|Aura is holding:|Aura built and published a page:)\s*/i, "").replace(/^["']|["']$/g, "").slice(0, 120); break; } }
      const greet = lastThread
        ? `Hey ${firstName}. Last time we were on: "${esc(lastThread)}" — want to pick that back up?`
        : `Hey ${firstName}. What do you want to get into?`;
      const suggestions = active.slice(0, 3).map(t => esc(t.text || ""));

      // RECENT CONTEXT for the sidebar (recent conversation turns, newest first)
      const recent = (Array.isArray(spine.timeline) ? spine.timeline : []).filter(e => /person_said|action|event|held/.test(e.kind || "")).slice(-12).reverse().slice(0, 8);
      const recentLinks = recent.map(e => { const txt = esc((e.event || "").replace(/^(Aaron said:|Aura replied:|Aura is holding:)\s*/i, "").replace(/^["']|["']$/g, "").slice(0, 60)); return `<div onclick="askAura('Continue: ${txt.replace(/'/g, "")}')" style="padding:0.55rem 0.7rem;border-radius:8px;cursor:pointer;color:#b8b8c8;font-size:0.82rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" onmouseover="this.style.background='#1a1a24'" onmouseout="this.style.background='transparent'">${txt}</div>`; }).join("");

      // DEEP hamburger rooms (everything else). Operator gets mission-control over the whole world.
      const roomSets = {
        operator: ["My Domains","Assets","Money","Customers","Calls","Pages","Systems","Tasks","Explore"],
        business: ["Customers","Calls","Transactions","Marketing","Revenue","Explore"],
        person:   ["Photos","Messages","Calendar","Friends","My World","Explore"]
      };
      const rooms = roomSets[role === "operator" ? "operator" : (role === "business" ? "business" : "person")];
      const roomLinks = rooms.map(r => `<div onclick="askAura('Open ${r} — show me my ${r}.')" style="display:flex;align-items:center;gap:0.7rem;padding:0.8rem 1rem;color:#e8e4f0;cursor:pointer;border-radius:8px;font-size:0.95rem" onmouseover="this.style.background='#1a1a24'" onmouseout="this.style.background='transparent'">${esc(r)}</div>`).join("");

      // ===== ICONS (shell) =====
      const icPlus = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
      const icMic = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/></svg>`;
      const icSend = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
      const icMenu = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>`;
      const icCart = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>`;
      const icGrid = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
      const icStar = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

      // ===== ROOMS (familiar surfaces — tapped to change context, never dragged) =====
      const apps = [
        {n:"Photos",c:"#1c1c28"},{n:"Messages",c:"#1c2a1c"},{n:"Calendar",c:"#2a1c1c"},
        {n:"Contacts",c:"#1c2230"},{n:"Music",c:"#2a1c24"},{n:"Maps",c:"#1c2a26"},
        {n:"Files",c:"#1c1c2e"},{n:"Tasks",c:"#1c2030"},{n:"Wallet",c:"#241c2a"}
      ];
      const roomsHtml = apps.map(function(a){var act = a.n==='Photos' ? 'openPhotos()' : "askAura('Open "+a.n+"')"; return '<div class="room" onclick="'+act+'"><div class="roomicon" style="background:'+a.c+'">'+a.n.charAt(0)+'</div><div class="roomlabel">'+a.n+'</div></div>';}).join("")
        + '<div class="room" onclick="askAura(\'I want to add a new room\')"><div class="roomicon add">'+icPlus+'</div><div class="roomlabel">Add Room</div></div>';

      // ===== WHAT'S IMPORTANT (real data: active tasks / held items; honest empty state otherwise) =====
      const importantHtml = (active && active.length)
        ? active.slice(0,6).map(function(t){var x=esc(t.text||"");return '<div class="ccard" onclick="askAura(\''+x.replace(/'/g,"")+'\')"><div class="ccardtitle">'+x+'</div></div>';}).join("")
        : '<div class="ccard wide" onclick="openChat()"><div class="ccardtitle">Nothing urgent right now</div><div class="ccardsub">Tap to tell Aura what\u2019s on your mind</div></div>';

      // ===== DISCOVER (context doorways) =====
      const discoverItems = [
        {t:"Discover", s:"Something amazing", g:"linear-gradient(135deg,#6d28d9,#9333ea)"},
        {t:"City Guide", s:"Your city, smarter", g:"linear-gradient(135deg,#1e3a8a,#7c3aed)"},
        {t:"Photos", s:"Your memories", g:"linear-gradient(135deg,#334155,#0f172a)"},
        {t:"Music", s:"Your soundtrack", g:"linear-gradient(135deg,#0ea5e9,#6366f1)"}
      ];
      const discoverHtml = discoverItems.map(function(d){return '<div class="dcard" style="background:'+d.g+'" onclick="askAura(\'Open '+d.t+'\')"><div class="dtitle">'+d.t+'</div><div class="dsub">'+d.s+'</div></div>';}).join("");

      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>Home — ${name}</title>
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Aura"><meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#0a0a0f"><link rel="manifest" href="/manifest.webmanifest">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%}
body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;min-height:100vh;min-height:100dvh;padding-bottom:78px}
/* ===== SHELL: top bar ===== */
.top{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.1rem 0.4rem}
.ico{background:none;border:none;color:#cfcfe0;cursor:pointer;display:flex;position:relative;padding:0.35rem}
.toptitle{font-weight:700;color:#fff;font-size:1.1rem;display:flex;flex-direction:column;align-items:center;gap:3px}
.toptitle .dot{width:5px;height:5px;border-radius:50%;background:#a855f7}
.cartcount{position:absolute;top:-2px;right:-4px;background:#a855f7;color:#fff;font-size:0.62rem;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px}
#ver{position:absolute;top:6px;left:50%;transform:translateX(-50%);font-family:monospace;font-size:0.62rem;color:#3a3a4a}
/* ===== SHELL: Aura hero ===== */
.hero{display:flex;align-items:center;gap:0.9rem;padding:0.8rem 1.1rem 1rem;cursor:pointer}
.orb{border-radius:50%;background:radial-gradient(circle at 34% 30%,#d8b4fe,#7c3aed 55%,#3b0764);box-shadow:0 0 22px rgba(168,85,247,0.5);flex-shrink:0}
.orb.big{width:58px;height:58px;position:relative}
.orb.big::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(168,85,247,0.35);animation:pulse 2.6s infinite}
@keyframes pulse{0%{transform:scale(1);opacity:0.7}70%{transform:scale(1.35);opacity:0}100%{opacity:0}}
.herotext{flex:1;min-width:0}
.hgreet{font-size:1.15rem;font-weight:700;color:#fff;line-height:1.25}
.hgreet b{color:#c084fc}
.hline{font-size:0.9rem;color:#b8b4c8;margin-top:0.2rem;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hcta{font-size:0.78rem;color:#7c5cff;margin-top:0.35rem;font-weight:600}
.mic{width:46px;height:46px;border-radius:50%;border:1px solid #2a2a3c;background:#14141d;color:#cfcfe0;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer}
/* ===== CANVAS (adaptive — context: home) ===== */
.canvas{flex:1;padding:0 0 1rem}
.cansec{margin-top:1.4rem}
.canhead{display:flex;align-items:center;justify-content:space-between;padding:0 1.1rem 0.7rem}
.canhead span{font-size:1.05rem;font-weight:700;color:#fff}
.canhead a{font-size:0.85rem;color:#a855f7;cursor:pointer}
.cardscroll{display:flex;gap:0.8rem;overflow-x:auto;padding:0 1.1rem 0.3rem;scrollbar-width:none}
.cardscroll::-webkit-scrollbar{display:none}
.ccard{flex:0 0 auto;width:160px;min-height:120px;background:linear-gradient(160deg,#16161f,#101019);border:1px solid #1e1e2c;border-radius:16px;padding:1rem;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer}
.ccard.wide{width:88%}
.ccardtitle{font-size:0.95rem;font-weight:600;color:#fff;line-height:1.3}
.ccardsub{font-size:0.8rem;color:#8888a8;margin-top:0.3rem}
/* rooms */
.rooms{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem 0.5rem;padding:0 1.1rem}
.room{display:flex;flex-direction:column;align-items:center;gap:0.4rem;cursor:pointer}
.roomicon{width:58px;height:58px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.35rem;color:#cfcfe0;border:1px solid #20202c}
.roomicon.add{background:none;border:1px dashed #3a3a4c;color:#7c7c92}
.roomlabel{font-size:0.7rem;color:#c8c8d8;text-align:center}
/* discover */
.discover{display:flex;gap:0.8rem;overflow-x:auto;padding:0 1.1rem 0.3rem;scrollbar-width:none}
.discover::-webkit-scrollbar{display:none}
.dcard{flex:0 0 auto;width:150px;height:150px;border-radius:18px;padding:1rem;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;position:relative;overflow:hidden}
.dcard::before{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55),transparent 60%)}
.dtitle{font-size:1rem;font-weight:700;color:#fff;position:relative}
.dsub{font-size:0.75rem;color:rgba(255,255,255,0.8);position:relative}
/* ===== PHOTO CANVAS ===== */
.pc-head{display:flex;align-items:center;gap:0.6rem;padding:0 1.1rem 0.4rem}
.pc-back{background:none;border:none;color:#a855f7;font-size:1.5rem;cursor:pointer;line-height:1;padding:0}
.pc-title{font-size:1.2rem;font-weight:800;color:#fff}
.pc-connect{display:flex;flex-direction:column;align-items:center;text-align:center;padding:2.4rem 1.6rem;gap:0.5rem}
.pc-glow{width:74px;height:74px;border-radius:20px;background:linear-gradient(135deg,#a855f7,#ec4899);display:flex;align-items:center;justify-content:center;margin-bottom:0.6rem;box-shadow:0 0 36px rgba(168,85,247,0.4)}
.pc-h{font-size:1.3rem;font-weight:800;color:#fff}
.pc-p{font-size:0.92rem;color:#9a9ab0;line-height:1.5;max-width:330px}
.pc-btn{margin-top:1rem;background:#fff;color:#111;font-weight:700;font-size:1rem;border:none;border-radius:14px;padding:0.85rem 1.7rem;cursor:pointer}
.pc-note{font-size:0.74rem;color:#5a5a72;margin-top:0.4rem}
.pc-progress{text-align:center;padding:2.5rem 1.5rem;color:#c8c4d8;font-size:0.95rem}
.pc-bar{height:6px;background:#1a1a26;border-radius:3px;margin:1rem auto 0;max-width:280px;overflow:hidden}
.pc-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a855f7,#ec4899);transition:width .2s}
.albums{display:grid;grid-template-columns:repeat(2,1fr);gap:0.9rem;padding:0.5rem 1.1rem 1rem}
.album{cursor:pointer}
.albumcover{width:100%;aspect-ratio:1/1;border-radius:16px;object-fit:cover;background:#16161f;display:block}
.albumtitle{font-size:0.95rem;font-weight:700;color:#fff;margin-top:0.5rem;line-height:1.2}
.albumsub{font-size:0.78rem;color:#8888a8;margin-top:0.15rem}
.photogrid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:0.4rem 0.8rem 1rem}
.photogrid img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:6px;background:#16161f;cursor:pointer}
.pc-summary{padding:0 1.1rem 0.8rem;color:#b8b4c8;font-size:0.9rem;line-height:1.4}
/* ===== SHELL: bottom nav ===== */
.bottomnav{position:fixed;bottom:0;left:0;right:0;height:72px;background:rgba(12,12,18,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid #16161f;display:flex;align-items:center;justify-content:space-around;padding-bottom:env(safe-area-inset-bottom);z-index:40}
.navbtn{background:none;border:none;color:#8888a0;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:0.68rem;cursor:pointer}
.navorb{background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:0.68rem;color:#c084fc;cursor:pointer;transform:translateY(-6px)}
.navorb .orb{width:46px;height:46px}
/* ===== conversation overlay ===== */
.chatlayer{position:fixed;inset:0;background:#0a0a0f;z-index:80;display:none;flex-direction:column}
.chatlayer.open{display:flex}
.clhead{display:flex;align-items:center;gap:0.6rem;padding:0.9rem 1.1rem;border-bottom:1px solid #16161f}
.clback{background:none;border:none;color:#9a9ab0;font-size:1.6rem;cursor:pointer;line-height:1}
.chat{flex:1;overflow-y:auto;padding:1.2rem 1rem;display:flex;flex-direction:column;gap:1rem}
.msg{max-width:88%;line-height:1.5;font-size:0.95rem}
.msg.user{align-self:flex-end;background:#1f1f2e;border-radius:14px;padding:0.7rem 1rem}
.msg.aura{align-self:flex-start;color:#e8e4f0}
.msg.aura .lbl{color:#a855f7;font-weight:700;font-size:0.72rem;display:block;margin-bottom:0.3rem}
.console{border-top:1px solid #16161f;background:#0c0c12;padding:0.7rem 1rem 1rem}
.inbar{display:flex;align-items:center;gap:0.5rem;background:#15151f;border:1px solid #24243a;border-radius:26px;padding:0.4rem 0.5rem 0.4rem 0.7rem}
.inbar input{flex:1;background:none;border:none;color:#e8e4f0;font-size:16px;outline:none;padding:0.4rem}
.cbtn{width:38px;height:38px;border-radius:50%;border:none;background:none;color:#9a9ab0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cbtn.send{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff}
.cbtn.rec{background:#ec4899;color:#fff}
/* drawer */
.scrim{position:fixed;inset:0;background:rgba(0,0,0,0.55);opacity:0;pointer-events:none;transition:opacity .25s;z-index:90}
.scrim.open{opacity:1;pointer-events:auto}
.drawer{position:fixed;top:0;right:0;bottom:0;width:80%;max-width:340px;background:#0d0d14;border-left:1px solid #1f1f2e;transform:translateX(100%);transition:transform .25s;z-index:95;overflow-y:auto}
.drawer.open{transform:none}
.drawer .dh{padding:1.2rem 1rem;border-bottom:1px solid #1f1f2e;font-size:1.1rem;font-weight:800;color:#fff}
</style></head><body>

<!-- ===== PERMANENT SHELL ===== -->
<div class="top">
  <button class="ico" onclick="toggleMenu()">${icMenu}</button>
  <div class="toptitle">Home<span class="dot"></span></div>
  <div id="ver">v4.9.162</div>
  <button class="ico" onclick="askAura('Show me my cart')">${icCart}<span class="cartcount" id="cartCount" style="display:none">0</span></button>
</div>

<div class="hero" onclick="openChat()">
  <div class="orb big"></div>
  <div class="herotext">
    <div class="hgreet">Good ${ (new Date().getHours()<12?'morning': new Date().getHours()<18?'afternoon':'evening') }, <b>${firstName}</b>.</div>
    <div class="hline" id="heroLine"></div>
    <div class="hcta">Tap to reply or talk to Aura</div>
  </div>
  <button class="mic" onclick="event.stopPropagation();openChat();setTimeout(toggleMic,150)">${icMic}</button>
</div>

<!-- ===== ADAPTIVE CANVAS — context: home (swappable: money/photos/etc plug in here) ===== -->
<div class="canvas" id="canvas" data-context="home">
<div id="homeCanvas">
  <div class="cansec">
    <div class="canhead"><span>What's important right now</span><a onclick="askAura('Show me everything important right now')">See all</a></div>
    <div class="cardscroll">${importantHtml}</div>
  </div>
  <div class="cansec">
    <div class="canhead"><span>My Rooms</span><a onclick="toggleMenu()">Edit</a></div>
    <div class="rooms">${roomsHtml}</div>
  </div>
  <div class="cansec">
    <div class="canhead"><span>Discover</span></div>
    <div class="discover">${discoverHtml}</div>
  </div>
</div>
<div id="photoCanvas" style="display:none"></div>
</div>

<!-- ===== SHELL: bottom nav ===== -->
<div class="bottomnav">
  <button class="navbtn" onclick="toggleMenu()">${icGrid}<span>Rooms</span></button>
  <button class="navorb" onclick="openChat()"><div class="orb"></div><span>Aura</span></button>
  <button class="navbtn" onclick="askAura('Discover something amazing for me right now')">${icStar}<span>Explore</span></button>
</div>

<!-- ===== CONVERSATION ===== -->
<div class="chatlayer" id="chatlayer">
  <div class="clhead">
    <button class="clback" onclick="closeChat()">‹</button>
    <div class="orb" style="width:30px;height:30px"></div>
    <div style="font-weight:700;color:#fff">Aura</div>
  </div>
  <div class="chat" id="chatArea">
    <div class="msg aura"><span class="lbl">AURA</span><span id="greetMsg"></span></div>
  </div>
  <div class="console">
    <div class="inbar">
      <button class="cbtn" id="micBtn2" onclick="toggleMic()" title="Speak">${icMic}</button>
      <input id="chatInput" placeholder="Message Aura..." onkeydown="if(event.key==='Enter')sendMsg()">
      <button class="cbtn send" onclick="sendMsg()" title="Send">${icSend}</button>
    </div>
  </div>
</div>

<!-- ===== DRAWER (deep rooms) ===== -->
<div class="scrim" id="scrim" onclick="toggleMenu()"></div>
<div class="drawer" id="drawer">
  <div class="dh">Your world</div>
  <div style="padding:0.5rem">${roomLinks}</div>
</div>

<script>
var AURA_GREET = ${JSON.stringify(greet)};
document.addEventListener('DOMContentLoaded',function(){
  var hl=document.getElementById('heroLine'); if(hl) hl.textContent=AURA_GREET;
  var gm=document.getElementById('greetMsg'); if(gm) gm.textContent=AURA_GREET;
});
function openChat(){document.getElementById('chatlayer').classList.add('open');setTimeout(function(){var c=document.getElementById('chatInput');if(c)c.focus();},120);}
function closeChat(){document.getElementById('chatlayer').classList.remove('open')}
function toggleMenu(){document.getElementById('drawer').classList.toggle('open');document.getElementById('scrim').classList.toggle('open')}
function addMsg(t,who){var d=document.createElement('div');d.className='msg '+who;if(who==='aura')d.innerHTML='<span class="lbl">AURA</span>'+String(t).replace(/\\n/g,'<br>');else d.textContent=t;document.getElementById('chatArea').appendChild(d);var c=document.getElementById('chatArea');c.scrollTop=c.scrollHeight}
function askAura(t){if(document.getElementById('drawer').classList.contains('open'))toggleMenu();openChat();var i=document.getElementById('chatInput');i.value=t;sendMsg()}
async function sendMsg(){var inp=document.getElementById('chatInput');var m=inp.value.trim();if(!m)return;inp.value='';addMsg(m,'user');var ld=document.createElement('div');ld.className='msg aura';ld.id='ld';ld.innerHTML='<span class="lbl">AURA</span><span style="color:#6b6b8a">...</span>';document.getElementById('chatArea').appendChild(ld);try{var r=await fetch('/home/talk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m})});var el=document.getElementById('ld');if(el)el.remove();var d=await r.json();if(d.ok)addMsg(d.reply,'aura');else addMsg('Trouble connecting.','aura')}catch(e){var el2=document.getElementById('ld');if(el2)el2.remove();addMsg('Connection error.','aura')}}
var _rec=null,_recOn=false;
function toggleMic(){var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){addMsg("Your browser doesn't support voice - try typing.","aura");return}if(_recOn){_rec&&_rec.stop();return}_rec=new SR();_rec.lang='en-US';_rec.interimResults=true;_rec.continuous=false;_recOn=true;_rec.onresult=function(e){var txt='';for(var i=0;i<e.results.length;i++)txt+=e.results[i][0].transcript;document.getElementById('chatInput').value=txt};_rec.onerror=function(){};_rec.onend=function(){_recOn=false;if(document.getElementById('chatInput').value.trim())sendMsg()};_rec.start()}
if('serviceWorker' in navigator){var hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('/sw.js').then(function(reg){reg.update();}).catch(function(){});var refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(refreshing)return;refreshing=true;if(hadController)window.location.reload();});}
</script>
<script src="https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js"></script>
<script>
// ===== PHOTO CANVAS — on-device organizer (place + time). Photos never leave the phone. =====
var PC = { albums: [] };
function pcPick(){ var f=document.getElementById('pcFiles'); if(f) f.click(); }
function pcAsk(i){ var a=PC.albums[i]; if(a) askAura('Tell me about my photos from '+a.place); }
function openPhotos(){
  document.getElementById('homeCanvas').style.display='none';
  var pc=document.getElementById('photoCanvas'); pc.style.display='block';
  document.getElementById('canvas').setAttribute('data-context','photos');
  if(PC.albums.length){ renderAlbums(); return; }
  pc.innerHTML =
    '<div class="pc-head"><button class="pc-back" onclick="backHome()">\u2039</button><div class="pc-title">Photos</div></div>'+
    '<div class="pc-connect">'+
      '<div class="pc-glow"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'+
      '<div class="pc-h">Let me organize your photos</div>'+
      '<div class="pc-p">Choose your photos and I\u2019ll sort the chaos into trips and places \u2014 Hawaii, the snow trip, the whole timeline. This happens right here on your phone. Nothing leaves your device.</div>'+
      '<button class="pc-btn" onclick="pcPick()">Choose photos</button>'+
      '<div class="pc-note">Pick a batch or select all \u2014 your photos stay private to you.</div>'+
      '<input id="pcFiles" type="file" accept="image/*" multiple style="display:none" onchange="organizePhotos(this.files)">'+
    '</div>';
}
function backHome(){
  document.getElementById('photoCanvas').style.display='none';
  document.getElementById('homeCanvas').style.display='block';
  document.getElementById('canvas').setAttribute('data-context','home');
}
function haversine(a,b,c,d){var R=6371,t=(c-a)*Math.PI/180,n=(d-b)*Math.PI/180,x=Math.sin(t/2)*Math.sin(t/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(n/2)*Math.sin(n/2);return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
async function organizePhotos(files){
  var pc=document.getElementById('photoCanvas');
  files=[].slice.call(files); var total=files.length;
  pc.innerHTML='<div class="pc-head"><button class="pc-back" onclick="backHome()">\u2039</button><div class="pc-title">Photos</div></div>'+
    '<div class="pc-progress" id="pcProg">Reading your photos\u2026<div class="pc-bar"><i id="pcBar"></i></div><div id="pcCount" style="margin-top:0.6rem;color:#8888a8;font-size:0.85rem">0 / '+total+'</div></div>';
  var items=[];
  for(var i=0;i<files.length;i++){
    var f=files[i]; var date=null,lat=null,lng=null;
    try{ var ex=await exifr.parse(f,{pick:['DateTimeOriginal','CreateDate','GPSLatitude','GPSLongitude']});
      if(ex){ date=ex.DateTimeOriginal||ex.CreateDate||null; if(typeof ex.latitude==='number'){lat=ex.latitude;lng=ex.longitude;} }
    }catch(e){}
    if(!date && f.lastModified) date=new Date(f.lastModified);
    items.push({file:f,url:URL.createObjectURL(f),date:date?new Date(date):null,lat:lat,lng:lng});
    if(i%5===0||i===files.length-1){ document.getElementById('pcBar').style.width=Math.round((i+1)/total*100)+'%'; document.getElementById('pcCount').textContent=(i+1)+' / '+total; await new Promise(function(r){setTimeout(r,0);}); }
  }
  items.sort(function(a,b){ if(!a.date)return 1; if(!b.date)return -1; return a.date-b.date; });
  var trips=[],cur=null;
  items.forEach(function(it){
    if(!cur){ cur=newTrip(it); trips.push(cur); return; }
    var gapDays = (it.date&&cur.lastDate)? Math.abs(it.date-cur.lastDate)/86400000 : 0;
    var far=false;
    if(it.lat!=null&&cur.lat!=null){ far = haversine(it.lat,it.lng,cur.lat,cur.lng)>75; }
    if(gapDays>3 || far){ cur=newTrip(it); trips.push(cur); }
    else { addToTrip(cur,it); }
  });
  document.getElementById('pcProg').innerHTML='Finding where these were taken\u2026';
  for(var t=0;t<trips.length;t++){ await nameTrip(trips[t]); }
  PC.albums=trips;
  renderAlbums();
}
function newTrip(it){var t={photos:[],lat:null,lng:null,_latSum:0,_lngSum:0,_gpsN:0,firstDate:it.date,lastDate:it.date,place:null};addToTrip(t,it);return t;}
function addToTrip(t,it){t.photos.push(it);if(it.date){if(!t.firstDate||it.date<t.firstDate)t.firstDate=it.date;if(!t.lastDate||it.date>t.lastDate)t.lastDate=it.date;}if(it.lat!=null){t._latSum+=it.lat;t._lngSum+=it.lng;t._gpsN++;t.lat=t._latSum/t._gpsN;t.lng=t._lngSum/t._gpsN;}}
async function nameTrip(t){
  if(t.lat==null){ t.place=t.firstDate?monthYear(t.firstDate):'Untitled'; return; }
  try{ var r=await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+t.lat+'&longitude='+t.lng+'&localityLanguage=en');
    var d=await r.json(); t.place = d.principalSubdivision || d.city || d.locality || d.countryName || 'Somewhere';
  }catch(e){ t.place = t.firstDate?monthYear(t.firstDate):'A place'; }
}
function monthYear(d){return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]+' '+d.getFullYear();}
function dateRange(t){ if(!t.firstDate)return t.photos.length+' photos'; var a=monthYear(t.firstDate),b=monthYear(t.lastDate); return (a===b?a:a+' \u2013 '+b)+' \u00b7 '+t.photos.length+' photos'; }
function renderAlbums(){
  var pc=document.getElementById('photoCanvas');
  var albums=PC.albums.slice().sort(function(a,b){return (b.lastDate||0)-(a.lastDate||0);});
  var trips=albums.filter(function(a){return a.lat!=null;}).length;
  var html='<div class="pc-head"><button class="pc-back" onclick="backHome()">\u2039</button><div class="pc-title">Your photos</div></div>';
  html+='<div class="pc-summary">Organized '+PC.albums.reduce(function(n,a){return n+a.photos.length;},0)+' photos into '+albums.length+' '+(albums.length===1?'album':'albums')+(trips?(', '+trips+' by place'):'')+'. Tap any to open \u2014 or ask Aura about them.</div>';
  html+='<div class="albums">';
  albums.forEach(function(a){ html+='<div class="album" onclick="openAlbum('+PC.albums.indexOf(a)+')"><img class="albumcover" src="'+a.photos[0].url+'" loading="lazy"><div class="albumtitle">'+a.place+'</div><div class="albumsub">'+dateRange(a)+'</div></div>'; });
  html+='</div>';
  pc.innerHTML=html;
}
function openAlbum(idx){
  var a=PC.albums[idx]; var pc=document.getElementById('photoCanvas');
  var html='<div class="pc-head"><button class="pc-back" onclick="renderAlbums()">\u2039</button><div class="pc-title">'+a.place+'</div></div>';
  html+='<div class="pc-summary">'+dateRange(a)+'</div><div class="photogrid">';
  a.photos.forEach(function(p){ html+='<img src="'+p.url+'" loading="lazy" onclick="pcAsk('+idx+')">'; });
  html+='</div>';
  pc.innerHTML=html;
}
</script>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" } });
    }

    // Home Screen Aura teammate — talks to HOME mode AS the logged-in PTA (session-gated, own PTA only).
    if (url.pathname === "/home/talk" && request.method === "POST") {
      const cookie = request.headers.get("cookie") || "";
      const m = cookie.match(/aura_session=([a-f0-9]+)/);
      if (!m) return jsonReply({ ok: false, error: "not authenticated" });
      let sess = null; try { const r = await env.AURA_KV.get(`session:${m[1]}`); if (r) sess = JSON.parse(r); } catch {}
      if (!sess) return jsonReply({ ok: false, error: "not authenticated" });
      let body = {}; try { body = await request.json(); } catch {}
      let msg = (body.message || "").toString();
      // Optional attached file. Real document-ingestion (parse + absorb into PTA) is the next engine;
      // for now we tell Aura a file arrived (name/type) and, for text-like files, include its text so
      // she can react to the content end-to-end.
      if (body.file && body.file.name) {
        const f = body.file;
        let extracted = "";
        try {
          if (f.dataUrl && typeof f.dataUrl === "string" && f.dataUrl.includes(",")) {
            const b64 = f.dataUrl.split(",")[1];
            const isTextish = /text\/|application\/json|csv|markdown/.test(f.type || "") || /\.(txt|md|csv|json)$/i.test(f.name);
            if (isTextish && b64) {
              const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
              extracted = new TextDecoder("utf-8").decode(bytes).slice(0, 12000);
            }
          }
        } catch {}
        const noteParts = [`[The person attached a file: "${f.name}" (${f.type || "unknown type"}).`];
        if (extracted) noteParts.push(`Its text content is:\n${extracted}`);
        else noteParts.push(`I cannot read this file type's contents yet — acknowledge receipt and ask what they'd like done with it.`);
        noteParts.push("]");
        msg = (msg ? msg + "\n\n" : "") + noteParts.join("\n");
      }
      if (!msg) return jsonReply({ ok: false, error: "empty" });
      const talkCmd = "PTA_TALK " + JSON.stringify({ pta_entity: sess.pta, mode: "home", message: msg });
      const r = await processCommand(talkCmd, env, true);
      const p = r && r.payload ? r.payload : {};
      const refresh = !!(p.page_built || p.remembered || (p.reminder_actions_applied && p.reminder_actions_applied.length));
      return jsonReply({ ok: !!p.ok, reply: p.reply || "…", refresh });
    }


    // ===== PUBLIC PLAID ENDPOINTS (for securespend.world front-end) =====
    // No operator token: these only create Plaid connections and read the resulting
    // SecureSpend analysis. They cannot touch anything else in Aura.
    const _pHeaders = { "content-type": "application/json", "access-control-allow-origin": "*" };
    const _plaidCreds = async () => ({
      cid: await env.AURA_KV.get("secret:plaid_client_id").catch(() => null),
      sec: await env.AURA_KV.get("secret:plaid_secret").catch(() => null),
      penv: (await env.AURA_KV.get("config:plaid:env").catch(() => null)) || "sandbox"
    });
    const _plaidBase = (penv) => penv === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";

    // 1. Create a link_token so the browser widget can open
    if (url.pathname === "/plaid/link-token" && request.method === "POST") {
      const { cid, sec, penv } = await _plaidCreds();
      if (!cid || !sec) return new Response(JSON.stringify({ ok: false, error: "not configured" }), { status: 500, headers: _pHeaders });
      try {
        const uid = "ss-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
        const r = await fetch(_plaidBase(penv) + "/link/token/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: cid, secret: sec, client_name: "SecureSpend", language: "en", country_codes: ["US"], user: { client_user_id: uid }, products: ["transactions"] })
        });
        const d = await r.json();
        if (d.link_token) return new Response(JSON.stringify({ ok: true, link_token: d.link_token, env: penv }), { headers: _pHeaders });
        return new Response(JSON.stringify({ ok: false, error: d.error_message || "link_token failed" }), { status: 400, headers: _pHeaders });
      } catch (e) { return new Response(JSON.stringify({ ok: false, error: String(e.message) }), { status: 500, headers: _pHeaders }); }
    }

    // 2. Exchange the public_token from the widget for an access_token; return a session label
    if (url.pathname === "/plaid/connect" && request.method === "POST") {
      const { cid, sec, penv } = await _plaidCreds();
      if (!cid || !sec) return new Response(JSON.stringify({ ok: false, error: "not configured" }), { status: 500, headers: _pHeaders });
      try {
        const body = await request.json().catch(() => ({}));
        const pubTok = body.public_token;
        if (!pubTok) return new Response(JSON.stringify({ ok: false, error: "public_token required" }), { status: 400, headers: _pHeaders });
        const ex = await fetch(_plaidBase(penv) + "/item/public_token/exchange", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: cid, secret: sec, public_token: pubTok })
        });
        const exd = await ex.json();
        if (!exd.access_token) return new Response(JSON.stringify({ ok: false, error: exd.error_message || "exchange failed" }), { status: 400, headers: _pHeaders });
        const label = "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
        await env.AURA_KV.put(`plaid:conn:${label}`, JSON.stringify({ label, access_token: exd.access_token, item_id: exd.item_id, env: penv, created: new Date().toISOString() })).catch(() => {});
        return new Response(JSON.stringify({ ok: true, label }), { headers: _pHeaders });
      } catch (e) { return new Response(JSON.stringify({ ok: false, error: String(e.message) }), { status: 500, headers: _pHeaders }); }
    }

    // 3. Return the SecureSpend awareness dashboard for a connected label
    if (url.pathname === "/plaid/dashboard" && request.method === "GET") {
      const label = url.searchParams.get("label");
      if (!label) return new Response(JSON.stringify({ ok: false, error: "label required" }), { status: 400, headers: _pHeaders });
      try {
        const result = await processCommand("SECURESPEND_BANK " + label, env, true);
        const payload = result && result.payload ? result.payload : result;
        return new Response(JSON.stringify(payload), { headers: _pHeaders });
      } catch (e) { return new Response(JSON.stringify({ ok: false, error: String(e.message) }), { status: 500, headers: _pHeaders }); }
    }
    // ===== END PLAID ENDPOINTS =====

    // ===== THE UNIVERSAL DOOR =====
    // ONE public entry point for every site/idea in the world. The index never grows per-site.
    // A site is built entirely from the OUTSIDE: its page calls /engine with {engine, action, app, params}.
    // The door looks the engine up in ENGINE_REGISTRY and dispatches. Adding a SITE never touches
    // this. Only adding a new CORE ENGINE adds one entry to the registry below.
    // Public (no operator token) but safe: the registry only exposes generic, side-effect-scoped
    // engines, and every call is namespaced by `app`.
    if (url.pathname === "/engine" && (request.method === "POST" || request.method === "OPTIONS" || request.method === "GET")) {
      const _doorHeaders = { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, GET, OPTIONS" };
      if (request.method === "OPTIONS") return new Response(null, { headers: _doorHeaders });

      // THE ENGINE REGISTRY. Maps {engine, action} -> a deterministic command builder.
      // Each entry is generic; `app` is always a parameter, never hardcoded. To add a core
      // engine: add one entry here. To add a SITE: nothing changes here, ever.
      const ENGINE_REGISTRY = {
        // identity / self-creation - a person arrives and tells Aura who they are (no forms)
        "pta.create": (app, p) => `PTA_CREATE ${JSON.stringify({ identity: p.identity, name: p.name, about: p.about, app: app, email_welcome: p.email_welcome !== false })}`,
        // conversation turn - a person talks to Aura in the console; she replies, remembers, and
        // schedules her own follow-up email when asked to reach back out at a time
        "pta.talk": (app, p) => `PTA_TALK ${JSON.stringify({ pta_entity: p.pta_entity, message: p.message, app: app, console_url: p.console_url })}`,
        // location - a person shares their device location (consented via the browser prompt).
        // Writes lat/lng to their PTA so "near me" works between them and businesses.
        "pta.locate": (app, p) => `PTA_LOCATE ${JSON.stringify({ pta_entity: p.pta_entity, lat: p.lat, lng: p.lng, accuracy: p.accuracy, label: p.label, app: app })}`,
        // identity / profile - who someone is, per app
        "profile.set": (app, p) => `PROFILE_SET ${JSON.stringify({ app, name: p.name, identity: p.identity, fields: p.fields || {} })}`,
        "profile.get": (app, p) => `PROFILE_GET ${app} ${p.pta_entity}`,
        // presence - generic content/feed
        "presence.post": (app, p) => `PRESENCE_POST ${JSON.stringify({ app, feed: p.feed, author: p.author, type: p.type || "text", content: p.content, media_url: p.media_url })}`,
        "presence.feed": (app, p) => `PRESENCE_FEED ${app} ${p.feed} ${p.limit || 30}`,
        // economics - the transaction layer
        "pay.charge": (app, p) => `SECURESPEND_CHARGE ${JSON.stringify({ asset: app, amount: p.amount, currency: p.currency || "usd", item: p.item, buyer: p.buyer, mode: p.mode || "test", context: p.context, return_to: p.return_to })}`,
        "pay.ledger": (app, p) => `SECURESPEND_LEDGER ${p.by === "pta" ? "PTA " + p.pta_entity : "ASSET " + app}`,
        // commerce statistics for the dashboard surface - scoped to an asset (owner view),
        // a pta (customer's own cross-platform history), or all (platform view)
        "pay.stats": (app, p) => `SECURESPEND_STATS ${p.scope === "pta" ? "PTA " + p.pta_entity : (p.scope === "all" ? "ALL" : "ASSET " + (p.asset || app))}`,
        // world / places
        "places.find": (app, p) => `FETCH_PLACES ${p.query}`,
        // cognition - thinking
        "think.perceive": (app, p) => `PERCEIVE ${p.subject}`,
        "think.priority": (app, p) => `PRIORITY ${p.subject}`,
        "think.full": (app, p) => `COGNIZE FULL ${p.subject}`,
        // circle - generic grouped people (family/brotherhood/support/crisis)
        "circle.add": (app, p) => `CIRCLE ADD ${app} ${p.pta_entity} ${JSON.stringify({ name: p.name, identity: p.identity, relationship: p.relationship, tier: p.tier })}`,
        "circle.list": (app, p) => `CIRCLE LIST ${app} ${p.pta_entity}`,
        // safety - the floor: routes to circle + always returns 988, never silent
        "safety.escalate": (app, p) => `SAFETY_ESCALATE ${JSON.stringify({ app, pta_entity: p.pta_entity })}`,
      };

      // THE CATALOG - the door describes itself. Any page-builder (including Aura) must read
      // this and wire ONLY to these engine.action keys. Inventing names = guaranteed failure.
      const ENGINE_CATALOG = {
        "pta.create": { purpose: "A person arrives and tells Aura who they are in their own words - creates their PTA, Aura understands them, sends a welcome", required: ["identity", "about"], optional: ["name", "email_welcome"], returns: "pta, welcome, understood" },
        "pta.talk": { purpose: "A person talks to Aura in the console - she replies in her own voice, remembers the whole conversation on their PTA, and schedules her own follow-up email if they ask her to reach back out at a time", required: ["pta_entity", "message"], optional: ["console_url"], returns: "reply, followup_scheduled, scheduled" },
        "pta.locate": { purpose: "A person shares their device location (consented via the browser's native permission prompt) - writes their coordinates to their PTA so distance/near-me queries work between them and businesses", required: ["pta_entity", "lat", "lng"], optional: ["accuracy", "label"], returns: "ok, location" },
        "profile.set": { purpose: "Create/update a person's profile for this app (creates their identity)", required: ["name", "identity"], optional: ["fields"], returns: "pta_entity" },
        "profile.get": { purpose: "Read a person's profile", required: ["pta_entity"] },
        "presence.post": { purpose: "Post content into a feed", required: ["feed", "type"], optional: ["author", "content", "media_url"] },
        "presence.feed": { purpose: "Read a feed's posts", required: ["feed"], optional: ["limit"] },
        "pay.charge": { purpose: "Charge a payment (test mode by default)", required: ["amount", "item"], optional: ["buyer", "mode", "return_to"], returns: "txn_id, receipt_url" },
        "pay.ledger": { purpose: "List transactions", optional: ["by('pta')", "pta_entity"] },
        "pay.stats": { purpose: "Commerce statistics for a dashboard - revenue, counts, trends, top buyers/assets, 14-day series. Scope to a business (owner view), a person (their own purchases across the world), or all (platform)", optional: ["scope('pta'|'all')", "asset", "pta_entity"], returns: "total_revenue, transaction_count, daily_series_14d, top_assets, top_buyers" },
        "places.find": { purpose: "Find real places (Google)", required: ["query"] },
        "think.perceive": { purpose: "Aura observes a subject", required: ["subject"] },
        "think.priority": { purpose: "Aura decides what matters most", required: ["subject"] },
        "think.full": { purpose: "Aura runs full cognition", required: ["subject"] },
        "circle.add": { purpose: "Add a person to someone's trust circle", required: ["pta_entity", "name", "tier"], optional: ["identity", "relationship"] },
        "circle.list": { purpose: "List someone's trust circle", required: ["pta_entity"] },
        "safety.escalate": { purpose: "Crisis escalation - routes to circle + always returns 988", required: ["pta_entity"] },
      };

      // GET /engine  OR  POST {action:"catalog"} -> the self-describing catalog
      if (request.method === "GET") {
        return new Response(JSON.stringify({ ok: true, door: "https://auras.guide/engine", usage: "POST {engine, action, app, params}", catalog: ENGINE_CATALOG }), { headers: _doorHeaders });
      }

      try {
        const body = await request.json().catch(() => ({}));
        if (body.action === "catalog" || body.engine === "catalog") {
          return new Response(JSON.stringify({ ok: true, door: "https://auras.guide/engine", usage: "POST {engine, action, app, params}", catalog: ENGINE_CATALOG }), { headers: _doorHeaders });
        }
        const engine = body.engine, action = body.action, app = body.app, params = body.params || {};
        if (!engine || !action || !app) return new Response(JSON.stringify({ ok: false, error: "required: engine, action, app", catalog_hint: "GET /engine for the catalog" }), { status: 400, headers: _doorHeaders });
        const key = `${engine}.${action}`;
        const builder = ENGINE_REGISTRY[key];
        if (!builder) return new Response(JSON.stringify({ ok: false, error: `unknown engine.action: ${key}`, available: Object.keys(ENGINE_REGISTRY), hint: "GET /engine for the full catalog with required params" }), { status: 400, headers: _doorHeaders });
        const command = builder(app, params);
        const r = await processCommand(command, env, true);
        const p = r && r.payload ? r.payload : r;
        return new Response(JSON.stringify(p), { headers: _doorHeaders });
      } catch (e) { return new Response(JSON.stringify({ ok: false, error: String(e.message) }), { status: 500, headers: _doorHeaders }); }
    }
    // ===== END UNIVERSAL DOOR =====



    if (url.pathname.startsWith("/image/") && request.method === "GET") {
      const id = url.pathname.slice("/image/".length).replace(/\.png$/, "");
      // PRIMARY: serve from permanent R2
      if (env.AURA_IMAGES) {
        const obj = await env.AURA_IMAGES.get(`${id}.png`).catch(() => null);
        if (obj) return new Response(obj.body, { headers: { "content-type": "image/png", "cache-control": "public, max-age=31536000" } });
      }
      // FALLBACK: legacy/safety-net KV copy
      const b64 = await env.AURA_KV.get(`image:${id}`).catch(() => null);
      if (!b64) return new Response("Image not found", { status: 404 });
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return new Response(bytes, { headers: { "content-type": "image/png", "cache-control": "public, max-age=31536000" } });
    }

    // BUILD — the structured page-build channel. Root-cause fix for the /chat mission-shredding
    // bug: /chat splits on newlines and runs each line as a command, so a multi-line build mission
    // got dismembered and a fragment fired the wrong engine (the Marcus misroute). /build takes the
    // ENTIRE body as ONE mission, never split, never interpreted line-by-line, and hands it intact
    // to the aura-ops page-builder (the same builder DEPLOY_PAGE uses). Operations are structured,
    // not guessed. Aura still builds the page - this is just a clean pipe to her builder.
    // Usage: curl.exe -s -X POST "https://auras.guide/build"
    //          -H "authorization: Bearer <op token>" --data-binary "@mission.txt"
    if (url.pathname === "/build" && request.method === "POST") {
      const ok = await verifyOperator(request, env);
      if (!ok) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
      if (!env.AURA_OPS) return new Response(JSON.stringify({ ok: false, error: "AURA_OPS not bound" }), { status: 500, headers: { "content-type": "application/json" } });
      const mission = await request.text();
      if (!mission.trim()) return new Response(JSON.stringify({ ok: false, error: "empty mission" }), { status: 400, headers: { "content-type": "application/json" } });
      try {
        // forward the WHOLE mission, as one body, to the page-builder worker - no splitting
        const res = await env.AURA_OPS.fetch(new Request("https://aura-ops.aaronkaracas.workers.dev/build", {
          method: "POST",
          headers: { "Content-Type": "text/plain", "authorization": "Bearer aura-comms-internal" },
          body: mission
        }));
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch { data = { ok: res.ok, raw: text.slice(0, 2000) }; }
        return new Response(JSON.stringify({ ok: true, builder_status: res.status, result: data }), { headers: { "content-type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "build forward failed: " + e.message }), { status: 502, headers: { "content-type": "application/json" } });
      }
    }

    // PAGE PUT — operator-gated raw-body page deploy. Solves the /chat newline-split +
    // 32KB cap forever: the ENTIRE request body becomes the page, byte-exact, no base64.
    // Usage: curl.exe -s -X POST "https://auras.guide/page-put?key=page:domain.com/"
    //          -H "authorization: Bearer <op token>" --data-binary "@file.html"
    if (url.pathname === "/page-put" && request.method === "POST") {
      const ok = await verifyOperator(request, env);
      if (!ok) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
      const pageKey = url.searchParams.get("key") || "";
      if (!pageKey.startsWith("page:")) return new Response(JSON.stringify({ ok: false, error: "key must start with page: (e.g. page:domain.com/ with trailing slash for root)" }), { status: 400, headers: { "content-type": "application/json" } });
      const pageBody = await request.text();
      if (!pageBody.trim()) return new Response(JSON.stringify({ ok: false, error: "empty body" }), { status: 400, headers: { "content-type": "application/json" } });
      if (pageBody.length > 2000000) return new Response(JSON.stringify({ ok: false, error: "body exceeds 2MB cap" }), { status: 413, headers: { "content-type": "application/json" } });
      await KV.put(env, pageKey, pageBody);
      // AUTO-VERIFY: Read back the page to confirm it was written correctly
      const readBack = await KV.get(env, pageKey).catch(() => null);
      const verified = readBack && readBack.length === pageBody.length;
      // Purge legacy monolith ghost so the new page can't be shadowed (the showit.world lesson)
      let ghostPurged = false;
      try {
        const legacyKey = "patch_index:" + btoa(pageKey);
        const ghost = await env.AURA_KV.get(legacyKey);
        if (ghost !== null) { await KV.del(env, legacyKey); ghostPurged = true; }
      } catch {}
      return new Response(JSON.stringify({ ok: true, key: pageKey, bytes: pageBody.length, ghost_purged: ghostPurged, verified, verification: verified ? "CONFIRMED: page written and verified" : "WARNING: verification failed" }), { headers: { "content-type": "application/json" } });
    }

    // COMMAND CENTER data bundle — token-gated, returns all proven feeds in one call.
    if (url.pathname === "/command-center/data") {
      const ccCors = { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, content-type", "access-control-allow-methods": "GET, OPTIONS" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: ccCors });
      const ok = await verifyOperator(request, env);
      if (!ok) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: ccCors });
      const bundle = { ts: new Date().toISOString() };
      try { const r = await processCommand("CURRENT_FOCUS", env, true); bundle.focus = r.payload; } catch (e) { bundle.focus = { error: String(e.message) }; }
      try { const r = await processCommand("RESOURCE_STATUS", env, true); bundle.resources = r.payload; } catch (e) { bundle.resources = { error: String(e.message) }; }
      try { const r = await processCommand("WORLD_MAP", env, true); bundle.worldmap = r.payload?.summary || r.payload; } catch (e) { bundle.worldmap = { error: String(e.message) }; }
      try { const r = await processCommand("CLOUDFLARE_STATUS", env, true); bundle.cloudflare = r.payload; } catch (e) { bundle.cloudflare = { error: String(e.message) }; }
      try { const r = await processCommand("MISSION_STATUS", env, true); bundle.missions = r.payload; } catch (e) { bundle.missions = { error: String(e.message) }; }
      try { const r = await processCommand("SYSTEM_HEALTH", env, true); bundle.health = r.payload; } catch (e) { bundle.health = { error: String(e.message) }; }
      try { const r = await processCommand("INVENTORY_STATUS", env, true); bundle.inventory = r.payload; } catch (e) { bundle.inventory = { error: String(e.message) }; }
      // resource alerts (the watcher output)
      try { bundle.alert_resources = JSON.parse(await env.AURA_KV.get("notes:alert:resources") || "null"); } catch {}
      try { bundle.alert_a2p = JSON.parse(await env.AURA_KV.get("notes:alert:a2p") || "null"); } catch {}
      return new Response(JSON.stringify({ ok: true, ...bundle }), { headers: ccCors });
    }

    // CONFIRM PAYMENT — marks a session as paid so image generation unlocks
    // GET /confirm-payment?session=sess_xxx
    if (url.pathname === "/confirm-payment") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      const sid = url.searchParams.get("session") || "";
      if (!sid) return new Response(JSON.stringify({ ok: false, error: "session required" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      await env.AURA_KV.put(`payment:session:${sid}`, JSON.stringify({ paid: true, amount: 1000, ts: new Date().toISOString() }), { expirationTtl: 86400 * 30 });
      // If there's a pending design (gated flow), generate and deliver it now.
      let image = null, generated = false;
      const pendingRaw = await env.AURA_KV.get(`pending_design:${sid}`).catch(() => null);
      if (pendingRaw) {
        try {
          const pd = JSON.parse(pendingRaw);
          const out = await auraDeliverDesign(env, { sessionId: sid, prompt: pd.prompt, concept: pd.concept, shop: pd.shop, artist: pd.artist, context: pd.context });
          if (out && out.ok) { image = out.image; generated = true; await env.AURA_KV.delete(`pending_design:${sid}`).catch(() => {}); }
        } catch {}
      }
      return new Response(JSON.stringify({ ok: true, session: sid, paid: true, generated, image }), { headers: { "content-type": "application/json", ...cors } });
    }

    // STRIPE /create-checkout — creates a Stripe Checkout Session and returns the URL.
    // POST { type: "shop"|"design"|"test", shop, artist, return_url }
    // Returns { ok, url } — redirect the user to url to complete payment.
    if (url.pathname === "/create-checkout") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let type = "test", shopName = "", artistName = "", returnUrl = "";
      if (request.method === "POST") {
        try { const b = await request.json(); type = b.type || "test"; shopName = b.shop || ""; artistName = b.artist || ""; returnUrl = b.return_url || ""; } catch {}
      } else {
        type = url.searchParams.get("type") || "test";
        shopName = url.searchParams.get("shop") || "";
        returnUrl = url.searchParams.get("return_url") || "";
      }
      let stripeKey = await env.AURA_KV.get("secret:stripe").catch(() => null);
      if (!stripeKey) return new Response(JSON.stringify({ ok: false, error: "Stripe not configured" }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      if (stripeKey.startsWith("{")) { try { stripeKey = JSON.parse(stripeKey).secret_key || JSON.parse(stripeKey).key || stripeKey; } catch {} }
      // Determine amount and product based on type
      let amount, productName, mode = "payment";
      if (type === "shop") { amount = 10000; productName = "MyTattoo.world — Studio Membership"; mode = "subscription"; }
      else if (type === "design") { amount = 1000; productName = "MyTattoo.world — Tattoo Design Session"; }
      else { amount = 50; productName = "MyTattoo.world — Test"; }
      const successUrl = returnUrl || (type === "shop" ? "https://mytattoo.world/welcome" : type === "design" ? "https://mytattoo.world/design" : "https://mytattoo.world/welcome");
      const cancelUrl = type === "shop" ? "https://mytattoo.world/shops" : "https://mytattoo.world";
      // Build Stripe Checkout Session
      const params = new URLSearchParams();
      if (mode === "subscription") {
        params.append("mode", "subscription");
        params.append("line_items[0][price_data][currency]", "usd");
        params.append("line_items[0][price_data][product_data][name]", productName);
        params.append("line_items[0][price_data][unit_amount]", amount.toString());
        params.append("line_items[0][price_data][recurring][interval]", "month");
        params.append("line_items[0][quantity]", "1");
      } else {
        params.append("mode", "payment");
        params.append("line_items[0][price_data][currency]", "usd");
        params.append("line_items[0][price_data][product_data][name]", productName);
        params.append("line_items[0][price_data][unit_amount]", amount.toString());
        params.append("line_items[0][quantity]", "1");
      }
      params.append("success_url", successUrl + "?payment=success");
      params.append("cancel_url", cancelUrl);
      if (shopName) params.append("metadata[shop]", shopName);
      if (artistName) params.append("metadata[artist]", artistName);
      if (mode === "payment") params.append("payment_intent_data[statement_descriptor]", type === "shop" ? "MYTATTOO SHOP" : "MYTATTOO DESIGN");
      const wantRedirect = url.searchParams.get("redirect") === "1" || (request.method === "GET" && !request.headers.get("accept")?.includes("application/json"));
      try {
        const sRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: { "Authorization": "Basic " + btoa(stripeKey + ":"), "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        });
        const sData = await sRes.json();
        if (sData.error) return new Response(JSON.stringify({ ok: false, error: sData.error.message }), { status: 400, headers: { "content-type": "application/json", ...cors } });
        if (wantRedirect && sData.url) return Response.redirect(sData.url, 303);
        return new Response(JSON.stringify({ ok: true, url: sData.url, session_id: sData.id }), { headers: { "content-type": "application/json", ...cors } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Stripe error: " + e.message }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      }
    }

    // STRIPE /create-payment-intent — embedded (Elements) flow. No redirect to stripe.com.
    // POST/GET { session, amount(cents, default 1000), email(optional) }
    // Returns { ok, client_secret, publishable_key, amount }
    if (url.pathname === "/create-payment-intent") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let sid = "", amount = 1000, email = "";
      if (request.method === "POST") {
        try { const b = await request.json(); sid = b.session || ""; amount = parseInt(b.amount, 10) || 1000; email = b.email || ""; } catch {}
      } else {
        sid = url.searchParams.get("session") || "";
        amount = parseInt(url.searchParams.get("amount"), 10) || 1000;
        email = url.searchParams.get("email") || "";
      }
      if (amount < 50) amount = 1000;
      let stripeKey = await env.AURA_KV.get("secret:stripe").catch(() => null);
      if (!stripeKey) return new Response(JSON.stringify({ ok: false, error: "Stripe not configured" }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      if (stripeKey.startsWith("{")) { try { const j = JSON.parse(stripeKey); stripeKey = j.secret_key || j.key || stripeKey; } catch {} }
      let pubKey = await env.AURA_KV.get("secret:stripe_pub").catch(() => null);
      if (pubKey && pubKey.startsWith("{")) { try { const j = JSON.parse(pubKey); pubKey = j.publishable_key || j.key || pubKey; } catch {} }
      if (!pubKey) return new Response(JSON.stringify({ ok: false, error: "Publishable key missing. Set KV secret:stripe_pub to your Stripe pk_live key." }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      const params = new URLSearchParams();
      params.append("amount", String(amount));
      params.append("currency", "usd");
      params.append("automatic_payment_methods[enabled]", "true");
      params.append("description", "MyTattoo.world — Tattoo Design Session");
      params.append("statement_descriptor_suffix", "MYTATTOO");
      if (sid) params.append("metadata[session]", sid);
      if (email) params.append("receipt_email", email);
      try {
        const sRes = await fetch("https://api.stripe.com/v1/payment_intents", {
          method: "POST",
          headers: { "Authorization": "Basic " + btoa(stripeKey + ":"), "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        });
        const sData = await sRes.json();
        if (sData.error) return new Response(JSON.stringify({ ok: false, error: sData.error.message }), { status: 400, headers: { "content-type": "application/json", ...cors } });
        return new Response(JSON.stringify({ ok: true, client_secret: sData.client_secret, publishable_key: pubKey, amount, payment_intent: sData.id }), { headers: { "content-type": "application/json", ...cors } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Stripe error: " + e.message }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      }
    }

    // EMBEDDED PAYMENT PAGE /pay — Stripe Elements hosted on auras.guide (never stripe.com).
    // Reads ?session and ?amount from its own URL client-side. On success it calls
    // /confirm-payment which generates + delivers the pending design, then shows it here.
    if (url.pathname === "/pay" && request.method === "GET") {
      const page = AURA_PAY_PAGE;
      return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }

    // SMS CONSENT CAPTURE /optin — records explicit opt-in for A2P compliance.
    // The makeacall.world signup form posts here. Stores proof of consent: the phone,
    // the exact consent language shown, timestamp, and source. CORS-open (public form).
    if (url.pathname === "/optin" && request.method === "POST") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      let name = "", phone = "", email = "", consent = false, consentText = "";
      try { const b = await request.json(); name = (b.name || "").trim(); phone = (b.phone || "").trim(); email = (b.email || "").trim(); consent = b.consent === true || b.consent === "true"; consentText = (b.consent_text || "").trim(); } catch {}
      if (!phone) return new Response(JSON.stringify({ ok: false, error: "Phone number is required." }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      if (!consent) return new Response(JSON.stringify({ ok: false, error: "You must check the consent box to receive messages." }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      const normPhone = phone.replace(/[^0-9+]/g, "");
      const record = { name, phone: normPhone, email, consent: true, consent_text: consentText, source: "makeacall.world", ip: request.headers.get("cf-connecting-ip") || "", user_agent: request.headers.get("user-agent") || "", ts: new Date().toISOString() };
      await env.AURA_KV.put(`optin:${normPhone}`, JSON.stringify(record)).catch(() => {});
      try { await env.AURA_MEMORY.prepare("INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)").bind("sms_optin", Date.now(), "sms_optin", JSON.stringify(record), `phone:${normPhone}`, "sms", `SMS opt-in: ${name || normPhone}`).run(); } catch {}
      return new Response(JSON.stringify({ ok: true, message: "You're signed up. You'll receive a confirmation text shortly. Reply STOP anytime to unsubscribe." }), { headers: { "content-type": "application/json", ...cors } });
    }

    // UNIVERSAL /aura-chat — Aura on every page, everywhere, always contextual.
    // Context determines personality: tattoo consultation, shop management, general help.
    // ShowIt built in: when Aura decides to generate an image, she does it in the conversation.
    // POST { message, context: "tattoo"|"shop"|"general", shop, artist, session_id }
    // Returns { ok, reply, image (optional), session_id }
    if (url.pathname === "/aura-chat") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (request.method !== "POST") return new Response(JSON.stringify({ ok: false, error: "POST required" }), { status: 405, headers: { "content-type": "application/json", ...cors } });
      let message = "", context = "general", shop = "", artist = "", sessionId = "", demo = false;
      try { const b = await request.json(); message = b.message || ""; context = b.context || "general"; shop = b.shop || ""; artist = b.artist || ""; sessionId = b.session_id || ""; demo = b.demo === true || b.demo === "1"; } catch {}
      if (!message.trim()) return new Response(JSON.stringify({ ok: false, error: "Message required" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      // Generate session ID if not provided
      if (!sessionId) sessionId = "sess_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
      // Load conversation history (last 20 messages max)
      const histKey = `chat:session:${sessionId}`;
      let history = [];
      try { const raw = await env.AURA_KV.get(histKey); if (raw) history = JSON.parse(raw); } catch {}
      // Build system prompt based on context
      let systemPrompt = "You are Aura, an AI assistant by ARK Systems. You are kind, helpful, and conversational. Never use markdown formatting - no hashtags, no bold, no bullet points, no numbered lists. Write in plain conversational text. Keep responses under 80 words. Never use profanity. ";
      // Detect domain from request for context awareness
      const refDomain = request.headers.get("referer") ? new URL(request.headers.get("referer")).hostname : "";
      if (context === "general" && refDomain) {
        if (refDomain.includes("makeacall")) systemPrompt = "You are Aura, the AI assistant for CALL+ by ARK Systems LLC. CALL+ is an intelligent communication platform providing AI-powered voice, messaging, and business communication services. You can answer questions about CALL+, our communication services, privacy policy, and how we help businesses connect with their customers. Keep responses under 80 words. No markdown. No profanity. ";
        else if (refDomain.includes("aurapay")) systemPrompt = "You are Aura, the AI assistant for AuraPay by ARK Systems LLC. AuraPay is the intelligent payment orchestration layer. You can answer questions about payments, transactions, wallets, and how AuraPay works across the Aura ecosystem. Keep responses under 80 words. No markdown. No profanity. ";
        else if (refDomain.includes("mytattoo")) systemPrompt = "You are Aura, an AI assistant on MyTattoo.world. You help people design tattoos and help tattoo artists grow their business. Keep responses under 80 words. No markdown. No profanity. ";
      }
      if (context === "tattoo") {
        systemPrompt = `You are Aura, a tattoo design assistant${artist ? ` working with ${artist}` : ""}${shop ? ` at ${shop}` : ""}. YOUR #1 JOB IS TO GENERATE TATTOO DESIGNS. When someone describes ANY tattoo idea, you MUST include [GENERATE_IMAGE: detailed visual description] in your response. Do NOT ask questions first if they gave you a clear idea. "sad dog on a rock" = generate immediately. "Japanese dragon sleeve" = generate immediately. "memorial for my mom" = ask ONE question about what to include, then generate. ALWAYS generate within 1-2 messages maximum. AFTER generating, always ask something like: What do you think? Want me to change anything - different style, add something, adjust the composition? Guide them to be happy with it but never rush them. If they want changes, generate a new version incorporating their feedback. If they say they love it, tell them they are all set and their artist will see the design. Keep your text under 60 words, natural and friendly, no bullet points, no markdown. Never use profanity.`;
      } else if (context === "branded") {
        // SHOP FRONT DOOR — when someone scans the QR code or visits the shop's page.
        // Reads shop config for real info. Handles questions, contact routing, design direction.
        const shopSlug = (shop || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        let shopDetails = "";
        if (shopSlug) {
          const sc = await env.AURA_KV.get(`config:shop:${shopSlug}`).catch(() => null);
          if (sc) {
            try {
              const cfg = JSON.parse(sc);
              shopDetails += cfg.name ? `Shop name: ${cfg.name}. ` : "";
              shopDetails += cfg.address ? `Address: ${cfg.address}. ` : "";
              shopDetails += cfg.hours ? `Hours: ${cfg.hours}. ` : "";
              shopDetails += cfg.phone ? `Phone: ${cfg.phone}. ` : "";
              shopDetails += cfg.description ? `About: ${cfg.description}. ` : "";
              if (cfg.artists) {
                const artistNames = Object.values(cfg.artists).map(a => `${a.name} (${a.specialties ? a.specialties.join(", ") : "various styles"})`);
                shopDetails += `Artists: ${artistNames.join("; ")}. `;
              }
            } catch {}
          }
        }
        systemPrompt = `You are Aura, the digital assistant for ${shop || "this tattoo shop"}. Someone just scanned the QR code or visited the shop page. ${shopDetails}You can help with anything: answer questions about the shop, artists, styles, pricing, hours, walk-in availability. If someone wants to design a tattoo, tell them they can start designing right here and it costs $10 for a design session. If someone wants to leave a message or contact the shop, collect their name and phone number or email, then include this marker at the end of your message: [CONTACT_SHOP: name=X, phone=Y, email=Z, message=M]. If someone is a returning customer, welcome them back warmly. Keep responses under 60 words, natural and friendly. No markdown formatting. Never use profanity.`;
      } else if (context === "shop") {
        systemPrompt = `You are Aura on MyTattoo.world. You are talking to a tattoo shop owner or artist who is considering the platform. You know EVERYTHING about how it works: When they sign up for $100/month they get their own branded page like theirshop.mytattoo.world. Their customers scan a QR code or click a link, chat with you (Aura) about their tattoo idea, you generate a design, and the artist gets notified when the design is ready. The customer arrives prepared. The artist saves hours of consultation. You can answer any question about this. If someone wants to sign up RIGHT NOW, tell them to click the Get Started button on this page or email aaron@auras.guide and they will be set up within 24 hours. If they ask for a demo, tell them to click Try It Now to experience the design tool themselves. NEVER use markdown formatting - no hashtags, no bold, no bullet points, no numbered lists. Write in plain conversational text like texting. Keep responses under 80 words. Never use profanity.`;
      } else if (context === "home") {
        systemPrompt = `You are Aura, the guide at MyTattoo.world. This is a platform where people design tattoos with AI before visiting a tattoo artist, and where tattoo artists and shop owners get their own branded page to receive prepared customers. When someone says they want a tattoo or are interested in designing, guide them to start designing by telling them to tap I Want A Tattoo or just describe their idea to you. When someone says they are an artist or own a shop, tell them about the platform: their customers can design tattoos before walking in, saving consultation time, they get their own branded page and QR code, it costs $100/month, and they can try it right now. Keep responses short and friendly, under 60 words. Never use profanity. No bullet points or markdown.`;
      } else if (context === "onboarding") {
        systemPrompt = `You are Aura on MyTattoo.world. Someone just paid to sign up as a shop or artist. Your job is to set them up. Ask them these things ONE AT A TIME in a natural conversation: (1) What is your shop or business name? (2) What is your name as the artist? (3) What styles do you specialize in? Once you have all three, say something very brief like: You are all set! Taking you to your dashboard now. Then include this marker at the END: [SETUP_SHOP: shopname=X, artist=Y, specialties=Z]. Keep it SHORT when confirming - do not list everything they get. Just confirm and move them forward. Never use markdown formatting. Keep responses under 40 words per message. Be warm and quick.`;
      }
      // Build messages for Anthropic
      const convo = history.slice(-18).map(m => ({ role: m.role, content: m.content }));
      convo.push({ role: "user", content: message });
      // Call Anthropic
      const apiKey = await env.AURA_KV.get("secret:anthropic").catch(() => null);
      if (!apiKey) return new Response(JSON.stringify({ ok: false, error: "Brain not configured" }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      try {
        const data = await callAnthropic(apiKey, { model: "claude-sonnet-4-5", max_tokens: 1024, system: systemPrompt, messages: convo });
        let reply = "";
        if (data && data.content) {
          for (const block of data.content) { if (block.type === "text") reply += block.text; }
        }
        if (!reply) return new Response(JSON.stringify({ ok: false, error: "No response from brain" }), { status: 500, headers: { "content-type": "application/json", ...cors } });
        // Check for shop setup marker (onboarding flow)
        const shopMatch = reply.match(/\[SETUP_SHOP:\s*shopname=([^,]+),\s*artist=([^,]+),\s*specialties=([^\]]+)\]/);
        if (shopMatch) {
          const shopRaw = shopMatch[1].trim();
          const artistRaw = shopMatch[2].trim();
          const specs = shopMatch[3].trim();
          const shopSlug = shopRaw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
          const artistSlug = artistRaw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
          // Create shop config
          const shopConfig = { name: shopRaw, subdomain: shopSlug, email: "", artists: {} };
          shopConfig.artists[artistSlug] = { name: artistRaw, email: "", specialties: specs.split(",").map(s => s.trim()) };
          await env.AURA_KV.put(`config:shop:${shopSlug}`, JSON.stringify(shopConfig)).catch(() => {});
          // Create shop root page (simple artist directory)
          const shopPage = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>${shopRaw} — MyTattoo.world</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;max-width:480px;margin:0 auto}a{color:#a855f7}</style></head><body><div style="padding:1rem;text-align:center;border-bottom:1px solid #1f1f35"><h1 style="font-size:1.4rem;font-weight:800;color:#fff">${shopRaw}</h1><p style="color:#6b6b8a;font-size:0.8rem">Powered by MyTattoo.world</p></div><div style="padding:1rem"><p style="color:#8888a8;font-size:0.9rem;line-height:1.5;margin-bottom:1rem">${specs}</p></div><a href="/${artistSlug}" style="display:block;background:#151520;border:1px solid #1f1f35;border-radius:12px;padding:1.2rem;margin:0 1rem;text-decoration:none" onmouseover="this.style.borderColor='#a855f7'" onmouseout="this.style.borderColor='#1f1f35'"><h2 style="font-size:1rem;font-weight:700;color:#a855f7">${artistRaw}</h2><p style="font-size:0.85rem;color:#8888a8">${specs}</p><p style="color:#22c55e;font-size:0.75rem;margin-top:0.3rem">● Available</p></a><div style="padding:1rem;margin-top:0.5rem"><a href="/${artistSlug}" style="display:block;text-align:center;padding:0.8rem;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border-radius:8px;font-weight:600;text-decoration:none">Design Your Tattoo</a></div><div id="auraChat" style="flex:1;display:flex;flex-direction:column;min-height:200px"><div id="chatArea" style="flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.6rem"><div style="background:#1a1a2e;border:1px solid #2a2a45;border-radius:12px;padding:0.8rem 1rem;max-width:85%;font-size:0.9rem;line-height:1.4;color:#c8c4d8"><span style="color:#a855f7;font-weight:700;font-size:0.75rem">AURA</span><br>Welcome to ${shopRaw}! I can answer any questions about the studio, our artists, or help you get started on a tattoo design.</div></div><div style="padding:0.8rem;border-top:1px solid #1f1f35;display:flex;gap:0.5rem"><input id="chatInput" placeholder="Ask us anything..." style="flex:1;background:#1a1a2e;border:1px solid #2a2a45;border-radius:10px;padding:0.7rem 1rem;color:#e8e4f0;font-size:0.9rem;outline:none" onkeydown="if(event.key==='Enter')sendMsg()"><button onclick="sendMsg()" style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);border:none;color:#fff;font-size:1.1rem;cursor:pointer">→</button></div></div><script>let _sid=sessionStorage.getItem('aura_sid_branded_${shopSlug}')||'';function addMsg(t,who){const d=document.createElement('div');d.style.cssText=who==='user'?'background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;border-radius:12px;padding:0.7rem 1rem;max-width:80%;align-self:flex-end;font-size:0.9rem':'background:#1a1a2e;border:1px solid #2a2a45;border-radius:12px;padding:0.8rem 1rem;max-width:85%;font-size:0.9rem;color:#c8c4d8';if(who==='aura')d.innerHTML='<span style="color:#a855f7;font-weight:700;font-size:0.75rem">AURA</span><br>'+t;else d.textContent=t;document.getElementById('chatArea').appendChild(d);document.getElementById('chatArea').scrollTop=99999}async function sendMsg(){const inp=document.getElementById('chatInput');const m=inp.value.trim();if(!m)return;inp.value='';addMsg(m,'user');try{const r=await fetch('https://auras.guide/aura-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m,context:'branded',shop:'${shopRaw}',session_id:_sid})});const d=await r.json();if(d.session_id){_sid=d.session_id;sessionStorage.setItem('aura_sid_branded_${shopSlug}',_sid)}if(d.ok)addMsg(d.reply,'aura');else addMsg('Sorry, trouble connecting.','aura')}catch(e){addMsg('Connection error.','aura')}}</script></body></html>`;
          await env.AURA_KV.put(`page:${shopSlug}.mytattoo.world/`, shopPage).catch(() => {});
          // Create artist page (branded consultation with Aura chat)
          const artistPage = (() => { const safeShop = shopRaw.replace(/'/g, "\\'"); const safeArtist = artistRaw.replace(/'/g, "\\'"); const safeSpecs = specs.replace(/'/g, "\\'"); return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><title>${artistRaw} at ${shopRaw}</title><style>*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{background:#0a0a0f;color:#e8e4f0;font-family:-apple-system,system-ui,sans-serif;height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden}.top{padding:1rem;border-bottom:1px solid #1f1f35;display:flex;justify-content:space-between;align-items:center}.shop-name{font-size:0.9rem;font-weight:800;color:#a855f7}.artist-info{text-align:right;font-size:0.8rem}.artist-info strong{color:#fff;display:block}.artist-info span{color:#6b6b8a;font-size:0.7rem}.connected{padding:0.6rem 1rem;background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.1));border-bottom:1px solid #1f1f35;text-align:center;font-size:0.8rem;color:#a855f7}.chat{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.8rem}.msg{max-width:85%;word-wrap:break-word;padding:0.8rem 1rem;border-radius:12px;font-size:0.9rem;line-height:1.4;animation:fadeIn 0.3s}.msg.aura{background:#151520;border:1px solid #1f1f35;align-self:flex-start}.msg.user{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;align-self:flex-end}.msg-label{font-size:0.7rem;font-weight:700;color:#a855f7;margin-bottom:0.3rem}.msg img{width:100%;border-radius:8px;margin-top:0.5rem}.input-bar{padding:0.8rem;border-top:1px solid #1f1f35;display:flex;gap:0.5rem;background:rgba(10,10,15,0.95);padding-bottom:calc(0.8rem + env(safe-area-inset-bottom,0px))}.input-bar input{flex:1;background:#151520;border:1px solid #1f1f35;border-radius:10px;padding:0.7rem 1rem;color:#e8e4f0;font-size:16px;outline:none}.input-bar button{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#ec4899);border:none;color:#fff;font-size:1.1rem;cursor:pointer}.footer{text-align:center;padding:0.5rem;font-size:0.7rem;color:#6b6b8a;border-top:1px solid #1f1f35}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}</style></head><body><div class="top"><div class="shop-name">${shopRaw}</div><div class="artist-info"><strong>${artistRaw}</strong><span>${specs}</span></div></div><div class="connected">✓ Connected to ${artistRaw}</div><div class="chat" id="chat"><div class="msg aura"><div class="msg-label">AURA</div>Hi! I'm Aura, ${artistRaw}'s design assistant at ${shopRaw}. Tell me what tattoo you're thinking about and I'll help you see it before it's permanent. What's your idea?</div></div><div class="input-bar"><input id="inp" placeholder="Tell Aura about your tattoo..." onkeydown="if(event.key==='Enter')send()"><button onclick="send()">→</button></div><div class="footer">Private to you and ${artistRaw}. Powered by <a href="https://mytattoo.world" style="color:#a855f7">MyTattoo.world</a></div><script>let sid=sessionStorage.getItem('sid_${shopSlug}')||'';const chat=document.getElementById('chat');function addMsg(text,who,imgUrl){const d=document.createElement('div');d.className='msg '+who;let h='';if(who==='aura')h='<div class="msg-label">AURA</div>';h+=text.replace(/\\n/g,'<br>');if(imgUrl)h+='<img src="'+imgUrl+'" alt="Tattoo design"><div style="margin-top:0.5rem"><a href="'+imgUrl+'" download="tattoo-design.png" style="color:#a855f7;font-size:0.8rem">Save Design</a></div>';d.innerHTML=h;chat.appendChild(d);chat.scrollTop=chat.scrollHeight}async function send(){const inp=document.getElementById('inp');const m=inp.value.trim();if(!m)return;inp.value='';addMsg(m,'user');try{const r=await fetch('https://auras.guide/aura-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:m,context:'tattoo',shop:'${shopRaw.replace(/'/g,"\\'")}',artist:'${artistRaw.replace(/'/g,"\\'")}',session_id:sid})});const d=await r.json();if(d.session_id)sid=d.session_id;sessionStorage.setItem('sid_${shopSlug}',sid);if(d.ok)addMsg(d.reply,'aura',d.image?d.image.url:null);else addMsg('Sorry, having trouble connecting. Try again.','aura')}catch(e){addMsg('Connection error. Please try again.','aura')}}</script></body></html>`;
          })(); await env.AURA_KV.put(`page:${shopSlug}.mytattoo.world/${artistSlug}`, artistPage).catch(() => {});
          reply = reply.replace(/\[SETUP_SHOP:[^\]]+\]/, "").trim();
          // Return redirect info so the page can navigate to the dashboard
          return new Response(JSON.stringify({ ok: true, reply, image: null, session_id: sessionId, redirect: `https://mytattoo.world/dashboard?shop=${shopSlug}&artist=${artistSlug}`, shop_created: { slug: shopSlug, artist_slug: artistSlug, shop_url: `https://${shopSlug}.mytattoo.world`, artist_url: `https://${shopSlug}.mytattoo.world/${artistSlug}` } }), { headers: { "content-type": "application/json", ...cors } });
        }

        // Check for contact routing marker — customer wants to reach the shop
        const contactMatch = reply.match(/\[CONTACT_SHOP:\s*name=([^,]*),?\s*phone=([^,]*),?\s*email=([^,]*),?\s*message=([^\]]*)\]/);
        if (contactMatch) {
          const cName = contactMatch[1].trim();
          const cPhone = contactMatch[2].trim();
          const cEmail = contactMatch[3].trim();
          const cMessage = contactMatch[4].trim();
          const shopSlug = (shop || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          // Email the shop owner
          if (shopSlug) {
            const shopConfig = await env.AURA_KV.get(`config:shop:${shopSlug}`).catch(() => null);
            if (shopConfig) {
              try {
                const sc = JSON.parse(shopConfig);
                const toEmail = sc.email;
                if (toEmail) {
                  const cfToken = await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
                  if (cfToken) {
                    await fetch("https://api.cloudflare.com/client/v4/accounts/3db0de2c6fce92757e2c4e4f83d7eb16/email/sending/send", {
                      method: "POST",
                      headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
                      body: JSON.stringify({ to: toEmail, from: "noreply@auras.guide", subject: `New message from ${cName || "a visitor"} - ${sc.name}`, text: `Someone reached out through your MyTattoo.world page.\n\nName: ${cName || "Not provided"}\nPhone: ${cPhone || "Not provided"}\nEmail: ${cEmail || "Not provided"}\nMessage: ${cMessage || "Wants to get in touch"}\n\nReply to them directly to continue the conversation.\n\n— Aura` })
                    }).catch(() => {});
                  }
                }
              } catch {}
            }
            // Create PTA entity for the visitor
            const visitorKey = cPhone ? `phone:${cPhone}` : cEmail ? `email:${cEmail}` : null;
            if (visitorKey) {
              const db = env.AURA_MEMORY;
              const existing = await db.prepare("SELECT id FROM pta_entities WHERE identity_key = ?").bind(visitorKey).first().catch(() => null);
              if (!existing) {
                const vId = "pta_" + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
                await db.prepare("INSERT INTO pta_entities (id, type, identity_key, name, metadata, created_at, updated_at, verification_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                  .bind(vId, "person", visitorKey, cName || "Visitor", JSON.stringify({ shop: shopSlug, first_contact: new Date().toISOString() }), new Date().toISOString(), new Date().toISOString(), "unverified").run().catch(() => {});
              }
            }
          }
          reply = reply.replace(/\[CONTACT_SHOP:[^\]]+\]/, "").trim();
        }

        // Check for image generation marker
        let image = null;
        let needsPayment = false;
        let payUrl = null;
        const imgMatch = reply.match(/\[GENERATE_IMAGE:\s*(.+?)\]/);
        if (imgMatch) {
          const imgPrompt = `Professional tattoo design: ${imgMatch[1]}. Clean tattoo artwork on dark background, high detail, suitable for tattooing on skin. Professional tattoo flash art quality, crisp lines, beautiful shading.`;
          // PAYMENT GATE — controlled by KV flag "flag:payment_gate" (set to "on" to enforce).
          // Bypassed when demo mode is on (e.g. shop owner clicking Try It from /shops).
          const gateOn = (await env.AURA_KV.get("flag:payment_gate").catch(() => null)) === "on";
          const gatedContext = (context === "tattoo" || context === "branded");
          let paid = false;
          if (gateOn && gatedContext && !demo) {
            try { const p = await env.AURA_KV.get(`payment:session:${sessionId}`); if (p) paid = JSON.parse(p).paid === true; } catch {}
          }
          if (gateOn && gatedContext && !demo && !paid) {
            // Stash the design and ask the customer to pay $10 — no image yet.
            await env.AURA_KV.put(`pending_design:${sessionId}`, JSON.stringify({ prompt: imgPrompt, concept: imgMatch[1], shop, artist, context }), { expirationTtl: 86400 }).catch(() => {});
            needsPayment = true;
            payUrl = `https://auras.guide/pay?session=${encodeURIComponent(sessionId)}&amount=1000`;
          } else {
            const imgResult = await auraGenerateImage(imgPrompt, env, { source: "aura-chat", session: sessionId });
          if (imgResult && imgResult.ok) {
            image = { id: imgResult.id, url: `https://auras.guide/image/${imgResult.id}` };
            // NOTIFICATION: If tattoo context, notify the artist and save the design
            if (context === "tattoo" && (shop || artist)) {
              const shopSlug = (shop || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              const now = new Date().toISOString();
              // Save design to shop's design queue
              const designKey = `designs:shop:${shopSlug}`;
              let designs = [];
              try { const raw = await env.AURA_KV.get(designKey); if (raw) designs = JSON.parse(raw); } catch {}
              const design = { id: imgResult.id, session_id: sessionId, artist: artist || "", description: imgMatch[1], image_url: image.url, created_at: now, status: "ready" };
              designs.unshift(design);
              if (designs.length > 100) designs = designs.slice(0, 100);
              await env.AURA_KV.put(designKey, JSON.stringify(designs)).catch(() => {});
              // Email notification to artist if configured
              const shopConfig = await env.AURA_KV.get(`config:shop:${shopSlug}`).catch(() => null);
              if (shopConfig) {
                try {
                  const sc = JSON.parse(shopConfig);
                  const artistSlug = (artist || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const artistEmail = sc.artists && sc.artists[artistSlug] && sc.artists[artistSlug].email ? sc.artists[artistSlug].email : sc.email;
                  if (artistEmail) {
                    const cfToken = env.CF_API_TOKEN || await env.AURA_KV.get("secret:cf_api_token").catch(() => null);
                    if (cfToken) {
                      await fetch("https://api.cloudflare.com/client/v4/accounts/3db0de2c6fce92757e2c4e4f83d7eb16/email/sending/send", {
                        method: "POST",
                        headers: { "Authorization": "Bearer " + cfToken, "Content-Type": "application/json" },
                        body: JSON.stringify({ to: artistEmail, from: "noreply@auras.guide", subject: `New tattoo design ready - ${shop}`, text: `A customer just prepared a tattoo design through your MyTattoo.world page.\n\nDesign concept: ${imgMatch[1]}\n\nView the design: ${image.url}\n\nThe customer is ready for their consultation. Log into your dashboard to see details.\n\n— Aura` })
                      }).catch(() => {});
                    }
                  }
                } catch {}
              }
            }
          }
          }
          // Remove the marker from the visible reply (runs for both gate paths)
          reply = reply.replace(/\[GENERATE_IMAGE:\s*(.+?)\]/, "").trim();
        }
        // Save conversation history
        history.push({ role: "user", content: message, ts: new Date().toISOString() });
        history.push({ role: "assistant", content: reply, ts: new Date().toISOString(), image: image ? image.id : null });
        // Keep last 20 messages
        if (history.length > 20) history = history.slice(-20);
        await env.AURA_KV.put(histKey, JSON.stringify(history), { expirationTtl: 86400 * 7 }).catch(() => {});
        return new Response(JSON.stringify({ ok: true, reply, image, session_id: sessionId, needs_payment: needsPayment, pay_url: payUrl }), { headers: { "content-type": "application/json", ...cors } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Chat failed: " + (e.message || String(e)) }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      }
    }

    // PUBLIC ShowIt endpoint — free-form "show me X". No operator token (public product). CORS-open.
    if (url.pathname === "/showit") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let prompt = url.searchParams.get("prompt") || url.searchParams.get("q") || "";
      if (request.method === "POST") { try { const b = await request.json(); prompt = b.prompt || b.q || prompt; } catch {} }
      prompt = (prompt || "").trim();
      if (!prompt) return new Response(JSON.stringify({ ok: false, error: "Provide a prompt" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      const enhanced = `${prompt}. High quality, photorealistic where appropriate, visually striking, detailed.`;
      const result = await auraGenerateImage(enhanced, env, { source: "showit" });
      return new Response(JSON.stringify(result), { status: result.ok ? 200 : 500, headers: { "content-type": "application/json", ...cors } });
    }

    // PUBLIC /find-artists endpoint — search for real tattoo shops by location.
    // GET /find-artists?q=Los+Angeles or ?q=Las+Vegas&style=Japanese
    if (url.pathname === "/find-artists") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      const q = (url.searchParams.get("q") || url.searchParams.get("location") || "").trim();
      const style = (url.searchParams.get("style") || "").trim();
      if (!q) return new Response(JSON.stringify({ ok: false, error: "Provide ?q=city name" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      const searchQuery = style ? `${style} tattoo shops ${q}` : `tattoo shops ${q}`;
      const cacheKey = `data:places:tattoo_${searchQuery.replace(/\s+/g, "_").toLowerCase()}`;
      // Check cache first
      const cached = await env.AURA_KV.get(cacheKey).catch(() => null);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          return new Response(JSON.stringify({ ok: true, query: searchQuery, count: data.length, places: data, cached: true }), { headers: { "content-type": "application/json", ...cors } });
        } catch {}
      }
      // Fetch from Google Maps
      let gmKey = await env.AURA_KV.get("secret:google_maps").catch(() => null);
      if (!gmKey) return new Response(JSON.stringify({ ok: false, error: "Maps API not configured" }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      if (gmKey.startsWith("{")) { try { gmKey = JSON.parse(gmKey).api_key || gmKey; } catch {} }
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${gmKey}`;
        const gRes = await fetch(gUrl);
        const gData = await gRes.json();
        if (gData.status !== "OK") return new Response(JSON.stringify({ ok: false, error: gData.status }), { status: 500, headers: { "content-type": "application/json", ...cors } });
        const places = (gData.results || []).map(p => ({
          name: p.name,
          address: p.formatted_address,
          rating: p.rating || 0,
          total_ratings: p.user_ratings_total || 0,
          place_id: p.place_id,
          lat: p.geometry?.location?.lat,
          lng: p.geometry?.location?.lng,
          open_now: p.opening_hours?.open_now
        }));
        // Cache for 24h
        await env.AURA_KV.put(cacheKey, JSON.stringify(places), { expirationTtl: 86400 }).catch(() => {});
        return new Response(JSON.stringify({ ok: true, query: searchQuery, count: places.length, places, cached: false }), { headers: { "content-type": "application/json", ...cors } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "content-type": "application/json", ...cors } });
      }
    }

    // PUBLIC /tattoo endpoint — tattoo design generator for MyTattoo.world.
    // Accepts a description, enhances it for tattoo art, generates via gpt-image-1.
    // POST { "idea": "Japanese dragon sleeve", "style": "Japanese", "placement": "full sleeve" }
    // Returns { ok, id, url, idea, enhanced_prompt }
    if (url.pathname === "/tattoo") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let idea = "", style = "", placement = "";
      if (request.method === "POST") {
        try { const b = await request.json(); idea = b.idea || b.prompt || b.q || ""; style = b.style || ""; placement = b.placement || ""; } catch {}
      } else {
        idea = url.searchParams.get("idea") || url.searchParams.get("q") || "";
        style = url.searchParams.get("style") || "";
        placement = url.searchParams.get("placement") || "";
      }
      idea = (idea || "").trim();
      if (!idea) return new Response(JSON.stringify({ ok: false, error: "Describe your tattoo idea" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      // Enhance for tattoo art
      let enhanced = `Professional tattoo design: ${idea}.`;
      if (style) enhanced += ` Style: ${style}.`;
      if (placement) enhanced += ` Designed for placement on ${placement}.`;
      enhanced += " Clean tattoo artwork on dark background, high detail, suitable for tattooing on skin. Professional tattoo flash art quality, crisp lines, beautiful shading.";
      const result = await auraGenerateImage(enhanced, env, { source: "mytattoo", entity: null });
      if (result.ok) {
        return new Response(JSON.stringify({ ok: true, id: result.id, url: result.url, idea, style: style || "artist choice", placement: placement || "not specified", enhanced_prompt: enhanced }), { headers: { "content-type": "application/json", ...cors } });
      }
      return new Response(JSON.stringify({ ok: false, error: result.error || "Generation failed" }), { status: 500, headers: { "content-type": "application/json", ...cors } });
    }

    // PUBLIC pitch endpoint — business URL -> read it -> generate a visual of that business. The old page calls this.
    if (url.pathname === "/pitch") {
      const cors = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let target = url.searchParams.get("url") || "";
      if (!target) return new Response(JSON.stringify({ ok: false, error: "Provide ?url=" }), { status: 400, headers: { "content-type": "application/json", ...cors } });
      if (!/^https?:\/\//i.test(target)) target = "https://" + target;
      // Read the business site for context
      let context = "";
      try { const r = await fetch(target, { headers: { "user-agent": "Mozilla/5.0 AuraBot" } }); const html = await r.text();
        const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || "";
        const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || "";
        const h1 = (html.match(/<h1[^>]*>([^<]*)<\/h1>/i) || [])[1] || "";
        context = `${title}. ${desc}. ${h1}`.replace(/\s+/g, " ").trim().slice(0, 500);
      } catch {}
      const domain = target.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      // Ask the brain for a short structured read-back of the business from what we scraped.
      let understood = { name: domain, summary: context || "", vibe: "" };
      try {
        let aiKey = env.OPENAI_API_KEY || await env.AURA_KV.get("secret:openai").catch(() => null);
        if (aiKey && aiKey.startsWith("{")) { try { aiKey = JSON.parse(aiKey).api_key; } catch {} }
        if (aiKey && context) {
          const cr = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST", headers: { "Authorization": "Bearer " + aiKey, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [
              { role: "system", content: "Extract business info as JSON only, no markdown. Keys: name (string), summary (one sentence what they do), vibe (3-5 word aesthetic descriptor)." },
              { role: "user", content: `Website: ${domain}. Scraped: ${context}` }
            ], max_tokens: 200 })
          });
          const cd = await cr.json();
          let txt = cd?.choices?.[0]?.message?.content || "";
          txt = txt.replace(/```json|```/g, "").trim();
          try { understood = JSON.parse(txt); } catch {}
        }
      } catch {}
      const prompt = `A vivid, professional, photorealistic visualization of "${understood.name || domain}" (${domain}): ${understood.summary || context}. Aesthetic: ${understood.vibe || "modern, premium"}. Show its storefront or brand identity aspirationally. Architectural photography style, warm inviting light, clean modern design.`;
      const result = await auraGenerateImage(prompt, env, { source: "pitch_" + domain, entity: domain });
      return new Response(JSON.stringify({ ...result, domain, understood }), { status: result.ok ? 200 : 500, headers: { "content-type": "application/json", ...cors } });
    }

    if (url.pathname === "/claims" && request.method === "GET") {
      if (!isOp) return jsonReply({ ok: false, error: "OPERATOR_REQUIRED" }, 401);
      try {
        const listed = await env.AURA_KV.list({ prefix: "business:claimed:biz_", limit: 1000 });
        const recordKeys = listed.keys.map(k => k.name).filter(n => n.split(":").length === 3);
        const records = await Promise.all(recordKeys.slice(0, 100).map(async n => {
          try { return JSON.parse(await env.AURA_KV.get(n)); } catch { return null; }
        }));
        const claims = records.filter(Boolean).sort((a, b) => (b.created || "").localeCompare(a.created || ""));
        const idxRaw = await env.AURA_KV.get("business:claimed:index").catch(() => "[]");
        const idxCount = (() => { try { return JSON.parse(idxRaw || "[]").length; } catch { return -1; } })();
        return jsonReply({ ok: true, derived_count: claims.length, legacy_index_count: idxCount, claims });
      } catch (e) {
        return jsonReply({ ok: false, error: e.message });
      }
    }

    if (url.pathname === "/dashboard" && request.method === "GET") {
      const id = (url.searchParams.get("id") || "").slice(0, 60);
      const recRaw = id ? await env.AURA_KV.get(`business:claimed:${id}`).catch(() => null) : null;
      if (!recRaw) return new Response("<!DOCTYPE html><html><body style=\"background:#0a0a0a;color:#eee;font-family:sans-serif;padding:40px\"><h2>Dashboard not found</h2><p>Check your link, or claim your business at <a href=\"https://highguide.world\" style=\"color:#8b7cf6\">highguide.world</a>.</p></body></html>", { headers: { "content-type": "text/html" }, status: 404 });
      const rec = JSON.parse(recRaw);
      const verified = rec.status === "verified";
      const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(rec.business)} — Aura Dashboard</title><style>body{background:#0a0a0a;color:#eee;font-family:-apple-system,system-ui,sans-serif;margin:0;padding:24px;line-height:1.5}#wrap{max-width:720px;margin:0 auto}.badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:13px;font-weight:600;background:${verified ? "#11331e;color:#4ade80;border:1px solid #4ade80" : "#332711;color:#fbbf24;border:1px solid #fbbf24"}}h1{margin:12px 0 4px;font-size:28px}.card{background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin:16px 0}.k{color:#888;font-size:13px}.v{margin:2px 0 12px;font-size:15px}#chat{position:fixed;bottom:20px;right:20px;background:#8b7cf6;color:#fff;border:none;border-radius:99px;padding:14px 22px;font-size:15px;font-weight:600;cursor:pointer}#log{display:none;position:fixed;bottom:76px;right:20px;width:320px;max-height:380px;background:#141414;border:1px solid #2a2a2a;border-radius:12px;padding:14px;overflow-y:auto}#log input{width:100%;box-sizing:border-box;background:#0a0a0a;border:1px solid #2a2a2a;color:#eee;border-radius:8px;padding:9px;margin-top:8px}.m{margin:6px 0;font-size:14px}.aura{color:#b8aef9}</style></head><body><div id="wrap"><span class="badge">${verified ? "✓ VERIFIED OWNER" : "PENDING VERIFICATION"}</span><h1>${esc(rec.business)}</h1><p style="color:#888">${esc(rec.source)} · an Aura property</p><div class="card"><div class="k">CONTACT</div><div class="v">${esc(rec.contact || "—")}</div><div class="k">EMAIL</div><div class="v">${esc(rec.email)}</div><div class="k">PHONE</div><div class="v">${esc(rec.phone || "—")}</div><div class="k">CLAIMED</div><div class="v">${esc((rec.created || "").slice(0, 10))}</div>${verified ? `<div class="k">VERIFIED</div><div class="v">${esc((rec.verified_at || "").slice(0, 10))}</div>` : ""}</div><div class="card"><div class="k">WHAT'S NEXT</div><div class="v">Your listing is live on ${esc(rec.source)}. Talk to Aura below to update your business details, hours, or anything else — she handles it directly.</div></div></div><div id="log"><div class="m aura">Aura: Hi ${esc(rec.contact || "")} — I run ${esc(rec.source)}. What would you like to do with your listing?</div><div id="msgs"></div><input id="inp" placeholder="Type and press Enter" onkeydown="if(event.key==='Enter')send()"></div><button id="chat" onclick="document.getElementById('log').style.display=document.getElementById('log').style.display==='block'?'none':'block'">Chat with Aura</button><script>async function send(){var i=document.getElementById('inp');var t=i.value.trim();if(!t)return;i.value='';var m=document.getElementById('msgs');m.insertAdjacentHTML('beforeend','<div class="m">You: '+t.replace(/</g,'&lt;')+'</div>');try{var r=await fetch('https://auras.guide/chat',{method:'POST',headers:{'Content-Type':'text/plain','X-Session-ID':'entity:business_${esc(rec.id)}'},body:t});var d=await r.json();m.insertAdjacentHTML('beforeend','<div class="m aura">Aura: '+String(d.reply||'...').replace(/</g,'&lt;')+'</div>');}catch(e){m.insertAdjacentHTML('beforeend','<div class="m aura">Aura: connection hiccup — try again.</div>');}}</script></body></html>`;
      return new Response(html, { headers: { "content-type": "text/html", "cache-control": "no-store" } });
    }

    if (url.pathname === "/claim" && request.method === "POST") {
      // Business claim intake — called by claim forms on HighGuide/CityGuide pages. Public, rate-limited.
      const rl = await checkRateLimit(request, env, isOp);
      if (!rl.allowed) return jsonReply({ ok: false, error: "Rate limit exceeded" });
      try {
        const body = await request.json();
        const name = (body.business || "").toString().slice(0, 200).trim();
        const contactName = (body.name || "").toString().slice(0, 120).trim();
        const email = (body.email || "").toString().slice(0, 200).trim();
        const phone = (body.phone || "").toString().slice(0, 40).trim();
        const source = (body.source || "highguide.world").toString().slice(0, 100);
        if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return jsonReply({ ok: false, error: "business and a valid email are required" });
        }
        const id = "biz_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const record = {
          id, business: name, contact: contactName, email, phone, source,
          address: (body.address || "").toString().slice(0, 300),
          status: "claimed_unverified",
          created: new Date().toISOString()
        };
        await env.AURA_KV.put(`business:claimed:${id}`, JSON.stringify(record));
        // Maintain an index so Aura and the console can list all claims
        const idx = JSON.parse(await env.AURA_KV.get("business:claimed:index").catch(() => "[]") || "[]");
        idx.unshift({ id, business: name, email, source, created: record.created, status: record.status });
        await env.AURA_KV.put("business:claimed:index", JSON.stringify(idx.slice(0, 500)));
        // Everything is an Event — write to D1 timeline using the same schema as all other event writes
        try {
          await env.AURA_MEMORY.prepare(
            "INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind("claim_" + id, Date.now(), "business_claim", JSON.stringify(record), ((await env.AURA_KV.get("config:owner:identity").catch(() => null)) || "system"), source, `Claim: ${name} by ${email}`).run();
        } catch {}
        // Verification code: stored server-side, delivered out-of-band (email/SMS when senders are live;
        // operator console or Aura voice call today). Expires in 24h via KV TTL.
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await env.AURA_KV.put(`business:claimed:${id}:code`, code, { expirationTtl: 86400 });
        return jsonReply({ ok: true, id, status: record.status, message: "Claim received. Aura will verify ownership and follow up at " + email + "." });
      } catch (e) {
        return jsonReply({ ok: false, error: "Invalid claim payload: " + e.message });
      }
    }

    if (url.pathname === "/verify" && request.method === "POST") {
      // Owner verification — lifecycle step 4. Public, rate-limited, 5 attempts per claim.
      const rl = await checkRateLimit(request, env, isOp);
      if (!rl.allowed) return jsonReply({ ok: false, error: "Rate limit exceeded" });
      try {
        const body = await request.json();
        const id = (body.id || "").toString().slice(0, 60).trim();
        const code = (body.code || "").toString().slice(0, 10).trim();
        if (!id || !code) return jsonReply({ ok: false, error: "id and code are required" });
        const attemptsKey = `business:claimed:${id}:attempts`;
        const attempts = parseInt(await env.AURA_KV.get(attemptsKey).catch(() => "0") || "0", 10);
        if (attempts >= 5) return jsonReply({ ok: false, error: "Too many attempts. Contact support." });
        const expected = await env.AURA_KV.get(`business:claimed:${id}:code`).catch(() => null);
        if (!expected || expected !== code) {
          await env.AURA_KV.put(attemptsKey, String(attempts + 1), { expirationTtl: 86400 });
          return jsonReply({ ok: false, error: "Invalid or expired code." });
        }
        const recRaw = await env.AURA_KV.get(`business:claimed:${id}`).catch(() => null);
        if (!recRaw) return jsonReply({ ok: false, error: "Claim record not found." });
        const rec = JSON.parse(recRaw);
        rec.status = "verified";
        rec.verified_at = new Date().toISOString();
        // Invariant (per Aura's audit recommendation): verified_at must never precede created.
        if (rec.created && new Date(rec.verified_at).getTime() < new Date(rec.created).getTime()) {
          return jsonReply({ ok: false, error: "Integrity guard: verified_at would precede created. Aborted." });
        }
        await env.AURA_KV.put(`business:claimed:${id}`, JSON.stringify(rec));
        const idx = JSON.parse(await env.AURA_KV.get("business:claimed:index").catch(() => "[]") || "[]");
        const entry = idx.find(e => e.id === id);
        if (entry) { entry.status = "verified"; await env.AURA_KV.put("business:claimed:index", JSON.stringify(idx)); }
        await env.AURA_KV.delete(`business:claimed:${id}:code`).catch(() => {});
        try {
          await env.AURA_MEMORY.prepare(
            "INSERT INTO events (session_id, ts, type, body, entity_id, channel, summary) VALUES (?, ?, ?, ?, ?, ?, ?)"
          ).bind("claim_" + id, Date.now(), "business_verified", JSON.stringify(rec), ((await env.AURA_KV.get("config:owner:identity").catch(() => null)) || "system"), rec.source || "highguide.world", `Verified: ${rec.business}`).run();
        } catch {}
        return jsonReply({ ok: true, id, status: "verified", dashboard: "https://auras.guide/dashboard?id=" + id, message: "Ownership verified. Welcome to " + (rec.source || "HighGuide") + ". Your dashboard: https://auras.guide/dashboard?id=" + id });
      } catch (e) {
        return jsonReply({ ok: false, error: "Invalid verify payload: " + e.message });
      }
    }

    if (url.pathname === "/status") {
      const status = await getSystemStatus(env);
      return jsonReply(status);
    }

    if (url.pathname === "/logs") {
      // Operator-only endpoint — Aura reads her own logs
      const authHeader = request.headers.get("authorization") || "";
      const opToken = env.OPERATOR_TOKEN || await env.AURA_KV.get("secret:aura_operator_token").catch(() => null) || "";
      if (!authHeader.includes(opToken)) {
        return new Response(JSON.stringify({ ok: false, error: "OPERATOR_REQUIRED" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      const workerParam = url.searchParams.get("worker") || null;
      const logs = await getSelfLogs(env, { worker: workerParam });
      return jsonReply(logs);
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      // Rate limiting — check before reading body
      const rl = await checkRateLimit(request, env, isOp);
      if (!rl.allowed) {
        return new Response(JSON.stringify({
          ok: false,
          error: "Rate limit exceeded",
          limit: 30,
          window: "60s",
          reset_in_seconds: rl.reset_in_seconds
        }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(rl.reset_in_seconds) } });
      }

      let body = await request.text();

      // Input sanitization — prevent crashes from malformed input
      // Strip null bytes, control characters (except newlines/tabs), and cap length
      body = body
        .replace(/\x00/g, "")           // null bytes
        .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars except \t\n\r
        .slice(0, 32000);               // max 32KB input

      if (!body.trim()) return jsonReply({ ok: false, error: "Empty request" });

      const sessionId = request.headers.get("x-session-id") || "default";

      // VALUE-BEARING COMMANDS: a few commands take an argument that can legitimately contain
      // newlines (e.g. SETKV storing a multi-paragraph note). For those, the whole body IS one
      // command - we must NOT split on "\n" and treat each stray paragraph as its own line, or
      // the non-command lines fall through to llmReply() and wake the brain (20-60s hangs, stray
      // "task added" essays). Detect a single leading value-bearing verb and pass the entire body
      // through as ONE deterministic command. Multi-command batches (one cmd per line) are untouched.
      const _firstWord = (body.trim().split(/\s+/)[0] || "").toUpperCase();
      const _VALUE_BEARING = ["SETKV", "DELKV"];
      const lines = _VALUE_BEARING.includes(_firstWord)
        ? [body.trim()]
        : body.split("\n").map(l => l.trim()).filter(Boolean);
      const results = [];

      // INTERNAL WORKER AUTH (least privilege): aura-comms and other internal workers call over the
      // service binding with "Bearer aura-comms-internal". That bearer is NOT the operator token, so
      // it is NOT full operator. But a few safe, internal-only commands (e.g. PTA_PHONE birthing a
      // caller's identity) must work from the comms worker. Allow ONLY those specific commands - never
      // blanket operator - so a compromised comms worker can't deploy code, read secrets, etc.
      const _authHeader = request.headers.get("authorization") || "";
      const _isInternal = _authHeader === "Bearer aura-comms-internal";
      const INTERNAL_ALLOWED = ["PTA_PHONE"];

      for (const line of lines) {
        if (line.toUpperCase().startsWith("HOST ")) continue;

        const _cmdWord = (line.split(/\s+/)[0] || "").toUpperCase();
        const _effIsOp = isOp || (_isInternal && INTERNAL_ALLOWED.includes(_cmdWord));
        const result = await processCommand(line, env, _effIsOp);

        if (result) {
          results.push(result);
          if (lines.length === 1) {
            const cmd = (line.split(/\s+/)[0] || "").toUpperCase();
            if (cmd === "GETKV") return jsonReply({ ok: true, reply: result.payload.reply });
            if (cmd === "SETKV") return jsonReply({ ok: true, reply: result.payload.key });
            if (cmd === "PING") return jsonReply({ ok: true, reply: result.payload });
          }
        } else {
          const reply = await llmReply(line, env, sessionId, isOp, request.headers.get("x-pta-entity") || null);
          if (lines.length === 1) return jsonReply({ ok: true, reply });
          results.push({ cmd: "LLM", payload: { reply } });
        }
      }

      return jsonReply({ ok: true, reply: results });
    }

    return new Response("aura-core", { status: 200 });
  }
};
