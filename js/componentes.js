/* ============================================================
   Piezas visuales compartidas por varias pantallas.
   Portadas del prototipo.
   ============================================================ */
"use strict";

const VAL_CHIP = {validado:["ok","Validado"], rechazado:["block","Rechazado"], pendiente:["warn","Pendiente de validar"]};
function chipVal(estado){
  const [c,t] = VAL_CHIP[estado || "pendiente"] || VAL_CHIP.pendiente;
  return `<span class="chip ${c}">${t}</span>`;
}
function afijoChip(p){
  if(!p.afijo) return `<span class="dim">—</span>`;
  return p.afijoSocioId
    ? `<a class="chip mono linkish" data-go="socio/${esc(p.afijoSocioId)}" style="border-color:var(--line-2)">${esc(p.afijo)}</a>`
    : `<span class="chip mono">${esc(p.afijo)}</span>`;
}
function chipVar(v){ return v ? `<span class="chip"><span class="var-dot ${VCLASE[v]||""}"></span>${esc(v)}</span>` : `<span class="dim">—</span>`; }
function chipApto(codes){
  if(!codes.length) return `<span class="dim">—</span>`;
  return codes.map(c => `<span class="chip ok" title="${esc(FIG_POR_CODIGO[c]?.n||"")}">${c}</span>`).join(" ");
}
function marca(e){ return `<span class="mk ${e}">${e==="ok"?"✓":e==="no"?"✕":"·"}</span>`; }
function medidor(figs){
  return `<span class="meter" title="Las cinco figuras del Cap. 2">` + figs.map(f =>
    `<i class="${f.cumple?"on":f.excluido?"x":""}" title="${esc(f.fig.c)}"></i>`).join("") + `</span>`;
}
const VIA_COLOR = {estructura:"var(--via-est)", utilidad:"var(--via-uti)", mixta:"var(--via-uti)"};
function listaReq(items){
  return `<div class="reqs">` + items.map(i => `<div class="req">${marca(i.e)}
    <div class="tx"><b>${esc(i.t)}</b><small>${esc(i.d)}${i.r?` · <span class="rule-src">${esc(i.r)}</span>`:""}</small></div></div>`).join("") + `</div>`;
}
function barras(pares, color){
  const max = Math.max(1, ...pares.map(p => p[1]));
  return `<div class="bars">` + pares.map(([l,v,cl]) => `<div class="bar">
      <span class="lb">${cl?`<span class="var-dot ${cl}"></span>`:""}${esc(l)}</span>
      <span class="tr"><span class="fl" style="width:${(v/max*100).toFixed(1)}%${cl?`;background:var(--${color||"ink-2"})`:""}"></span></span>
      <span class="vl">${v}</span></div>`).join("") + `</div>`;
}
let ordenTabla = {soc:{c:0, d:false}, alt:{c:0, d:false}, cob:{c:0, d:false}};
function tabla(key, cols, filas, onClick){
  const o = ordenTabla[key] || {};
  if(o.c != null){
    const col = cols[o.c];
    filas = filas.slice().sort((a,b) => {
      const va = col.s ? col.s(a) : "", vb = col.s ? col.s(b) : "";
      const r = (typeof va === "number" && typeof vb === "number") ? va - vb : String(va).localeCompare(String(vb), "es");
      return o.d ? -r : r;
    });
  }
  if(!filas.length) return `<div class="tw"><div class="empty"><b>Sin resultados</b>Ajusta los filtros o añade el primer registro.</div></div>`;
  /* Cada celda lleva el nombre de su columna: en el móvil la tabla se
     convierte en fichas y ese nombre es lo que dice qué es cada dato. */
  return `<div class="tw tabla-movil"><table><thead><tr>` +
    cols.map((c,i) => `<th class="${c.s?"":"nos"}" ${c.s?`data-ord="${key}|${i}"`:""} ${c.via?`style="color:${VIA_COLOR[c.via]}"`:""}>${esc(c.t)}${o.c===i?` <span class="ar">${o.d?"▼":"▲"}</span>`:""}</th>`).join("") +
    `</tr></thead><tbody>` +
    filas.map(f => `<tr class="${onClick?"clic":""}" ${onClick?`data-go="${esc(onClick(f))}"`:""}>` +
      cols.map(c => `<td data-col="${esc(c.t)}">${c.r(f)}</td>`).join("") + `</tr>`).join("") +
    `</tbody></table></div>`;
}

