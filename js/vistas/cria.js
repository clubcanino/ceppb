/* Aptos de cría, simulador de cruce y expedientes intervariedades. */
"use strict";

/* --- Aptos de cría (matriz) --- */
V.aptos = function(){
  const res = C("resultados");
  const l = perrosVisibles().map(p => ({p, figs: R.figurasDe(p, res)}));
  const cols = [
    {t:"Ejemplar", s:x=>x.p.nombre, r:x=>`<span class="nm">${esc(x.p.nombre)}</span><div class="mini">${esc(x.p.variedad||"")} · ${x.p.sexo==="M"?"♂":"♀"}</div>`},
    {t:"Edad", s:x=>meses(x.p.fechaNacimiento)||0, r:x=>`<span class="num">${edadTxt(meses(x.p.fechaNacimiento))}</span>`},
    {t:"Anexo A", s:x=>R.anexoA(x.p).ok?1:0, r:x=>{const a=R.anexoA(x.p);return a.ok?`<span class="chip ok">✓</span>`:a.bloqueos.length?`<span class="chip block">✕</span>`:`<span class="chip warn">${a.items.filter(i=>i.e==="falta").length}</span>`;}},
    ...FIGURAS.map(f => ({t:f.c, via:f.via, s:x=>{const g=x.figs.find(y=>y.fig.c===f.c);return g.cumple?2:g.excluido?0:1;},
      r:x=>{const g=x.figs.find(y=>y.fig.c===f.c);
        return g.cumple?`<span class="chip ok">Cumple</span>`:g.excluido?`<span class="chip block">Excluido</span>`:`<span class="chip warn" title="${esc(g.items.filter(i=>i.e!=="ok").map(i=>i.t).join(" · "))}">Faltan ${g.faltan}</span>`;}})),
  ];
  const casi = l.filter(x => x.figs.some(f => !f.cumple && !f.excluido && f.faltan === 1));
  if(!l.length) return `<div class="card"><div class="empty"><b>Sin ejemplares que evaluar</b>
    Esta pantalla cruza cada perro registrado con las cinco figuras del Capítulo 2 y señala qué le falta a cada uno.
    ${SESION.rol!=="visitante"?`<div style="margin-top:14px"><button class="btn brand" data-form="perro|">Dar de alta un ejemplar</button></div>`:""}</div></div>`;
  return `<div class="note" style="margin-bottom:14px">Cada columna es una de las cinco figuras del <b>Capítulo 2</b>. Pasa el cursor sobre un aviso para ver qué falta exactamente.</div>
    ${casi.length?`<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>A un solo requisito del apto</h3><span class="hint">${casi.length} ejemplares</span></div>
      <div class="card-b" style="padding:0"><table>${casi.map(x=>{const f=x.figs.find(y=>!y.cumple&&!y.excluido&&y.faltan===1);
        return `<tr class="clic" data-go="perro/${esc(x.p.id)}"><td><span class="nm">${esc(x.p.nombre)}</span></td><td><span class="chip">${f.fig.c}</span></td>
        <td>${esc(f.items.find(i=>i.e!=="ok").t)}<div class="mini">${esc(f.items.find(i=>i.e!=="ok").d)}</div></td></tr>`;}).join("")}</table></div></div>`:""}
    ${tabla("apt", cols, l, x=>"perro/"+x.p.id)}`;
};

