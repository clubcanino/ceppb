/* ============================================================
   El simulador de cruce.

   Estuvo roto en producción y nadie lo vio: el buscador escribe
   detrás del nombre la variedad, para distinguir a los que se
   llaman igual —«Yala de Lacanin de As · Tervueren»— y sólo daba
   por elegido al perro si escribías esa etiqueta entera. Un socio
   escribe el nombre de su perro y ya está, así que el simulador se
   quedaba en blanco por mucho que lo escribiera bien.

   Y además dejaba fuera a los 279 ejemplares que llegaron de los
   pedigríes sin el sexo anotado.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lee = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");

/* ------------------------------------------------------------
   El buscador de fichas, con su manejador de teclado de verdad.
   ------------------------------------------------------------ */
function montarBuscador(opciones){
  let alTeclear = null;
  const oculto = { value: "", type: "hidden" };
  const datalist = { innerHTML: "" };
  const caja = {
    dataset: { busca: "bf-1" },
    querySelector: sel => sel === "datalist" ? datalist : oculto,
  };
  const input = { value: "", type: "text", closest: () => caja };

  const ctx = vm.createContext({
    console, window: {},
    document: { addEventListener: (ev, f) => { if (ev === "input") alTeclear = f; } },
    esc: s => String(s ?? ""),
  });
  vm.runInContext(lee("js/util.js"), ctx, { filename: "js/util.js" });
  vm.runInContext(lee("js/componentes.js"), ctx, { filename: "js/componentes.js" });
  vm.runInContext(`BUSCAFICHAS["bf-1"] = ${JSON.stringify(opciones)};`, ctx);

  return {
    /* Teclear en la caja y devolver la ficha que queda elegida */
    escribir(texto){
      input.value = texto;
      oculto.value = oculto.value;   // conserva lo anterior, como el navegador
      alTeclear({ target: input });
      return oculto.value;
    },
    sugerencias: () => datalist.innerHTML,
  };
}

const LISTA = [
  ["p-1", "A'Iron Man from Metbox Team · Malinois", "LOE 111"],
  ["p-2", "Yala de Lacanin de As · Tervueren", "LOE 222"],
  ["p-3", "Alan · Malinois", "LOE 333"],
  ["p-4", "Alan · Tervueren", "LOE 444"],
  ["p-5", "Quelia del Clamiu · Groenendael", "LOE 555"],
];

test("escribir el nombre del perro lo elige: es lo que hace un socio", () => {
  const b = montarBuscador(LISTA);
  assert.equal(b.escribir("A'Iron Man from Metbox Team"), "p-1",
    "sin esto el simulador se queda en blanco por mucho que escribas bien el nombre");
});

test("la etiqueta entera, la que pone el desplegable, sigue valiendo", () => {
  const b = montarBuscador(LISTA);
  assert.equal(b.escribir("Yala de Lacanin de As · Tervueren"), "p-2");
});

test("no importan mayúsculas ni acentos", () => {
  const b = montarBuscador(LISTA);
  assert.equal(b.escribir("QUELIA DEL CLAMIU"), "p-5");
});

test("si dos perros se llaman igual, no se adivina", () => {
  const b = montarBuscador(LISTA);
  assert.equal(b.escribir("Alan"), "",
    "hay un Alan Malinois y un Alan Tervueren: que elija cuál, no lo decidimos nosotros");
});

test("lo escrito que sólo puede ser una ficha, lo es", () => {
  const b = montarBuscador(LISTA);
  assert.equal(b.escribir("Metbox"), "p-1", "sólo hay un perro que contenga eso");
});

test("borrar deja de tener perro elegido", () => {
  const b = montarBuscador(LISTA);
  assert.equal(b.escribir("Quelia del Clamiu"), "p-5");
  assert.equal(b.escribir("Quel"), "p-5", "sigue siendo la única que encaja");
  assert.equal(b.escribir(""), "", "en blanco, ninguno");
});

/* ------------------------------------------------------------
   El reglamento: qué bloquea y qué sólo avisa
   ------------------------------------------------------------ */
function motor(){
  const ctx = vm.createContext({ console, window: {} });
  for (const f of ["js/util.js", "js/reglamento.js"])
    vm.runInContext(lee(f), ctx, { filename: f });
  return ctx;
}

