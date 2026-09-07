/* Panel de la junta directiva. */
"use strict";

/* --- Panel de la junta --- */
V.admin = function(){
  const socios = C("socios"), perros = C("perros"), res = C("resultados");
  const sinEmail = socios.filter(s => !s.email);
  const sinAlta = socios.filter(s => !s.fechaAlta);
  const sinSalud = perros.filter(p => !R.anexoA(p).ok && !R.anexoA(p).bloqueos.length);
  const camTarde = C("camadas").filter(c => c.fechaNacimiento && !c.fechaComunicacion && (Date.now()-new Date(c.fechaNacimiento))/86400000 > 30);
  const provs = Object.entries(socios.reduce((a,s)=>{ if(s.provincia) a[s.provincia]=(a[s.provincia]||0)+1; return a; },{}))
    .sort((a,b)=>b[1]-a[1]).slice(0,12);
  const anios = Object.entries(socios.reduce((a,s)=>{ const y=String(s.fechaAlta||"").slice(0,4); if(y) a[y]=(a[y]||0)+1; return a; },{}))
    .sort((a,b)=>a[0].localeCompare(b[0])).slice(-12);
  const alerta = (n, t, d, go) => `<div class="req">${marca(n?"falta":"ok")}<div class="tx"><b>${esc(t)}</b><small>${esc(d)}</small></div>
    <span class="spacer"></span>${n?`<span class="chip warn">${n}</span>`:`<span class="chip ok">0</span>`}</div>`;
  return `<div class="stats" style="margin-bottom:18px">
      <div class="stat"><div class="k">Socios</div><div class="v">${socios.length}</div><div class="n">${socios.filter(s=>s.esCriador).length} criadores con afijo</div></div>
      <div class="stat"><div class="k">Ejemplares</div><div class="v">${perros.length}</div><div class="n">${perros.filter(p=>R.aptosDe(p,res).length).length} con apto de cría</div></div>
      <div class="stat"><div class="k">Anexo A completo</div><div class="v">${perros.filter(p=>R.anexoA(p).ok).length}</div><div class="n">de ${perros.length} fichas</div></div>
      <div class="stat"><div class="k">Recibos pendientes</div><div class="v">${C("pagos").filter(p=>p.estado!=="pagado").length}</div><div class="n">en todos los ejercicios</div></div>
    </div>
    <div class="cols23">
      <div class="grid">
        <div class="card"><div class="card-h"><h3>Socios por provincia</h3><span class="hint">12 primeras</span></div><div class="card-b">${barras(provs.map(([p,n])=>[p,n]))}</div></div>
        <div class="card"><div class="card-h"><h3>Altas por año</h3><span class="hint">${socios.filter(s=>s.fechaAlta).length} con fecha registrada</span></div><div class="card-b">${barras(anios.map(([y,n])=>[y,n]))}</div></div>
      </div>
      <div class="grid">
        <div class="card"><div class="card-h"><h3>Cosas que atender</h3></div><div class="card-b">
          ${alerta(sinEmail.length, "Socios sin correo electrónico", "No podrán recibir la invitación de alta en la plataforma")}
          ${alerta(sinAlta.length, "Socios sin fecha de alta", "Impide calcular antigüedad y elegibilidad a títulos")}
          ${alerta(sinSalud.length, "Ejemplares con Anexo A incompleto", "Faltan pruebas veterinarias para poder optar al apto de cría")}
          ${alerta(camTarde.length, "Camadas sin comunicar en plazo", "Superados los 30 días: quedan fuera de la difusión del club")}
          ${alerta(C("resultados").filter(r=>!r.validado).length + perros.filter(p=>R.pendientes(p,res).salud).length, "Datos sin validar", "Pruebas de salud y resultados aportados por propietarios, sin cotejar")}
          ${alerta(C("solicitudes").filter(x=>x.estado==="pendiente").length, "Cruces intervariedades por resolver", "La Junta Directiva dispone de 30 días hábiles desde la solicitud")}
          ${alerta(C("camadas").filter(c=>!camadaPublicable(c).ok).length, "Camadas retenidas sin autorización", "No se difunden hasta que se resuelva el expediente de cruce")}
        </div></div>
        <div class="card"><div class="card-h"><h3>Ejemplares por variedad</h3></div><div class="card-b">${barras(VARIEDADES.map(v=>[v, perros.filter(p=>p.variedad===v).length, VCLASE[v]]))}</div></div>
        <div class="card"><div class="card-h"><h3>Disciplinas del censo</h3></div><div class="card-b">
          ${barras(DISCIPLINAS.map(d=>[d, socios.filter(s=>(s.disciplinas||[]).includes(d)).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]))||""}
          ${socios.every(s=>!(s.disciplinas||[]).length)?`<div class="mini">Sin disciplinas registradas todavía en el censo.</div>`:""}
        </div></div>
        <div class="card"><div class="card-h"><h3>Cargos y titulaciones</h3><span class="hint">Cap. 5</span></div><div class="card-b">
          ${ROLES_CLUB.map(r=>[r, socios.filter(s=>(s.roles||[]).includes(r)).length]).filter(x=>x[1]).length
            ? barras(ROLES_CLUB.map(r=>[r, socios.filter(s=>(s.roles||[]).includes(r)).length]).filter(x=>x[1]))
            : `<div class="mini">El club mantiene listados de jueces de trabajo, jueces confirmadores, figurantes y grupos colaboradores. Asígnalos desde la ficha de cada socio.</div>`}
          <div class="mini" style="margin-top:10px">Socios de la RSCE: <b>${socios.filter(s=>s.rsceSocio).length}</b> de ${socios.length}</div>
        </div></div>
      </div>
    </div>`;
};

