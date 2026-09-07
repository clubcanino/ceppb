/* ============================================================
   Formularios en panel lateral. Portado del prototipo.
   ============================================================ */
"use strict";

let formActual = null;
function campo(f){
  const v = f.v ?? "";
  if(f.tipo === "select")
    return `<div class="f ${f.wide?"wide":""}"><label>${esc(f.l)}</label><select class="inp" name="${f.k}">${
      f.op.map(o => { const [val,txt] = Array.isArray(o)?o:[o,o||"— sin dato —"];
        return `<option value="${esc(val)}" ${String(v)===String(val)?"selected":""}>${esc(txt)}</option>`;}).join("")}</select>${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
  if(f.tipo === "textarea")
    return `<div class="f wide"><label>${esc(f.l)}</label><textarea class="inp" name="${f.k}" placeholder="${esc(f.ph||"")}">${esc(v)}</textarea>${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
  if(f.tipo === "checks")
    return `<div class="f wide"><label>${esc(f.l)}</label>
      <div class="checks">${f.op.map(o => `<label class="chk"><input type="checkbox" name="${f.k}::${esc(o)}" ${(f.v||[]).includes(o)?"checked":""}> ${esc(o)}</label>`).join("")}</div>
      ${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
  if(f.tipo === "check")
    return `<div class="f ${f.wide?"wide":""}"><label style="display:flex;gap:7px;align-items:center;cursor:pointer">
      <input type="checkbox" name="${f.k}" ${v?"checked":""}> ${esc(f.l)}</label>${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
  /* Campo de escribir con sugerencias. No es un desplegable cerrado:
     si el criador no es socio del club, se escribe y ya está.

     Las sugerencias NO salen hasta que hay tres letras escritas: con
     347 socios, una lista que se abre entera al hacer clic estorba
     más que ayuda. */
  if(f.tipo === "buscador"){
    const id = "dl-" + f.k + "-" + Math.random().toString(36).slice(2, 7);
    SUGERENCIAS[id] = f.op || [];
    return `<div class="f ${f.wide?"wide":""}"><label>${esc(f.l)}</label>
      <input class="inp" name="${f.k}" value="${esc(v)}" list="${id}"
             data-sugerencias="${id}" autocomplete="off" placeholder="${esc(f.ph||"")}">
      <datalist id="${id}"></datalist>
      ${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
  }

  /* Buscar una ficha del club —un socio, un ejemplar— en vez de
     desplegar una lista de cientos. Guarda el identificador. */
  if(f.tipo === "buscarId"){
    return `<div class="f ${f.wide?"wide":""}"><label>${esc(f.l)}</label>
      ${buscadorDeFicha(f.k, f.op, v, {campo:f.k, ph:f.ph})}
      ${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
  }

  return `<div class="f ${f.wide?"wide":""}"><label>${esc(f.l)}</label>
    <input class="inp" type="${f.tipo||"text"}" name="${f.k}" value="${esc(v)}" placeholder="${esc(f.ph||"")}">${f.h?`<span class="hint2">${esc(f.h)}</span>`:""}</div>`;
}
function grupos(gs){
  return gs.map(g => `<fieldset class="fset"><legend>${esc(g.t)}</legend>${g.d?`<div class="note" style="margin-bottom:11px">${g.d}</div>`:""}
    <div class="fgrid">${g.f.map(campo).join("")}</div></fieldset>`).join("");
}
function abrirForm(titulo, gs, onOk){
  formActual = onOk;
  $("#sheet-t").textContent = titulo;
  $("#sheet-b").innerHTML = grupos(gs);
  $("#sheet-ok").textContent = "Guardar";
  $("#sheet").classList.add("on"); $("#scrim").classList.add("on");
}
function cerrarForm(){ $("#sheet").classList.remove("on"); $("#scrim").classList.remove("on"); formActual = null; }
function leerForm(){
  const o = {};
  $("#sheet-b").querySelectorAll("[name]").forEach(el => {
    const n = el.name;
    if(n.includes("::")){                     // grupo de casillas -> lista
      const [k, v] = n.split("::");
      o[k] = o[k] || [];
      if(el.checked) o[k].push(v);
      return;
    }
    o[n] = el.type === "checkbox" ? el.checked : el.value.trim();
  });
  return o;
}
const optSocios = () => [["", "— sin asignar —"]].concat(C("socios").slice().sort((a,b)=>a.apellidos.localeCompare(b.apellidos,"es")).map(s=>[s.id, `${s.nombreCompleto} (nº ${s.numero})`]));

/* Para buscar no vale la opción vacía —se busca escribiendo— y las
   etiquetas tienen que ser únicas: si dos fichas se llaman igual, lo
   escrito no diría a cuál se refiere. Se desempatan con el LOE, y si
   tampoco lo hay, con el año de nacimiento. */
function unicas(pares){
  const cuantos = {};
  pares.forEach(([, t]) => cuantos[t] = (cuantos[t] || 0) + 1);
  const vistos = {};
  return pares.map(([id, t, extra]) => {
    if (cuantos[t] === 1) return [id, t];
    vistos[t] = (vistos[t] || 0) + 1;
    return [id, `${t} (${extra || "ficha " + vistos[t]})`];
  });
}

const buscaSocios = () => unicas(C("socios").slice()
  .sort((a,b)=>String(a.apellidos).localeCompare(String(b.apellidos),"es"))
  .map(s=>[s.id, `${s.nombreCompleto} (nº ${s.numero})`]));

const buscaPerros = sexo => unicas(C("perros")
  .filter(p => !sexo || p.sexo === sexo)
  .sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre),"es"))
  .map(p=>[p.id, p.nombre + (p.variedad ? " · " + p.variedad : ""),
           p.loe || (p.fechaNacimiento ? "n. " + String(p.fechaNacimiento).slice(0,4) : "")]));
const optSociosAfijo = () => [["", "— criador no socio o desconocido —"]].concat(
  C("socios").slice().sort((a,b)=>(b.afijo?1:0)-(a.afijo?1:0) || a.apellidos.localeCompare(b.apellidos,"es"))
    .map(s=>[s.id, s.afijo ? `${s.afijo} — ${s.nombreCompleto}` : `${s.nombreCompleto} (sin afijo)`]));
const optPerros = sexo => [["", "— sin registrar —"]].concat(C("perros").filter(p=>!sexo||p.sexo===sexo).map(p=>[p.id, `${p.nombre}${p.variedad?" · "+p.variedad:""}`]));


/* ------------------------------------------------------------
   Sugerencias de los campos de buscador
   ------------------------------------------------------------ */
const SUGERENCIAS = {};
const LETRAS_MINIMAS = 3;
const SUGERENCIAS_MAX = 12;

document.addEventListener("input", ev => {
  const inp = ev.target;
  if (!inp.dataset || !inp.dataset.sugerencias) return;

  const lista = document.getElementById(inp.dataset.sugerencias);
  if (!lista) return;

  const escrito = norm(inp.value || "");
  if (escrito.length < LETRAS_MINIMAS){ lista.innerHTML = ""; return; }

  const todas = SUGERENCIAS[inp.dataset.sugerencias] || [];
  const encajan = todas
    .filter(o => norm(o).includes(escrito))
    .slice(0, SUGERENCIAS_MAX);

  lista.innerHTML = encajan.map(o => `<option value="${esc(o)}"></option>`).join("");
});
