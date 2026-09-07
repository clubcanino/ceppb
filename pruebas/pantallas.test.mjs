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
  "js/config.js", "js/util.js", "js/idiomas.js", "idiomas/ca.js", "idiomas/va.js", "idiomas/gl.js", "idiomas/eu.js", "idiomas/en.js", "idiomas/fr.js", "idiomas/de.js", "js/reglamento.js", "js/genealogia.js", "js/privacidad.js",
  "js/componentes.js", "js/sesion.js", "js/columnas.js", "js/datos.js", "js/media.js", "js/exportar.js", "js/directo.js",
  "js/formularios.js", "js/cotejo.js", "js/formularios-def.js",
  "js/vistas/entrar.js", "js/vistas/muro.js", "js/vistas/ajustes.js", "js/vistas/diagnostico.js", "js/vistas/socios.js",
  "js/vistas/perros.js", "js/vistas/certificado.js", "js/vistas/carnet.js", "js/vistas/cria.js", "js/vistas/camadas-eventos.js",
  "js/vistas/bienvenida.js", "js/vistas/mi-area.js", "js/vistas/junta.js", "js/vistas/videos.js", "js/vistas/club.js",
  "js/app.js",
];

/* Un navegador de mentira, suficiente para dibujar */
function montar(){
  const nodos = {};
  const nodo = () => ({
    innerHTML: "", textContent: "", value: "", classList: {add(){}, remove(){}},
    querySelectorAll: () => [], querySelector: () => null,
    insertAdjacentHTML(){}, focus(){}, setAttribute(){},
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

/* ============================================================
   Vídeos de los socios
   ============================================================ */
test("un vídeo sin validar no lo ve el resto del club", () => {
  const j = readFileSync(new URL("../js/vistas/junta.js", import.meta.url), "utf8");
  assert.match(j, /Esperando a la junta/,
    "su dueño tiene que saber que está esperando");
});

test("solo la junta ve la pantalla de vídeos por publicar", () => {
  vm.runInContext(`
    SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.usuario = {id:"u1", email:"socio@ejemplo.test"};
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz", nombreCompleto:"Ana Ruiz"};
    S.listo = true; S.error = null; S.data.media = [];
  `, ctx);
  assert.match(vm.runInContext('String(V.videos(""))', ctx), /Solo la junta directiva/);

  vm.runInContext(`SESION.rol = "admin"; SESION.esAdmin = true;`, ctx);
  assert.match(vm.runInContext('String(V.videos(""))', ctx), /Nada pendiente/);
});

test("con vídeos esperando, salen con su botón de publicar", () => {
  vm.runInContext(`
    S.data.perros = [{id:"p1", nombre:"Uma", propietarioId:"s1", visibilidad:"socios"}];
    S.data.socios = [{id:"s1", numero:896, nombreCompleto:"Ana Ruiz"}];
    S.data.media = [{id:"m1", tipo:"video", perroId:"p1", subidoPor:"s1",
                     titulo:"Manga larga", duracion:95, validado:"pendiente",
                     url:"https://ejemplo.test/v.mp4", fecha:"2026-09-07"}];
  `, ctx);
  const html = vm.runInContext('String(V.videos(""))', ctx);
  assert.match(html, /Manga larga/);
  assert.match(html, /1 min 35 s/, "la duración, en cristiano");
  assert.match(html, /data-video-val="validado\|m1"/);
  assert.match(html, /data-video-val="rechazado\|m1"/);
});

test("el límite es de cinco minutos y trescientos megas", () => {
  const m = readFileSync(new URL("../js/media.js", import.meta.url), "utf8");
  assert.match(m, /VIDEO_MAX_SEGUNDOS\s*=\s*300/);
  assert.match(m, /VIDEO_MAX_BYTES\s*=\s*300 \* 1024 \* 1024/);
  assert.match(m, /duracionDeVideo/, "se comprueba la duración ANTES de subir nada");
});

/* ============================================================
   Padres y abuelos por buscador
   ============================================================ */
test("padre y madre se escriben con sugerencias, no en un desplegable", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const bloque = def.slice(def.indexOf("  perro(id){"), def.indexOf("  salud(id){"));
  assert.match(bloque, /k:"padreNombre".*tipo:"buscador"/s);
  assert.match(bloque, /k:"madreNombre".*tipo:"buscador"/s);
  assert.doesNotMatch(bloque, /k:"padreId".*tipo:"select"/s,
    "con mil ejemplares en el libro, un desplegable no sirve");
});

test("se pueden meter los abuelos cuando los padres no están en el libro", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const bloque = def.slice(def.indexOf("  perro(id){"), def.indexOf("  salud(id){"));
  for (const k of ["abueloPP", "abuelaPM", "abueloMP", "abuelaMM"]){
    assert.match(bloque, new RegExp(`k:"${k}"`), "falta el campo " + k);
  }
});

test("un nombre que no está en el libro se añade en vez de perderse", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  assert.match(def, /async function perroPorNombreOAlta/);
  assert.match(def, /origen: "añadido al registrar un ejemplar"/,
    "queda marcado de dónde salió");
  assert.match(def, /visibilidad: "socios"/,
    "el libro genealógico lo ven los socios, que para eso está");
});

test("la web trae todos los perros, no solo los mil primeros", () => {
  const d = readFileSync(new URL("../js/datos.js", import.meta.url), "utf8");
  assert.match(d, /\.range\(desde, desde \+ TANDA - 1\)/,
    "Supabase corta en mil filas y el libro ya pasa de mil");
  assert.match(d, /if \(!data \|\| data\.length < TANDA\) break/);
});

/* ============================================================
   Idiomas
   ============================================================ */
/* Todas las que no son el castellano: el castellano es la clave, no
   una traducción. */
const OTRAS_LENGUAS = ["ca", "va", "gl", "eu", "en", "fr", "de"];

test("ocho idiomas: castellano, las cuatro cooficiales y las tres extranjeras", () => {
  const cs = JSON.parse(vm.runInContext('JSON.stringify(IDIOMAS.map(i => i.c))', ctx));
  assert.equal(cs.join(","), "es,ca,va,gl,eu,en,fr,de");
});

test("lo que no está traducido sale en castellano, nunca en blanco", () => {
  vm.runInContext('ponerIdioma("en")', ctx);
  assert.equal(vm.runInContext('t("Novedades")', ctx), "News");
  assert.equal(vm.runInContext('t("Una frase que nadie ha traducido")', ctx),
    "Una frase que nadie ha traducido",
    "sin traducción, el castellano; nunca una cadena vacía ni un código");
  vm.runInContext('ponerIdioma("es")', ctx);
});