/* --- Validaciones pendientes --- */
V.validar = function(){
  const res = C("resultados"), perros = C("perros");
  const salud = perros.filter(p => R.pendientes(p, res).salud);
  const pend = res.filter(r => !r.validado);
  const nombre = pid => byId(perros, pid)?.nombre || "—";
  return `<div class="note" style="margin-bottom:16px">Todo lo que introduce un propietario entra <b>sin validar</b> y no cuenta para el apto de cría, los títulos ni el baremo hasta que la junta lo coteja con el certificado original. Lo que registra la propia junta entra ya validado.</div>
    <div class="cols2">
      <div class="card"><div class="card-h"><h3>Expedientes de salud</h3><span class="hint">${salud.length} sin cotejar</span></div>
        <div class="card-b" style="padding:0">
          ${salud.length ? `<table>${salud.map(p=>{const a=R.anexoA(p), s=p.salud||{};
            return `<tr><td class="clic" data-go="perro/${esc(p.id)}"><span class="nm">${esc(p.nombre)}</span>
              <div class="mini">HD ${esc(s.hd||"—")} · ED ${esc(String(s.ed ?? "—"))} · LVT ${esc(s.lvt||"—")} · ${Object.keys(s.genes||{}).length} genes</div>
              <div class="mini">${esc(p.propietarioNombre||"sin propietario")}</div></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn sm" data-val="salud|validado|${esc(p.id)}">Validar</button>
                <button class="btn sm danger" data-val="salud|rechazado|${esc(p.id)}">✕</button></td></tr>`;}).join("")}</table>`
            : `<div class="empty" style="padding:34px">Nada pendiente de cotejar</div>`}
        </div></div>
      <div class="card"><div class="card-h"><h3>Resultados y títulos</h3><span class="hint">${pend.length} sin validar</span></div>
        <div class="card-b" style="padding:0">
          ${pend.length ? `<table>${pend.map(r=>`<tr>
              <td class="clic" data-go="perro/${esc(r.perroId)}"><span class="nm">${esc(nombre(r.perroId))}</span>
                <div class="mini">${esc({estructura:"Estructura",caracter:"Carácter",trabajo:"Trabajo",confirmacion:"Confirmación"}[r.tipo]||r.tipo)}: ${esc(r.calificacion||r.titulo||r.resultado||"—")}${r.distincion?" · "+esc(r.distincion):""}</div>
                <div class="mini">${esc(r.evento||r.tipoEvento||"")} · ${fmtF(r.fecha)}${r.juez?" · "+esc(r.juez):""}</div></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn sm" data-val="res|validado|${esc(r.id)}">Validar</button>
                <button class="btn sm danger" data-val="res|rechazado|${esc(r.id)}">✕</button></td></tr>`).join("")}</table>`
            : `<div class="empty" style="padding:34px">Nada pendiente de validar</div>`}
        </div></div>
      <div class="card"><div class="card-h"><h3>«Este ejemplar es mío»</h3><span class="hint">${C("solicitudes").filter(x=>x.tipo==="reclamacion"&&x.estado==="pendiente").length} por resolver</span></div>
        <div class="card-b" style="padding:0">
          ${(()=>{const rl=C("solicitudes").filter(x=>x.tipo==="reclamacion"&&x.estado==="pendiente");
            return rl.length ? `<table>${rl.map(x=>{const anterior=byId(C("socios"),x.deSocioId);
              return `<tr>
              <td class="clic" data-go="perro/${esc(x.perroId)}"><span class="nm">${esc(byId(perros,x.perroId)?.nombre||"—")}</span>
                <div class="mini">Lo reclama <b>${esc(byId(C("socios"),x.aSocioId)?.nombreCompleto||"—")}</b>${
                  anterior?` · figura a nombre de ${esc(anterior.nombreCompleto)}`:" · ficha sin titular"}</div>
                <div class="mini">${esc(x.documento||"")}${x.motivo?` · ${esc(String(x.motivo).slice(0,90))}`:""}</div></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn sm" data-sol="autorizada|${esc(x.id)}">Reconocer</button>
                <button class="btn sm danger" data-sol="denegada|${esc(x.id)}">✕</button>
                <button class="btn sm" data-retirar="${esc(x.id)}" title="Se abrió por error: se borra sin dejar constancia">⌫</button></td></tr>`;}).join("")}</table>`
              : `<div class="empty" style="padding:34px">Sin reclamaciones pendientes</div>`;})()}
        </div></div>
      <div class="card"><div class="card-h"><h3>Cambios de titularidad</h3><span class="hint">${C("solicitudes").filter(x=>x.tipo==="traspaso"&&x.estado==="pendiente").length} por autorizar</span></div>
        <div class="card-b" style="padding:0">
          ${(()=>{const tl=C("solicitudes").filter(x=>x.tipo==="traspaso"&&x.estado==="pendiente");
            return tl.length ? `<table>${tl.map(x=>`<tr>
              <td class="clic" data-go="perro/${esc(x.perroId)}"><span class="nm">${esc(byId(perros,x.perroId)?.nombre||"—")}</span>
                <div class="mini">${esc(byId(C("socios"),x.deSocioId)?.nombreCompleto||"sin titular")} → <b>${esc(byId(C("socios"),x.aSocioId)?.nombreCompleto||"—")}</b></div>
                <div class="mini">${esc(x.documento||"")} · ${fmtF(x.fechaEfecto||x.fecha)}</div></td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn sm" data-sol="autorizada|${esc(x.id)}">Autorizar</button>
                <button class="btn sm danger" data-sol="denegada|${esc(x.id)}">✕</button></td></tr>`).join("")}</table>`
              : `<div class="empty" style="padding:34px">Sin traspasos pendientes</div>`;})()}
        </div></div>
    </div>`;
};

