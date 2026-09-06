/* ============================================================
   La traducción entre la base de datos y el motor de reglas.

   Importa: de estas dos conversiones depende que un apto de cría
   se conceda o no. Si `organizado_ceppb` no llega bien, el club
   estaría dando ACE a ejemplares que nunca han competido en un
   evento propio.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { cargar } from "./cargar.mjs";

const { deFila, aFila } = cargar(["js/columnas.js", "js/datos.js"], ["deFila", "aFila"]);

test("snake_case de la base de datos pasa a camelCase", () => {
  const o = deFila({id:"1", fecha_nacimiento:"2020-01-01", propietario_id:"s1"}, "perros");
  assert.equal(o.fechaNacimiento, "2020-01-01");
  assert.equal(o.propietarioId, "s1");
});

test("camelCase vuelve a snake_case al guardar", () => {
  const f = aFila({nombre:"Uma", fechaNacimiento:"2020-01-01", madreId:"p9"}, "perros");
  assert.equal(f.fecha_nacimiento, "2020-01-01");
  assert.equal(f.madre_id, "p9");
});

test("socios_privado usa socio_id como clave", () => {
  const o = deFila({socio_id:"s7", iban:"ES00"}, "socios_privado");
  assert.equal(o.id, "s7");
  assert.equal(aFila({id:"s7", iban:"ES00"}, "socios_privado").socio_id, "s7");
});

test("organizado_ceppb llega al motor como organizadoCEPPB", () => {
  const r = deFila({id:"r1", organizado_ceppb:true, tipo:"estructura"}, "resultados");
  assert.equal(r.organizadoCEPPB, true, "el motor lee exactamente este nombre");
  assert.equal("organizadoCeppb" in r, false, "no debe quedar el nombre a medio traducir");
});

test("organizadoCEPPB vuelve a la columna organizado_ceppb", () => {
  const f = aFila({organizadoCEPPB:true, tipo:"estructura"}, "resultados");
  assert.equal(f.organizado_ceppb, true);
  assert.equal("organizado_c_e_p_p_b" in f, false);
});

test("el expediente de salud se arma dentro de salud.validacion", () => {
  const p = deFila({
    id:"p1", salud:{hd:"A"},
    salud_validacion:"validado", salud_validada_por:"Comisión de Cría",
    salud_validada_fecha:"2025-01-10", salud_validacion_nota:null,
  }, "perros");
  assert.equal(p.salud.validacion.estado, "validado");
  assert.equal(p.salud.validacion.por, "Comisión de Cría");
  assert.equal(p.salud.validacion.fecha, "2025-01-10");
});

test("un perro sin expediente aparece como pendiente, no como validado", () => {
  const p = deFila({id:"p1", salud:{hd:"A"}}, "perros");
  assert.equal(p.salud.validacion.estado, "pendiente");
});

test("la validación viaja en sus columnas, no dentro del JSON de salud", () => {
  const f = aFila({
    id:"p1",
    salud:{hd:"A", validacion:{estado:"validado", por:"Comisión de Cría", fecha:"2026-09-06"}},
  }, "perros");
  assert.equal(f.salud.validacion, undefined, "no puede viajar dentro del JSON de salud");
  assert.equal(f.salud_validacion, "validado", "va en su columna");
  assert.equal(f.salud_validada_por, "Comisión de Cría");
  assert.equal(f.salud_validada_fecha, "2026-09-06");
  assert.equal(f.salud.hd, "A", "los datos clínicos también");
});

test("quien no es junta no puede validar, pero eso lo decide la base de datos", () => {
  /* La pantalla no hace de portera: manda lo que le pidan y el trigger
     proteger_validacion_salud rechaza a quien no sea junta directiva.
     Aquí solo se comprueba que el dato llega en la forma que el trigger
     sabe mirar. */
  const f = aFila({salud:{hd:"A", validacion:{estado:"validado"}}}, "perros");
  assert.equal("salud_validacion" in f, true,
    "si no llegara esta columna, la junta no podría validar nunca");
});

test("guardar la salud no destruye el objeto que tenía la pantalla", () => {
  const original = {id:"p1", salud:{hd:"A", validacion:{estado:"validado"}}};
  aFila(original, "perros");
  assert.equal(original.salud.validacion.estado, "validado",
    "aFila no debe modificar lo que recibe");
});

/* ============================================================
   Lo que las pantallas manejan pero la base de datos no admite.
   ============================================================ */
test("no se envían las columnas que calcula Postgres solo", () => {
  const f = aFila({
    nombre: "Ana", apellidos: "García",
    nombreCompleto: "Ana García",   // generated always as
    activo: true,                   // generated always as
    esCriador: true,                // generated always as
  }, "socios");
  assert.equal(f.nombre, "Ana");
  for (const c of ["nombre_completo", "activo", "es_criador"]){
    assert.equal(c in f, false, c + " lo calcula Postgres: mandarlo hace fallar el guardado");
  }
});

test("no se envían los campos de adorno de las pantallas", () => {
  const f = aFila({
    nombre: "Uma", variedad: "Malinois",
    propietarioNombre: "Ana García",   // solo sirve para pintar
    criadorNombre: "Otro",
  }, "perros");
  assert.equal(f.nombre, "Uma");
  assert.equal("propietario_nombre" in f, false);
  assert.equal("criador_nombre" in f, false);
});

test("sí se envían las columnas que existen de verdad", () => {
  const f = aFila({
    nombre: "Uma", variedad: "Tervueren", sexo: "H",
    fechaNacimiento: "2021-03-01", propietarioId: "s1", loe: "LOE 123",
    adnProgenitores: true, visibilidad: "socios",
  }, "perros");
  for (const c of ["nombre","variedad","sexo","fecha_nacimiento","propietario_id",
                   "loe","adn_progenitores","visibilidad"]){
    assert.equal(c in f, true, "falta la columna " + c);
  }
});

test("las columnas salen del esquema, no de una lista escrita a mano", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  const { COLUMNAS } = cargar(["js/columnas.js"], ["COLUMNAS"]);
  for (const tabla of Object.keys(COLUMNAS)){
    assert.match(sql, new RegExp("create table if not exists " + tabla + "\\b"),
      "columnas.js habla de una tabla que no está en el esquema: " + tabla);
  }
});

test("ninguna columna del esquema se queda fuera de columnas.js", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  const { COLUMNAS } = cargar(["js/columnas.js"], ["COLUMNAS"]);

  /* Se cuentan las columnas del esquema tabla por tabla y se comparan.
     Un comentario con comas dentro llegó a comerse la columna `salud`
     entera, y el guardado de las pruebas de salud se habría perdido
     en silencio. */
  for (const m of sql.matchAll(/create table if not exists (\w+) \(([\s\S]*?)\n\);/g)){
    const [, tabla, cuerpo] = m;
    const enEsquema = [];
    for (const linea of cuerpo.split("\n")){
      const l = linea.replace(/--.*$/, "").trim();
      const c = l.match(/^([a-z_0-9]+)\s+[a-z]/);
      if (!c) continue;
      if (["primary","unique","check","foreign","constraint"].includes(c[1])) continue;
      if (/generated always as/.test(l)) continue;
      enEsquema.push(c[1]);
    }
    for (const col of enEsquema){
      assert.equal(COLUMNAS[tabla].includes(col), true,
        `falta la columna ${tabla}.${col} en columnas.js`);
    }
  }
});