/* --- Simulador de cruce --- */
let cruceSel = {m:"", h:""};
V.cruce = function(){
  const perros = perrosVisibles(), res = C("resultados");
  const machos = perros.filter(p=>p.sexo==="M"), hembras = perros.filter(p=>p.sexo==="H");
  if(!cruceSel.m && machos.length) cruceSel.m = machos[0].id;
  if(!cruceSel.h && hembras.length) cruceSel.h = hembras[0].id;
  const m = byId(perros, cruceSel.m), h = byId(perros, cruceSel.h);
  let panel = perros.length
    ? `<div class="empty"><b>Elige los dos reproductores</b>Se comprueban edad, Anexo A, genética y variedades contra el reglamento.</div>`
    : `<div class="empty"><b>Aún no hay ejemplares registrados</b>El simulador compara dos reproductores contra el reglamento; primero hay que dar de alta al menos un macho y una hembra.
        ${SESION.rol!=="visitante"?`<div style="margin-top:14px"><button class="btn brand" data-form="perro|">Dar de alta un ejemplar</button></div>`:""}</div>`;
  if(m && h){
    const l = R.cruce(m, h, C("perros"), res), v = R.cruceVeredicto(l);
    const orden = {bloqueo:0, aviso:1, ok:2};
    l.sort((a,b)=>orden[a.n]-orden[b.n]);
    panel = `<div class="note ${v==="bloqueo"?"block":v==="aviso"?"warn":"ok"}" style="margin-bottom:14px">
        ${v==="bloqueo"?"<b>Cruce no autorizable.</b> Hay incumplimientos del reglamento que lo impiden."
        :v==="aviso"?"<b>Cruce posible con condiciones.</b> Revisa los avisos antes de solicitarlo a la Comisión de Cría."
        :"<b>Cruce conforme al reglamento.</b> Ambos reproductores cumplen los requisitos comprobables."}</div>
      ${listaReq(l.map(x=>({t:x.t, d:x.r||"", e:x.n==="bloqueo"?"no":x.n==="aviso"?"falta":"ok"})))}
      ${R.esInter(m,h) ? (()=>{ const sol = solicitudDe(m.id,h.id); const e = sol?EST_SOL[sol.estado]:null;
        return `<div class="card lift" style="margin-top:16px"><div class="card-h"><h3>Autorización previa del club</h3>
          <span class="spacer"></span>${sol?`<span class="chip ${e.c}">${esc(e.t)}</span>`:`<span class="chip warn">Sin solicitar</span>`}</div>
          <div class="card-b">
            <div class="note ${sol&&sol.estado==="autorizada"?"ok":"warn"}">${sol&&sol.estado==="autorizada"
              ? "Cruce autorizado por la Junta Directiva. La camada podrá declararse y difundirse."
              : sol&&sol.estado==="denegada" ? "Este cruce fue denegado. La camada no puede publicarse."
              : sol ? "Expediente presentado y pendiente de resolución. Hasta que se resuelva, la camada no se publica."
              : "Este cruce necesita autorización previa de la Comisión de Cría antes de realizarse. Sin ella, la camada queda retenida y no se difunde."}</div>
            ${!sol&&SESION.rol!=="visitante"?`<div style="margin-top:12px"><button class="btn brand" data-form="solicitud|${esc(m.id)}~${esc(h.id)}">Solicitar autorización</button></div>`:""}
            ${sol?`<div style="margin-top:12px"><button class="btn" data-go="intervar">Ver el expediente</button></div>`:""}
          </div></div>`; })() : ""}
      ${GENES.some(g=>((m.salud?.genes||{})[g.k]==="portador")||((h.salud?.genes||{})[g.k]==="portador")) ? `
      <div class="card" style="margin-top:16px"><div class="card-h"><h3>Previsión genética de la camada</h3></div><div class="card-b">
        ${GENES.map(g=>{const a=(m.salud?.genes||{})[g.k]||"?", b=(h.salud?.genes||{})[g.k]||"?";
          let pred = "No calculable: falta algún análisis";
          if(a==="libre"&&b==="libre") pred="100 % libres";
          else if((a==="portador"&&b==="libre")||(a==="libre"&&b==="portador")) pred="50 % libres · 50 % portadores · 0 % afectados";
          else if(a==="portador"&&b==="portador") pred="25 % libres · 50 % portadores · 25 % AFECTADOS — cruce prohibido";
          return `<div class="req"><div class="tx"><b>${g.k}</b><small>${esc(pred)}</small></div></div>`;}).join("")}
      </div></div>`:""}`;
  }
  const opt = (l, sel) => l.map(p=>`<option value="${esc(p.id)}" ${sel===p.id?"selected":""}>${esc(p.nombre)}${p.variedad?" · "+p.variedad:""}</option>`).join("");
  return `<div class="cols23">
    <div>${panel}</div>
    <div class="grid">
      <div class="card"><div class="card-h"><h3>Reproductores</h3></div><div class="card-b">
        <div class="f" style="margin-bottom:12px"><label>Macho</label>
          <select class="inp" id="cr-m"><option value="">— elegir —</option>${opt(machos, cruceSel.m)}</select></div>
        <div class="f"><label>Hembra</label>
          <select class="inp" id="cr-h"><option value="">— elegir —</option>${opt(hembras, cruceSel.h)}</select></div>
      </div></div>
      <div class="card"><div class="card-h"><h3>Cruces intervariedades autorizados</h3><span class="hint">Cap. 8.2</span></div><div class="card-b">
        ${CRUCES_INTER.map(c=>`<div class="req"><div class="tx"><b>${esc(c.a)} × ${esc(c.b)}</b><small>${esc(c.nota)}</small></div></div>`).join("")}
        <div class="note" style="margin-top:10px">Cualquier otra unión directa entre variedades está prohibida. Las autorizadas requieren solicitud previa con informe motivado, pedigrís, radiografías y ADN.</div>
      </div></div>
    </div></div>`;
};

