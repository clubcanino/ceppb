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
V.eventos = function(){
  const evs = C("eventos").slice().sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  const fut = evs.filter(e=>e.fecha>=hoy()), pas = evs.filter(e=>e.fecha<hoy()).reverse();
  const mias = C("inscripciones").filter(i => SESION.esAdmin || i.socioId===miSocioId());
  const tarjeta = e => {
    const ins = C("inscripciones").filter(i=>i.eventoId===e.id);
    const yoIns = ins.filter(i=>i.socioId===miSocioId());
    return `<div class="card"><div class="card-h"><h3>${esc(e.nombre)}</h3><span class="hint">${fmtF(e.fecha)}</span></div>
      <div class="card-b"><dl class="kv">
        <dt>Tipo</dt><dd><span class="chip">${esc(e.tipo||"—")}</span>${e.organizadoCEPPB?` <span class="chip ok">Organiza CEPPB</span>`:""}</dd>
        <dt>Lugar</dt><dd>${esc(e.lugar||"—")}</dd>
        ${e.juez?`<dt>Juez</dt><dd>${esc(e.juez)}</dd>`:""}
        <dt>Inscritos</dt><dd class="num">${ins.length}</dd>
        ${e.cierre?`<dt>Cierre de inscripción</dt><dd>${fmtF(e.cierre)}</dd>`:""}
      </dl>
      ${e.fecha>=hoy()&&SESION.rol==="socio"?`<div style="margin-top:12px">${yoIns.length?`<span class="chip ok">Inscrito con ${yoIns.length} ejemplar(es)</span> `:""}<button class="btn ${yoIns.length?"":"primary"} sm" data-form="inscripcion|${esc(e.id)}">Inscribir ejemplar</button></div>`:""}
      ${e.fecha>=hoy()&&e.tipo==="Prueba de carácter CEPPB"?`<div class="note" style="margin-top:10px">Las solicitudes se presentan con <b>30 días naturales</b> de antelación a la Comisión de Cría (Cap. 5.4).</div>`:""}
      </div></div>`;
  };
  return `${SESION.esAdmin?`<div style="margin-bottom:14px"><button class="btn primary" data-form="evento|">Convocar evento</button></div>`:""}
    <h3 style="margin-bottom:11px">Próximas convocatorias</h3>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-bottom:24px">
      ${fut.length?fut.map(tarjeta).join(""):`<div class="card"><div class="empty">Sin convocatorias abiertas</div></div>`}</div>
    ${mias.length&&SESION.rol!=="visitante"?`<div class="card" style="margin-bottom:24px"><div class="card-h"><h3>${SESION.esAdmin?"Todas las inscripciones":"Mis inscripciones"}</h3></div>
      <div class="card-b" style="padding:0"><table>${mias.map(i=>{const e=byId(C("eventos"),i.eventoId),p=byId(C("perros"),i.perroId),s=byId(C("socios"),i.socioId);
        return `<tr><td>${esc(e?.nombre||"—")}<div class="mini">${fmtF(e?.fecha)}</div></td><td>${esc(p?.nombre||"—")}</td>
        ${SESION.esAdmin?`<td>${esc(s?.nombreCompleto||"—")}</td>`:""}<td><span class="chip">${esc(i.clase||i.modalidad||"—")}</span></td>
        <td style="text-align:right"><span class="chip ${i.estado==="confirmada"?"ok":"warn"}">${esc(i.estado||"pendiente")}</span></td></tr>`;}).join("")}</table></div></div>`:""}
    ${pas.length?`<h3 style="margin-bottom:11px">Celebrados</h3>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">${pas.slice(0,6).map(tarjeta).join("")}</div>`:""}`;
};

/* --- Mi perfil --- */
