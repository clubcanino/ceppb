/* ============================================================
   Certificado del ejemplar.

   Un documento para imprimir o guardar como PDF, con el emblema del
   club y la firma de la presidencia. Solo recoge lo que la junta ha
   validado: si algo está pendiente, no aparece. Un certificado que
   mezclara datos cotejados con datos sin cotejar no valdría nada.

   Lo saca el propietario del ejemplar. Y la junta, para cualquiera.
   ============================================================ */
"use strict";

function puedeCertificar(p){
  if (!p) return false;
  return SESION.esAdmin || (p.propietarioId && esYo(p.propietarioId));
}

/* Un código con el que cualquiera puede comprobar que el certificado
   es auténtico. Sale del identificador del ejemplar, así que no hay
   que guardarlo en ninguna parte y no se puede inventar. */
function codigoVerificacion(p){
  const base = String(p.id || "").replace(/-/g, "").toUpperCase();
  return "CEPPB-" + base.slice(0, 4) + "-" + base.slice(4, 8) + "-" + base.slice(8, 12);
}

V.certificado = function(id){
  const p = byId(C("perros"), id);
  if (!p) return `<div class="empty"><b>Ejemplar no encontrado</b></div>`;
  if (!puedeCertificar(p))
    return `<div class="empty"><b>El certificado lo expide su propietario</b>
      Solo quien figura como titular del ejemplar puede sacarlo, y la junta directiva.</div>`;

  const res  = C("resultados");
  const val  = res.filter(r => r.perroId === p.id && r.validado === "validado");
  const a    = R.anexoA(p);
  const figs = R.figurasDe(p, res);
  const aptos = figs.filter(f => f.cumple);
  const pend  = R.pendientes(p, res);

  const estr = val.filter(r => r.tipo === "estructura");
  const trab = val.filter(r => r.tipo === "trabajo");
  const car  = val.filter(r => r.tipo === "caracter");

  const saludValidada = (p.salud || {}).validacion &&
                        (p.salud.validacion.estado === "validado");
  const s = p.salud || {};
  const nombreLargo = [p.nombre, p.afijo].filter(Boolean).join(" ");
  const prop = p.propietarioId ? byId(C("socios"), p.propietarioId) : null;

  return `
  <div class="no-imprimir" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="btn brand" id="imprimir-certificado">Guardar como PDF o imprimir</button>
    <a class="btn" href="#/perro/${esc(p.id)}">Volver a la ficha</a>
    <span class="mini" style="margin-left:auto">Solo se certifica lo que la junta ha validado</span>
  </div>

  ${pend.total ? `<div class="note warn no-imprimir" style="margin-bottom:16px">
    Este ejemplar tiene <b>${pend.total} ${pend.total === 1 ? "dato pendiente" : "datos pendientes"}</b>
    de validar. No saldrán en el certificado hasta que la junta los coteje.</div>` : ""}

  <div class="certificado" id="certificado">
    <div class="cert-flag"><i></i><i></i><i></i></div>

    <header class="cert-cab">
      <img class="crest-light" src="assets/emblema-ceppb.png" alt="" width="76" height="76">
      <img class="crest-dark"  src="assets/emblema-ceppb-oscuro.webp" alt="" width="76" height="76">
      <div>
        <div class="cert-club">Club Español del Perro Pastor Belga</div>
        <h1>Certificado del ejemplar</h1>
        <div class="cert-sub">Libro de Cría · Reglamento de Cría, actualización de enero de 2025</div>
      </div>
    </header>

    <section class="cert-ident">
      <h2>${esc(nombreLargo)}</h2>
      <dl class="kv">
        <dt>Variedad</dt><dd>${esc(p.variedad || "—")}</dd>
        <dt>Sexo</dt><dd>${p.sexo === "M" ? "Macho" : p.sexo === "H" ? "Hembra" : "—"}</dd>
        <dt>Nacimiento</dt><dd>${fmtF(p.fechaNacimiento)}</dd>
        <dt>LOE</dt><dd class="num">${esc(p.loe || "—")}</dd>
        <dt>Microchip</dt><dd class="num">${esc(p.chip || "—")}</dd>
        ${p.afijo ? `<dt>Afijo</dt><dd>${esc(p.afijo)}</dd>` : ""}
        ${prop ? `<dt>Propietario</dt><dd>${esc(prop.nombreCompleto || "")}</dd>` : ""}
      </dl>
    </section>

    <section>
      <h3>Aptos de cría reconocidos</h3>
      ${aptos.length
        ? `<ul class="cert-lista">${aptos.map(f =>
            `<li><b>${esc(f.fig.c)}</b> — ${esc(f.fig.n)} <span class="cert-art">(Cap. ${esc(f.fig.art)})</span></li>`).join("")}</ul>`
        : `<p class="cert-nada">Este ejemplar no tiene reconocido ningún apto de cría del club.</p>`}
    </section>

    <section>
      <h3>Pruebas de salud — Anexo A</h3>
      ${saludValidada
        ? `<table class="cert-tabla"><tbody>
             <tr><td>Displasia de cadera</td><td>${esc((s.hd || "—").toUpperCase())}${s.hdEntidad ? " · " + esc(s.hdEntidad) : ""}</td></tr>
             <tr><td>Displasia de codo</td><td>${esc(String(s.ed ?? "—"))}${s.edEntidad ? " · " + esc(s.edEntidad) : ""}</td></tr>
             <tr><td>Vértebra de transición</td><td>${esc(s.lvt || "—")}</td></tr>
             ${GENES.map(g => `<tr><td>${esc(g.k)}</td><td>${esc((s.genes || {})[g.k] || "sin analizar")}</td></tr>`).join("")}
             <tr><td>Perfil de ADN del ejemplar</td><td>${p.adnEjemplar ? "depositado" + (s.adnEntidad ? " · " + esc(s.adnEntidad) : "") : "sin depositar"}</td></tr>
           </tbody></table>
           <p class="cert-pie-tabla">Expediente cotejado por la Comisión de Cría
             ${p.salud.validacion.fecha ? "el " + fmtF(p.salud.validacion.fecha) : ""}.
             ${a.ok ? "Cumple el Anexo A en su totalidad." : "No cumple todavía el Anexo A completo."}</p>`
        : `<p class="cert-nada">El expediente de salud no ha sido validado por la junta, así que no se certifica.</p>`}
    </section>

    <section>
      <h3>Títulos y resultados validados</h3>
      ${val.length ? `
        ${trab.length ? `<h4>Trabajo</h4><ul class="cert-lista">${trab.map(r =>
          `<li><b>${esc(r.titulo || "—")}</b>${r.evento ? " · " + esc(r.evento) : ""}${r.fecha ? " · " + fmtF(r.fecha) : ""}</li>`).join("")}</ul>` : ""}
        ${estr.length ? `<h4>Estructura</h4><ul class="cert-lista">${estr.map(r =>
          `<li><b>${esc(r.calificacion || "—")}</b>${r.distincion ? " · " + esc(r.distincion) : ""}${r.evento ? " · " + esc(r.evento) : ""}${r.fecha ? " · " + fmtF(r.fecha) : ""}${r.juez ? " · Juez: " + esc(r.juez) : ""}</li>`).join("")}</ul>` : ""}
        ${car.length ? `<h4>Carácter</h4><ul class="cert-lista">${car.map(r =>
          `<li><b>${esc(r.modalidad || "")} ${esc(r.resultado || "")}</b>${r.fecha ? " · " + fmtF(r.fecha) : ""}</li>`).join("")}</ul>` : ""}`
        : `<p class="cert-nada">Sin títulos ni resultados validados por la junta.</p>`}
    </section>

    <footer class="cert-firma">
      <div class="cert-fecha">
        Expedido en ${esc(new Date().toLocaleDateString("es-ES", {day:"numeric", month:"long", year:"numeric"}))}
      </div>
      <div class="cert-rubrica">
        ${rubricaPresidencia()}
        <div class="cert-linea"></div>
        <div><b>Santiago Díaz Fandiño</b></div>
        <div class="cert-cargo">Presidente del Club Español del Perro Pastor Belga</div>
      </div>
      <div class="cert-codigo">
        <div class="mini">Código de verificación</div>
        <div class="num">${esc(codigoVerificacion(p))}</div>
        <div class="mini">Compruébelo en clubcanino.github.io/ceppb</div>
      </div>
    </footer>
  </div>`;
};

