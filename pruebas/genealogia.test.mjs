/* ============================================================
   Genealogía: consanguinidad, profundidad y ancestros comunes.

   Los valores no son opinión: el coeficiente de consanguinidad de
   Wright da resultados conocidos que cualquier criador reconoce.
   Padre × hija, 25 %. Hermanos completos, 25 %. Medio hermanos,
   12,5 %. Primos hermanos, 6,25 %. Si estas cifras no salen, el
   cálculo está mal y el club estaría recomendando cruces con datos
   falsos.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { cargar } from "./cargar.mjs";

const G = cargar(["js/util.js", "js/genealogia.js"],
                 ["consanguinidad", "consanguinidadPrevista", "parentesco",
                  "profundidadPedigri", "completitudPedigri", "ancestrosComunes",
                  "ponerCenso"]);

/* Un pedigrí se escribe como {id: [padre, madre]} */
function censo(arbol){
  const perros = Object.entries(arbol).map(([id, [padreId, madreId]]) => ({
    id, nombre: id, padreId: padreId || null, madreId: madreId || null,
  }));
  G.ponerCenso(perros);
  return perros;
}

const pct = x => Math.round(x * 10000) / 100;   // a porcentaje con dos decimales

/* ============================================================
   Casos que todo criador reconoce
   ============================================================ */

test("sin ancestros conocidos, la consanguinidad es cero", () => {
  censo({ padre: [null, null], madre: [null, null] });
  assert.equal(G.consanguinidadPrevista("padre", "madre"), 0);
});

test("padre × hija: 25 %", () => {
  censo({
    abuelo: [null, null], abuela: [null, null],
    hija:   ["abuelo", "abuela"],
  });
  assert.equal(pct(G.consanguinidadPrevista("abuelo", "hija")), 25);
});

test("madre × hijo: 25 %", () => {
  censo({
    padre: [null, null], madre: [null, null],
    hijo:  ["padre", "madre"],
  });
  assert.equal(pct(G.consanguinidadPrevista("hijo", "madre")), 25);
});

test("hermanos completos: 25 %", () => {
  censo({
    padre: [null, null], madre: [null, null],
    h1: ["padre", "madre"], h2: ["padre", "madre"],
  });
  assert.equal(pct(G.consanguinidadPrevista("h1", "h2")), 25);
});

test("medio hermanos (mismo padre): 12,5 %", () => {
  censo({
    padre: [null, null], madre1: [null, null], madre2: [null, null],
    h1: ["padre", "madre1"], h2: ["padre", "madre2"],
  });
  assert.equal(pct(G.consanguinidadPrevista("h1", "h2")), 12.5);
});

test("primos hermanos: 6,25 %", () => {
  censo({
    abuelo: [null, null], abuela: [null, null],
    tio: ["abuelo", "abuela"], padre: ["abuelo", "abuela"],
    m1: [null, null], m2: [null, null],
    primo1: ["tio", "m1"], primo2: ["padre", "m2"],
  });
  assert.equal(pct(G.consanguinidadPrevista("primo1", "primo2")), 6.25);
});

test("abuelo × nieta: 12,5 %", () => {
  censo({
    abuelo: [null, null], abuela: [null, null],
    hijo: ["abuelo", "abuela"], nuera: [null, null],
    nieta: ["hijo", "nuera"],
  });
  assert.equal(pct(G.consanguinidadPrevista("abuelo", "nieta")), 12.5);
});

test("tío × sobrina: 12,5 %", () => {
  censo({
    ab1: [null, null], ab2: [null, null],
    tio: ["ab1", "ab2"], padre: ["ab1", "ab2"],
    madre: [null, null], sobrina: ["padre", "madre"],
  });
  assert.equal(pct(G.consanguinidadPrevista("tio", "sobrina")), 12.5);
});

test("dos perros sin parentesco: cero", () => {
  censo({
    a1: [null, null], a2: [null, null], b1: [null, null], b2: [null, null],
    uno: ["a1", "a2"], otro: ["b1", "b2"],
  });
  assert.equal(G.consanguinidadPrevista("uno", "otro"), 0);
});

/* ============================================================
   Con ancestros ya consanguíneos, la cifra sube
   ============================================================ */
test("si los padres ya venían emparentados, la cifra sube por encima del 25 %", () => {
  /* Hermanos completos cuyos padres eran a su vez hermanos */
  censo({
    p0: [null, null], m0: [null, null],
    padre: ["p0", "m0"], madre: ["p0", "m0"],
    h1: ["padre", "madre"], h2: ["padre", "madre"],
  });
  const f = G.consanguinidadPrevista("h1", "h2");
  assert.ok(f > 0.25, `debería pasar del 25 %, ha salido ${pct(f)} %`);
  assert.equal(pct(f), 37.5);
});

test("la consanguinidad de un ejemplar es la de la alianza que lo produjo", () => {
  censo({
    padre: [null, null], madre: [null, null],
    h1: ["padre", "madre"], h2: ["padre", "madre"],
    cachorro: ["h1", "h2"],
  });
  assert.equal(pct(G.consanguinidad("cachorro")), 25);
  assert.equal(G.consanguinidad("padre"), 0);
});

/* ============================================================
   Profundidad y qué parte del pedigrí conocemos
   ============================================================ */
test("un perro sin padres registrados tiene profundidad cero", () => {
  censo({ solo: [null, null] });
  assert.equal(G.profundidadPedigri("solo"), 0);
});

test("con padres, una generación; con abuelos, dos", () => {
  censo({
    bisabuelo: [null, null], bisabuela: [null, null],
    abuelo: ["bisabuelo", "bisabuela"], abuela: [null, null],
    padre: ["abuelo", "abuela"], madre: [null, null],
    perro: ["padre", "madre"],
  });
  assert.equal(G.profundidadPedigri("perro"), 3,
    "bisabuelos por una rama: tres generaciones");
});

test("cuánto del pedigrí conocemos, en porcentaje", () => {
  censo({
    padre: [null, null], madre: [null, null],
    perro: ["padre", "madre"],
  });
  /* De 3 generaciones caben 2 + 4 + 8 = 14 ancestros; conocemos 2 */
  assert.equal(G.completitudPedigri("perro", 3), 2 / 14);

  censo({ huerfano: [null, null] });
  assert.equal(G.completitudPedigri("huerfano", 3), 0);
});

/* ============================================================
   Quién aporta la consanguinidad
   ============================================================ */
test("dice qué ancestros son los comunes y cuánto aporta cada uno", () => {
  censo({
    padre: [null, null], madre: [null, null],
    h1: ["padre", "madre"], h2: ["padre", "madre"],
  });
  /* Los objetos vienen del contexto de pruebas: se comparan como texto */
  const comunes = JSON.parse(JSON.stringify(G.ancestrosComunes("h1", "h2")));
  const ids = comunes.map(c => c.id).sort().join(",");
  assert.equal(ids, "madre,padre",
    "los dos padres compartidos son los ancestros comunes");
  const suma = comunes.reduce((t, c) => t + c.aporta, 0);
  assert.equal(pct(suma), 25, "lo que aportan tiene que sumar la consanguinidad total");
});

test("un pedigrí en bucle no cuelga la plataforma", () => {
  /* Un dato mal metido puede crear un ciclo: un perro como su propio
     abuelo. No debe dejar la pantalla colgada. */
  G.ponerCenso([
    {id:"a", padreId:"b", madreId:null},
    {id:"b", padreId:"a", madreId:null},
  ]);
  const f = G.consanguinidad("a");
  assert.ok(Number.isFinite(f), "tiene que devolver un número, no colgarse");
});
