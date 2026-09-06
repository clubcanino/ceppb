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
  "js/config.js", "js/util.js", "js/reglamento.js", "js/genealogia.js", "js/privacidad.js",
  "js/componentes.js", "js/sesion.js", "js/columnas.js", "js/datos.js", "js/media.js", "js/directo.js",
  "js/formularios.js", "js/formularios-def.js",
  "js/vistas/entrar.js", "js/vistas/muro.js", "js/vistas/ajustes.js", "js/vistas/diagnostico.js", "js/vistas/socios.js",
  "js/vistas/perros.js", "js/vistas/certificado.js", "js/vistas/cria.js", "js/vistas/camadas-eventos.js",
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

/* ============================================================
   Cuenta de junta sin ficha de socio (la del club)
   ============================================================ */
test("una cuenta de junta sin ficha no ve un error, ve una explicación", () => {
  vm.runInContext(`
    SESION.rol = "admin"; SESION.esAdmin = true;
    SESION.usuario = {id:"u1", email:"pres.ceppb@ejemplo.test"};
    SESION.socio = null;
    S.listo = true; S.error = null;
    S.data.socios = [];
  `, ctx);
  const html = vm.runInContext('String(V.yo(""))', ctx);
  assert.match(html, /cuenta de la junta directiva/,
    "debe decirle que es cuenta institucional, no que le falta algo");
  assert.doesNotMatch(html, /Ver como/);
});

test("el menú no ofrece área de socio a quien no tiene ficha", () => {
  const ofrecidas = vm.runInContext(`
    JSON.stringify(VISTAS.filter(v => v.r && v.v.includes(SESION.rol) && (!v.si || v.si()))
                         .map(v => v.r))
  `, ctx);
  const rutas = JSON.parse(ofrecidas);
  assert.equal(rutas.includes("yo"), false, "Mi perfil no aplica sin ficha de socio");
  assert.equal(rutas.includes("cuenta"), false, "Cuota y pagos tampoco");
  assert.equal(rutas.includes("ajustes"), true, "Mi cuenta sí: la contraseña la tiene todo el mundo");
  assert.equal(rutas.includes("admin"), true, "y el panel de la junta, claro");
});

test("con ficha de socio, el área de socio vuelve a aparecer", () => {
  vm.runInContext(`SESION.socio = {id:"s1", numero:896, nombre:"Santiago",
                                   apellidos:"Díaz", nombreCompleto:"Santiago Díaz"};`, ctx);
  const rutas = JSON.parse(vm.runInContext(`
    JSON.stringify(VISTAS.filter(v => v.r && v.v.includes(SESION.rol) && (!v.si || v.si()))
                         .map(v => v.r))
  `, ctx));
  assert.equal(rutas.includes("yo"), true);
  assert.equal(rutas.includes("cuenta"), true);
});

/* ============================================================
   Dar de alta un ejemplar tiene que estar a la vista
   ============================================================ */
test("un socio ve el botón de dar de alta en Ejemplares", () => {
  vm.runInContext(`
    SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.usuario = {id:"u1", email:"socio@ejemplo.test"};
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz", nombreCompleto:"Ana Ruiz"};
    S.listo = true; S.error = null; S.data.perros = [];
  `, ctx);
  const html = vm.runInContext('String(V.perros(""))', ctx);
  assert.match(html, /Dar de alta un ejemplar/,
    "el sitio natural para registrar un perro es la pantalla de Ejemplares");
  assert.match(html, /data-form="perro\|"/);
});

test("la junta también puede dar de alta ejemplares", () => {
  vm.runInContext(`SESION.rol = "admin"; SESION.esAdmin = true; SESION.socio = null;`, ctx);
  const html = vm.runInContext('String(V.perros(""))', ctx);
  assert.match(html, /Dar de alta un ejemplar/);
});

test("un visitante no ve el botón, ve la invitación a entrar", () => {
  vm.runInContext(`SESION.rol = "visitante"; SESION.esAdmin = false;
                   SESION.usuario = null; SESION.socio = null;`, ctx);
  const html = vm.runInContext('String(V.perros(""))', ctx);
  assert.doesNotMatch(html, /data-form="perro\|"/,
    "quien no ha entrado no registra perros");
  assert.match(html, /Entrar/);
});

test("con la lista vacía se explica qué hacer, no se deja en blanco", () => {
  vm.runInContext(`SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz", nombreCompleto:"Ana Ruiz"};
    S.data.perros = [];`, ctx);
  const html = vm.runInContext('String(V.perros(""))', ctx);
  assert.match(html, /Todavía no hay ejemplares registrados/);
});

