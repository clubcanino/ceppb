/* ============================================================
   Qué pasa cuando el usuario pulsa o escribe algo.
   Portado del prototipo.
   ============================================================ */
"use strict";

document.addEventListener("click", async ev => {
  const go = ev.target.closest("[data-go]");
  if(go && !ev.target.closest("a[href]")){ ir(go.dataset.go); return; }
  const tab = ev.target.closest("[data-tab]"); if(tab){ tabPerro = tab.dataset.tab; render(); return; }
  const ord = ev.target.closest("[data-ord]");
  if(ord){ const [k,i] = ord.dataset.ord.split("|"); const o = ordenTabla[k]||{};
    ordenTabla[k] = (o.c === +i) ? {c:+i, d:!o.d} : {c:+i, d:false}; render(); return; }
  const fm = ev.target.closest("[data-form]");
  if(fm){ const [n, id] = fm.dataset.form.split("|"); if(FORMS[n]) FORMS[n](id || null); return; }
  /* Los tres botones de privacidad guardaban bien pero no volvían a
     dibujar la pantalla: el socio pulsaba, no veía cambiar nada y
     creía que la plataforma no le dejaba. */
  const vis = ev.target.closest("[data-vis]");
  if(vis){
    const [pid, v] = vis.dataset.vis.split("|");
    const p = byId(C("perros"), pid);
    const n = Object.assign({}, p, {visibilidad:v}); delete n.id;
    try {
      await guardar("perros", pid, n);
      toast(v === "privado" ? "Solo tú ves esta ficha"
          : v === "socios"  ? "Los socios del club ven esta ficha"
          :                   "Esta ficha es pública");
    } catch(e){ toast(e.message || "No se ha podido cambiar"); }
    render();
    return;
  }

  const pf = ev.target.closest("[data-perfil]");
  if(pf){
    const [sid, v] = pf.dataset.perfil.split("|");
    const s = byId(C("socios"), sid);
    const n = Object.assign({}, s, {perfilPublico:v}); delete n.id;
    try {
      await guardar("socios", sid, n);
      if (esYo(sid)) await SESION.refrescar();
      toast(v === "oculto"  ? "Tu perfil deja de aparecer en el directorio"
          : v === "socios"  ? "Ahora te ven los socios del club"
          :                   "Tu perfil es público");
    } catch(e){ toast(e.message || "No se ha podido cambiar"); }
    render();
    return;
  }

  const pv = ev.target.closest("[data-priv]");
  if(pv){
    const [sid, campo, v] = pv.dataset.priv.split("|");
    const s = byId(C("socios"), sid);
    const n = Object.assign({}, s, {priv: Object.assign({}, s.priv || {}, {[campo]: v})});
    delete n.id;
    try {
      await guardar("socios", sid, n);
      if (esYo(sid)) await SESION.refrescar();
      toast(v === "privado" ? "Ese dato deja de compartirse"
          : v === "socios"  ? "Ese dato lo ven los socios del club"
          :                   "Ese dato es público");
    } catch(e){ toast(e.message || "No se ha podido cambiar"); }
    render();
    return;
  }
  if(ev.target.id === "sheet-x" || ev.target.id === "sheet-c" || ev.target.id === "scrim") cerrarForm();
  if(ev.target.id === "sheet-ok" && formActual){ const f = formActual; try { await f(leerForm()); cerrarForm(); } catch(e){} }
  if(ev.target.id === "tema"){
    const cur = document.documentElement.getAttribute("data-theme");
    const oscuro = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", oscuro ? "light" : "dark");
  }
});
/* ---------- fotos: subida ---------- */
document.addEventListener("change", async ev => {
  const inp = ev.target.closest("input[data-up]");
  if(!inp) return;
  const file = inp.files && inp.files[0];
  inp.value = "";
  if(!file) return;
  const [modo, tipo, id] = inp.dataset.up.split("|");
  const col = tipo === "perro" ? "perros" : "socios";
  const ent = byId(C(col), id);
  if(!ent) return toast("No encuentro esa ficha");
  toast("Procesando la imagen…");
  try {
    if(modo === "avatar"){
      const {dataUri} = await procesarImagen(file, {max:320, cuadrada:true, calidad:0.8});
      const n = Object.assign({}, ent, {avatar:dataUri}); delete n.id;
      await guardar(col, id, n);
      toast("Foto de perfil actualizada");
    } else {
      const {dataUri, w, h} = await procesarImagen(file, {max:1200, calidad:0.78});
      await guardar("media", null, {tipo:"foto", sujeto:tipo, sujetoId:id, dataUri, w, h,
        titulo:file.name.replace(/\.[^.]+$/, "").slice(0, 60), fecha:hoy(), subidoPor: miSocioId()});
      toast("Foto añadida a la galería");
    }
    render();
  } catch(e){
    toast(e && e.code === "quota_exceeded" ? "La plataforma ha alcanzado su límite de documentos" : (e.message || "No se pudo guardar la imagen"));
  }
});

