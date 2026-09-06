/* ============================================================
   Armazón: menú, rutas y dibujado de la pantalla.
   ============================================================ */
"use strict";

const VISTAS = [
  {h:"", t:"La plataforma"},
  {r:"muro",     n:"Novedades",        v:["admin","socio","visitante"]},
  {h:"mio", t:"Mi área"},
  {r:"entrar",   n:"Entrar",           v:["visitante"]},
];

const TITULOS_VISTA = {
  muro:   ["Novedades", "Actividad del club"],
  entrar: ["Entrar", "Acceso de socios del CEPPB"],
  alta:   ["Vincular tu cuenta", "Invitación personal de secretaría"],
};

function rutaActual(){ return (location.hash || "#/muro").slice(2).split("/"); }
function ir(r){ location.hash = "#/" + r; }

function pintarNav(){
  const [r] = rutaActual();
  const secc = [];
  VISTAS.forEach(v => {
    if (v.h !== undefined){ secc.push({t:v.t, items:[]}); return; }
    if (!v.v.includes(SESION.rol)) return;
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
   plataforma: se aparta antes de dibujar nada, y si vino un error se
   le dice al socio en lugar de dejarlo mirando una pantalla vacía. */
function limpiarRespuestaDelCorreo(){
  const h = location.hash || "";
  if (!/(access_token|refresh_token|error|error_description)=/.test(h)) return;

  const p = new URLSearchParams(h.replace(/^#/, ""));
  const error = p.get("error_description") || p.get("error");
  history.replaceState(null, "", location.pathname + location.search + "#/muro");
  if (error) setTimeout(() => toast(decodeURIComponent(error.replace(/\+/g, " "))), 400);
}
limpiarRespuestaDelCorreo();

const [rInicial, argInicial] = rutaActual();
if (rInicial === "alta" && argInicial) SESION.guardarInvitacion(argInicial);
if (!location.hash) location.hash = "#/muro";

render();
abrirDB().then(render).catch(e => {
  console.error(e);
  S.listo = true;
  render();
});
