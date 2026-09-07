/* ============================================================
   Ejemplares: buscador y ficha completa con sus pestañas.
   ============================================================ */
"use strict";

/* --- Buscador de ejemplares --- */
let fPer = {q:"", var:"", sexo:"", apto:"", salud:"", afijo:""};
V.perros = function(){
  let l = perrosVisibles();
  if(fPer.q){ const q = norm(fPer.q); l = l.filter(p => norm([p.nombre,p.afijo,p.loe,p.chip,p.criadorNombre].join(" ")).includes(q)); }
  if(fPer.var) l = l.filter(p => p.variedad === fPer.var);
  if(fPer.sexo) l = l.filter(p => p.sexo === fPer.sexo);
  const res = C("resultados");
  if(fPer.apto === "si") l = l.filter(p => R.aptosDe(p, res).length);
  if(fPer.apto === "no") l = l.filter(p => !R.aptosDe(p, res).length);
  if(fPer.apto && FIG_POR_CODIGO[fPer.apto]) l = l.filter(p => R.aptosDe(p, res).includes(fPer.apto));
  if(fPer.salud === "completa") l = l.filter(p => R.anexoA(p).ok);
  if(fPer.salud === "pendiente") l = l.filter(p => !R.anexoA(p).ok);
  if(fPer.afijo) l = l.filter(p => (p.afijo||"") === fPer.afijo);
  const cols = [
    {t:"Ejemplar", s:p=>p.nombre, r:p=>`<span class="celda-nm">${p.avatar?`<img class="thumb" src="${p.avatar}" alt="" loading="lazy">`:avatar(p,34,"cuadrado")}
      <span><span class="nm">${esc(p.nombre)}</span>${p.afijo?`<div class="mini">${esc(p.afijo)}</div>`:""}</span></span>`},
    {t:"Afijo", s:p=>p.afijo||"", r:p=>afijoChip(p)},
    {t:"Var.", s:p=>p.variedad, r:p=>chipVar(p.variedad)},
    {t:"Sexo", s:p=>p.sexo, r:p=>`<span class="sexo">${p.sexo==="M"?"♂":"♀"}</span>`},
    {t:"Nacimiento", s:p=>p.fechaNacimiento||"", r:p=>`<span class="num">${fmtF(p.fechaNacimiento)}</span><div class="mini">${edadTxt(meses(p.fechaNacimiento))}</div>`},
    {t:"LOE", s:p=>p.loe||"", r:p=>`<span class="num">${esc(p.loe||"—")}</span>`},
    {t:"Anexo A", s:p=>R.anexoA(p).ok?1:0, r:p=>{
      const a = R.anexoA(p);
      if (a.ok) return `<span class="chip ok">Completo</span>`;
      if (a.bloqueos.length) return `<span class="chip block">Excluido</span>`;
      /* Antes salía «Falta Expediente de salud validado por el club +8»
         y descuadraba la tabla entera. El detalle va en el título
         emergente, que es donde no estorba. */
      const faltan = a.items.filter(i => i.e === "falta").map(i => i.t);
      return `<span class="chip warn" title="Falta: ${esc(faltan.join(" · "))}">${faltan.length} sin cumplir</span>`;
    }},
    {t:"Aptos de cría", s:p=>R.aptosDe(p,res).length, r:p=>chipApto(R.aptosDe(p,res))},
    {t:"Sin validar", s:p=>R.pendientes(p,res).total, r:p=>{const n=R.pendientes(p,res).total; return n?`<span class="chip warn">${n}</span>`:`<span class="dim">—</span>`;}},
    {t:"Propietario", s:p=>p.propietarioNombre||"", r:p=>p.propietarioId ? esc(nombreSocio(p.propietarioId)) : esc(p.propietarioNombre||"—")},
  ];
  return `<div class="filters">
      <input class="inp" id="f-per-q" placeholder="Nombre, afijo, LOE, chip…" value="${esc(fPer.q)}" style="min-width:200px">
      <select class="inp" id="f-per-var"><option value="">Todas las variedades</option>${VARIEDADES.map(v=>`<option ${fPer.var===v?"selected":""}>${esc(v)}</option>`).join("")}</select>
      <select class="inp" id="f-per-sexo"><option value="">Ambos sexos</option><option value="M" ${fPer.sexo==="M"?"selected":""}>Machos</option><option value="H" ${fPer.sexo==="H"?"selected":""}>Hembras</option></select>
      <select class="inp" id="f-per-apto"><option value="">Con y sin apto</option><option value="si" ${fPer.apto==="si"?"selected":""}>Con algún apto</option><option value="no" ${fPer.apto==="no"?"selected":""}>Sin apto</option>${FIGURAS.map(f=>`<option value="${f.c}" ${fPer.apto===f.c?"selected":""}>${f.c} — ${esc(f.n)}</option>`).join("")}</select>
      <select class="inp" id="f-per-afijo"><option value="">Todos los afijos</option>${
        [...new Set(perrosVisibles().map(p=>p.afijo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"))
          .map(a=>`<option ${fPer.afijo===a?"selected":""}>${esc(a)}</option>`).join("")}</select>
      <select class="inp" id="f-per-salud"><option value="">Salud: cualquiera</option><option value="completa" ${fPer.salud==="completa"?"selected":""}>Anexo A completo</option><option value="pendiente" ${fPer.salud==="pendiente"?"selected":""}>Anexo A pendiente</option></select>
      <span class="spacer"></span><span class="mini">${l.length} ejemplares</span>
      ${puedeDarDeAlta() ? `<button class="btn brand" data-form="perro|">Dar de alta un ejemplar</button>` : ""}
      ${SESION.esAdmin ? `<button class="btn" data-exportar="ejemplares">Exportar a Excel</button>` : ""}
    </div>
    ${l.length
      ? tabla("per", cols, l, p => "perro/" + p.id)
      : vacioEjemplares()}`;
};