test("los términos del reglamento no se traducen", () => {
  for (const idioma of OTRAS_LENGUAS){
    const tabla = JSON.parse(vm.runInContext(`JSON.stringify(TEXTOS.${idioma})`, ctx));
    const traducidos = Object.keys(tabla);
    for (const termino of ["ACE", "ACES", "ACU", "ACUS", "ACSS", "Anexo A",
                           "Malinois", "Tervueren", "Groenendael", "Laekenois"]){
      assert.equal(traducidos.includes(termino), false,
        `${termino} no debe traducirse: es igual en toda la FCI (${idioma})`);
    }
  }
});

test("todas las lenguas traducen lo mismo, sin huecos entre ellas", () => {
  const en = Object.keys(JSON.parse(vm.runInContext('JSON.stringify(TEXTOS.en)', ctx)));
  for (const idioma of OTRAS_LENGUAS.filter(l => l !== "en")){
    const otro = Object.keys(JSON.parse(vm.runInContext(`JSON.stringify(TEXTOS.${idioma})`, ctx)));
    const faltan = en.filter(k => !otro.includes(k));
    assert.equal(faltan.length, 0,
      `a ${idioma} le faltan ${faltan.length} textos que sí están en inglés: ${faltan.slice(0,3).join(", ")}`);
  }
});

test("ninguna traducción se ha quedado igual que el castellano por descuido", () => {
  /* «Mi CEPPB» es el nombre del club: no se traduce en ninguna lengua,
     igual que no se traducen Malinois ni Tervueren. */
  const nombrePropio = ["Mi CEPPB"];
  const sonIguales = {
    en: ["Pedigrí", "Público", "Privado", "Foto", "Invitaciones", "Administración"],
    fr: ["Pedigree", "Public", "Privé", "Photo", "Invitations", "Administration",
         "La plateforme", "Actualités", "De", "Messages", "Province",
         "Code de vérification"],
    de: ["Foto", "Privat", "Messages"],
    /* Palabras que en catalán, valenciano, gallego o euskera se
       escriben igual que en castellano. No están sin traducir: es que
       coinciden. */
    ca: ["La plataforma", "Socios", "Pedigrí", "Tema", "Foto", "Privat",
         "Correu", "Idioma", "Palmarés", "Junta directiva", "Visitant",
         "De", "Missatges", "Enviats", "Província", "Carnet de soci"],
    va: ["La plataforma", "Socios", "Pedigrí", "Tema", "Foto", "Privat",
         "Correu", "Idioma", "Palmarés", "Junta directiva", "Visitant",
         "De", "Missatges", "Enviats", "Província", "Carnet de soci"],
    gl: ["Cría", "Aptos de cría", "Socios", "Camadas", "Eventos", "Pedigrí",
         "Resultados", "Administración", "Diagnóstico", "Macho", "Socio",
         "Visitante", "Cancelar", "Editar", "Borrar", "Publicar", "Entrar",
         "Tema", "Público", "Privado", "Correo", "Foto", "Libro de Cría",
         "Guía rápida", "Idioma", "Palmarés", "Detalles prácticos",
         "Acceso de socios", "EN DIRECTO", "Pedigrí completo",
         "aplicado ficha por ficha", "Vídeos por publicar", "Vinculación de altas",
         "Administradores", "Descendencia", "Validado", "Completo",
         "Guía", "Puntos", "Descargar", "De", "Para", "Responder", "Borrar",
         "Mensaxes", "Sen asunto", "Escribir a un socio", "Que me escriban",
         "Socio desde", "Provincia", "Código de verificación", "Válido durante"],
    eu: ["Palmaresa"],
  };
  for (const idioma of OTRAS_LENGUAS){
    const tabla = JSON.parse(vm.runInContext(`JSON.stringify(TEXTOS.${idioma})`, ctx));
    const sospechosos = Object.entries(tabla)
      .filter(([es, tr]) => es === tr)
      .map(([es]) => es)
      .filter(es => !nombrePropio.includes(es) &&
                    !(sonIguales[idioma] || []).includes(es) &&
                    !(sonIguales[idioma] || []).includes(tabla[es]));
    assert.equal(sospechosos.length, 0,
      `en ${idioma} hay textos sin traducir: ${sospechosos.join(", ")}`);
  }
});

/* ============================================================
   Un socio corriente no ve nada de administración
   ============================================================ */
function comoSocio(){
  vm.runInContext(`
    SESION.rol = "socio"; SESION.esAdmin = false;
    SESION.usuario = {id:"u1", email:"socio@ejemplo.test"};
    SESION.socio = {id:"s1", numero:896, nombre:"Ana", apellidos:"Ruiz",
                    nombreCompleto:"Ana Ruiz", perfilPublico:"socios", priv:{}};
    S.listo = true; S.error = null;
    S.data.socios = [SESION.socio, {id:"s2", numero:2, nombre:"Otro", apellidos:"Socio",
                                    nombreCompleto:"Otro Socio", perfilPublico:"socios"}];
    S.data.perros = [{id:"p1", nombre:"Uma", propietarioId:"s1", visibilidad:"socios",
                      salud:{validacion:{estado:"pendiente"}}}];
    S.data.socios_privado = []; S.data.media = []; S.data.resultados = [];
    S.data.admins = []; S.data.invitaciones = [];
  `, ctx);
}

test("el menú no le ofrece ninguna sección de administración", () => {
  comoSocio();
  const rutas = JSON.parse(vm.runInContext(`
    JSON.stringify(VISTAS.filter(v => v.r && v.v.includes(SESION.rol) && (!v.si || v.si())).map(v => v.r))
  `, ctx));
  for (const prohibida of ["admin","validar","videos","invitaciones","altas","cobros","admins"]){
    assert.equal(rutas.includes(prohibida), false,
      `un socio no puede ver «${prohibida}» en su menú`);
  }
});

test("si escribe la dirección a mano, tampoco entra", () => {
  comoSocio();
  for (const prohibida of ["admin","validar","videos","invitaciones","altas","cobros","admins"]){
    const def = JSON.parse(vm.runInContext(
      `JSON.stringify(VISTAS.find(v => v.r === ${JSON.stringify(prohibida)}) || null)`, ctx));
    assert.ok(def, "la pantalla " + prohibida + " tiene que estar declarada");
    assert.equal(def.v.includes("socio"), false,
      `«${prohibida}» no puede estar abierta al perfil de socio`);
  }
});

test("no ve el botón de dar de alta socios ni el de exportar el censo", () => {
  comoSocio();
  const html = vm.runInContext('String(V.socios(""))', ctx);
  assert.doesNotMatch(html, /Dar de alta un socio/,
    "los socios los da de alta la junta");
  assert.doesNotMatch(html, /data-exportar/,
    "el censo no se exporta desde una cuenta de socio");
});