/* ============================================================
   Alta de ejemplar: afijo y criador
   ============================================================ */
test("el criador se escribe con sugerencias, no con un desplegable", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const bloque = def.slice(def.indexOf("  perro(id){"), def.indexOf("  salud(id){"));
  assert.match(bloque, /k:"criadorNombre".*tipo:"buscador"/s,
    "el criador es un campo de escribir con sugerencias");
  assert.doesNotMatch(bloque, /k:"criadorId".*tipo:"select"/s,
    "no puede ser un desplegable cerrado de 347 nombres");
});

test("las sugerencias son solo nombres, sin decir quién tiene afijo", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const fn = def.slice(def.indexOf("function nombresDeSocios"));
  assert.doesNotMatch(fn.slice(0, 300), /afijo/,
    "quien registra un perro no tiene por qué ver quién es criador y quién no");
});

test("el afijo se escribe a mano y no depende de elegir criador", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const bloque = def.slice(def.indexOf("  perro(id){"), def.indexOf("  salud(id){"));
  const campoAfijo = bloque.match(/\{k:"afijo"[^}]*\}/)[0];
  assert.doesNotMatch(campoAfijo, /tipo:"select"/, "el afijo es texto libre");
  assert.doesNotMatch(campoAfijo, /Se rellena solo/, "ya no depende del desplegable de criador");
});

/* ============================================================
   La ficha del ejemplar, pestaña por pestaña
   ============================================================ */
test("las siete pestañas de la ficha se dibujan sin reventar", () => {
  vm.runInContext(`
    SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.usuario = {id:"u1", email:"socio@ejemplo.test"};
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz", nombreCompleto:"Ana Ruiz"};
    S.listo = true; S.error = null;
    S.data.perros = [{id:"p1", nombre:"Uma", variedad:"Malinois", sexo:"H",
                      fechaNacimiento:"2022-03-01", propietarioId:"s1",
                      visibilidad:"socios", salud:{validacion:{estado:"pendiente"}}}];
    S.data.media = [];
    S.data.resultados = [];
  `, ctx);

  const fallos = [];
  for (const pestana of ["resumen","salud","aptos","resultados","pedigri","progenie","galeria"]){
    try {
      vm.runInContext(`tabPerro = ${JSON.stringify(pestana)}`, ctx);
      const html = vm.runInContext('String(V.perro("p1"))', ctx);
      assert.equal(typeof html, "string");
      if (!html.length) fallos.push(pestana + ": vacía");
    } catch(e){ fallos.push(pestana + ": " + e.message); }
  }
  assert.equal(fallos.length, 0, "pestañas que fallan:\n  " + fallos.join("\n  "));
});

