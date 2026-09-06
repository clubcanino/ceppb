/* ============================================================
   Piezas visuales compartidas por varias pantallas.
   Portadas del prototipo.
   ============================================================ */
"use strict";

const VAL_CHIP = {validado:["ok","Validado"], rechazado:["block","Rechazado"], pendiente:["warn","Pendiente de validar"]};

function chipVal(estado){
  const [cl, tx] = VAL_CHIP[estado || "pendiente"] || VAL_CHIP.pendiente;
  return `<span class="chip ${cl}">${tx}</span>`;
}

function chipVar(v){
  return v ? `<span class="chip"><span class="var-dot ${VCLASE[v]||""}"></span>${esc(v)}</span>`
           : `<span class="dim">—</span>`;
}

function barras(pares, color){
  const max = Math.max(1, ...pares.map(p => p[1]));
  return `<div class="bars">` + pares.map(([l,v,cl]) => `<div class="bar">
      <span class="lb">${cl?`<span class="var-dot ${cl}"></span>`:""}${esc(l)}</span>
      <span class="tr"><span class="fl" style="width:${(v/max*100).toFixed(1)}%${cl?`;background:var(--${color||"ink-2"})`:""}"></span></span>
      <span class="vl">${v}</span></div>`).join("") + `</div>`;
}