test("la junta sí ve esas opciones", () => {
  comoSocio();
  vm.runInContext(`SESION.rol = "admin"; SESION.esAdmin = true;`, ctx);
  const html = vm.runInContext('String(V.socios(""))', ctx);
  assert.match(html, /Dar de alta un socio/);
  assert.match(html, /data-exportar="censo"/);
  assert.match(html, /data-exportar="censo-completo"/);
});

test("la exportación con datos reservados va aparte y avisa", () => {
  const ev = readFileSync(new URL("../js/eventos.js", import.meta.url), "utf8");
  assert.match(ev, /censo-completo/);
  assert.match(ev, /confirm\(/, "hay que confirmar antes de sacar DNI e IBAN del sistema");
  assert.match(ev, /sin cifrar/, "y decir claramente lo que eso significa");
});

/* ============================================================
   El listado de ejemplares nace ordenado por nombre.

   Son más de mil perros: sin un orden, encontrar uno es imposible.
   Y el orden tiene que ser el español, con la eñe en su sitio.
   ============================================================ */
test("los ejemplares salen por orden alfabético español", () => {
  const ctx = montar();
  const tabla = vm.runInContext("tabla", ctx);
  const orden = vm.runInContext("ordenTabla", ctx);
  assert.equal(orden.per && orden.per.c, 0, "la tabla «per» debe nacer ordenada por la primera columna");
  assert.equal(orden.per && orden.per.d, false, "y de la A a la Z");

  const cols = [{t:"Ejemplar", s:p => p.nombre, r:p => p.nombre}];
  const html = tabla("per", cols, [
    {nombre:"Zorro"}, {nombre:"ábaco"}, {nombre:"Ñu"}, {nombre:"Alan"}, {nombre:"ozone"},
  ]);
  const salida = [...html.matchAll(/<td data-col="Ejemplar">([^<]*)</g)].map(m => m[1]);
  assert.deepEqual(salida, ["ábaco", "Alan", "Ñu", "ozone", "Zorro"]);
});

/* ============================================================
   La bienvenida: lo primero que ve un socio al entrar.

   Tiene que saludar, explicar qué puede hacer y —sobre todo— no
   enseñarle a un socio corriente ni una sola opción de la junta.
   ============================================================ */
function bienvenidaComo(rol){
  const ctx = montar();
  vm.runInContext(`
    SESION.rol = ${JSON.stringify(rol)};
    SESION.esAdmin = ${rol === "admin"};
    SESION.usuario = {id:"u1", email:"x@y.z"};
    SESION.socio = {id:"s1", numero:7, nombreCompleto:"Ana Ruiz López"};
    S.listo = true; S.error = null;
  `, ctx);
  return vm.runInContext("String(V.bienvenida(''))", ctx);
}

test("la bienvenida saluda por el nombre y explica por dónde se empieza", () => {
  const html = bienvenidaComo("socio");
  assert.match(html, /Bienvenido, Ana/);
  assert.match(html, /href="#\/perros"/);
  assert.match(html, /href="#\/cruce"/);
  assert.match(html, /href="#\/aptos"/);
  /* y deja clara la regla que sostiene el resto */
  assert.match(html, /junta directiva/i);
});

test("un socio corriente no ve en la bienvenida nada de administración", () => {
  const html = bienvenidaComo("socio");
  for (const r of ["#/admin", "#/validar", "#/invitaciones", "#/cobros", "#/admins", "#/altas"])
    assert.equal(html.includes(`href="${r}"`), false, "la bienvenida ofrece " + r + " a un socio");
});

test("a la junta sí se le ofrece su panel", () => {
  assert.match(bienvenidaComo("admin"), /href="#\/admin"/);
});

test("entrar lleva a la bienvenida, no a una puerta cerrada", () => {
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  assert.match(app, /vista === "entrar" && SESION\.usuario/);
  assert.match(app, /location\.hash = "#\/bienvenida"/);
});

/* ============================================================
   El idioma, a la vista.

   Estaba sólo dentro de «Mi cuenta»: quien entra en francés no
   sabe siquiera que esa pantalla existe.
   ============================================================ */
test("el idioma se puede cambiar desde la barra superior", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="socio"; SESION.usuario={id:"u1"}; SESION.socio=null;
                   S.listo=true; pintarAcciones();`, ctx);
  const html = vm.runInContext(`$("#acciones").innerHTML`, ctx);
  assert.match(html, /class="[^"]*elegir-idioma/);
  for (const c of ["es", "en", "fr", "de"])
    assert.match(html, new RegExp(`value="${c}"`), "falta el idioma " + c);
});

test("los dos selectores de idioma comparten el mismo manejador", () => {
  const ev = readFileSync(new URL("../js/eventos.js", import.meta.url), "utf8");
  assert.match(ev, /classList\.contains\("elegir-idioma"\)/);
  const aj = readFileSync(new URL("../js/vistas/ajustes.js", import.meta.url), "utf8");
  assert.match(aj, /class="inp elegir-idioma"/);
});

test("la bienvenida está traducida a las tres lenguas, no sólo el menú", () => {
  const ctx = montar();
  const T = vm.runInContext("TEXTOS", ctx);
  for (const l of ["en", "fr", "de"]){
    for (const clave of ["Da de alta tus ejemplares",
                         "Calcula el cruce antes de hacerlo",
                         "Nueve cosas que puedes hacer desde hoy",
                         "Tú decides qué se ve de ti"]){
      assert.ok(T[l] && T[l][clave], `${l} no traduce «${clave}»`);
      assert.notEqual(T[l][clave], clave, `${l} dejó «${clave}» en castellano`);
    }
  }
});

/* ============================================================
   La portada: quien no ha entrado no ve datos del club.

   Ni el número de socios, ni nombres, ni movimientos. Sólo qué es
   esto, qué podrá hacer dentro y la puerta.
   ============================================================ */
test("sin entrar no se ve ni una cifra del club", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="visitante"; SESION.usuario=null; SESION.socio=null;
                   SESION.esAdmin=false; S.listo=true; S.error=null;`, ctx);
  const html = vm.runInContext("String(V.muro(''))", ctx);
  assert.match(html, /href="#\/entrar"/, "la portada debe ofrecer entrar");
  for (const cifra of ["mast-stats", "Novedades del club", "feed-row"])
    assert.equal(html.includes(cifra), false, "la portada enseña «" + cifra + "»");
});

