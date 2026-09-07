/* ============================================================
   El calendario del club, sin duplicados.

   Dos formas de duplicar y hay que evitar las dos: el mismo
   concurso figura en la web una vez por tarifa de inscripción, y
   cuatro de ellos ya estaban en el libro con el nombre que les da
   working-dog.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const web = JSON.parse(readFileSync(new URL("../datos/eventos-web-ceppb.json", import.meta.url), "utf8"));
const d = JSON.parse(readFileSync(new URL("../db/importaciones/eventos-web.json", import.meta.url), "utf8"));
const sql = readFileSync(new URL("../db/importaciones/eventos-web.sql", import.meta.url), "utf8");

test("28 entradas en la web son 17 eventos", () => {
  assert.equal(web.length, 17);
  assert.equal(web.reduce((a, e) => a + e.tarifas, 0), 28);
  assert.equal(d.nuevos.length + d.completados.length, 17);
});

test("ningún evento el mismo día en el mismo sitio dos veces", () => {
  const vistos = new Set();
  for (const e of web){
    const k = e.fecha + "|" + e.lugar + "|" + e.titulo;
    assert.equal(vistos.has(k), false, "repetido: " + k);
    vistos.add(k);
  }
});

test("los que ya estaban no se crean otra vez: se les pone la fecha", () => {
  assert.equal(d.completados.length, 4);
  for (const e of d.completados){
    /* no aparecen en el insert */
    const enInsert = new RegExp(`'${e.id}'::uuid, '`).test(
      sql.slice(sql.indexOf("insert into eventos")));
    assert.equal(enInsert, false, e.nombre + " se estaría creando de nuevo");
    /* sí en el update */
    assert.ok(sql.includes(`where id = '${e.id}'::uuid`), e.nombre);
  }
  /* y sin pisar lo que ya hubiera */
  assert.match(sql, /fecha = coalesce\(fecha, /);
});

test("los cuatro que ya estaban son los que tienen resultados", () => {
  const nombres = d.completados.map(e => e.nombre);
  for (const n of ["XXIV CNI 2023 (CEPPB)", "Campeonato Nacional 2024 (CEPPB)",
                   "C.N.I. Campeonato Nacional IGP 2025 (CEPPB)",
                   "Especial Nacional de Cría CEPPB 2025 · Igea"])
    assert.ok(nombres.includes(n), "falta " + n);
});

test("cada evento con el tipo que le toca en el baremo", () => {
  const tipo = t => (d.nuevos.find(e => e.titulo === t) || {}).tipo;
  assert.equal(tipo("Especial Nacional de Cría CEPPB 2024"), "Especial de Cría");
  assert.equal(tipo("Monográfica Castelldans"), "Concurso monográfico CEPPB");
  assert.equal(tipo("Campeonato Nacional de Mondioring 2025"), "CNM");
  /* un curso o un examen de figurantes no es un concurso y no puntúa */
  assert.equal(tipo("Summer Camp Mondioring CEPPB"), "Otro");
  assert.equal(tipo("Examen y selección de figurantes IGP CEPPB"), "Otro");
});

test("los identificadores son estables: reimportar no duplica", () => {
  const ids = [...d.nuevos, ...d.completados].map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(sql, /on conflict \(id\) do update set/);
});
