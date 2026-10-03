/* ============================================================
   La baja cierra la puerta, y los invitados no son socios.

   Antes, una fecha de baja sólo cambiaba una etiqueta: el socio
   seguía entrando y viéndolo todo. Y para dar acceso a alguien de
   fuera no había manera.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cargar } from "./cargar.mjs";

const lee = f => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const { esDelCenso, fichaVigente, hoy } =
  cargar(["js/util.js", "js/privacidad.js"], ["esDelCenso", "fichaVigente", "hoy"]);

const dia = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

test("la baja corta desde su misma fecha, no antes", () => {
  assert.equal(fichaVigente({}), true);
  assert.equal(fichaVigente({ fechaBaja: dia(1) }), true, "una baja futura aún deja entrar");
  assert.equal(fichaVigente({ fechaBaja: hoy() }), false, "el día de la baja ya no");
  assert.equal(fichaVigente({ fechaBaja: dia(-30) }), false);
});

test("el acceso de un invitado vale hasta el día indicado, incluido", () => {
  assert.equal(fichaVigente({ acceso: "consulta", accesoHasta: hoy() }), true);
  assert.equal(fichaVigente({ acceso: "consulta", accesoHasta: dia(-1) }), false);
});

test("los invitados no cuentan en el censo", () => {
  assert.equal(esDelCenso({}), true, "las fichas de siempre son de socio");
  assert.equal(esDelCenso({ acceso: "socio" }), true);
  assert.equal(esDelCenso({ acceso: "invitado" }), false);
  assert.equal(esDelCenso({ acceso: "consulta" }), false);
});

test("la base de datos hace la misma cuenta que la pantalla", () => {
  const sql = lee("db/schema.sql");
  for (const f of ["es_socio", "mi_socio_id"]){
    const cuerpo = sql.slice(sql.indexOf(`function ${f}()`), sql.indexOf("$$;", sql.indexOf(`function ${f}()`)));
    assert.match(cuerpo, /fecha_baja is null or fecha_baja > current_date/, `${f}: la baja corta el acceso`);
    assert.match(cuerpo, /acceso_hasta is null or acceso_hasta >= current_date/, `${f}: y la caducidad también`);
  }
  const mi = sql.slice(sql.indexOf("function mi_socio_id()"));
  assert.match(mi.slice(0, 600), /acceso <> 'consulta'/, "la consulta no participa: no tiene perros ni escribe");
});

test("ni la consulta ni una baja pueden registrar nada desde la pantalla", () => {
  const sesion = lee("js/sesion.js");
  assert.match(sesion, /if \(f && \(!fichaVigente\(f\) \|\| f\.acceso === "consulta"\)\) SESION\.socio = null;/);
  assert.match(sesion, /function puedeAportar\(\)\{ return SESION\.esAdmin \|\| !!SESION\.socio; \}/);
});

test("nadie se cambia a sí mismo el alcance, la caducidad ni la baja", () => {
  const sql = lee("db/schema.sql");
  const t = sql.slice(sql.indexOf("function proteger_socio()"), sql.indexOf("trg_proteger_socio"));
  for (const c of ["acceso", "acceso_hasta", "baja_motivo", "fecha_baja"])
    assert.match(t, new RegExp(`new\\.${c} is distinct from old\\.${c}`), c);
});
