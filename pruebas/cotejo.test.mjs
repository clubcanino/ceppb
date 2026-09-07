/* ============================================================
   Que no se dé de alta un perro que ya está en el libro.

   El libro arrancó con 3.833 ejemplares y la mayoría no tienen
   titular. Lo más probable, cuando un socio da de alta a su perro,
   es que ese perro ya esté ahí. Si se duplica, quedan dos fichas
   del mismo animal con medio pedigrí cada una.

   Lo que se prueba aquí es lo que puede fallar en silencio: que la
   comprobación mire todo el libro y no sólo lo que el socio ve, que
   no se pueda seguir sin declarar, que declarar deje constancia, y
   que reclamar no cree una ficha nueva.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lee = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");

/* ------------------------------------------------------------
   Un navegador de mentira con la plataforma dentro.
   ------------------------------------------------------------ */
function montar(coincidencias){
  const hechos = {
    rpc: null, guardados: [], formularios: [], avisos: [],
    reclamado: null, cerrado: 0, ido: null,
  };
  const nodo = () => ({
    innerHTML: "", textContent: "", value: "", classList: {add(){}, remove(){}},
    querySelectorAll: () => [], getAttribute: () => null, closest: () => null,
  });
  const ctx = vm.createContext({
    console, window: {}, setTimeout: fn => fn(), clearTimeout(){},
    document: { querySelector: () => nodo(), addEventListener(){} },
    /* Lo mínimo que cotejo.js usa de la plataforma */
    esc: s => String(s ?? ""),
    fmtF: s => String(s ?? ""),
    hoy: () => "2026-09-07",
    miSocioId: () => "socio-1",
    toast: m => hechos.avisos.push(m),
    ir: r => { hechos.ido = r; },
    cerrarForm: () => { hechos.cerrado++; },
    abrirForm: (titulo, grupos, onOk) => {
      hechos.formularios.push({ titulo, grupos });
      hechos.enviar = onOk;
    },
    FORMS: { reclamacion: id => { hechos.reclamado = id; } },
    SESION: {
      sb: {
        rpc: async (nombre, args) => {
          hechos.rpc = { nombre, args };
          return { data: coincidencias, error: null };
        },
      },
    },
  });
  vm.runInContext(lee("js/cotejo.js"), ctx, { filename: "js/cotejo.js" });
  return { ctx, hechos };
}

const UNA = {
  perro_id: "p-9", motivo: "chip", visible: true,
  nombre: "Gas", afijo: "de Azarbe", variedad: "Malinois", sexo: "M",
  fecha_nacimiento: "2019-05-01", loe: "2222", chip: "941000012345678",
  con_titular: false, es_mio: false,
};

/* ------------------------------------------------------------
   Preguntar al libro
   ------------------------------------------------------------ */
test("se pregunta a la base de datos, no al listado que el socio ve", async () => {
  const { ctx, hechos } = montar([UNA]);
  const r = await vm.runInContext(
    `coincidenciasDeEjemplar({nombre:"Gas", afijo:"de Azarbe", loe:"2222", chip:"941000012345678"})`,
    ctx);

  assert.equal(hechos.rpc.nombre, "coincidencias_de_ejemplar",
    "tiene que ir a la base de datos: un socio no ve las fichas reservadas de los demás, " +
    "y son justo esas contra las que nadie podría cotejar");
  assert.equal(hechos.rpc.args.p_chip, "941000012345678");
  assert.equal(hechos.rpc.args.p_loe, "2222");
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "p-9");
});

test("si la comprobación falla, el socio puede seguir dando de alta su perro", async () => {
  const { ctx, hechos } = montar([]);
  vm.runInContext(`SESION.sb.rpc = async () => { throw new Error("sin red"); }`, ctx);
  const r = await vm.runInContext(`coincidenciasDeEjemplar({nombre:"Gas"})`, ctx);

  assert.equal(r.length, 0, "vale más un duplicado que un socio que no puede registrar su perro");
  assert.equal(hechos.avisos.length, 1, "pero se le avisa");
});

/* ------------------------------------------------------------
   Enseñárselo
   ------------------------------------------------------------ */
