/* ============================================================
   Entrar — acceso por enlace mágico al correo.

   No hay contraseñas. El socio escribe el correo que consta en
   secretaría, recibe un enlace y con eso entra. Si viene de una
   invitación, ese mismo paso ata su cuenta a su número de socio.
   ============================================================ */
"use strict";

let estadoEntrar = { enviado: false, correo: "" };

V.entrar = function(){
  if (SESION.usuario) return panelCuenta();

  const invitacion = pendienteDeInvitacion();

  if (estadoEntrar.enviado){
    return `<div class="card" style="max-width:520px">
      <div class="card-b">
        <div class="note ok" style="margin-bottom:14px">Enlace enviado</div>
        <h3>Mira tu correo</h3>
        <p>Hemos enviado un enlace a <b>${esc(estadoEntrar.correo)}</b>.
        Ábrelo desde este mismo dispositivo y entrarás sin escribir ninguna contraseña.</p>
        <p class="dim">Si no aparece en unos minutos, revisa la carpeta de correo no deseado.
        El enlace caduca; si expira, pide otro.</p>
        <button class="btn" id="otro-enlace">Usar otro correo</button>
      </div>
    </div>`;
  }

  return `<div class="card" style="max-width:520px">
    <div class="card-b">
      ${invitacion ? `<div class="note ok" style="margin-bottom:14px">
        Tienes una invitación de secretaría preparada. Entra con el correo al que la recibiste
        y tu cuenta quedará vinculada a tu ficha de socio.</div>` : ""}
      <h3>Acceso de socios</h3>
      <p>Escribe el correo que consta en la secretaría del club. Te llegará un enlace
      para entrar: no hay contraseña que recordar.</p>
      <div class="f wide" style="margin:14px 0">
        <label for="correo">Correo electrónico</label>
        <input class="inp" id="correo" type="email" autocomplete="email"
               placeholder="nombre@ejemplo.com" value="${esc(estadoEntrar.correo)}">
      </div>
      <button class="btn brand" id="pedir-enlace">Enviarme el enlace</button>
      <p class="dim" style="margin-top:14px">¿No recibes nada porque tu correo no está en
      secretaría? Escribe al club: hay 18 socios sin correo registrado que reclaman su
      ficha a mano con número de socio, DNI y teléfono.</p>
    </div>
  </div>`;
};

/* Cuando ya has entrado */
function panelCuenta(){
  const s = SESION.socio;
  return `<div class="card" style="max-width:560px">
    <div class="card-b">
      <h3>Tu cuenta</h3>
      <dl class="kv" style="margin-top:12px">
        <dt>Correo</dt><dd>${esc(SESION.usuario.email)}</dd>
        <dt>Perfil</dt><dd>${SESION.esAdmin ? "Junta directiva" : s ? "Socio" : "Sin vincular"}</dd>
        ${s ? `<dt>Nº de socio</dt><dd class="nm">${esc(s.numero)}</dd>
               <dt>Nombre</dt><dd>${esc(s.nombreCompleto || (s.nombre + " " + s.apellidos))}</dd>` : ""}
      </dl>
      ${!s && !SESION.esAdmin ? `<div class="note warn" style="margin-top:14px">
        Esta cuenta todavía no está atada a ninguna ficha de socio. Necesitas el enlace de
        invitación que envía secretaría al correo que consta en el club.</div>` : ""}
      <div style="margin-top:16px"><button class="btn" id="salir">Cerrar sesión</button></div>
    </div>
  </div>`;
}

/* La ruta #/alta/TOKEN guarda el enlace y manda a entrar */
V.alta = function(token){
  if (token) SESION.guardarInvitacion(token);
  return V.entrar();
};

function pendienteDeInvitacion(){
  try { return !!localStorage.getItem("ceppb.invitacion"); } catch(e){ return false; }
}

/* ---------- interacción ---------- */
document.addEventListener("click", async ev => {
  const t = ev.target;

  if (t.id === "otro-enlace"){
    estadoEntrar = { enviado:false, correo:estadoEntrar.correo };
    return render();
  }

  if (t.id === "pedir-enlace"){
    const correo = ($("#correo").value || "").trim();
    if (!correo || !correo.includes("@")) return toast("Escribe un correo válido");
    t.disabled = true;
    try {
      await SESION.pedirEnlace(correo);
      estadoEntrar = { enviado:true, correo };
      render();
    } catch(e){
      t.disabled = false;
      toast(e.message || "No se ha podido enviar el enlace");
    }
  }
});
