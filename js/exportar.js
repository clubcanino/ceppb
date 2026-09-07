/* ============================================================
   Exportar listados.

   Se genera un CSV, que Excel, Numbers y LibreOffice abren de
   inmediato. Lleva la marca de orden de bytes al principio porque
   sin ella Excel se come los acentos y «Díaz Fandiño» acaba siendo
   «DÃ­az FandiÃ±o».

   El separador es el punto y coma: es lo que espera Excel en la
   configuración española, donde la coma es el decimal.

   OJO: estos archivos llevan datos de personas. Salen del navegador
   de quien los pide y no se guardan en ninguna parte, pero una vez
   en su ordenador son su responsabilidad.
   ============================================================ */
"use strict";

function celdaCSV(v){
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) v = v.join(" · ");
  if (typeof v === "boolean") return v ? "sí" : "no";
  const t = String(v);
  /* Excel interpreta como fórmula lo que empieza por = + - @ */
  const seguro = /^[=+\-@]/.test(t) ? "'" + t : t;
  return /[";\n\r]/.test(seguro) ? '"' + seguro.replace(/"/g, '""') + '"' : seguro;
}

function generarCSV(columnas, filas){
  const cab = columnas.map(c => celdaCSV(c.t)).join(";");
  const cuerpo = filas.map(f => columnas.map(c => celdaCSV(c.v(f))).join(";"));
  return "﻿" + [cab, ...cuerpo].join("\r\n") + "\r\n";
}

function descargar(nombre, texto, tipo){
  const blob = new Blob([texto], {type: (tipo || "text/csv") + ";charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function hoyArchivo(){
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------
   El censo
   ------------------------------------------------------------ */

/* Lo que no es reservado: sirve para listas de asistencia, envíos,
   comprobar cuotas… */
const COLUMNAS_CENSO = [
  {t:"Nº socio",     v: s => s.numero},
  {t:"Apellidos",    v: s => s.apellidos},
  {t:"Nombre",       v: s => s.nombre},
  {t:"Cuota",        v: s => s.cuota},
  {t:"Alta",         v: s => s.fechaAlta},
  {t:"Baja",         v: s => s.fechaBaja},
  {t:"Situación",    v: s => s.fechaBaja ? "Baja" : "Alta"},
  {t:"Correo",       v: s => s.email},
  {t:"Teléfono",     v: s => s.telefono},
  {t:"Teléfono 2",   v: s => s.telefono2},
  {t:"Población",    v: s => s.poblacion},
  {t:"Provincia",    v: s => s.provincia},
  {t:"CP",           v: s => s.cp},
  {t:"Afijo",        v: s => s.afijo},
  {t:"Disciplinas",  v: s => s.disciplinas},
  {t:"Cargos",       v: s => s.roles},
  {t:"Socio de honor", v: s => s.socioHonor},
  {t:"Perfil visible", v: s => ({oculto:"No aparece", socios:"Solo socios", publico:"Público"})[s.perfilPublico || "oculto"]},
  {t:"Ejemplares",   v: s => C("perros").filter(p => p.propietarioId === s.id).length},
];

/* Con DNI, dirección e IBAN. Solo para la tesorería y con aviso. */
const COLUMNAS_RESERVADAS = [
  {t:"DNI",       v: s => (byId(C("socios_privado"), s.id) || {}).dni},
  {t:"Dirección", v: s => (byId(C("socios_privado"), s.id) || {}).direccion},
  {t:"IBAN",      v: s => (byId(C("socios_privado"), s.id) || {}).iban},
];

function exportarCenso(socios, conReservados){
  if (!SESION.esAdmin) return toast("El censo solo lo exporta la junta directiva");

  const cols = conReservados
    ? [...COLUMNAS_CENSO, ...COLUMNAS_RESERVADAS]
    : COLUMNAS_CENSO;

  const orden = socios.slice().sort((a, b) => (a.numero || 0) - (b.numero || 0));
  const csv = generarCSV(cols, orden);

  descargar(`censo-ceppb-${conReservados ? "completo-" : ""}${hoyArchivo()}.csv`, csv);
  toast(`${orden.length} socios exportados`);
}

/* ------------------------------------------------------------
   Los ejemplares
   ------------------------------------------------------------ */
const COLUMNAS_EJEMPLARES = [
  {t:"Nombre",     v: p => nombrePerro(p)},
  {t:"Afijo",      v: p => p.afijo},
  {t:"Variedad",   v: p => p.variedad},
  {t:"Sexo",       v: p => p.sexo === "M" ? "Macho" : p.sexo === "H" ? "Hembra" : ""},
  {t:"Nacimiento", v: p => p.fechaNacimiento},
  {t:"LOE",        v: p => p.loe},
  {t:"Chip",       v: p => p.chip},
  {t:"Propietario",v: p => { const s = byId(C("socios"), p.propietarioId); return s ? s.nombreCompleto : ""; }},
  {t:"Padre",      v: p => { const d = byId(C("perros"), p.padreId); return d ? nombrePerro(d) : ""; }},
  {t:"Madre",      v: p => { const d = byId(C("perros"), p.madreId); return d ? nombrePerro(d) : ""; }},
  {t:"Anexo A",    v: p => R.anexoA(p).ok ? "Completo" : "Incompleto"},
  {t:"Aptos",      v: p => R.aptosDe(p, C("resultados"))},
  {t:"Consanguinidad", v: p => (consanguinidad(p.id) * 100).toFixed(2).replace(".", ",")},
  {t:"Origen",     v: p => p.origen},
];

function exportarEjemplares(perros){
  if (!SESION.esAdmin) return toast("El listado completo solo lo exporta la junta directiva");
  ponerCenso(C("perros"));
  const csv = generarCSV(COLUMNAS_EJEMPLARES,
    perros.slice().sort((a, b) => nombrePerro(a).localeCompare(nombrePerro(b), "es")));
  descargar(`ejemplares-ceppb-${hoyArchivo()}.csv`, csv);
  toast(`${perros.length} ejemplares exportados`);
}
