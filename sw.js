/* ============================================================
   El trabajador de segundo plano que permite instalar la
   plataforma en el teléfono.

   Va SIEMPRE a la red primero. No es lo más rápido, pero es lo
   correcto aquí: guardar copias de los archivos significaría que
   un socio se quedaría con una versión vieja del libro sin
   enterarse, y en este proyecto la versión cambia varias veces
   al día. El almacén sólo se usa cuando no hay conexión, para
   que la plataforma abra y diga que está sin red en lugar de
   dar el error del navegador.

   Nada de datos de socios pasa por aquí: las peticiones a
   Supabase no se guardan nunca.
   ============================================================ */
const ALMACEN = "ceppb-emergencia-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", ev => {
  ev.waitUntil((async () => {
    /* Al cambiar de versión, fuera lo viejo. */
    for (const n of await caches.keys()) if (n !== ALMACEN) await caches.delete(n);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", ev => {
  const req = ev.request;

  /* Sólo la propia plataforma. Lo de Supabase, las fuentes y
     cualquier otra cosa va directa, sin pasar por aquí. */
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  ev.respondWith((async () => {
    try {
      const res = await fetch(req);
      /* Se guarda una copia por si la próxima vez no hay red. */
      if (res && res.ok) {
        const copia = res.clone();
        caches.open(ALMACEN).then(c => c.put(req, copia)).catch(() => {});
      }
      return res;
    } catch (e) {
      const guardado = await caches.match(req);
      if (guardado) return guardado;
      /* Si se pedía una página y no hay nada, la portada. */
      if (req.mode === "navigate") {
        const inicio = await caches.match("./");
        if (inicio) return inicio;
      }
      return new Response(
        "<!doctype html><meta charset=utf-8><title>Sin conexión</title>" +
        "<div style=\"font:16px/1.5 system-ui;padding:40px;max-width:30em;margin:auto\">" +
        "<h1 style=font-size:20px>Sin conexión</h1>" +
        "<p>El Libro de Cría necesita conexión para leer el libro. " +
        "Vuelve a intentarlo cuando tengas cobertura.</p></div>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  })());
});