test("el número de socios sólo lo ve la junta", () => {
  const ctx = montar();
  const conRol = (rol) => {
    vm.runInContext(`SESION.rol=${JSON.stringify(rol)}; SESION.esAdmin=${rol === "admin"};
      SESION.usuario={id:"u1", email:"x@y.z"}; SESION.socio={id:"s1", numero:1, nombreCompleto:"A B"};
      S.listo=true; S.error=null;`, ctx);
    return vm.runInContext("String(V.muro(''))", ctx);
  };
  assert.equal(/<div class="k">Socios<\/div>/.test(conRol("socio")), false,
    "un socio corriente no debe ver el total del censo");
  assert.match(conRol("admin"), /<div class="k">Socios<\/div>/);
});

test("la interfaz no le explica al socio cómo está hecha por dentro", () => {
  const vistas = ["js/vistas/muro.js", "js/vistas/club.js", "js/vistas/junta.js",
                  "js/vistas/mi-area.js", "js/vistas/bienvenida.js", "js/vistas/perros.js"];
  /* Sólo se mira el texto que se pinta, no los comentarios del código:
     los comentarios explican el porqué y ahí sí tienen su sitio. */
  const sinComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const v of vistas){
    const txt = sinComentarios(readFileSync(new URL("../" + v, import.meta.url), "utf8"));
    for (const jerga of ["base de datos", "el servidor", "trigger", "el prototipo", "RLS"])
      assert.equal(txt.includes(jerga), false, `${v} le habla al socio de «${jerga}»`);
  }
});

/* ============================================================
   Sin entrar: ni datos, ni cifras, ni secciones del club.
   ============================================================ */
test("el menú de quien no ha entrado no lleva números al lado", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="visitante"; SESION.usuario=null; SESION.socio=null;
                   SESION.esAdmin=false; S.listo=true; pintarNav();`, ctx);
  const nav = vm.runInContext(`$("#nav").innerHTML`, ctx);
  assert.equal(/class="ct"/.test(nav), false, "el menú de visitante enseña contadores");
});

test("un visitante sólo tiene portada y puerta", () => {
  const ctx = montar();
  const abiertas = JSON.parse(vm.runInContext(
    'JSON.stringify(VISTAS.filter(v => v.r && v.v.includes("visitante")).map(v => v.r))', ctx));
  assert.deepEqual(abiertas.sort(), ["entrar", "muro"]);
});

test("la bienvenida ya no lleva el marcador de cifras", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="socio"; SESION.esAdmin=false; SESION.usuario={id:"u1"};
                   SESION.socio={id:"s1", numero:1, nombreCompleto:"Ana Ruiz"};
                   S.listo=true; S.error=null;`, ctx);
  const html = vm.runInContext("String(V.bienvenida(''))", ctx);
  assert.equal(html.includes("mast-stats"), false);
  for (const fuera of ["Palmarés", "Generaciones", "de pedigrí desplegado"])
    assert.equal(html.includes(fuera), false, "la bienvenida sigue enseñando «" + fuera + "»");
});

/* ============================================================
   El calendario de la web del club, dentro de la plataforma.
   ============================================================ */
