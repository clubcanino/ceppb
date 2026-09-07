/* Área del socio: mi perfil y mi cuota. */
"use strict";

/* --- Mi perfil --- */
V.yo = function(){
  const s = SESION.socio;
  if(!s) return sinFichaVinculada();
  const mios = C("perros").filter(p => p.propietarioId === s.id);
  return `<div class="ficha-h">${avatar(s, 72)}<div style="flex:1;min-width:230px"><h2>${esc(s.nombreCompleto)}</h2>
      <div class="meta"><span class="chip mono">Socio nº ${esc(s.numero)}</span><span class="chip">${esc(s.cuota||"")}</span>
      ${s.afijo?`<span class="chip">Afijo ${esc(s.afijo)}</span>`:""}</div></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${botonFoto("avatar","socio",s.id,s.avatar?"Cambiar foto":"Subir foto")}
        <button class="btn" data-ir="carnet/${esc(s.id)}">${esc(t("Mi carnet de socio"))}</button>
        <button class="btn brand" data-form="socio|${esc(s.id)}">Editar mis datos</button></div></div>
    <div class="cols23">
      <div class="grid">
        <div class="card"><div class="card-h"><h3>Mis ejemplares</h3><span class="spacer"></span><button class="btn sm" data-form="perro|">Añadir ejemplar</button></div>
          <div class="card-b" style="padding:0">${mios.length?tablaPerrosMini(mios):`<div class="empty" style="padding:30px"><b>Aún no has dado de alta ningún perro</b>Al añadirlo podrás importar su pedigrí y registrar títulos y pruebas.</div>`}</div></div>
        <div class="card lift"><div class="card-h"><h3>¿Aparezco en el club?</h3></div><div class="card-b">
          <div class="mini" style="margin-bottom:10px">Mientras esté en <b>No aparecer</b>, ningún socio ve tu perfil ni sabe que existe. Sólo tú y la junta directiva.</div>
          <div class="seg">${PERFIL_NIV.map(([k,n])=>`<button data-perfil="${esc(s.id)}|${k}" class="${(s.perfilPublico||"oculto")===k?"on":""}">${esc(n)}</button>`).join("")}</div>
          ${(s.perfilPublico||"oculto")==="oculto"?`<div class="note warn" style="margin-top:11px">Ahora mismo no apareces en el directorio. Los ajustes de abajo no tendrán efecto hasta que te des a conocer.</div>`:""}
        </div></div>
        <div class="card"><div class="card-h"><h3>${esc(t("Que me escriban"))}</h3></div><div class="card-b">
          <div class="mini" style="margin-bottom:10px">${esc(t("Otros socios pueden escribirte desde la plataforma. No ven tu correo ni ningún otro dato tuyo: sólo tu nombre, para poder dirigirse a ti."))}</div>
          <div class="seg">
            <button data-mensajes-si="1" class="${s.aceptaMensajes !== false ? "on" : ""}">${esc(t("Sí, que me escriban"))}</button>
            <button data-mensajes-si="0" class="${s.aceptaMensajes === false ? "on" : ""}">${esc(t("Prefiero que no"))}</button>
          </div>
        </div></div>

        <div class="card"><div class="card-h"><h3>Qué comparto</h3><span class="hint">Sólo si apareces en el directorio</span></div><div class="card-b">
          ${Object.keys(PRIV_DEF).map(k => `<div class="req"><div class="tx" style="flex:1"><b>${esc({email:"Correo electrónico",telefono:"Teléfono",poblacion:"Localidad",provincia:"Provincia",afijo:"Afijo de criador",disciplinas:"Disciplinas",bio:"Presentación",web:"Web / redes",fechaAlta:"Antigüedad como socio"}[k]||k)}</b></div>
            <div class="seg">${NIVELES.map(([v,n])=>`<button data-priv="${esc(s.id)}|${k}|${v}" class="${nivelDe(s,k)===v?"on":""}">${esc(n)}</button>`).join("")}</div></div>`).join("")}
        </div></div>
      </div>
      <div class="grid">
        <div class="card"><div class="card-h"><h3>Vinculación de la cuenta</h3></div><div class="card-b">
          <div class="note ok">Cuenta vinculada al socio nº ${esc(s.numero)} mediante invitación enviada a ${esc(s.email||"su correo registrado")}.</div>
          <div class="mini" style="margin-top:10px">El número de socio y el DNI sólo los modifica la secretaría del club.</div></div></div>
        <div class="card"><div class="card-h"><h3>Datos reservados</h3></div><div class="card-b">
          <div class="note block" style="margin-bottom:10px">El número de cuenta <b>no se comparte en ningún caso</b>. No aparece entre tus ajustes de privacidad ni en el directorio: sólo lo ve la tesorería del club.</div>
          <dl class="kv" style="margin-top:10px"><dt>Cuota</dt><dd>${esc(s.cuota||"—")}</dd>
          <dt>IBAN de domiciliación</dt><dd class="num">${esc(byId(C("socios_privado"),s.id)?.iban ? "•••• "+byId(C("socios_privado"),s.id).iban.slice(-4) : "—")}</dd></dl>
          <button class="btn sm" style="margin-top:10px" data-form="bancario|${esc(s.id)}">Cambiar cuenta bancaria</button></div></div>
      </div></div>`;
};

