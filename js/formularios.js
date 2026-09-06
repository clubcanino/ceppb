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
  /* Campo de escribir con sugerencias: se teclea y van saliendo los
     nombres que encajan. No es un desplegable cerrado: si el criador
     no es socio del club, se escribe y ya está. */
  if(f.tipo === "buscador"){
    const id = "dl-" + f.k + "-" + Math.random().toString(36).slice(2, 7);
    return `<div class="f ${f.wide?"wide":""}"><label>${esc(f.l)}</label>
      <input class="inp" name="${f.k}" value="${esc(v)}" list="${id}" autocomplete="off" placeholder="${esc(f.ph||"")}">
      <datalist id="${id}">${(f.op||[]).map(o => `<option value="${esc(o)}"></option>`).join("")}</datalist>
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
const optSociosAfijo = () => [["", "— criador no socio o desconocido —"]].concat(
  C("socios").slice().sort((a,b)=>(b.afijo?1:0)-(a.afijo?1:0) || a.apellidos.localeCompare(b.apellidos,"es"))
    .map(s=>[s.id, s.afijo ? `${s.afijo} — ${s.nombreCompleto}` : `${s.nombreCompleto} (sin afijo)`]));
const optPerros = sexo => [["", "— sin registrar —"]].concat(C("perros").filter(p=>!sexo||p.sexo===sexo).map(p=>[p.id, `${p.nombre}${p.variedad?" · "+p.variedad:""}`]));
