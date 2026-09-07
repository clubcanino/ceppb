/* ============================================================
   El Nacional de Mondioring de Quer, acta en mano.

   Actas oficiales de la RSCE firmadas por los jueces. Tres grados
   con tres máximos distintos —200, 300 y 400—: mezclarlos daría
   una clasificación falsa.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const acta = JSON.parse(readFileSync(new URL("../datos/mondioring-quer-2026.json", import.meta.url), "utf8"));
const d = JSON.parse(readFileSync(new URL("../db/importaciones/mondioring-quer-2026.json", import.meta.url), "utf8"));
const sql = readFileSync(new URL("../db/importaciones/mondioring-quer-2026.sql", import.meta.url), "utf8");

test("las tres tablas del acta: 6, 8 y 16 participantes", () => {
  const por = g => d.resultados.filter(r => r.clase === `Mondioring grado ${g}`).length;
  assert.equal(por(1), 6);
  assert.equal(por(2), 8);
  assert.equal(por(3), 16);
  assert.equal(d.resultados.length, 30);
  assert.equal(d.perros.length, 30);
});

test("cada grado con su máximo: ninguna puntuación lo pasa", () => {
  const sobre = {1: 200, 2: 300, 3: 400};
  for (const g of acta.grados){
    assert.equal(g.sobre, sobre[g.grado]);
    for (const r of g.resultados)
      if (r.puntos != null)
        assert.ok(r.puntos <= g.sobre, `${r.nombre}: ${r.puntos} de ${g.sobre}`);
  }
  /* y el resultado guarda sobre cuánto va, o un 255 del grado II
     parecería peor que un 264 del grado III */
  for (const r of d.resultados) assert.ok([200, 300, 400].includes(r.sobre));
});

test("los puestos escritos en el acta coinciden con la puntuación", () => {
  for (const g of acta.grados.filter(g => g.grado !== 3)){
    const conPuesto = g.resultados.filter(r => r.puesto != null);
    const porPuntos = conPuesto.slice().sort((a, b) => b.puntos - a.puntos);
    porPuntos.forEach((r, i) => assert.equal(r.puesto, i + 1,
      `grado ${g.grado}: ${r.nombre} figura ${r.puesto}º con ${r.puntos} puntos`));
  }
});

test("en el grado III no se inventa el puesto: el acta no lo trae", () => {
  const g3 = acta.grados.find(g => g.grado === 3);
  for (const r of g3.resultados) assert.equal(r.puesto, null, r.nombre);
});

test("el medio punto no se pierde: 247,5 no es 247 ni 248", () => {
  assert.match(sql, /alter column puntos type numeric\(6,1\)/);
  const medios = d.resultados.filter(r => r.puntos != null && r.puntos % 1 !== 0);
  assert.ok(medios.length >= 8, "el acta trae varios medios puntos");
  assert.ok(d.resultados.some(r => r.puntos === 247.5));
});

test("no se otorga ningún título de trabajo", () => {
  /* El acta da los puntos, no si se alcanzó el MR1, MR2 o MR3. De eso
     dependen los aptos de cría de utilidad: lo pone la junta. */
  assert.equal(sql.includes("titulo"), false, "el volcado no debe escribir títulos");
  for (const r of d.resultados) assert.equal(r.titulo, undefined);
});

test("quien no compareció se queda sin puntos, no con cero", () => {
  const sin = d.resultados.filter(r => r.puntos === null);
  assert.equal(sin.length, 2, "A'Río y Rex Miniaturas Granada");
  /* un cero es una puntuación pésima; la ausencia de puntuación no */
  for (const r of sin) assert.notEqual(r.puntos, 0);
});

test("los nombres pasan de las mayúsculas del acta al libro", () => {
  for (const p of d.perros){
    assert.notEqual(p.nombre, p.nombre.toUpperCase(), p.nombre);
    assert.equal(p.nombre.trim(), p.nombre);
  }
  assert.ok(d.perros.some(p => p.nombre === "Ron des Deux Sabres"));
  assert.ok(d.perros.some(p => p.nombre === "Txakur-Bai Kg'dino"));
});

test("es el campeonato que ya estaba en el calendario", () => {
  assert.equal(d.evento.nombre, "Campeonato Nacional de Mondioring 2026 · Quer");
  assert.equal(d.evento.fecha, "2026-02-07");
  /* se le completan los jueces sin volver a crearlo */
  assert.match(sql, /update eventos set juez =/);
  assert.match(sql, /where not exists \(select 1 from eventos/);
});

test("reimportar el acta no duplica nada", () => {
  const ids = d.resultados.map(r => r.id);
  assert.equal(new Set(ids).size, 30);
  assert.match(sql, /on conflict \(id\) do update set/);
});
