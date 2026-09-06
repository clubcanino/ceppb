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
  const vis = ev.target.closest("[data-vis]");
  if(vis){ const [pid, v] = vis.dataset.vis.split("|"); const p = byId(C("perros"), pid);
    const n = Object.assign({}, p, {visibilidad:v}); delete n.id; await guardar("perros", pid, n); toast("Visibilidad actualizada"); return; }
  const pf = ev.target.closest("[data-perfil]");
  if(pf){ const [sid, v] = pf.dataset.perfil.split("|"); const s = byId(C("socios"), sid);
    const n = Object.assign({}, s, {perfilPublico:v}); delete n.id;
    await guardar("socios", sid, n);
    toast(v === "oculto" ? "Tu perfil deja de ser visible para el resto del club" : "Perfil visible actualizado");
    return; }
  const pv = ev.target.closest("[data-priv]");
  if(pv){ const [sid, campo, v] = pv.dataset.priv.split("|"); const s = byId(C("socios"), sid);
    const n = Object.assign({}, s, {priv: Object.assign({}, s.priv, {[campo]: v})}); delete n.id;
    await guardar("socios", sid, n); return; }
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
      olvidarMedia(id);
      toast("Foto añadida a la galería");
    }
    render();
  } catch(e){
    toast(e && e.code === "quota_exceeded" ? "La plataforma ha alcanzado su límite de documentos" : (e.message || "No se pudo guardar la imagen"));
  }
});

document.addEventListener("click", async ev => {
  const sb = ev.target.closest("[data-sol]");
  if(sb){
    const [estado, id] = sb.dataset.sol.split("|");
    const x = byId(C("solicitudes"), id); if(!x) return;
    const txt = prompt(estado === "autorizada"
      ? "Resolución de la Junta Directiva (se traslada al criador y a la RSCE):"
      : "Motivo de la denegación:", estado === "autorizada" ? "Informe favorable de la Comisión de Cría; la Junta Directiva autoriza el cruce." : "");
    if(txt === null) return;
    const n = Object.assign({}, x, {estado, resolucion:txt, fechaResolucion:hoy()}); delete n.id;
    await guardar("solicitudes", id, n);
    if(x.tipo === "traspaso" && estado === "autorizada"){
      const p = byId(C("perros"), x.perroId), nuevo = byId(C("socios"), x.aSocioId);
      if(p && nuevo){
        const hist = (p.historialTitularidad || []).concat([{de:x.deSocioId, a:x.aSocioId,
          fecha:x.fechaEfecto || hoy(), documento:x.documento || ""}]);
        const np = Object.assign({}, p, {propietarioId:x.aSocioId,
          propietarioNombre:nuevo.nombreCompleto, historialTitularidad:hist}); delete np.id;
        await guardar("perros", x.perroId, np);
      }
    }
    toast(estado === "autorizada"
      ? (x.tipo === "traspaso" ? "Titularidad transferida" : "Cruce autorizado")
      : (x.tipo === "traspaso" ? "Traspaso denegado" : "Cruce denegado"));
    render(); return;
  }
  const ib = ev.target.closest("[data-inv]");
  if(ib){
    const [acc, id] = ib.dataset.inv.split("|");
    if(acc === "ver") return FORMS.invitacion(id);
    if(acc === "reclamada"){
      const s = byId(C("socios"), id); if(!s) return;
      const n = Object.assign({}, s, {invitacion:Object.assign({}, s.invitacion, {estado:"aceptada", fechaAlta:hoy()}), cuentaVinculada:true});
      delete n.id; await guardar("socios", id, n); toast("Perfil marcado como reclamado"); render(); return;
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
  if(!b) return;
  ev.stopPropagation();
  const [accion, perroId, mediaId] = b.dataset.media.split("|");
  const l = MED.porSujeto[perroId] || [];
  const m = l.find(x => x.id === mediaId);
  if(!m) return;
  if(accion === "principal"){
    const p = byId(C("perros"), perroId);
    /* se guarda una miniatura, no la foto completa: la ficha viaja en cada listado */
    const {dataUri} = await procesarFuente(m.dataUri, {max:320, cuadrada:true, calidad:0.8});
    const n = Object.assign({}, p, {avatar:dataUri, avatarDe:mediaId}); delete n.id;
    await guardar("perros", perroId, n); toast("Foto principal actualizada");
  }
  if(accion === "borrar"){
    if(!confirm("¿Borrar este archivo de la ficha?")) return;
    const p = byId(C("perros"), perroId);
    if(p && p.avatarDe === mediaId){
      const n = Object.assign({}, p); delete n.avatar; delete n.id;
      await guardar("perros", perroId, n);
    }
    await borrar("media", mediaId);
    olvidarMedia(perroId); toast("Archivo borrado");
  }
  render();
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
  if(t.id === "cr-m"){ cruceSel.m = t.value; render(); }
  if(t.id === "cr-h"){ cruceSel.h = t.value; render(); }
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
