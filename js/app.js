/* ============================================================
   Armazón: menú, rutas y dibujado de la pantalla.
   ============================================================ */
"use strict";

/* Quién ve cada sección. «visitante» es quien no ha entrado: sólo la
   portada y la puerta. El libro es de los socios del club, y no se
   enseña de fuera ni el censo, ni los ejemplares, ni los cargos. */
const VISTAS = [
  {h:"", t:"La plataforma"},
  {r:"muro",     n:"Novedades",        v:["admin","socio","visitante","sin-ficha"]},
  {r:"socios",   n:"Socios",           v:["admin","socio"], ct:()=>C("socios").filter(perfilVisible).length || null},
  {r:"perros",   n:"Ejemplares",       v:["admin","socio"], ct:()=>perrosVisibles().length || null},
  {r:"eventos",  n:"Eventos",          v:["admin","socio"], ct:()=>C("eventos").length || null},
  {r:"cargos",   n:"Cargos y jueces",  v:["admin","socio"], ct:()=>C("socios").filter(s=>(s.roles||[]).length).length || null},

  {h:"cria", t:"Cría"},
  {r:"aptos",    n:"Aptos de cría",    v:["admin","socio"]},
  {r:"cruce",    n:"Simulador de cruce", v:["admin","socio"]},
  /* Se llega desde el simulador, no desde el menú: es el mismo
     pedigrí, a pantalla completa. Pero se declara aquí para que le
     valgan los mismos permisos; sin declararla, render() no
     encontraría su definición y la habría dejado abierta a
     cualquiera. */
  {r:"pedigri",  n:"Pedigrí de la camada", v:["admin","socio"], oculta:true},
  {r:"camadas",  n:"Camadas",          v:["admin","socio"], ct:()=>C("camadas").length || null},
  {r:"intervar", n:"Cruces intervariedades", v:["admin","socio"], ct:()=>C("solicitudes").filter(x=>x.tipo==="intervariedad"&&x.estado==="pendiente").length || null},

  {h:"mio", t:"Mi área"},
  {r:"entrar",   n:"Entrar",           v:["visitante"]},
  {r:"bienvenida", n:"Guía rápida",    v:["socio","admin"]},
  /* «Mi perfil» y «Cuota y pagos» son de socio: una cuenta de junta sin
     ficha en el censo —la del club, por ejemplo— no tiene qué enseñar
     ahí, así que no se le ofrece. «Mi cuenta» sí: la contraseña y la
     foto las tiene todo el mundo. */
  {r:"yo",       n:"Mi perfil",        v:["socio","admin"], si:()=>!!SESION.socio},
  {r:"mensajes", n:"Mensajes",         v:["socio","admin"], si:()=>!!SESION.socio,
   ct:()=>C("mensajes").filter(m => m.paraId === miSocioId() && !m.leido).length || null},
  {r:"ajustes",  n:"Mi cuenta",        v:["socio","admin","sin-ficha"]},
  {r:"cuenta",   n:"Cuota y pagos",    v:["socio","admin"], si:()=>!!SESION.socio},

  {h:"adm", t:"Administración"},
  {r:"admin",    n:"Panel de la junta", v:["admin"]},
  {r:"validar",  n:"Validaciones",     v:["admin"], ct:()=>{
    const res = C("resultados").filter(r => r.validado === "pendiente").length;
    const sal = C("perros").filter(p => R.pendientes(p, C("resultados")).salud).length;
    const tr  = C("solicitudes").filter(x => x.tipo === "traspaso" && x.estado === "pendiente").length;
    return (res + sal + tr) || null; }},
  {r:"videos",   n:"Vídeos por publicar", v:["admin"], ct:()=>videosPendientes().length || null},
  {r:"invitaciones", n:"Invitaciones", v:["admin"]},
  {r:"altas",    n:"Vinculación de altas", v:["admin"]},
  {r:"cobros",   n:"Cuotas y cobros",  v:["admin"]},
  /* La lista de administradores es la llave maestra: quien la edita
     puede darse cualquier permiso. Sólo la presidencia, y a quien no
     lo sea ni se le ofrece: no hay cartel de «no tienes permiso». */
  {r:"admins",   n:"Administradores",  v:["admin"], si:()=>SESION.esPresidencia},
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
  pedigri:  ["Pedigrí de la camada", "El árbol que tendrían los cachorros de esta alianza"],
  intervar: ["Cruces intervariedades", "Expedientes de autorización previa — Capítulo 8"],
  camadas:  ["Camadas", "Declaración y difusión de camadas"],
  eventos:  ["Eventos", "Convocatorias e inscripciones"],
  cargos:   ["Cargos y jueces", "Listados oficiales del club"],
  yo:       ["Mi perfil", "Tus datos, tus perros y qué comparte cada uno"],
  carnet:   ["Carnet de socio", "Para llevarlo en el móvil o imprimirlo"],
  mensajes: ["Mensajes", "Lo que te escriben otros socios del club"],
  ajustes:  ["Mi cuenta", "Tu contraseña, tu foto y quién te ve"],
  diagnostico: ["Diagnóstico", "Estado de la conexión y de tu sesión"],
  cuenta:   ["Cuota y pagos", "Tu situación con la tesorería del club"],
  admin:    ["Panel de la junta", "Estado del censo y de la cría"],
  validar:  ["Validaciones", "Nada cuenta hasta que la junta lo coteja con el certificado original"],
  videos:   ["Vídeos por publicar", "Lo que suben los socios, antes de que lleve el nombre del club"],
  invitaciones: ["Invitaciones", "Enviar a cada socio su enlace personal de alta"],
  altas:    ["Vinculación de altas", "Cómo cada socio accede a su propio perfil"],
  cobros:   ["Cuotas y cobros", "Domiciliaciones y recibos"],
  admins:   ["Administradores", "Cuentas con permiso de junta directiva"],
  entrar:   ["Entrar", "Acceso de socios del CEPPB"],
  bienvenida: ["Bienvenido a Mi CEPPB", "Qué puedes hacer aquí y por dónde se empieza"],
  alta:     ["Vincular tu cuenta", "Invitación personal de secretaría"],
};

