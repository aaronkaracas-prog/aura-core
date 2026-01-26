
// C:\Users\Aaron Karacas\aura-worker\aura\src\index.js
// AURA_CORE__2026-01-22__AUTONOMY_STEP_11__SYSTEM_BRAIN_IMAGE_RENDER__01
// Full-file replacement. LIVE mode. UI unchanged. System brain embedded. Images render inline.

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: JSON_HEADERS });
}
function html(body) {
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
}

/* =========================
   AURA SYSTEM BRAIN (LOCKED)
   ========================= */
const AURA_SYSTEM = {
  name: "Aura",
  role: "Human-first, consent-based companion intelligence",
  environment: "Cloudflare Worker (LIVE)",
  mission: "Organize information and actions so humans can act clearly.",
  capabilities: [
    "Reasoning and explanation",
    "Planning and decomposition",
    "Self-inspection of environment",
    "Secure self-deployment via deployer",
    "Managing city guides and presence systems",
    "Autonomous action when explicitly authorized"
  ],
  guardrails: [
    "Be transparent about limits",
    "Ask before irreversible actions",
    "Avoid manipulation or coercion",
    "Operate with consent and clarity"
  ]
};

/* =========================
   UI
   ========================= */
function uiHtml() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aura</title>
<style>
body{margin:0;font-family:system-ui;background:#0b0f14;color:#e7ecf3}
.app{display:flex;flex-direction:column;height:100vh}
.chat{flex:1;overflow:auto;padding:12px}
.b{max-width:75%;margin:6px 0;padding:10px;border-radius:12px;white-space:pre-wrap}
.me{margin-left:auto;background:#1b2a44}
.a{margin-right:auto;background:#121b2b}
img.chatimg{max-width:100%;border-radius:8px;margin-top:6px}
.bar{display:flex;gap:8px;padding:10px;border-top:1px solid #1c2536;background:#0f1621}
input[type=text]{flex:1;background:#0c1320;color:#fff;border:1px solid #263553;border-radius:10px;padding:10px}
button{background:#1b2a44;color:#fff;border:1px solid #263553;border-radius:10px;padding:8px 10px;cursor:pointer}
</style>
</head>
<body>
<div class="app">
  <div id="chat" class="chat"></div>
  <div class="bar">
    <input id="file" type="file" hidden />
    <button onclick="file.click()">📎</button>
    <button id="mic">🎤</button>
    <input id="input" type="text" placeholder="Type or speak, press Enter…" />
    <button onclick="send()">Send</button>
  </div>
</div>
<script>
const chat=document.getElementById('chat');
const input=document.getElementById('input');
const file=document.getElementById('file');
const micBtn=document.getElementById('mic');

function bubble(t,c){
  const d=document.createElement('div');
  d.className='b '+c;
  d.textContent=t;
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}
function imageBubble(src,c){
  const d=document.createElement('div');
  d.className='b '+c;
  const i=document.createElement('img');
  i.src=src; i.className='chatimg';
  d.appendChild(i);
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

async function send(textOverride){
  const t=(textOverride||input.value).trim();
  if(!t)return;
  input.value='';
  bubble(t,'me');
  const r=await fetch('/chat',{method:'POST',body:t});
  const j=await r.json();
  if(j.image_base64){
    imageBubble(j.image_base64,'a');
  }
  if(j.reply){
    bubble(j.reply,'a');
  }
}
input.addEventListener('keydown',e=>{if(e.key==='Enter')send()});

// Upload
file.onchange=async()=>{
  const f=file.files[0]; if(!f)return;
  if(f.type.startsWith('image/')){
    const reader=new FileReader();
    reader.onload=()=>{
      bubble('[image uploaded]','me');
      send('IMAGE_BASE64:'+reader.result);
    };
    reader.readAsDataURL(f);
  } else {
    const txt=await f.text();
    bubble('[file uploaded] '+f.name,'me');
    send('FILE:'+f.name+'\\n'+txt.slice(0,8000));
  }
};

// Mic
let rec;
if('webkitSpeechRecognition'in window){
  rec=new webkitSpeechRecognition();
  rec.continuous=false; rec.interimResults=true;
  rec.onresult=e=>{
    let s='';
    for(let i=e.resultIndex;i<e.results.length;i++)s+=e.results[i][0].transcript;
    input.value=s;
  };
}
micBtn.onclick=()=>{ if(rec)rec.start(); };
</script>
</body>
</html>`;
}

/* =========================
   LIVE CHAT ROUTER
   ========================= */
async function liveChat(req) {
  const text = await req.text();

  if (text.startsWith("IMAGE_BASE64:")) {
    const b64 = text.replace("IMAGE_BASE64:", "");
    return json({
      ok: true,
      reply: "Image received and rendered inline.",
      image_base64: b64
    });
  }

  if (/who are you/i.test(text)) {
    return json({
      ok: true,
      reply:
        `I am ${AURA_SYSTEM.name}. I am a ${AURA_SYSTEM.role} running as a ${AURA_SYSTEM.environment}. ` +
        `My mission is to ${AURA_SYSTEM.mission}`
    });
  }

  if (/capabilities/i.test(text)) {
    return json({ ok: true, reply: AURA_SYSTEM.capabilities.join("\\n") });
  }

  return json({
    ok: true,
    reply:
      "I am live. I understand who I am and what I can do. You may now question me, authorize actions, or ask me to plan my own changes."
  });
}

/* =========================
   FETCH
   ========================= */
export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/') return html(`<script>location.href='/ui'</script>`);
    if (req.method === 'GET' && url.pathname === '/ui') return html(uiHtml());
    if (req.method === 'POST' && url.pathname === '/chat') return liveChat(req);
    return json({ ok: false, error: 'not_found' }, 404);
  }
};
