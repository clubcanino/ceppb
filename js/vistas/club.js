/* Cargos, jueces, administradores e invitaciones. */
"use strict";


V.cargos = function(){
  const socios = C("socios");
  const conCargo = socios.filter(s => (s.roles||[]).length);
  const fila = s => `<tr class="${perfilVisible(s)?"clic":""}" ${perfilVisible(s)?`data-go="socio/${esc(s.id)}"`:""}>
      <td><span class="celda-nm">${avatar(s,30)}<span><span class="nm">${esc(s.nombreCompleto)}</span>
        <div class="mini">Socio nº ${esc(s.numero)}${s.provincia?` · ${esc(s.provincia)}`:""}</div></span></span></td>
      <td>${(s.roles||[]).map(r=>`<span class="chip est">${esc(r)}</span>`).join(" ")}</td>
      <td class="mini">${esc(s.grupoTrabajo||"")}</td>
      <td style="text-align:right">${perfilVisible(s)?`<span class="chip">Ver perfil</span>`:`<span class="mini">Perfil reservado</span>`}</td></tr>`;
  const bloques = BLOQUES_CARGO.map(b => {
    const l = conCargo.filter(s => b.roles.some(r => (s.roles||[]).includes(r)))
      .sort((a,b2) => String(a.apellidos).localeCompare(String(b2.apellidos), "es"));
    return `<div class="card" style="margin-bottom:14px"><div class="card-h"><h3>${esc(b.t)}</h3>
        <span class="spacer"></span><span class="hint">${l.length}</span></div>
      <div class="card-b" style="padding:0">
        <div class="mini" style="padding:11px 16px;border-bottom:1px solid var(--line)">${esc(b.d)}</div>
        ${l.length ? `<table>${l.map(fila).join("")}</table>`
          : `<div class="empty" style="padding:24px">Sin nombramientos registrados${SESION.esAdmin?". Asígnalos desde la ficha de cada socio.":""}</div>`}
      </div></div>`;
  }).join("");
  const grupos = [...new Set(socios.map(s=>s.grupoTrabajo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  return `<div class="note" style="margin-bottom:16px">El club mantiene públicos los listados de sus jueces, figurantes y grupos colaboradores <span class="rule-src">Cap. 5 y Cap. 6.2</span>. <b>Los cargos son públicos aunque el socio tenga el perfil reservado:</b> ejercer una función oficial del club no es un dato personal que se comparta a voluntad. Lo reservado sigue siéndolo: de quien no ha hecho público su perfil aquí sólo constan su nombre y su cargo. Los nombramientos los hace la Junta Directiva.</div>
    ${conCargo.length ? bloques : `<div class="card"><div class="empty"><b>Todavía no hay nombramientos</b>
      Aquí aparecerán los jueces de trabajo, los jueces confirmadores, los figurantes y los veterinarios registrados, cada uno en su propio listado.
      ${SESION.esAdmin?`<div style="margin-top:14px"><button class="btn brand" data-go="socios">Ir al censo y asignar cargos</button></div>`:""}</div></div>`}
    ${grupos.length?`<div class="card"><div class="card-h"><h3>Grupos y clubes colaboradores</h3><span class="hint">${grupos.length}</span></div>
      <div class="card-b"><div class="mini" style="margin-bottom:10px">Grupos de trabajo reconocidos por la RSCE en los que entrenan socios del club (Cap. 5.5).</div>
      ${grupos.map(g=>`<span class="chip" style="margin:0 5px 5px 0">${esc(g)} <span class="dim">${socios.filter(s=>s.grupoTrabajo===g).length}</span></span>`).join("")}</div></div>`:""}`;
};

/* --- Cuentas con permiso de junta directiva --- */
V.admins = function(){
  /* La lista sale de la tabla admins, que es la que consulta la base
     de datos para decidir quién manda. Antes se leía de una colección
     del prototipo que ya no existe, y por eso salía siempre vacía. */
  const emails = C("admins").map(a => a.email).filter(Boolean).sort();
  const socioDe = e => C("socios").find(s => (s.email||"").toLowerCase() === String(e).toLowerCase());
  return `<div class="note" style="margin-bottom:16px">Estas son las cuentas con permiso de junta directiva: validan pruebas de salud y resultados, autorizan cruces intervariedades y cambios de titularidad, asignan los cargos del club y son las únicas que ven los datos reservados.</div>
    <div class="cols23">
      <div class="card"><div class="card-h"><h3>Cuentas autorizadas</h3><span class="hint">${emails.length}</span>
        <span class="spacer"></span><button class="btn sm" data-form="admins|">Editar la lista</button></div>
        <div class="card-b" style="padding:0">
          ${emails.length ? `<table>${emails.map(e=>{const s=socioDe(e);
            return `<tr><td><span class="num">${esc(e)}</span>
              <div class="mini">${s?`Socio nº ${esc(s.numero)} · ${esc(s.nombreCompleto)}`:"Cuenta de servicio del club, sin ficha de socio asociada"}</div></td>
              <td style="text-align:right">${s?`<button class="btn sm" data-go="socio/${esc(s.id)}">Ver ficha</button>`:`<span class="chip">Sin ficha</span>`}</td></tr>`;}).join("")}</table>`
            : `<div class="empty" style="padding:30px">Sin cuentas configuradas</div>`}
        </div></div>
      <div class="card"><div class="card-h"><h3>Qué puede hacer la junta</h3></div><div class="card-b">
        <div class="reqs">
          <div class="req">${marca("ok")}<div class="tx"><b>Validar salud, títulos y resultados</b><small>Ningún socio puede dar por buenos sus propios papeles. Hasta que la junta los coteja con el certificado, no cuentan para nada.</small></div></div>
          <div class="req">${marca("ok")}<div class="tx"><b>Ver los datos reservados</b><small>El DNI, la dirección y el número de cuenta. Ningún otro socio los ve, tenga el perfil abierto o cerrado.</small></div></div>
          <div class="req">${marca("ok")}<div class="tx"><b>Nombrar los cargos del club</b><small>Jueces de trabajo, jueces confirmadores, figurantes y veterinarios registrados. Un socio no puede asignárselos.</small></div></div>
          <div class="req">${marca("ok")}<div class="tx"><b>Autorizar traspasos y cruces intervariedades</b><small>El cambio de titularidad de un ejemplar y los cruces entre variedades no se aplican hasta que la junta los resuelve.</small></div></div>
        </div>
        <div class="mini" style="margin-top:12px">Quitar un correo de esta lista le retira el permiso al instante.</div>
      </div></div>
    </div>`;
};

/* ============================================================
   Invitaciones de alta — una a una, con enlace de un solo uso
   ============================================================ */
function tokenNuevo(){
  const a = new Uint8Array(16);
  (crypto && crypto.getRandomValues) ? crypto.getRandomValues(a) : a.forEach((_,i)=>a[i]=Math.floor(Math.random()*256));
  return [...a].map(x => x.toString(16).padStart(2, "0")).join("");
}
function textoInvitacion(s, token){
  const enlace = `https://ceppb.info/alta/${token}`;
  return {
    asunto: `${s.nombre || "Hola"}, tu acceso al Libro de Cría del CEPPB`,
    cuerpo:
`Hola ${s.nombre || ""}:

El Club Español del Perro Pastor Belga ha puesto en marcha el Libro de Cría, la plataforma donde el club lleva el censo de socios, las fichas de los ejemplares, las pruebas de salud, los títulos y las camadas.

Tu perfil ya existe con los datos que constan en secretaría (socio nº ${s.numero}). Nadie puede verlo todavía: los perfiles nacen reservados y eres tú quien decide si apareces en el directorio del club y qué datos compartes. El número de cuenta no se comparte nunca, con nadie.

Entra aquí para tomar posesión de tu perfil:
${enlace}

El enlace es personal y de un solo uso. Si no funciona o no eres tú quien debería recibirlo, escríbenos y lo anulamos.

Una vez dentro podrás dar de alta tus perros, subir sus fotos y vídeos, registrar sus pruebas de salud y títulos —la Comisión de Cría los coteja con los certificados antes de que cuenten— e inscribirte en los eventos del club.

Un saludo,
Junta Directiva del CEPPB
pres.ceppb@gmail.com · www.ceppb.info`,
    enlace,
  };
}

let filtroInv = "pendientes";
V.invitaciones = function(){
  const socios = C("socios").slice().sort((a,b)=>(a.numero||0)-(b.numero||0));
  const conEmail = socios.filter(s => s.email);
  const sinEmail = socios.filter(s => !s.email);
  const est = s => (s.invitacion||{}).estado || "no_enviada";
  const grupos = {
    pendientes: conEmail.filter(s => est(s) === "no_enviada"),
    enviadas:   conEmail.filter(s => est(s) === "enviada"),
    aceptadas:  conEmail.filter(s => est(s) === "aceptada"),
  };
  const l = grupos[filtroInv] || [];
  const chipEst = s => ({no_enviada:`<span class="chip">Sin invitar</span>`,
    enviada:`<span class="chip warn">Invitada ${fmtF((s.invitacion||{}).fecha)}</span>`,
    aceptada:`<span class="chip ok">Perfil reclamado</span>`})[est(s)];
  return `<div class="note" style="margin-bottom:16px">Cada invitación lleva un <b>enlace personal de un solo uso</b>: es lo que ata la cuenta al número de socio y evita que nadie reclame un perfil ajeno. El estado de cada una queda registrado aquí.</div>
    <div class="note warn" style="margin-bottom:16px"><b>Advierte a los socios de que miren en Spam.</b>
    Un correo automático que llega por primera vez cae en el buzón de no deseado más veces
    de las que llega a la bandeja de entrada, y el socio da por hecho que no le ha llegado.
    Dile que busque <b>CEPPB</b> en el buscador de su correo, que marque el mensaje como
    <b>«No es spam»</b> y que añada el remitente a sus contactos: así los siguientes ya
    entran bien. Un socio que aparece como <b>Invitada</b> desde hace días y no ha
    reclamado su perfil casi siempre tiene el correo en esa carpeta.</div>
    <div class="stats" style="margin-bottom:16px">
      <div class="stat"><div class="k">Invitables</div><div class="v">${conEmail.length}</div><div class="n">Con correo en secretaría</div></div>
      <div class="stat"><div class="k">Enviadas</div><div class="v">${grupos.enviadas.length}</div><div class="n">Esperando que entren</div></div>
      <div class="stat"><div class="k">Reclamados</div><div class="v">${grupos.aceptadas.length}</div><div class="n">Ya usan la plataforma</div></div>
      <div class="stat"><div class="k">Sin correo</div><div class="v">${sinEmail.length}</div><div class="n">Reclamación manual en secretaría</div></div>
    </div>
    <div class="filters">
      <div class="seg">${[["pendientes","Sin invitar"],["enviadas","Enviadas"],["aceptadas","Reclamados"]]
        .map(([k,n])=>`<button data-inv-f="${k}" class="${filtroInv===k?"on":""}">${n} (${grupos[k].length})</button>`).join("")}</div>
      <span class="spacer"></span><span class="mini">${l.length} socio(s)</span>
    </div>
    <div class="tw"><table><thead><tr><th class="nos">Nº</th><th class="nos">Socio</th><th class="nos">Correo</th><th class="nos">Estado</th><th class="nos"></th></tr></thead>
      <tbody>${l.length ? l.map(s => `<tr>
        <td class="num">${esc(s.numero)}</td>
        <td><span class="nm">${esc(s.nombreCompleto)}</span>${s.provincia?`<div class="mini">${esc(s.provincia)}</div>`:""}</td>
        <td class="num">${esc(s.email)}</td>
        <td>${chipEst(s)}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn sm" data-inv="ver|${esc(s.id)}">${est(s)==="no_enviada"?"Preparar invitación":"Ver invitación"}</button>
          ${est(s)==="enviada"?`<button class="btn sm" data-inv="reclamada|${esc(s.id)}" title="Marcar que ya ha entrado">Marcar reclamado</button>`:""}
        </td></tr>`).join("") : `<tr><td colspan="5"><div class="empty" style="padding:30px">Nada en esta lista</div></td></tr>`}
      </tbody></table></div>
    ${sinEmail.length?`<div class="note warn" style="margin-top:16px"><b>${sinEmail.length} socios no tienen correo en el fichero de secretaría.</b> No se les puede invitar: reclaman su perfil a mano con nº de socio, DNI y teléfono, y la secretaría lo aprueba. Los tienes listados en «Vinculación de altas».</div>`:""}`;
};
