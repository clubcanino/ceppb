/* ============================================================
   Armazón: menú, rutas y dibujado de la pantalla.
   ============================================================ */
"use strict";

const VISTAS = [
  {h:"", t:"La plataforma"},
  {r:"muro",     n:"Novedades",        v:["admin","socio","visitante"]},
  {r:"socios",   n:"Socios",           v:["admin","socio","visitante"], ct:()=>C("socios").filter(perfilVisible).length || null},
  {r:"perros",   n:"Ejemplares",       v:["admin","socio","visitante"], ct:()=>perrosVisibles().length || null},
  {r:"eventos",  n:"Eventos",          v:["admin","socio","visitante"], ct:()=>C("eventos").length || null},
  {r:"cargos",   n:"Cargos y jueces",  v:["admin","socio","visitante"], ct:()=>C("socios").filter(s=>(s.roles||[]).length).length || null},

  {h:"cria", t:"Cría"},
  {r:"aptos",    n:"Aptos de cría",    v:["admin","socio"]},
  {r:"cruce",    n:"Simulador de cruce", v:["admin","socio"]},
  {r:"camadas",  n:"Camadas",          v:["admin","socio"], ct:()=>C("camadas").length || null},
  {r:"intervar", n:"Cruces intervariedades", v:["admin","socio"], ct:()=>C("solicitudes").filter(x=>x.tipo==="intervariedad"&&x.estado==="pendiente").length || null},

  {h:"mio", t:"Mi área"},
  {r:"entrar",   n:"Entrar",           v:["visitante"]},
  /* «Mi perfil» y «Cuota y pagos» son de socio: una cuenta de junta sin
     ficha en el censo —la del club, por ejemplo— no tiene qué enseñar
     ahí, así que no se le ofrece. «Mi cuenta» sí: la contraseña y la
     foto las tiene todo el mundo. */
  {r:"yo",       n:"Mi perfil",        v:["socio","admin"], si:()=>!!SESION.socio},
  {r:"ajustes",  n:"Mi cuenta",        v:["socio","admin"]},
  {r:"diagnostico", n:"Diagnóstico",   v:["admin","socio","visitante"]},
  {r:"cuenta",   n:"Cuota y pagos",    v:["socio","admin"], si:()=>!!SESION.socio},

  {h:"adm", t:"Administración"},
  {r:"admin",    n:"Panel de la junta", v:["admin"]},
  {r:"validar",  n:"Validaciones",     v:["admin"], ct:()=>{
    const res = C("resultados").filter(r => r.validado === "pendiente").length;
    const sal = C("perros").filter(p => R.pendientes(p, C("resultados")).salud).length;
    const tr  = C("solicitudes").filter(x => x.tipo === "traspaso" && x.estado === "pendiente").length;
    return (res + sal + tr) || null; }},
  {r:"invitaciones", n:"Invitaciones", v:["admin"]},
  {r:"altas",    n:"Vinculación de altas", v:["admin"]},
  {r:"cobros",   n:"Cuotas y cobros",  v:["admin"]},
  {r:"admins",   n:"Administradores",  v:["admin"]},
];

const TITULOS_VISTA = {
  muro:     ["Novedades", "Lo que se mueve en el club"],
  socios:   ["Socios", "Directorio del Club Español del Perro Pastor Belga"],
  socio:    ["Perfil", "Ficha de socio"],
  perros:   ["Ejemplares", "Buscador de pastores belgas registrados"],
  perro:    ["Ficha del ejemplar", ""],
  certificado: ["Certificado del ejemplar", "Documento oficial del club con lo validado"],
  aptos:    ["Aptos de cría", "Las cinco figuras del Capítulo 2, ejemplar por ejemplar"],
  cruce:    ["Simulador de cruce", "Comprueba una alianza contra el reglamento antes de solicitarla"],
  intervar: ["Cruces intervariedades", "Expedientes de autorización previa — Capítulo 8"],
  camadas:  ["Camadas", "Declaración y difusión de camadas"],
  eventos:  ["Eventos", "Convocatorias e inscripciones"],
  cargos:   ["Cargos y jueces", "Listados oficiales del club"],
  yo:       ["Mi perfil", "Tus datos, tus perros y qué comparte cada uno"],
  ajustes:  ["Mi cuenta", "Tu contraseña, tu foto y quién te ve"],
  diagnostico: ["Diagnóstico", "Qué está pasando por dentro"],
  cuenta:   ["Cuota y pagos", "Tu situación con la tesorería del club"],
  admin:    ["Panel de la junta", "Estado del censo y de la cría"],
  validar:  ["Validaciones", "Nada cuenta hasta que la junta lo coteja con el certificado original"],
  invitaciones: ["Invitaciones", "Enviar a cada socio su enlace personal de alta"],
  altas:    ["Vinculación de altas", "Cómo cada socio accede a su propio perfil"],
  cobros:   ["Cuotas y cobros", "Domiciliaciones y recibos"],
  admins:   ["Administradores", "Cuentas con permiso de junta directiva"],
  entrar:   ["Entrar", "Acceso de socios del CEPPB"],
  alta:     ["Vincular tu cuenta", "Invitación personal de secretaría"],
};

function rutaActual(){ return (location.hash || "#/muro").slice(2).split("/"); }
function ir(r){ location.hash = "#/" + r; }