const ADULTO = { fechaNacimiento: "2020-01-01", variedad: "Malinois", salud: {} };

test("que falte el sexo en la ficha avisa, no bloquea", () => {
  const ctx = motor();
  const l = vm.runInContext(`R.cruce(
    ${JSON.stringify(Object.assign({}, ADULTO, {id:"a", nombre:"Río", sexo:null}))},
    ${JSON.stringify(Object.assign({}, ADULTO, {id:"b", nombre:"Vida", sexo:"H"}))},
    [], [], "2026-09-07")`, ctx);

  const delSexo = l.filter(x => /sexo anotado/.test(x.t));
  assert.equal(delSexo.length, 1, "se avisa de que falta");
  assert.equal(delSexo[0].n, "aviso",
    "no vino en el pedigrí: es un dato que falta, no un incumplimiento del reglamento");
});

test("cruzar dos machos sí se bloquea", () => {
  const ctx = motor();
  const l = vm.runInContext(`R.cruce(
    ${JSON.stringify(Object.assign({}, ADULTO, {id:"a", nombre:"Uno", sexo:"M"}))},
    ${JSON.stringify(Object.assign({}, ADULTO, {id:"b", nombre:"Dos", sexo:"M"}))},
    [], [], "2026-09-07")`, ctx);
  assert.equal(l.some(x => x.n === "bloqueo" && /registrado como macho/.test(x.t)), true);
});

test("lo que el Anexo A prohíbe sigue saliendo, con su artículo", () => {
  const ctx = motor();
  const gen = v => ({ genes: { CACA: v } });
  const l = vm.runInContext(`R.cruce(
    ${JSON.stringify(Object.assign({}, ADULTO, {id:"a", nombre:"Uno", sexo:"M", salud:gen("portador")}))},
    ${JSON.stringify(Object.assign({}, ADULTO, {id:"b", nombre:"Dos", sexo:"H", salud:gen("portador")}))},
    [], [], "2026-09-07")`, ctx);

  const caca = l.find(x => /CACA/.test(x.t) && x.n === "bloqueo");
  assert.notEqual(caca, undefined, "portador x portador se sigue marcando");
  assert.equal(caca.r, "Anexo A.4", "con el artículo, que es lo que la junta necesita ver");
});

/* ------------------------------------------------------------
   La pantalla
   ------------------------------------------------------------ */
test("el simulador ya no dice «no autorizable»", () => {
  const v = lee("js/vistas/cria.js");
  assert.equal(/Cruce no autorizable/.test(v), false,
    "quien autoriza es la Junta Directiva; el simulador informa");
  assert.match(v, /Cruce autorizable y recomendado por el club/,
    "cuando los dos cumplen, ahí sí se moja");
});

