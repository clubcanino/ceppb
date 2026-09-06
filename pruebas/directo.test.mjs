/* ============================================================
   Retransmisiones en directo.

   El enlace que copia una persona del navegador puede tener cinco
   formas distintas. Si la plataforma no las entiende todas, el día
   del campeonato el club se queda sin retransmitir.
   ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";
import { cargar } from "./cargar.mjs";

const D = cargar(["js/util.js", "js/directo.js"],
                 ["idDeYoutube", "urlIncrustada", "eventoEnDirecto"]);

test("entiende las cinco formas del enlace de YouTube", () => {
  const casos = [
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "el del navegador"],
    ["https://youtu.be/dQw4w9WgXcQ", "el de compartir"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "el de un directo"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "el de incrustar"],
    ["https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ", "con lista de reproducción"],
  ];
  for (const [url, que] of casos){
    assert.equal(D.idDeYoutube(url), "dQw4w9WgXcQ", "no reconoce " + que + ": " + url);
  }
});

test("un enlace que no es de YouTube no se incrusta", () => {
  assert.equal(D.urlIncrustada("https://ejemplo.test/video"), null);
  assert.equal(D.urlIncrustada(""), null);
  assert.equal(D.urlIncrustada(null), null);
});

test("se incrusta sin cookies de seguimiento", () => {
  const src = D.urlIncrustada("https://youtu.be/dQw4w9WgXcQ");
  assert.match(src, /youtube-nocookie\.com/,
    "los socios no tienen por qué llevarse las cookies de YouTube por ver una prueba");
  assert.match(src, /embed\/dQw4w9WgXcQ$/);
});

test("un evento sin enlace no está en directo", () => {
  assert.equal(D.eventoEnDirecto({fecha: "2026-09-06"}), false);
  assert.equal(D.eventoEnDirecto(null), false);
});

test("el directo se mantiene el día del evento y el siguiente", () => {
  const dia = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const conEnlace = f => ({fecha: f, directoUrl: "https://youtu.be/dQw4w9WgXcQ"});

  assert.equal(D.eventoEnDirecto(conEnlace(dia(0))), true, "el mismo día, claro");
  assert.equal(D.eventoEnDirecto(conEnlace(dia(-1))), true,
    "un campeonato se alarga y nadie va a quitar el enlace a medianoche");
  assert.equal(D.eventoEnDirecto(conEnlace(dia(-5))), false, "cinco días después ya no");
  assert.equal(D.eventoEnDirecto(conEnlace(dia(3))), false, "ni antes de que empiece");
});
