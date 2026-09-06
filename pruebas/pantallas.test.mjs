/* ============================================================
   Que las pantallas se puedan dibujar.

   El prototipo era un solo archivo; ahora está repartido en
   veintiuno. Basta con que una función se haya quedado en el
   archivo que no se carga para que una pantalla reviente al
   abrirla, y eso no lo detecta el comprobador de sintaxis.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ARCHIVOS = [
  "js/config.js", "js/util.js", "js/reglamento.js", "js/privacidad.js",
  "js/componentes.js", "js/sesion.js", "js/columnas.js", "js/datos.js",
  "js/formularios.js", "js/formularios-def.js",
  "js/vistas/entrar.js", "js/vistas/muro.js", "js/vistas/ajustes.js", "js/vistas/socios.js",
  "js/vistas/perros.js", "js/vistas/cria.js", "js/vistas/camadas-eventos.js",
  "js/vistas/mi-area.js", "js/vistas/junta.js", "js/vistas/club.js",
  "js/app.js",
];

/* Un navegador de mentira, suficiente para dibujar */
function montar(){
  const nodos = {};
  const nodo = () => ({
    innerHTML: "", textContent: "", value: "", classList: {add(){}, remove(){}},
    querySelectorAll: () => [], insertAdjacentHTML(){}, focus(){}, setAttribute(){},
    getAttribute: () => null, closest: () => null, dataset: {},
  });
  const doc = {
    querySelector: sel => (nodos[sel] = nodos[sel] || nodo()),
    addEventListener(){}, documentElement: nodo(), activeElement: null,
  };
  const ctx = vm.createContext({
    console, document: doc, window: {}, location: {hash: "#/muro", pathname: "/", search: ""},
    history: {replaceState(){}}, localStorage: {getItem: () => null, setItem(){}, removeItem(){}},
    matchMedia: () => ({matches: false}), addEventListener(){}, setTimeout, clearTimeout,
    requestAnimationFrame(){}, fetch: async () => ({ok: true}), supabase: null,
    URLSearchParams, Date, Math, JSON, structuredClone,
  });
  ctx.window = ctx;
  for (const f of ARCHIVOS){
    vm.runInContext(readFileSync(new URL("../" + f, import.meta.url), "utf8"), ctx, {filename: f});
  }
  return ctx;
}

const ctx = montar();
const leer = expr => JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));

/* Cada pantalla del menú tiene que existir */
const DEL_MENU = leer('VISTAS.filter(v => v.r).map(v => v.r)');

test("todas las pantallas del menú están escritas", () => {
  const escritas = leer("Object.keys(V)");
  const faltan = DEL_MENU.filter(r => !escritas.includes(r));
  assert.equal(faltan.join(", "), "", "pantallas que el menú ofrece pero no existen");
});

test("la especificación pide 13 pantallas y están todas", () => {
  const escritas = leer("Object.keys(V)");
  for (const r of ["muro","socios","socio","perros","perro","aptos","cruce","camadas",
                   "intervar","eventos","cargos","yo","cuenta","admin","validar",
                   "invitaciones","altas","cobros","admins"]){
    assert.equal(escritas.includes(r), true, "falta la pantalla: " + r);
  }
});

/* Dibujarlas de verdad, con la base de datos vacía: es el estado en
   el que las va a encontrar el primero que entre. */
for (const rol of ["visitante", "socio", "admin"]){
  test(`las pantallas se dibujan sin reventar — como ${rol}`, () => {
    vm.runInContext(`
      SESION.rol = ${JSON.stringify(rol)};
      SESION.esAdmin = ${rol === "admin"};
      SESION.usuario = ${rol === "visitante" ? "null" : '{id:"u1", email:"x@y.z"}'};
      SESION.socio = ${rol === "visitante" ? "null" : '{id:"s1", numero:1, nombre:"Ana", apellidos:"Ruiz", nombreCompleto:"Ana Ruiz"}'};
      S.listo = true; S.error = null;
    `, ctx);

    const fallos = [];
    for (const r of leer("Object.keys(V)")){
      try {
        const html = vm.runInContext(`String(V[${JSON.stringify(r)}](""))`, ctx);
        assert.equal(typeof html, "string");
      } catch(e){
        fallos.push(`${r}: ${e.message}`);
      }
    }
    assert.equal(fallos.length, 0, "pantallas que revientan:\n  " + fallos.join("\n  "));
  });
}

test("los formularios están todos definidos", () => {
  const forms = leer("Object.keys(FORMS)");
  for (const f of ["socio","perro","salud","resultado","camada","evento","traspaso","solicitud"]){
    assert.equal(forms.includes(f), true, "falta el formulario: " + f);
  }
});

/* ============================================================
   Mi cuenta
   ============================================================ */
test("Mi cuenta funciona aunque la cuenta no esté atada a un socio", () => {
  vm.runInContext(`
    SESION.rol = "admin"; SESION.esAdmin = true;
    SESION.usuario = {id:"u1", email:"junta@ejemplo.test"};
    SESION.socio = null;
    S.listo = true; S.error = null;
  `, ctx);
  const html = vm.runInContext('String(V.ajustes(""))', ctx);
  assert.match(html, /no está atada a ningún|Contraseña/,
    "debe explicar qué falta, no quedarse en blanco");
});

test("Mi perfil explica qué falta en vez de hablar de un selector que ya no existe", () => {
  const html = vm.runInContext('String(V.yo(""))', ctx);
  assert.doesNotMatch(html, /Ver como/,
    "el selector «Ver como» era del prototipo: la sesión ahora es real");
});

test("el número de cuenta no aparece entre las opciones de privacidad", () => {
  vm.runInContext(`
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz",
                    nombreCompleto:"Ana Ruiz", perfilPublico:"oculto", priv:{}};
  `, ctx);
  const html = vm.runInContext('String(V.ajustes(""))', ctx);
  assert.doesNotMatch(html, /data-priv="iban"/,
    "el IBAN no es compartible en ningún nivel");
  assert.match(html, /no se comparte en ningún nivel/,
    "y conviene que el socio lo lea");
});

test("el perfil nace oculto y esa es la opción marcada", () => {
  const html = vm.runInContext('String(V.ajustes(""))', ctx);
  assert.match(html, /value="oculto" selected/);
});
