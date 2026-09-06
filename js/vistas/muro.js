/* ============================================================
   Novedades — portada del libro de cría.
   Solo aparece aquí lo que el reglamento permite difundir.
   ============================================================ */
"use strict";

const MOTTO_HTML = '<em>belleza</em> y <i>funcionalidad</i>';

V.muro = function(){
  const socios = C("socios");
  const perros = perrosVisibles();
  const res    = C("resultados");
  const items  = [];

  /* Camadas: las intervariedades sin autorización no se difunden (Cap. 8) */
  C("camadas").forEach(c => {
    if (!camadaPublicable(c).ok) return;
    const m = byId(C("perros"), c.madreId), p = byId(C("perros"), c.padreId);
    items.push({
      f: c.fechaNacimiento, tipo: "Camada",
      t: `${(c.nMachos||0)+(c.nHembras||0)} cachorros de ${m?m.nombre:"?"} × ${p?p.nombre:"?"}`,
      d: `${c.nMachos||0} machos · ${c.nHembras||0} hembras${c.afijo?" · Afijo "+c.afijo:""}`,
    });
  });

  /* Resultados: solo los validados por la junta cuentan como novedad */
  res.filter(r => r.validado === "validado").forEach(r => {
    const p = byId(C("perros"), r.perroId);
    if (!p || !perroVisible(p)) return;
    const t = r.tipo === "estructura"
        ? `${r.calificacion}${r.distincion?" · "+r.distincion:""} en ${r.evento||r.tipoEvento||"evento"}`
      : r.tipo === "trabajo"
        ? `Título ${r.titulo}${r.calificacion?" ("+r.calificacion+")":""}`
      : r.tipo === "caracter"
        ? `Prueba de carácter ${r.modalidad}: ${r.resultado}`
        : `Confirmación: ${r.resultado}`;
    items.push({f:r.fecha, tipo:"Resultado", t:`${p.nombre} — ${t}`, d: r.juez ? "Juez: "+r.juez : ""});
  });

  C("eventos").filter(e => e.fecha >= hoy()).forEach(e =>
    items.push({f:e.fecha, tipo:"Evento", t:e.nombre,
                d:`${e.tipo||""}${e.lugar?" · "+e.lugar:""}`, futuro:true}));

  items.sort((a,b) => String(b.f||"").localeCompare(String(a.f||"")));
  const prox   = items.filter(i => i.futuro);
  const pasado = items.filter(i => !i.futuro).slice(0, 22);

  const conAfijo = socios.filter(s => s.afijo).length;
  const conApto  = perros.filter(p => R.aptosDe(p, res).length).length;

  return `
  <div class="masthead">
    <div class="flag"><i></i><i></i><i></i></div>
    <div class="mast-top">
      <img class="crest-light" src="assets/emblema-ceppb.png" alt="Emblema del CEPPB" width="82" height="82">
      <img class="crest-dark" src="assets/emblema-ceppb-oscuro.webp" alt="" width="82" height="82">
      <div style="flex:1;min-width:230px">
        <div class="eyebrow">Club Español del Perro Pastor Belga</div>
        <h2>Libro de Cría</h2>
        <div class="motto">${MOTTO_HTML}</div>
      </div>
      <div style="max-width:34ch;color:var(--muted);font-size:12.5px;line-height:1.5">
        Censo de socios, ejemplares y camadas con el Reglamento de Cría de enero de 2025
        aplicado sobre cada ficha.
      </div>
    </div>
    <div class="mast-stats">
      <div class="stat"><div class="k">Socios</div><div class="v">${socios.length}</div>
        <div class="n">${socios.filter(s=>s.activo).length} con alta vigente</div></div>
      <div class="stat"><div class="k">Criadores</div><div class="v">${conAfijo}</div>
        <div class="n">Con afijo FCI/RSCE</div></div>
      <div class="stat"><div class="k">Ejemplares</div><div class="v">${perros.length}</div>
        <div class="n">${conApto} habilitados para la cría</div></div>
      <div class="stat"><div class="k">Camadas</div><div class="v">${C("camadas").length}</div>
        <div class="n">${C("camadas").filter(c=>c.recomendada).length} recomendadas por el club</div></div>
    </div>
  </div>

  <div class="cols23">
    <div class="card">
      <div class="card-h"><h3>Novedades del club</h3><span class="hint">${pasado.length} entradas</span></div>
      <div class="card-b" style="padding:0">
        ${pasado.length ? pasado.map(i => `<div class="feed-row">
            <span class="when">${i.f?fmtF(i.f).slice(0,5)+"<br>"+String(i.f).slice(0,4):"—"}</span>
            <div style="min-width:0;flex:1">
              <div style="font-weight:600">${esc(i.t)}</div>
              <div class="mini">${esc(i.d)}</div>
            </div>
            <span class="chip" style="flex:none">${esc(i.tipo)}</span></div>`).join("")
          : `<div class="empty"><b>El libro está en blanco</b>
              ${SESION.usuario ? "Todavía no hay ejemplares, resultados ni camadas registrados."
                               : "Entra con tu correo de socio para ver el libro del club."}</div>`}
      </div>
    </div>

    <div class="grid">
      <div class="card"><div class="card-h"><h3>Próximas convocatorias</h3></div>
        <div class="card-b" style="padding:0">
          ${prox.length ? prox.map(i => `<div class="feed-row">
              <span class="when">${fmtF(i.f).slice(0,5)}<br>${String(i.f).slice(0,4)}</span>
              <div style="min-width:0"><div style="font-weight:600">${esc(i.t)}</div>
                <div class="mini">${esc(i.d)}</div></div></div>`).join("")
            : `<div class="empty" style="padding:26px">Sin eventos convocados</div>`}
        </div>
      </div>

      <div class="card"><div class="card-h"><h3>Ejemplares por variedad</h3></div>
        <div class="card-b">
          ${barras(VARIEDADES.map(v => [v, perros.filter(p=>p.variedad===v).length, VCLASE[v]]))}
        </div>
      </div>

      <div class="card"><div class="card-h"><h3>El club fuera de aquí</h3></div>
        <div class="card-b" style="padding:0">
          ${[["Web oficial","ceppb.info","https://www.ceppb.info"],
             ["Facebook","Página del club","https://www.facebook.com/profile.php?id=61563112593042"]]
            .map(([t,d,u]) => `<a class="feed-row" href="${u}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">
               <div style="min-width:0;flex:1"><div style="font-weight:600">${esc(t)}</div>
                 <div class="mini">${esc(d)}</div></div>
               <span class="chip" style="flex:none">Abrir</span></a>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
};
