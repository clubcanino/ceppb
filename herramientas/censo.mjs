/* ============================================================
   Lectura y limpieza del censo de secretaría.

   Aquí no se escribe nada en ninguna parte: esto solo convierte
   el CSV en las filas que espera la base de datos. Así se puede
   comprobar sin tocar los datos reales.
   ============================================================ */

/* ---------- CSV ---------- */
/* Las notas de secretaría llevan comillas y saltos de línea dentro
   de la celda, así que hace falta un lector de verdad. */
export function leerCSV(texto){
  if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);   // marca de Excel
  const filas = [];
  let fila = [], campo = "", entreComillas = false;

  for (let i = 0; i < texto.length; i++){
    const c = texto[i];
    if (entreComillas){
      if (c === '"'){
        if (texto[i+1] === '"'){ campo += '"'; i++; }
        else entreComillas = false;
      } else campo += c;
      continue;
    }
    if (c === '"'){ entreComillas = true; continue; }
    if (c === ','){ fila.push(campo); campo = ""; continue; }
    if (c === "\r"){ continue; }
    if (c === "\n"){ fila.push(campo); filas.push(fila); fila = []; campo = ""; continue; }
    campo += c;
  }
  if (campo !== "" || fila.length){ fila.push(campo); filas.push(fila); }

  const cab = filas.shift();
  return filas
    .filter(f => f.some(x => x.trim() !== ""))
    .map(f => Object.fromEntries(cab.map((k, i) => [k.trim(), f[i] ?? ""])));
}

/* ---------- limpieza ---------- */
/* Los datos vienen de años de hojas de cálculo: hay espacios duros,
   dobles espacios y celdas con "True"/"False" escritos a mano. */
export function limpiar(v){
  return String(v ?? "")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const oNulo = v => { const s = limpiar(v); return s === "" ? null : s; };
const siNo  = v => /^(true|sí|si|s|1|x)$/i.test(limpiar(v));

/* ¿Existe de verdad ese día? El 31 de febrero pasa cualquier
   comprobación de formato y ninguna de calendario. */
function existe(a, m, d){
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}
const iso = (a, m, d) =>
  `${a}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

/* Acepta 2020-01-31 y 31/01/2020.

   En el censo hay fechas con el día y el mes cambiados (2022-30-06).
   Cuando el supuesto mes pasa de 12 y el día no, el cambio es seguro
   y se corrige. Lo que no se puede deducir sin inventar —el 31 de
   febrero— se descarta y queda sin fecha. */
export function fecha(v){
  const s = limpiar(v);
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m){
    const a = +m[1], mes = +m[2], dia = +m[3];
    if (existe(a, mes, dia)) return iso(a, mes, dia);
    if (existe(a, dia, mes)) return iso(a, dia, mes);   // venían cambiados
    return null;
  }

  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m){
    const dia = +m[1], mes = +m[2], a = +m[3];
    if (existe(a, mes, dia)) return iso(a, mes, dia);
    if (existe(a, dia, mes)) return iso(a, dia, mes);
    return null;
  }

  return null;
}

export function lista(v){
  const s = limpiar(v);
  if (!s) return [];
  return s.split(/[;,\/|]/).map(x => limpiar(x)).filter(Boolean);
}

export function correo(v){
  const s = limpiar(v).toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : null;
}

/* ---------- una fila del censo -> dos filas de la base de datos ---------- */
export function convertir(r){
  const numero = parseInt(limpiar(r.numero), 10);
  if (!Number.isInteger(numero)) throw new Error("Número de socio ilegible: " + r.numero);

  const socio = {
    numero,
    nombre:      limpiar(r.nombre),
    apellidos:   limpiar(r.apellidos),
    email:       correo(r.email),
    telefono:    oNulo(r.telefono),
    telefono2:   oNulo(r.telefono2),
    poblacion:   oNulo(r.poblacion),
    provincia:   oNulo(r.provincia),
    cp:          oNulo(r.cp),
    cuota:       oNulo(r.cuota),
    fecha_alta:  fecha(r.fechaAlta),
    fecha_baja:  fecha(r.fechaBaja),
    socio_honor: siNo(r.socioHonor),
    afijo:       oNulo(r.afijo),
    disciplinas: lista(r.disciplinas),
    notas:       oNulo(r.notas),
    /* El perfil nace oculto. Nadie lo ve hasta que su titular lo autorice. */
    perfil_publico: "oculto",
  };

  /* DNI, dirección e IBAN van a la tabla reservada, nunca con el perfil. */
  const privado = {
    dni:       oNulo(r.dni),
    direccion: oNulo(r.direccion),
    iban:      limpiar(r.iban).replace(/\s+/g, "") || null,
  };

  return { socio, privado, tienePrivado: !!(privado.dni || privado.direccion || privado.iban) };
}

/* ---------- revisión previa ---------- */
/* Lo que conviene mirar antes de escribir nada en la base de datos. */
export function revisar(filas){
  const numeros = new Map(), correos = new Map();
  const problemas = [];

  filas.forEach((f, i) => {
    const n = f.socio.numero;
    if (numeros.has(n)) problemas.push(`Número de socio repetido: ${n}`);
    numeros.set(n, (numeros.get(n) || 0) + 1);
    if (!f.socio.nombre || !f.socio.apellidos) problemas.push(`Fila ${i+2}: falta nombre o apellidos`);
    if (f.socio.email){
      if (!correos.has(f.socio.email)) correos.set(f.socio.email, []);
      correos.get(f.socio.email).push(f.socio);
    }
  });

  const compartidos = [...correos.entries()].filter(([, l]) => l.length > 1);
  const sinCorreo = filas.filter(f => !f.socio.email).map(f => f.socio);

  return { total: filas.length, sinCorreo, compartidos, problemas };
}
