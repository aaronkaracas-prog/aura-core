
(function(){
  const UI_VERSION = 'UI_PATCH__20260215_2A__CHATGPT_SHELL';

  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const statusEl = document.getElementById('status');
  const metaEl = document.getElementById('meta');
  const buildEl = document.getElementById('build');
  const stampEl = document.getElementById('stamp');
  const localEl = document.getElementById('localtime');
  const uiVerEl = document.getElementById('uiver');
  const hostLabel = document.getElementById('hostLabel');
  const titleEl = document.getElementById('title');
  const projList = document.getElementById('projList');
  const attachBtn = document.getElementById('attachBtn');
  const micBtn = document.getElementById('micBtn');

  // MIC_SUBSYSTEM_WIRED_V1
  let micState = 'idle';           // idle | recording
  let micStream = null;            // MediaStream
  let micLastError = null;         // { name, message } or null

  async function micStart(){
    micLastError = null;
    try{
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        micLastError = { name:'UNSUPPORTED', message:'navigator.mediaDevices.getUserMedia missing' };
        addBubble('sys', 'Mic FAIL: UNSUPPORTED', true);
        return;
      }
      micStream = await navigator.mediaDevices.getUserMedia({ audio:true });
      micState = 'recording';
      addBubble('sys', 'Mic OK: stream acquired (recording state set).', false);
    }catch(e){
      micLastError = { name:(e && e.name ? e.name : 'ERROR'), message:(e && e.message ? e.message : String(e)) };
      micState = 'idle';
      addBubble('sys', 'Mic FAIL: ' + micLastError.name + ' â€” ' + micLastError.message, true);
    }
  }

  function micStop(){
    try{
      if(micStream && micStream.getTracks){
        micStream.getTracks().forEach(t=>{ try{ t.stop(); }catch(_){} });
      }
    }catch(_){}
    micStream = null;
    micState = 'idle';
    addBubble('sys', 'Mic stopped.', false);
  }
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayMsg = document.getElementById('overlayMsg');
  const overlayClose = document.getElementById('overlayClose');

  function showOverlay(title, msg){
    if(!overlay) return;
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
  }
  function hideOverlay(){
    if(!overlay) return;
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }

  if(overlayClose) overlayClose.addEventListener('click', hideOverlay);
  if(overlay) overlay.addEventListener('click', (e)=>{ if(e.target === overlay) hideOverlay(); });

  if(attachBtn){
    attachBtn.addEventListener('click', ()=>{
      showOverlay('Attach', 'File upload is next. This is the UI shell step ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no upload logic yet.');
    });
  }
  if(micBtn){
    micBtn.addEventListener('click', async ()=>{
      addBubble('sys', 'Mic click (handler live).', false);
      if(micState === 'recording'){
        micStop();
      }else{
        await micStart();
      }
    });
  }

  if(uiVerEl) uiVerEl.textContent = UI_VERSION;

  let activeHost = 'auras.guide';
  let activeName = 'Aura Core';

  function nowLocal(){
    try { return new Date().toLocaleString(); } catch(e){ return String(new Date()); }
  }
  localEl.textContent = nowLocal();
  setInterval(()=>{ localEl.textContent = nowLocal(); }, 1000);

  function setStatus(t, isError){
    statusEl.textContent = t;
    if(isError){
      metaEl.classList.add('statusErr');
      statusEl.style.color = 'var(--bad)';
    }else{
      metaEl.classList.remove('statusErr');
      statusEl.style.color = 'var(--text)';
    }
  }

  function addBubble(kind, text, isErr){
    const d = document.createElement('div');
    d.className = 'bubble ' + kind + (isErr ? ' err' : '');
    d.textContent = text;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
  }

  async function postChat(raw){
    const r = await fetch('/chat', {
      method:'POST',
      headers:{ 'content-type':'text/plain; charset=utf-8' },
      body: raw
    });
    const txt = await r.text();
    try { return JSON.parse(txt); } catch(e){ return { ok:false, reply: txt }; }
  }

  function normalizeInputForHost(userText){
    const s = String(userText || '');
    const trimmed = s.trim();
    if(!trimmed) return '';
    if (/^HOSTs+/m.test(trimmed)) return trimmed;
    return 'HOST ' + activeHost + '
' + trimmed;
  }

  async function pullBuild(){
    try{
      const res = await postChat('HOST ' + activeHost + '
SHOW_BUILD');
      if(res && res.ok && res.reply && res.reply.build){
        buildEl.textContent = res.reply.build;
        stampEl.textContent = res.reply.stamp || '';
      }else{
        buildEl.textContent = 'unknown';
        stampEl.textContent = '';
      }
    }catch(e){
      buildEl.textContent = 'unknown';
      stampEl.textContent = '';
    }
  }

  async function runSend(){
    const raw = input.value;
    const trimmed = String(raw || '').trim();
    if(!trimmed) return;

    addBubble('me', trimmed, false);
    input.value = '';

    sendBtn.disabled = true;
    setStatus('Working', false);

    try{
      const payload = normalizeInputForHost(trimmed);
      const res = await postChat(payload);

      if(res && typeof res === 'object'){
        if(res.ok){
          const reply = res.reply;
          if(typeof reply === 'string'){
            addBubble('aura', reply, false);
          }else{
            addBubble('aura', JSON.stringify(reply, null, 2), false);
          }
          setStatus('Ready', false);
        }else{
          addBubble('aura', (res.reply ? (typeof res.reply === 'string' ? res.reply : JSON.stringify(res.reply, null, 2)) : 'ERROR'), true);
          setStatus('Error', true);
        }
      }else{
        addBubble('aura', String(res), true);
        setStatus('Error', true);
      }
    }catch(err){
      addBubble('aura', 'UI ERROR: ' + (err && err.message ? err.message : String(err)), true);
      setStatus('Error', true);
    }finally{
      sendBtn.disabled = false;
      input.focus();
    }
  }

  input.addEventListener('keydown', (e)=>{
  const k = e.key;
  const code = e.code;
  const kc = e.keyCode;
  const isEnter = (k === 'Enter') || (code === 'Enter') || (kc === 13);
  if(isEnter && !e.shiftKey){
    e.preventDefault();
    e.stopPropagation();
    runSend();
  }
});
  sendBtn.addEventListener('click', runSend);

  projList.addEventListener('click', (e)=>{
    const btn = e.target.closest('.projBtn');
    if(!btn) return;
    const host = btn.getAttribute('data-host');
    if(!host) return;

    activeHost = host;
    activeName =
      (host === 'frontdesk.network') ? 'FrontDesk' :
      (host === 'malibu.city') ? 'Malibu' :
      'Aura Core';

    [...projList.querySelectorAll('.projBtn')].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    hostLabel.textContent = activeHost;
    titleEl.textContent = activeName;

    addBubble('sys', 'HOST set to ' + activeHost + '. Pulling SHOW_BUILD...', false);
    pullBuild();
  });

  addBubble('sys', 'Connected. Select a project or type a command (e.g., PING).', false);
  pullBuild();
})();

