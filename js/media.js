/* ============================================================
   Fotos y vídeos de los ejemplares.

   Las fotos se guardan en el almacén de Supabase, no dentro de la
   base de datos: una foto de móvil son seis megas y meterlas en las
   filas hace lenta la plataforma entera para todo el mundo.

   Los vídeos no se suben: se enlaza el de YouTube, Vimeo, Instagram
   o working-dog. Alojar vídeo cuesta dinero y el club ya los tiene
   publicados en otro sitio.
   ============================================================ */
"use strict";

const PROVEEDORES = [
  [/youtube\.com|youtu\.be/i,   "YouTube"],
  [/vimeo\.com/i,               "Vimeo"],
  [/instagram\.com/i,           "Instagram"],
  [/facebook\.com|fb\.watch/i,  "Facebook"],
  [/working-dog\./i,            "working-dog"],
  [/tiktok\.com/i,              "TikTok"],
];

function proveedorDe(url){
  const u = String(url || "");
  for (const [re, nombre] of PROVEEDORES) if (re.test(u)) return nombre;
  return "Enlace";
}

/* Las fotos y los vídeos de un ejemplar o de un socio. Vienen ya
   cargados con el resto de datos: aquí solo se filtran y se ordenan,
   lo más reciente primero. */
function mediaDe(sujetoId){
  return C("media")
    .filter(m => m.perroId === sujetoId || m.socioId === sujetoId)
    .sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")));
}

/* Sube una foto de un ejemplar y la deja enlazada a su ficha */
async function subirFotoPerro(file, perroId, titulo){
  const perro = byId(C("perros"), perroId);
  if (!perro) throw new Error("No encuentro ese ejemplar");

  const img = await procesarImagen(file, {max: 1600, calidad: 0.82});
  const ruta = `perros/${perroId}/${Date.now()}.jpg`;

  const { error } = await S.sb.storage.from("media")
    .upload(ruta, img.archivo, {contentType: "image/jpeg", upsert: false});
  if (error) throw new Error(traducirAlmacen(error.message));

  const { data } = S.sb.storage.from("media").getPublicUrl(ruta);

  await guardar("media", null, {
    tipo: "foto",
    sujeto: "perro",
    perroId,
    storagePath: ruta,
    url: data.publicUrl,
    titulo: titulo || null,
    subidoPor: miSocioId(),
    fecha: hoy(),
  });

  /* La primera foto pasa a ser la de la ficha */
  if (!perro.avatarUrl){
    const n = Object.assign({}, perro, {avatarUrl: data.publicUrl});
    delete n.id;
    await guardar("perros", perroId, n);
  }
  return data.publicUrl;
}

async function borrarMedia(id){
  const m = byId(C("media"), id);
  if (!m) return;

  if (m.storagePath){
    const { error } = await S.sb.storage.from("media").remove([m.storagePath]);
    if (error) console.warn("El archivo no se pudo borrar del almacén:", error.message);
  }

  /* Si era la foto de la ficha, la ficha se queda sin ella */
  if (m.perroId){
    const p = byId(C("perros"), m.perroId);
    if (p && p.avatarUrl && p.avatarUrl === m.url){
      const otra = mediaDe(m.perroId).find(x => x.tipo === "foto" && x.id !== id);
      const n = Object.assign({}, p, {avatarUrl: otra ? otra.url : null});
      delete n.id;
      await guardar("perros", m.perroId, n);
    }
  }
  await borrar("media", id);
}

async function hacerPrincipal(perroId, mediaId){
  const m = byId(C("media"), mediaId), p = byId(C("perros"), perroId);
  if (!m || !p) return;
  const n = Object.assign({}, p, {avatarUrl: m.url});
  delete n.id;
  await guardar("perros", perroId, n);
}

function traducirAlmacen(m){
  if (/Bucket not found/i.test(m))
    return "Falta crear el almacén de fotos en Supabase (db/storage.sql)";
  if (/row-level security|not authorized/i.test(m))
    return "No tienes permiso para subir fotos de este ejemplar";
  if (/Payload too large|exceeded/i.test(m))
    return "La foto pesa demasiado incluso reducida";
  return m || "No se ha podido subir la foto";
}

/* ============================================================
   Vídeos que suben los socios

   El socio sube el vídeo de su perro, la junta lo revisa y decide.
   Hasta entonces solo lo ven él y la junta: lo que lleva el nombre
   del club sale cuando el club dice que sale.
   ============================================================ */

const VIDEO_MAX_SEGUNDOS = 300;              // cinco minutos
const VIDEO_MAX_BYTES    = 300 * 1024 * 1024; // trescientos megas

/* Cuánto dura, preguntándoselo al navegador antes de subir nada */
function duracionDeVideo(file){
  return new Promise((res, rej) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src);
      res(Math.round(v.duration));
    };
    v.onerror = () => {
      URL.revokeObjectURL(v.src);
      rej(new Error("No se ha podido leer ese vídeo. Prueba con un MP4."));
    };
    v.src = URL.createObjectURL(file);
  });
}

function minutos(seg){
  const m = Math.floor(seg / 60), s = seg % 60;
  return m + " min " + String(s).padStart(2, "0") + " s";
}

async function subirVideoPerro(file, perroId, titulo){
  const perro = byId(C("perros"), perroId);
  if (!perro) throw new Error("No encuentro ese ejemplar");
  if (!/^video\//.test(file.type))
    throw new Error("Eso no es un vídeo. Admitimos MP4, MOV y WEBM.");
  if (file.size > VIDEO_MAX_BYTES)
    throw new Error(`El vídeo pesa ${(file.size/1024/1024).toFixed(0)} MB y el máximo son 300 MB. ` +
                    `Recórtalo o bájale la calidad en el móvil antes de subirlo.`);

  const seg = await duracionDeVideo(file);
  if (seg > VIDEO_MAX_SEGUNDOS)
    throw new Error(`El vídeo dura ${minutos(seg)} y el máximo son cinco minutos. Recorta lo que sobre.`);

  const ext  = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ruta = `perros/${perroId}/video-${Date.now()}.${ext}`;

  const { error } = await S.sb.storage.from("media")
    .upload(ruta, file, {contentType: file.type, upsert: false});
  if (error) throw new Error(traducirAlmacen(error.message));

  const { data } = S.sb.storage.from("media").getPublicUrl(ruta);

  await guardar("media", null, {
    tipo: "video",
    sujeto: "perro",
    perroId,
    storagePath: ruta,
    url: data.publicUrl,
    titulo: titulo || file.name.replace(/\.[^.]+$/, ""),
    proveedor: "CEPPB",
    duracion: seg,
    subidoPor: miSocioId(),
    fecha: hoy(),
  });

  return {duracion: seg, bytes: file.size};
}

/* Los que esperan a que la junta los mire */
function videosPendientes(){
  return C("media")
    .filter(m => m.tipo === "video" && m.validado === "pendiente")
    .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));
}

async function resolverVideo(id, decision, nota){
  const m = byId(C("media"), id);
  if (!m) return;
  const n = Object.assign({}, m, {validado: decision, nota: nota || null});
  delete n.id;
  await guardar("media", id, n);
}
