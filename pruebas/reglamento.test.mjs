/* ============================================================
   El Reglamento de Cría, comprobado caso por caso.

   Cada prueba cita el artículo que verifica. Si alguna falla,
   la plataforma estaría concediendo o negando aptos de cría
   contra el reglamento del club.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { cargar } from "./cargar.mjs";

const { R } = cargar(["js/util.js", "js/reglamento.js"], ["R"]);

/* ---------- ayudas para construir casos ---------- */
const saludPerfecta = {
  hd: "A", ed: "0", lvt: "libre",
  genes: { CACA:"libre", CJM:"libre", SDCA1:"libre", SDCA2:"libre" },
  validacion: { estado:"validado", fecha:"2025-01-10", por:"Comisión de Cría" },
};

function perro(extra = {}){
  return Object.assign({
    id: "p1", nombre: "Prueba", variedad: "Malinois", sexo: "M",
    fechaNacimiento: "2020-01-01",
    salud: structuredClone(saludPerfecta),
    adnProgenitores: true,
  }, extra);
}

let n = 0;
function res(extra = {}){
  return Object.assign({
    id: "r" + (++n), perroId: "p1", validado: "validado",
    fecha: "2023-06-01", organizadoCEPPB: false,
  }, extra);
}
const estr = (calificacion, ceppb, extra={}) =>
  res(Object.assign({tipo:"estructura", calificacion, organizadoCEPPB: ceppb}, extra));
const caracter = (modalidad, resultado="APTO") => res({tipo:"caracter", modalidad, resultado});
const trabajo  = (titulo) => res({tipo:"trabajo", titulo});

/* ============================================================
   Anexo A — requisitos veterinarios
   ============================================================ */
test("Anexo A: expediente completo y validado pasa", () => {
  const a = R.anexoA(perro());
  assert.equal(a.ok, true, "debería cumplir el Anexo A entero");
  assert.equal(a.bloqueos.length, 0);
});

test("Anexo A.1: displasia de cadera grado C excluye", () => {
  const p = perro(); p.salud.hd = "C";
  const a = R.anexoA(p);
  assert.equal(a.ok, false);
  assert.equal(a.bloqueos.some(b => b.k === "hd"), true, "HD C debe ser bloqueo, no simple falta");
});

test("Anexo A.1: grados A y B son los únicos aptos", () => {
  for (const g of ["A","B"]){
    const p = perro(); p.salud.hd = g;
    assert.equal(R.anexoA(p).ok, true, "HD " + g + " debería valer");
  }
  for (const g of ["C","D","E"]){
    const p = perro(); p.salud.hd = g;
    assert.equal(R.anexoA(p).ok, false, "HD " + g + " no debería valer");
  }
});

test("Anexo A.2: displasia de codo solo 0 o 1", () => {
  for (const g of ["0","1"]){
    const p = perro(); p.salud.ed = g;
    assert.equal(R.anexoA(p).ok, true, "ED " + g + " debería valer");
  }
  for (const g of ["2","3"]){
    const p = perro(); p.salud.ed = g;
    assert.equal(R.anexoA(p).ok, false, "ED " + g + " no debería valer");
  }
});

test("Anexo A.3: vértebra de transición no libre excluye", () => {
  const p = perro(); p.salud.lvt = "afectado";
  assert.equal(R.anexoA(p).bloqueos.some(b => b.k === "lvt"), true);
});

test("Anexo A.4: afectado en cualquiera de los cuatro genes excluye", () => {
  for (const gen of ["CACA","CJM","SDCA1","SDCA2"]){
    const p = perro(); p.salud.genes[gen] = "afectado";
    const a = R.anexoA(p);
    assert.equal(a.ok, false, gen + " afectado debe excluir");
    assert.equal(a.bloqueos.some(b => b.k === "gen" + gen), true);
  }
});

test("Anexo A.4: portador no excluye por sí solo", () => {
  const p = perro(); p.salud.genes.CJM = "portador";
  assert.equal(R.anexoA(p).ok, true, "un portador sí puede tener el Anexo A completo");
});