document.addEventListener("click", async ev => {
  /* Retirar un expediente abierto por error. Denegarlo dejaría en la
     ficha del perro constancia de una reclamación que nunca debió
     existir; esto lo quita de en medio sin dejar rastro. */
  const rt = ev.target.closest("[data-retirar]");
  if(rt){
    if(!confirm("¿Retirar este expediente? Se borra sin dejar constancia.\n\nHazlo sólo si se abrió por error. Si la reclamación existió y no procede, deniégala: así queda registrada la resolución.")) return;
    const { error } = await S.sb.from("solicitudes").delete().eq("id", rt.dataset.retirar);
    if(error) return avisarError(error);
    await recargar();
    toast("Expediente retirado");
    render(); return;
  }

  const sb = ev.target.closest("[data-sol]");
  if(sb){
    const [estado, id] = sb.dataset.sol.split("|");
    const x = byId(C("solicitudes"), id); if(!x) return;
    const porDefecto = {
      intervariedad: "Informe favorable de la Comisión de Cría; la Junta Directiva autoriza el cruce.",
      traspaso:      "Documentación conforme; la Junta Directiva autoriza el cambio de titularidad.",
      reclamacion:   "Comprobada la documentación, la Junta Directiva reconoce la titularidad.",
    };
    const txt = prompt(estado === "autorizada"
      ? "Resolución de la Junta Directiva:"
      : "Motivo de la denegación:", estado === "autorizada" ? (porDefecto[x.tipo] || "") : "");
    if(txt === null) return;
    const n = Object.assign({}, x, {estado, resolucion:txt, fechaResolucion:hoy()}); delete n.id;
    await guardar("solicitudes", id, n);
    if((x.tipo === "traspaso" || x.tipo === "reclamacion") && estado === "autorizada"){
      const p = byId(C("perros"), x.perroId), nuevo = byId(C("socios"), x.aSocioId);
      if(p && nuevo){
        const hist = (p.historialTitularidad || []).concat([{de:x.deSocioId, a:x.aSocioId,
          fecha:x.fechaEfecto || hoy(), documento:x.documento || ""}]);
        const np = Object.assign({}, p, {propietarioId:x.aSocioId,
          propietarioNombre:nuevo.nombreCompleto, historialTitularidad:hist}); delete np.id;
        await guardar("perros", x.perroId, np);
      }
    }
    const dicho = {
      intervariedad: ["Cruce autorizado", "Cruce denegado"],
      traspaso:      ["Titularidad transferida", "Traspaso denegado"],
      reclamacion:   ["Titularidad reconocida: la ficha ya es suya", "Reclamación denegada"],
    }[x.tipo] || ["Expediente autorizado", "Expediente denegado"];
    toast(estado === "autorizada" ? dicho[0] : dicho[1]);
    render(); return;
  }
  const ib = ev.target.closest("[data-inv]");
  if(ib){
    const [acc, id] = ib.dataset.inv.split("|");
    if(acc === "ver") return FORMS.invitacion(id);
    /* Que un perfil está reclamado lo dice la cuenta atada a la ficha,
       y eso lo hace el propio socio al abrir su enlace. Esto es sólo
       para cuando se hizo por otra vía —a mano en secretaría— y hay
       que dejar constancia. */
    if(acc === "reclamada"){
      const inv = C("invitaciones")
        .filter(i => i.socioId === id && i.estado === "enviada")
        .sort((a,b) => String(b.enviada).localeCompare(String(a.enviada)))[0];
      if(!inv) return toast("Ese socio no tiene ninguna invitación enviada");
      await guardar("invitaciones", inv.token,
        {socioId:id, estado:"aceptada", aceptada:new Date().toISOString()});
      toast("Invitación marcada como reclamada");
      render(); return;
    }
    if(acc === "anular"){
      const inv = C("invitaciones")
        .filter(i => i.socioId === id && i.estado === "enviada")
        .sort((a,b) => String(b.enviada).localeCompare(String(a.enviada)))[0];
      if(!inv) return toast("Ese socio no tiene ninguna invitación que anular");
      if(!confirm("¿Anular esta invitación? El enlace dejará de servir y habrá que enviar otro.")) return;
      await guardar("invitaciones", inv.token, {socioId:id, estado:"anulada"});
      toast("Invitación anulada");
      render(); return;
    }
  }
  const fb = ev.target.closest("[data-inv-f]");
  if(fb){ filtroInv = fb.dataset.invF; render(); return; }
  const vb = ev.target.closest("[data-val]");
  if(vb){
    if(!SESION.esAdmin) return toast("Sólo la junta directiva valida datos");
    const [que, estado, id] = vb.dataset.val.split("|");
    let nota = "";
    if(estado === "rechazado"){ nota = prompt("Motivo del rechazo (lo verá el propietario):", ""); if(nota === null) return; }
    if(que === "salud"){
      const p = byId(C("perros"), id); if(!p) return;
      const sal = Object.assign({}, p.salud || {}, {validacion:{estado, fecha:hoy(), por:"Comisión de Cría", nota}});
      const n = Object.assign({}, p, {salud:sal}); delete n.id;
      await guardar("perros", id, n);
    } else {
      const r = byId(C("resultados"), id); if(!r) return;
      const n = Object.assign({}, r, {validado:estado, validadoFecha:hoy(), validadoNota:nota}); delete n.id;
      await guardar("resultados", id, n);
    }
    toast(estado === "validado" ? "Validado" : "Rechazado");
    render(); return;
  }
  const b = ev.target.closest("[data-media]");
  if (!b) return;
  ev.stopPropagation();
  const [accion, perroId, mediaId] = b.dataset.media.split("|");

  try {
    if (accion === "principal"){
      await hacerPrincipal(perroId, mediaId);
      toast("Foto principal actualizada");
    }
    if (accion === "borrar"){
      if (!confirm("¿Borrar este archivo de la ficha? No se puede deshacer.")) return;
      await borrarMedia(mediaId);
      toast("Archivo borrado");
    }
  } catch(e){ toast(e.message || "No se ha podido hacer"); }
  render();
});

