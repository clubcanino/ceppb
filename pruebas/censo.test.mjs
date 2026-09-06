/* ============================================================
   Lectura del censo de secretaría.

   El CSV viene de años de hojas de cálculo: comillas dentro de las
   notas, saltos de línea en mitad de una celda, espacios duros
   pegados a los nombres y fechas escritas de dos maneras. Si algo
   de esto se lee mal, el censo entra corrupto en la base de datos.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leerCSV, limpiar, fecha, lista, correo, convertir, revisar } from "../herramientas/censo.mjs";

/* ---------- el lector de CSV ---------- */
test("lee una tabla sencilla", () => {
  const f = leerCSV("a,b\n1,2\n3,4\n");
  assert.deepEqual(f, [{a:"1",b:"2"}, {a:"3",b:"4"}]);
});

test("respeta las comas dentro de comillas", () => {
  const f = leerCSV('numero,direccion\n11,"Valle de Leniz, 47"\n');
  assert.equal(f[0].direccion, "Valle de Leniz, 47");
});

test("respeta los saltos de línea dentro de una celda", () => {
  const f = leerCSV('numero,notas\n11,"Abona cuotas atrasadas.\nSaldo insuficiente"\n');
  assert.equal(f.length, 1, "una nota de dos líneas sigue siendo un solo socio");
  assert.match(f[0].notas, /Saldo insuficiente/);
});

test("entiende las comillas escapadas", () => {
  const f = leerCSV('a\n"dijo ""sí"" al alta"\n');
  assert.equal(f[0].a, 'dijo "sí" al alta');
});

test("se traga la marca de Excel al principio del archivo", () => {
  const f = leerCSV("﻿numero,nombre\n1,Pilar\n");
  assert.equal(f[0].numero, "1", "la primera columna no debe llamarse \\uFEFFnumero");
});

test("descarta las líneas en blanco del final", () => {
  assert.equal(leerCSV("a,b\n1,2\n\n\n").length, 1);
});

/* ---------- limpieza ---------- */
test("quita los espacios duros que trae la hoja de cálculo", () => {
  assert.equal(limpiar("José Antonio Jarque Balfagón"), "José Antonio Jarque Balfagón");
});

test("acepta las dos formas de escribir una fecha", () => {
  assert.equal(fecha("2013-04-18"), "2013-04-18");
  assert.equal(fecha("18/04/2013"), "2013-04-18");
  assert.equal(fecha("3/4/2013"),  "2013-04-03");
});

test("una fecha ilegible se descarta, no se inventa", () => {
  assert.equal(fecha("2019 aprox."), null);
  assert.equal(fecha(""), null);
});

test("el 31 de febrero no pasa: no existe en el calendario", () => {
  assert.equal(fecha("2025-02-31"), null, "no se puede adivinar qué día quiso decir secretaría");
  assert.equal(fecha("2023-02-29"), null, "2023 no fue bisiesto");
  assert.equal(fecha("2024-02-29"), "2024-02-29", "2024 sí lo fue");
});

test("una fecha con el día y el mes cambiados se endereza", () => {
  // En el censo consta 2022-30-06: no hay mes 30, así que el 30 es el día.
  assert.equal(fecha("2022-30-06"), "2022-06-30");
});

test("el censo real no deja ninguna fecha imposible", () => {
  const filas = leerCSV(readFileSync(new URL("../datos/socios.csv", import.meta.url), "utf8"))
    .map(convertir);
  for (const f of filas){
    for (const campo of ["fecha_alta", "fecha_baja"]){
      const v = f.socio[campo];
      if (v === null) continue;
      const [a, m, d] = v.split("-").map(Number);
      const real = new Date(Date.UTC(a, m - 1, d));
      assert.equal(real.getUTCDate(), d,
        `socio nº ${f.socio.numero}: ${campo} = ${v} no existe en el calendario`);
    }
  }
});

test("las disciplinas se convierten en lista", () => {
  assert.deepEqual(lista("IGP; Mondioring"), ["IGP","Mondioring"]);
  assert.deepEqual(lista(""), []);
});

test("un correo mal escrito no entra como correo", () => {
  assert.equal(correo("EJEMPLO@EJEMPLO.TEST"), "ejemplo@ejemplo.test");
  assert.equal(correo("sin arroba"), null);
  assert.equal(correo(""), null);
});