/* --- Vinculación de altas --- */
V.altas = function(){
  const socios = C("socios");
  const conEmail = socios.filter(s => s.email), sinEmail = socios.filter(s => !s.email);
  const vinc = socios.filter(s => s.cuentaVinculada);
  const cols = [
    {t:"Nº", s:s=>s.numero, r:s=>`<span class="num">${s.numero}</span>`},
    {t:"Socio", s:s=>s.apellidos, r:s=>esc(s.nombreCompleto)},
    {t:"Correo registrado", s:s=>s.email||"", r:s=>s.email?`<span class="num">${esc(s.email)}</span>`:`<span class="chip warn">Sin correo</span>`},
    {t:"Vía de alta", s:s=>s.email?0:1, r:s=>s.email?`<span class="chip">Invitación por correo</span>`:`<span class="chip warn">Reclamación manual</span>`},
    {t:"Estado", s:s=>s.cuentaVinculada?1:0, r:s=>s.cuentaVinculada?`<span class="chip ok">Vinculada</span>`:`<span class="chip">Sin reclamar</span>`},
  ];
  return `<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Cómo entra cada socio en su ficha</h3></div><div class="card-b">
      <div class="reqs">
        <div class="req">${marca("ok")}<div class="tx"><b>La ficha ya existe, sin dueño</b><small>Los ${socios.length} socios del censo están dados de alta con los datos de secretaría. Nadie entra en ellas hasta que su titular las reclama.</small></div></div>
        <div class="req">${marca("ok")}<div class="tx"><b>Con correo: invitación de un solo uso</b><small>${conEmail.length} socios. El enlace caduca y sólo sirve una vez, y es lo que ata la cuenta al número de socio para que nadie pueda reclamar una ficha ajena.</small></div></div>
        <div class="req">${marca(sinEmail.length?"falta":"ok")}<div class="tx"><b>Sin correo: a mano por secretaría</b><small>${sinEmail.length} socios. Reclaman su ficha con el número de socio, el DNI y el teléfono, y la secretaría lo aprueba antes de darles acceso.</small></div></div>
      </div>
      <div class="note warn" style="margin-top:14px">Advierte a los socios de que el correo puede caerles en <b>Spam</b>. Que busquen <b>CEPPB</b>, marquen el mensaje como «No es spam» y añadan el remitente a sus contactos.</div>
    </div></div>
    <div class="stats" style="margin-bottom:16px">
      <div class="stat"><div class="k">Invitables por correo</div><div class="v">${conEmail.length}</div><div class="n">${Math.round(conEmail.length/socios.length*100)} % del censo</div></div>
      <div class="stat"><div class="k">Reclamación manual</div><div class="v">${sinEmail.length}</div><div class="n">Requieren validación de secretaría</div></div>
      <div class="stat"><div class="k">Cuentas vinculadas</div><div class="v">${vinc.length}</div><div class="n">Han completado el alta</div></div>
    </div>
    ${tabla("alt", cols, socios, s=>"socio/"+s.id)}`;
};