/* --- subir una foto --- */
document.addEventListener("change", async ev => {
  const inp = ev.target;
  if (!inp.dataset || !inp.dataset.up) return;
  const [modo, tipo, id] = inp.dataset.up.split("|");
  const file = inp.files && inp.files[0];
  if (!file) return;
  inp.value = "";

  if (tipo !== "perro") return;
  toast("Subiendo la foto…");
  try {
    await subirFotoPerro(file, id);
    toast("Foto subida");
    render();
  } catch(e){
    toast(e.message || "No se ha podido subir la foto");
  }
});

document.addEventListener("change", ev => {
  const t = ev.target;
  if(t.id === "f-soc-prov"){ fSoc.prov = t.value; render(); }
  if(t.id === "f-soc-cuota"){ fSoc.cuota = t.value; render(); }
  if(t.id === "f-soc-cri"){ fSoc.criador = t.checked; render(); }
  if(t.id === "f-soc-disc"){ fSoc.disc = t.value; render(); }
  if(t.id === "f-soc-rol"){ fSoc.rol = t.value; render(); }
  if(t.id === "f-soc-varie"){ fSoc.varie = t.value; render(); }
  if(t.id === "f-per-afijo"){ fPer.afijo = t.value; render(); }
  if(t.id === "f-per-var"){ fPer.var = t.value; render(); }
  if(t.id === "f-per-sexo"){ fPer.sexo = t.value; render(); }
  if(t.id === "f-per-apto"){ fPer.apto = t.value; render(); }
  if(t.id === "f-per-salud"){ fPer.salud = t.value; render(); }
  /* Los reproductores del simulador se buscan escribiendo, no se
     despliegan: el buscador avisa aquí cuando se elige uno. */
});
let tq;
document.addEventListener("input", ev => {
  const t = ev.target;
  if(t.id === "q"){ clearTimeout(tq); tq = setTimeout(() => {
      const v = t.value; const [r] = rutaActual();
      if(r === "perros" || r === "perro"){ fPer.q = v; if(r!=="perros") ir("perros"); else render(); }
      else { fSoc.q = v; if(r !== "socios") ir("socios"); else render(); }
      requestAnimationFrame(()=>{ const q=$("#q"); if(q && document.activeElement!==q){} });
    }, 260); }
  if(t.id === "f-soc-q"){ clearTimeout(tq); tq = setTimeout(()=>{ fSoc.q = t.value; const p=t.selectionStart; render();
      const n=$("#f-soc-q"); if(n){ n.focus(); n.setSelectionRange(p,p); } }, 260); }
  if(t.id === "f-per-q"){ clearTimeout(tq); tq = setTimeout(()=>{ fPer.q = t.value; const p=t.selectionStart; render();
      const n=$("#f-per-q"); if(n){ n.focus(); n.setSelectionRange(p,p); } }, 260); }
});
addEventListener("hashchange", () => { tabPerro = "resumen"; render(); });
addEventListener("keydown", e => { if(e.key === "Escape") cerrarForm(); });

