/* ============================================================
   Retransmisiones en directo de los eventos del club.

   El vídeo lo sirve YouTube; la plataforma lo enseña dentro. Así el
   club retransmite sus campeonatos sin pagar servidores de vídeo ni
   arriesgarse a que falle el día de la Especial de Cría, y al acabar
   la grabación queda sola.
   ============================================================ */
"use strict";

/* De cualquier forma de enlace de YouTube al que sirve para incrustar.
   Vale el del navegador, el de compartir y el de un directo. */
function idDeYoutube(url){
  const u = String(url || "").trim();
  if (!u) return null;
  const patrones = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/i,
    /youtu\.be\/([\w-]{11})/i,
    /youtube\.com\/live\/([\w-]{11})/i,
    /youtube\.com\/embed\/([\w-]{11})/i,
    /youtube\.com\/shorts\/([\w-]{11})/i,
  ];
  for (const p of patrones){
    const m = u.match(p);
    if (m) return m[1];
  }
  return null;
}

function urlIncrustada(url){
  const id = idDeYoutube(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/* ¿Está retransmitiendo ahora? Se considera que sí el día del evento
   y el siguiente: un campeonato se alarga, y nadie va a entrar a
   quitar el enlace a las doce de la noche. */
function eventoEnDirecto(e){
  if (!e || !e.directoUrl) return false;
  if (!e.fecha) return true;
  const hoyD = new Date(hoy());
  const dia  = new Date(String(e.fecha).slice(0, 10));
  const dias = Math.round((hoyD - dia) / 86400000);
  return dias >= 0 && dias <= 1;
}

function eventosEnDirecto(){
  return C("eventos").filter(eventoEnDirecto);
}

/* El reproductor, con su marco */
function reproductorDirecto(e){
  const src = urlIncrustada(e.directoUrl);
  if (!src){
    return `<div class="note warn">Ese enlace no parece de YouTube. Pega la dirección
      del directo tal como sale en el navegador.</div>`;
  }
  return `
    <div class="directo">
      <div class="directo-cab">
        <span class="directo-punto"></span>
        <b>EN DIRECTO</b>
        <span class="mini">${esc(e.directoTitulo || e.nombre || "")}</span>
        <span class="spacer"></span>
        <a class="btn sm" href="${esc(e.directoUrl)}" target="_blank" rel="noopener noreferrer">Ver en YouTube</a>
      </div>
      <div class="directo-marco">
        <iframe src="${esc(src)}" title="${esc(e.directoTitulo || e.nombre || "Retransmisión")}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>`;
}
