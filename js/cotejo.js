/* ============================================================
   Que no se dé de alta un perro que ya está en el libro.

   El libro arrancó con 3.833 ejemplares sacados de los pedigríes
   de los campeonatos, y la mayoría no tienen titular: la ficha
   existe, con su pedigrí y sus resultados, pero nadie la gobierna.
   Cuando un socio viene a dar de alta a su perro, lo más probable
   es que ese perro YA esté ahí. Si lo mete otra vez, el libro se
   parte en dos fichas del mismo animal, cada una con medio
   pedigrí, y eso ya no se arregla solo.

   Así que antes de dar de alta nada se le enseña lo que hay:
     · si su perro es uno de esos, lo reclama y la junta se lo
       entrega, con su pedigrí y sus resultados ya dentro;
     · si de verdad es otro perro, lo declara y sigue.

   La búsqueda la hace la base de datos sobre TODO el libro, no
   sobre lo que ese socio alcanza a ver. Tenía que ser así: si sólo
   mirase lo visible, el duplicado se colaría justo contra las
   fichas reservadas, que son las que nadie puede cotejar. De una
   ficha que el socio no puede ver no se devuelve el nombre ni el
   dueño: sólo que existe y por qué ha saltado.
   ============================================================ */
"use strict";

/* Lo que se le está enseñando ahora mismo, para saber a qué ficha se
   refiere el botón que pulse. */
const COTEJO = { lista: [] };

/* ------------------------------------------------------------
   Preguntar al libro.
   ------------------------------------------------------------ */
async function coincidenciasDeEjemplar(d){
  if (!SESION.sb) return [];
  try {
    const { data, error } = await SESION.sb.rpc("coincidencias_de_ejemplar", {
      p_nombre: d.nombre || "",
      p_afijo:  d.afijo  || "",
      p_loe:    d.loe    || "",
      p_chip:   d.chip   || "",
    });
    if (error) throw error;
    return (data || []).map(x => ({
      id: x.perro_id, motivo: x.motivo, visible: x.visible,
      nombre: x.nombre, afijo: x.afijo, variedad: x.variedad, sexo: x.sexo,
      fechaNacimiento: x.fecha_nacimiento, loe: x.loe, chip: x.chip,
      conTitular: x.con_titular, esMio: x.es_mio,
    }));
  } catch(e){
    /* Si la comprobación falla no se le cierra la puerta al socio:
       se le avisa y el alta sigue. Vale más un duplicado que un
       socio que no puede registrar su perro. */
    toast("No se ha podido comprobar si ya estaba en el libro. Míralo tú antes de guardar.");
    return [];
  }
}

/* ------------------------------------------------------------
   Enseñárselo.
   ------------------------------------------------------------ */
const MOTIVO = {
  chip:   ["mismo microchip", "block"],
  loe:    ["mismo LOE",       "block"],
  nombre: ["mismo nombre",    "warn"],
};

function lineaDeCoincidencia(c){
  const [texto, tono] = MOTIVO[c.motivo] || ["parecido", "warn"];
  const marca = `<span class="chip ${tono}">${esc(texto)}</span>`;

  /* Una ficha reservada de otro socio: se dice que está, no de quién
     es. Lo justo para que no la duplique. */
  if (!c.visible)
    return `<div class="coin">
      <div>
        <b>Ficha reservada</b> ${marca}
        <div class="mini">Ya hay en el libro un ejemplar con ese dato, de otro socio,
        con la ficha reservada. No podemos enseñártela. Si crees que es tu perro,
        escribe a la secretaría del club.</div>
      </div>
    </div>`;

  /* Muchos LOE del libro vienen ya con el «LOE» delante, tal como
     figura en el pedigrí. Anteponerlo otra vez daba «LOE LOE 2729031». */
  const conEtiqueta = (et, v) =>
    !v ? null : (new RegExp("^" + et, "i").test(String(v).trim()) ? v : et + " " + v);

  const datos = [
    c.variedad,
    c.sexo === "H" ? "hembra" : (c.sexo === "M" ? "macho" : null),
    c.fechaNacimiento
      ? (c.sexo === "H" ? "nacida el " : c.sexo === "M" ? "nacido el " : "nació el ")
        + fmtF(c.fechaNacimiento)
      : null,
    conEtiqueta("LOE",  c.loe),
    conEtiqueta("chip", c.chip),
  ].filter(Boolean).join(" · ");

  const estado = c.esMio
    ? `<span class="chip ok">ya es tuyo</span>`
    : (c.conTitular
        ? `<span class="chip">tiene titular</span>`
        : `<span class="chip est">sin titular</span>`);

  return `<div class="coin">
    <div style="min-width:0">
      <b>${esc(nombrePerro(c))}</b> ${marca} ${estado}
      ${datos ? `<div class="mini">${esc(datos)}</div>` : ""}
    </div>
    <div class="coin-b">
      <a class="btn sm" href="#/perro/${esc(c.id)}" target="_blank" rel="noopener">Ver la ficha</a>
      <button class="btn sm brand" data-es-este="${esc(c.id)}">Es este perro</button>
    </div>
  </div>`;
}