/* --- Cuotas y cobros --- */
V.cobros = function(){
  const socios = C("socios"), pagos = C("pagos");
  const anio = new Date().getFullYear();
  const filas = socios.map(s => {
    const p = pagos.filter(x => x.socioId === s.id);
    const ult = p.sort((a,b)=>String(b.anio).localeCompare(String(a.anio)))[0];
    const iban = byId(C("socios_privado"), s.id)?.iban;
    return {s, ult, pend: p.filter(x=>x.estado!=="pagado").length, iban};
  });
  const cols = [
    {t:"Nº", s:f=>f.s.numero, r:f=>`<span class="num">${f.s.numero}</span>`},
    {t:"Socio", s:f=>f.s.apellidos, r:f=>esc(f.s.nombreCompleto)},
    {t:"Cuota", s:f=>f.s.cuota||"", r:f=>`<span class="chip">${esc(f.s.cuota||"—")}</span>`},
    {t:"Domiciliación", s:f=>f.iban?1:0, r:f=>f.iban?`<span class="num">•••• ${esc(f.iban.slice(-4))}</span>`:`<span class="chip warn">Sin IBAN</span>`},
    {t:"Último recibo", s:f=>f.ult?.anio||"", r:f=>f.ult?`${esc(f.ult.anio)} <span class="chip ${f.ult.estado==="pagado"?"ok":"warn"}">${esc(f.ult.estado)}</span>`:`<span class="dim">—</span>`},
    {t:"Pendientes", s:f=>f.pend, r:f=>f.pend?`<span class="chip warn">${f.pend}</span>`:`<span class="chip ok">0</span>`},
  ];
  const sinIban = filas.filter(f=>!f.iban).length;
  return `<div class="stats" style="margin-bottom:16px">
      <div class="stat"><div class="k">Ejercicio</div><div class="v">${anio}</div><div class="n">Remesa en preparación</div></div>
      <div class="stat"><div class="k">Sin domiciliación</div><div class="v">${sinIban}</div><div class="n">Requieren transferencia</div></div>
      <div class="stat"><div class="k">Honoríficas</div><div class="v">${socios.filter(s=>s.cuota==="Honorífica").length}</div><div class="n">Exentas de cuota</div></div>
      <div class="stat"><div class="k">Familiares</div><div class="v">${socios.filter(s=>String(s.cuota).startsWith("Familiar")).length}</div><div class="n">Principal + secundarias</div></div>
    </div>${tabla("cob", cols, filas, f=>"socio/"+f.s.id)}`;
};
/* ============================================================
   Fotos y vídeos
   Las fotos se reducen en el navegador antes de guardarse.
   Los vídeos se enlazan: alojarlos requiere almacenamiento propio.
   ============================================================ */


