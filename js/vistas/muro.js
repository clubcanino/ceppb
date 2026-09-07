/* ============================================================
   Novedades — portada del libro de cría.
   Solo aparece aquí lo que el reglamento permite difundir.
   ============================================================ */
"use strict";

const MOTTO_HTML = '<em>belleza</em> y <i>funcionalidad</i>';

V.muro = function(){
  /* Quien no ha entrado ve una portada, no el libro. Nada de cifras
     del club ni de movimientos de sus socios: se le cuenta qué es
     esto y qué podrá hacer, y se le abre la puerta. */
  if (!SESION.usuario) return portadaPublica();

  /* Y quien ha entrado con un correo que no consta en el censo
     tampoco ve el libro: el libro es de los socios del club. */
  if (SESION.rol === "sin-ficha") return sinFichaEnElCenso();

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
        /* Un acta de campeonato no trae título: trae puesto y puntos.
           Sin esto el muro anunciaba «Título undefined». */
        ? (r.titulo
            ? `Título ${r.titulo}${r.calificacion?" ("+r.calificacion+")":""}`
            : `${r.puesto?r.puesto+"º":"Participación"}${r.puntos!=null&&!(r.calificacion==="DESC"&&!r.puntos)?" con "+r.puntos+(r.puntosSobre?" de "+r.puntosSobre:"")+" puntos":""}${r.calificacion?" ("+r.calificacion+")":""} en ${r.evento||r.tipoEvento||"evento"}`)
      : r.tipo === "caracter"
        ? `Prueba de carácter ${r.modalidad}: ${r.resultado}`
        : `Confirmación: ${r.resultado}`;
    items.push({f:r.fecha || (r.anio ? r.anio + "-12-31" : ""), tipo:"Resultado",
                t:`${p.nombre} — ${t}`,
                d: r.juez ? "Juez: "+r.juez : (r.guia ? "Guía: "+r.guia : "")});
  });

  C("eventos").filter(e => e.fecha >= hoy()).forEach(e =>
    items.push({f:e.fecha, tipo:"Evento", t:e.nombre,
                d:`${e.tipo||""}${e.lugar?" · "+e.lugar:""}`, futuro:true}));

  /* Un ejemplar dado de alta es la primera novedad que ve el club.
     Sin esto, el libro parecía en blanco teniendo perros dentro. */
  perros.forEach(p => {
    const cuando = String(p.creado || "").slice(0, 10);
    items.push({
      f: cuando,
      tipo: "Ejemplar",
      t: nombrePerro(p) + " se une al libro",
      d: [p.variedad, p.sexo === "M" ? "macho" : p.sexo === "H" ? "hembra" : "",
          p.propietarioId ? "de " + nombreSocio(p.propietarioId) : ""]
         .filter(Boolean).join(" · "),
      ir: "perro/" + p.id,
    });
  });

  /* Los aptos de cría concedidos: es lo que de verdad importa aquí */
  perros.forEach(p => {
    const aptos = R.aptosDe(p, res);
    if (!aptos.length) return;
    items.push({
      f: String(p.creado || "").slice(0, 10),
      tipo: "Apto de cría",
      t: `${p.nombre} obtiene ${aptos.join(", ")}`,
      d: aptos.map(c => (FIG_POR_CODIGO[c] || {}).n).filter(Boolean).join(" · "),
      ir: "perro/" + p.id,
      destacado: true,
    });
  });

  /* Y los expedientes de salud que la junta acaba de cotejar */
  perros.forEach(p => {
    const v = (p.salud || {}).validacion || {};
    if (v.estado !== "validado") return;
    const a = R.anexoA(p);
    items.push({
      f: v.fecha || String(p.creado || "").slice(0, 10),
      tipo: "Salud",
      t: `${p.nombre}: expediente de salud validado`,
      d: a.ok ? "Cumple el Anexo A completo"
              : `Faltan ${a.items.filter(i => i.e === "falta").length} pruebas para el Anexo A`,
      ir: "perro/" + p.id,
    });
  });

  items.sort((a,b) => String(b.f||"").localeCompare(String(a.f||"")));
  const prox   = items.filter(i => i.futuro);
  const pasado = items.filter(i => !i.futuro).slice(0, 22);

  const conAfijo = socios.filter(s => s.afijo).length;
  const conApto  = perros.filter(p => R.aptosDe(p, res).length).length;

  /* Si el club está retransmitiendo, eso va lo primero de todo */
  const directos = eventosEnDirecto();

  return `
  ${directos.map(reproductorDirecto).join("")}
  <div class="masthead">
    <div class="flag"><i></i><i></i><i></i></div>
    <div class="mast-top">
      <img class="crest-light" src="assets/emblema-ceppb.png" alt="Emblema del CEPPB" width="82" height="82">
      <img class="crest-dark" src="assets/emblema-ceppb-oscuro.webp" alt="" width="82" height="82">
      <div style="flex:1;min-width:230px">
        <div class="eyebrow">Club Español del Perro Pastor Belga</div>
        <h2>Mi CEPPB</h2>
        <div class="motto">${MOTTO_HTML}</div>
      </div>
      <div style="max-width:34ch;color:var(--muted);font-size:12.5px;line-height:1.5">
        Censo de socios, ejemplares y camadas con el Reglamento de Cría de enero de 2025
        aplicado sobre cada ficha.
      </div>
    </div>
    <div class="mast-stats">
      ${SESION.esAdmin ? `<div class="stat"><div class="k">Socios</div><div class="v">${socios.length}</div>
        <div class="n">${socios.filter(s=>s.activo).length} con alta vigente</div></div>
      <div class="stat"><div class="k">Criadores</div><div class="v">${conAfijo}</div>
        <div class="n">Con afijo FCI/RSCE</div></div>` : ""}
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
        ${pasado.length ? pasado.map(i => `<div class="feed-row ${i.ir?"clic":""}" ${i.ir?`data-go="${esc(i.ir)}"`:""}>
            <span class="when">${i.f?fmtF(i.f).slice(0,5)+"<br>"+String(i.f).slice(0,4):"—"}</span>
            <div style="min-width:0;flex:1">
              <div style="font-weight:600">${esc(i.t)}</div>
              <div class="mini">${esc(i.d)}</div>
            </div>
            <span class="chip ${i.destacado?"ok":""}" style="flex:none">${esc(i.tipo)}</span></div>`).join("")
          : `<div class="empty"><b>El libro está en blanco</b>
              ${!SESION.usuario
                ? `Entra con tu correo de socio para ver el libro del club.
                   <div style="margin-top:14px"><a class="btn brand" href="#/entrar">Entrar</a></div>`
                : `Todavía no hay ejemplares registrados. Empieza por los tuyos.
                   <div style="margin-top:14px"><button class="btn brand" data-form="perro|">Dar de alta un ejemplar</button></div>`}</div>`}
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

/* ============================================================
   Portada pública — lo que ve quien todavía no ha entrado.

   Ni una cifra del club, ni un nombre de socio, ni un perro. Sólo
   qué es esto, qué podrá hacer dentro y la puerta.
   ============================================================ */
function portadaPublica(){
  return `
  <div class="masthead">
    <div class="flag"><i></i><i></i><i></i></div>
    <div class="mast-top">
      <img class="crest-light" src="assets/emblema-ceppb.png" alt="Emblema del CEPPB" width="82" height="82">
      <img class="crest-dark" src="assets/emblema-ceppb-oscuro.webp" alt="" width="82" height="82">
      <div style="flex:1;min-width:230px">
        <div class="eyebrow">${esc(t("Club Español del Perro Pastor Belga"))}</div>
        <h2>${esc(t("Mi CEPPB"))}</h2>
        <div class="motto">${MOTTO_HTML}</div>
      </div>
      <div style="max-width:38ch;color:var(--muted);font-size:12.5px;line-height:1.5">
        ${esc(t("El libro genealógico del club: los ejemplares, sus pedigríes, su salud y sus títulos, con el Reglamento de Cría aplicado sobre cada ficha."))}
      </div>
    </div>
  </div>

  <div class="card lift" style="margin-bottom:16px">
    <div class="card-h"><h3>${esc(t("Para los socios del CEPPB"))}</h3></div>
    <div class="card-b">
      <p style="color:var(--muted);font-size:13px;line-height:1.55;margin-bottom:16px">
        ${esc(t("Esto es de uso interno del club. Cada socio entra con su correo y ve su propia área; lo que aparece en ella depende de lo que cada uno haya decidido compartir."))}
      </p>
      <div class="figs">${pasosDelSocio().slice(0, 6).map((p, i) => `
        <div class="fig" style="--via:var(--gold)">
          <div class="fig-h">
            <span class="code">${i + 1}</span>
            <div><div class="nm2">${p.ico} ${esc(p.t)}</div></div>
          </div>
          <div class="fig-b">
            <p style="color:var(--muted);font-size:12.5px;line-height:1.5;margin:0">${esc(p.d)}</p>
          </div>
        </div>`).join("")}</div>
    </div>
  </div>

  <div class="cols2">
    <div class="card"><div class="card-h"><h3>${esc(t("Entrar"))}</h3></div><div class="card-b">
      <p style="color:var(--muted);font-size:12.5px;line-height:1.55;margin-bottom:14px">
        ${esc(t("Si eres socio del club, tu ficha ya existe con los datos que constan en secretaría. Entra con tu correo para tomar posesión de ella."))}
      </p>
      <a class="btn brand" href="#/entrar">${esc(t("Acceso de socios"))}</a>
    </div></div>

    <div class="card"><div class="card-h"><h3>${esc(t("¿Todavía no eres socio?"))}</h3></div><div class="card-b">
      <p style="color:var(--muted);font-size:12.5px;line-height:1.55;margin-bottom:14px">
        ${esc(t("El Club Español del Perro Pastor Belga reúne a los criadores, deportistas y aficionados de las cuatro variedades del pastor belga."))}
      </p>
      <a class="btn" href="${esc(CONFIG.WEB_ALTA)}" target="_blank" rel="noopener noreferrer">${esc(t("Hazte socio"))}</a>
    </div></div>
  </div>`;
}

/* ============================================================
   Ha entrado, pero su correo no consta en el censo.

   O no es socio del club, o secretaría tiene otro correo suyo. No
   se le echa: se le explica y se le dan las dos salidas.
   ============================================================ */
function sinFichaEnElCenso(){
  const varias = (SESION.fichasPosibles || []).length > 1;
  const correo = (SESION.usuario && SESION.usuario.email) || "";

  if (varias) return `
    <div class="card" style="max-width:560px"><div class="card-h">
      <h3>${esc(t("¿Cuál de estas fichas es la tuya?"))}</h3></div>
      <div class="card-b">
        <p class="dim" style="margin-bottom:14px">${esc(t("En el censo hay varias fichas con tu mismo correo, que es lo normal en una familia. Elige la tuya: sólo se ata una vez, así que asegúrate."))}</p>
        ${SESION.fichasPosibles.map(f => `<div style="margin-bottom:8px">
          <button class="btn" data-vincular="${esc(f.id)}">${esc(f.nombre)} · nº ${esc(f.numero)}</button>
        </div>`).join("")}
        <div class="mini" style="margin-top:12px">${esc(t("Si ninguna es la tuya, escribe a la secretaría del club."))}</div>
      </div></div>`;

  return `
    <div class="card" style="max-width:560px"><div class="card-h">
      <h3>${esc(t("Tu correo no consta en el censo"))}</h3></div>
      <div class="card-b">
        <div class="note warn" style="margin-bottom:14px">
          ${esc(t("Has entrado con"))} <b>${esc(correo)}</b>, ${esc(t("y ese correo no figura en la ficha de ningún socio del club. Mi CEPPB es de uso interno: hasta que tu cuenta esté atada a una ficha del censo no se abre."))}
        </div>
        <p class="dim">${esc(t("Dos motivos suele haber:"))}</p>
        <ul class="pasos-instalar">
          <li>${esc(t("La secretaría tiene otro correo tuyo. Escríbele y lo cambia, o entra con aquél."))}</li>
          <li>${esc(t("Todavía no eres socio del club."))}</li>
        </ul>
        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn brand" href="${esc(CONFIG.WEB_ALTA)}" target="_blank" rel="noopener noreferrer">${esc(t("Hazte socio"))}</a>
          <button class="btn" id="salir">${esc(t("Salir"))}</button>
        </div>
      </div></div>`;
}