/* Un socio registra sus perros; la junta, cualquiera. El visitante mira. */
function puedeDarDeAlta(){
  return SESION.rol !== "visitante" && (SESION.esAdmin || !!SESION.socio);
}

function vacioEjemplares(){
  const hayFiltro = fPer.q || fPer.var || fPer.sexo || fPer.apto || fPer.salud || fPer.afijo;
  const total = perrosVisibles().length;

  if (hayFiltro && total){
    return `<div class="card"><div class="empty">
      <b>Ningún ejemplar cumple estos filtros</b>
      Hay ${total} registrados: prueba a quitar alguno.
    </div></div>`;
  }

  return `<div class="card"><div class="empty">
    <b>Todavía no hay ejemplares registrados</b>
    ${SESION.rol === "visitante"
      ? `Entra con tu correo de socio para ver el libro y registrar tus perros.
         <div style="margin-top:14px"><a class="btn brand" href="#/entrar">Entrar</a></div>`
      : SESION.socio || SESION.esAdmin
        ? `Empieza por el tuyo: nombre, variedad, LOE y fecha de nacimiento.
           Las pruebas de salud y los resultados se añaden después, en su ficha.
           <div style="margin-top:14px"><button class="btn brand" data-form="perro|">Dar de alta un ejemplar</button></div>`
        : `Tu cuenta no está atada a ninguna ficha de socio, así que todavía no puedes
           registrar ejemplares.
           <div style="margin-top:14px"><button class="btn" data-ir="ajustes">Vincular mi cuenta</button></div>`}
  </div></div>`;
}

