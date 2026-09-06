#!/usr/bin/env node
/* ============================================================
   Lee db/schema.sql y escribe js/columnas.js con las columnas
   que cada tabla admite al escribir.

   Se hace a partir del esquema y no a mano para que las dos
   cosas no se separen nunca: si mañana cambia una tabla, se
   vuelve a ejecutar esto y ya está.

   Uso:  node herramientas/generar-columnas.mjs
   ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";

const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

/* Corta por comas, pero solo las de fuera de los paréntesis:
   check (x in ('a','b')) lleva comas que no separan columnas. */
function trocear(cuerpo){
  const partes = [];
  let acc = "", hondura = 0, comilla = false;
  for (const c of cuerpo){
    if (c === "'") comilla = !comilla;
    if (!comilla){
      if (c === "(") hondura++;
      if (c === ")") hondura--;
      if (c === "," && hondura === 0){ partes.push(acc); acc = ""; continue; }
    }
    acc += c;
  }
  if (acc.trim()) partes.push(acc);
  return partes;
}

const RESERVADAS = new Set(["primary","unique","check","foreign","constraint","exclude"]);
const tablas = {};

for (const m of sql.matchAll(/create table if not exists (\w+) \(([\s\S]*?)\n\);/g)){
  const [, tabla, cuerpo] = m;

  /* Los comentarios se quitan ANTES de trocear: llevan comas dentro
     («genes: {CACA,CJM,SDCA1,SDCA2}») y partirían las definiciones. */
  const limpio = cuerpo.split("\n")
    .map(l => l.replace(/--.*$/, ""))
    .join("\n");

  const cols = [];
  for (let def of trocear(limpio)){
    def = def.replace(/\s+/g, " ").trim();
    const c = def.match(/^([a-z_0-9]+)\s/);
    if (!c || RESERVADAS.has(c[1])) continue;
    if (/generated always as/.test(def)) continue;   // la calcula Postgres
    cols.push(c[1]);
  }
  tablas[tabla] = cols;
}

const js = `/* ============================================================
   Columnas que cada tabla admite al escribir.

   GENERADO por herramientas/generar-columnas.mjs a partir de
   db/schema.sql. No editar a mano: se vuelve a generar.

   Las columnas que calcula Postgres solo (nombre_completo,
   activo, es_criador) no están aquí a propósito: mandarlas
   haría fallar el guardado.
   ============================================================ */
"use strict";

const COLUMNAS = ${JSON.stringify(tablas, null, 2).replace(/"([a-z_0-9]+)":/g, "$1:")};
`;

writeFileSync(new URL("../js/columnas.js", import.meta.url), js);

for (const [t, c] of Object.entries(tablas)) console.log(`  ${t}: ${c.length} columnas`);
console.log("\njs/columnas.js escrito.");
