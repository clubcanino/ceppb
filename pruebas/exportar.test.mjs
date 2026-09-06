/* ============================================================
   Exportación de listados.

   Un CSV mal hecho no es solo feo: Excel ejecuta como fórmula lo que
   empieza por «=», y sin la marca inicial se come los acentos, así
   que «Díaz Fandiño» acaba siendo «DÃ­az FandiÃ±o» en un listado que
   va a manejar la secretaría del club.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cargar } from "./cargar.mjs";

const { generarCSV, celdaCSV } = cargar(["js/util.js", "js/exportar.js"],
                                        ["generarCSV", "celdaCSV"]);

test("una celda que empieza por = no la ejecuta Excel", () => {
  assert.equal(celdaCSV("=1+1"), "'=1+1");
  assert.equal(celdaCSV("+34600000000"), "'+34600000000");
  assert.equal(celdaCSV("-5"), "'-5");
  assert.equal(celdaCSV("@usuario"), "'@usuario");
});

test("las comillas y los puntos y coma no rompen la fila", () => {
  assert.equal(celdaCSV('Con "comillas"'), '"Con ""comillas"""');
  assert.equal(celdaCSV("Calle Mayor; 3"), '"Calle Mayor; 3"');
  assert.equal(celdaCSV("Dos\nlíneas"), '"Dos\nlíneas"');
});

test("las listas y los síes se escriben en cristiano", () => {
  assert.equal(celdaCSV(["IGP", "Mondioring"]), "IGP · Mondioring");
  assert.equal(celdaCSV(true), "sí");
  assert.equal(celdaCSV(false), "no");
  assert.equal(celdaCSV(null), "");
});

test("el archivo empieza con la marca que Excel necesita para los acentos", () => {
  const csv = generarCSV([{t:"Socio", v: x => x.n}], [{n:"Díaz Fandiño"}]);
  assert.ok(csv.startsWith("﻿"),
    "sin esto, Excel enseña «DÃ­az FandiÃ±o» en el listado del club");
  assert.match(csv, /Díaz Fandiño/);
});

test("separa por punto y coma, que es lo que espera Excel en español", () => {
  const csv = generarCSV(
    [{t:"Nº", v: x => x.n}, {t:"Nombre", v: x => x.nom}],
    [{n: 1, nom: "Ana"}]);
  assert.match(csv, /Nº;Nombre/);
  assert.match(csv, /1;Ana/);
});

test("el censo sale ordenado por número de socio", () => {
  const ex = readFileSync(new URL("../js/exportar.js", import.meta.url), "utf8");
  assert.match(ex, /sort\(\(a, b\) => \(a\.numero \|\| 0\) - \(b\.numero \|\| 0\)\)/);
});

test("el DNI y el IBAN solo salen si se piden aparte", () => {
  const ex = readFileSync(new URL("../js/exportar.js", import.meta.url), "utf8");
  const basico = ex.slice(ex.indexOf("const COLUMNAS_CENSO"), ex.indexOf("const COLUMNAS_RESERVADAS"));
  for (const campo of ["dni", "iban", "direccion"]){
    assert.doesNotMatch(basico, new RegExp("\\." + campo + "\\b"),
      `${campo} no puede salir en la exportación de todos los días`);
  }
  assert.match(ex, /COLUMNAS_RESERVADAS/, "van en su propia lista, aparte");
});

test("exportar es cosa de la junta", () => {
  const ex = readFileSync(new URL("../js/exportar.js", import.meta.url), "utf8");
  assert.match(ex, /if \(!SESION\.esAdmin\) return toast/);
});
