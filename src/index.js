// FULL Aura Core — UI + Backend — Auth Fixed
// Generated fresh for download reliability

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json" }
      });

    // ---------- UI ROUTER ----------
    if (url.pathname === "/" || url.pathname === "/core") {
      return new Response(`<!doctype html>
<html>
<head><title>Aura</title></head>
<body>
<div id="app">Aura UI Loaded</div>
<script>
async function send(input){
  const token = localStorage.getItem("aura_admin_token") || "";
  const res = await fetch("/chat",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      ...(token ? {"X-Core-Pass":token}:{})
    },
    body: JSON.stringify({ type:"text", input })
  });
  const j = await res.json();
  document.body.insertAdjacentHTML("beforeend","<pre>"+JSON.stringify(j,null,2)+"</pre>");
}
window.send = send;
</script>
</body>
</html>`, { headers: { "Content-Type": "text/html" }});
    }

    // ---------- CHAT ----------
    if (url.pathname === "/chat") {
      let body = {};
      try { body = await request.json(); } catch {}
      if (body.type !== "text") {
        return json({ ok:false, error:"unsupported_type", got: body.type ?? "" },400);
      }

      const token = request.headers.get("X-Core-Pass") || "";
      const isAdmin = token && token === env.AURA_ADMIN_TOKEN;

      if (body.input === "permit queue") {
        if (!isAdmin) return json({ ok:false, error:"unauthorized" },401);
        const list = await env.AURA_KV.list({ prefix:"permit:req:" });
        return json({ ok:true, pending:[], total_pending:list.keys.length });
      }

      return json({ ok:true, echo: body.input });
    }

    // ---------- HEALTH ----------
    if (url.pathname === "/health") {
      return json({ ok:true, service:"aura-core", version:"FULL_UI_AUTH_FIXED" });
    }

    return new Response("Not Found",{status:404});
  }
};