/* --- Ficha de ejemplar --- */
let tabPerro = "resumen";
V.perro = function(id){
  const p = byId(C("perros"), id);
  if(!p) return `<div class="empty"><b>Ejemplar no encontrado</b></div>`;
  if(!perroVisible(p)) return `<div class="empty"><b>Ficha reservada</b>Su propietario no ha compartido este ejemplar.</div>`;
  const res = C("resultados"), rs = R.res(id, res, true), figs = R.figurasDe(p, res), aptos = figs.filter(f=>f.cumple);
  const puedo = SESION.esAdmin || esYo(p.propietarioId);
  const tabs = [["resumen","Resumen"],["salud","Salud y genética"],["aptos","Aptos de cría"],["resultados","Resultados"],["pedigri","Pedigrí"],["progenie","Descendencia"],["galeria","Fotos y vídeos"]];
  let cuerpo = "";
  if(tabPerro === "resumen"){
    const prop = byId(C("socios"), p.propietarioId), cria = byId(C("socios"), p.criadorId);
    const a = R.anexoA(p);
    const trasp = C("solicitudes").find(x => x.tipo==="traspaso" && x.perroId===id && x.estado==="pendiente");
    const recl  = C("solicitudes").find(x => x.tipo==="reclamacion" && x.perroId===id && x.estado==="pendiente");
    /* Miles de fichas del libro salieron del pedigrí de un campeonato y
       no tienen dueño. Quien reconozca ahí a su perro puede decirlo. */
    const puedoReclamar = !!SESION.socio && !esYo(p.propietarioId) && !recl && !trasp;

    cuerpo = `${recl?`<div class="note warn" style="margin-bottom:14px"><b>Reclamación de titularidad pendiente.</b>
      ${esc(byId(C("socios"),recl.aSocioId)?.nombreCompleto||"Un socio")} dice que este ejemplar es suyo, el ${fmtF(recl.fecha)}${recl.documento?` · ${esc(recl.documento)}`:""}.
      ${recl.deSocioId?"La ficha sigue a nombre de su titular actual hasta que la junta resuelva.":"La ficha no cambia de manos hasta que la junta resuelva."}
      ${recl.motivo?`<div class="mini" style="margin-top:8px">${esc(recl.motivo)}</div>`:""}
      ${SESION.esAdmin?`<div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn brand" data-sol="autorizada|${esc(recl.id)}">Reconocer la titularidad</button>
        <button class="btn danger" data-sol="denegada|${esc(recl.id)}">Denegar</button></div>`:""}</div>`:""}
    ${puedoReclamar?`<div class="note" style="margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">${p.propietarioId
        ? "Si crees que esta ficha debería estar a tu nombre, dilo y la junta lo comprobará con su titular actual."
        : "Esta ficha no tiene titular: salió del pedigrí de un campeonato. Si el perro es tuyo, reclámala."}</div>
      <button class="btn brand" data-form="reclamacion|${esc(p.id)}">Este ejemplar es mío</button>
    </div>`:""}
    ${trasp?`<div class="note warn" style="margin-bottom:14px"><b>Cambio de titularidad pendiente de autorización.</b>
      Solicitado el ${fmtF(trasp.fecha)} a favor de ${esc(byId(C("socios"),trasp.aSocioId)?.nombreCompleto||"—")}${trasp.documento?` · ${esc(trasp.documento)}`:""}.
      La ficha sigue a nombre del titular actual hasta que la junta resuelva.
      ${SESION.esAdmin?`<div style="margin-top:10px;display:flex;gap:8px">
        <button class="btn brand" data-sol="autorizada|${esc(trasp.id)}">Autorizar traspaso</button>
        <button class="btn danger" data-sol="denegada|${esc(trasp.id)}">Denegar</button></div>`:""}</div>`:""}
    <div class="cols23"><div class="grid">
      <div class="card"><div class="card-h"><h3>Identificación</h3></div><div class="card-b"><dl class="kv">
        <dt>Nombre registrado</dt><dd>${esc(p.nombre)}${p.afijo?` <span class="dim">${esc(p.afijo)}</span>`:""}</dd>
        <dt>Afijo del criadero</dt><dd>${afijoChip(p)}</dd>
        <dt>Variedad</dt><dd>${chipVar(p.variedad)}${p.color?` <span class="dim">${esc(p.color)}</span>`:""}</dd>
        <dt>Sexo</dt><dd>${p.sexo==="M"?"Macho":"Hembra"}</dd>
        <dt>Nacimiento</dt><dd>${fmtF(p.fechaNacimiento)} <span class="dim">· ${edadTxt(meses(p.fechaNacimiento))}</span></dd>
        <dt>LOE</dt><dd class="num">${esc(p.loe||"—")}</dd>
        <dt>Microchip</dt><dd class="num">${esc(p.chip||"—")}</dd>
        <dt>Tatuaje</dt><dd class="num">${esc(p.tatuaje||"—")}</dd>
        <dt>Criador</dt><dd>${cria ? (perfilVisible(cria)
          ? `<a class="linkish" data-go="socio/${esc(cria.id)}">${esc(cria.nombreCompleto)}</a>`
          : `<span class="dim">${esc(nombreSocio(cria.id))}</span>`) : esc(p.criadorNombre||"—")}</dd>
        <dt>Propietario</dt><dd>${prop ? (perfilVisible(prop)
          ? `<a class="linkish" data-go="socio/${esc(prop.id)}">${esc(prop.nombreCompleto)}</a>`
          : `<span class="dim">${esc(nombreSocio(prop.id))}</span>`) : esc(p.propietarioNombre||"—")}
          ${puedo?` <button class="btn sm" data-form="traspaso|${esc(p.id)}">Cambiar titularidad</button>`:""}</dd>
        ${(p.historialTitularidad||[]).length?`<dt>Titulares anteriores</dt><dd style="font-weight:400">${
          (p.historialTitularidad||[]).map(h=>`${esc(byId(C("socios"),h.de)?.nombreCompleto||"—")} <span class="dim">→</span> ${esc(byId(C("socios"),h.a)?.nombreCompleto||"—")} <span class="mini">${fmtF(h.fecha)}</span>`).join("<br>")}</dd>`:""}
        ${p.workingdogUrl?`<dt>working-dog</dt><dd><a class="linkish" href="${esc(p.workingdogUrl)}" target="_blank" rel="noopener">Ficha externa</a></dd>`:""}
      </dl></div></div>
    </div><div class="grid">
      <div class="card"><div class="card-h"><h3>Situación reproductiva</h3></div><div class="card-b">
        ${aptos.length ? `<div class="note ok">Habilitado para la cría en el CEPPB: <b>${aptos.map(f=>f.fig.c).join(", ")}</b></div>`
          : figs.some(f=>f.excluido) ? `<div class="note block">Excluido de la cría por incumplir el Anexo A.</div>`
          : `<div class="note warn">Aún no alcanza ninguna figura de apto de cría.</div>`}
        <div style="margin-top:12px">${listaReq(a.items.slice(0,3).concat(a.items.filter(i=>i.gen).length?[{t:"Genética (4 pruebas)",d:GENES.map(g=>`${g.k}: ${(p.salud?.genes||{})[g.k]||"sin analizar"}`).join(" · "),e:a.items.filter(i=>i.gen).every(i=>i.e==="ok")?"ok":a.items.filter(i=>i.gen).some(i=>i.e==="no")?"no":"falta"}]:[]))}</div>
      </div></div>
      ${puedo?`<div class="card"><div class="card-h"><h3>Visibilidad</h3></div><div class="card-b">
        <div class="mini" style="margin-bottom:8px">Quién puede ver esta ficha en el directorio.</div>
        <div class="seg">${NIVELES.map(([k,n])=>`<button data-vis="${esc(p.id)}|${k}" class="${(p.visibilidad||"socios")===k?"on":""}">${esc(n)}</button>`).join("")}</div>
      </div></div>`:""}
    </div></div>`;
  }
  if(tabPerro === "salud"){
    const a = R.anexoA(p), s = p.salud||{};
    cuerpo = `<div class="cols2">
      <div class="card"><div class="card-h"><h3>Anexo A — requisitos veterinarios</h3>
        <span class="spacer"></span>${chipVal((s.validacion||{}).estado)}
        ${puedo?`<button class="btn sm" data-form="salud|${esc(p.id)}">Registrar pruebas</button>`:""}</div>
        <div class="card-b">
          ${(()=>{ const v = s.validacion || {};
            if(v.estado === "validado") return `<div class="note ok" style="margin-bottom:12px">Expediente cotejado por el club el ${fmtF(v.fecha)}. Estas pruebas ya cuentan para el apto de cría.</div>`;
            if(v.estado === "rechazado") return `<div class="note block" style="margin-bottom:12px"><b>Documentación rechazada.</b> ${esc(v.nota||"")}</div>`;
            return `<div class="note warn" style="margin-bottom:12px">Los datos los ha introducido el propietario y <b>aún no cuentan para el apto de cría</b>: la Comisión de Cría debe cotejarlos con los certificados originales.</div>`;
          })()}
          ${SESION.esAdmin?`<div style="display:flex;gap:8px;margin-bottom:14px">
            <button class="btn brand" data-val="salud|validado|${esc(p.id)}">Validar expediente</button>
            <button class="btn danger" data-val="salud|rechazado|${esc(p.id)}">Rechazar</button></div>`:""}
          ${listaReq(a.items)}</div></div>
      <div class="grid">
        <div class="card"><div class="card-h"><h3>Perfil genético</h3></div><div class="card-b">
          <table>${GENES.map(g=>{const v=(s.genes||{})[g.k]||"";
            return `<tr><td><b>${g.k}</b><div class="mini">${esc(g.n)}</div></td><td style="text-align:right">${
              v==="libre"?`<span class="chip ok">Libre</span>`:v==="portador"?`<span class="chip warn">Portador</span>`:v==="afectado"?`<span class="chip block">Afectado</span>`:`<span class="chip">Sin analizar</span>`}</td></tr>`;}).join("")}</table>
          ${Object.values(s.genes||{}).includes("portador")?`<div class="note warn" style="margin-top:12px">Portador: sólo puede cruzarse con ejemplares libres de ese mismo gen (Anexo A.4).</div>`:""}
        </div></div>
        <div class="card"><div class="card-h"><h3>Radiología</h3></div><div class="card-b"><dl class="kv">
          <dt>Cadera (HD)</dt><dd>${s.hd?`<span class="chip ${HD_OK.includes(s.hd)?"ok":"block"}">Grado ${esc(s.hd)}</span>`:`<span class="dim">Sin diagnóstico</span>`} ${esc(s.hdEntidad||"")}</dd>
          <dt>Codo (ED)</dt><dd>${s.ed!==undefined&&s.ed!==""?`<span class="chip ${ED_OK.includes(String(s.ed))?"ok":"block"}">Grado ${esc(s.ed)}</span>`:`<span class="dim">Sin diagnóstico</span>`} ${esc(s.edEntidad||"")}</dd>
          <dt>LVT</dt><dd>${s.lvt==="libre"?`<span class="chip ok">Libre</span>`:s.lvt?`<span class="chip block">Con vértebra de transición</span>`:`<span class="dim">Radiografías no tramitadas</span>`}</dd>
        </dl>
        <div class="note" style="margin-top:12px">El diagnóstico de LVT lo emite el propio CEPPB a partir de dos proyecciones (ventrodorsal y laterolateral de T13 a sacro) remitidas por un veterinario registrado en el club.</div>
        </div></div>
      </div></div>`;
  }
  if(tabPerro === "aptos"){
    cuerpo = `<div class="note" style="margin-bottom:14px">Las dos vías del club: <span class="chip est">estructura</span> y <span class="chip uti">utilidad</span>. El Gran Seleccionado exige las dos.</div>
    <div class="figs">${figs.map(f => `<div class="fig ${f.cumple?"cumple":""}" data-via="${f.fig.via}" style="--via:${VIA_COLOR[f.fig.via]}">
      <div class="fig-h"><span class="code">${f.fig.c}</span><div><div class="nm2">${esc(f.fig.n)}</div></div>
      <span class="spacer"></span>${f.cumple?`<span class="chip ok">Cumple</span>`:f.excluido?`<span class="chip block">Excluido</span>`:`<span class="chip warn">Faltan ${f.faltan}</span>`}</div>
      <div class="fig-b">${listaReq(f.items)}</div></div>`).join("")}</div>`;
  }
  if(tabPerro === "resultados"){
    const cols = [
      /* Las actas de los campeonatos que volcó el club traen el año pero
         no el día: se enseña el año antes que un hueco en blanco. */
      {t:"Fecha", s:r=>r.fecha||(r.anio?r.anio+"-00-00":""), r:r=>`<span class="num">${r.fecha?fmtF(r.fecha):(r.anio||"—")}</span>`},
      {t:"Tipo", s:r=>r.tipo, r:r=>`<span class="chip">${esc({estructura:"Estructura",caracter:"Carácter",trabajo:"Trabajo",confirmacion:"Confirmación"}[r.tipo]||r.tipo)}</span>`},
      {t:"Evento", s:r=>r.evento||"", r:r=>`${esc(r.evento||r.tipoEvento||"—")}${r.organizadoCEPPB?` <span class="chip">CEPPB</span>`:""}`},
      {t:"Resultado", s:r=>r.calificacion||r.resultado||r.titulo||"", r:r=>{
        /* «MP» (muy prometedor) es de las clases de cachorro y no
           está en la escala de aptos de cría: se enseña, pero no se
           traduce a ninguna calificación del club. */
        if(r.tipo==="estructura") return `<span class="chip ${r.calificacion==="EXC"?"ok":""}">${esc(r.calificacion||r.calificacionOrigen||"—")}</span>${r.distincion?` <span class="chip">${esc(r.distincion)}</span>`:""}${r.titulo?` <span class="chip">${esc(r.titulo)}</span>`:""}${r.puesto?` <span class="num">${r.puesto}º</span>`:""}${r.clase?`<div class="mini">Clase ${esc(String(r.clase).toLowerCase())}</div>`:""}`;
        if(r.tipo==="trabajo") return `${r.titulo?`<span class="chip ok">${esc(r.titulo)}</span> `:""}${r.calificacion?`<span class="chip">${esc(r.calificacion)}</span>`:""}${r.puntos!=null&&!(r.calificacion==="DESC"&&!r.puntos)?` <span class="num" title="${r.puntosSobre?"Sobre "+r.puntosSobre:""}">${r.puntos}${r.puntosSobre?"/"+r.puntosSobre:""} pts</span>`:""}${r.puesto?` <span class="num">${r.puesto}º</span>`:""}${!r.titulo&&!r.calificacion&&r.puntos==null&&!r.puesto?`<span class="chip">—</span>`:""}${r.clase?`<div class="mini">${esc(r.clase)}</div>`:""}`;
        return `<span class="chip ${r.resultado==="APTO"?"ok":"block"}">${esc(r.modalidad?r.modalidad+" · ":"")}${esc(r.resultado||"—")}</span>`;}},
      {t:"Guía", s:r=>r.guia||"", r:r=>`${esc(r.guia||"—")}${r.equipo?`<div class="mini">${esc(r.equipo)}</div>`:""}`},
      {t:"Juez", s:r=>r.juez||"", r:r=>esc(r.juez||"—")},
      {t:"Validación", s:r=>r.validado||"pendiente", r:r=>chipVal(r.validado) +
        (SESION.esAdmin && r.validado!=="validado" ? ` <button class="btn sm" data-val="res|validado|${esc(r.id)}">Validar</button>` : "") +
        (SESION.esAdmin && r.validado!=="rechazado" ? ` <button class="btn sm danger" data-val="res|rechazado|${esc(r.id)}">✕</button>` : "")},
    ];
    const pRA = R.puntuacion(id, res, "ra"), pGC = R.puntuacion(id, res, "granch");
    const sinVal = rs.todos.filter(r => r.validado !== "validado").length;
    cuerpo = `<div class="cols23"><div>
      ${puedo?`<div style="margin-bottom:12px"><button class="btn primary" data-form="resultado|${esc(p.id)}">Añadir resultado</button></div>`:""}
      ${sinVal?`<div class="note warn" style="margin-bottom:12px">${sinVal} resultado(s) sin validar. No cuentan para los aptos de cría ni para el baremo hasta que la junta los coteje con el certificado del juez.</div>`:""}
      ${tabla("res", cols, rs.todos)}</div>
      <div class="card"><div class="card-h"><h3>Puntuación del club</h3><span class="hint">Cap. 7</span></div><div class="card-b">
        <dl class="kv"><dt>Baremo Reproductor del Año / Campeón del Club</dt><dd class="num" style="font-size:19px">${pRA.total} pts</dd>
        <dt>Baremo Gran Campeón del CEPPB</dt><dd class="num" style="font-size:19px">${pGC.total} pts</dd></dl>
        <div class="note ${pRA.especial?"ok":"warn"}" style="margin-top:12px">${pRA.especial?"Ha puntuado en la Especial de Cría, requisito imprescindible para los títulos de campeón.":"Sin puntuación en la Especial de Cría: sin ella no puede optar a Campeón del Club ni a Gran Campeón."}</div>
        <div class="mini" style="margin-top:10px">MB 3 · EXC 8 · RCAC/RCACIB/RCCPB 10 · CAC/CACIB/CCPB 12 · Test simple 4 · Test completo 6. Especial de Cría ×1,5.</div>
      </div></div></div>`;
  }
  if(tabPerro === "pedigri"){
    cuerpo = pedigriDe(p, puedo);
  }
  if(tabPerro === "progenie"){
    const hijos = C("perros").filter(x => x.padreId === id || x.madreId === id);
    const rsup = R.reproductorSuperior(p, C("perros"), res);
    cuerpo = `<div class="cols23">
      <div class="card"><div class="card-h"><h3>Descendencia registrada</h3><span class="hint">${hijos.length}</span></div>
        <div class="card-b" style="padding:0">${hijos.length?tablaPerrosMini(hijos):`<div class="empty" style="padding:26px">Sin descendencia registrada en la plataforma</div>`}</div></div>
      <div class="card"><div class="card-h"><h3>Reproductor Superior</h3><span class="hint">Cap. 7</span></div><div class="card-b">
        ${listaReq([
          {t:`${rsup.min} hijos con apto de cría`, d:`${rsup.conApto} de ${rsup.hijos} descendientes registrados tienen apto`, e:rsup.conApto>=rsup.min?"ok":"falta", r:p.sexo==="M"?"Machos: 4 hijos":"Hembras: 3 hijos"},
          {t:"Al menos dos alianzas distintas", d:`${rsup.alianzas} pareja(s) distintas`, e:rsup.alianzas>=2?"ok":"falta", r:"Cap. 7"},
          {t:"Apto de cría propio (categoría A)", d:R.aptosDe(p,res).length?"Lo tiene":"Sin apto propio", e:R.aptosDe(p,res).length?"ok":"falta", r:"RSA exige apto propio; rsB no"},
        ])}
        <div style="margin-top:12px">${rsup.rsA?`<span class="chip ok">RSA — Reproductor Superior A</span>`:rsup.rsB?`<span class="chip ok">rsB — Reproductor Superior B</span>`:`<span class="chip">Aún no alcanza RSA ni rsB</span>`}</div>
      </div></div></div>`;
  }
  if(tabPerro === "galeria") cuerpo = galeria(p, puedo);
  return `<div class="ficha-h">
      ${avatar(p, 76)}
      <div style="flex:1;min-width:250px">
        <h2>${esc(p.nombre)}${p.ejemplo?` <span class="badge-ej">ejemplo</span>`:""}</h2>
        <div class="meta">${chipVar(p.variedad)}<span class="chip">${p.sexo==="M"?"Macho ♂":"Hembra ♀"}</span>
          <span class="chip mono">${esc(p.loe||"sin LOE")}</span>
          <span class="chip">${edadTxt(meses(p.fechaNacimiento))}</span></div>
        <div class="meta" style="margin-top:9px">${medidor(figs)}
          <span class="mini">${aptos.length} de 5 figuras de apto de cría</span>
          ${chipApto(aptos.map(f=>f.fig.c))}</div>
      </div>
      ${puedo?`<button class="btn" data-form="perro|${esc(p.id)}">Editar ficha</button>`:""}
      ${puedeCertificar(p)?`<a class="btn brand" href="#/certificado/${esc(p.id)}">Certificado del club</a>`:""}
    </div>
    <div class="tabs">${tabs.map(([k,n])=>`<button data-tab="${k}" class="${tabPerro===k?"on":""}">${esc(n)}</button>`).join("")}</div>
    ${cuerpo}`;
};