/* Reduce una imagen a JPEG dentro del límite de un documento (256 KiB) */
function procesarImagen(file, opts){
  return new Promise((res, rej) => {
    if(!file) return rej(new Error("No se ha elegido ningún archivo"));
    if(!/^image\//.test(file.type)) return rej(new Error("Ese archivo no es una imagen. Admitimos JPG, PNG, WEBP o HEIC convertido."));
    if(file.size > 30 * 1024 * 1024) return rej(new Error("La imagen pesa más de 30 MB. Redúcela antes de subirla."));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("No se pudo leer el archivo"));
    fr.onload = () => procesarFuente(fr.result, opts).then(res, rej);
    fr.readAsDataURL(file);
  });
}
function procesarFuente(src, {max = 1200, cuadrada = false, calidad = 0.78} = {}){
  return new Promise((res, rej) => {
    {
      const im = new Image();
      im.onerror = () => rej(new Error("El navegador no reconoce ese formato de imagen"));
      im.onload = () => {
        let sx = 0, sy = 0, sw = im.width, sh = im.height;
        if(cuadrada){ const l = Math.min(sw, sh); sx = (sw - l) / 2; sy = (sh - l) / 2; sw = sh = l; }
        const c = document.createElement("canvas"), g = c.getContext("2d");
        const dibujar = (lado, q) => {
          const k = Math.min(1, lado / Math.max(sw, sh));
          const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
          c.width = w; c.height = h;
          g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
          g.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
          return {dataUri: c.toDataURL("image/jpeg", q), lienzo: c, w, h};
        };
        /* Las fotos van al almacén de Supabase, así que caben de sobra.
           Aun así se reducen: una foto de móvil son 6 MB y en pantalla
           no se nota la diferencia, pero el club sí nota la factura y
           los socios la espera. Un lado máximo de 1600 px basta. */
        const r = dibujar(Math.max(180, Math.round(max)), calidad);
        r.lienzo.toBlob(
          b => b ? res({archivo: b, dataUri: r.dataUri, w: r.w, h: r.h, bytes: b.size})
                 : rej(new Error("No se ha podido preparar la imagen")),
          "image/jpeg", calidad);
      };
      im.src = src;
    }
  });
}

/* ---------- vídeos: se guarda el enlace ---------- */
/* PROVEEDORES y proveedorDe viven ahora en js/media.js */

