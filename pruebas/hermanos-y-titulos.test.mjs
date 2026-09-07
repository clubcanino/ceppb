/* ============================================================
   Hermandad y palmarés.

   Hermanos completos comparten padre Y madre: la mitad de su
   herencia. Los medio hermanos, uno de los dos: la cuarta parte.
   Confundirlos falsearía la lectura de una línea, que es
   justamente para lo que se miran.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { cargar } from "./cargar.mjs";

const { ponerCenso, hermanosDe, gradoDeHermandad, parentesco,
        DISTINCIONES, NIVELES_ADIESTRAMIENTO, TIT_TRABAJO } =
  cargar(["js/util.js", "js/reglamento.js", "js/genealogia.js"],
         ["ponerCenso", "hermanosDe", "gradoDeHermandad", "parentesco",
          "DISTINCIONES", "NIVELES_ADIESTRAMIENTO", "TIT_TRABAJO"]);

/* Una familia: dos camadas del mismo padre con madres distintas,
   más un perro suelto sin pedigrí. */
const censo = [
  {id:"padre",  nombre:"Padre",  sexo:"M"},
  {id:"madre1", nombre:"Madre 1", sexo:"H"},
  {id:"madre2", nombre:"Madre 2", sexo:"H"},
  {id:"a", nombre:"A", padreId:"padre", madreId:"madre1", fechaNacimiento:"2020-01-01"},
  {id:"b", nombre:"B", padreId:"padre", madreId:"madre1", fechaNacimiento:"2020-01-01"},
  {id:"c", nombre:"C", padreId:"padre", madreId:"madre2", fechaNacimiento:"2021-05-01"},
  {id:"d", nombre:"D", padreId:"otro",  madreId:"madre1", fechaNacimiento:"2019-03-01"},
  {id:"suelto", nombre:"Suelto"},
  {id:"suelto2", nombre:"Otro suelto"},
];
ponerCenso(censo);

test("hermanos completos: mismo padre y misma madre", () => {
  const h = hermanosDe("a");
  assert.equal(h.completos.map(x => x.id).join(","), "b");
  assert.equal(gradoDeHermandad("a", "b"), "completos");
});

test("medio hermanos, cada uno por su lado", () => {
  const h = hermanosDe("a");
  assert.equal(h.porPadre.map(x => x.id).join(","), "c", "C comparte padre, no madre");
  assert.equal(h.porMadre.map(x => x.id).join(","), "d", "D comparte madre, no padre");
  assert.equal(gradoDeHermandad("a", "c"), "porPadre");
  assert.equal(gradoDeHermandad("a", "d"), "porMadre");
});

test("un completo no se cuenta además como medio hermano", () => {
  const h = hermanosDe("a");
  const medios = h.porPadre.concat(h.porMadre).map(x => x.id);
  assert.equal(medios.includes("b"), false);
});

test("dos perros sin pedigrí no son hermanos por no tenerlo", () => {
  const h = hermanosDe("suelto");
  assert.equal(h.completos.length + h.porPadre.length + h.porMadre.length, 0);
  assert.equal(gradoDeHermandad("suelto", "suelto2"), null);
});

test("y el parentesco confirma los grados", () => {
  /* Hermanos completos comparten la mitad; medio hermanos, la cuarta
     parte. Es lo que hace que una línea se lea en el conjunto. */
  assert.equal(parentesco("a", "b"), 0.25, "hermanos completos: coeficiente 0,25");
  assert.equal(parentesco("a", "c"), 0.125, "medio hermanos: la mitad de eso");
  assert.equal(parentesco("a", "d"), 0.125);
});

test("nadie es hermano de sí mismo", () => {
  assert.equal(hermanosDe("a").completos.some(x => x.id === "a"), false);
  assert.equal(gradoDeHermandad("a", "a"), null);
});

/* ---------- los títulos ---------- */
test("los certificados de la FCI, nacionales e internacionales", () => {
  for (const c of ["CAC","RCAC","CACIB","RCACIB",        // belleza
                   "CACT","RCACT","CACIT","RCACIT",      // trabajo
                   "CACIAG","RCACIAG","CACIOB","RCACIOB",// agility y obediencia
                   "CCJ","RCCJ","CCV","RCCV",            // clase
                   "CCPB","RCCPB","Rappel CAC",          // del club
                   "BOB","BOS","BOG","BIS"])             // mejores del día
    assert.ok(DISTINCIONES.includes(c), "falta " + c);
});

test("cada reserva acompaña a su certificado", () => {
  for (const c of DISTINCIONES.filter(x => x && /^R(CAC|CC)/.test(x))){
    const suyo = c.slice(1);
    assert.ok(DISTINCIONES.includes(suyo), `${c} sin su ${suyo}`);
  }
});

test("los niveles de adiestramiento, por disciplina", () => {
  const d = NIVELES_ADIESTRAMIENTO.map(g => g.d).join(" | ");
  for (const x of ["IGP", "Rastro", "Mondioring", "Obediencia", "Agility",
                   "Salvamento", "Pastoreo", "Carácter"])
    assert.match(d, new RegExp(x), "falta la disciplina " + x);
  const todos = NIVELES_ADIESTRAMIENTO.flatMap(g => g.t);
  for (const x of ["BH-VT", "IGP 3", "IPO 3", "FH 1", "IGP-FH", "MR 3",
                   "Clase 2", "Grado 2", "IHT 1", "Test social"])
    assert.ok(todos.includes(x), "falta el nivel " + x);
  assert.ok(todos.length > 70, "el catálogo se ha quedado corto: " + todos.length);
});

test("los del reglamento siguen ahí y siguen dando aptos", () => {
  /* Si se cayeran del desplegable, nadie podría acreditar un ACU. */
  for (const x of ["IGP1", "IGP2", "IGP3", "MR1", "MR2", "MR3", "IGP-FH"])
    assert.ok(TIT_TRABAJO.includes(x), "falta " + x);
});

test("no hay títulos repetidos en el desplegable", () => {
  const l = TIT_TRABAJO.filter(Boolean);
  const vistos = {};
  for (const x of l){ assert.equal(vistos[x], undefined, "repetido: " + x); vistos[x] = 1; }
});
