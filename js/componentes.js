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
     borra o cambia una letra, deja de estarlo.

     La lista escribe detrás del nombre la variedad, para distinguir a
     los que se llaman igual: «Yala de Lacanin de As · Tervueren». Pero
     un socio escribe el nombre de su perro y nada más, y antes eso no
     seleccionaba nada: el simulador de cruce se quedaba en blanco por
     mucho que escribieras bien el nombre. Así que se acepta también el
     nombre a secas, y lo escrito que sólo pueda ser una ficha. */
  const soloNombre = v => norm(String(v).split(" · ")[0]);

  let exacta = todas.find(x => norm(x[1]) === escrito);
  if (!exacta){
    const porNombre = todas.filter(x => soloNombre(x[1]) === escrito);
    /* Si dos perros se llaman igual no se adivina: que elija. */
    if (porNombre.length === 1) exacta = porNombre[0];
  }
  if (!exacta && escrito.length >= LETRAS_PARA_BUSCAR){
    const posibles = todas.filter(x => norm(x[1]).includes(escrito));
    if (posibles.length === 1) exacta = posibles[0];
  }

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

/* ============================================================
   El buscador de la barra de arriba.

   Busca a la vez en el censo y en el libro, y sólo entre lo que
   quien busca tiene derecho a ver: los perfiles que su titular ha
   abierto y los ejemplares que le corresponden. Nada más.
   ============================================================ */
const BUSCA_MINIMO = 2;
const BUSCA_MAX = 8;

function buscarEnElClub(texto){
  const q = norm(texto || "");
  if (q.length < BUSCA_MINIMO) return [];

  const perros = (typeof perrosVisibles === "function" ? perrosVisibles() : C("perros"))
    .filter(p => norm([p.nombre, p.afijo, p.loe, p.chip].join(" ")).includes(q))
    .slice(0, BUSCA_MAX)
    .map(p => ({
      ir: "perro/" + p.id, titulo: nombrePerro(p),
      pie: [p.variedad, p.loe, p.sexo === "M" ? "♂" : p.sexo === "H" ? "♀" : ""]
             .filter(Boolean).join(" · "),
      grupo: "Ejemplares",
    }));

  const socios = C("socios")
    .filter(s => (typeof perfilVisible !== "function" || perfilVisible(s)) &&
                 norm([s.nombreCompleto, s.afijo, s.numero, s.poblacion, s.provincia].join(" ")).includes(q))
    .slice(0, BUSCA_MAX)
    .map(s => ({
      ir: "socio/" + s.id, titulo: s.nombreCompleto,
      pie: ["nº " + s.numero, s.afijo, s.provincia].filter(Boolean).join(" · "),
      grupo: "Socios",
    }));

  return socios.concat(perros);
}

function pintarBusqueda(texto){
  const caja = document.getElementById("busca-caidas");
  if (!caja) return;
  const l = buscarEnElClub(texto);

  if (!texto || norm(texto).length < BUSCA_MINIMO){ caja.innerHTML = ""; caja.hidden = true; return; }
  if (!l.length){
    caja.innerHTML = `<div class="busca-vacio">${esc(t("Nada con ese nombre"))}</div>`;
    caja.hidden = false; return;
  }

  let grupo = "";
  caja.innerHTML = l.map(x => {
    const cabecera = x.grupo !== grupo ? `<div class="busca-grupo">${esc(t(x.grupo))}</div>` : "";
    grupo = x.grupo;
    return cabecera + `<a class="busca-fila" data-go="${esc(x.ir)}" href="#/${esc(x.ir)}">
      <b>${esc(x.titulo)}</b>${x.pie ? `<span class="mini">${esc(x.pie)}</span>` : ""}</a>`;
  }).join("");
  caja.hidden = false;
}