test("eventos ofrece las convocatorias del libro y el calendario del club", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="socio"; SESION.esAdmin=false; SESION.usuario={id:"u1"};
                   SESION.socio={id:"s1", numero:1}; S.listo=true; S.error=null;`, ctx);
  /* Se abre por el calendario: es lo que se viene a buscar aquí. */
  const web = vm.runInContext("String(V.eventos(''))", ctx);
  assert.match(web, /data-tabev="web" class="on"/);

  vm.runInContext('tabEventos = "club"', ctx);
  const club = vm.runInContext("String(V.eventos(''))", ctx);
  vm.runInContext('tabEventos = "web"', ctx);
  assert.match(club, /data-tabev="club"/);
  assert.match(club, /data-tabev="web"/);
  assert.equal(club.includes("<iframe"), false, "la pestaña de resultados no empotra nada");
  assert.match(web, /<iframe[^>]+src="https:\/\/www\.ceppb\.info\/eventos"/);
  /* y siempre una salida por si el marco no carga */
  assert.match(web, /target="_blank" rel="noopener noreferrer"/);
});

test("los resultados se ven evento por evento, con su clasificación", () => {
  const ctx = montar();
  vm.runInContext(`
    SESION.rol="socio"; SESION.esAdmin=false; SESION.usuario={id:"u1"};
    SESION.socio={id:"s1", numero:1}; S.listo=true; S.error=null;
    S.data.eventos = [
      {id:"e1", nombre:"XXII CNI 2021 (CEPPB)", tipo:"trabajo", organizadoCEPPB:true},
      {id:"e2", nombre:"FMBB World Championship 2024 (IGP)", tipo:"trabajo", organizadoCEPPB:false},
    ];
    S.data.perros = [{id:"p1", nombre:"Ozone van het Dreiland", visibilidad:"socios"},
                     {id:"p2", nombre:"Haddock vom Esadera", visibilidad:"socios"}];
    S.data.resultados = [
      {id:"r1", perroId:"p1", eventoId:"e1", anio:2021, puesto:1, puntos:277, puntosSobre:300,
       calificacion:"MB", guia:"Un guía", validado:"validado", tipo:"trabajo", tipoEvento:"IGP"},
      {id:"r2", perroId:"p2", eventoId:"e1", anio:2021, puesto:2, puntos:275, puntosSobre:300,
       calificacion:"MB", guia:"Otro guía", validado:"validado", tipo:"trabajo", tipoEvento:"IGP"},
    ];
    tabEventos = "club"; eventoElegido = "";
  `, ctx);
  const html = vm.runInContext("String(V.eventos(''))", ctx);
  vm.runInContext('tabEventos = "web"', ctx);

  /* se puede elegir el evento, y salen los dos */
  assert.match(html, /id="elegir-evento"/);
  assert.match(html, /XXII CNI 2021/);
  assert.match(html, /FMBB World Championship 2024/);
  /* y la clasificación del elegido, en orden de puesto */
  assert.ok(html.indexOf("Ozone van het Dreiland") < html.indexOf("Haddock vom Esadera"),
    "la clasificación debe ir por puesto");
  assert.match(html, /277\/300/);
  assert.match(html, /Un guía/);
  /* un evento ajeno se marca como tal: no cuenta para el reglamento */
  vm.runInContext('tabEventos="club"; eventoElegido="e2"', ctx);
  const fmbb = vm.runInContext("String(V.eventos(''))", ctx);
  vm.runInContext('tabEventos="web"; eventoElegido=""', ctx);
  assert.match(fmbb, /Organiza otra entidad/);
});

/* ============================================================
   «Este ejemplar es mío».

   El libro tiene miles de fichas sin dueño, salidas del pedigrí de
   un campeonato. Reclamar la propia es la única forma de que un
   socio la gobierne — y no puede bastar con pedirlo: lo reconoce
   la junta, igual que todo lo demás.
   ============================================================ */
function fichaDePerro(rol, perro, solicitudes){
  const ctx = montar();
  vm.runInContext(`
    SESION.rol=${JSON.stringify(rol)}; SESION.esAdmin=${rol === "admin"};
    SESION.usuario={id:"u1", email:"x@y.z"};
    SESION.socio=${rol === "visitante" ? "null" : '{id:"s1", numero:1, nombreCompleto:"Ana Ruiz"}'};
    S.listo=true; S.error=null;
    S.data.socios = [{id:"s1", numero:1, nombreCompleto:"Ana Ruiz", perfilPublico:"socios"},
                     {id:"s2", numero:2, nombreCompleto:"Otro Socio", perfilPublico:"socios"}];
    S.data.perros = [${JSON.stringify(perro)}];
    S.data.solicitudes = ${JSON.stringify(solicitudes || [])};
    tabPerro = "resumen";
  `, ctx);
  return vm.runInContext(`String(V.perro(${JSON.stringify(perro.id)}))`, ctx);
}
const sinDuenio = {id:"p1", nombre:"Ozone van het Dreiland", visibilidad:"socios",
                   sexo:"M", salud:{}, historialTitularidad:[]};

test("una ficha sin titular se puede reclamar", () => {
  const html = fichaDePerro("socio", sinDuenio);
  assert.match(html, /data-form="reclamacion\|p1"/);
  assert.match(html, /no tiene titular/);
});

test("la ficha propia no se reclama a uno mismo", () => {
  const mia = Object.assign({}, sinDuenio, {propietarioId:"s1"});
  assert.equal(fichaDePerro("socio", mia).includes('data-form="reclamacion'), false);
});

test("quien no ha entrado no puede reclamar nada", () => {
  assert.equal(fichaDePerro("visitante", sinDuenio).includes('data-form="reclamacion'), false);
});

test("con una reclamación en curso no se abre otra, y se avisa", () => {
  const html = fichaDePerro("socio", sinDuenio, [{id:"x1", tipo:"reclamacion", perroId:"p1",
    estado:"pendiente", aSocioId:"s2", fecha:"2026-09-07", motivo:"LOE 12345"}]);
  assert.equal(html.includes('data-form="reclamacion'), false, "no debe dejar reclamar dos veces");
  assert.match(html, /Reclamación de titularidad pendiente/);
});

test("sólo la junta la reconoce o la deniega", () => {
  const pendiente = [{id:"x1", tipo:"reclamacion", perroId:"p1", estado:"pendiente",
                      aSocioId:"s2", fecha:"2026-09-07", motivo:"LOE 12345"}];
  const socio = fichaDePerro("socio", sinDuenio, pendiente);
  assert.equal(socio.includes('data-sol="autorizada'), false, "un socio no resuelve expedientes");
  const junta = fichaDePerro("admin", sinDuenio, pendiente);
  assert.match(junta, /data-sol="autorizada\|x1"/);
  assert.match(junta, /data-sol="denegada\|x1"/);
});

test("la reclamación autorizada cambia la titularidad, como el traspaso", () => {
  const ev = readFileSync(new URL("../js/eventos.js", import.meta.url), "utf8");
  assert.match(ev, /x\.tipo === "traspaso" \|\| x\.tipo === "reclamacion"/);
  /* y en la base de datos, que es donde manda de verdad */
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  assert.match(sql, /new\.tipo in \('traspaso', 'reclamacion'\)/);
});

/* ============================================================
   Ni un desplegable con el censo o el libro dentro.

   347 socios y 3.803 ejemplares no caben en una lista que se abre
   entera: se escriben tres letras y salen los que encajan.
   ============================================================ */
test("los campos de socio y de ejemplar se buscan, no se despliegan", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const sinComentarios = def.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of sinComentarios.matchAll(/\{[^{}]*tipo:"select"[^{}]*\}/g))
    for (const prohibido of ["optSocios()", "optPerros(", "buscaSocios()", "buscaPerros("])
      assert.equal(m[0].includes(prohibido), false,
        "sigue habiendo un desplegable con fichas dentro: " + m[0].slice(0, 70));
  /* y los que había son ahora buscadores */
  assert.equal((sinComentarios.match(/tipo:"buscarId"/g) || []).length, 8);
});

test("el simulador de cruce tampoco despliega los tres mil ejemplares", () => {
  const cria = readFileSync(new URL("../js/vistas/cria.js", import.meta.url), "utf8");
  assert.equal(/<select[^>]*id="cr-[mh]"/.test(cria), false);
  assert.match(cria, /buscadorDeFicha\("crm"/);
  assert.match(cria, /buscadorDeFicha\("crh"/);
});

test("las sugerencias no salen hasta la tercera letra", () => {
  const ctx = montar();
  const bf = vm.runInContext("buscadorDeFicha", ctx);
  const html = bf("prueba", [["s1", "Ana Ruiz (nº 1)"], ["s2", "Ana Soler (nº 2)"]], "s1", {campo:"x"});
  assert.match(html, /value="Ana Ruiz \(nº 1\)"/);
  assert.match(html, /type="hidden" name="x" value="s1"/);
  assert.equal(vm.runInContext("LETRAS_PARA_BUSCAR", ctx), 3);
});

test("dos fichas que se llaman igual se distinguen", () => {
  const ctx = montar();
  const unicas = vm.runInContext("unicas", ctx);
  const r = unicas([["a", "Alan", "LOE 111"], ["b", "Alan", "LOE 222"], ["c", "Bruno", ""]]);
  assert.equal(r[2][1], "Bruno", "lo que no se repite se queda como está");
  assert.notEqual(r[0][1], r[1][1], "dos «Alan» tienen que poder distinguirse");
  assert.match(r[0][1], /LOE 111/);
});

/* ============================================================
   Dos niveles dentro de la junta.

   Tesorería trabaja: valida, lleva el censo, cobra cuotas. Lo que
   no toca es la plataforma misma —la lista de administradores y
   los cargos del club—, y no se le dice que no puede: no se le
   ofrece.
   ============================================================ */
function comoJunta(presidencia){
  const ctx = montar();
  vm.runInContext(`
    SESION.rol="admin"; SESION.esAdmin=true; SESION.esPresidencia=${presidencia};
    SESION.usuario={id:"u1", email:"x@y.z"}; SESION.socio=null;
    SESION.resuelta=true; S.listo=true; S.error=null;
    S.data.admins=[{email:"santiagodiazf@gmail.com", nivel:"presidencia", nota:"Presidencia"},
                   {email:"tesoreria.ceppb@gmail.com", nivel:"gestion", nota:"Tesorería"}];
    pintarNav();
  `, ctx);
  return {ctx, nav: vm.runInContext('$("#nav").innerHTML', ctx)};
}

test("a gestión no se le ofrece la lista de administradores", () => {
  assert.equal(comoJunta(false).nav.includes('href="#/admins"'), false);
  assert.match(comoJunta(true).nav, /href="#\/admins"/);
});

test("y si escribe la dirección a mano, tampoco entra", () => {
  const {ctx} = comoJunta(false);
  vm.runInContext('location.hash = "#/admins"; render();', ctx);
  assert.match(vm.runInContext('$("#tt").textContent', ctx), /no disponible/i);
});

test("gestión ve quién es quién, pero no edita la lista", () => {
  const editar = p => {
    const {ctx} = comoJunta(p);
    return vm.runInContext("String(V.admins(''))", ctx);
  };
  assert.equal(editar(false).includes('data-form="admins|"'), false);
  assert.match(editar(true), /data-form="admins\|"/);
  /* el alcance de cada cuenta sí se ve, para saber quién puede qué */
  assert.match(editar(false), /Presidencia<\/span>/);
  assert.match(editar(false), /Gestión<\/span>/);
});

test("gestión conserva todo el trabajo diario", () => {
  const nav = comoJunta(false).nav;
  for (const r of ["#/validar", "#/socios", "#/cobros", "#/invitaciones", "#/videos", "#/admin"])
    assert.ok(nav.includes(`href="${r}"`), "gestión debería seguir teniendo " + r);
});

test("la base de datos es la que manda, no la pantalla", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  assert.match(sql, /function es_presidencia\(\)/);
  assert.match(sql, /create policy admins_escritura on admins for all\s*\n\s*using \(es_presidencia\(\)\)/);
  assert.match(sql, /new\.roles is distinct from old\.roles and not es_presidencia\(\)/);
});

test("la portada enlaza el formulario de alta del club", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="visitante"; SESION.usuario=null; SESION.socio=null;
                   SESION.esAdmin=false; S.listo=true; S.error=null;`, ctx);
  const html = vm.runInContext("String(V.muro(''))", ctx);
  assert.match(html, /href="https:\/\/www\.ceppb\.info\/inscripcion"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
});

