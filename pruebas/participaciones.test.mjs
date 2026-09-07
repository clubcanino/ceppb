/* ============================================================
   Las actas de los Campeonatos Nacionales de IGP 2021-2025.

   Son 197 participaciones de 110 ejemplares volcadas desde el
   Excel del club. Lo que se comprueba aquí es que ese volcado
   no altere nada de lo que ya funcionaba: un puesto en un
   campeonato no es un título de trabajo ni suma en el baremo
   de belleza, por muy buena que sea la calificación.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cargar } from "./cargar.mjs";

const { R, COLUMNAS } = cargar(
  ["js/util.js", "js/reglamento.js", "js/columnas.js"], ["R", "COLUMNAS"]);

const sql = readFileSync(new URL("../db/importaciones/participaciones.sql", import.meta.url), "utf8");

/* ---------- el volcado ---------- */
test("el volcado trae los cinco campeonatos y las 197 participaciones", () => {
  assert.equal((sql.match(/insert into eventos /g) || []).length, 5);
  assert.equal((sql.match(/::uuid, 'trabajo', /g) || []).length, 197);
});

test("cada participación tiene identificador propio: reimportar no duplica", () => {
  const ids = [...sql.matchAll(/\('([0-9a-f-]{36})'::uuid, '[0-9a-f-]{36}'::uuid, 'trabajo'/g)]
    .map(m => m[1]);
  assert.equal(ids.length, 197);
  assert.equal(new Set(ids).size, 197);
});

test("el trigger de validación se aparta y se vuelve a poner", () => {
  assert.ok(sql.includes("disable trigger trg_proteger_resultado"));
  assert.ok(sql.includes("enable trigger trg_proteger_resultado"));
  assert.ok(sql.indexOf("disable trigger") < sql.indexOf("enable trigger"));
});

test("ninguna participación se queda sin calificación traducida", () => {
  const pares = [...sql.matchAll(/'IGP', true, [^,]+, [^,]+, (null|'[A-Z]+'), '([^']*)'/g)];
  assert.equal(pares.length, 197);
  assert.equal(pares.filter(p => p[1] === "null").length, 0);
});

test("la escala alemana se traduce a la del club, no al revés", () => {
  /* La trampa: la «G» alemana (Gut) es el «B» del club, y la «B»
     alemana (Befriedigend) es nuestro «SUF». Confundirlas ascendería
     de golpe a 101 perros. */
  const de = o => [...sql.matchAll(new RegExp(`'([A-Z]+)', '${o}'`, "g"))].map(m => m[1]);
  assert.deepEqual([...new Set(de("G"))], ["B"]);
  assert.deepEqual([...new Set(de("B"))], ["SUF"]);
  assert.deepEqual([...new Set(de("SG"))], ["MB"]);
  assert.deepEqual([...new Set(de("EX"))], ["EXC"]);
  assert.deepEqual([...new Set(de("Dis\\."))], ["DESC"]);
});

/* ---------- que no contaminen el reglamento ---------- */
const perro = {
  id: "p1", nombre: "Prueba", variedad: "Malinois", sexo: "M",
  fechaNacimiento: "2020-01-01", adnEjemplar: true,
  salud: { hd:"A", ed:"0", lvt:"libre",
    genes:{CACA:"libre",CJM:"libre",SDCA1:"libre",SDCA2:"libre"},
    validacion:{estado:"validado"} },
};
const acta = {
  perroId: "p1", tipo: "trabajo", evento: "XXII CNI 2021 (CEPPB)", anio: 2021,
  tipoEvento: "IGP", organizadoCEPPB: true, puesto: 1, puntos: 290,
  calificacion: "EXC", calificacionOrigen: "EX", guia: "Un guía",
  validado: "validado",
};

test("un primer puesto con 290 puntos no otorga título de trabajo", () => {
  const rs = R.res("p1", [acta]);
  assert.equal(R.tieneTrabajo(rs, ["IGP3", "MR3"]), false);
  assert.ok(!R.mejorTrabajo(rs), "un acta sin título no debe acreditar ninguno");
});

test("un acta de trabajo no suma en el baremo de belleza", () => {
  assert.equal(R.puntuacion("p1", [acta], "granch").total, 0);
  assert.equal(R.puntuacion("p1", [acta], "ra").total, 0);
});

test("las figuras de utilidad siguen exigiendo el título, no el puesto", () => {
  const figs = R.figurasDe(perro, [acta]);
  for (const f of figs.filter(x => x.fig.trabajo)) assert.equal(f.cumple, false);
});

/* ---------- la capa de datos ---------- */
test("las columnas del acta viajan a la base de datos", () => {
  for (const c of ["puntos", "guia", "anio", "calificacion_origen"])
    assert.ok(COLUMNAS.resultados.includes(c), `falta ${c} en COLUMNAS.resultados`);
});