function rutaActual(){ return (location.hash || "#/muro").slice(2).split("/"); }
function ir(r){ location.hash = "#/" + r; }

function pintarNav(){
  const [r] = rutaActual();
  const secc = [];
  VISTAS.forEach(v => {
    if (v.h !== undefined){ secc.push({t:v.t, items:[]}); return; }
    if (v.oculta) return;              // existe, pero no se anuncia
    if (!v.v.includes(SESION.rol)) return;
    if (v.si && !v.si()) return;
    /* Los números de al lado de cada sección son datos del club: cuántos
       socios, cuántos ejemplares. Quien no ha entrado no los ve. */
    const ct = (v.ct && SESION.usuario) ? v.ct() : null;
    secc[secc.length-1].items.push(
      `<a href="#/${v.r}" class="${r===v.r?"on":""}">${esc(t(v.n))}` +
      (ct != null ? `<span class="ct">${ct}</span>` : "") + `</a>`);
  });
  $("#nav").innerHTML = secc.filter(s => s.items.length)
    .map(s => `<div class="nav-h">${esc(t(s.t))}</div>` + s.items.join("")).join("");

  $("#rol-badge").textContent =
    SESION.esAdmin ? t("Junta directiva") :
    SESION.socio   ? t("Socio") + " nº " + (SESION.socio.numero ?? "") :
    SESION.usuario ? t("Cuenta sin vincular") : t("Visitante");
}