test("los reglamentos se pueden descargar desde la plataforma", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="socio"; SESION.esAdmin=false; SESION.usuario={id:"u1"};
                   SESION.socio={id:"s1", numero:1, nombreCompleto:"Ana Ruiz"};
                   S.listo=true; S.error=null;`, ctx);
  const bienvenida = vm.runInContext("String(V.bienvenida(''))", ctx);
  const cfg = JSON.parse(vm.runInContext("JSON.stringify(CONFIG.REGLAMENTOS)", ctx));
  assert.equal(cfg.length, 2, "el Reglamento de Cría y el Anexo A");
  for (const r of cfg){
    assert.match(r.u, /^https:\/\/www\.ceppb\.info\//, "se enlaza a la web del club");
    assert.ok(bienvenida.includes(r.u), "falta en la bienvenida: " + r.t);
  }
  /* y se descargan, no se quedan mirando */
  assert.match(bienvenida, /download/);
  assert.match(bienvenida, /target="_blank" rel="noopener noreferrer"/);
});

test("un expediente abierto por error se puede retirar; uno resuelto no", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  assert.match(sql, /create policy solicitudes_borrado on solicitudes for delete\s*\n\s*using \(es_admin\(\) and estado = 'pendiente'\)/);
  /* y sólo la junta tiene el botón */
  const perros = readFileSync(new URL("../js/vistas/perros.js", import.meta.url), "utf8");
  const i = perros.indexOf('data-retirar=');
  assert.ok(i > 0, "falta el botón de retirar");
  assert.ok(perros.slice(0, i).lastIndexOf("SESION.esAdmin") >
            perros.slice(0, i).lastIndexOf("</div>"), "el botón debe ir dentro del bloque de la junta");
  /* y avisa de que denegar es lo normal */
  const ev = readFileSync(new URL("../js/eventos.js", import.meta.url), "utf8");
  assert.match(ev, /deniégala/);
});

test("la resolución de la junta queda escrita en la ficha del perro", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  assert.match(sql, /'resolucion', new\.resolucion/);
  assert.match(sql, /'documento', new\.documento/);
  assert.match(sql, /'tipo', new\.tipo/);
});

/* ============================================================
   Los enlaces a working-dog.

   La ficha necesita el identificador Y el nombre con guiones: sin
   el nombre devuelve «página no encontrada». El pedigrí ampliado
   va sólo con el identificador.
   ============================================================ */
test("el enlace a la ficha lleva el nombre del perro, o no funciona", () => {
  const ctx = montar();
  const enlace = vm.runInContext("enlaceWorkingDog", ctx);
  const pedigri = vm.runInContext("pedigriWorkingDog", ctx);

  const gas = {nombre:"Gas de Azarbe", workingdogUrl:"https://es.working-dog.com/dogs-details/6431570"};
  assert.equal(enlace(gas), "https://es.working-dog.com/dogs-details/6431570/Gas-de-Azarbe");
  assert.equal(pedigri(gas), "https://es.working-dog.com/dog/x-6431570/extended-pedigree");

  /* el identificador se saca lo mismo de una dirección que de la otra */
  const ozone = {nombre:"Ozone van het Dreiland",
                 workingdogUrl:"https://es.working-dog.com/dog/x-3119259/extended-pedigree"};
  assert.match(enlace(ozone), /dogs-details\/3119259\/Ozone-van-het-Dreiland$/);

  /* sin enlace guardado no se inventa ninguno */
  assert.equal(enlace({nombre:"Nadie"}), null);
  assert.equal(pedigri({nombre:"Nadie"}), null);
});

test("la ficha usa el enlace recompuesto, no el que había guardado", () => {
  const perros = readFileSync(new URL("../js/vistas/perros.js", import.meta.url), "utf8");
  assert.equal(/href="\$\{esc\(p\.workingdogUrl\)\}"/.test(perros), false,
    "queda un enlace sin recomponer: daría página no encontrada");
  assert.match(perros, /esc\(enlaceWorkingDog\(p\)\)/);
  assert.match(perros, /esc\(pedigriWorkingDog\(p\)\)/);
});

/* ============================================================
   Las invitaciones.

   Viven en su propia tabla, con su token y su caducidad. Antes se
   guardaban dentro de la ficha del socio, en un campo que no
   existe: se descartaban al grabar y el estado no se movía nunca
   de «Sin invitar».
   ============================================================ */
test("la invitación se guarda en su tabla, no dentro del socio", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  const club = readFileSync(new URL("../js/vistas/club.js", import.meta.url), "utf8");
  const ev = readFileSync(new URL("../js/eventos.js", import.meta.url), "utf8");
  for (const [f, txt] of [["formularios-def.js", def], ["club.js", club], ["eventos.js", ev]]){
    const sinComentarios = txt.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.equal(/guardar\("socios",[^)]*invitacion/.test(sinComentarios), false,
      f + " sigue guardando la invitación dentro del socio");
    assert.equal(/cuentaVinculada/.test(sinComentarios), false,
      f + " usa «cuentaVinculada», que no existe");
  }
  assert.match(def, /guardar\("invitaciones", null, \{token, socioId:id, estado:"enviada"\}\)/);
});

test("quien ya tiene cuenta figura como reclamado, lo diga o no la invitación", () => {
  const club = readFileSync(new URL("../js/vistas/club.js", import.meta.url), "utf8");
  assert.match(club, /if \(s\.authUserId\) return "aceptada"/);
});

test("el enlace de alta apunta a la plataforma, no a la web del club", () => {
  const club = readFileSync(new URL("../js/vistas/club.js", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");     // el comentario sí puede nombrarla
  assert.equal(club.includes("ceppb.info/alta/"), false,
    "esa dirección no existe: el socio se encuentra una página no encontrada");
  assert.match(club, /baseDeLaPlataforma\(\) \+ "#\/alta\/" \+ token/);

  const ctx = montar();
  const base = vm.runInContext("baseDeLaPlataforma()", ctx);
  assert.match(base, /\/$/, "la base termina en barra");
});

test("la pantalla de altas dice de verdad quién ha entrado", () => {
  const junta = readFileSync(new URL("../js/vistas/junta.js", import.meta.url), "utf8");
  assert.match(junta, /socios\.filter\(s => s\.authUserId\)/);
  /* y saca a la luz las cuentas que no están atadas a ninguna ficha */
  assert.match(junta, /Cuentas sin ficha de socio/);
});

/* ============================================================
   Sólo entra quien está en el censo, y entra en su ficha.

   Antes bastaba con crearse una cuenta con cualquier correo: la
   plataforma daba por socio a todo el que se autenticaba. Cuatro
   personas del censo entraron sin quedar atadas a su propia ficha
   porque nunca se había enviado una invitación.
   ============================================================ */
test("ser socio es tener ficha, no haberse registrado", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  const mig = readFileSync(new URL("../db/migraciones/2026-09-07-solo-el-censo.sql", import.meta.url), "utf8");
  assert.match(mig, /create or replace function es_socio\(\)[\s\S]*?select exists \(select 1 from socios where auth_user_id = auth\.uid\(\)\)/);
  /* y de ahí cuelga lo que se ve: el libro es para socios */
  assert.match(sql, /visibilidad = 'socios' and es_socio\(\)/);
});

test("la vinculación comprueba el correo, la confirmación y que nadie se adelantó", () => {
  const mig = readFileSync(new URL("../db/migraciones/2026-09-07-solo-el-censo.sql", import.meta.url), "utf8");
  const f = mig.slice(mig.indexOf("function vincular_a_mi_ficha"));
  assert.match(f, /lower\(s\.email\) = lower\(u\.email\)/);
  assert.match(f, /s\.auth_user_id is null/);
  assert.match(f, /u\.email_confirmed_at is not null/);
  assert.match(f, /Tu cuenta ya está atada a una ficha/);
});

test("una sola ficha se ata sola; varias, se preguntan", () => {
  const ses = readFileSync(new URL("../js/sesion.js", import.meta.url), "utf8");
  assert.match(ses, /if \(l\.length === 1\)/);
  assert.match(ses, /else if \(l\.length > 1\)/);
  assert.match(ses, /SESION\.fichasPosibles/);
});

test("quien no está en el censo no ve el libro", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="sin-ficha"; SESION.esAdmin=false;
    SESION.usuario={id:"u1", email:"dequien@ejemplo.test"}; SESION.socio=null;
    SESION.fichasPosibles=[]; S.listo=true; S.error=null; pintarNav();`, ctx);
  const html = vm.runInContext("String(V.muro(''))", ctx);
  assert.match(html, /no consta en el censo/i);
  assert.match(html, /dequien@ejemplo\.test/);
  /* ni una sección del libro en su menú */
  const nav = vm.runInContext('$("#nav").innerHTML', ctx);
  for (const r of ["#/perros", "#/socios", "#/aptos", "#/cruce", "#/camadas", "#/eventos"])
    assert.equal(nav.includes(`href="${r}"`), false, "le ofrece " + r);
});

