/* ============================================================
   Mi cuenta — lo que cada socio maneja de sí mismo:
   su contraseña, su foto, su correo de acceso y quién le ve.

   La junta no aparece por aquí: la contraseña de un socio no la
   ve ni la cambia nadie más que él.
   ============================================================ */
"use strict";

V.ajustes = function(){
  if (!SESION.usuario){
    return `<div class="empty"><b>Entra para ver tu cuenta</b>
      <div style="margin-top:14px"><a class="btn brand" href="#/entrar">Entrar</a></div></div>`;
  }

  const s = SESION.socio;
  const pendiente = hayInvitacionGuardada();

  return `
  <div class="cols2">
    <div class="grid">

      ${!s ? tarjetaVincular() : ""}

      <div class="card lift" id="tarjeta-clave"><div class="card-h"><h3>Contraseña</h3>
        ${!SESION.tieneContrasena() ? `<span class="chip warn" style="margin-left:auto">Sin poner</span>` : ""}</div>
        <div class="card-b">
          ${!SESION.tieneContrasena() ? `<div class="note warn" style="margin-bottom:12px">
            <b>Elige tu contraseña.</b> Has entrado con el enlace del correo; a partir de
            ahora entrarás con tu correo y esta contraseña.</div>` : ""}
          <p class="dim">Solo la sabes tú. Ni la junta ni secretaría pueden verla.</p>
          <div class="f wide" style="margin:12px 0 8px">
            <label for="clave1">Contraseña nueva</label>
            <input class="inp" id="clave1" type="password" autocomplete="new-password">
            <span class="hint2">Ocho caracteres como mínimo.</span>
          </div>
          <div class="f wide" style="margin-bottom:14px">
            <label for="clave2">Repítela</label>
            <input class="inp" id="clave2" type="password" autocomplete="new-password">
          </div>
          <button class="btn brand" id="guardar-clave">Guardar contraseña</button>
        </div>
      </div>

      <div class="card"><div class="card-h"><h3>Foto</h3></div>
        <div class="card-b">
          <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
            ${s && s.avatarUrl
              ? `<img class="avatar" src="${esc(s.avatarUrl)}" alt="" style="width:76px;height:76px;border-radius:50%;object-fit:cover">`
              : `<div class="avatar" style="width:76px;height:76px;border-radius:50%;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-size:26px;font-weight:800;color:var(--muted)">${esc(iniciales(s))}</div>`}
            <div style="flex:1;min-width:200px">
              ${s ? `<label class="btn" style="cursor:pointer">Elegir foto
                       <input type="file" id="subir-avatar" accept="image/*" hidden>
                     </label>
                     ${s.avatarUrl ? `<button class="btn sm" id="quitar-avatar" style="margin-left:8px">Quitar</button>` : ""}
                     <div class="hint2" style="margin-top:8px">JPG o PNG, hasta 5 MB.</div>`
                  : `<span class="dim">Vincula tu cuenta a tu ficha de socio para poder poner foto.</span>`}
            </div>
          </div>
        </div>
      </div>

      <div class="card"><div class="card-h"><h3>Idioma</h3></div>
        <div class="card-b">
          <p class="dim">En qué idioma ves la plataforma. Los nombres de los perros, los
          afijos y los términos del reglamento —ACE, ACES, Anexo A, Malinois— no se
          traducen: son los mismos en toda la FCI.</p>
          <div class="f wide" style="margin-top:12px">
            <select class="inp elegir-idioma" id="elegir-idioma">
              ${IDIOMAS.map(i => `<option value="${i.c}" ${idiomaActual===i.c?"selected":""}>
                ${esc(i.propio)}${i.c!=="es" ? " · " + esc(i.n) : ""}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>

      <div class="card"><div class="card-h"><h3>Acceso</h3></div>
        <div class="card-b">
          <dl class="kv">
            <dt>Correo</dt><dd>${esc(SESION.usuario.email)}</dd>
            <dt>Perfil</dt><dd>${SESION.esAdmin ? "Junta directiva" : s ? "Socio nº " + esc(s.numero) : "Cuenta sin vincular"}</dd>
            ${s ? `<dt>Nombre</dt><dd>${esc(s.nombreCompleto || "")}</dd>` : ""}
          </dl>
          ${pendiente ? `<div class="note ok" style="margin-top:12px">Tienes una invitación
            pendiente de aplicar. Se aplicará sola en cuanto recargues.</div>` : ""}
          <div style="margin-top:14px"><button class="btn" id="salir">Cerrar sesión</button></div>
        </div>
      </div>

    </div>

    <div class="grid">
      ${s ? tarjetaPrivacidad(s) : ""}
    </div>
  </div>`;
};

function iniciales(s){
  if (!s) return "·";
  return ((s.nombre || "")[0] || "").toUpperCase() + ((s.apellidos || "")[0] || "").toUpperCase();
}

function tarjetaVincular(){
  const correo = SESION.usuario.email;
  const suyas = C("socios").filter(x => (x.email || "").toLowerCase() === correo.toLowerCase());
  return `<div class="card"><div class="card-h"><h3>Tu ficha de socio</h3></div>
    <div class="card-b">
      <div class="note warn" style="margin-bottom:12px">Esta cuenta no está atada a ningún
        número de socio, así que no tienes perfil ni puedes registrar ejemplares.</div>
      ${suyas.length ? `
        <table><tbody>${suyas.map(x => `<tr>
          <td class="num">${esc(x.numero)}</td>
          <td>${esc(x.nombreCompleto)}</td>
          <td style="text-align:right"><button class="btn sm brand" data-vincular="${esc(x.id)}">Es la mía</button></td>
        </tr>`).join("")}</tbody></table>`
      : `<p class="dim">En el censo no hay ninguna ficha con ${esc(correo)}. Escribe a
         secretaría para que actualicen tu correo.</p>`}
    </div></div>`;
}

function tarjetaPrivacidad(s){
  const campos = [
    ["email","Correo"], ["telefono","Teléfono"], ["poblacion","Población"],
    ["provincia","Provincia"], ["afijo","Afijo"], ["disciplinas","Disciplinas"],
    ["variedades","Variedades"], ["bio","Presentación"], ["web","Web"],
    ["redes","Redes sociales"], ["rsce","Datos RSCE"], ["fechaAlta","Antigüedad en el club"],
    ["profesion","Profesión"], ["fechaNacimiento","Fecha de nacimiento"],
  ];
  return `<div class="card"><div class="card-h"><h3>Quién te ve</h3></div>
    <div class="card-b">
      <div class="f wide" style="margin-bottom:14px">
        <label>Tu perfil en el directorio</label>
        <select class="inp" id="priv-perfil">
          ${PERFIL_NIV.map(([v,t]) => `<option value="${v}" ${(s.perfilPublico||"oculto")===v?"selected":""}>${esc(t)}</option>`).join("")}
        </select>
        <span class="hint2">De fábrica nadie te ve. Tú decides cuándo eso cambia.</span>
      </div>

      <table><thead><tr><th>Dato</th><th style="text-align:right">Quién lo ve</th></tr></thead>
      <tbody>
        ${campos.map(([k,t]) => `<tr>
          <td>${esc(t)}</td>
          <td style="text-align:right">
            <select class="inp sm" data-priv="${k}" style="width:auto">
              ${NIVELES.map(([v,n]) => `<option value="${v}" ${nivelDe(s,k)===v?"selected":""}>${esc(n)}</option>`).join("")}
            </select>
          </td></tr>`).join("")}
      </tbody></table>

      <div class="note" style="margin-top:14px">Tu número de cuenta bancaria no está en esta
      lista y no se comparte en ningún nivel: solo lo ven tú y la tesorería.</div>
    </div></div>`;
}
