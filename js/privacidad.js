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
  return v === "publico" || (v === "socios" && SESION.rol === "socio");
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