/* --- Cuota y pagos del socio --- */
V.cuenta = function(){
  const s = SESION.socio;
  if(!s) return sinFichaVinculada();
  const p = C("pagos").filter(x => x.socioId === s.id).sort((a,b)=>String(b.anio).localeCompare(String(a.anio)));
  const pend = p.filter(x => x.estado !== "pagado");
  return `${pend.length?`<div class="note warn" style="margin-bottom:14px"><b>${pend.length} recibo(s) pendientes.</b> El reglamento exige estar al día en las obligaciones sociales para solicitar cruces y optar a títulos del club.</div>`
      :`<div class="note ok" style="margin-bottom:14px">Al corriente de pago. Puedes solicitar cruces, inscribirte en pruebas y optar a los títulos del club.</div>`}
    <div class="cols23">
      <div class="card"><div class="card-h"><h3>Histórico de recibos</h3></div><div class="card-b" style="padding:0">
        ${p.length?`<table><thead><tr><th class="nos">Ejercicio</th><th class="nos">Concepto</th><th class="nos">Importe</th><th class="nos">Estado</th></tr></thead>
          <tbody>${p.map(x=>`<tr><td class="num">${esc(x.anio)}</td><td>${esc(x.concepto||"Cuota anual")}</td>
          <td class="num">${x.importe!=null?Number(x.importe).toFixed(2)+" €":"—"}</td>
          <td><span class="chip ${x.estado==="pagado"?"ok":x.estado==="devuelto"?"block":"warn"}">${esc(x.estado||"pendiente")}</span></td></tr>`).join("")}</tbody></table>`
          :`<div class="empty" style="padding:30px">Sin recibos registrados</div>`}
      </div></div>
      <div class="card"><div class="card-h"><h3>Tu cuota</h3></div><div class="card-b">
        <dl class="kv"><dt>Modalidad</dt><dd>${esc(s.cuota||"—")}</dd><dt>Alta</dt><dd>${fmtF(s.fechaAlta)}</dd>
        <dt>Domiciliación</dt><dd class="num">${esc(byId(C("socios_privado"),s.id)?.iban ? "•••• "+byId(C("socios_privado"),s.id).iban.slice(-4) : "sin domiciliar")}</dd></dl>
        <button class="btn sm" style="margin-top:12px" data-form="bancario|${esc(s.id)}">Actualizar domiciliación</button>
        <div class="mini" style="margin-top:12px">Las tarifas las aprueba la Junta Directiva y se publican en la web del club (Cap. 10.3).</div>
      </div></div></div>`;
};

/* --- Panel de la junta --- */


/* Una cuenta puede existir sin estar atada a ninguna ficha del censo:
   pasa con las cuentas de la junta y con quien entra por primera vez
   sin invitación. Aquí se le dice qué le falta, en vez de dejarlo
   mirando una pantalla vacía. */
function sinFichaVinculada(){
  const correo = SESION.usuario ? SESION.usuario.email : "";
  const suyas = C("socios").filter(x => (x.email || "").toLowerCase() === correo.toLowerCase());

  /* Una cuenta de la junta sin ficha no es un error: es la cuenta
     institucional del club, que manda pero no es socia de nadie. */
  if (SESION.esAdmin && !suyas.length){
    return `<div class="card" style="max-width:620px"><div class="card-b">
      <h3>Esta es una cuenta de la junta directiva</h3>
      <p><b>${esc(correo)}</b> gobierna la plataforma: valida pruebas de salud, resuelve
      expedientes y gestiona el censo. Pero no es la ficha de ningún socio, así que aquí
      no hay perfil personal que enseñar.</p>
      <p class="dim">Si eres socio del club además de junta, entra con el correo que consta
      a tu nombre en secretaría y ahí sí tendrás tu perfil, tus perros y tu cuota.</p>
      <div style="margin-top:14px">
        <button class="btn brand" data-ir="admin">Ir al panel de la junta</button>
      </div>
    </div></div>`;
  }

  return `<div class="card" style="max-width:620px"><div class="card-b">
    <h3>Tu cuenta todavía no está atada a una ficha de socio</h3>
    <p>Has entrado con <b>${esc(correo)}</b>, pero esa cuenta no está unida a ningún número
    de socio del censo. Hasta que lo esté, no hay perfil que enseñarte.</p>

    ${suyas.length ? `
      <div class="note ok" style="margin:14px 0">
        En el censo hay ${suyas.length === 1 ? "una ficha" : suyas.length + " fichas"} con ese correo.
      </div>
      <table><thead><tr><th>Nº</th><th>Socio</th><th></th></tr></thead><tbody>
      ${suyas.map(x => `<tr>
        <td class="num">${esc(x.numero)}</td>
        <td>${esc(x.nombreCompleto)}</td>
        <td style="text-align:right"><button class="btn sm brand" data-vincular="${esc(x.id)}">Es la mía</button></td>
      </tr>`).join("")}
      </tbody></table>
      ${suyas.length > 1 ? `<p class="dim" style="margin-top:10px">Hay más de una ficha con este
        correo: son socios de cuota familiar que comparten buzón. Elige la tuya.</p>` : ""}
    ` : `
      <div class="note warn" style="margin:14px 0">
        No hay ninguna ficha en el censo con ese correo. Si eres socio, secretaría tiene otro
        correo tuyo: escribe al club para que lo actualicen, o entra con el correo que consta.
      </div>`}
  </div></div>`;
}

