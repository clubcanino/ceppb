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

/* ============================================================
   Los enlaces a working-dog.

   La ficha necesita el identificador Y el nombre del perro con
   guiones en lugar de espacios: sin el nombre devuelve un «página
   no encontrada». El pedigrí ampliado, en cambio, va sólo con el
   identificador.

   Por eso se guarda la dirección tal como llegó y se recompone al
   enseñarla: si mañana cambian otra vez el formato, se arregla
   aquí y no en cuatro mil fichas.
   ============================================================ */
function idWorkingDog(url){
  const m = String(url || "").match(/(?:dogs-details\/|dog\/x-)(\d+)/);
  return m ? m[1] : null;
}

/* ------------------------------------------------------------
   El nombre registrado de un ejemplar.

   El afijo del criadero forma parte del nombre: en el pedigrí pone
   «Gas de Azarbe», no «Gas». Así que así se escribe en todas partes
   —listas, buscadores, pedigríes, certificados y exportaciones—, y no
   sólo en la ficha.

   Muchas fichas que llegaron de los pedigríes de los campeonatos
   traen el afijo ya dentro del nombre. Ahí no se repite.
   ------------------------------------------------------------ */
function nombrePerro(p){
  if (!p) return "";
  const n = String(p.nombre || "").trim();
  const a = String(p.afijo || "").trim();
  if (!n) return a;
  if (!a) return n;
  const nn = norm(n), na = norm(a);
  return (nn.endsWith(na) || nn.startsWith(na)) ? n : n + " " + a;
}

function enlaceWorkingDog(perro){
  const id = idWorkingDog(perro && perro.workingdogUrl);
  if (!id) return perro && perro.workingdogUrl ? String(perro.workingdogUrl) : null;
  const nombre = String((perro && perro.nombre) || "").trim().replace(/\s+/g, "-");
  return `https://es.working-dog.com/dogs-details/${id}` + (nombre ? "/" + nombre : "");
}

function pedigriWorkingDog(perro){
  const id = idWorkingDog(perro && perro.workingdogUrl);
  return id ? `https://es.working-dog.com/dog/x-${id}/extended-pedigree` : null;
}

/* La dirección en la que vive la plataforma, con su barra final. De
   aquí salen los enlaces personales de alta: escribirla a mano lleva a
   equivocarse de sitio, como pasó con «ceppb.info/alta/…». */
function baseDeLaPlataforma(){
  try {
    return location.origin + location.pathname.replace(/[^/]*$/, "");
  } catch(e){
    return "https://clubcanino.github.io/ceppb/";
  }
}