/* ============================================================
   Pedigrí desplegado

   Hasta cinco generaciones. Los ancestros que aparecen por más de
   una rama van marcados: son los que meten la consanguinidad, y un
   criador quiere verlos de un vistazo, no deducirlos.
   ============================================================ */

let genPedigri = 4;

function pedigriDe(p, puedo){
  ponerCenso(C("perros"));

  const n = genPedigri;
  const columnas = [];

  /* Cada generación, en su columna. La primera son padre y madre. */
  let nivel = [p.id];
  for (let g = 1; g <= n; g++){
    const siguiente = [];
    for (const id of nivel){
      const d = id ? byId(C("perros"), id) : null;
      siguiente.push(d ? d.padreId || null : null);
      siguiente.push(d ? d.madreId || null : null);
    }
    columnas.push(siguiente);
    nivel = siguiente;
  }

  /* Quién sale más de una vez en todo el árbol */
  const veces = new Map();
  for (const col of columnas)
    for (const id of col) if (id) veces.set(id, (veces.get(id) || 0) + 1);
  const repetidos = [...veces.entries()].filter(([, c]) => c > 1).map(([id]) => id);
    /* A cada repetido, su color. Los que más veces salen primero, que
     son los que más pesan en la consanguinidad. */
  const porPeso = repetidos.slice().sort((a, b) => veces.get(b) - veces.get(a));
  const marca = new Map(porPeso.map((id, i) => [id, (i % 8) + 1]));

  const casilla = id => {
    const d = id ? byId(C("perros"), id) : null;
    if (!d) return `<div class="ped-n vacio">—</div>`;
    const m = marca.get(id);
    return `<div class="ped-n ${d.sexo === "M" ? "m" : d.sexo === "H" ? "h" : ""} ${m ? "rep r" + m : ""} clic"
      data-go="perro/${esc(d.id)}" title="${esc(d.nombre)}${m ? ` · aparece ${veces.get(id)} veces en este pedigrí` : ""}">
      <b>${esc(d.nombre)}</b><small>${esc(d.loe || d.variedad || "")}</small></div>`;
  };

  const f    = consanguinidad(p.id);
  const j    = juzgarConsanguinidad(f);
  const prof = profundidadPedigri(p.id);
  const comp = completitudPedigri(p.id, n);
  const pct  = x => (x * 100).toFixed(2).replace(".", ",") + " %";

  return `<div class="card">
    <div class="card-h"><h3>Pedigrí</h3>
      <div class="seg" style="margin-left:10px">
        ${[3,4,5].map(g => `<button data-gen="${g}" class="${genPedigri===g?"on":""}">${g} gen.</button>`).join("")}
      </div>
      <span class="spacer"></span>
      ${p.workingdogUrl ? `<a class="btn sm" href="${esc(p.workingdogUrl)}" target="_blank" rel="noopener noreferrer">En working-dog</a>` : ""}
      ${puedo ? `<button class="btn sm" data-form="perro|${esc(p.id)}">Editar padres</button>` : ""}
    </div>

    <div class="card-b" style="padding:12px 16px 0">
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:baseline">
        <div><span class="mini">Consanguinidad</span>
          <b style="margin-left:6px;color:var(--${j.nivel === "block" ? "block" : j.nivel === "warn" ? "warn" : "ok"})">${pct(f)}</b></div>
        <div><span class="mini">Generaciones conocidas</span> <b style="margin-left:6px">${prof}</b></div>
        <div><span class="mini">Pedigrí completo</span> <b style="margin-left:6px">${pct(comp)}</b></div>
        ${repetidos.length ? `<div><span class="mini">Ancestros repetidos</span>
          <b style="margin-left:6px">${repetidos.length}</b></div>` : ""}
      </div>
    </div>

    <div class="card-b" style="overflow-x:auto">
      <div class="ped g${n}">
        ${columnas.map(col => `<div class="ped-col">${col.map(casilla).join("")}</div>`).join("")}
      </div>
    </div>

    ${repetidos.length ? `<div class="card-b" style="border-top:1px solid var(--line)">
      <div class="mini" style="margin-bottom:8px">Aparecen por las dos ramas y son los que meten la consanguinidad:</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${repetidos.slice(0, 12).map(id => {
          const d = byId(C("perros"), id);
          return `<a class="chip rep r${marca.get(id)}" href="#/perro/${esc(id)}">${esc(d ? d.nombre : "")}
            <b style="margin-left:5px">×${veces.get(id)}</b></a>`;
        }).join("")}
      </div>
    </div>` : ""}
  </div>`;
}