test("Anexo A: sin ADN de progenitores no está completo", () => {
  const p = perro({adnProgenitores:false});
  assert.equal(R.anexoA(p).ok, false);
});

test("Anexo A: expediente sin validar por la junta no está completo", () => {
  const p = perro();
  p.salud.validacion = { estado: "pendiente" };
  assert.equal(R.anexoA(p).ok, false, "lo que la junta no ha cotejado no cuenta");
});

/* ============================================================
   Las cinco figuras de apto de cría — Capítulo 2
   ============================================================ */
test("ACE (2.1): 15 meses, 2×MB una en evento CEPPB y prueba simple", () => {
  const p = perro({fechaNacimiento: "2020-01-01"});
  const rs = [estr("MB", true), estr("MB", false), caracter("TS")];
  assert.equal(R.aptosDe(p, rs).includes("ACE"), true);
});

test("ACE: sin ninguna calificación en evento del CEPPB no se concede", () => {
  const p = perro();
  const rs = [estr("MB", false), estr("MB", false), caracter("TS")];
  assert.equal(R.aptosDe(p, rs).includes("ACE"), false,
    "el reglamento exige que una de las dos sea en evento organizado por el club");
});

test("ACE: con una sola calificación de MB no se concede", () => {
  const p = perro();
  const rs = [estr("MB", true), caracter("TS")];
  assert.equal(R.aptosDe(p, rs).includes("ACE"), false);
});

test("ACE: menor de 15 meses no se concede", () => {
  const nac = new Date(); nac.setMonth(nac.getMonth() - 12);
  const p = perro({fechaNacimiento: nac.toISOString().slice(0,10)});
  const rs = [estr("MB", true), estr("MB", false), caracter("TS")];
  assert.equal(R.aptosDe(p, rs).includes("ACE"), false);
});

test("ACES (2.2): exige EXC, no le basta MB", () => {
  const p = perro();
  const conMB  = [estr("MB", true),  estr("MB", false),  caracter("TS")];
  const conEXC = [estr("EXC", true), estr("EXC", false), caracter("TS")];
  assert.equal(R.aptosDe(p, conMB).includes("ACES"), false);
  assert.equal(R.aptosDe(p, conEXC).includes("ACES"), true);
});

test("ACU (2.3): un Bueno en evento FCI y prueba COMPLETA", () => {
  const p = perro();
  assert.equal(R.aptosDe(p, [estr("B", false), caracter("TC")]).includes("ACU"), true);
  assert.equal(R.aptosDe(p, [estr("B", false), caracter("TS")]).includes("ACU"), false,
    "la simple no vale para ACU: hace falta la completa");
});

test("ACUS (2.4): exige IGP3 o MR3; con IGP2 no llega", () => {
  const p = perro();
  assert.equal(R.aptosDe(p, [estr("B", false), trabajo("IGP2")]).includes("ACUS"), false);
  assert.equal(R.aptosDe(p, [estr("B", false), trabajo("IGP3")]).includes("ACUS"), true);
  assert.equal(R.aptosDe(p, [estr("B", false), trabajo("MR3")]).includes("ACUS"), true);
});

test("ACSS (2.5): las dos EXC deben lograrse con 18 meses o más", () => {
  const p = perro({fechaNacimiento: "2020-01-01"});
  const pronto = [                       // con 12 y 13 meses: no computan
    estr("EXC", true,  {fecha:"2021-01-01"}),
    estr("EXC", false, {fecha:"2021-02-01"}),
    trabajo("IGP3"),
  ];
  const aTiempo = [                      // con 24 y 25 meses
    estr("EXC", true,  {fecha:"2022-01-01"}),
    estr("EXC", false, {fecha:"2022-02-01"}),
    trabajo("IGP3"),
  ];
  assert.equal(R.aptosDe(p, pronto).includes("ACSS"), false);
  assert.equal(R.aptosDe(p, aTiempo).includes("ACSS"), true);
});

