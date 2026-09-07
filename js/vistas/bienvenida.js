/* ============================================================
   Bienvenida — la primera pantalla después de entrar.

   Un socio que entra por primera vez se encontraba el muro de
   novedades y veinte secciones en el menú, sin saber cuál es
   suya. Aquí se le cuenta en un minuto qué puede hacer y por
   dónde se empieza, con enlaces directos a cada sitio.

   Sólo se cuentan cosas que puede hacer un socio corriente. Lo
   de la junta no aparece salvo que quien mira sea de la junta.
   ============================================================ */
"use strict";

/* Cada paso: qué es, para qué sirve y adónde se va a hacerlo. */
function pasosDelSocio(){
  return [
    {ico:"🐕", t:t("Da de alta tus ejemplares"),
     d:t("Nombre y afijo tal como figuran en el pedigrí, LOE, chip y fecha de nacimiento. La ficha es tuya: nadie más la edita."),
     ir:"perros", b:t("Ir a Ejemplares")},

    {ico:"🌳", t:t("Y su pedigrí se construye solo"),
     d:t("Escribes el padre y la madre; si ya están en el libro, el árbol crece hasta cinco generaciones sin que tengas que teclear nada más. Y si no los tenemos, puedes empezar por los abuelos."),
     ir:"perros", b:t("Ver el libro genealógico")},

    {ico:"🧬", t:t("Registra la salud y los títulos"),
     d:t("Caderas, codos, LVT, las cuatro pruebas genéticas del Anexo A y el ADN. Los introduces tú, con tus certificados en la mano, y después el club los valida uno por uno."),
     ir:"perros", b:t("Empezar por un ejemplar")},

    {ico:"✅", t:t("Mira qué te falta para el apto de cría"),
     d:t("El Reglamento de Cría de enero de 2025 está aplicado sobre cada ficha: las cinco figuras, con lo que ya cumple el perro y lo que le falta exactamente. Sin interpretaciones."),
     ir:"aptos", b:t("Aptos de cría")},

    {ico:"🔬", t:t("Calcula el cruce antes de hacerlo"),
     d:t("Eliges macho y hembra y la plataforma te dice la consanguinidad prevista de la camada, la profundidad del pedigrí y qué antepasados se repiten en ambas líneas. Antes de cubrir, no después."),
     ir:"cruce", b:t("Simulador de cruce")},

    {ico:"📜", t:t("Descárgate el certificado del club"),
     d:t("Un documento firmado con el emblema del CEPPB que reúne los títulos, el expediente de salud y los aptos de cría de tu perro. Sólo puede sacarlo su propietario."),
     ir:"perros", b:t("Desde la ficha del ejemplar")},

    {ico:"📸", t:t("Sube fotos y vídeos"),
     d:t("Las fotos van a la galería de la ficha. Los vídeos, hasta cinco minutos, pasan por el club y de ahí al canal de YouTube del CEPPB."),
     ir:"perros", b:t("Galería del ejemplar")},

    {ico:"🏆", t:t("Sigue los campeonatos"),
     d:t("El palmarés de los Campeonatos Nacionales de IGP, con puesto, puntos y guía de cada participación. Y las retransmisiones en directo, cuando las haya."),
     ir:"eventos", b:t("Eventos y directos")},

    {ico:"🔒", t:t("Tú decides qué se ve de ti"),
     d:t("Tu perfil nace reservado: ningún socio sabe siquiera que existe hasta que tú lo abras, y eliges dato por dato qué compartes. El número de cuenta no se comparte nunca, con nadie."),
     ir:"yo", b:t("Mi perfil")},
  ];
}

