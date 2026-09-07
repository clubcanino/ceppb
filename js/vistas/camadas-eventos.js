/* Camadas y eventos. */
"use strict";

/* --- Camadas --- */
V.camadas = function(){
  const cols = [
    {t:"Nacimiento", s:c=>c.fechaNacimiento||"", r:c=>`<span class="num">${fmtF(c.fechaNacimiento)}</span>`},
    {t:"Afijo", s:c=>c.afijo||"", r:c=>`<span class="chip mono">${esc(c.afijo||"—")}</span>`},
    {t:"Padres", s:c=>c.madreId||"", r:c=>{const m=byId(C("perros"),c.madreId),p=byId(C("perros"),c.padreId);
      return `${esc(p?.nombre||"?")} <span class="dim">×</span> ${esc(m?.nombre||"?")}`;}},
    {t:"Cachorros", s:c=>(c.nMachos||0)+(c.nHembras||0), r:c=>`<span class="num">${(c.nMachos||0)+(c.nHembras||0)}</span> <span class="mini">${c.nMachos||0}♂ ${c.nHembras||0}♀</span>`},
    {t:"LOE camada", s:c=>c.loeCamada||"", r:c=>`<span class="num">${esc(c.loeCamada||"—")}</span>`},
    {t:"Comunicación", s:c=>c.fechaComunicacion||"", r:c=>{
      if(!c.fechaNacimiento) return `<span class="dim">—</span>`;
      if(!c.fechaComunicacion) { const d = Math.floor((Date.now()-new Date(c.fechaNacimiento))/86400000);
        return d>30?`<span class="chip block">Fuera de plazo (${d} días)</span>`:`<span class="chip warn">Pendiente · ${30-d} días</span>`; }
      const d = Math.floor((new Date(c.fechaComunicacion)-new Date(c.fechaNacimiento))/86400000);
      return d<=30?`<span class="chip ok">En plazo</span>`:`<span class="chip block">Tardía (${d} días)</span>`;}},
    {t:"Difusión", s:c=>c.recomendada?1:0, r:c=>{
      const pb = camadaPublicable(c);
      if(!pb.ok) return `<span class="chip block" title="${esc(pb.motivo)}">Retenida</span>`;
      return c.recomendada?`<span class="chip ok">Recomendada</span>`:`<span class="chip">No difundida</span>`;}},
  ];
  return `<div class="note" style="margin-bottom:14px">Para que una camada aparezca en las herramientas de difusión del club debe comunicarse <b>dentro de los 30 días</b> siguientes al nacimiento con los datos de los progenitores y el número y sexo de los cachorros (Cap. 6.1).</div>
    ${SESION.rol!=="visitante"?`<div style="margin-bottom:12px"><button class="btn primary" data-form="camada|">Declarar camada</button></div>`:""}
    ${tabla("cam", cols, C("camadas"))}`;
};

/* --- Eventos --- */
/* Dos cosas distintas bajo el mismo nombre: lo que viene —el
   calendario que el club publica en su web, con sus inscripciones— y
   lo que ya pasó: la clasificación de cada campeonato. Se abre por el
   calendario, que es lo que se viene buscando. */
let tabEventos = "web";

V.eventos = function(){
  const pestanas = [["web", "Calendario del CEPPB"], ["club", "Resultados de los eventos"]];
  const cabecera = `<div class="tabs" style="margin-bottom:16px">${pestanas.map(([k, n]) =>
    `<button data-tabev="${k}" class="${tabEventos === k ? "on" : ""}">${esc(t(n))}</button>`).join("")}</div>`;

  if (tabEventos === "web") return cabecera + calendarioDelClub();

  return cabecera + resultadosDeEventos();
};

/* El calendario de la web del club, dentro de la plataforma. */
function calendarioDelClub(){
  return `<div class="card">
    <div class="card-h"><h3>${esc(t("Calendario del CEPPB"))}</h3>
      <span class="spacer"></span>
      <a class="btn sm" href="${esc(CONFIG.WEB_EVENTOS)}" target="_blank" rel="noopener noreferrer">${esc(t("Abrir en una pestaña nueva"))}</a>
    </div>
    <div class="card-b" style="padding:0">
      <div class="marco-web">
        <iframe src="${esc(CONFIG.WEB_EVENTOS)}" title="${esc(t("Calendario del CEPPB"))}"
                loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
    <div class="card-b" style="border-top:1px solid var(--line)">
      <div class="mini">${esc(t("Esto es la página de eventos de la web del club, tal cual. Las inscripciones se hacen ahí."))}</div>
    </div>
  </div>`;
}

/* La clasificación de un campeonato: quién quedó dónde, con qué
   puntos y con qué guía. Es lo que se busca de un evento pasado.

   Las convocatorias y las inscripciones viven en la web del club, en
   la otra pestaña; aquí está lo que ya se ha corrido. */
let eventoElegido = "";