test("de una ficha reservada no se dice ni el nombre ni de quién es", () => {
  const oculta = Object.assign({}, UNA, {
    visible: false, nombre: null, afijo: null, loe: null, chip: null,
    variedad: null, sexo: null, fecha_nacimiento: null, con_titular: true,
  });
  const { ctx } = montar([oculta]);
  const html = vm.runInContext(
    `lineaDeCoincidencia(${JSON.stringify({
      id: "p-9", motivo: "chip", visible: false, nombre: null, afijo: null,
      loe: null, chip: null, conTitular: true, esMio: false })})`, ctx);

  assert.match(html, /reservada/i, "se dice que existe");
  assert.match(html, /microchip/i, "y por qué ha saltado");
  assert.equal(/Gas|Azarbe|941000012345678/.test(html), false,
    "pero no se filtra el nombre, el LOE ni el chip de la ficha de otro socio");
  assert.equal(/data-es-este/.test(html), false,
    "y no se ofrece reclamar una ficha que no se puede ni mirar: eso pasa por secretaría");
});

test("la que sí se ve trae con qué decidir y los dos botones", () => {
  const { ctx } = montar([UNA]);
  const c = {
    id: "p-9", motivo: "chip", visible: true, nombre: "Gas", afijo: "de Azarbe",
    variedad: "Malinois", sexo: "M", fechaNacimiento: "2019-05-01",
    loe: "2222", chip: "941000012345678", conTitular: false, esMio: false,
  };
  const html = vm.runInContext(`lineaDeCoincidencia(${JSON.stringify(c)})`, ctx);

  assert.match(html, /Gas de Azarbe/);
  assert.match(html, /941000012345678/, "el chip, que es lo que lo identifica");
  assert.match(html, /sin titular/, "y que se puede pedir");
  assert.match(html, /data-es-este="p-9"/);
  assert.match(html, /#\/perro\/p-9/, "poder mirarla antes de decidir");
});

/* ------------------------------------------------------------
   Declarar
   ------------------------------------------------------------ */
test("sin marcar la casilla no se da de alta nada", async () => {
  const { ctx, hechos } = montar([UNA]);
  let siguio = false;
  ctx.continuar = () => { siguio = true; };
  vm.runInContext(`pedirCotejo([${JSON.stringify({id:"p-9", motivo:"chip", visible:true, nombre:"Gas"})}], continuar)`, ctx);

  const r = await hechos.enviar({ certificoNoRepetido: false });
  assert.equal(siguio, false, "no se guarda");
  assert.equal(r, false, "y el panel se queda abierto, no se pierde lo escrito");
  assert.equal(hechos.avisos.length, 1, "se le dice qué le falta");
});

test("al declarar que es otro perro, queda constancia de qué se le enseñó", async () => {
  const { ctx, hechos } = montar([UNA]);
  let decl = null;
  ctx.continuar = d => { decl = d; };
  const lista = [
    {id:"p-9",  motivo:"chip",   visible:true, nombre:"Gas"},
    {id:"p-12", motivo:"nombre", visible:true, nombre:"Gas"},
  ];
  vm.runInContext(`pedirCotejo(${JSON.stringify(lista)}, continuar)`, ctx);
  await hechos.enviar({ certificoNoRepetido: true });

  assert.notEqual(decl, null, "ahora sí se guarda");
  assert.equal(decl.fecha, "2026-09-07");
  assert.equal(decl.socioId, "socio-1", "quién lo declaró");
  assert.equal(decl.coincidencias.join(","), "p-9,p-12",
    "y qué fichas se le pusieron delante, para que la junta pueda mirarlo");
});

test("cuando el que salta es el LOE o el chip, se le dice que casi seguro es su perro", () => {
  const { ctx, hechos } = montar([UNA]);
  ctx.continuar = () => {};
  vm.runInContext(
    `pedirCotejo([{id:"p-9",motivo:"chip",visible:true,nombre:"Gas"}], continuar)`, ctx);
  const texto = hechos.formularios[0].grupos.map(g => g.d || "").join(" ");
  assert.match(texto, /microchip|LOE/);

  const b = montar([UNA]);
  b.ctx.continuar = () => {};
  vm.runInContext(
    `pedirCotejo([{id:"p-9",motivo:"nombre",visible:true,nombre:"Gas"}], continuar)`, b.ctx);
  const t2 = b.hechos.formularios[0].grupos.map(g => g.d || "").join(" ");
  assert.match(t2, /nombres repetidos/,
    "por el nombre no se afirma: en el libro hay cuatro «Alan» distintos");
});

/* ------------------------------------------------------------
   Reclamar
   ------------------------------------------------------------ */
test("«es este perro» pide la ficha que ya está y no crea una nueva", () => {
  const { ctx, hechos } = montar([UNA]);
  let siguio = false;
  ctx.continuar = () => { siguio = true; };
  vm.runInContext(
    `pedirCotejo([{id:"p-9",motivo:"chip",visible:true,nombre:"Gas",esMio:false}], continuar)`, ctx);
  vm.runInContext(`esEstePerro("p-9")`, ctx);

  assert.equal(hechos.reclamado, "p-9", "se abre la reclamación de la ficha que ya existe");
  assert.equal(siguio, false, "y no se da de alta ningún ejemplar nuevo");
});

test("si la ficha ya es suya, se le lleva a ella y no se le hace reclamar nada", () => {
  const { ctx, hechos } = montar([UNA]);
  ctx.continuar = () => {};
  vm.runInContext(
    `pedirCotejo([{id:"p-9",motivo:"chip",visible:true,nombre:"Gas",esMio:true}], continuar)`, ctx);
  vm.runInContext(`esEstePerro("p-9")`, ctx);

  assert.equal(hechos.reclamado, null, "no se reclama lo que ya es tuyo");
  assert.equal(hechos.ido, "perro/p-9");
});

/* ------------------------------------------------------------
   El enganche con el alta y con la base de datos
   ------------------------------------------------------------ */
test("el alta de un ejemplar nuevo pasa por el cotejo antes de tocar nada", () => {
  const f = lee("js/formularios-def.js");
  const form  = f.slice(f.indexOf("  perro(id){"), f.indexOf("  salud(id){"));
  const graba = f.slice(f.indexOf("async function guardarEjemplar("));

  assert.match(form, /coincidenciasDeEjemplar\(d\)/, "se comprueba");
  assert.match(form, /pedirCotejo\(/, "y se enseña lo que hay");
  assert.match(form, /if \(!id\)/,
    "sólo en el alta: editar una ficha que ya está no es duplicarla");

  /* Lo que crea padres y abuelos vive en guardarEjemplar, y ahí no se
     llega hasta que el cotejo está resuelto. Si el socio acaba
     reclamando la ficha que ya existía, no se ha creado nada. */
  assert.equal(/perroPorNombreOAlta/.test(form), false,
    "el formulario no crea progenitores por su cuenta: si lo hiciera, un alta " +
    "que acaba en reclamación dejaría medio pedigrí suelto por el camino");
  assert.match(graba, /perroPorNombreOAlta/,
    "los progenitores se crean al guardar de verdad");
  assert.equal(
    form.indexOf("coincidenciasDeEjemplar") < form.indexOf("guardarEjemplar"),
    true, "primero se coteja, después se guarda");
});

test("la declaración se guarda en la ficha, y la columna existe", () => {
  assert.match(lee("js/formularios-def.js"), /n\.altaDeclarada = declaracion/);
  assert.match(lee("js/columnas.js"), /"alta_declarada"/,
    "sin la columna, aFila la tiraría en silencio y la declaración no se guardaría");
  assert.match(lee("db/schema.sql"), /alta_declarada\s+jsonb/);
});

test("la búsqueda del libro no se salta la privacidad de las fichas ajenas", () => {
  const sql = lee("db/migraciones/2026-09-07-ejemplar-repetido.sql");
  assert.match(sql, /security definer/i, "mira todo el libro");
  assert.match(sql, /case when c\.ve then c\.nombre/,
    "pero de lo que el socio no puede ver, no devuelve el nombre");
  assert.match(sql, /grant execute[\s\S]*to authenticated/i);
  assert.match(sql, /revoke all on function coincidencias_de_ejemplar/i,
    "sin sesión no se puede sondear el libro");
});

test("el formulario puede quedarse abierto cuando falta algo", () => {
  assert.match(lee("js/eventos.js"), /!==\s*false\)\s*cerrarForm\(\)/,
    "si no, al enseñar las coincidencias se perdería todo lo que el socio escribió");
});
