/* Utilidades generales — extraídas del prototipo del club. */
/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const byId = (arr, id) => arr.find(x => x.id === id);
const uid = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hoy = () => new Date().toISOString().slice(0, 10);
function fmtF(f){ if(!f) return "—"; const p=String(f).slice(0,10).split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:f; }
function meses(desde, hasta){
  if(!desde) return null;
  const a=new Date(desde), b=hasta?new Date(hasta):new Date();
  if(isNaN(a)) return null;
  return (b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()) - (b.getDate()<a.getDate()?1:0);
}
function edadTxt(m){ if(m==null) return "—"; const a=Math.floor(m/12), r=m%12; return a? `${a} a${r?` ${r} m`:""}` : `${m} m`; }
function toast(t){ const n=$("#toast"); n.textContent=t; n.classList.add("on"); clearTimeout(n._t); n._t=setTimeout(()=>n.classList.remove("on"),2600); }
function norm(s){ return String(s??"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); }

/* Registro de pantallas: cada archivo de js/vistas/ se apunta aquí. */
const V = {};
