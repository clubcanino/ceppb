/* ============================================================
   El enlace del correo tiene que dejar entrar.

   Este fallo estuvo en producción: la plataforma borraba de la
   dirección la respuesta de Supabase —la llave con la que el socio
   entra— antes de que Supabase llegara a leerla. El correo llegaba,
   el socio pulsaba el enlace, y no entraba.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lee = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");

test("al arrancar no se toca la respuesta del correo", () => {
  const app = lee("js/app.js");
  /* La función se define, pero no puede ejecutarse en el arranque */
  const seLlamaSuelta = /^\s*(window\.)?limpiarRespuestaDelCorreo\(\);\s*$/m.test(app);
  assert.equal(seLlamaSuelta, false,
    "app.js no puede borrar la llave: Supabase todavía no la ha leído");
});

test("se aparta solo después de que Supabase la haya leído", () => {
  const sesion = lee("js/sesion.js");
  const i = sesion.indexOf("getSession()");
  const j = sesion.indexOf("limpiarRespuestaDelCorreo");
  assert.notEqual(i, -1, "sesion.js tiene que leer la sesión");
  assert.notEqual(j, -1, "y después apartar la respuesta del correo");
  assert.ok(j > i, "primero leer la llave, luego apartarla; nunca al revés");
});

test("la dirección de vuelta apunta a la web del club", () => {
  const sesion = lee("js/sesion.js");
  assert.match(sesion, /emailRedirectTo:\s*location\.origin\s*\+\s*location\.pathname/,
    "el enlace del correo debe volver a la misma dirección desde la que se pidió");
});

/* Simulacro del regreso del correo, con la dirección tal cual la deja
   Supabase, para ver que la llave sigue ahí cuando toca leerla. */
test("con la llave en la dirección, Supabase llega a verla", () => {
  const llave = "#access_token=UNA_LLAVE&refresh_token=OTRA&token_type=bearer";
  const ctx = vm.createContext({
    console,
    location: {hash: llave, pathname: "/ceppb/", search: "", origin: "https://ejemplo.test"},
    history: {replaceState(a, b, url){ ctx.location.hash = String(url).split("#")[1] ? "#" + String(url).split("#")[1] : ""; }},
    setTimeout, URLSearchParams, window: {},
    toast(){}, document: {addEventListener(){}, querySelector: () => ({textContent:"", classList:{add(){},remove(){}}})},
  });
  ctx.window = ctx;

  /* La función tal como está escrita en app.js */
  const app = lee("js/app.js");
  const cuerpo = app.slice(app.indexOf("window.limpiarRespuestaDelCorreo"),
                           app.indexOf("const [rInicial"));
  vm.runInContext(cuerpo, ctx);

  /* Antes de leerla, la llave sigue en su sitio */
  assert.match(ctx.location.hash, /access_token=UNA_LLAVE/,
    "definir la función no puede borrar la llave");

  /* Y solo desaparece cuando se aparta a propósito */
  vm.runInContext("limpiarRespuestaDelCorreo()", ctx);
  assert.doesNotMatch(ctx.location.hash, /access_token/, "después sí se aparta");
  assert.equal(ctx.location.hash, "#/muro", "y deja al socio en Novedades");
});

test("si el correo devuelve un error, se le dice al socio", () => {
  const app = lee("js/app.js");
  assert.match(app, /error_description/,
    "un enlace caducado tiene que explicarse, no dejar una pantalla vacía");
});

/* ============================================================
   Entrar no puede terminar en un cartel de puerta cerrada.

   «#/entrar» es una pantalla sólo para visitantes. Quien metía su
   contraseña se quedaba ahí dentro con el rol ya cambiado, y la
   plataforma le contestaba «esta sección no está abierta a tu
   perfil, dilo en secretaría» justo después de dejarle pasar.
   ============================================================ */
import { readFileSync as leerApp } from "node:fs";
const app = leerApp(new URL("../js/app.js", import.meta.url), "utf8");
const ses = leerApp(new URL("../js/sesion.js", import.meta.url), "utf8");

test("quien ya ha entrado no se queda en la pantalla de entrar", () => {
  assert.match(app, /vista === "entrar" && SESION\.usuario/,
    "render() debe sacar de #/entrar a quien ya tiene sesión");
});

test("no se niega el acceso antes de saber quién entra", () => {
  assert.match(ses, /resuelta: false/, "SESION debe decir si ya sabe quién entra");
  assert.match(app, /!SESION\.resuelta && !def\.v\.includes\(SESION\.rol\)/,
    "render() debe esperar a saber el rol antes de cerrar una sección");
  /* y la bandera tiene que levantarse, o nadie entraría nunca */
  assert.match(ses, /SESION\.resuelta = true/);
});
