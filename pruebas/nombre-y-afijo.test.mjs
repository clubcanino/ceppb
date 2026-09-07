/* ============================================================
   El nombre registrado de un ejemplar lleva su afijo.

   En el pedigrí pone «Ninfa de Supercan», no «Ninfa». Y así están
   los 3.833 del libro: el afijo va dentro del nombre. El campo
   `afijo` es un dato aparte —de qué criadero es— y no una mitad
   del nombre que haya que ir juntando por ahí.

   Lo que se prueba: que el nombre sale entero en todas partes, y
   que no se duplica el afijo cuando el nombre ya lo trae.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { cargar } from "./cargar.mjs";

const lee = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const { nombrePerro } = cargar(["js/util.js"], ["nombrePerro"]);

test("el nombre y el afijo van juntos", () => {
  assert.equal(nombrePerro({ nombre: "Gas", afijo: "de Azarbe" }), "Gas de Azarbe");
});

test("si el nombre ya trae el afijo, no se repite", () => {
  assert.equal(
    nombrePerro({ nombre: "LORAZEPAM DE SCOFOS", afijo: "DE SCOFOS" }),
    "LORAZEPAM DE SCOFOS",
    "así están los 3.833 del libro: el afijo dentro del nombre y también en su columna");
  assert.equal(
    nombrePerro({ nombre: "Ninfa de Supercan", afijo: "de Supercan" }),
    "Ninfa de Supercan");
});

test("tampoco cuando el afijo va delante", () => {
  assert.equal(
    nombrePerro({ nombre: "Del Clamiu Quelia", afijo: "del Clamiu" }),
    "Del Clamiu Quelia");
});

test("no importan mayúsculas ni acentos al comprobar si ya está", () => {
  assert.equal(
    nombrePerro({ nombre: "Ron des Deux Sabrés", afijo: "DES DEUX SABRES" }),
    "Ron des Deux Sabrés",
    "«Sabrés» y «SABRES» son lo mismo: no se pega dos veces");
});

test("sin afijo, el nombre a secas", () => {
  assert.equal(nombrePerro({ nombre: "Río" }), "Río");
  assert.equal(nombrePerro({ nombre: "Sirius", afijo: "" }), "Sirius");
  assert.equal(nombrePerro({ nombre: "  Alan  " }), "Alan", "sin espacios de más");
});

test("con una ficha vacía no revienta", () => {
  assert.equal(nombrePerro(null), "");
  assert.equal(nombrePerro({}), "");
  assert.equal(nombrePerro({ afijo: "de Azarbe" }), "de Azarbe");
});

/* ------------------------------------------------------------
   Y se usa donde se pinta un perro
   ------------------------------------------------------------ */
const DONDE = [
  ["js/formularios.js",            /nombrePerro\(p\) \+ \(p\.variedad/,  "los buscadores de ficha"],
  ["js/formularios.js",            /\$\{nombrePerro\(p\)\}\$\{p\.variedad/, "los desplegables"],
  ["js/vistas/cria.js",            /nombrePerro\(p\) \+ \(p\.variedad/,  "el simulador de cruce"],
  ["js/vistas/perros.js",          /esc\(nombrePerro\(p\)\)/,            "la tabla de ejemplares"],
  ["js/vistas/socios.js",          /esc\(nombrePerro\(p\)\)/,            "los perros del socio"],
  ["js/vistas/camadas-eventos.js", /esc\(nombrePerro\(p\)\)/,            "los resultados"],
  ["js/vistas/mi-area.js",         /esc\(nombrePerro\(p\)\)/,            "mi área"],
  ["js/componentes.js",            /titulo: nombrePerro\(p\)/,           "el buscador de arriba"],
  ["js/exportar.js",               /nombrePerro\(p\)/,                   "la exportación a Excel"],
  ["js/genealogia.js",             /nombrePerro\(p\)/,                   "el pedigrí"],
  ["js/reglamento.js",             /nombrePerro\(p\)/,                   "el motor del reglamento"],
  ["js/cotejo.js",                 /esc\(nombrePerro\(c\)\)/,             "el cotejo de repetidos"],
  ["js/vistas/certificado.js",     /nombrePerro\(p\)/,                   "el certificado del club"],
  ["js/vistas/muro.js",            /nombrePerro\(p\)/,                   "las novedades"],
];

test("nadie junta el nombre y el afijo por su cuenta", () => {
  for (const f of ["js/cotejo.js", "js/vistas/certificado.js", "js/vistas/muro.js",
                   "js/vistas/perros.js", "js/vistas/socios.js"])
    assert.equal(/\[p?c?\.nombre, p?c?\.afijo\]\.filter/.test(lee(f)), false,
      `${f}: pegarlos a mano duplica el afijo, que ya va dentro del nombre`);
});

for (const [archivo, patron, sitio] of DONDE)
  test(`el nombre sale entero en ${sitio}`, () => {
    assert.match(lee(archivo), patron);
  });

test("los padres y abuelos del alta se ofrecen con su afijo", () => {
  const f = lee("js/formularios-def.js");
  assert.match(f, /\.map\(nombrePerro\)/, "las sugerencias");
  assert.match(f, /return p \? nombrePerro\(p\) : ""/, "y lo que se rellena al editar");
});

test("y al guardarlos se reconoce al que ya está, escrito de cualquiera de las dos formas", () => {
  assert.match(lee("js/formularios-def.js"),
    /norm\(p\.nombre \|\| ""\) === buscado \|\| norm\(nombrePerro\(p\)\) === buscado/,
    "si no, editar una ficha y volver a guardarla daría de alta un padre repetido");
});

test("el formulario pide el nombre entero, no partido", () => {
  const f = lee("js/formularios-def.js");
  assert.equal(/Sin el afijo: ese va en el campo de al lado/.test(f), false,
    "pedirlo partido creaba fichas que no casaban con las 3.833 que ya hay");
  assert.match(f, /Entero, tal como figura en el pedigrí, con su afijo/);
});

test("el enlace a working-dog sigue usando el nombre tal cual", () => {
  assert.match(lee("js/util.js"),
    /const nombre = String\(\(perro && perro\.nombre\) \|\| ""\)/,
    "la dirección de working-dog se forma con el nombre de su ficha, no con el nuestro");
});

/* ------------------------------------------------------------
   El cotejo de repetidos, con el nombre partido o entero
   ------------------------------------------------------------ */
test("el cotejo busca las dos formas contra las dos formas", () => {
  const sql = lee("db/migraciones/2026-09-07-ejemplar-repetido.sql");
  assert.match(sql, /llano\(p\.nombre\) in \(b\.n, b\.na\)/);
  assert.match(sql, /llano\(coalesce\(p\.nombre,''\) \|\| coalesce\(p\.afijo,''\)\) in \(b\.n, b\.na\)/,
    "«Lorazepam» + «de Scofos» tiene que encontrar a «LORAZEPAM DE SCOFOS»");
});

test("el afijo se deduce de lo que comparten varios, no de uno suelto", () => {
  const sql = lee("db/migraciones/2026-09-07-afijos-deducidos.sql");
  assert.match(sql, /c\.cuantos >= 2/,
    "un final que sólo tiene un perro podría ser parte de su nombre");
  assert.match(sql, /generate_series\(2, array_length/,
    "siempre queda al menos una palabra de nombre propio delante");
  assert.match(sql, /p\.afijo is null or btrim\(p\.afijo\) = ''/,
    "no se pisa un afijo ya anotado");
  assert.equal(/set nombre/.test(sql), false,
    "no se toca ningún nombre: sólo se rellena una columna que estaba vacía");
});