test("el propietario ve el botón de subir foto y el de añadir vídeo", () => {
  vm.runInContext(`tabPerro = "galeria"`, ctx);
  const html = vm.runInContext('String(V.perro("p1"))', ctx);
  assert.match(html, /Subir foto/, "su dueño tiene que poder subir fotos");
  assert.match(html, /data-form="video\|/, "y enlazar vídeos");
});

test("quien no es el dueño no ve esos botones", () => {
  vm.runInContext(`SESION.socio = {id:"s9", numero:1, nombre:"Otro", apellidos:"Socio",
                                   nombreCompleto:"Otro Socio"};`, ctx);
  const html = vm.runInContext('String(V.perro("p1"))', ctx);
  assert.doesNotMatch(html, /Subir foto/, "las fotos de un perro las pone su dueño");
});

/* ============================================================
   Sugerencias del buscador
   ============================================================ */
test("las sugerencias no salen hasta la tercera letra", () => {
  const f = readFileSync(new URL("../js/formularios.js", import.meta.url), "utf8");
  assert.match(f, /LETRAS_MINIMAS\s*=\s*3/,
    "con 347 socios, una lista que se abre entera estorba más que ayuda");
  assert.match(f, /if \(escrito\.length < LETRAS_MINIMAS\)\{ lista\.innerHTML = ""/,
    "por debajo de tres letras, la lista se queda vacía");
  assert.match(f, /<datalist id="\$\{id\}"><\/datalist>/,
    "el desplegable nace vacío: se llena al escribir");
});

/* ============================================================
   Certificado
   ============================================================ */
test("el certificado lo saca el propietario, no cualquiera", () => {
  vm.runInContext(`
    SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.usuario = {id:"u1", email:"otro@ejemplo.test"};
    SESION.socio = {id:"s9", numero:1, nombre:"Otro", apellidos:"Socio", nombreCompleto:"Otro Socio"};
    S.listo = true; S.error = null;
    S.data.perros = [{id:"p1", nombre:"Uma", variedad:"Malinois", sexo:"H",
                      propietarioId:"s1", visibilidad:"socios",
                      salud:{validacion:{estado:"validado"}}}];
    S.data.resultados = []; S.data.media = []; S.data.socios = [];
  `, ctx);
  const ajeno = vm.runInContext('String(V.certificado("p1"))', ctx);
  assert.match(ajeno, /lo expide su propietario/,
    "un socio no puede certificar el perro de otro");

  vm.runInContext(`SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz",
                                   nombreCompleto:"Ana Ruiz"};`, ctx);
  const propio = vm.runInContext('String(V.certificado("p1"))', ctx);
  assert.match(propio, /Certificado del ejemplar/);
  assert.match(propio, /Presidente del Club Español del Perro Pastor Belga/);
});

test("el certificado solo recoge lo validado", () => {
  vm.runInContext(`
    S.data.perros = [{id:"p2", nombre:"Sin validar", variedad:"Malinois", sexo:"M",
                      propietarioId:"s1", salud:{hd:"A", validacion:{estado:"pendiente"}}}];
    S.data.resultados = [{id:"r1", perroId:"p2", tipo:"trabajo", titulo:"IGP3", validado:"pendiente"}];
  `, ctx);
  const html = vm.runInContext('String(V.certificado("p2"))', ctx);
  assert.doesNotMatch(html, /IGP3/,
    "un título sin validar no puede salir en un documento firmado por el presidente");
  assert.match(html, /no ha sido validado por la junta/);
});

test("el certificado lleva un código para comprobar que es auténtico", () => {
  const html = vm.runInContext('String(V.certificado("p2"))', ctx);
  assert.match(html, /CEPPB-/, "sin código, un PDF con una firma lo falsifica cualquiera");
  assert.match(html, /Código de verificación/);
});

/* ============================================================
   El muro tiene que reflejar lo que hay
   ============================================================ */
test("un ejemplar registrado aparece en Novedades", () => {
  vm.runInContext(`
    SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.usuario = {id:"u1", email:"socio@ejemplo.test"};
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz", nombreCompleto:"Ana Ruiz"};
    S.listo = true; S.error = null;
    S.data.socios = [SESION.socio];
    S.data.perros = [{id:"p1", nombre:"Uma", afijo:"Del Ejemplo", variedad:"Malinois",
                      sexo:"H", propietarioId:"s1", visibilidad:"socios",
                      creado:"2026-09-06T10:00:00Z", salud:{validacion:{estado:"pendiente"}}}];
    S.data.resultados = []; S.data.camadas = []; S.data.eventos = []; S.data.media = [];
  `, ctx);
  const html = vm.runInContext('String(V.muro(""))', ctx);
  assert.doesNotMatch(html, /El libro está en blanco/,
    "con un perro dentro, el libro no está en blanco");
  assert.match(html, /Uma Del Ejemplo se une al libro/);
});

test("un apto concedido sale destacado en Novedades", () => {
  vm.runInContext(`
    S.data.perros = [{id:"p1", nombre:"Uma", variedad:"Malinois", sexo:"H",
                      fechaNacimiento:"2022-01-01", propietarioId:"s1", visibilidad:"socios",
                      creado:"2026-09-06T10:00:00Z", adnEjemplar:true,
                      salud:{hd:"A", ed:"0", lvt:"libre",
                             genes:{CACA:"libre",CJM:"libre",SDCA1:"libre",SDCA2:"libre"},
                             validacion:{estado:"validado", fecha:"2026-09-06"}}}];
    S.data.resultados = [
      {id:"r1", perroId:"p1", tipo:"estructura", calificacion:"MB", organizadoCEPPB:true,  fecha:"2024-05-01", validado:"validado"},
      {id:"r2", perroId:"p1", tipo:"estructura", calificacion:"MB", organizadoCEPPB:false, fecha:"2024-07-01", validado:"validado"},
      {id:"r3", perroId:"p1", tipo:"caracter", modalidad:"TS", resultado:"APTO", fecha:"2024-08-01", validado:"validado"}];
  `, ctx);
  const html = vm.runInContext('String(V.muro(""))', ctx);
  assert.match(html, /obtiene ACE/, "el apto concedido es la noticia del club");
  assert.match(html, /expediente de salud validado/);
});

test("sin nada registrado sí dice que está en blanco, y ofrece empezar", () => {
  vm.runInContext(`S.data.perros = []; S.data.resultados = [];`, ctx);
  const html = vm.runInContext('String(V.muro(""))', ctx);
  assert.match(html, /El libro está en blanco/);
  assert.match(html, /Dar de alta un ejemplar/);
});
