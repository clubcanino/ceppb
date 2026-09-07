/* ============================================================
   La Especial Nacional de Cría 2025 de Igea, catálogo en mano.

   Esto es belleza y SÍ cuenta: el Anexo A pide calificaciones de
   EXC en evento del CEPPB para las figuras ACE, ACES y ACSS. Por
   eso importa que nada se cuele mal: una calificación de más es
   un apto de cría que no toca.

   El catálogo lo rellena una persona el día de la exposición, y
   viene con la fecha de nacimiento escrita de cinco maneras.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cargar } from "./cargar.mjs";

const { R } = cargar(["js/util.js", "js/reglamento.js"], ["R"]);
const d = JSON.parse(readFileSync(new URL("../db/importaciones/monografica.json", import.meta.url), "utf8"));
const sql = readFileSync(new URL("../db/importaciones/monografica.sql", import.meta.url), "utf8");

test("los treinta ejemplares del catálogo, con su calificación", () => {
  assert.equal(d.ejemplares.length, 30);
  assert.equal(d.resultados.length, 30);
  assert.equal((sql.match(/::uuid, 'estructura', /g) || []).length, 30);
});

test("las fechas de nacimiento se leen escritas como se escriban", () => {
  /* «1.01.2025», «19.04.24», «: 01.10.2022», «17-06.23», «: 2.03,2024» */
  const sinFecha = d.ejemplares.filter(e => !e.fecha_nacimiento);
  assert.equal(sinFecha.length, 0, "sin leer: " + sinFecha.map(e => e.nombre).join(", "));
  for (const e of d.ejemplares)
    assert.match(e.fecha_nacimiento, /^\d{4}-\d{2}-\d{2}$/, e.nombre);
});

test("el título de campeón no se queda pegado al nombre del perro", () => {
  /* «CHE.THOR DE ANCANO» es Thor de Ancano, campeón de España. */
  for (const e of d.ejemplares){
    assert.equal(/^CHE\.?/i.test(e.nombre), false, e.nombre);
    assert.equal(e.nombre, e.nombre.trim());
  }
  assert.ok(d.ejemplares.some(e => e.campeon === "CHE"), "alguno era campeón");
  assert.ok(d.ejemplares.some(e => e.nombre === "Thor de Ancano"));
});

test("«MP» no se convierte en una calificación del club", () => {
  /* Muy Prometedor es de las clases de cachorro. Traducirlo a MB
     regalaría calificaciones que valen para el apto de cría. */
  const mp = d.resultados.filter(r => r.calificacion_origen === "MP");
  assert.ok(mp.length > 0, "el catálogo trae cachorros");
  for (const r of mp) assert.equal(r.calificacion, null);
});

test("cada calificación traducida está en la escala del club", () => {
  const escala = ["EXC", "MB", "B", "SUF", "NR", "DESC", null];
  for (const r of d.resultados) assert.ok(escala.includes(r.calificacion), r.calificacion);
});

test("la distinción que se guarda es la que puntúa en el Cap. 7", () => {
  const validas = ["CAC", "CACIB", "RCAC", "RCACIB", "CCPB", "RCCPB", "Rappel CAC", "BOB", null];
  for (const r of d.resultados) assert.ok(validas.includes(r.distincion), String(r.distincion));
  /* Mejor de Raza es el BOB del baremo, y suma dos puntos */
  const mr = d.resultados.filter(r => (r.distinciones || []).includes("BOB"));
  assert.ok(mr.length >= 1, "alguien fue Mejor de Raza");
  assert.equal(R.puntosResultado({calificacion:"EXC", puesto:1, distincion:"BOB"}, "ra"), 10);
  assert.equal(R.puntosResultado({calificacion:"EXC", puesto:1, distincion:"CAC"}, "ra"), 12);
});

test("los certificados de clase no se cuelan como distinción", () => {
  /* CCJ, CCV, MJ, MV… son de su clase, no del baremo. Si entraran
     como distinción sumarían puntos que no les corresponden. */
  const clase = ["CCJ", "RCCJ", "CCV", "RCCV", "MMC", "MMG", "MJ", "MC", "MV"];
  for (const r of d.resultados){
    for (const c of clase) assert.notEqual(r.distincion, c);
    if (r.titulo) for (const t of r.titulo.split(" · ")) assert.ok(clase.includes(t), t);
  }
});

test("es un evento del club: cuenta para las figuras del Anexo A", () => {
  assert.equal(d.evento.organizado_ceppb, true);
  assert.match(sql, /organizado_ceppb = true/);
  assert.match(sql, /::uuid, 'estructura', [^\n]*, true, /);
});

test("una EXC del club vale para las figuras; una de fuera, sola, no", () => {
  const base = {tipo:"estructura", calificacion:"EXC", fecha:"2025-06-01",
                validado:"validado"};   // sin validar no cuenta nada
  const rs = n => R.res("p1", Array.from({length:n.total}, (_, i) => Object.assign(
    {perroId:"p1", id:"r"+i}, base, {organizadoCEPPB: i < n.ceppb})));
  const req = {min:"EXC", n:2, ceppb:true};
  assert.equal(R.estructura(rs({total:2, ceppb:1}), req).e, "ok");
  assert.equal(R.estructura(rs({total:2, ceppb:0}), req).e, "falta");
});

test("el volcado se puede repetir sin duplicar nada", () => {
  const ids = [...sql.matchAll(/\('([0-9a-f-]{36})'::uuid, '[0-9a-f-]{36}'::uuid, 'estructura'/g)]
    .map(m => m[1]);
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
  assert.match(sql, /on conflict \(id\) do update set/);
});

test("la fecha y el tipo salen del calendario del club, no del catálogo", () => {
  /* En Igea, en 2025, el club no celebró más que un evento: la
     Especial Nacional de Cría del 8 de noviembre. */
  assert.equal(d.evento.fecha, "2025-11-08");
  assert.equal(d.evento.tipo, "Especial de Cría");
});

test("una Especial de Cría puntúa un 50 % más (Cap. 7)", () => {
  /* Si el tipo se hubiera quedado en «Concurso monográfico», cada
     ejemplar habría perdido un tercio de sus puntos en el baremo. */
  const cac = {calificacion:"EXC", puesto:1, distincion:"CAC"};
  assert.equal(R.puntosResultado(cac, "ra"), 12);
  assert.equal(R.puntosResultado(Object.assign({tipoEvento:"Especial de Cría"}, cac), "ra"), 18);
});

test("el evento que se importó con el nombre equivocado se borra", () => {
  assert.match(sql, /delete from resultados where evento_id/);
  assert.match(sql, /delete from eventos where id/);
  /* y el borrado va antes de volver a insertar */
  assert.ok(sql.indexOf("delete from eventos") < sql.indexOf("insert into eventos"));
});

test("con la fecha, el reglamento ya puede medir la edad", () => {
  /* La figura ACSS exige dos EXC con 18 meses cumplidos. Sin fecha
     del evento no se podía comprobar y no contaba ninguna. */
  const cal = (fecha) => ({tipo:"estructura", calificacion:"EXC", fecha,
                           organizadoCEPPB:true, validado:"validado", perroId:"p1"});
  const rs = R.res("p1", [cal("2025-11-08"), cal("2025-11-08")]);
  const req = {min:"EXC", n:2, ceppb:true, edadMin:18};
  assert.equal(R.estructura(rs, req, "2020-01-01").e, "ok", "un adulto sí cumple");
  assert.equal(R.estructura(rs, req, "2025-01-01").e, "falta", "un cachorro de 10 meses no");
});