/* ============================================================
   La bandeja de mensajes.

   Sin correos por medio: un socio escribe a otro desde su ficha o
   desde la de su perro, y el mensaje se queda aquí. Así los
   perfiles siguen siendo reservados y aun así la gente puede
   hablarse.
   ============================================================ */
V.mensajes = function(){
  const yo = miSocioId();
  if (!yo) return sinFichaVinculada();

  const todos = C("mensajes");
  const recibidos = todos.filter(m => m.paraId === yo)
    .sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
  const enviados = todos.filter(m => m.deId === yo)
    .sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
  const sinLeer = recibidos.filter(m => !m.leido).length;

  const quien = id => {
    const s = byId(C("socios"), id);
    return s ? s.nombreCompleto : "Un socio";
  };
  const cuando = f => {
    if (!f) return "";
    const d = String(f).slice(0, 10);
    return fmtF(d) + " · " + String(f).slice(11, 16);
  };

  const tarjeta = (m, mio) => {
    const p = m.perroId ? byId(C("perros"), m.perroId) : null;
    return `<div class="card ${!mio && !m.leido ? "lift" : ""}" style="margin-bottom:10px">
      <div class="card-h">
        <h3>${esc(m.asunto || t("Sin asunto"))}</h3>
        ${!mio && !m.leido ? `<span class="chip warn">${esc(t("Sin leer"))}</span>` : ""}
        <span class="spacer"></span>
        <span class="hint">${esc(cuando(m.creado))}</span>
      </div>
      <div class="card-b">
        <div class="mini" style="margin-bottom:8px">
          ${mio ? esc(t("Para")) : esc(t("De"))}
          <b>${esc(quien(mio ? m.paraId : m.deId))}</b>
          ${p ? ` · <a class="linkish" href="#/perro/${esc(p.id)}">${esc(nombrePerro(p))}</a>` : ""}
        </div>
        <div style="white-space:pre-wrap;font-size:13px;line-height:1.55">${esc(m.cuerpo)}</div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          ${!mio ? `<button class="btn sm" data-escribir="${esc(m.deId)}|${esc(m.perroId || "")}">${esc(t("Responder"))}</button>` : ""}
          ${!mio && !m.leido ? `<button class="btn sm" data-leido="${esc(m.id)}">${esc(t("Marcar leído"))}</button>` : ""}
          <button class="btn sm danger" data-borrar-mensaje="${esc(m.id)}">${esc(t("Borrar"))}</button>
        </div>
      </div></div>`;
  };

  return `
    <div style="margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button class="btn brand" id="nuevo-mensaje">${esc(t("Escribir a un socio"))}</button>
      <span class="mini">${(S.escribibles||[]).length} ${esc(t("socios del club aceptan mensajes"))}</span>
    </div>

    <div class="cols2">
      <div>
        <h3 style="margin-bottom:11px">${esc(t("Recibidos"))}${sinLeer ? ` <span class="chip warn">${sinLeer}</span>` : ""}</h3>
        ${recibidos.length ? recibidos.map(m => tarjeta(m, false)).join("")
          : `<div class="card"><div class="empty" style="padding:30px">
              <b>${esc(t("No tienes mensajes"))}</b>
              ${esc(t("Cuando otro socio te escriba desde tu perfil o desde la ficha de uno de tus perros, aparecerá aquí."))}
             </div></div>`}
      </div>
      <div>
        <h3 style="margin-bottom:11px">${esc(t("Enviados"))}</h3>
        ${enviados.length ? enviados.map(m => tarjeta(m, true)).join("")
          : `<div class="card"><div class="empty" style="padding:30px">
              <b>${esc(t("No has escrito a nadie todavía"))}</b>
              ${esc(t("Desde la ficha de un socio o de un ejemplar puedes escribir a su propietario."))}
             </div></div>`}
      </div>
    </div>`;
};
