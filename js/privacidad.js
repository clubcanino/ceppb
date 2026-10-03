/* ============================================================
   Privacidad — quién ve qué.

   Esto es la segunda barrera, no la primera. La primera son las
   políticas de la base de datos: lo que un usuario no tiene derecho
   a ver no llega siquiera al navegador. Aquí se decide qué se pinta
   de lo que sí ha llegado.

   Regla del club: el perfil de un socio nace OCULTO. Nada se
   comparte mientras él no lo autorice expresamente.
   ============================================================ */
"use strict";

const NIVELES     = [["publico","Público"],["socios","Sólo socios"],["privado","Privado"]];
const PERFIL_NIV  = [["oculto","No aparecer"],["socios","Sólo socios"],["publico","Cualquiera"]];

/* Todo empieza en privado. El IBAN no figura aquí y no es
   compartible en ningún nivel: solo su titular y la junta. */
const PRIV_DEF = {
  email:"privado", telefono:"privado", poblacion:"privado", provincia:"privado",
  afijo:"privado", disciplinas:"privado", bio:"privado", web:"privado", fechaAlta:"privado",
  rsce:"privado", variedades:"privado", grupoTrabajo:"privado", redes:"privado",
  profesion:"privado", fechaNacimiento:"privado",
};

function nivelDe(socio, campo){
  return (socio.priv || {})[campo] || PRIV_DEF[campo] || "privado";
}

function perfilVisible(s){
  if (!s) return false;
  if (SESION.esAdmin || esYo(s.id)) return true;
  const n = s.perfilPublico || "oculto";
  return n === "publico" || (n === "socios" && SESION.rol === "socio");
}

function visible(socio, campo){
  if (SESION.esAdmin || esYo(socio.id)) return true;
  if (!perfilVisible(socio)) return false;
  const n = nivelDe(socio, campo);
  return n === "publico" || (n === "socios" && SESION.rol === "socio");
}

/* Nunca revela a quien no se ha dado a conocer */
function nombreSocio(id){
  const s = byId(C("socios"), id);
  if (!s) return "";
  return perfilVisible(s) ? s.nombreCompleto : "Socio del club";
}

function perroVisible(p){
  if (SESION.esAdmin || (p.propietarioId && esYo(p.propietarioId))) return true;
  const v = p.visibilidad || "socios";
  /* El libro lo leen también los invitados de consulta: es para lo
     que se les da acceso. Lo que no ven es el directorio de socios. */
  return v === "publico" || (v === "socios" && (SESION.rol === "socio" || SESION.rol === "consulta"));
}

/* ---------- socios, invitados y bajas ----------
   Una ficha es del censo si es de socio. Las de invitado —participa
   como un socio— y las de consulta —sólo ve el libro— no cuentan en el
   censo, ni llevan número, ni pagan cuota.

   Vigente es que no esté de baja ni caducada. La baja corta desde su
   misma fecha; la caducidad, al día siguiente de la indicada. Es la
   misma cuenta que hace la base de datos, que es la que manda. */
function esDelCenso(s){ return !!s && (s.acceso || "socio") === "socio"; }
function fichaVigente(s){
  if (!s) return false;
  const h = hoy();
  if (s.fechaBaja && s.fechaBaja <= h) return false;
  if (s.accesoHasta && s.accesoHasta < h) return false;
  return true;
}
const ACCESOS = [
  ["invitado", "Invitado: lo mismo que un socio"],
  ["consulta", "Consulta: sólo ve el libro"],
];
function etiquetaAcceso(s){
  if (esDelCenso(s)) return "Socio nº " + (s.numero ?? "—");
  return s.acceso === "consulta" ? "Invitado de consulta" : "Invitado";
}
function perrosVisibles(){ return C("perros").filter(perroVisible); }

/* ---------- difusión de camadas (Cap. 8) ---------- */
function solicitudDe(machoId, hembraId){
  return C("solicitudes").find(x => x.machoId === machoId && x.hembraId === hembraId) || null;
}

/* Una camada intervariedades solo se difunde si su cruce está autorizado */
function camadaPublicable(c){
  const m = byId(C("perros"), c.padreId), h = byId(C("perros"), c.madreId);
  if (!R.esInter(m, h)) return {ok:true};
  const sol = solicitudDe(c.padreId, c.madreId);
  if (sol && sol.estado === "autorizada") return {ok:true, sol};
  return {ok:false, sol, motivo: !sol ? "Cruce intervariedades sin expediente de autorización"
    : sol.estado === "denegada" ? "La Junta Directiva denegó este cruce"
    : "Expediente pendiente de resolución"};
}
