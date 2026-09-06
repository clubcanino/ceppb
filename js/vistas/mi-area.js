/* Área del socio: mi perfil y mi cuota. */
"use strict";

/* --- Mi perfil --- */
V.yo = function(){
  const s = SESION.socio;
  if(!s) return `<div class="empty"><b>Entra como socio</b>Usa el selector «Ver como» de la cabecera.</div>`;
  const mios = C("perros").filter(p => p.propietarioId === s.id);
  return `<div class="ficha-h">${avatar(s, 72)}<div style="flex:1;min-width:230px"><h2>${esc(s.nombreCompleto)}</h2>
      <div class="meta"><span class="chip mono">Socio nº ${esc(s.numero)}</span><span class="chip">${esc(s.cuota||"")}</span>
      ${s.afijo?`<span class="chip">Afijo ${esc(s.afijo)}</span>`:""}</div></div>
      <div style="display:flex;gap:8px;align-items:center">${botonFoto("avatar","socio",s.id,s.avatar?"Cambiar foto":"Subir foto")}<button class="btn brand" data-form="socio|${esc(s.id)}">Editar mis datos</button></div></div>
    <div class="cols23">
      <div class="grid">
        <div class="card"><div class="card-h"><h3>Mis ejemplares</h3><span class="spacer"></span><button class="btn sm" data-form="perro|">Añadir ejemplar</button></div>
          <div class="card-b" style="padding:0">${mios.length?tablaPerrosMini(mios):`<div class="empty" style="padding:30px"><b>Aún no has dado de alta ningún perro</b>Al añadirlo podrás importar su pedigrí y registrar títulos y pruebas.</div>`}</div></div>
        <div class="card lift"><div class="card-h"><h3>¿Aparezco en el club?</h3></div><div class="card-b">
          <div class="mini" style="margin-bottom:10px">Mientras esté en <b>No aparecer</b>, ningún socio ve tu perfil ni sabe que existe. Sólo tú y la junta directiva.</div>
          <div class="seg">${PERFIL_NIV.map(([k,n])=>`<button data-perfil="${esc(s.id)}|${k}" class="${(s.perfilPublico||"oculto")===k?"on":""}">${esc(n)}</button>`).join("")}</div>
          ${(s.perfilPublico||"oculto")==="oculto"?`<div class="note warn" style="margin-top:11px">Ahora mismo no apareces en el directorio. Los ajustes de abajo no tendrán efecto hasta que te des a conocer.</div>`:""}
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
          <div class="note block" style="margin-bottom:10px">El número de cuenta <b>no se puede compartir en ningún nivel</b>. No aparece entre los ajustes de privacidad ni en el directorio, y el propio servidor impide leerlo a quien no sea la junta.</div>
          <dl class="kv" style="margin-top:10px"><dt>Cuota</dt><dd>${esc(s.cuota||"—")}</dd>
          <dt>IBAN de domiciliación</dt><dd class="num">${esc(byId(C("socios_privado"),s.id)?.iban ? "•••• "+byId(C("socios_privado"),s.id).iban.slice(-4) : "—")}</dd></dl>
          <button class="btn sm" style="margin-top:10px" data-form="bancario|${esc(s.id)}">Cambiar cuenta bancaria</button></div></div>
      </div></div>`;
};

/* --- Cuota y pagos del socio --- */
V.cuenta = function(){
  const s = SESION.socio;
  if(!s) return `<div class="empty"><b>Entra como socio</b>Usa el selector «Ver como».</div>`;
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
