#!/usr/bin/env node
/* ============================================================
   Importa el censo de secretaría a Supabase.

   Esto se ejecuta EN TU ORDENADOR, nunca desde la web, porque
   necesita la clave de servicio de Supabase: la única que se salta
   las políticas de seguridad. Esa clave se pasa por el entorno y
   no se escribe jamás en un archivo del repositorio.

   Uso:
     export SUPABASE_URL="https://xxxx.supabase.co"
     export SUPABASE_SERVICE_KEY="eyJ..."          <- Project Settings > API > service_role

     node herramientas/importar-socios.mjs              # simulacro: no escribe nada
     node herramientas/importar-socios.mjs --escribir   # escribe de verdad
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { leerCSV, convertir, revisar } from "./censo.mjs";

const CSV = new URL("../datos/socios.csv", import.meta.url);
const ESCRIBIR = process.argv.includes("--escribir");

const URL_SB = process.env.SUPABASE_URL;
const CLAVE  = process.env.SUPABASE_SERVICE_KEY;

/* ---------- lectura y revisión ---------- */
const filas = leerCSV(readFileSync(CSV, "utf8")).map(convertir);
const informe = revisar(filas);

console.log(`\nCenso leído: ${informe.total} socios\n`);

if (informe.problemas.length){
  console.log("PROBLEMAS QUE HAY QUE MIRAR ANTES DE IMPORTAR:");
  informe.problemas.forEach(p => console.log("  · " + p));
  console.log("");
  process.exit(1);
}

const listos = filas.filter(f => f.socio.email &&
  !informe.compartidos.some(([correo]) => correo === f.socio.email));

console.log(`  ${listos.length} socios con correo propio      -> se les puede invitar`);
console.log(`  ${informe.compartidos.reduce((n,[,l])=>n+l.length,0)} socios comparten correo con otro -> hay que pedirles correo propio`);
console.log(`  ${informe.sinCorreo.length} socios sin correo             -> alta a mano en secretaría\n`);

/* ---------- listados para secretaría ---------- */
mkdirSync(new URL("../copias/", import.meta.url), { recursive: true });

const pendientes = [
  "# Socios a los que hay que pedir un correo propio",
  "",
  ...informe.compartidos.flatMap(([correo, socios]) => [
    `## ${correo}`,
    ...socios.map(s => `- nº ${s.numero} — ${s.nombre} ${s.apellidos} (${s.cuota || "sin cuota"}) · ${s.telefono || "sin teléfono"}`),
    "",
  ]),
  "# Socios sin ningún correo — reclaman su ficha a mano",
  "",
  ...informe.sinCorreo.map(s =>
    `- nº ${s.numero} — ${s.nombre} ${s.apellidos} · ${s.telefono || "sin teléfono"} · ${s.poblacion || ""}`),
].join("\n");

const rutaPend = new URL("../copias/pendientes-de-correo.md", import.meta.url);
writeFileSync(rutaPend, pendientes + "\n");
console.log("Listado para secretaría escrito en copias/pendientes-de-correo.md");
console.log("(esa carpeta está fuera del repositorio: lleva nombres y teléfonos)\n");

if (!ESCRIBIR){
  console.log("SIMULACRO: no se ha escrito nada en la base de datos.");
  console.log("Para importar de verdad, repite el comando añadiendo  --escribir\n");
  const ej = filas[0];
  console.log("Así quedaría el primer socio:");
  console.log(JSON.stringify(ej.socio, null, 2));
  console.log("y sus datos reservados van aparte, a socios_privado.\n");
  process.exit(0);
}

/* ---------- escritura ---------- */
if (!URL_SB || !CLAVE){
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el entorno.\n");
  process.exit(1);
}

async function api(ruta, cuerpo, prefer){
  const r = await fetch(`${URL_SB}/rest/v1/${ruta}`, {
    method: "POST",
    headers: {
      "apikey": CLAVE,
      "Authorization": "Bearer " + CLAVE,
      "Content-Type": "application/json",
      "Prefer": prefer,
    },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? [] : r.json();
}

/* Copia de seguridad de lo que ya hubiera, antes de tocar nada */
const previo = await fetch(`${URL_SB}/rest/v1/socios?select=*`, {
  headers: { "apikey": CLAVE, "Authorization": "Bearer " + CLAVE },
}).then(r => r.json());

if (previo.length){
  const ruta = new URL(`../copias/socios-antes-de-${new Date().toISOString().slice(0,10)}.json`, import.meta.url);
  writeFileSync(ruta, JSON.stringify(previo, null, 2));
  console.log(`Había ${previo.length} socios. Copia guardada antes de tocar nada.\n`);
}

/* De 50 en 50, para que un error no deje el censo a medias sin saber dónde */
const LOTE = 50;
let hechos = 0;

for (let i = 0; i < filas.length; i += LOTE){
  const trozo = filas.slice(i, i + LOTE);

  const guardados = await api(
    "socios?on_conflict=numero",
    trozo.map(f => f.socio),
    "resolution=merge-duplicates,return=representation");

  /* Los datos reservados se enlazan por el id que acaba de dar la base de datos */
  const porNumero = new Map(guardados.map(s => [s.numero, s.id]));
  const privados = trozo
    .filter(f => f.tienePrivado)
    .map(f => Object.assign({ socio_id: porNumero.get(f.socio.numero) }, f.privado))
    .filter(p => p.socio_id);

  if (privados.length){
    await api("socios_privado?on_conflict=socio_id", privados,
              "resolution=merge-duplicates,return=minimal");
  }

  hechos += guardados.length;
  process.stdout.write(`\r  importados ${hechos} de ${filas.length}`);
}

console.log(`\n\nCenso importado: ${hechos} socios.`);
console.log("Todos con el perfil OCULTO, como manda el reglamento del club.\n");