/* ---------- componentes ---------- */
function iniciales(nombre){
  return String(nombre || "?").trim().split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
}
function avatar(ent, size, extra){
  const s = size || 40;
  const st = `width:${s}px;height:${s}px;font-size:${Math.round(s * 0.36)}px`;
  if(ent && ent.avatar)
    return `<img class="avatar ${extra || ""}" src="${ent.avatar}" alt="" style="${st}">`;
  return `<span class="avatar ph ${extra || ""}" style="${st}" aria-hidden="true">${esc(iniciales(ent && (ent.nombreCompleto || ent.nombre)))}</span>`;
}
function botonFoto(modo, tipo, id, texto){
  const uid2 = "up-" + modo + "-" + id;
  return `<label class="btn sm" for="${uid2}" style="cursor:pointer">${esc(texto)}</label>
    <input type="file" id="${uid2}" accept="image/*" data-up="${modo}|${tipo}|${esc(id)}" style="display:none">`;
}

/* Galería de un ejemplar */
function galeria(perro, puedo){
  const l = mediaDe(perro.id);
  const fotos = l.filter(m => m.tipo === "foto"), videos = l.filter(m => m.tipo === "video");
  return `
  <div class="cols23">
    <div class="grid">
      <div class="card"><div class="card-h"><h3>Fotografías</h3><span class="hint">${fotos.length}</span>
        ${puedo ? `<span class="spacer"></span>${botonFoto("galeria", "perro", perro.id, "Subir foto")}` : ""}</div>
        <div class="card-b">
          ${fotos.length ? `<div class="gal">${fotos.map(m => `<figure>
              <img src="${esc(m.url || "")}" alt="${esc(m.titulo || perro.nombre)}" loading="lazy">
              ${puedo ? `<span class="acts">
                ${perro.avatarUrl && perro.avatarUrl === m.url ? `<span class="chip ok">Principal</span>`
                  : `<button class="btn sm" data-media="principal|${esc(perro.id)}|${esc(m.id)}">Principal</button>`}
                <button class="btn sm danger" data-media="borrar|${esc(perro.id)}|${esc(m.id)}">Borrar</button></span>` : ""}
              <figcaption>${esc(m.titulo || "Sin pie")}<span class="spacer"></span><span class="num">${fmtF(m.fecha).slice(0,10)}</span></figcaption>
            </figure>`).join("")}</div>`
            : `<div class="drop">${puedo ? "Todavía no hay fotos de este ejemplar. Sube la primera: se reduce automáticamente antes de guardarse."
                                        : "Su propietario aún no ha compartido fotografías."}</div>`}
        </div></div>

      <div class="card"><div class="card-h"><h3>Vídeos</h3><span class="hint">${videos.length}</span>
        ${puedo ? `<span class="spacer"></span>
          <label class="btn sm" for="up-video-${esc(perro.id)}" style="cursor:pointer">Subir vídeo</label>
          <input type="file" id="up-video-${esc(perro.id)}" accept="video/*"
                 data-video="${esc(perro.id)}" style="display:none">
          <button class="btn sm" data-form="video|${esc(perro.id)}">Enlazar uno</button>` : ""}</div>
        <div class="card-b">
          ${videos.length ? `<div class="gal">${videos.map(m => `<figure>
              <a class="vid" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">
                <span><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9.2"/><path d="M10 8.4l6 3.6-6 3.6z" fill="currentColor" stroke="none"/></svg></span>
              </a>
              ${puedo ? `<span class="acts">
                ${m.validado === "pendiente" ? `<span class="chip warn">Esperando a la junta</span>` : ""}
                ${m.validado === "rechazado" ? `<span class="chip block" title="${esc(m.nota||"")}">No publicado</span>` : ""}
                <button class="btn sm danger" data-media="borrar|${esc(perro.id)}|${esc(m.id)}">Borrar</button></span>` : ""}
              <figcaption><b style="font-weight:600;color:var(--ink)">${esc(m.titulo || "Vídeo")}</b><span class="spacer"></span><span class="chip">${esc(m.proveedor || "Enlace")}</span></figcaption>
            </figure>`).join("")}</div>`
            : `<div class="drop">${puedo ? "Pega el enlace de un vídeo de YouTube, Vimeo, Instagram o working-dog y quedará asociado a la ficha."
                                        : "Sin vídeos publicados."}</div>`}
        </div></div>
    </div>

    <div class="grid">
      <div class="card"><div class="card-h"><h3>Foto principal</h3></div><div class="card-b" style="text-align:center">
        ${avatar(perro, 148, "cuadrado centrado")}
        <div class="mini" style="margin-top:11px">Es la que aparece en el buscador de ejemplares y en el pedigrí.</div>
        ${puedo ? `<div style="margin-top:10px">${botonFoto("avatar", "perro", perro.id, perro.avatar ? "Cambiar foto principal" : "Elegir foto principal")}</div>` : ""}
      </div></div>
      <div class="card"><div class="card-h"><h3>Cómo se guarda</h3></div><div class="card-b">
        <div class="reqs">
          <div class="req"><div class="tx"><b>Fotos</b><small>Se reducen a 1200 px de lado mayor y se guardan dentro de la plataforma. No hace falta que las prepares.</small></div></div>
          <div class="req"><div class="tx"><b>Vídeos</b><small>Se guarda el enlace, no el archivo. Alojar vídeo requiere almacenamiento propio: se resuelve en la versión desplegada.</small></div></div>
          <div class="req"><div class="tx"><b>Quién las ve</b><small>Siguen la visibilidad de la ficha: ${esc({publico:"cualquiera", socios:"sólo socios", privado:"sólo tú y la junta"}[perro.visibilidad || "socios"])}.</small></div></div>
        </div>
      </div></div>
    </div>
  </div>`;
}
/* ============================================================
   Listados oficiales del club (Cap. 5 y Cap. 6.2)
   Los cargos son públicos aunque el socio reserve su perfil.
   ============================================================ */