function resultadosDeEventos(){
  const evs = C("eventos").slice();
  const res = C("resultados");
  const cuantos = e => res.filter(r => r.eventoId === e.id).length;

  /* Ordenados del más reciente al más antiguo. Los campeonatos
     importados no traen día, sólo año: se ordena por lo que haya. */
  const anioDe = e => {
    const r = res.find(x => x.eventoId === e.id);
    return String(e.fecha || (r && r.anio) || "").slice(0, 4);
  };
  evs.sort((a, b) => String(anioDe(b) + (b.nombre||"")).localeCompare(anioDe(a) + (a.nombre||""), "es"));

  if (!evs.length) return `<div class="card"><div class="empty">
    <b>Todavía no hay eventos registrados</b>
    ${SESION.esAdmin ? `Convócalos desde aquí y sus resultados aparecerán en esta página.
      <div style="margin-top:14px"><button class="btn brand" data-form="evento|">Convocar evento</button></div>` : ""}
  </div></div>`;

  const e = byId(evs, eventoElegido) || evs.find(x => cuantos(x)) || evs[0];
  const suyos = res.filter(r => r.eventoId === e.id)
    .sort((a, b) => (a.puesto || 9999) - (b.puesto || 9999));

  const cols = [
    {t:t("Puesto"), s:r=>r.puesto||9999, r:r=>r.puesto?`<span class="num">${r.puesto}º</span>`:`<span class="dim">—</span>`},
    {t:t("Ejemplar"), s:r=>{const p=byId(C("perros"),r.perroId); return p?p.nombre:"";},
     r:r=>{const p=byId(C("perros"),r.perroId);
       return p?`<span class="nm">${esc(p.nombre)}</span>${r.clase?`<div class="mini">Clase ${esc(String(r.clase).toLowerCase())}</div>`:""}`:`<span class="dim">—</span>`;}},
    {t:t("Guía"), s:r=>r.guia||"", r:r=>esc(r.guia||"—")},
    {t:t("Puntos"), s:r=>r.puntos==null?-1:r.puntos,
     r:r=>r.puntos==null?`<span class="dim">—</span>`
        :`<span class="num">${r.puntos}${r.puntosSobre?"/"+r.puntosSobre:""}</span>`},
    {t:t("Calificación"), s:r=>r.calificacion||r.calificacionOrigen||"",
     r:r=>`${r.calificacion?`<span class="chip ${r.calificacion==="EXC"?"ok":r.calificacion==="DESC"?"block":""}">${esc(r.calificacion)}</span>`
        :r.calificacionOrigen?`<span class="chip">${esc(r.calificacionOrigen)}</span>`:`<span class="dim">—</span>`}${
        r.distincion?` <span class="chip">${esc(r.distincion)}</span>`:""}${
        r.titulo&&r.tipo==="estructura"?` <span class="chip">${esc(r.titulo)}</span>`:""}`},
  ];

  const opcion = x => `<option value="${esc(x.id)}" ${x.id===e.id?"selected":""}>${
    esc(x.nombre)}${cuantos(x)?` — ${cuantos(x)} participantes`:" — sin resultados"}</option>`;

  return `<div class="filters" style="margin-bottom:16px">
      <select class="inp" id="elegir-evento" style="min-width:min(420px,100%)">
        ${evs.map(opcion).join("")}</select>
      <span class="spacer"></span>
      ${SESION.esAdmin?`<button class="btn sm" data-form="evento|${esc(e.id)}">Editar evento</button>
        <button class="btn primary" data-form="evento|">Convocar evento</button>`:""}
    </div>

    <div class="card"><div class="card-h"><h3>${esc(e.nombre)}</h3>
      ${eventoEnDirecto(e)?`<span class="chip block" style="margin-left:8px">${esc(t("EN DIRECTO"))}</span>`:""}
      <span class="spacer"></span>
      ${e.organizadoCEPPB?`<span class="chip ok">Organiza CEPPB</span>`:`<span class="chip">Organiza otra entidad</span>`}
      ${e.fecha?`<span class="hint">${fmtF(e.fecha)}</span>`:""}</div>
      ${eventoEnDirecto(e)?`<div class="card-b" style="padding:14px 16px 0">${reproductorDirecto(e)}</div>`:""}
      ${!eventoEnDirecto(e)&&e.directoUrl?`<div class="card-b" style="padding:14px 16px 0">
        <a class="btn sm" href="${esc(e.directoUrl)}" target="_blank" rel="noopener noreferrer">Ver la grabación</a></div>`:""}
      ${e.lugar||e.juez?`<div class="card-b" style="padding-bottom:0"><dl class="kv">
        ${e.lugar?`<dt>Lugar</dt><dd>${esc(e.lugar)}</dd>`:""}
        ${e.juez?`<dt>Juez</dt><dd>${esc(e.juez)}</dd>`:""}</dl></div>`:""}
      <div class="card-b" style="padding:0">
        ${suyos.length ? tabla("cls", cols, suyos, r => "perro/" + r.perroId)
          : `<div class="empty" style="padding:34px"><b>Sin resultados todavía</b>
             ${e.fecha && e.fecha >= hoy()
               ? "El evento aún no se ha celebrado. Las inscripciones se hacen en la web del club."
               : "Cuando se publiquen aparecerán aquí."}</div>`}
      </div>
      ${suyos.length?`<div class="card-b" style="border-top:1px solid var(--line)">
        <div class="mini">${suyos.length} participaciones${
          e.organizadoCEPPB?"":" · Este evento no lo organiza el CEPPB, así que no cuenta para las figuras de apto de cría que exigen prueba propia del club"}</div>
      </div>`:""}
    </div>`;
}

/* --- Mi perfil --- */