function pintarNav(){
  const [r] = rutaActual();
  const secc = [];
  VISTAS.forEach(v => {
    if (v.h !== undefined){ secc.push({t:v.t, items:[]}); return; }
    if (!v.v.includes(SESION.rol)) return;
    if (v.si && !v.si()) return;
    const ct = v.ct ? v.ct() : null;
    secc[secc.length-1].items.push(
      `<a href="#/${v.r}" class="${r===v.r?"on":""}">${esc(v.n)}` +
      (ct != null ? `<span class="ct">${ct}</span>` : "") + `</a>`);
  });
  $("#nav").innerHTML = secc.filter(s => s.items.length)
    .map(s => `<div class="nav-h">${esc(s.t)}</div>` + s.items.join("")).join("");

  $("#rol-badge").textContent =
    SESION.esAdmin ? "Junta directiva" :
    SESION.socio   ? "Socio nº " + (SESION.socio.numero ?? "") :
    SESION.usuario ? "Cuenta sin vincular" : "Visitante";
}

function pintarAcciones(){
  $("#acciones").innerHTML = SESION.usuario
    ? `<button class="btn sm" id="salir">Salir</button>`
    : `<a class="btn brand sm" href="#/entrar">Entrar</a>`;
}

function render(){
  const [r, arg] = rutaActual();
  const vista = V[r] ? r : "muro";

  const def = VISTAS.find(v => v.r === vista);
  if (def && !def.v.includes(SESION.rol)){
    $("#tt").textContent = "Sección no disponible";
    $("#ts").textContent = "";
    $("#vista").innerHTML = `<div class="empty"><b>Esta sección no está abierta a tu perfil</b>` +
      (SESION.usuario ? "Si crees que debería estarlo, dilo en secretaría."
                      : `Entra con tu correo de socio para verla.
                         <div style="margin-top:14px"><a class="btn brand" href="#/entrar">Entrar</a></div>`) +
      `</div>`;
    pintarNav(); pintarAcciones();
    return;
  }

  const [t, s] = TITULOS_VISTA[vista] || [vista, ""];
  $("#tt").textContent = t;
  $("#ts").textContent = s;

  pintarNav();
  pintarAcciones();

  if (!S.listo){
    $("#vista").innerHTML = `<div class="empty"><b>Cargando…</b>Un momento.</div>`;
    return;
  }

  if (S.error === "sin-configurar"){
    $("#vista").innerHTML = avisoSinConfigurar();
    return;
  }

  try { $("#vista").innerHTML = V[vista](arg); }
  catch(e){
    $("#vista").innerHTML = `<div class="empty"><b>No se pudo dibujar esta pantalla</b>${esc(e.message||e)}</div>`;
    console.error(e);
  }
}

function avisoSinConfigurar(){
  return `<div class="card"><div class="card-b">
    <h3>Falta conectar la base de datos</h3>
    <p>La plataforma todavía no sabe dónde está su base de datos. Abre el archivo
    <code>js/config.js</code> y escribe los dos datos que da Supabase en
    <b>Project Settings &rsaquo; API</b>: el <b>Project URL</b> y la clave <b>anon public</b>.</p>
    <p class="dim">Ninguno de los dos es una contraseña: Supabase los publica a propósito.
    Lo que protege al club son las políticas de la base de datos.</p>
  </div></div>`;
}

/* ---------- tema claro / oscuro ---------- */
const LLAVE_TEMA = "ceppb.tema";
function aplicarTema(){
  let t = null;
  try { t = localStorage.getItem(LLAVE_TEMA); } catch(e){}
  if (t) document.documentElement.setAttribute("data-theme", t);
}
function alternarTema(){
  const actual = document.documentElement.getAttribute("data-theme");
  const oscuroPorSistema = matchMedia("(prefers-color-scheme: dark)").matches;
  const ahoraOscuro = actual ? actual === "dark" : oscuroPorSistema;
  const nuevo = ahoraOscuro ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nuevo);
  try { localStorage.setItem(LLAVE_TEMA, nuevo); } catch(e){}
}

/* ---------- eventos ---------- */
document.addEventListener("click", ev => {
  const t = ev.target.closest("button, [data-ir]");
  if (!t) return;
  if (t.id === "tema") return alternarTema();
  if (t.id === "salir") return SESION.salir();
  if (t.dataset && t.dataset.ir) return ir(t.dataset.ir);
});

addEventListener("hashchange", () => {
  const [r, arg] = rutaActual();
  if (r === "alta" && arg) SESION.guardarInvitacion(arg);
  render();
});

/* ---------- arranque ---------- */
aplicarTema();

/* Al volver del correo, Supabase deja su respuesta pegada en la
   dirección (#access_token=... o #error=...). Eso no es una ruta de la
   plataforma y hay que apartarlo.

   PERO NO ANTES DE TIEMPO: esa respuesta es la llave con la que el
   socio entra, y Supabase la lee de la dirección cuando se conecta.
   Si se borra antes, el socio abre el enlace del correo y no entra.
   Por eso esta función NO se llama aquí, sino desde sesion.js, una vez
   que Supabase ya la ha leído. */
window.limpiarRespuestaDelCorreo = function(){
  const h = location.hash || "";
  if (!/(access_token|refresh_token|error|error_description)=/.test(h)) return;

  const p = new URLSearchParams(h.replace(/^#/, ""));
  const error = p.get("error_description") || p.get("error");
  history.replaceState(null, "", location.pathname + location.search + "#/muro");
  if (error) setTimeout(() => toast(decodeURIComponent(error.replace(/\+/g, " "))), 400);
};

const [rInicial, argInicial] = rutaActual();
if (rInicial === "alta" && argInicial) SESION.guardarInvitacion(argInicial);
if (!location.hash) location.hash = "#/muro";

render();
abrirDB().then(render).catch(e => {
  console.error(e);
  S.listo = true;
  render();
});