/* ============================================================
   Mi cuenta: contraseña, foto, privacidad y vinculación.
   ============================================================ */

document.addEventListener("click", async ev => {
  const t = ev.target.closest("button, [data-vincular]");
  if (!t) return;

  /* --- atar la cuenta a una ficha del censo --- */
  if (t.dataset && t.dataset.vincular){
    const socio = byId(C("socios"), t.dataset.vincular);
    if (!socio) return;
    t.disabled = true;
    try {
      await guardar("socios", socio.id, {authUserId: SESION.usuario.id});
      await SESION.refrescar();
      await recargar();
      toast("Cuenta vinculada al socio nº " + socio.numero);
      render();
    } catch(e){
      t.disabled = false;
      toast(e.message || "No se ha podido vincular");
    }
    return;
  }

  /* --- contraseña --- */
  if (t.id === "guardar-clave"){
    const c1 = $("#clave1"), c2 = $("#clave2");
    if (!c1 || !c2) return toast("No encuentro el formulario; recarga la página");
    const a = c1.value || "", b = c2.value || "";
    if (!a) return toast("Escribe la contraseña nueva");
    if (a.length < 8) return toast("La contraseña necesita ocho caracteres como mínimo");
    if (a !== b) return toast("Las dos contraseñas no coinciden");
    t.disabled = true;
    try {
      await SESION.ponerContrasena(a);
      c1.value = ""; c2.value = "";
      toast("Contraseña guardada. A partir de ahora entras con ella.");
      render();
    } catch(e){ toast(e.message || "No se ha podido guardar"); }
    t.disabled = false;
    return;
  }

  /* --- quitar la foto --- */
  if (t.id === "quitar-avatar"){
    const s = SESION.socio; if (!s) return;
    try {
      await guardar("socios", s.id, {avatarUrl: null});
      await SESION.refrescar();
      toast("Foto quitada"); render();
    } catch(e){ toast(e.message || "No se ha podido quitar"); }
  }
});

/* --- subir la foto --- */
document.addEventListener("change", async ev => {
  if (ev.target.id !== "subir-avatar") return;
  const file = ev.target.files && ev.target.files[0];
  const s = SESION.socio;
  if (!file || !s) return;

  if (!/^image\//.test(file.type)) return toast("Eso no es una imagen");
  if (file.size > 5 * 1024 * 1024) return toast("La imagen pasa de 5 MB");

  toast("Subiendo la foto…");
  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ruta = `socios/${s.id}/avatar-${Date.now()}.${ext}`;

    const { error } = await S.sb.storage.from("media")
      .upload(ruta, file, {upsert: true, contentType: file.type});
    if (error) throw error;

    const { data } = S.sb.storage.from("media").getPublicUrl(ruta);
    await guardar("socios", s.id, {avatarUrl: data.publicUrl});
    await SESION.refrescar();
    toast("Foto actualizada");
    render();
  } catch(e){
    toast(e.message || "No se ha podido subir la foto");
  }
});

