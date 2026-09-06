/* ============================================================
   Capa de datos — el único sitio de la aplicación que habla con
   Supabase. Todo lo demás pide los datos aquí y no sabe de dónde
   salen.

   Traducción de nombres: la base de datos escribe en snake_case
   (fecha_nacimiento) y el motor de reglas heredado del prototipo
   lee camelCase (fechaNacimiento). La conversión se hace aquí, en
   un solo sitio, para no tocar la lógica del reglamento.
   ============================================================ */
"use strict";

/* ---------- colecciones que la aplicación mantiene en memoria ---------- */
const COLS = ["socios","socios_privado","perros","camadas","eventos",
              "resultados","inscripciones","pagos","solicitudes","media"];

/* La clave primaria de socios_privado es socio_id, no id */
const PK = { socios_privado: "socio_id" };

const S = {
  sb: null,                 // cliente de Supabase
  listo: false,
  data: Object.fromEntries(COLS.map(c => [c, []])),
  error: null,
};

/* ---------- snake_case  <->  camelCase ---------- */
const aCamel = s => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const aSnake = s => s.replace(/[A-Z]/g, c => "_" + c.toLowerCase());

function deFila(fila, col){
  if (!fila) return fila;
  const o = {};
  for (const k in fila) o[aCamel(k)] = fila[k];
  if (PK[col] && o.id === undefined) o.id = fila[PK[col]];
  return AJUSTES[col] ? AJUSTES[col].leer(o) : o;
}
function aFila(obj, col){
  const fuente = AJUSTES[col] ? AJUSTES[col].escribir(Object.assign({}, obj)) : obj;
  const permitidas = COLUMNAS[col];
  const o = {};
  for (const k in fuente){
    if (k === "id" && PK[col]) { o[PK[col]] = fuente[k]; continue; }
    const columna = aSnake(k);
    /* Las pantallas manejan campos de adorno (el nombre del propietario
       para pintarlo) y campos que Postgres calcula solo (nombre_completo,
       activo, es_criador). Ni unos ni otros son columnas: mandarlos haría
       fallar el guardado entero. */
    if (permitidas && !permitidas.includes(columna)) continue;

    /* Un desplegable sin elegir y una fecha en blanco llegan como texto
       vacío. Postgres no admite "" donde espera un identificador, una
       fecha o un número: sin esto, dar de alta un perro sin padre
       registrado fallaba entero. Vacío significa «no hay dato». */
    o[columna] = fuente[k] === "" ? null : fuente[k];
  }
  return o;
}

/* ------------------------------------------------------------
   Dos ajustes que la conversión automática no puede adivinar.

   1. El expediente de salud: la base de datos lo guarda en cuatro
      columnas sueltas (salud_validacion, salud_validada_por...) y
      el motor de reglas lo lee dentro de `salud.validacion`.
   2. La calificación obtenida en un evento del club: la columna es
      `organizado_ceppb` y el motor lee `organizadoCEPPB`. De este
      campo depende que una figura de apto se conceda o no, así que
      la traducción tiene que ser exacta.
   ------------------------------------------------------------ */
const AJUSTES = {
  perros: {
    leer(o){
      o.salud = Object.assign({}, o.salud);
      o.salud.validacion = {
        estado: o.saludValidacion || "pendiente",
        por:    o.saludValidadaPor || null,
        fecha:  o.saludValidadaFecha || null,
        nota:   o.saludValidacionNota || null,
      };
      return o;
    },
    escribir(o){
      /* La validación viaja desmontada en sus cuatro columnas, que es
         donde vive de verdad. Quién puede firmarla no se decide aquí:
         lo decide el trigger de la base de datos, que rechaza a quien
         no sea junta directiva. */
      if (o.salud && o.salud.validacion){
        const v = o.salud.validacion;
        o.saludValidacion      = v.estado || "pendiente";
        o.saludValidadaPor     = v.por   || null;
        o.saludValidadaFecha   = v.fecha || null;
        o.saludValidacionNota  = v.nota  || null;
      }
      if (o.salud){ o.salud = Object.assign({}, o.salud); delete o.salud.validacion; }
      return o;
    },
  },
  resultados: {
    leer(o){ o.organizadoCEPPB = !!o.organizadoCeppb; delete o.organizadoCeppb; return o; },
    escribir(o){
      if ("organizadoCEPPB" in o){ o.organizadoCeppb = !!o.organizadoCEPPB; delete o.organizadoCEPPB; }
      return o;
    },
  },
};

/* Los eventos llevan el mismo campo y con el mismo nombre raro */
AJUSTES.eventos = AJUSTES.resultados;

/* ---------- arranque ---------- */
async function abrirDB(){
  if (!CONFIG.configurado){
    S.error = "sin-configurar";
    S.listo = true;
    return;
  }
  S.sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON);
  await SESION.iniciar(S.sb);
  await recargar();
  S.listo = true;
}

/* Trae todas las colecciones. Lo que el usuario no tenga derecho a ver
   sencillamente no llega: lo filtra la base de datos, no el navegador. */
async function recargar(){
  const tareas = COLS.map(async col => {
    const { data, error } = await S.sb.from(col).select("*");
    if (error){ console.warn("[" + col + "]", error.message); S.data[col] = []; return; }
    S.data[col] = (data || []).map(f => deFila(f, col));
  });
  await Promise.all(tareas);
}

/* ---------- lectura ---------- */
const C = col => S.data[col] || [];

/* ---------- escritura ---------- */
async function guardar(col, id, datos){
  const fila = aFila(datos, col);
  if (id) fila[PK[col] || "id"] = id;
  const { data, error } = await S.sb.from(col).upsert(fila).select().single();
  if (error) { avisarError(error); throw error; }
  const guardado = deFila(data, col);
  const i = S.data[col].findIndex(x => x.id === guardado.id);
  if (i >= 0) S.data[col][i] = guardado; else S.data[col].push(guardado);
  return guardado.id;
}

async function borrar(col, id){
  const { error } = await S.sb.from(col).delete().eq(PK[col] || "id", id);
  if (error) { avisarError(error); throw error; }
  S.data[col] = S.data[col].filter(x => x.id !== id);
}

/* Los mensajes que devuelven los triggers del club están escritos en
   castellano y se le enseñan al usuario tal cual: son la explicación
   correcta de por qué no se ha podido hacer algo. */
function avisarError(error){
  const m = error && error.message ? error.message : "No se ha podido guardar";
  toast(m.replace(/^.*?:\s*/, ""));
}
