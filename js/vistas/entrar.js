/* ============================================================
   Entrar y darse de alta.

   El día a día es correo y contraseña. El enlace al correo aparece
   dos veces: cuando secretaría invita a un socio (y ahí elige su
   contraseña) y cuando alguien la ha olvidado.
   ============================================================ */
"use strict";

let modoEntrar = { paso: "contrasena", correo: "", enviado: false };

V.entrar = function(){
  if (SESION.usuario) return panelCuenta();

  if (modoEntrar.enviado) return avisoCorreoEnviado();
  if (modoEntrar.paso === "olvidada") return formOlvidada();
  return formContrasena();
};

function formContrasena(){
  const invitacion = hayInvitacionGuardada();
  return `<div class="card" style="max-width:460px"><div class="card-b">
    ${invitacion ? `<div class="note ok" style="margin-bottom:14px">
      Tienes una invitación del club preparada. Entra por
      <b>«Es mi primera vez»</b> para vincular tu cuenta y elegir contraseña.</div>` : ""}
    <h3>Acceso de socios</h3>
    <div class="f wide" style="margin:14px 0 10px">
      <label for="correo">Correo</label>
      <input class="inp" id="correo" type="email" autocomplete="username"
             placeholder="nombre@ejemplo.com" value="${esc(modoEntrar.correo)}">
    </div>
    <div class="f wide" style="margin-bottom:16px">
      <label for="clave">Contraseña</label>
      <input class="inp" id="clave" type="password" autocomplete="current-password">
    </div>
    <button class="btn brand" id="entrar-clave">Entrar</button>
    <div style="margin-top:18px;display:flex;gap:16px;flex-wrap:wrap">
      <a class="linkish" id="ir-olvidada">He olvidado la contraseña</a>
      <a class="linkish" id="ir-primera">Es mi primera vez</a>
    </div>
    <p class="dim" style="margin-top:18px;margin-bottom:0">
      ¿Es la primera vez que oyes hablar de esto?
      <a href="manual.html">Lee el manual</a>: qué puedes hacer aquí y cómo
      instalarlo en el móvil.</p>
  </div></div>`;
}

function formOlvidada(){
  return `<div class="card" style="max-width:460px"><div class="card-b">
    <h3>Entrar con un enlace al correo</h3>
    <p>Escribe el correo que consta en secretaría. Te llega un enlace, entras con él y
    eliges una contraseña nueva.</p>
    <div class="f wide" style="margin:14px 0 16px">
      <label for="correo">Correo</label>
      <input class="inp" id="correo" type="email" autocomplete="email"
             placeholder="nombre@ejemplo.com" value="${esc(modoEntrar.correo)}">
    </div>
    <button class="btn brand" id="pedir-enlace">Enviarme el enlace</button>
    <div class="note warn" style="margin-top:16px">El correo puede caerte en
    <b>Spam</b> o <b>Correo no deseado</b>. Míralo ahí antes de volver a pedirlo:
    busca <b>CEPPB</b>.</div>
    <div style="margin-top:14px"><a class="linkish" id="ir-clave">Volver</a></div>
    <p class="dim" style="margin-top:16px">Si el club no tiene tu correo —hay 18 socios en ese
    caso— escribe a secretaría: reclamarás tu ficha a mano con tu número de socio, DNI y teléfono.</p>
  </div></div>`;
}

/* El aviso del correo no deseado va en grande y con instrucciones,
   no como una coletilla al final: es la razón número uno por la que un
   socio se queda fuera creyendo que el enlace no le ha llegado. */
function avisoSpam(){
  return `<div class="note warn">
    <b>Si no lo ves en dos minutos, mira en Spam o Correo no deseado.</b>
    Es lo que pasa la mayoría de las veces. Busca <b>CEPPB</b> en el buscador de tu correo:
    todos los mensajes del club lo llevan en el asunto.
    <div style="margin-top:8px">Cuando lo encuentres ahí, marca
    <b>«No es spam»</b> y añade el remitente a tus contactos. Así los siguientes
    llegarán a la bandeja de entrada.</div>
  </div>`;
}

function avisoCorreoEnviado(){
  return `<div class="card" style="max-width:520px"><div class="card-b">
    <div class="note ok" style="margin-bottom:14px">Enlace enviado</div>
    <h3>Mira tu correo</h3>
    <p style="margin-bottom:12px">Hemos enviado un enlace a <b>${esc(modoEntrar.correo)}</b>.
    Ábrelo desde este mismo dispositivo y desde este mismo navegador.</p>
    ${avisoSpam()}
    <p class="dim" style="margin-top:12px">El enlace sirve una sola vez y caduca en una hora.
    Si caduca, vuelve aquí y pide otro.</p>
    <button class="btn" id="ir-clave" style="margin-top:14px">Volver</button>
  </div></div>`;
}

/* ---------- ya dentro ---------- */
function panelCuenta(){
  const s = SESION.socio;
  return `<div class="card" style="max-width:560px"><div class="card-b">
    <h3>Tu cuenta</h3>
    <dl class="kv" style="margin-top:12px">
      <dt>Correo</dt><dd>${esc(SESION.usuario.email)}</dd>
      <dt>Perfil</dt><dd>${SESION.esAdmin ? "Junta directiva" : s ? "Socio" : "Sin vincular"}</dd>
      ${s ? `<dt>Nº de socio</dt><dd class="nm">${esc(s.numero)}</dd>
             <dt>Nombre</dt><dd>${esc(s.nombreCompleto || "")}</dd>` : ""}
    </dl>
    <div style="margin-top:16px;display:flex;gap:8px">
      <button class="btn" data-ir="ajustes">Mi cuenta</button>
      <button class="btn" id="salir">Cerrar sesión</button>
    </div>
  </div></div>`;
}

/* La ruta #/alta/TOKEN guarda la invitación y lleva al alta */
V.alta = function(token){
  if (token) SESION.guardarInvitacion(token);
  if (SESION.usuario) return V.ajustes();
  modoEntrar.paso = "olvidada";
  return V.entrar();
};

function hayInvitacionGuardada(){
  try { return !!localStorage.getItem("ceppb.invitacion"); } catch(e){ return false; }
}

/* ---------- interacción ---------- */
document.addEventListener("click", async ev => {
  const t = ev.target;

  if (t.id === "ir-olvidada" || t.id === "ir-primera"){
    modoEntrar.paso = "olvidada"; modoEntrar.enviado = false; return render();
  }
  if (t.id === "ir-clave"){
    modoEntrar.paso = "contrasena"; modoEntrar.enviado = false; return render();
  }

  if (t.id === "entrar-clave"){
    const correo = ($("#correo").value || "").trim();
    const clave  = $("#clave").value || "";
    if (!correo.includes("@")) return toast("Escribe un correo válido");
    if (!clave) return toast("Escribe tu contraseña");
    t.disabled = true;
    try { await SESION.entrarConContrasena(correo, clave); }
    catch(e){
      t.disabled = false;
      toast(/Invalid login/i.test(e.message)
        ? "Ese correo y esa contraseña no coinciden"
        : (e.message || "No se ha podido entrar"));
    }
    return;
  }

  if (t.id === "pedir-enlace"){
    const correo = ($("#correo").value || "").trim();
    if (!correo.includes("@")) return toast("Escribe un correo válido");
    t.disabled = true;
    try {
      await SESION.pedirEnlace(correo);
      modoEntrar.correo = correo; modoEntrar.enviado = true;
      render();
    } catch(e){
      t.disabled = false;
      toast(e.message || "No se ha podido enviar el enlace");
    }
  }
});