/* ============================================================
   Capítulo 4 — convalidación de la prueba de carácter
   ============================================================ */
test("Cap. 4: IGP1 convalida la prueba de carácter completa", () => {
  const p = perro();
  const rs = [estr("B", false), trabajo("IGP1")];
  assert.equal(R.aptosDe(p, rs).includes("ACU"), true,
    "quien ostenta FCI-IGP 1 tiene convalidada la prueba");
});

test("Cap. 4: Mondioring 1 convalida igual que IGP1", () => {
  const p = perro();
  assert.equal(R.aptosDe(p, [estr("B", false), trabajo("MR1")]).includes("ACU"), true);
});

/* ============================================================
   La regla que no se negocia: sin validar, no cuenta
   ============================================================ */
test("Nada computa hasta que la junta lo valida", () => {
  const p = perro();
  const sinValidar = [
    estr("MB", true,  {validado:"pendiente"}),
    estr("MB", false, {validado:"pendiente"}),
    Object.assign(caracter("TS"), {validado:"pendiente"}),
  ];
  assert.equal(R.aptosDe(p, sinValidar).length, 0,
    "resultados pendientes no pueden dar ningún apto de cría");
});

test("Un resultado rechazado tampoco computa", () => {
  const p = perro();
  const rs = [estr("MB", true), estr("MB", false, {validado:"rechazado"}), caracter("TS")];
  assert.equal(R.aptosDe(p, rs).includes("ACE"), false);
});

/* ============================================================
   Capítulo 1.III — edades de monta
   ============================================================ */
function conApto(id, sexo, fechaNacimiento){
  return perro({id, sexo, fechaNacimiento, nombre:"Ej " + id});
}
const rsApto = id => [
  Object.assign(estr("MB", true),  {perroId:id}),
  Object.assign(estr("MB", false), {perroId:id}),
  Object.assign(caracter("TS"),    {perroId:id}),
];

test("Cap. 1.III: hembra de 12 meses queda bloqueada", () => {
  const m = conApto("m", "M", "2020-01-01");
  const h = conApto("h", "H", "2024-06-01");
  const avisos = R.cruce(m, h, [m,h], [...rsApto("m"), ...rsApto("h")], "2025-06-01");
  assert.equal(avisos.some(a => a.n === "bloqueo" && /18 meses/.test(a.t)), true);
});

test("Cap. 1.III: macho de más de 12 años queda bloqueado", () => {
  const m = conApto("m", "M", "2010-01-01");
  const h = conApto("h", "H", "2020-01-01");
  const avisos = R.cruce(m, h, [m,h], [...rsApto("m"), ...rsApto("h")], "2025-06-01");
  assert.equal(avisos.some(a => a.n === "bloqueo" && /12 años/.test(a.t)), true);
});

/* ============================================================
   Anexo A.4 aplicado al cruce
   ============================================================ */
test("Portador × portador queda bloqueado", () => {
  const m = conApto("m","M","2020-01-01"); m.salud.genes.CJM = "portador";
  const h = conApto("h","H","2020-01-01"); h.salud.genes.CJM = "portador";
  const avisos = R.cruce(m, h, [m,h], [...rsApto("m"), ...rsApto("h")], "2025-06-01");
  assert.equal(avisos.some(a => a.n === "bloqueo" && /portador × portador/.test(a.t)), true);
});

test("Portador × libre se permite, con aviso", () => {
  const m = conApto("m","M","2020-01-01"); m.salud.genes.CJM = "portador";
  const h = conApto("h","H","2020-01-01");
  const avisos = R.cruce(m, h, [m,h], [...rsApto("m"), ...rsApto("h")], "2025-06-01");
  assert.equal(avisos.some(a => a.n === "bloqueo" && /CJM/.test(a.t)), false);
  assert.equal(avisos.some(a => a.n === "aviso" && /portador × libre/.test(a.t)), true);
});

/* ============================================================
   Capítulo 8 — cruces intervariedades
   ============================================================ */
