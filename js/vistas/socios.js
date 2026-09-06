/* ============================================================
   Socios: directorio y ficha de perfil.
   Solo aparece quien ha autorizado que se le vea.
   ============================================================ */
"use strict";


/* --- Directorio de socios --- */
let fSoc = {q:"", prov:"", cuota:"", criador:false, disc:"", rol:"", varie:""};
V.socios = function(){
  const censo = C("socios");
  let l = censo.filter(perfilVisible);
  const ocultos = censo.length - l.length;
  if(fSoc.q){ const q = norm(fSoc.q); l = l.filter(s => norm(s.nombreCompleto+" "+s.afijo+" "+s.poblacion+" "+s.provincia+" "+s.numero).includes(q)); }
  if(fSoc.prov) l = l.filter(s => s.provincia === fSoc.prov);
  if(fSoc.cuota) l = l.filter(s => s.cuota === fSoc.cuota);
  if(fSoc.criador) l = l.filter(s => s.esCriador);
  if(fSoc.disc)  l = l.filter(s => (s.disciplinas||[]).includes(fSoc.disc));
  if(fSoc.rol)   l = l.filter(s => (s.roles||[]).includes(fSoc.rol));
  if(fSoc.varie) l = l.filter(s => (s.variedades||[]).includes(fSoc.varie));
  const provs = [...new Set(censo.filter(perfilVisible).map(s=>s.provincia).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  const cuotas = [...new Set(censo.map(s=>s.cuota).filter(Boolean))].sort();
  const cols = [
    {t:"Nº", s:s=>s.numero, r:s=>`<span class="num">${s.numero||"—"}</span>`},
    {t:"Socio", s:s=>s.apellidos, r:s=>`<span class="celda-nm">${avatar(s,32)}<span><span class="nm">${esc(s.nombreCompleto)}</span>${s.socioHonor?` <span class="chip">Honor</span>`:""}</span></span>`},
    {t:"Afijo", s:s=>s.afijo, r:s=>s.afijo && visible(s,"afijo") ? `<span class="chip mono">${esc(s.afijo)}</span>` : `<span class="dim">—</span>`},
    {t:"Localidad", s:s=>s.provincia, r:s=>visible(s,"provincia") ? `${esc(s.poblacion||"")}${s.provincia?`<span class="dim"> · ${esc(s.provincia)}</span>`:""}` : `<span class="dim">Reservado</span>`},
    {t:"Disciplinas", s:s=>(s.disciplinas||[])[0]||"", r:s=>visible(s,"disciplinas") ? (s.disciplinas||[]).slice(0,2).map(d=>`<span class="chip">${esc(d)}</span>`).join(" ") + ((s.disciplinas||[]).length>2?` <span class="mini">+${s.disciplinas.length-2}</span>`:"") || `<span class="dim">—</span>` : `<span class="dim">—</span>`},
    {t:"RSCE", s:s=>s.rsceSocio?1:0, r:s=>visible(s,"rsce") ? (s.rsceSocio?`<span class="chip ok">Sí</span>`:`<span class="dim">No</span>`) : `<span class="dim">—</span>`},
    {t:"Club", s:s=>(s.roles||[])[0]||"", r:s=>(s.roles||[]).length?`<span class="chip est" title="${esc((s.roles||[]).join(" · "))}">${esc((s.roles||[])[0])}${(s.roles||[]).length>1?` +${s.roles.length-1}`:""}</span>`:`<span class="dim">—</span>`},
    {t:"Perros", s:s=>C("perros").filter(p=>p.propietarioId===s.id).length, r:s=>{const n=C("perros").filter(p=>p.propietarioId===s.id&&perroVisible(p)).length; return n?`<span class="num">${n}</span>`:`<span class="dim">—</span>`;}},
    {t:"Cuota", s:s=>s.cuota, r:s=> SESION.esAdmin ? `<span class="chip">${esc(s.cuota||"—")}</span>` : `<span class="dim">—</span>`},
  ];
  return `<div class="filters">
      <input class="inp" id="f-soc-q" placeholder="Nombre, afijo, población…" value="${esc(fSoc.q)}" style="min-width:210px">
      <select class="inp" id="f-soc-prov"><option value="">Toda España</option>${provs.map(p=>`<option ${fSoc.prov===p?"selected":""}>${esc(p)}</option>`).join("")}</select>
      <select class="inp" id="f-soc-cuota"><option value="">Todas las cuotas</option>${cuotas.map(p=>`<option ${fSoc.cuota===p?"selected":""}>${esc(p)}</option>`).join("")}</select>
      <select class="inp" id="f-soc-disc"><option value="">Toda disciplina</option>${DISCIPLINAS.map(d=>`<option ${fSoc.disc===d?"selected":""}>${esc(d)}</option>`).join("")}</select>
      <select class="inp" id="f-soc-varie"><option value="">Toda variedad</option>${VARIEDADES.map(v=>`<option ${fSoc.varie===v?"selected":""}>${esc(v)}</option>`).join("")}</select>
      <select class="inp" id="f-soc-rol"><option value="">Cualquier condición</option>${ROLES_CLUB.map(r=>`<option ${fSoc.rol===r?"selected":""}>${esc(r)}</option>`).join("")}</select>
      <label class="chip" style="cursor:pointer"><input type="checkbox" id="f-soc-cri" ${fSoc.criador?"checked":""}> Sólo criadores</label>
      <span class="spacer"></span><span class="mini">${l.length} socio(s)</span>
      ${SESION.esAdmin ? `
        <button class="btn brand" data-form="socio|">Dar de alta un socio</button>
        <button class="btn" data-exportar="censo">Exportar a Excel</button>
        <button class="btn sm" data-exportar="censo-completo" title="Incluye DNI, dirección e IBAN">Con datos reservados</button>` : ""}
    </div>
    ${ocultos ? `<div class="note" style="margin-bottom:14px">${SESION.esAdmin
      ? `<b>${ocultos} de ${censo.length} socios no han hecho visible su perfil.</b> Como junta los ves aquí igualmente, pero para el resto del club no aparecen en el directorio.`
      : `${ocultos} socios han preferido no aparecer en el directorio. Cada uno decide si figura y qué datos comparte.`}</div>` : ""}
    ${tabla("soc", cols, l, s=>"socio/"+s.id)}`;
};

/* --- Perfil de socio --- */
V.socio = function(id){
  const s = byId(C("socios"), id);
  if(!s) return `<div class="empty"><b>Socio no encontrado</b></div>`;
  if(!perfilVisible(s)) return `<div class="card"><div class="empty">
    <b>Este perfil no es público</b>
    Su titular no ha autorizado que aparezca en el directorio del club. Nadie salvo él mismo y la junta directiva puede consultarlo.
    <div style="margin-top:14px"><button class="btn" data-go="socios">Volver al directorio</button></div></div></div>`;
  const priv = byId(C("socios_privado"), id);
  const mios = C("perros").filter(p => p.propietarioId === id && perroVisible(p));
  const criados = C("perros").filter(p => p.criadorId === id && perroVisible(p));
  const yo = puedeEditarSocio(id);
  const campo = (c, et, val) => visible(s,c) ? `<dt>${esc(et)}</dt><dd>${val||"<span class='dim'>—</span>"}${(SESION.esAdmin||yo)&&nivelDe(s,c)!=="publico"?` <span class="chip">${esc(NIVELES.find(n=>n[0]===nivelDe(s,c))[1])}</span>`:""}</dd>` : "";
  return `
  <div class="ficha-h">
    ${avatar(s, 72)}
    <div style="flex:1;min-width:250px">
      <h2>${esc(s.nombreCompleto)}</h2>
      <div class="meta">
        <span class="chip mono">Socio nº ${esc(s.numero)}</span>
        ${s.socioHonor?`<span class="chip ok">Socio de honor</span>`:""}
        ${s.afijo&&visible(s,"afijo")?`<span class="chip">Afijo ${esc(s.afijo)}</span>`:""}
        ${s.activo?`<span class="chip ok">Alta vigente</span>`:`<span class="chip">Baja</span>`}
        ${s.rsceSocio?`<span class="chip">RSCE</span>`:""}
        ${(s.roles||[]).slice(0,3).map(r=>`<span class="chip est">${esc(r)}</span>`).join("")}
      </div>
      ${s.bio&&visible(s,"bio")?`<p style="max-width:60ch;margin:12px 0 0;color:var(--ink-2)">${esc(s.bio)}</p>`:""}
    </div>
    ${yo?`<div style="display:flex;gap:8px;align-items:center">${botonFoto("avatar","socio",id,s.avatar?"Cambiar foto":"Subir foto")}<button class="btn brand" data-form="socio|${esc(id)}">Editar perfil</button></div>`:""}
  </div>
  <div class="cols23">
    <div class="grid">
      <div class="card"><div class="card-h"><h3>Ejemplares en propiedad</h3><span class="hint">${mios.length}</span></div><div class="card-b" style="padding:0">
        ${mios.length ? tablaPerrosMini(mios) : `<div class="empty" style="padding:26px">Ninguno compartido</div>`}</div></div>
      ${criados.length?`<div class="card"><div class="card-h"><h3>Criados bajo su afijo</h3><span class="hint">${criados.length}</span></div><div class="card-b" style="padding:0">${tablaPerrosMini(criados)}</div></div>`:""}
    </div>
    <div class="grid">
      <div class="card"><div class="card-h"><h3>Ficha cinológica</h3></div><div class="card-b">
        <dl class="kv">
          ${campo("rsce","Real Sociedad Canina", s.rsceSocio
            ? `<span class="chip ok">Socio de la RSCE</span>${s.rsceNumero?` <span class="num">nº ${esc(s.rsceNumero)}</span>`:""}${s.rsceDesde?` <span class="mini">desde ${fmtF(s.rsceDesde)}</span>`:""}`
            : `<span class="chip">No consta como socio de la RSCE</span>`)}
          ${campo("afijo","Afijo de criador", s.afijo?`<span class="chip mono">${esc(s.afijo)}</span>${s.afijoFecha?` <span class="mini">concedido ${fmtF(s.afijoFecha)}</span>`:""}`:"")}
          ${campo("disciplinas","Disciplinas", (s.disciplinas||[]).map(d=>`<span class="chip">${esc(d)}</span>`).join(" "))}
          ${campo("variedades","Variedades", (s.variedades||[]).map(v=>`<span class="chip"><span class="var-dot ${VCLASE[v]||""}"></span>${esc(v)}</span>`).join(" "))}
          ${campo("grupoTrabajo","Grupo de trabajo", esc(s.grupoTrabajo||""))}
          ${(s.roles||[]).length?`<dt>Condición en el club</dt><dd>${(s.roles||[]).map(r=>`<span class="chip est">${esc(r)}</span>`).join(" ")}</dd>`:""}
        </dl>
      </div></div>
      <div class="card"><div class="card-h"><h3>Datos de contacto</h3></div><div class="card-b">
        <dl class="kv">
          ${campo("poblacion","Localidad", esc([s.poblacion,s.provincia].filter(Boolean).join(", ")))}
          ${campo("email","Correo", s.email?`<a class="linkish" href="mailto:${esc(s.email)}">${esc(s.email)}</a>`:"")}
          ${campo("telefono","Teléfono", s.telefono?`<span class="num">${esc(s.telefono)}</span>`:"")}
          ${campo("fechaAlta","Socio desde", fmtF(s.fechaAlta))}
          ${campo("disciplinas","Disciplinas", (s.disciplinas||[]).map(d=>`<span class="chip">${esc(d)}</span>`).join(" "))}
          ${campo("profesion","Profesión", esc(s.profesion||""))}
          ${campo("redes","Web y redes", [
            s.web?`<a class="linkish" href="${esc(s.web)}" target="_blank" rel="noopener">Web</a>`:"",
            s.facebook?`<a class="linkish" href="${esc(s.facebook)}" target="_blank" rel="noopener">Facebook</a>`:"",
            s.instagram?`<span class="num">${esc(s.instagram)}</span>`:"",
            s.workingdogPerfil?`<a class="linkish" href="${esc(s.workingdogPerfil)}" target="_blank" rel="noopener">working-dog</a>`:"",
          ].filter(Boolean).join(" · "))}
        </dl>
        ${!visible(s,"email")&&!visible(s,"telefono")?`<div class="note" style="margin-top:12px">Este socio ha reservado sus datos de contacto.</div>`:""}
      </div></div>
      ${(SESION.esAdmin)?`<div class="card"><div class="card-h"><h3>Sólo junta directiva</h3></div><div class="card-b">
        <dl class="kv">
          <dt>DNI</dt><dd class="num">${esc(priv?.dni||"—")}</dd>
          <dt>Dirección</dt><dd>${esc(priv?.direccion||"—")}</dd>
          <dt>IBAN</dt><dd class="num">${esc(priv?.iban||"—")}</dd>
          <dt>Cuota</dt><dd>${esc(s.cuota||"—")}</dd>
        </dl>
        ${s.notas?`<div class="note" style="margin-top:12px;white-space:pre-wrap;max-height:180px;overflow:auto">${esc(s.notas)}</div>`:""}
      </div></div>`:""}
    </div>
  </div>`;
};
function tablaPerrosMini(l){
  return `<table>${l.map(p => `<tr class="clic" data-go="perro/${esc(p.id)}">
    <td><span class="celda-nm">${p.avatar?`<img class="thumb" src="${p.avatar}" alt="" loading="lazy">`:avatar(p,30,"cuadrado")}
      <span><span class="nm">${esc(p.nombre)}</span> ${p.afijo?`<span class="dim">${esc(p.afijo)}</span>`:""}</span></span></td>
    <td>${chipVar(p.variedad)}</td>
    <td class="sexo">${p.sexo==="M"?"♂":"♀"}</td>
    <td class="num">${esc(String(p.fechaNacimiento||"").slice(0,4)||"—")}</td>
    <td style="text-align:right">${chipApto(R.aptosDe(p, C("resultados")))}</td></tr>`).join("")}</table>`;
}
