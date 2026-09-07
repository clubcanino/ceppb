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
/* Orden con el que nace cada tabla. Sin esto salían en el orden en que
   los devuelve la base de datos, que no es ningún orden: el listado de
   ejemplares son más de mil perros y hay que poder buscarlos por la
   letra. Pulsando una cabecera se reordena por otra columna. */
let ordenTabla = {soc:{c:0, d:false}, alt:{c:0, d:false}, cob:{c:0, d:false},
                  per:{c:0, d:false},
                  /* Los resultados, del más reciente al más antiguo: es
                     lo que se quiere ver primero de un perro. */
                  res:{c:0, d:true}};
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


/* ============================================================
   Buscar una ficha en vez de desplegar una lista.

   Con 347 socios y 3.803 ejemplares, un desplegable que se abre
   entero no sirve: hay que bajar por él a ojo. Aquí se escribe y,
   a partir de tres letras, salen las que encajan.

   Lo que se guarda es el identificador, no lo escrito: mientras el
   texto no coincida con una ficha de verdad, no hay nada elegido.
   ============================================================ */
const BUSCAFICHAS = {};
const LETRAS_PARA_BUSCAR = 3;
const FICHAS_QUE_SE_ENSEÑAN = 12;

/* Qué hacer cuando se elige, en las pantallas que no son formulario. */
const AL_ELEGIR_FICHA = {};

/* opciones: [[id, etiqueta], …]. Las etiquetas tienen que ser
   distintas entre sí, o dos fichas distintas se confundirían. */
function buscadorDeFicha(nombre, opciones, elegido, extra){
  const o = extra || {};
  const id = "bf-" + nombre + "-" + Math.random().toString(36).slice(2, 7);
  const lista = (opciones || []).filter(x => x && x[0]);
  BUSCAFICHAS[id] = lista;
  const puesto = lista.find(x => String(x[0]) === String(elegido || ""));
  return `<div class="buscaficha" data-busca="${id}"${o.alElegir ? ` data-al-elegir="${esc(o.alElegir)}"` : ""}>
    <input class="inp" list="dl-${id}" autocomplete="off"
           value="${esc(puesto ? puesto[1] : "")}"
           placeholder="${esc(o.ph || "Escribe tres letras…")}"${o.idInput ? ` id="${esc(o.idInput)}"` : ""}>
    <datalist id="dl-${id}"></datalist>
    <input type="hidden" ${o.campo ? `name="${esc(o.campo)}"` : ""} value="${esc(puesto ? puesto[0] : "")}">
  </div>`;
}

document.addEventListener("input", ev => {
  const caja = ev.target.closest && ev.target.closest(".buscaficha");
  if (!caja || ev.target.type === "hidden") return;

  const clave = caja.dataset.busca;
  const todas = BUSCAFICHAS[clave] || [];
  const lista = caja.querySelector("datalist");
  const oculto = caja.querySelector("input[type=hidden]");
  const escrito = norm(ev.target.value || "");

  /* Elegido es sólo lo que coincide con una ficha real. Si el socio
     borra o cambia una letra, deja de estarlo. */
  const exacta = todas.find(x => norm(x[1]) === escrito);
  const antes = oculto.value;
  oculto.value = exacta ? exacta[0] : "";

  lista.innerHTML = escrito.length < LETRAS_PARA_BUSCAR ? "" :
    todas.filter(x => norm(x[1]).includes(escrito))
         .slice(0, FICHAS_QUE_SE_ENSEÑAN)
         .map(x => `<option value="${esc(x[1])}"></option>`).join("");

  if (oculto.value !== antes && caja.dataset.alElegir){
    const f = AL_ELEGIR_FICHA[caja.dataset.alElegir];
    if (typeof f === "function") f(oculto.value);
  }
});