test("Cap. 8.2: Malinois × Groenendael no está entre los autorizados", () => {
  const m = conApto("m","M","2020-01-01"); m.variedad = "Malinois";
  const h = conApto("h","H","2020-01-01"); h.variedad = "Groenendael";
  const avisos = R.cruce(m, h, [m,h], [...rsApto("m"), ...rsApto("h")], "2025-06-01");
  assert.equal(avisos.some(a => a.n === "bloqueo" && /no está entre los autorizados/.test(a.t)), true);
});

test("Cap. 8.2: Tervueren × Groenendael se admite pero exige autorización previa", () => {
  const m = conApto("m","M","2020-01-01"); m.variedad = "Tervueren";
  const h = conApto("h","H","2020-01-01"); h.variedad = "Groenendael";
  const avisos = R.cruce(m, h, [m,h], [...rsApto("m"), ...rsApto("h")], "2025-06-01");
  assert.equal(avisos.some(a => a.n === "bloqueo" && /variedades/.test(a.t)), false);
  assert.equal(avisos.some(a => a.n === "aviso" && /requiere solicitud previa/.test(a.t)), true);
});

test("Mismo par de variedades: el orden macho/hembra no cambia el veredicto", () => {
  const a = conApto("a","M","2020-01-01"); a.variedad = "Malinois";
  const b = conApto("b","H","2020-01-01"); b.variedad = "Tervueren";
  const avisos = R.cruce(a, b, [a,b], [...rsApto("a"), ...rsApto("b")], "2025-06-01");
  assert.equal(avisos.some(x => x.n === "bloqueo" && /no está entre los autorizados/.test(x.t)), false);
});

test("R.esInter distingue cruce dentro y fuera de variedad", () => {
  assert.equal(R.esInter({variedad:"Malinois"}, {variedad:"Malinois"}), false);
  assert.equal(R.esInter({variedad:"Malinois"}, {variedad:"Laekenois"}), true);
});

/* ============================================================
   Capítulo 7 — Reproductor Superior
   ============================================================ */
test("Cap. 7: macho con 4 hijos con apto de dos alianzas — Reproductor Superior B", () => {
  const padre  = perro({id:"pa", sexo:"M"});
  const madreA = perro({id:"ma", sexo:"H"});
  const madreB = perro({id:"mb", sexo:"H"});
  const hijos = ["h1","h2","h3","h4"].map((id,i) =>
    perro({id, sexo:"M", madreId: i < 3 ? "ma" : "mb", padreId:"pa"}));

  const resultados = hijos.flatMap(h => [
    Object.assign(estr("MB", true),  {perroId:h.id}),
    Object.assign(estr("MB", false), {perroId:h.id}),
    Object.assign(caracter("TS"),    {perroId:h.id}),
  ]);

  const todos = [padre, madreA, madreB, ...hijos];
  const r = R.reproductorSuperior(padre, todos, resultados);
  assert.equal(r.conApto, 4);
  assert.equal(r.alianzas, 2);
  assert.equal(r.rsB, true, "4 hijos con apto de 2 alianzas: categoría B");
  assert.equal(r.rsA, false, "el padre no tiene apto propio, así que no es categoría A");
});

test("Cap. 7: cuatro hijos de una sola alianza no bastan", () => {
  const padre = perro({id:"pa", sexo:"M"});
  const madre = perro({id:"ma", sexo:"H"});
  const hijos = ["h1","h2","h3","h4"].map(id => perro({id, sexo:"M", madreId:"ma", padreId:"pa"}));
  const resultados = hijos.flatMap(h => [
    Object.assign(estr("MB", true),  {perroId:h.id}),
    Object.assign(estr("MB", false), {perroId:h.id}),
    Object.assign(caracter("TS"),    {perroId:h.id}),
  ]);
  const r = R.reproductorSuperior(padre, [padre, madre, ...hijos], resultados);
  assert.equal(r.conApto, 4);
  assert.equal(r.alianzas, 1);
  assert.equal(r.rsB, false, "el reglamento exige al menos dos alianzas distintas");
});