const BLOQUES_CARGO = [
  {t:"Junta Directiva", roles:["Junta Directiva"],
   d:"Órgano de gobierno del club. Resuelve las autorizaciones de cruce y nombra a jueces y figurantes."},
  {t:"Comisión de Cría", roles:["Comisión de Cría"],
   d:"Recibe los resultados de las pruebas, informa los cruces intervariedades y tramita las radiografías de columna."},
  {t:"Delegación de Trabajo y delegados de zona", roles:["Delegación de Trabajo","Delegado de zona"],
   d:"Coordina los grupos colaboradores, los exámenes de figurantes y las pruebas de carácter."},
  {t:"Jueces de Trabajo del CEPPB", roles:["Juez de Trabajo CEPPB"],
   d:"Juzgan las pruebas de carácter y emiten los certificados. Exige tres años de antigüedad como socio, ser instructor formador de la RSCE en una disciplina de mordida y superar el curso del club."},
  {t:"Jueces Confirmadores del CEPPB", roles:["Juez Confirmador CEPPB"],
   d:"Juzgan la prueba de confirmación de utilidad, obligatoria desde el 1 de enero de 2027 para representar al club en un mundial."},
  {t:"Figurantes y hombres de ataque", roles:["Figurante / Hombre de ataque","Maestro Figurante"],
   d:"Han superado el examen de figurantes del CEPPB con calificación mínima de Bueno. Maestro Figurante: seleccionado en al menos dos Campeonatos Nacionales."},
  {t:"Jueces e instructores de la RSCE", roles:["Juez RSCE","Instructor RSCE"],
   d:"Titulación de la Real Sociedad Canina de España que ostentan socios del club."},
  {t:"Veterinarios registrados en el CEPPB", roles:["Veterinario registrado en el CEPPB"],
   d:"Registrados para tramitar las radiografías de columna. El registro no tiene coste para el facultativo."},
];