/* --- Autorización de cruce intervariedades (Cap. 8) --- */
const EST_SOL = {
  pendiente:  {t:"Pendiente de resolución", c:"warn"},
  autorizada: {t:"Autorizada",              c:"ok"},
  denegada:   {t:"Denegada",                c:"block"},
};
function solicitudDe(machoId, hembraId){
  return C("solicitudes").find(x => x.machoId === machoId && x.hembraId === hembraId) || null;
}
/* Una camada intervariedades sólo se difunde si su cruce está autorizado */
function camadaPublicable(c){
  const m = byId(C("perros"), c.padreId), h = byId(C("perros"), c.madreId);
  if(!R.esInter(m, h)) return {ok:true};
  const sol = solicitudDe(c.padreId, c.madreId);
  if(sol && sol.estado === "autorizada") return {ok:true, sol};
  return {ok:false, sol, motivo: !sol ? "Cruce intervariedades sin expediente de autorización"
    : sol.estado === "denegada" ? "La Junta Directiva denegó este cruce" : "Expediente pendiente de resolución"};
}

V.intervar = function(){
  const todas = C("solicitudes").filter(x => x.tipo === "intervariedad");
  const soc = SESION.esAdmin ? todas : todas.filter(x => x.criadorId === miSocioId());
  const orden = {pendiente:0, autorizada:1, denegada:2};
  const l = soc.slice().sort((a,b) => (orden[a.estado]-orden[b.estado]) || String(b.fecha).localeCompare(String(a.fecha)));
  const tarjeta = x => {
    const m = byId(C("perros"), x.machoId), h = byId(C("perros"), x.hembraId), cr = byId(C("socios"), x.criadorId);
    const ev = (m && h) ? R.intervariedad(m, h, {criador:cr, pagos:C("pagos"), resultados:C("resultados")}) : null;
    const e = EST_SOL[x.estado] || EST_SOL.pendiente;
    const dias = x.fecha ? Math.floor((Date.now() - new Date(x.fecha)) / 86400000) : 0;
    return `<div class="card lift" style="margin-bottom:14px">
      <div class="card-h"><h3>${esc(m?.nombre||"?")} <span class="dim">×</span> ${esc(h?.nombre||"?")}</h3>
        <span class="chip">${esc(m?.variedad||"?")} × ${esc(h?.variedad||"?")}</span>
        <span class="spacer"></span><span class="chip ${e.c}">${esc(e.t)}</span></div>
      <div class="card-b">
        <dl class="kv" style="margin-bottom:14px">
          <dt>Criador</dt><dd>${cr?`<a class="linkish" data-go="socio/${esc(cr.id)}">${esc(cr.nombreCompleto)}</a>`:"—"}</dd>
          <dt>Línea solicitada</dt><dd>${esc(x.linea||"—")}</dd>
          <dt>Presentada</dt><dd>${fmtF(x.fecha)}${x.estado==="pendiente"?` <span class="mini">· ${dias} de 30 días hábiles</span>`:""}</dd>
          ${x.motivo?`<dt>Motivación</dt><dd style="font-weight:400">${esc(x.motivo)}</dd>`:""}
          ${x.resolucion?`<dt>Resolución</dt><dd style="font-weight:400">${esc(x.resolucion)} <span class="mini">· ${fmtF(x.fechaResolucion)}</span></dd>`:""}
        </dl>
        ${ev?`<div class="eyebrow" style="margin-bottom:7px">Documentación exigida por el Capítulo 8</div>${listaReq(ev.items)}`:""}
        ${SESION.esAdmin&&x.estado==="pendiente"?`<div style="margin-top:14px;display:flex;gap:8px">
          <button class="btn brand" data-sol="autorizada|${esc(x.id)}">Autorizar el cruce</button>
          <button class="btn danger" data-sol="denegada|${esc(x.id)}">Denegar</button></div>`:""}
        ${x.estado==="autorizada"?`<div class="note ok" style="margin-top:12px">Autorizado. La camada que nazca de este cruce puede declararse y difundirse; la resolución se traslada también a la RSCE.</div>`:""}
      </div></div>`;
  };
  const pend = l.filter(x=>x.estado==="pendiente");
  return `<div class="note" style="margin-bottom:16px">Las uniones directas entre variedades están prohibidas. Las tres combinaciones admitidas exigen <b>autorización previa</b>: la Comisión de Cría informa y la Junta Directiva resuelve en <b>30 días hábiles</b>. Hasta entonces la camada no se publica ni se difunde. <span class="rule-src">Cap. 8</span></div>
    ${SESION.esAdmin&&pend.length?`<div class="note warn" style="margin-bottom:16px"><b>${pend.length} expediente(s) esperando resolución de la Junta Directiva.</b></div>`:""}
    ${l.length ? l.map(tarjeta).join("")
      : `<div class="card"><div class="empty"><b>Sin expedientes</b>Los cruces entre variedades se solicitan desde el simulador de cruce, eligiendo los dos reproductores.
         <div style="margin-top:14px"><button class="btn brand" data-go="cruce">Ir al simulador de cruce</button></div></div></div>`}`;
};

/* --- Camadas --- */