document.addEventListener("click", ev => {
  if (ev.target.id === "imprimir-certificado") window.print();
});


/* La firma de la presidencia. Va incrustada y no como imagen para que
   tome el color del texto: en modo oscuro, una firma negra sobre
   fondo negro no se ve.

   Es provisional. En cuanto haya una firma escaneada, se sustituye
   este dibujo por la imagen de verdad. */
function rubricaPresidencia(){
  return `<svg class="cert-rubrica-svg" viewBox="0 0 340 110" width="230" height="74"
       role="img" aria-label="Firma de la presidencia" fill="none"
       stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M38 74c-14 4-24-2-22-12 2-11 22-14 30-24 6-8 1-17-10-16-9 1-16 8-18 16"/>
    <path d="M30 66c16 8 30 2 40-10 4-5 7-12 4-16-4-5-11 0-12 7-2 12 6 22 18 22 10 0 17-7 21-15"/>
    <path d="M126 30c-4 22-6 36-4 48 1 6 6 8 11 5 10-5 16-20 14-32-1-9-8-14-15-11"/>
    <path d="M120 46c14-3 26-2 34 2"/>
    <path d="M166 60c14-6 26-14 34-24 3-4 1-9-4-8-7 2-11 12-9 21 2 10 11 16 21 14 12-3 19-16 17-28"/>
    <path d="M238 34c-6 20-8 34-6 46"/>
    <path d="M230 44h26"/>
    <path d="M244 70c16 6 32 4 46-6 5-4 9-9 10-15"/>
    <path d="M52 90c60 10 150 6 236-12" stroke-width="2"/>
  </svg>`;
}