/* --- privacidad --- */
document.addEventListener("change", async ev => {
  const t = ev.target;
  const s = SESION.socio;
  if (!s) return;

  if (t.id === "priv-perfil"){
    try {
      await guardar("socios", s.id, {perfilPublico: t.value});
      await SESION.refrescar();
      toast(t.value === "oculto" ? "Tu perfil vuelve a estar oculto"
          : t.value === "socios" ? "Ahora te ven los socios del club"
          : "Tu perfil es público");
      render();
    } catch(e){ toast(e.message || "No se ha podido guardar"); }
    return;
  }

  if (t.dataset && t.dataset.priv){
    const priv = Object.assign({}, s.priv || {});
    priv[t.dataset.priv] = t.value;
    try {
      await guardar("socios", s.id, {priv});
      await SESION.refrescar();
      toast("Guardado");
    } catch(e){ toast(e.message || "No se ha podido guardar"); }
  }
});

/* --- subir un vídeo del ejemplar --- */
document.addEventListener("change", async ev => {
  const inp = ev.target;
  if (!inp.dataset || !inp.dataset.video) return;
  const file = inp.files && inp.files[0];
  const perroId = inp.dataset.video;
  inp.value = "";
  if (!file) return;

  toast("Comprobando el vídeo…");
  try {
    const r = await subirVideoPerro(file, perroId);
    toast(`Vídeo subido (${minutos(r.duracion)}). La junta lo revisará antes de publicarlo.`);
    render();
  } catch(e){
    toast(e.message || "No se ha podido subir el vídeo");
  }
});

/* --- la junta publica o rechaza --- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-video-val]");
  if (!b) return;
  ev.stopPropagation();
  if (!SESION.esAdmin) return toast("Los vídeos los publica la junta directiva");

  const [decision, id] = b.dataset.videoVal.split("|");
  let nota = "";
  if (decision === "rechazado"){
    nota = prompt("¿Por qué no se publica? Lo verá quien lo subió:", "");
    if (nota === null) return;
  }
  b.disabled = true;
  try {
    await resolverVideo(id, decision, nota);
    toast(decision === "validado" ? "Vídeo publicado" : "Vídeo rechazado");
  } catch(e){ toast(e.message || "No se ha podido"); }
  render();
});


/* --- cuántas generaciones enseña el pedigrí --- */
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-gen]");
  if (!b) return;
  genPedigri = +b.dataset.gen;
  render();
});

AL_ELEGIR_FICHA.cruceMacho  = id => { cruceSel.m = id; render(); };
AL_ELEGIR_FICHA.cruceHembra = id => { cruceSel.h = id; render(); };

/* --- instalar la plataforma en el teléfono --- */
document.addEventListener("click", async ev => {
  if (ev.target.id !== "instalar-app") return;
  if (!ofertaDeInstalar) return toast("Este navegador no ofrece instalarla");
  ofertaDeInstalar.prompt();
  const { outcome } = await ofertaDeInstalar.userChoice;
  ofertaDeInstalar = null;                 // el ofrecimiento sirve una sola vez
  if (outcome !== "accepted") toast("Puedes instalarla más adelante desde aquí");
  render();
});

/* --- elegir de qué evento se ven los resultados --- */
document.addEventListener("change", ev => {
  if (ev.target.id !== "elegir-evento") return;
  eventoElegido = ev.target.value;
  render();
});

/* --- que me escriban, o no --- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-mensajes-si]");
  if (!b) return;
  const s = SESION.socio; if (!s) return;
  await guardar("socios", s.id, {aceptaMensajes: b.dataset.mensajesSi === "1"});
  await SESION.refrescar();
  await recargar();
  toast(b.dataset.mensajesSi === "1"
    ? "Los socios del club pueden escribirte"
    : "Ya no te llegarán mensajes de otros socios");
  render();
});

/* --- escribir a otro socio --- */
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-escribir]");
  if (b) return FORMS.mensaje(b.dataset.escribir);
  if (ev.target.id === "nuevo-mensaje") FORMS.nuevoMensaje();
});

/* --- marcar un mensaje como leído, o borrarlo --- */
document.addEventListener("click", async ev => {
  const l = ev.target.closest("[data-leido]");
  if (l){
    await guardar("mensajes", l.dataset.leido, {leido:new Date().toISOString()});
    await recargar(); render(); return;
  }
  const b = ev.target.closest("[data-borrar-mensaje]");
  if (b){
    if(!confirm("¿Borrar este mensaje de tu bandeja?")) return;
    const { error } = await S.sb.from("mensajes").delete().eq("id", b.dataset.borrarMensaje);
    if (error) return avisarError(error);
    await recargar(); toast("Mensaje borrado"); render();
  }
});

