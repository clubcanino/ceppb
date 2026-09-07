/* ============================================================
   El carnet de socio.

   Para llevarlo en el móvil, enseñarlo en una prueba o imprimirlo.
   Lleva lo que un carnet tiene que llevar y nada más: quién es,
   qué número tiene y desde cuándo, si su alta está vigente, y un
   código con el que se puede comprobar que es auténtico.

   Nada de DNI, dirección ni cuenta bancaria: un carnet se enseña,
   y lo que se enseña no debe llevar lo que no hace falta.

   Sólo lo saca su titular, y la junta.
   ============================================================ */
"use strict";

/* El mismo código que en el certificado del ejemplar: sale del
   identificador del socio, así que no hay que guardarlo en ninguna
   parte y no se puede inventar. */
function codigoDeSocio(s){
  const base = String(s.id || "").replace(/-/g, "").toUpperCase();
  return "CEPPB-" + base.slice(0, 4) + "-" + base.slice(4, 8) + "-" + base.slice(8, 12);
}

/* Un carnet de socio vale mientras el socio lo sea. La cuota se paga
   por años naturales, así que se dice hasta cuándo. */
function vigenciaCarnet(s){
  const anio = new Date().getFullYear();
  if (s.fechaBaja) return { ok: false, texto: t("Baja el") + " " + fmtF(s.fechaBaja) };
  return { ok: true, texto: t("Válido durante") + " " + anio };
}

V.carnet = function(id){
  const s = byId(C("socios"), id) || SESION.socio;
  if (!s) return `<div class="empty"><b>${esc(t("Socio no encontrado"))}</b></div>`;
  if (!SESION.esAdmin && !esYo(s.id))
    return `<div class="empty"><b>${esc(t("Cada socio saca el suyo"))}</b>
      ${esc(t("El carnet lo expide su titular, y la junta directiva."))}</div>`;

  const v = vigenciaCarnet(s);
  const cargos = (s.roles || []).slice(0, 2);

  return `
  <div class="no-imprimir" style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="btn brand" id="imprimir-carnet">${esc(t("Guardar como PDF o imprimir"))}</button>
    <span class="mini">${esc(t("En el móvil basta con enseñar esta pantalla."))}</span>
  </div>

  <div class="carnet">
    <div class="carnet-flag"><i></i><i></i><i></i></div>

    <div class="carnet-cab">
      <img class="crest-light" src="assets/emblema-ceppb.png" alt="" width="52" height="52">
      <img class="crest-dark" src="assets/emblema-ceppb-oscuro.webp" alt="" width="52" height="52">
      <div style="min-width:0">
        <div class="carnet-club">${esc(t("Club Español del Perro Pastor Belga"))}</div>
        <div class="carnet-tipo">${esc(t("Carnet de socio"))}</div>
      </div>
      <span class="spacer"></span>
      <div class="carnet-num">
        <div class="mini">${esc(t("Socio nº"))}</div>
        <b>${esc(s.numero)}</b>
      </div>
    </div>

    <div class="carnet-cuerpo">
      <div class="carnet-foto">${s.avatar
        ? `<img src="${esc(s.avatar)}" alt="">`
        : avatar(s, 92)}</div>

      <div style="flex:1;min-width:0">
        <h2 class="carnet-nombre">${esc(s.nombreCompleto)}</h2>
        <div class="carnet-datos">
          <div><span class="mini">${esc(t("Cuota"))}</span><b>${esc(s.cuota || "—")}</b></div>
          <div><span class="mini">${esc(t("Socio desde"))}</span><b>${s.fechaAlta ? fmtF(s.fechaAlta) : "—"}</b></div>
          ${s.afijo ? `<div><span class="mini">${esc(t("Afijo"))}</span><b>${esc(s.afijo)}</b></div>` : ""}
          ${s.provincia ? `<div><span class="mini">${esc(t("Provincia"))}</span><b>${esc(s.provincia)}</b></div>` : ""}
        </div>
        ${cargos.length ? `<div style="margin-top:9px;display:flex;gap:5px;flex-wrap:wrap">
          ${cargos.map(r => `<span class="chip est">${esc(r)}</span>`).join("")}</div>` : ""}
      </div>
    </div>

    <div class="carnet-pie">
      <div>
        <div class="mini">${esc(t("Código de verificación"))}</div>
        <div class="num">${esc(codigoDeSocio(s))}</div>
      </div>
      <span class="spacer"></span>
      <span class="chip ${v.ok ? "ok" : "block"}">${esc(v.texto)}</span>
    </div>
  </div>

  <div class="note no-imprimir" style="margin-top:14px">
    ${esc(t("El carnet acredita que eres socio del club. No lleva tu DNI, ni tu dirección, ni tu número de cuenta: no hacen falta para eso y un carnet se enseña."))}
  </div>`;
};

document.addEventListener("click", ev => {
  if (ev.target.id === "imprimir-carnet") window.print();
});
