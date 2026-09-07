/* ============================================================
   La plataforma en el idioma de cada socio.

   La clave de cada texto es el propio castellano: así, si a una
   lengua le falta una frase, sale en castellano en lugar de salir
   en blanco o con un código raro.

   Lo que NO se traduce, a propósito:
   - Los nombres propios: perros, socios, afijos, criaderos.
   - Los términos del reglamento: ACE, ACES, ACU, ACUS, ACSS, Anexo A.
   - Las variedades: Malinois, Tervueren, Groenendael, Laekenois.
   Son los mismos en toda la FCI y traducirlos confundiría.
   ============================================================ */
"use strict";

const IDIOMAS = [
  {c:"es", n:"Castellano", propio:"Castellano"},
  /* Las cuatro lenguas cooficiales del Estado, que es donde vive la
     inmensa mayoría del club. El valenciano lleva código propio «va»
     porque en la plataforma se elige a mano; los navegadores no lo
     distinguen del catalán y quien lo quiera lo pone él. */
  {c:"ca", n:"Catalán",    propio:"Català"},
  {c:"va", n:"Valenciano", propio:"Valencià"},
  {c:"gl", n:"Gallego",    propio:"Galego"},
  {c:"eu", n:"Euskera",    propio:"Euskara"},
  {c:"en", n:"Inglés",     propio:"English"},
  {c:"fr", n:"Francés",    propio:"Français"},
  {c:"de", n:"Alemán",     propio:"Deutsch"},
];

const TEXTOS = {};          // se rellena desde idiomas/*.js
let idiomaActual = "es";

/* Traduce. Si no hay traducción, devuelve el castellano tal cual. */
function t(texto){
  if (idiomaActual === "es") return texto;
  const tabla = TEXTOS[idiomaActual];
  return (tabla && tabla[texto]) || texto;
}

/* El idioma que toca: el que eligió el socio, el que tiene guardado
   este navegador, o el del propio navegador si lo tenemos. */
function idiomaDe(socio){
  if (socio && socio.idioma) return socio.idioma;
  try {
    const g = localStorage.getItem("ceppb.idioma");
    if (g) return g;
  } catch(e){}
  const nav = (typeof navigator !== "undefined" && navigator.language || "es")
    .slice(0, 2).toLowerCase();
  return IDIOMAS.some(i => i.c === nav) ? nav : "es";
}

function ponerIdioma(codigo){
  if (!IDIOMAS.some(i => i.c === codigo)) codigo = "es";
  idiomaActual = codigo;
  try { localStorage.setItem("ceppb.idioma", codigo); } catch(e){}
  if (typeof document !== "undefined" && document.documentElement)
    document.documentElement.setAttribute("lang", codigo);
}

function nombreIdioma(codigo){
  const i = IDIOMAS.find(x => x.c === codigo);
  return i ? i.propio : codigo;
}
