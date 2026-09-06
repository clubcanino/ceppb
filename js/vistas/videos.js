/* ============================================================
   Vídeos pendientes de publicar.

   Los sube el socio, los mira la junta, y con un botón se publican.
   Lo que lleva el nombre del club sale cuando el club dice que sale.
   ============================================================ */
"use strict";

V.videos = function(){
  if (!SESION.esAdmin)
    return `<div class="empty"><b>Solo la junta directiva</b>
      Los vídeos que suben los socios los revisa la junta antes de publicarlos.</div>`;

  const pendientes = videosPendientes();
  const publicados = C("media").filter(m => m.tipo === "video" && m.validado === "validado");

  if (!pendientes.length)
    return `<div class="card"><div class="empty">
      <b>Nada pendiente</b>
      Cuando un socio suba el vídeo de su perro, aparecerá aquí para que lo veas y decidas.
      ${publicados.length ? `<div class="mini" style="margin-top:10px">${publicados.length}
        ${publicados.length === 1 ? "vídeo publicado" : "vídeos publicados"} hasta ahora.</div>` : ""}
    </div></div>`;

  return `
    <div class="note warn" style="margin-bottom:16px">
      <b>${pendientes.length} ${pendientes.length === 1 ? "vídeo espera" : "vídeos esperan"} tu visto bueno.</b>
      Hasta que decidas, solo los ve quien los subió.
    </div>
    <div class="grid">
      ${pendientes.map(m => {
        const perro = m.perroId ? byId(C("perros"), m.perroId) : null;
        const quien = m.subidoPor ? byId(C("socios"), m.subidoPor) : null;
        return `
        <div class="card lift">
          <div class="card-h">
            <h3>${esc(m.titulo || "Vídeo")}</h3>
            <span class="hint">${m.duracion ? esc(minutos(m.duracion)) : ""}</span>
          </div>
          <div class="card-b">
            <video src="${esc(m.url || "")}" controls preload="metadata"
                   style="width:100%;max-height:340px;background:#000;border-radius:var(--r-sm)"></video>
            <dl class="kv" style="margin-top:12px">
              <dt>Ejemplar</dt><dd>${perro
                ? `<a class="linkish" href="#/perro/${esc(perro.id)}">${esc(perro.nombre)}</a>` : "—"}</dd>
              <dt>Lo sube</dt><dd>${quien ? esc(quien.nombreCompleto || "") : "—"}</dd>
              <dt>Fecha</dt><dd>${fmtF(m.fecha)}</dd>
            </dl>
            <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn brand" data-video-val="validado|${esc(m.id)}">Publicar</button>
              <button class="btn" data-video-val="rechazado|${esc(m.id)}">No publicar</button>
              <a class="btn sm" href="${esc(m.url || "")}" download target="_blank" rel="noopener">Descargar</a>
            </div>
            <div class="mini" style="margin-top:10px">
              Al publicarlo se ve en la ficha del ejemplar. Para llevarlo al canal de YouTube del
              club, descárgalo y súbelo desde YouTube Studio.
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
};