V.bienvenida = function(){
  const s = SESION.socio;
  const nombre = s ? String(s.nombreCompleto || "").split(/\s+/)[0] : "";
  return `
    <div class="masthead">
      <div class="flag"><i></i><i></i><i></i></div>
      <div class="mast-top">
        <img class="crest-light" src="assets/emblema-ceppb.png" alt="Emblema del CEPPB" width="82" height="82">
        <img class="crest-dark" src="assets/emblema-ceppb-oscuro.webp" alt="" width="82" height="82">
        <div style="flex:1;min-width:230px">
          <div class="eyebrow">Club Español del Perro Pastor Belga</div>
          <h2>${nombre ? "Bienvenido, " + esc(nombre) : "Te damos la bienvenida"}</h2>
          <div class="motto">${MOTTO_HTML}</div>
        </div>
        <div style="max-width:38ch;color:var(--muted);font-size:12.5px;line-height:1.5">
          El club deja de llevar sus perros en carpetas y hojas sueltas. Esto es un
          libro de cría vivo: el pedigrí se construye solo, el reglamento se aplica
          sobre cada ficha y la consanguinidad se calcula antes de cruzar, no después.
        </div>
      </div>
    </div>

    ${s ? "" : `<div class="note warn" style="margin-bottom:16px">
      Tu cuenta todavía no está atada a ninguna ficha del censo, así que aún no puedes
      registrar ejemplares. <a href="#/ajustes">Vincúlala aquí</a> con tu número de socio.
    </div>`}

    <div class="card lift" style="margin-bottom:16px"><div class="card-h">
      <h3>Nueve cosas que puedes hacer desde hoy</h3>
      <span class="hint">Guía rápida</span>
    </div><div class="card-b">
      <div class="figs">${pasosDelSocio().map((p, i) => `
        <div class="fig" style="--via:var(--gold)">
          <div class="fig-h">
            <span class="code">${i + 1}</span>
            <div><div class="nm2">${p.ico} ${esc(p.t)}</div></div>
          </div>
          <div class="fig-b">
            <p style="color:var(--muted);font-size:12.5px;line-height:1.5;margin-bottom:10px">${esc(p.d)}</p>
            <a class="btn sm" href="#/${p.ir}">${esc(p.b)}</a>
          </div>
        </div>`).join("")}</div>
    </div></div>

    <div class="cols2">
      <div class="card"><div class="card-h"><h3>La regla que sostiene todo lo demás</h3></div><div class="card-b">
        <p style="color:var(--muted);font-size:12.5px;line-height:1.55">
          Las pruebas de salud y los resultados los introduce <b>su propietario</b>, y sólo
          cuentan cuando la <b>junta directiva</b> los coteja con el certificado original.
          Hasta entonces figuran como pendientes y no suman para ningún apto de cría.
        </p>
        <p style="color:var(--muted);font-size:12.5px;line-height:1.55;margin-top:9px">
          Nadie puede dar por buenos sus propios papeles, y eso vale para todos:
          es lo que hace que un apto de cría del CEPPB signifique algo.
        </p>
      </div></div>

      <div class="card"><div class="card-h"><h3>Detalles prácticos</h3></div><div class="card-b">
        <dl class="kv">
          <dt>Desde el móvil</dt><dd>Funciona igual que en el ordenador.</dd>
          <dt>Idioma</dt><dd>Español, inglés, francés y alemán, en <a href="#/ajustes">Mi cuenta</a>.</dd>
          <dt>Contraseña</dt><dd>La eliges tú en <a href="#/ajustes">Mi cuenta</a>. El correo con enlace queda para cuando se olvide.</dd>
          <dt>¿Un perro tuyo ya está en el libro?</dt><dd>Reclámalo desde su ficha; la junta autoriza el cambio de titularidad.</dd>
        </dl>
      </div></div>
    </div>

    ${SESION.esAdmin ? `<div class="note" style="margin-top:16px">
      <b>Además, como miembro de la junta directiva</b> tienes el panel de administración,
      la validación de expedientes y resultados, el censo de socios y las altas.
      <a href="#/admin">Ir al panel de la junta</a>.
    </div>` : ""}

    <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
      <a class="btn brand" href="#/perros">Empezar por mis ejemplares</a>
      <a class="btn" href="#/muro">Ver las novedades del club</a>
    </div>`;
};