/* ---------- conversión a filas de la base de datos ---------- */
/* Socio inventado. Aquí no entra ningún dato de una persona real:
   este archivo sí vive en el repositorio. */
const fila = {
  numero:"9001", apellidos:"De Prueba Ficticio", nombre:"Ejemplo", cuota:"Individual",
  dni:"00000000T", direccion:"Calle Inventada, 1", poblacion:"Villaejemplo",
  provincia:"Girona", cp:"17454", email:"ejemplo@ejemplo.test", telefono:"600000000",
  telefono2:"", iban:"ES00 0000 0000 0000 0000 0000", fechaAlta:"", fechaBaja:"",
  activo:"True", disciplinas:"", afijo:"DE PRUEBA", esCriador:"True",
  socioHonor:"False", notas:"Remite cambio de dirección",
};

test("el perfil de un socio importado nace oculto", () => {
  assert.equal(convertir(fila).socio.perfil_publico, "oculto",
    "nadie debe ver a un socio hasta que él lo autorice");
});

test("DNI, dirección e IBAN no viajan con el perfil", () => {
  const { socio, privado } = convertir(fila);
  for (const campo of ["dni","direccion","iban"]){
    assert.equal(campo in socio, false, campo + " no puede estar en la tabla socios");
  }
  assert.equal(privado.dni, "00000000T");
  assert.equal(privado.iban, "ES000000000000000000000000".slice(0,24), "el IBAN se guarda sin espacios");
});

test("no se rellenan las columnas que calcula sola la base de datos", () => {
  const { socio } = convertir(fila);
  for (const campo of ["activo","es_criador","nombre_completo","id","auth_user_id"]){
    assert.equal(campo in socio, false, campo + " lo calcula Postgres, no nosotros");
  }
});

test("un socio sin número no se importa a ciegas", () => {
  assert.throws(() => convertir(Object.assign({}, fila, {numero:"—"})), /ilegible/);
});

test("un socio sin IBAN ni DNI no genera fila reservada vacía", () => {
  const r = convertir(Object.assign({}, fila, {dni:"", direccion:"", iban:""}));
  assert.equal(r.tienePrivado, false);
});

/* ---------- revisión previa ---------- */
test("detecta los correos que comparten dos socios", () => {
  const filas = [
    convertir(Object.assign({}, fila, {numero:"336", email:"casa@ejemplo.com"})),
    convertir(Object.assign({}, fila, {numero:"382", email:"casa@ejemplo.com"})),
    convertir(Object.assign({}, fila, {numero:"400", email:"otro@ejemplo.com"})),
  ];
  const r = revisar(filas);
  assert.equal(r.compartidos.length, 1);
  assert.equal(r.compartidos[0][1].length, 2);
});

test("detecta los socios sin correo", () => {
  const filas = [convertir(Object.assign({}, fila, {numero:"1", email:""}))];
  assert.equal(revisar(filas).sinCorreo.length, 1);
});

test("detecta un número de socio repetido", () => {
  const filas = [convertir(fila), convertir(fila)];
  assert.equal(revisar(filas).problemas.some(p => /repetido/.test(p)), true);
});

/* ---------- el censo real ---------- */
test("el censo real se lee entero y sin sorpresas", () => {
  const texto = readFileSync(new URL("../datos/socios.csv", import.meta.url), "utf8");
  const filas = leerCSV(texto).map(convertir);
  const r = revisar(filas);

  assert.equal(r.total, 347, "el club tiene 347 socios");
  assert.equal(r.problemas.length, 0, "no debe haber números repetidos ni nombres vacíos");
  assert.equal(r.sinCorreo.length, 18, "18 socios sin correo, según secretaría");

  const conCorreoPropio = filas.filter(f => f.socio.email &&
    !r.compartidos.some(([c]) => c === f.socio.email));
  const compartiendo = r.compartidos.reduce((n,[,l]) => n + l.length, 0);

  assert.equal(conCorreoPropio.length + compartiendo + r.sinCorreo.length, 347,
    "los tres grupos deben sumar el censo entero");
  assert.equal(filas.every(f => f.socio.perfil_publico === "oculto"), true);
});