test("a la familia se le pregunta cuál de las fichas es la suya", () => {
  const ctx = montar();
  vm.runInContext(`SESION.rol="sin-ficha"; SESION.esAdmin=false;
    SESION.usuario={id:"u1", email:"familia@ejemplo.test"}; SESION.socio=null;
    SESION.fichasPosibles=[{id:"s1",numero:336,nombre:"Ricardo Salazar"},
                           {id:"s2",numero:382,nombre:"Núria García"}];
    S.listo=true; S.error=null;`, ctx);
  const html = vm.runInContext("String(V.muro(''))", ctx);
  assert.match(html, /data-vincular="s1"/);
  assert.match(html, /data-vincular="s2"/);
  assert.match(html, /Ricardo Salazar/);
  assert.match(html, /336/);
});

/* ============================================================
   El buscador de arriba, «me gusta» y los mensajes.
   ============================================================ */
test("el buscador busca de verdad, y sólo entre lo que se puede ver", () => {
  const ctx = montar();
  vm.runInContext(`
    SESION.rol="socio"; SESION.esAdmin=false; SESION.usuario={id:"u1"};
    SESION.socio={id:"s1", numero:1, nombreCompleto:"Ana Ruiz"};
    S.listo=true; S.error=null;
    S.data.socios=[{id:"s1", numero:1, nombreCompleto:"Ana Ruiz", perfilPublico:"socios"},
                   {id:"s2", numero:2, nombreCompleto:"Bruno Soler", perfilPublico:"oculto"}];
    S.data.perros=[{id:"p1", nombre:"Ozone van het Dreiland", visibilidad:"socios", loe:"LOE 123"},
                   {id:"p2", nombre:"Rania de Scofos", visibilidad:"privado"}];
  `, ctx);
  const buscar = vm.runInContext("buscarEnElClub", ctx);

  /* hace falta escribir algo: no se vuelca el libro entero */
  assert.equal(buscar("o").length, 0, "con una letra no se vuelca el libro");
  const r = buscar("ozone");
  assert.equal(r.length, 1);
  assert.equal(r[0].ir, "perro/p1");

  /* un perfil cerrado no sale, aunque se escriba su nombre entero */
  assert.equal(buscar("Bruno Soler").length, 0, "un perfil cerrado no sale");
  /* el propio, sí */
  assert.equal(buscar("Ana Ruiz").length, 1);
  /* y se busca también por LOE */
  assert.equal(buscar("LOE 123").length, 1);
});

