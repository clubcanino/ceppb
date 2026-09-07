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
  const nombreLargo = nombrePerro(p);
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
        <div class="cert-sub">Libro genealógico · Reglamento de Cría, actualización de enero de 2025</div>
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
          /* Dos cosas distintas caben aquí: un título homologado, o la
             participación en un campeonato con su puesto y sus puntos.
             Certificar «—» cuando lo que hay es un 3º con 269 puntos
             sería quitarle mérito al perro. */
          `<li><b>${esc(r.titulo || (r.puesto ? r.puesto + "º" : "Participación"))}</b>${
            r.puntos != null && !(r.calificacion === "DESC" && !r.puntos)
              ? " · " + r.puntos + (r.puntosSobre ? " de " + r.puntosSobre : "") + " puntos" : ""}${
            r.calificacion ? " · " + esc(r.calificacion) : ""}${
            r.evento ? " · " + esc(r.evento) : ""}${
            r.fecha ? " · " + fmtF(r.fecha) : (r.anio ? " · " + r.anio : "")}${
            r.guia ? " · Guía: " + esc(r.guia) : ""}</li>`).join("")}</ul>` : ""}
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


/* La firma de la presidencia, calcada de la firma real y redibujada
   en vectorial: así sale nítida a cualquier tamaño, pesa nada y toma
   el color del documento —una firma negra sobre fondo oscuro no se
   vería. */
function rubricaPresidencia(){
  return `<svg class="cert-rubrica-svg" viewBox="0 0 768 499" width="250" height="162"
       role="img" aria-label="Firma de Santiago Díaz Fandiño, presidente del CEPPB"
       fill="none" stroke="currentColor" stroke-width="3.4"
       stroke-linecap="round" stroke-linejoin="round">

    <!-- el óvalo que envuelve toda la firma -->
    <path d="M508 205c78-8 143 2 178 26 32 22 26 50-16 68-56 24-150 36-248 33
             -104-3-201-22-269-50-58-24-84-53-70-77 13-22 61-38 126-44
             62-6 133-2 199 12"/>

    <!-- el trazo largo y afilado, de abajo a arriba -->
    <path d="M300 424c56-70 118-146 176-212 30-34 55-60 76-77 12-10 21-14 26-11
             5 3 3 13-6 29-16 28-45 68-84 116-46 57-98 117-146 168
             -18 19-30 30-36 33"/>
    <path d="M596 100c-14 30-42 74-82 128-38 51-78 98-112 133"/>

    <!-- la eme quebrada del centro -->
    <path d="M432 322c2-24 8-48 17-66 5-10 10-15 14-14 5 1 7 9 8 22 1 12 2 20 5 22
             4 3 12-2 24-14 10-10 17-14 21-11 4 3 5 12 3 25 6-6 14-8 24-6
             16 3 33 12 51 26"/>

    <!-- el trazo horizontal que cruza por dentro -->
    <path d="M287 178c72-8 148-9 226-4 68 4 129 13 182 26" stroke-width="2.6"/>
  </svg>`;
}
