#!/usr/bin/env node
/* ============================================================
   Convierte el censo en un archivo SQL para pegar en el editor
   de Supabase.

   El archivo resultante lleva los datos reales de 347 personas:
   se escribe en copias/, que está fuera del repositorio, y se
   borra en cuanto se haya usado.

   Uso:  node herramientas/generar-sql.mjs
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { leerCSV, convertir } from "./censo.mjs";

const filas = leerCSV(readFileSync(new URL("../datos/socios.csv", import.meta.url), "utf8"))
  .map(convertir);

/* Un único literal JSON en lugar de 347 INSERT con comillas escapadas
   a mano: Postgres lo desmonta con jsonb_to_recordset y así no hay
   ni una comilla que se pueda colar mal. */
const datos = filas.map(f => ({
  numero: f.socio.numero,
  nombre: f.socio.nombre,
  apellidos: f.socio.apellidos,
  email: f.socio.email,
  telefono: f.socio.telefono,
  telefono2: f.socio.telefono2,
  poblacion: f.socio.poblacion,
  provincia: f.socio.provincia,
  cp: f.socio.cp,
  cuota: f.socio.cuota,
  fecha_alta: f.socio.fecha_alta,
  fecha_baja: f.socio.fecha_baja,
  socio_honor: f.socio.socio_honor,
  afijo: f.socio.afijo,
  disciplinas: f.socio.disciplinas,
  notas: f.socio.notas,
  dni: f.privado.dni,
  direccion: f.privado.direccion,
  iban: f.privado.iban,
}));

const json = JSON.stringify(datos).replace(/'/g, "''");

const sql = `-- ============================================================
--  Censo del CEPPB: ${filas.length} socios.
--
--  ATENCIÓN: este archivo contiene DNI, direcciones e IBAN reales.
--  No subir a ningún sitio. Bórralo en cuanto lo hayas ejecutado.
--
--  Todos los socios entran con el perfil OCULTO, como manda el
--  reglamento: nadie ve a nadie hasta que lo autorice.
-- ============================================================

with datos as (
  select * from jsonb_to_recordset('${json}'::jsonb) as x(
    numero      integer,
    nombre      text,
    apellidos   text,
    email       text,
    telefono    text,
    telefono2   text,
    poblacion   text,
    provincia   text,
    cp          text,
    cuota       text,
    fecha_alta  date,
    fecha_baja  date,
    socio_honor boolean,
    afijo       text,
    disciplinas jsonb,
    notas       text,
    dni         text,
    direccion   text,
    iban        text
  )
),
altas as (
  insert into socios (
    numero, nombre, apellidos, email, telefono, telefono2, poblacion, provincia,
    cp, cuota, fecha_alta, fecha_baja, socio_honor, afijo, disciplinas, notas,
    perfil_publico)
  select
    d.numero, d.nombre, d.apellidos, d.email, d.telefono, d.telefono2, d.poblacion,
    d.provincia, d.cp, d.cuota, d.fecha_alta, d.fecha_baja, d.socio_honor, d.afijo,
    coalesce(array(select jsonb_array_elements_text(d.disciplinas)), '{}'::text[]),
    d.notas, 'oculto'
  from datos d
  on conflict (numero) do update set
    nombre = excluded.nombre, apellidos = excluded.apellidos, email = excluded.email,
    telefono = excluded.telefono, telefono2 = excluded.telefono2,
    poblacion = excluded.poblacion, provincia = excluded.provincia, cp = excluded.cp,
    cuota = excluded.cuota, fecha_alta = excluded.fecha_alta,
    fecha_baja = excluded.fecha_baja, socio_honor = excluded.socio_honor,
    afijo = excluded.afijo, disciplinas = excluded.disciplinas, notas = excluded.notas
  returning id, numero
)
insert into socios_privado (socio_id, dni, direccion, iban)
select a.id, d.dni, d.direccion, d.iban
from altas a join datos d on d.numero = a.numero
where d.dni is not null or d.direccion is not null or d.iban is not null
on conflict (socio_id) do update set
  dni = excluded.dni, direccion = excluded.direccion, iban = excluded.iban;

-- Comprobación
select
  (select count(*) from socios)         as socios,
  (select count(*) from socios_privado) as con_datos_reservados,
  (select count(*) from socios where email is not null) as con_correo,
  (select count(*) from socios where perfil_publico = 'oculto') as ocultos;
`;

mkdirSync(new URL("../copias/", import.meta.url), { recursive: true });
const ruta = new URL("../copias/censo.sql", import.meta.url);
writeFileSync(ruta, sql);

console.log(`\n${filas.length} socios convertidos a SQL.`);
console.log(`Archivo: copias/censo.sql  (${(sql.length/1024).toFixed(0)} KB)`);
console.log(`\nContiene datos reales. Está fuera del repositorio. Bórralo al terminar.\n`);
