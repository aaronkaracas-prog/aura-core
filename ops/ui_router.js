export default {
 async fetch(request) {

  const url = new URL(request.url)

  if (url.pathname === "/ui") {

   return new Response(\
<html>
<head>
<title>Aura Console</title>
<style>
body{font-family:monospace;margin:20px}
#out{border:1px solid #aaa;height:400px;overflow:auto;padding:10px;margin-bottom:10px}
#cmd{width:100%;padding:8px;font-size:16px}
</style>
</head>

<body>

<h2>Aura Console</h2>
<div>Version: UI_BUILD_001</div>
<div>Built: 2026-03-05 10:25:19</div>

<div id="out"></div>

<input id="cmd" placeholder="Type command and press Enter">

<script>

const out = document.getElementById("out")
const cmd = document.getElementById("cmd")

cmd.addEventListener("keydown", async (e)=>{

 if(e.key==="Enter"){

  const c = cmd.value
  cmd.value=""

  out.innerHTML += "<div>> "+c+"</div>"

  const r = await fetch("/chat",{method:"POST",body:c})
  const t = await r.text()

  out.innerHTML += "<pre>"+t+"</pre>"

  out.scrollTop = out.scrollHeight

 }

})

</script>

</body>
</html>
\,{headers:{'content-type':'text/html'}})

  }

  return new Response("Aura runtime active")

 }
}