/* `continuar` guarda el alta que quedó en suspenso, con la
   declaración que acaba de firmar el socio. */
function pedirCotejo(lista, continuar){
  COTEJO.lista = lista;

  const seguros = lista.filter(c => c.motivo !== "nombre").length;
  const cabecera = seguros
    ? `Hay ${seguros === 1 ? "un ejemplar" : seguros + " ejemplares"} en el libro con
       <b>el mismo microchip o el mismo LOE</b> que el que estás dando de alta.
       Casi seguro que es tu perro y ya está registrado.`
    : `Hay ejemplares en el libro que se llaman igual. Puede que sea el tuyo, o puede
       que no: en el libro hay nombres repetidos.`;

  abrirForm("¿No estará ya en el libro?", [
    {t: "Lo que ya hay en el libro",
     d: `${cabecera}
        <p style="margin:10px 0 0">Míralos. <b>Si tu perro es uno de ellos, pulsa
        «Es este perro»</b> y lo pides a tu nombre: te lo entregan con el pedigrí y
        los resultados que ya tiene dentro, sin escribir nada más.</p>`,
     f: []},
    {t: "Coincidencias", plano: true, d: lista.map(lineaDeCoincidencia).join(""), f: []},
    {t: "Si de verdad es otro perro",
     d: `Sólo si has mirado los de arriba y ninguno es el tuyo.`,
     f: [
      {k: "certificoNoRepetido", tipo: "check", wide: true,
       l: "Declaro que he comprobado las fichas de arriba y que mi ejemplar no es ninguna de ellas",
       h: "Queda anotado en la ficha, con la fecha, por si algún día aparece el duplicado."},
    ]},
  ], async d2 => {
    if (!d2.certificoNoRepetido){
      toast("Marca la casilla si ninguno de esos es tu perro, o pulsa «Es este perro» en el que lo sea");
      return false;   // el panel se queda abierto
    }
    COTEJO.lista = [];
    await continuar({
      fecha: hoy(),
      socioId: miSocioId() || null,
      coincidencias: lista.map(c => c.id),
    });
  });
}

/* ------------------------------------------------------------
   «Es este perro»: se lo pide a la junta.
   ------------------------------------------------------------ */
function esEstePerro(id){
  const c = COTEJO.lista.find(x => x.id === id);
  if (!c) return;

  if (c.esMio){
    cerrarForm();
    toast("Ese ejemplar ya está a tu nombre");
    return ir("perro/" + id);
  }

  /* Se abandona el alta: no se crea ficha nueva. Lo que se pide es la
     que ya está, con su pedigrí y sus resultados dentro. */
  COTEJO.lista = [];
  cerrarForm();
  /* Diferido: el panel acaba de cerrarse y la reclamación vuelve a
     abrirlo con su propio formulario. */
  setTimeout(() => FORMS.reclamacion(id), 0);
}

document.addEventListener("click", ev => {
  const b = ev.target.closest && ev.target.closest("[data-es-este]");
  if (!b) return;
  ev.preventDefault();
  esEstePerro(b.getAttribute("data-es-este"));
});