test("pero el detalle de lo que falta se sigue enseñando entero", () => {
  const v = lee("js/vistas/cria.js");
  assert.match(v, /listaReq\(l\.map/, "la lista de requisitos, uno por uno");
  assert.match(v, /tarjetaConsanguinidad\(m, h\)/, "la consanguinidad prevista");
  assert.match(v, /Previsión genética de la camada/);
  assert.match(v, /qué le falta a cada uno/, "se dice qué falta, sin veredicto");
});

test("los ejemplares sin sexo anotado también se pueden elegir", () => {
  const v = lee("js/vistas/cria.js");
  assert.equal(/machos\.length \+ hembras\.length/.test(v), false,
    "sumar las dos listas contaba dos veces a los que no tienen sexo: 4.112 de 3.833");
  assert.match(v, /p\.sexo==="M" \|\| !p\.sexo/,
    "279 ejemplares del libro no traen el sexo: dejarlos fuera era dejarlos fuera del simulador");
  assert.match(v, /p\.sexo==="H" \|\| !p\.sexo/);
});

test("se puede dar de alta un reproductor sin salir del simulador", () => {
  const v = lee("js/vistas/cria.js");
  assert.match(v, /data-alta-cruce="m"/);
  assert.match(v, /data-alta-cruce="h"/);
  assert.match(v, /TRAS_ALTA\.fn = id => \{ cruceSel\[lado\] = id; ir\("cruce"\); \}/,
    "y se vuelve aquí con él puesto, no a su ficha");
  assert.match(v, /SESION\.rol!=="visitante"/,
    "un visitante no da de alta nada");
});

test("el alta vuelve a donde se pidió, y no se queda colgada si se cancela", () => {
  assert.match(lee("js/formularios-def.js"), /const TRAS_ALTA = \{ fn: null \}/);
  assert.match(lee("js/formularios-def.js"), /if \(seguir\) return seguir\(nid\)/);
  assert.match(lee("js/formularios.js"), /TRAS_ALTA\.fn = null/,
    "al cerrar sin guardar deja de valer: si no, se aplicaría al siguiente ejemplar");
});

/* ------------------------------------------------------------
   Las cajas empiezan vacías
   ------------------------------------------------------------ */
test("el simulador no elige reproductores por su cuenta", () => {
  const v = lee("js/vistas/cria.js");
  assert.equal(/cruceSel\.m = machos\[0\]/.test(v), false,
    "se rellenaban solas con el primer perro del libro por orden alfabético, " +
    "y el socio se encontraba un cruce hecho entre dos que no había elegido");
  assert.equal(/cruceSel\.h = hembras\[0\]/.test(v), false);
  assert.match(v, /let cruceSel = \{m:"", h:""\}/, "empiezan en blanco");
});

test("elegir no redibuja las cajas de escribir", () => {
  assert.match(lee("js/eventos.js"),
    /cruceMacho\s+= id => \{ cruceSel\.m = id; pintarPanelCruce\(\); \}/,
    "render() entero recreaba los input y el socio perdía el foco a mitad de palabra");
  assert.match(lee("js/vistas/cria.js"), /id="cruce-panel"/);
  assert.match(lee("js/vistas/cria.js"), /function panelDeCruce\(\)/);
});

/* ------------------------------------------------------------
   La camada es de quien tiene la madre
   ------------------------------------------------------------ */
test("sólo se ofrecen las hembras del socio como madre", () => {
  const f = lee("js/formularios-def.js");
  const bloque = f.slice(f.indexOf("  camada(){"), f.indexOf("  evento(id){"));
  assert.match(bloque, /const mias = buscaPerros\("H", true\)/);
  assert.match(bloque, /op:mias/, "la madre sale de sus hembras, no del libro entero");
  assert.match(bloque, /op:buscaPerros\("M"\)/, "el padre puede ser cualquiera del libro");
  assert.match(lee("js/formularios.js"), /p\.propietarioId === miSocioId\(\)/);
});

test("y si no tiene ninguna, se le dice en vez de dejarle rellenar el formulario", () => {
  const f = lee("js/formularios-def.js");
  const bloque = f.slice(f.indexOf("  camada(){"), f.indexOf("  evento(id){"));
  assert.match(bloque, /if\(!mias\.length && !SESION\.esAdmin\)/);
  assert.match(bloque, /no tienes ninguna hembra a tu nombre/);
});

test("se comprueba otra vez antes de guardar, y el panel no se cierra", () => {
  const f = lee("js/formularios-def.js");
  const bloque = f.slice(f.indexOf("  camada(){"), f.indexOf("  evento(id){"));
  assert.match(bloque, /h\.propietarioId !== miSocioId\(\)/);
  assert.match(bloque, /return false/, "se queda abierto para que corrija, sin perder lo escrito");
});

test("la base de datos lo exige también: la pantalla no es la que manda", () => {
  const sql = lee("db/migraciones/2026-09-07-camada-de-la-madre.sql");
  assert.match(sql, /with check \([\s\S]*propietario_de\(madre_id\) = mi_socio_id\(\)/,
    "para crear una camada, la madre tiene que ser tuya");
  assert.match(sql, /security definer/,
    "el socio puede no ver la ficha de la madre y la regla tiene que poder comprobarse");
  assert.match(sql, /using \([\s\S]*criador_id = mi_socio_id\(\)/,
    "pero una camada ya declarada no se queda huérfana si la perra cambia de manos");
  assert.match(lee("db/schema.sql"), /propietario_de\(madre_id\) = mi_socio_id\(\)/,
    "y el esquema del repositorio dice lo mismo que la base de datos");
});

/* ------------------------------------------------------------
   El pedigrí de la camada
   ------------------------------------------------------------ */
/* El cuerpo de una función suelta, sin lo que venga detrás */
function cuerpoDe(archivo, firma){
  const t = lee(archivo);
  const i = t.indexOf(firma);
  const j = t.indexOf("\n}\n", i);
  return t.slice(i, j > 0 ? j : undefined);
}
test("el simulador enseña el pedigrí de la camada, hasta ocho generaciones", () => {
  const v = lee("js/vistas/cria.js");
  assert.match(v, /function pedigriDelCruce\(m, h, opciones\)/);
  assert.match(v, /\$\{pedigriDelCruce\(m, h\)\}/, "se pinta en el panel");
  assert.match(v, /let genCruce = 8/, "arranca en ocho, que es lo que se pidió");
  assert.match(v, /\[4,5,6,8\]/, "y se puede bajar");
});

test("la primera columna son los dos reproductores, no los de uno solo", () => {
  const v = lee("js/vistas/cria.js");
  const b = v.slice(v.indexOf("function pedigriDelCruce"));
  assert.match(b, /let nivel = \[m\.id, h\.id\]/,
    "es el pedigrí que tendrían los cachorros, no el del macho ni el de la hembra");
  assert.match(b, /for \(let g = 2; g <= n; g\+\+\)/,
    "la primera generación ya está puesta");
});

test("marca los ancestros que salen por las dos ramas", () => {
  const b = lee("js/vistas/cria.js").slice(lee("js/vistas/cria.js").indexOf("function pedigriDelCruce"));
  assert.match(b, /filter\(\(\[, c\]\) => c > 1\)/, "los repetidos");
  assert.match(b, /porPeso\.slice\(0, 16\)/, "y los que más pesan, listados aparte");
});

test("dice cuánto pedigrí se conoce: los huecos son datos que faltan", () => {
  const b = lee("js/vistas/cria.js").slice(lee("js/vistas/cria.js").indexOf("function pedigriDelCruce"));
  assert.match(b, /Pedigrí conocido/);
  assert.match(b, /conocidas \/ casillas/,
    "a ocho generaciones caben 510 ancestros y casi ninguno los tiene todos");
});

test("usa el censo indexado, que son 510 casillas por pedigrí", () => {
  const b = cuerpoDe("js/vistas/cria.js", "function pedigriDelCruce");
  assert.match(b, /perroDe\(id\)/, "no un find lineal sobre los 3.833 por cada casilla");
  assert.equal(/byId\(C\("perros"\)/.test(b), false);
});

test("cambiar de profundidad no redibuja las cajas de escribir", () => {
  assert.match(lee("js/vistas/cria.js"),
    /genCruce = Number\(b\.getAttribute\("data-gen-cruce"\)\)[\s\S]{0,40}pintarPanelCruce\(\)/);
});

test("hay sitio en la hoja de estilo para seis, siete y ocho columnas", () => {
  const css = lee("css/estilo.css");
  for (const g of [6, 7, 8])
    assert.match(css, new RegExp(`\\.ped\\.g${g}\\{grid-template-columns:repeat\\(${g},1fr\\)`),
      `faltan las ${g} columnas: el pedigrí se pintaría amontonado`);
  assert.match(css, /\.ped\.g8 \.ped-n b\{font-size:9px/);
});

test("el pedigrí se abre por el centro, no por las ramas lejanas", () => {
  const v = lee("js/vistas/cria.js");
  assert.match(v, /function centrarPedigriDelCruce\(\)/);
  assert.match(v, /scrollTop = Math\.max\(0, \(caja\.scrollHeight - caja\.clientHeight\) \/ 2\)/,
    "a ocho generaciones el árbol mide miles de píxeles y el tronco queda en el medio");
  /* Los tres caminos por los que se llega a verlo */
  assert.match(v, /setTimeout\(centrarPedigriDelCruce, 0\)/, "al entrar en la pantalla");
  assert.match(v, /caja\.innerHTML = panelDeCruce\(\);\s*\n\s*centrarPedigriDelCruce\(\);/,
    "al elegir un reproductor");
  assert.match(v, /pintarPanelCruce\(\);\s*\n\s*centrarPedigriDelCruce\(\);/,
    "y al cambiar de profundidad");
});

/* ------------------------------------------------------------
   Que no se coma la pantalla, y que se pueda sacar de ahí
   ------------------------------------------------------------ */
test("el pedigrí se queda en su marco y no ensancha la página", () => {
  const css = lee("css/estilo.css");
  assert.match(css, /\.cols23 > \*\{min-width:0\}/,
    "sin esto, una columna de grid no encoge por debajo de su contenido " +
    "y el pedigrí empuja fuera de la pantalla el resto del simulador");
  assert.match(css, /\.ped-caja\{overflow:auto/);
  assert.match(css, /max-height:min\(72vh,620px\)/);
});

test("se mueve arrastrándolo, y arrastrar no abre la ficha de debajo", () => {
  const v = lee("js/vistas/cria.js");
  assert.match(v, /closest\("\.ped-caja"\)/);
  assert.match(v, /caja\.scrollLeft = arrastre\.sx - dx/);
  assert.match(v, /function tragarUnClic/,
    "si no, soltar el ratón encima de un ancestro navegaba a su ficha");
  assert.match(css_ok(), /\.ped-caja\.agarrando \.ped-n\{pointer-events:none\}/);
  function css_ok(){ return lee("css/estilo.css"); }
});

test("tiene su propia página, con los mismos permisos y fuera del menú", () => {
  const app = lee("js/app.js");
  assert.match(app, /\{r:"pedigri",  n:"Pedigrí de la camada", v:\["admin","socio"\], oculta:true\}/,
    "sin declararla, render() no encontraría su definición y quedaría abierta a cualquiera");
  assert.match(app, /if \(v\.oculta\) return;/, "existe, pero no se anuncia en el menú");
  assert.match(lee("js/vistas/cria.js"), /V\.pedigri = function\(par\)/);
});

test("se guarda en PDF imprimiendo, apaisado y con el árbol entero", () => {
  const v = lee("js/vistas/cria.js");
  assert.match(v, /data-pedigri-pdf/);
  assert.match(v, /window\.print\(\)/);
  const css = lee("css/estilo.css");
  assert.match(css, /@page\{size:A4 landscape/);
  assert.match(css, /\.ped-caja\{overflow:visible!important;max-height:none!important/,
    "en papel no hay barras que arrastrar: se imprime entero");
});

test("y se exporta con los 510 ancestros por generación", () => {
  const b = cuerpoDe("js/vistas/cria.js", "function exportarPedigriDelCruce");
  assert.match(b, /t:"Generación"/);
  assert.match(b, /t:"Vía"/, "por dónde se llega a cada ancestro");
  assert.match(b, /t:"LOE"/);
  assert.match(b, /generarCSV\(cols, filas\)/);
});

/* ------------------------------------------------------------
   Las líneas que unen los casilleros
   ------------------------------------------------------------ */
test("cada casilla va dentro de su banda: de ahí salen las líneas", () => {
  for (const f of ["js/vistas/cria.js", "js/vistas/perros.js"])
    assert.match(lee(f), /<div class="ped-celda">/,
      `${f}: sin la banda no hay dónde anclar las líneas`);
});

test("las líneas se trazan con la geometría del pedigrí, sin medir nada", () => {
  const css = lee("css/estilo.css");
  assert.match(css, /\.ped-celda\{flex:1;display:flex;align-items:center;position:relative/,
    "la banda reparte el alto por igual, que es lo que hace que las líneas casen");
  assert.match(css, /\.ped-col:not\(:first-child\) \.ped-celda::before/, "el tramo horizontal");
  assert.match(css, /\.ped-col:not\(:first-child\) \.ped-celda::after/, "el tramo vertical");
  assert.match(css, /:nth-child\(odd\)::after\{top:50%\}/, "el primero de la pareja baja");
  assert.match(css, /:nth-child\(even\)::after\{bottom:50%\}/, "y el segundo sube");
  assert.match(css, /height:50%/, "media banda es justo lo que hay hasta el centro del padre");
});

test("el pedigrí de la ficha del perro también lleva líneas y nombre entero", () => {
  const b = cuerpoDe("js/vistas/perros.js", "  const casilla = id =>");
  assert.match(b, /ped-celda/);
  assert.match(b, /esc\(nombrePerro\(d\)\)/, "y no d.nombre a secas");
});
