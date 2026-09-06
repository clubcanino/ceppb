/* ============================================================
   Diagnóstico — para cuando algo no funciona y hay que saber por
   qué sin adivinar. Se abre en #/diagnostico.

   No enseña ningún dato de socios: solo el estado de la sesión y
   de la conexión.
   ============================================================ */
"use strict";

const VERSION_APP = "23";

V.diagnostico = function(){
  const u = SESION.usuario;
  const s = SESION.socio;

  const filas = [
    ["Versión de los archivos", VERSION_APP,
      "Si aquí no pone " + VERSION_APP + ", el navegador tiene guardada una versión vieja: pulsa Cmd+Shift+R"],
    ["Base de datos", S.error === "sin-configurar" ? "SIN CONFIGURAR" : "conectada", ""],
    ["Datos cargados", S.listo ? "sí" : "todavía no", ""],
    ["Sesión", u ? "iniciada" : "NO has entrado",
      u ? "" : "Sin sesión no hay área de socio ni Mi cuenta: eso es lo primero"],
    ["Correo", u ? u.email : "—", ""],
    ["Junta directiva", SESION.esAdmin ? "sí" : "no", ""],
    ["Ficha de socio", s ? "nº " + s.numero + " · " + (s.nombreCompleto || "") : "ninguna",
      s ? "" : "Sin ficha no hay «Mi perfil»: es normal en la cuenta del club"],
    ["Contraseña propia", SESION.tieneContrasena() ? "puesta" : "SIN PONER",
      SESION.tieneContrasena() ? "" : "Ponla en Mi cuenta"],
    ["Socios que ves", C("socios").length, ""],
    ["Ejemplares que ves", C("perros").length, ""],
  ];

  return `<div class="card" style="max-width:760px">
    <div class="card-h"><h3>Diagnóstico</h3>
      <span class="hint">enséñale esto a quien te ayude</span></div>
    <div class="card-b" style="padding:0">
      <table><tbody>
        ${filas.map(([k, v, nota]) => `<tr>
          <td style="width:38%">${esc(k)}</td>
          <td><b>${esc(String(v))}</b>${nota ? `<div class="mini">${esc(nota)}</div>` : ""}</td>
        </tr>`).join("")}
      </tbody></table>
    </div>
    <div class="card-b" style="border-top:1px solid var(--line)">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="diag-recargar">Recargar sin caché</button>
        ${SESION.usuario
          ? `<button class="btn" data-ir="ajustes">Ir a Mi cuenta</button>
             <button class="btn" id="salir">Cerrar sesión</button>`
          : `<a class="btn brand" href="#/entrar">Ir a Entrar</a>`}
      </div>
    </div>
  </div>`;
};

document.addEventListener("click", ev => {
  if (ev.target.id === "diag-recargar") location.reload(true);
});
