/* ============================================================
   Las actas de campeonato: CEPPB 2021-2025 y FMBB 2022-2026.

   727 participaciones de 469 ejemplares volcadas desde el Excel
   del club. Lo que se comprueba aquí es que ese volcado no altere
   nada de lo que ya funcionaba —un puesto en un campeonato no es
   un título de trabajo ni suma en el baremo de belleza— y que las
   dos competiciones no se confundan entre sí: el mundial no lo
   organiza el club y puntúa sobre 500, no sobre 300.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cargar } from "./cargar.mjs";

const { R, COLUMNAS } = cargar(
  ["js/util.js", "js/reglamento.js", "js/columnas.js"], ["R", "COLUMNAS"]);

const sql = readFileSync(new URL("../db/importaciones/participaciones.sql", import.meta.url), "utf8");

/* ---------- el volcado ---------- */
test("el volcado trae los diez campeonatos y las 727 participaciones", () => {
  assert.equal((sql.match(/insert into eventos /g) || []).length, 10);
  assert.equal((sql.match(/::uuid, 'trabajo', /g) || []).length, 727);
});

test("el mundial no cuenta como evento organizado por el club", () => {
  const eventos = [...sql.matchAll(/values \('[0-9a-f-]{36}'::uuid, '([^']+)', 'trabajo', (true|false)\)/g)];
  assert.equal(eventos.length, 10);
  for (const [, nombre, propio] of eventos){
    const esFMBB = /FMBB/.test(nombre);
    assert.equal(propio, esFMBB ? "false" : "true",
      `${nombre} debería estar marcado como ${esFMBB ? "ajeno" : "propio"}`);
  }
});

test("cada resultado dice sobre cuánto va su puntuación", () => {
  /* 463 puntos en el mundial y 290 en el nacional no son comparables:
     el mundial suma dos jornadas. */
  const filas = [...sql.matchAll(/'IGP', (true|false), (?:null|\d+), (?:null|\d+), (300|500),/g)];
  assert.equal(filas.length, 727);
  for (const [, propio, sobre] of filas)
    assert.equal(sobre, propio === "true" ? "300" : "500");
});

test("los cinco campeonatos del club conservan su identificador", () => {
  /* Se importaron antes con el sufijo «(CEPPB)» en el nombre. Si el
     identificador cambiara, reimportar duplicaría las 197 actas en
     lugar de actualizarlas. */
  for (const id of ["169b7a8a-980f-5770-97ee-97b0d194402d",   // XXII CNI 2021
                    "4b7c7d0b-ba33-5227-90bc-c1caf4c21d7a",   // XXIII CNI 2022
                    "d274e6d7-c7b9-5fc0-a94a-1163dec2f0c5",   // XXIV CNI 2023
                    "fc30d24c-0c12-5160-b90e-399669730b62",   // Nacional 2024
                    "6b64d39a-2104-58f6-9437-8b05318d068d"])  // C.N.I. 2025
    assert.ok(sql.includes(id), "ha cambiado el identificador de un campeonato ya importado");
});

test("cada participación tiene identificador propio: reimportar no duplica", () => {
  const ids = [...sql.matchAll(/\('([0-9a-f-]{36})'::uuid, '[0-9a-f-]{36}'::uuid, 'trabajo'/g)]
    .map(m => m[1]);
  assert.equal(ids.length, 727);
  assert.equal(new Set(ids).size, 727);
});

test("el trigger de validación se aparta y se vuelve a poner", () => {
  assert.ok(sql.includes("disable trigger trg_proteger_resultado"));
  assert.ok(sql.includes("enable trigger trg_proteger_resultado"));
  assert.ok(sql.indexOf("disable trigger") < sql.indexOf("enable trigger"));
});

test("una nota de fase del mundial no se disfraza de calificación del club", () => {
  /* En el mundial la casilla trae a veces la puntuación de una jornada
     (93, 85,5) en vez de una letra. Eso no es una calificación de la
     escala del club: se guarda tal cual y la del club queda vacía.
     Traducirla a ojo sería inventarla. */
  const pares = [...sql.matchAll(/(null|'[A-Z]+'), '([^']*)', /g)]
    .filter(p => /^(null|'(EXC|MB|B|SUF|NR|DESC)')$/.test(p[1]));
  const numericas = pares.filter(p => /^[\d,.]+$/.test(p[2]));
  assert.ok(numericas.length > 100, "el mundial debería traer notas numéricas");
  for (const p of numericas)
    assert.equal(p[1], "null", `la nota ${p[2]} no puede convertirse en ${p[1]}`);
});

test("la escala alemana se traduce a la del club, no al revés", () => {
  /* La trampa: la «G» alemana (Gut) es el «B» del club, y la «B»
     alemana (Befriedigend) es nuestro «SUF». Confundirlas ascendería
     de golpe a 101 perros. */
  const de = o => [...sql.matchAll(new RegExp(`'([A-Z]+)', '${o}', `, "g"))].map(m => m[1]);
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
  for (const c of ["puntos", "guia", "anio", "calificacion_origen", "puntos_sobre"])
    assert.ok(COLUMNAS.resultados.includes(c), `falta ${c} en COLUMNAS.resultados`);
});