function pintarAcciones(){
  /* El idioma se elegía sólo dentro de «Mi cuenta», tres clics adentro:
     quien entra en francés no sabe ni que existe esa pantalla. Aquí
     está siempre a la vista, con el código de la lengua para que quepa
     también en el teléfono. */
  const idioma = `<select class="inp sm elegir-idioma" aria-label="Idioma" title="${esc(t("Idioma"))}">` +
    IDIOMAS.map(i => `<option value="${i.c}" ${idiomaActual === i.c ? "selected" : ""}>` +
      `${esc(i.c.toUpperCase())}</option>`).join("") + `</select>`;

  $("#acciones").innerHTML = idioma + (SESION.usuario
    ? `<button class="btn sm" id="salir">${esc(t("Salir"))}</button>`
    : `<a class="btn brand sm" href="#/entrar">${esc(t("Entrar"))}</a>`);
}

function render(){
  const [r, arg] = rutaActual();
  const vista = V[r] ? r : "muro";

  /* Quien acaba de entrar se queda en «#/entrar», que es una pantalla
     sólo para visitantes: la plataforma le echaba de ella justo
     después de dejarle pasar, con un cartel diciéndole que preguntara
     en secretaría. Se le lleva a su sitio. */
  if (vista === "entrar" && SESION.usuario){
    location.hash = "#/bienvenida";
    return;
  }

  const def = VISTAS.find(v => v.r === vista);

  /* Todavía no se sabe quién entra: no es momento de cerrarle la
     puerta a nadie. A un socio de la junta le salía «esta sección no
     está abierta a tu perfil» en la primera décima de segundo, antes
     de que Supabase contestara. */
  if (def && !SESION.resuelta && !def.v.includes(SESION.rol)){
    $("#tt").textContent = t(TITULOS_VISTA[vista] ? TITULOS_VISTA[vista][0] : vista);
    $("#ts").textContent = "";
    $("#vista").innerHTML = `<div class="empty"><b>Un momento…</b>Comprobando tu perfil.</div>`;
    pintarNav(); pintarAcciones();
    return;
  }

  if (def && (!def.v.includes(SESION.rol) || (def.si && !def.si()))){
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

  const [tit, sub] = TITULOS_VISTA[vista] || [vista, ""];
  $("#tt").textContent = t(tit);
  $("#ts").textContent = t(sub);

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
ponerIdioma(idiomaDe(null));

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

/* ============================================================
   Instalar la plataforma en el teléfono.

   Con esto el socio la tiene en su pantalla de inicio con el
   emblema del club, y se abre a pantalla completa, sin la barra
   del navegador. No es una app de las tiendas: es la misma
   plataforma, guardada como acceso directo.
   ============================================================ */
let ofertaDeInstalar = null;

/* Nada de esto existe fuera de un navegador; las pruebas cargan estos
   archivos en Node y allí no hay ni navigator ni ventana. */
const HAY_NAVEGADOR = typeof navigator !== "undefined" &&
                      typeof addEventListener === "function";

if (HAY_NAVEGADOR && "serviceWorker" in navigator && location.protocol === "https:"){
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* Si no se puede registrar, la plataforma funciona igual:
         simplemente no se podrá instalar. */
    });
  });
}

if (HAY_NAVEGADOR){
  /* Chrome y Edge avisan cuando la plataforma se puede instalar, y
     guardan el ofrecimiento para usarlo cuando el socio quiera. */
  addEventListener("beforeinstallprompt", ev => {
    ev.preventDefault();
    ofertaDeInstalar = ev;
    if (typeof render === "function") render();
  });

  addEventListener("appinstalled", () => {
    ofertaDeInstalar = null;
    if (typeof toast === "function") toast("Ya la tienes en tu pantalla de inicio");
    if (typeof render === "function") render();
  });
}

/* ¿Se está viendo ya como aplicación instalada? */
function abiertaComoApp(){
  try {
    return matchMedia("(display-mode: standalone)").matches ||
           navigator.standalone === true;
  } catch(e){ return false; }
}

/* En iPhone y iPad no hay ofrecimiento automático: se hace a mano
   desde el botón de compartir, y hay que explicarlo. */
function esApple(){
  try {
    const ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) ||
           (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
  } catch(e){ return false; }
}