/* --- me gusta --- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-megusta]");
  if (!b) return;
  const yo = miSocioId();
  if (!yo) return toast("Sólo los socios pueden hacerlo");
  const perroId = b.dataset.megusta;
  b.disabled = true;
  const { error } = leDiMeGusta(perroId)
    ? await S.sb.from("megusta").delete().eq("perro_id", perroId).eq("socio_id", yo)
    : await S.sb.from("megusta").insert({ perro_id: perroId, socio_id: yo });
  if (error){ b.disabled = false; return avisarError(error); }
  await recargar();
  render();
});

/* --- el buscador de la barra de arriba --- */
document.addEventListener("input", ev => {
  if (ev.target.id !== "q") return;
  pintarBusqueda(ev.target.value);
});
document.addEventListener("click", ev => {
  /* Al elegir un resultado se va a su ficha y se recoge el panel. */
  const f = ev.target.closest(".busca-fila");
  if (f){
    const q = $("#q"); if (q) q.value = "";
    pintarBusqueda("");
    return;
  }
  /* Y al pinchar fuera, también se recoge. */
  if (!ev.target.closest(".search")) pintarBusqueda("");
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && ev.target.id === "q"){ ev.target.value = ""; pintarBusqueda(""); }
});

/* --- elegir cuál de las fichas de la familia es la mía --- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-vincular]");
  if (!b) return;
  b.disabled = true;
  const { error } = await S.sb.rpc("vincular_a_mi_ficha", { p_socio: b.dataset.vincular });
  if (error){ b.disabled = false; return avisarError(error); }
  await SESION.refrescar();
  await recargar();
  toast("Ya estás en tu ficha del club");
  location.hash = "#/bienvenida";
  render();
});

/* --- pestañas de la pantalla de eventos --- */
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-tabev]");
  if (!b) return;
  tabEventos = b.dataset.tabev;
  render();
});

/* --- idioma de la plataforma --- */
document.addEventListener("change", async ev => {
  /* Hay dos: el de la barra superior y el de «Mi cuenta». */
  if (ev.target.id !== "elegir-idioma" &&
      !(ev.target.classList && ev.target.classList.contains("elegir-idioma"))) return;
  const codigo = ev.target.value;
  ponerIdioma(codigo);

  /* Se guarda en la ficha del socio para que le siga a cualquier
     dispositivo, no solo a este navegador. */
  const s = SESION.socio;
  if (s){
    try {
      await guardar("socios", s.id, {idioma: codigo});
      await SESION.refrescar();
    } catch(e){ /* si no se puede guardar, queda al menos en este navegador */ }
  }
  toast(nombreIdioma(codigo));
  render();
});

/* --- exportar listados --- */
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-exportar]");
  if (!b) return;
  ev.stopPropagation();

  if (!SESION.esAdmin) return toast("Los listados los exporta la junta directiva");

  const que = b.dataset.exportar;
  if (que === "censo")            return exportarCenso(C("socios"), false);
  if (que === "ejemplares")       return exportarEjemplares(perrosVisibles());
  if (que === "censo-completo"){
    const cuantos = C("socios_privado").length;
    if (!confirm(
      `Este archivo lleva el DNI, la dirección y el número de cuenta de ${cuantos} personas.\n\n` +
      `Va a quedar en tu ordenador, sin cifrar, y cualquiera que lo abra los verá.\n\n` +
      `¿Seguro que lo necesitas así? Para listas de asistencia o envíos, el otro botón basta.`
    )) return;
    return exportarCenso(C("socios"), true);
  }
});

/* ============================================================
   El menú en pantallas estrechas
   ============================================================ */
function menuAbierto(){ return document.documentElement.getAttribute("data-menu") === "abierto"; }

function abrirMenu(si){
  document.documentElement.setAttribute("data-menu", si ? "abierto" : "cerrado");
  const b = $("#abrir-menu");
  if (b) b.setAttribute("aria-expanded", si ? "true" : "false");
}

document.addEventListener("click", ev => {
  if (ev.target.closest("#abrir-menu")) return abrirMenu(!menuAbierto());
  if (ev.target.closest("#tapa-menu"))  return abrirMenu(false);
  /* al elegir una sección, el menú se aparta solo */
  if (ev.target.closest(".side a") && menuAbierto()) abrirMenu(false);
});

addEventListener("keydown", e => { if (e.key === "Escape" && menuAbierto()) abrirMenu(false); });
addEventListener("hashchange", () => abrirMenu(false));
