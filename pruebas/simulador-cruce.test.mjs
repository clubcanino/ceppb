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