test("«me gusta»: uno por socio y perro, y sólo si eres socio", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  assert.match(sql, /primary key \(perro_id, socio_id\)/, "no se puede votar dos veces");
  assert.match(sql, /create policy megusta_propio on megusta for insert with check \(socio_id = mi_socio_id\(\)\)/,
    "nadie da «me gusta» en nombre de otro");
  const perros = readFileSync(new URL("../js/vistas/perros.js", import.meta.url), "utf8");
  assert.match(perros, /if \(!SESION\.socio\) return "";/);
});

test("los mensajes no enseñan el correo de nadie", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  /* sólo los ven los dos implicados: ni la junta */
  assert.match(sql, /create policy mensajes_lectura on mensajes for select\s*\n\s*using \(de_id = mi_socio_id\(\) or para_id = mi_socio_id\(\)\)/);
  assert.equal(/mensajes_lectura[^;]*es_admin\(\)/.test(sql), false,
    "la junta no lee el correo de los socios");
  /* se escribe en nombre propio, no a uno mismo, y no a quien dijo que no */
  assert.match(sql, /de_id = mi_socio_id\(\)\s*\n\s*and para_id <> mi_socio_id\(\)/);
  assert.match(sql, /s\.id = para_id and s\.acepta_mensajes/);
  /* y lo dicho, dicho está */
  assert.match(sql, /Un mensaje enviado no se puede reescribir/);
});

test("la bandeja está en Mi área y cuenta los sin leer", () => {
  const app = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
  assert.match(app, /\{r:"mensajes", n:"Mensajes"/);
  assert.match(app, /m\.paraId === miSocioId\(\) && !m\.leido/);
});

test("se puede escribir a cualquier socio que lo acepte, sin ver sus datos", () => {
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  const mig = readFileSync(new URL("../db/migraciones/2026-09-07-poder-escribirse.sql", import.meta.url), "utf8");

  /* la lista sale de una función que devuelve el nombre y nada más */
  const f = mig.slice(mig.indexOf("function socios_a_los_que_escribir"));
  const cabecera = f.slice(0, f.indexOf("$$", f.indexOf("$$") + 2));
  for (const dato of ["email", "telefono", "direccion", "iban", "dni"])
    assert.equal(new RegExp("s\\." + dato).test(cabecera), false,
      "la lista de destinatarios filtra " + dato);
  assert.match(cabecera, /s\.nombre_completo/);
  /* y sólo la ven los socios */
  assert.match(cabecera, /where es_socio\(\)/);

  /* quien no quiere, lo apaga; por defecto está encendido */
  assert.match(sql, /acepta_mensajes boolean not null default true/);
});

test("una cuenta huérfana se puede atar a su ficha, y sólo la junta", () => {
  const def = readFileSync(new URL("../js/formularios-def.js", import.meta.url), "utf8");
  assert.match(def, /atarCuenta\(email\)/);
  assert.match(def, /if\(!SESION\.esAdmin\) return toast\("Sólo la junta directiva"\)/);
  /* sólo se ofrecen fichas que no tengan ya cuenta */
  assert.match(def, /\.filter\(x => !x\.authUserId\)/);
});

/* ============================================================
   El carnet de socio.

   Se enseña, así que no debe llevar lo que no hace falta enseñar.
   ============================================================ */
function carnetDe(rol, socio){
  const ctx = montar();
  vm.runInContext(`
    SESION.rol=${JSON.stringify(rol)}; SESION.esAdmin=${rol === "admin"};
    SESION.usuario={id:"u1", email:"x@y.z"};
    SESION.socio=${JSON.stringify(socio)};
    S.listo=true; S.error=null;
    S.data.socios=[${JSON.stringify(socio)},
                   {id:"s9", numero:9, nombreCompleto:"Otro Socio", cuota:"Individual"}];
    S.data.socios_privado=[{socioId:"0a39a65a-1671-4bc1-9bfe-b9676e11690f",
                            dni:"00000000T", direccion:"Calle Falsa 1",
                            iban:"ES0000000000000000000000"}];
  `, ctx);
  return { ctx, html: vm.runInContext(`String(V.carnet("${socio.id}"))`, ctx) };
}
const socioPrueba = {id:"0a39a65a-1671-4bc1-9bfe-b9676e11690f", numero:896,
  nombreCompleto:"Ana Ruiz López",
  cuota:"Individual", fechaAlta:"2015-03-12", provincia:"Madrid", afijo:"de Prueba",
  roles:["Junta Directiva"]};

test("el carnet lleva lo que un carnet lleva", () => {
  const { html } = carnetDe("socio", socioPrueba);
  assert.match(html, /Ana Ruiz López/);
  assert.match(html, />896</);
  assert.match(html, /Individual/);
  assert.match(html, /de Prueba/);
  /* y un código con el que comprobar que es auténtico */
  assert.match(html, /CEPPB-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}/);
});

test("y no lleva lo que no hace falta enseñar", () => {
  const { html } = carnetDe("socio", socioPrueba);
  for (const dato of ["00000000T", "Calle Falsa", "ES00000000"])
    assert.equal(html.includes(dato), false, "el carnet enseña " + dato);
});

test("cada socio saca el suyo, no el de otro", () => {
  const ctx = montar();
  vm.runInContext(`
    SESION.rol="socio"; SESION.esAdmin=false; SESION.usuario={id:"u1"};
    SESION.socio={id:"s1", numero:1, nombreCompleto:"Ana"};
    S.listo=true; S.error=null;
    S.data.socios=[{id:"s1", numero:1, nombreCompleto:"Ana"},
                   {id:"s9", numero:9, nombreCompleto:"Otro Socio"}];
  `, ctx);
  const ajeno = vm.runInContext('String(V.carnet("s9"))', ctx);
  assert.match(ajeno, /Cada socio saca el suyo|expide su titular/);
  assert.equal(ajeno.includes("Otro Socio"), false);
  /* la junta sí puede sacarlo, que para eso lleva el censo */
  const junta = carnetDe("admin", socioPrueba);
  assert.match(junta.html, /Ana Ruiz López/);
});

test("un socio de baja lo lleva marcado", () => {
  const baja = Object.assign({}, socioPrueba, {fechaBaja:"2024-01-31"});
  const { html } = carnetDe("socio", baja);
  assert.match(html, /chip block/);
  assert.equal(/Válido durante/.test(html), false);
});
