
export default {
  async fetch(req) {
    return new Response(html(), {
      headers: { "Content-Type": "text/html" }
    });
  }
};

function html() {
return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CityGuide.world</title>
<style>
:root {
  --bg:#1a0826;
  --accent:#ffb703;
}
body {
  margin:0;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  background:var(--bg);
  color:white;
}
header {
  padding:14px;
  background:black;
  position:sticky;
  top:0;
  z-index:10;
}
input {
  width:100%;
  padding:12px;
  border-radius:12px;
  border:none;
  font-size:16px;
}
.hero {
  height:420px;
  background-image:url('https://upload.wikimedia.org/wikipedia/commons/d/d3/Las_Vegas_Strip_at_night.jpg');
  background-size:cover;
  background-position:center;
  display:flex;
  align-items:flex-end;
}
.hero h1 {
  margin:24px;
  font-size:64px;
  text-shadow:0 10px 40px rgba(0,0,0,.9);
}
.pills {
  display:flex;
  gap:10px;
  padding:16px;
}
.pill {
  padding:10px 16px;
  border-radius:999px;
  background:rgba(255,255,255,.15);
  cursor:pointer;
}
.pill:hover {
  background:var(--accent);
  color:black;
}
.grid {
  padding:16px;
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:16px;
}
.card {
  background:rgba(255,255,255,.08);
  border-radius:16px;
  overflow:hidden;
  cursor:pointer;
  transition:transform .2s;
}
.card:hover {
  transform:translateY(-4px);
}
.card img {
  width:100%;
  height:160px;
  object-fit:cover;
}
.card .p {
  padding:12px;
}
.modal {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.75);
  display:none;
  align-items:center;
  justify-content:center;
}
.modal .box {
  background:#020617;
  padding:24px;
  border-radius:16px;
  max-width:600px;
  width:90%;
}
.close {
  text-align:right;
  cursor:pointer;
  margin-bottom:10px;
}
</style>
</head>
<body>

<header>
<input id="q" value="VEGAS · MALIBU · FLORENCE"/>
</header>

<div class="hero">
  <h1>VEGAS</h1>
</div>

<div class="pills">
  <div class="pill" onclick="filter('all')">All</div>
  <div class="pill" onclick="filter('restaurants')">Restaurants</div>
  <div class="pill" onclick="filter('bars')">Bars</div>
  <div class="pill" onclick="filter('events')">Events</div>
  <div class="pill" onclick="filter('concerts')">Concerts</div>
  <div class="pill" onclick="filter('shopping')">Shopping</div>
</div>

<div class="grid" id="grid"></div>

<div class="modal" id="modal">
  <div class="box">
    <div class="close" onclick="closeModal()">✕ Close</div>
    <h2 id="modalTitle"></h2>
    <p>This is a clickable place detail. This proves navigation works.</p>
    <a href="#" style="color:var(--accent)">Visit website</a>
  </div>
</div>

<script>
const data = [
  {name:"Gordon Ramsay Steak", type:"restaurants", img:"https://upload.wikimedia.org/wikipedia/commons/6/6b/Restaurant_interior.jpg"},
  {name:"The Chandelier", type:"bars", img:"https://upload.wikimedia.org/wikipedia/commons/3/32/Bar_interior.jpg"},
  {name:"Fremont Street Experience", type:"events", img:"https://upload.wikimedia.org/wikipedia/commons/2/2f/Fremont_Street_Experience.jpg"},
  {name:"Vegas Concert Hall", type:"concerts", img:"https://upload.wikimedia.org/wikipedia/commons/5/5b/Concert_hall.jpg"},
  {name:"Forum Shops", type:"shopping", img:"https://upload.wikimedia.org/wikipedia/commons/1/19/Shopping_mall_interior.jpg"}
];

const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");

function render(items) {
  grid.innerHTML = "";
  items.forEach(p => {
    const d = document.createElement("div");
    d.className = "card";
    d.onclick = () => openModal(p.name);
    d.innerHTML =
      "<img src='"+p.img+"'><div class='p'><b>"+p.name+"</b><br><small>"+p.type+"</small></div>";
    grid.appendChild(d);
  });
}

function filter(type) {
  if (type === "all") render(data);
  else render(data.filter(d => d.type === type));
}

function openModal(name) {
  modalTitle.textContent = name;
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

render(data);
</script>

</body>
</html>`;
}
