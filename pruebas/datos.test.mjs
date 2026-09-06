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

const { deFila, aFila } = cargar(["js/datos.js"], ["deFila", "aFila"]);

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

test("al guardar no se envía nunca la validación: la firma la junta", () => {
  const f = aFila({
    id:"p1",
    salud:{hd:"A", validacion:{estado:"validado", por:"yo mismo"}},
    saludValidacion:"validado",
  }, "perros");
  assert.equal(f.salud.validacion, undefined, "la validación no puede viajar en el JSON de salud");
  assert.equal("salud_validacion" in f, false, "ni como columna suelta");
  assert.equal(f.salud.hd, "A", "los datos clínicos sí se guardan");
});

test("guardar la salud no destruye el objeto que tenía la pantalla", () => {
  const original = {id:"p1", salud:{hd:"A", validacion:{estado:"validado"}}};
  aFila(original, "perros");
  assert.equal(original.salud.validacion.estado, "validado",
    "aFila no debe modificar lo que recibe");
});
