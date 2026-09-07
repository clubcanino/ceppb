/* ============================================================
   Definición de cada formulario. Portado del prototipo,
   adaptado a la sesión real (SESION en lugar de SES).
   ============================================================ */
const FORMS = {
  socio(id){
    const s = byId(C("socios"), id) || {};
    const nuevo = !id;
    abrirForm(nuevo ? "Dar de alta un socio" : "Editar perfil de socio", [
      {t:"Identidad", f:[
        {k:"nombre", l:"Nombre", v:s.nombre}, {k:"apellidos", l:"Apellidos", v:s.apellidos},
        {k:"fechaNacimiento", l:"Fecha de nacimiento", tipo:"date", v:s.fechaNacimiento},
        {k:"profesion", l:"Profesión o dedicación", v:s.profesion},
        {k:"bio", l:"Presentación", tipo:"textarea", v:s.bio, ph:"Cuéntale al club a qué te dedicas con la raza…"},
      ]},
      {t:"Contacto", f:[
        {k:"email", l:"Correo", tipo:"email", v:s.email}, {k:"telefono", l:"Teléfono", v:s.telefono},
        {k:"poblacion", l:"Población", v:s.poblacion}, {k:"provincia", l:"Provincia", v:s.provincia},
        {k:"cp", l:"Código postal", v:s.cp}, {k:"pais", l:"País", v:s.pais || "España"},
        {k:"web", l:"Web", v:s.web, ph:"https://"},
        {k:"facebook", l:"Facebook", v:s.facebook},
        {k:"instagram", l:"Instagram", v:s.instagram, ph:"@usuario"},
        {k:"workingdogPerfil", l:"Perfil en working-dog", v:s.workingdogPerfil, ph:"https://"},
      ]},
      {t:"Cinofilia", f:[
        {k:"rsceSocio", l:"Socio de la Real Sociedad Canina de España", tipo:"check", v:s.rsceSocio, wide:true},
        {k:"rsceNumero", l:"Nº de socio RSCE", v:s.rsceNumero},
        {k:"rsceDesde", l:"Socio RSCE desde", tipo:"date", v:s.rsceDesde},
        {k:"afijo", l:"Afijo de criador (FCI/RSCE)", v:s.afijo, h:"Necesario para el cruce intervariedades (Cap. 8.3.2)"},
        {k:"afijoFecha", l:"Concesión del afijo", tipo:"date", v:s.afijoFecha},
        {k:"grupoTrabajo", l:"Grupo o club de trabajo", v:s.grupoTrabajo, wide:true, h:"Grupo colaborador del CEPPB en el que entrenas (Cap. 5.5)"},
        {k:"disciplinas", l:"Disciplinas que practica", tipo:"checks", op:DISCIPLINAS, v:s.disciplinas},
        {k:"variedades", l:"Variedades que tiene o cría", tipo:"checks", op:VARIEDADES, v:s.variedades},
      ]},
      ...(SESION.esAdmin ? [{t:"Cargos y titulaciones del club",
        d:"Los nombra la Junta Directiva (Cap. 5). El socio no puede asignárselos.", f:[
        {k:"roles", l:"Condición dentro del CEPPB", tipo:"checks", op:ROLES_CLUB, v:s.roles},
      ]},
      {t:"Sólo secretaría", d:"Estos campos no los edita el socio.", f:[
        {k:"numero", l:"Nº de socio", tipo:"number", v:s.numero ?? siguienteNumeroSocio(),
         h: nuevo ? "Se propone el siguiente libre; cámbialo si secretaría usa otro" : ""},
        {k:"cuota", l:"Cuota", tipo:"select", op:["Individual","Familiar","Familiar principal","Familiar secundaria","Honorífica","Sin asignar"], v:s.cuota},
        {k:"fechaAlta", l:"Fecha de alta", tipo:"date", v:s.fechaAlta},
        {k:"fechaBaja", l:"Fecha de baja", tipo:"date", v:s.fechaBaja},
        {k:"notas", l:"Notas internas", tipo:"textarea", v:s.notas},
      ]}] : []),
    ], async d => {
      const n = Object.assign({}, s, d);
      n.rsceSocio = !!d.rsceSocio;
      if(!SESION.esAdmin) n.roles = s.roles || [];   // los cargos sólo los toca la junta
      if(d.numero) n.numero = Number(d.numero);

      if (!n.nombre || !n.apellidos) return toast("Hacen falta el nombre y los apellidos");

      if (nuevo){
        if (!n.numero) return toast("El socio necesita un número");
        const repetido = C("socios").find(x => x.numero === n.numero);
        if (repetido)
          return toast(`El número ${n.numero} ya es de ${repetido.nombreCompleto}`);
        n.perfilPublico = n.perfilPublico || "oculto";   // nace oculto, como todos
        if (!n.fechaAlta) n.fechaAlta = hoy();
      }

      delete n.id;
      try {
        const nid = await guardar("socios", id, n);
        toast(nuevo ? `Socio nº ${n.numero} dado de alta` : "Perfil actualizado");
        if (nuevo) ir("socio/" + nid);
        else render();
      } catch(e){ toast(e.message || "No se ha podido guardar"); }
    });
  },
  perro(id){
    const p = byId(C("perros"), id) || {};
    abrirForm(id ? "Editar ejemplar" : "Dar de alta un ejemplar", [
      {t:"Identificación", f:[
        {k:"nombre", l:"Nombre", v:p.nombre, h:"Sin el afijo: ese va en el campo de al lado"},
        {k:"afijo", l:"Afijo del criadero", v:p.afijo, ph:"Del criador, tal como figura en el LOE",
         h:"Escríbelo tal cual. Si es el afijo de un socio del club, la ficha se enlaza sola con él"},
        {k:"variedad", l:"Variedad", tipo:"select", op:[""].concat(VARIEDADES), v:p.variedad},
        {k:"sexo", l:"Sexo", tipo:"select", op:[["M","Macho"],["H","Hembra"]], v:p.sexo||"M"},
        {k:"fechaNacimiento", l:"Fecha de nacimiento", tipo:"date", v:p.fechaNacimiento},
        {k:"loe", l:"LOE", v:p.loe, h:"Libro de Orígenes Español"}, {k:"chip", l:"Microchip", v:p.chip},
        {k:"tatuaje", l:"Tatuaje", v:p.tatuaje}, {k:"color", l:"Color / capa", v:p.color},
      ]},
      {t:"Criador", d:"Quien crió la camada. Escribe y van saliendo los socios del club; si el criador no lo es, escribe su nombre y ya está.", f:[
        {k:"criadorNombre", l:"Nombre del criador", tipo:"buscador",
         op: nombresDeSocios(), v: nombreDelCriador(p), wide:true,
         ph:"Empieza a escribir el nombre"},
      ]},

      {t:"Propietario", f:[
        {k:"propietarioId", l:"Propietario", tipo:"select",
         op: SESION.esAdmin ? optSocios() : [[miSocioId()||"", (SESION.socio && SESION.socio.nombreCompleto) || "Tú"]],
         v: p.propietarioId ?? (miSocioId()||""), wide:true,
         h: SESION.esAdmin ? "" : "Tus perros van a tu nombre"},
      ]},

      {t:"Padres", d:"Escribe el nombre y, a partir de tres letras, salen los del libro del club. Si el perro no está, escríbelo igual: se añade al libro y su pedigrí se irá completando.", f:[
        {k:"padreNombre", l:"Padre", tipo:"buscador", op:nombresDePerros("M"),
         v:nombreDePerro(p.padreId), wide:true, ph:"Empieza a escribir"},
        {k:"madreNombre", l:"Madre", tipo:"buscador", op:nombresDePerros("H"),
         v:nombreDePerro(p.madreId), wide:true, ph:"Empieza a escribir"},
      ]},

      {t:"Abuelos", d:"Solo si sus padres no están todavía en el libro. Si ya están, sus padres se heredan solos y esto se puede dejar en blanco.", f:[
        {k:"abueloPP", l:"Padre del padre", tipo:"buscador", op:nombresDePerros("M"), v:nombreDePerro(abueloDe(p,"P","P"))},
        {k:"abuelaPM", l:"Madre del padre", tipo:"buscador", op:nombresDePerros("H"), v:nombreDePerro(abueloDe(p,"P","M"))},
        {k:"abueloMP", l:"Padre de la madre", tipo:"buscador", op:nombresDePerros("M"), v:nombreDePerro(abueloDe(p,"M","P"))},
        {k:"abuelaMM", l:"Madre de la madre", tipo:"buscador", op:nombresDePerros("H"), v:nombreDePerro(abueloDe(p,"M","M"))},
      ]},
      {t:"Importar pedigrí", d:"Pega el enlace de la ficha en working-dog y los datos que quieras traer. La plataforma no puede descargarlos por sí sola: working-dog no ofrece acceso automatizado libre.", f:[
        {k:"workingdogUrl", l:"Enlace working-dog", v:p.workingdogUrl, wide:true, ph:"https://www.working-dog.com/dogs-details/…"},
        {k:"pedigriPegado", l:"Pedigrí pegado", tipo:"textarea", v:p.pedigriPegado, ph:"Padre: … / Madre: … / Abuelos: …", h:"Se guarda como texto de referencia hasta que vincules los progenitores arriba"},
      ]},
      {t:"Visibilidad", f:[
        {k:"visibilidad", l:"Quién ve esta ficha", tipo:"select", op:NIVELES, v:p.visibilidad||"socios", wide:true},
        {k:"adnEjemplar", l:"Perfil de ADN del ejemplar depositado", tipo:"check", v:p.adnEjemplar, wide:true, h:"El del propio perro, no el de sus padres"},
      ]},
    ], async d => {
      const n = Object.assign({}, p, d);
      n.adnEjemplar = !!d.adnEjemplar;
      n.afijo = limpiarAfijo(d.afijo);

      /* El criador se escribe con el buscador. Si el nombre es de un
         socio del club, la ficha se enlaza con él y así ese criador
         sigue viendo lo criado bajo su afijo. Si no lo es —que pasa a
         menudo— se guarda igual y no pasa nada.

         Si no se escribió criador, se prueba por el afijo: muchos
         afijos del censo identifican al criador sin más. */
      const cri = socioPorNombre(d.criadorNombre) || socioPorAfijo(n.afijo);
      n.criadorId    = cri ? cri.id : null;
      n.afijoSocioId = cri ? cri.id : null;
      delete n.criadorNombre;

      /* Padres y abuelos: se buscan en el libro por el nombre y, si no
         están, se añaden. Así el árbol del club crece con cada alta en
         lugar de quedarse en lo que trajimos de working-dog. */
      n.padreId = await perroPorNombreOAlta(d.padreNombre, "M");
      n.madreId = await perroPorNombreOAlta(d.madreNombre, "H");
      await ponerAbuelos(n.padreId, d.abueloPP, d.abuelaPM);
      await ponerAbuelos(n.madreId, d.abueloMP, d.abuelaMM);
      for (const k of ["padreNombre","madreNombre","abueloPP","abuelaPM","abueloMP","abuelaMM"])
        delete n[k];

      delete n.id;
      const nid = await guardar("perros", id, n);
      toast(id ? "Ficha actualizada" : "Ejemplar dado de alta");
      if(!id) ir("perro/" + nid);
    });
  },
  salud(id){
    const p = byId(C("perros"), id) || {}, s = p.salud || {}, g = s.genes || {};
    abrirForm("Pruebas de salud — Anexo A", [
      {t:"Radiología", d:"Diagnóstico de la RSCE o de una asociación reconocida por ella (SETOV, AMVAC o AVEPA).", f:[
        {k:"hd", l:"Displasia de cadera", tipo:"select", op:[""].concat(HD_TODOS), v:s.hd, h:"Aptos: A y B"},
        {k:"hdEntidad", l:"Diagnosticado por", tipo:"select", op:ENTIDADES_DIAGNOSTICO, v:s.hdEntidad},
        {k:"ed", l:"Displasia de codo", tipo:"select", op:[""].concat(ED_TODOS), v:s.ed, h:"Aptos: 0 y 1"},
        {k:"edEntidad", l:"Diagnosticado por", tipo:"select", op:ENTIDADES_DIAGNOSTICO, v:s.edEntidad},
        {k:"lvt", l:"Vértebra de transición (LVT)", tipo:"select", op:[["","Sin tramitar"],["libre","Libre de LVT"],["afectado","Con vértebra de transición"]], v:s.lvt, wide:true, h:"Diagnóstico emitido por el CEPPB"},
      ]},
      {t:"Enfermedades hereditarias", d:"Portador: sólo puede cruzarse con ejemplares libres. Afectado: excluido de la cría.",
        f:GENES.map(x => ({k:"g_"+x.k, l:x.k, tipo:"select", op:[["","Sin analizar"],["libre","Libre"],["portador","Portador"],["afectado","Afectado"]], v:g[x.k], h:x.n}))},
      {t:"Genealogía", f:[
        {k:"adnEjemplar", l:"Perfil de ADN del ejemplar depositado", tipo:"check", v:p.adnEjemplar, wide:true,
         h:"El del propio perro, no el de sus padres"},
        {k:"adnEntidad", l:"Depositado en", tipo:"select", op:ENTIDADES_DIAGNOSTICO,
         v:(p.salud||{}).adnEntidad, wide:true,
         h:"Vale tanto el de la Real Sociedad Canina como el del propio club"},
      ]},
    ], async d => {
      const genes = {}; GENES.forEach(x => { if(d["g_"+x.k]) genes[x.k] = d["g_"+x.k]; });
      const n = Object.assign({}, p, {salud:{hd:d.hd, hdEntidad:d.hdEntidad, ed:d.ed, edEntidad:d.edEntidad, lvt:d.lvt, adnEntidad:d.adnEntidad, genes,
        validacion: SESION.esAdmin ? {estado:"validado", fecha:hoy(), por:"Comisión de Cría"} : {estado:"pendiente"}},
        adnEjemplar: !!d.adnEjemplar});
      delete n.id;
      await guardar("perros", id, n); toast("Pruebas registradas");
    });
  },
  pedigri(id){ FORMS.perro(id); },
  resultado(perroId){
    abrirForm("Registrar resultado", [
      {t:"Tipo de resultado", f:[
        {k:"tipo", l:"Tipo", tipo:"select", op:[["estructura","Estructura / belleza"],["caracter","Prueba de carácter"],["trabajo","Prueba de trabajo"],["confirmacion","Prueba de confirmación"]], v:"estructura", wide:true},
      ]},
      {t:"Evento", f:[
        {k:"fecha", l:"Fecha", tipo:"date", v:hoy()},
        {k:"tipoEvento", l:"Tipo de evento", tipo:"select", op:[""].concat(TIPOS_EVENTO)},
        {k:"evento", l:"Nombre del evento", v:"", wide:true},
        {k:"juez", l:"Juez", v:"", wide:true},
        {k:"organizadoCEPPB", l:"Organizado por el CEPPB", tipo:"check", v:false, wide:true, h:"Necesario para las figuras ACE, ACES y ACSS"},
      ]},
      {t:"Resultado — estructura", f:[
        {k:"calificacion", l:"Calificación", tipo:"select", op:[""].concat(CALIF)},
        {k:"puesto", l:"Puesto", tipo:"number", v:""},
        {k:"distincion", l:"Distinción", tipo:"select", op:DISTINCIONES, wide:true},
      ]},
      {t:"Resultado — carácter / trabajo", f:[
        {k:"modalidad", l:"Prueba de carácter", tipo:"select", op:[["","—"],["TS","Test simple (sociabilidad + estrés acústico)"],["TC","Test completo (+ coraje)"]], wide:true},
        {k:"resultado", l:"Calificación", tipo:"select", op:[["","—"],["APTO","APTO"],["NO APTO","NO APTO"]]},
        {k:"titulo", l:"Título de trabajo", tipo:"select", op:TIT_TRABAJO},
        {k:"puntos", l:"Puntos", tipo:"number", v:"", h:"Sobre 300 en IGP"},
        {k:"guia", l:"Guía", v:"", h:"Quien condujo al perro, si no fue el propietario"},
      ]},
    ], async d => {
      const n = {perroId, tipo:d.tipo, fecha:d.fecha, evento:d.evento, tipoEvento:d.tipoEvento, juez:d.juez,
        organizadoCEPPB: !!d.organizadoCEPPB,
        validado: SESION.esAdmin ? "validado" : "",
        validadoFecha: SESION.esAdmin ? hoy() : ""};
      if(d.tipo === "estructura") Object.assign(n, {calificacion:d.calificacion, puesto:Number(d.puesto)||null, distincion:d.distincion});
      if(d.tipo === "caracter") Object.assign(n, {modalidad:d.modalidad, resultado:d.resultado});
      if(d.tipo === "trabajo") Object.assign(n, {titulo:d.titulo, calificacion:d.calificacion,
        puntos:Number(d.puntos)||null, puesto:Number(d.puesto)||null, guia:d.guia});
      if(d.tipo === "confirmacion") Object.assign(n, {resultado:d.resultado});
      await guardar("resultados", null, n); toast("Resultado registrado");
    });
  },
  camada(){
    abrirForm("Declarar camada", [
      {t:"Progenitores", d:"Se comprobará el cruce contra el reglamento antes de guardar.", f:[
        {k:"padreId", l:"Padre", tipo:"select", op:optPerros("M"), wide:true},
        {k:"madreId", l:"Madre", tipo:"select", op:optPerros("H"), wide:true},
      ]},
      {t:"Camada", f:[
        {k:"fechaNacimiento", l:"Fecha de nacimiento", tipo:"date", v:hoy()},
        {k:"afijo", l:"Afijo", v:SESION.socio?.afijo || ""},
        {k:"nMachos", l:"Machos", tipo:"number", v:0}, {k:"nHembras", l:"Hembras", tipo:"number", v:0},
        {k:"loeCamada", l:"Nº de camada en LOE", v:""},
        {k:"fechaComunicacion", l:"Fecha de comunicación al club", tipo:"date", v:hoy(), h:"Debe estar dentro de los 30 días siguientes al nacimiento"},
        {k:"criadorId", l:"Criador", tipo:"select", op:optSocios(), v:miSocioId()||"", wide:true},
      ]},
    ], async d => {
      const m = byId(C("perros"), d.padreId), h = byId(C("perros"), d.madreId);
      if(m && h){
        const v = R.cruceVeredicto(R.cruce(m, h, C("perros"), C("resultados"), d.fechaNacimiento));
        if(v === "bloqueo" && !confirm("Este cruce incumple el reglamento (revísalo en el simulador). ¿Registrar la camada de todas formas?")) return;
        if(R.esInter(m, h)){
          const sol = solicitudDe(m.id, h.id);
          if(!sol || sol.estado !== "autorizada"){
            if(!confirm("Es un cruce intervariedades " + (!sol ? "sin expediente de autorización" : "cuyo expediente no está autorizado") +
              ".\n\nLa camada se registrará, pero quedará retenida: no aparecerá en las novedades ni podrá difundirse hasta que la Junta Directiva resuelva.\n\n¿Registrarla igualmente?")) return;
          }
        }
      }
      await guardar("camadas", null, {padreId:d.padreId, madreId:d.madreId, fechaNacimiento:d.fechaNacimiento,
        afijo:d.afijo, nMachos:Number(d.nMachos)||0, nHembras:Number(d.nHembras)||0, loeCamada:d.loeCamada,
        fechaComunicacion:d.fechaComunicacion, criadorId:d.criadorId, recomendada:false});
      toast("Camada declarada");
    });
  },
  evento(id){
    const e = byId(C("eventos"), id) || {};
    abrirForm(id ? "Editar evento" : "Convocar evento", [
      {t:"Evento", f:[
        {k:"nombre", l:"Nombre", v:e.nombre, wide:true},
        {k:"tipo", l:"Tipo", tipo:"select", op:TIPOS_EVENTO, v:e.tipo, wide:true},
        {k:"fecha", l:"Fecha", tipo:"date", v:e.fecha || hoy()},
        {k:"cierre", l:"Cierre de inscripción", tipo:"date", v:e.cierre},
        {k:"lugar", l:"Lugar", v:e.lugar, wide:true}, {k:"juez", l:"Juez", v:e.juez, wide:true},
        {k:"organizadoCEPPB", l:"Organizado por el CEPPB", tipo:"check",
         v: e.id ? e.organizadoCEPPB : true, wide:true},
      ]},
      {t:"Retransmisión en directo", d:"El club retransmite por su canal de YouTube y aquí se ve dentro de la plataforma. Pega la dirección del directo tal como sale en el navegador; al terminar, la grabación se queda enlazada.", f:[
        {k:"directoUrl", l:"Enlace del directo", v:e.directoUrl, wide:true,
         ph:"https://www.youtube.com/live/…"},
        {k:"directoTitulo", l:"Qué se retransmite", v:e.directoTitulo, wide:true,
         ph:"Final de Mondioring · Pista central"},
      ]},
    ], async d => {
      const n = Object.assign({}, e, d);
      n.organizadoCEPPB = !!d.organizadoCEPPB;
      delete n.id;
      await guardar("eventos", id || null, n);
      toast(id ? "Evento actualizado" : "Evento convocado");
      render();
    });
  },
  inscripcion(eventoId){
    const mios = C("perros").filter(p => p.propietarioId === miSocioId());
    abrirForm("Inscribir ejemplar", [
      {t:"Inscripción", f:[
        {k:"perroId", l:"Ejemplar", tipo:"select", op:[["","— elegir —"]].concat(mios.map(p=>[p.id,p.nombre])), wide:true},
        {k:"clase", l:"Clase / modalidad", tipo:"select", op:["Cachorros","Jóvenes","Intermedia","Abierta","Trabajo","Utilidad","Campeones","Veteranos","Test simple","Test completo","Confirmación"], wide:true},
      ]},
    ], async d => {
      if(!d.perroId) return toast("Elige un ejemplar");
      await guardar("inscripciones", null, {eventoId, perroId:d.perroId, socioId:miSocioId(), clase:d.clase, estado:"pendiente", fecha:hoy()});
      toast("Inscripción enviada");
    });
  },
  invitacion(id){
    const s = byId(C("socios"), id); if(!s) return;
    const token = (s.invitacion||{}).token || tokenNuevo();
    const {asunto, cuerpo, enlace} = textoInvitacion(s, token);
    const enviada = (s.invitacion||{}).estado === "enviada" || (s.invitacion||{}).estado === "aceptada";
    abrirForm(`Invitación a ${s.nombreCompleto}`, [
      {t:"Destinatario", d:`<b>${esc(s.email)}</b> · socio nº ${esc(s.numero)}${enviada?` · ya enviada el ${fmtF((s.invitacion||{}).fecha)}`:""}`, f:[
        {k:"asunto", l:"Asunto", v:asunto, wide:true},
        {k:"cuerpo", l:"Mensaje", tipo:"textarea", v:cuerpo, h:"Cópialo y envíalo desde el correo del club. El enlace ya lleva su token."},
        {k:"enlace", l:"Enlace personal de un solo uso", v:enlace, wide:true},
      ]},
    ], async d => {
      const n = Object.assign({}, s, {invitacion:{estado:"enviada", fecha:hoy(), token,
        asunto:d.asunto, enviadaPor:"junta"}}); delete n.id;
      await guardar("socios", id, n);
      toast("Invitación registrada como enviada");
    });
    const b = $("#sheet-ok"); if(b) b.textContent = enviada ? "Guardar" : "Marcar como enviada";
  },
  admins(){
    const emails = C("admins").map(a => a.email).sort();
    abrirForm("Cuentas con permiso de junta directiva", [
      {t:"Quién manda", d:"Un correo por línea. Estas cuentas validan pruebas de salud y resultados, resuelven expedientes y asignan los cargos del club. Quitar a alguien de aquí le retira el permiso al instante.", f:[
        {k:"lista", l:"Correos", tipo:"textarea", v:emails.join("\n"), wide:true,
         ph:"presidencia@ejemplo.com\ntesoreria@ejemplo.com"},
      ]},
    ], async d => {
      const nuevos = String(d.lista || "").split(/[\n,;]+/)
        .map(x => x.trim().toLowerCase())
        .filter(x => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));

      if (!nuevos.length) return toast("Deja al menos un correo: sin junta, nadie puede validar nada");
      const mio = (SESION.usuario && SESION.usuario.email || "").toLowerCase();
      if (mio && !nuevos.includes(mio))
        return toast("No puedes quitarte a ti mismo de la lista: te quedarías sin poder volver a entrar");

      const antes = emails.map(e => e.toLowerCase());
      try {
        for (const e of nuevos) if (!antes.includes(e)) await guardar("admins", e, {email: e});
        for (const e of antes) if (!nuevos.includes(e)) await borrar("admins", e);
        toast("Lista de la junta actualizada");
        render();
      } catch(err){ toast(err.message || "No se ha podido cambiar la lista"); }
    });
  },
  traspaso(perroId){
    const p = byId(C("perros"), perroId); if(!p) return;
    const actual = byId(C("socios"), p.propietarioId);
    if(C("solicitudes").some(x => x.tipo === "traspaso" && x.perroId === perroId && x.estado === "pendiente"))
      return toast("Ya hay un cambio de titularidad pendiente para este ejemplar");
    abrirForm("Cambio de titularidad", [
      {t:"Traspaso", d:`Titular actual: <b>${esc(actual?.nombreCompleto || "sin asignar")}</b>. El cambio no surte efecto hasta que lo autorice la junta: hasta entonces la ficha sigue a nombre del titular actual.`, f:[
        {k:"aSocioId", l:"Nuevo titular", tipo:"select", op:optSocios(), wide:true},
        {k:"fechaEfecto", l:"Fecha de la cesión o venta", tipo:"date", v:hoy()},
        {k:"documento", l:"Documento que lo acredita", tipo:"select", wide:true,
         op:["Contrato de compraventa","Contrato de cesión","Documento de traspaso RSCE","Herencia o cambio familiar","Otro"]},
        {k:"motivo", l:"Observaciones para la junta", tipo:"textarea", ph:"Datos del contrato, fecha de entrega, cambio de microchip en la RSCE…"},
      ]},
    ], async d => {
      if(!d.aSocioId) return toast("Elige el nuevo titular");
      if(d.aSocioId === p.propietarioId) return toast("El nuevo titular coincide con el actual");
      await guardar("solicitudes", null, {tipo:"traspaso", perroId,
        deSocioId:p.propietarioId || "", aSocioId:d.aSocioId, fechaEfecto:d.fechaEfecto,
        documento:d.documento, motivo:d.motivo, estado:"pendiente", fecha:hoy(),
        solicitanteId:miSocioId() || "junta"});
      toast("Solicitud de cambio de titularidad enviada a la junta");
      render();
    });
  },
  /* «Este perro es mío». El libro tiene miles de ejemplares que salieron
     de los pedigríes de los campeonatos y no tienen dueño: su ficha
     existe, pero nadie la gobierna. El socio la reclama y la junta la
     entrega. Si el ejemplar ya tiene titular, lo que hace falta no es
     una reclamación sino un traspaso, con el consentimiento de quien lo
     tiene: eso se avisa aquí y se resuelve en la junta. */
  reclamacion(perroId){
    const p = byId(C("perros"), perroId); if(!p) return;
    const yo = miSocioId();
    if(!yo) return toast("Tu cuenta no está atada a ninguna ficha de socio");
    if(p.propietarioId === yo) return toast("Este ejemplar ya está a tu nombre");
    if(C("solicitudes").some(x => x.tipo === "reclamacion" && x.perroId === perroId && x.estado === "pendiente"))
      return toast("Ya hay una reclamación pendiente sobre este ejemplar");

    const actual = byId(C("socios"), p.propietarioId);
    abrirForm("Este ejemplar es mío", [
      {t:"Reclamación de titularidad",
       d: actual
         ? `Este ejemplar figura a nombre de <b>${esc(actual.nombreCompleto)}</b>. La junta no lo cambiará de manos sin el consentimiento de su titular: explica abajo en qué te basas y aporta el documento que lo acredite.`
         : `Este ejemplar no tiene titular: su ficha salió del pedigrí de un campeonato, no de un alta de socio. Si es tuyo, dilo aquí y la junta lo comprobará.`,
       f: [
        {k:"documento", l:"En qué te basas", tipo:"select", wide:true,
         op:["Soy su propietario desde el nacimiento","Contrato de compraventa","Contrato de cesión",
             "Certificado de la RSCE a mi nombre","Herencia o cambio familiar","Otro"]},
        {k:"motivo", l:"Cuéntaselo a la junta", tipo:"textarea", wide:true,
         ph:"Lo que quieras contar: número de LOE, microchip, cuándo lo adquiriste, quién fue el criador… o nada, si prefieres.",
         h:"Opcional. La junta te pedirá lo que le falte."},
        {k:"fechaEfecto", l:"Desde cuándo es tuyo", tipo:"date", v:hoy()},
      ]},
    ], async d => {
      /* Sin exigir nada por escrito: cada uno manda la solicitud como
         quiera y es la junta la que decide si le hace falta más. */
      await guardar("solicitudes", null, {tipo:"reclamacion", perroId,
        deSocioId: p.propietarioId || "", aSocioId: yo, fechaEfecto: d.fechaEfecto,
        documento: d.documento, motivo: d.motivo, estado: "pendiente", fecha: hoy(),
        solicitanteId: yo});
      toast("Reclamación enviada a la junta");
      render();
    });
  },
  solicitud(par){
    const [machoId, hembraId] = String(par).split("~");
    const m = byId(C("perros"), machoId), h = byId(C("perros"), hembraId);
    if(!m || !h) return toast("Elige antes los dos reproductores");
    const cr = byId(C("socios"), miSocioId()) || byId(C("socios"), m.criadorId);
    abrirForm("Solicitud de cruce intervariedades", [
      {t:"Cruce", d:`<b>${esc(m.nombre)}</b> (${esc(m.variedad)}) × <b>${esc(h.nombre)}</b> (${esc(h.variedad)}). La Comisión de Cría informa y la Junta Directiva resuelve en 30 días hábiles.`, f:[
        {k:"criadorId", l:"Criador solicitante", tipo:"select", op:optSocios(), v:cr?cr.id:"", wide:true},
        {k:"linea", l:"Línea para la que se solicita", tipo:"select", wide:true,
         op:["Estándar / belleza","Trabajo / utilidad","Ambas líneas"]},
        {k:"motivo", l:"Escrito motivado", tipo:"textarea",
         ph:"Aportación de una variedad sobre la otra, complementariedad morfológica o funcional, huida de la endogamia…",
         h:"Cap. 8.4.2.1 — hay que razonar el motivo y los resultados esperados en cada variedad"},
      ]},
      {t:"Documentación que se adjunta", d:"Marca lo que acompañas a la solicitud. Lo que la plataforma ya puede acreditar de las fichas aparecerá comprobado en el expediente.", f:[
        {k:"docPedigri", l:"Pedigrís de cuatro generaciones de ambos", tipo:"check", wide:true},
        {k:"docRadio", l:"Informes de radiografías de cadera y codos", tipo:"check", wide:true},
        {k:"docAdn", l:"Identificación genética (ADN)", tipo:"check", wide:true},
        {k:"docAtaxia", l:"Analíticas de SDCA1 y SDCA2", tipo:"check", wide:true},
        {k:"docCarcinoma", l:"Analítica de carcinoma gástrico", tipo:"check", wide:true},
        {k:"docComplementaria", l:"Documentación complementaria (resultados, camadas anteriores)", tipo:"check", wide:true},
      ]},
    ], async d => {
      if(!d.motivo || d.motivo.length < 20) return toast("El escrito motivado es obligatorio (Cap. 8.4.2.1)");
      if(solicitudDe(machoId, hembraId)) return toast("Ya existe un expediente para este cruce");
      await guardar("solicitudes", null, {tipo:"intervariedad", machoId, hembraId,
        criadorId:d.criadorId, linea:d.linea, motivo:d.motivo, estado:"pendiente", fecha:hoy(),
        docs:{pedigri:!!d.docPedigri, radio:!!d.docRadio, adn:!!d.docAdn, ataxia:!!d.docAtaxia,
              carcinoma:!!d.docCarcinoma, complementaria:!!d.docComplementaria}});
      toast("Solicitud presentada a la Comisión de Cría");
      ir("intervar");
    });
  },
  video(perroId){
    abrirForm("Añadir vídeo al ejemplar", [
      {t:"Enlace del vídeo", d:"Pega la dirección del vídeo en YouTube, Vimeo, Instagram, Facebook o working-dog. Se guarda el enlace: la plataforma no aloja el archivo.", f:[
        {k:"url", l:"Dirección del vídeo", v:"", wide:true, ph:"https://www.youtube.com/watch?v=…"},
        {k:"titulo", l:"Título", v:"", wide:true, ph:"Manga larga, CNI 2026"},
      ]},
    ], async d => {
      if(!/^https?:\/\//i.test(d.url)) return toast("El enlace debe empezar por https://");
      /* sujetoId no es columna: el vínculo se llama perro_id */
      await guardar("media", null, {tipo:"video", sujeto:"perro", perroId, url:d.url,
        titulo:d.titulo || "Vídeo", proveedor:proveedorDe(d.url), fecha:hoy(),
        subidoPor:miSocioId()});
      toast("Vídeo añadido"); render();
    });
  },
  bancario(id){
    const pr = byId(C("socios_privado"), id) || {};
    abrirForm("Domiciliación bancaria", [
      {t:"Cuenta", d:"Sólo la ven la junta directiva y tú. No aparece nunca en el directorio.", f:[
        {k:"iban", l:"IBAN", v:pr.iban, wide:true, ph:"ES00 0000 0000 0000 0000 0000"},
      ]},
    ], async d => {
      await guardar("socios_privado", id, Object.assign({}, pr, {iban:d.iban.replace(/[\s-]/g,"").toUpperCase()}, {id:undefined}));
      toast("Domiciliación actualizada");
    });
  },
};


/* ------------------------------------------------------------
   Afijos
   ------------------------------------------------------------ */

/* Se guarda como lo escribe el propietario, solo sin espacios de más */
function limpiarAfijo(v){
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  return t || null;
}

/* ¿Hay un socio con este afijo? Se compara sin distinguir mayúsculas
   ni acentos: en el censo conviven «ALT BARIDA» y «Alt Baridà». */
function socioPorAfijo(afijo){
  if (!afijo) return null;
  const buscado = norm(afijo);
  return C("socios").find(s => s.afijo && norm(s.afijo) === buscado) || null;
}

/* Los nombres del censo, para las sugerencias del buscador. Solo el
   nombre: si tiene afijo o no es cosa suya, no de quien registra. */
function nombresDeSocios(){
  return C("socios")
    .map(s => s.nombreCompleto)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));
}

function nombreDelCriador(p){
  const s = p && p.criadorId ? byId(C("socios"), p.criadorId) : null;
  return s ? s.nombreCompleto : "";
}

/* ¿Es este nombre el de un socio? Se compara sin acentos ni mayúsculas
   para que «Mª Ángeles» encuentre a «M ANGELES». */
function socioPorNombre(nombre){
  const buscado = norm(nombre || "");
  if (!buscado) return null;
  return C("socios").find(s => norm(s.nombreCompleto || "") === buscado) || null;
}


/* Quién puede firmar un diagnóstico o depositar un perfil de ADN.
   El propio club está entre ellas: no todo pasa por la RSCE. */
const ENTIDADES_DIAGNOSTICO = [
  ["", "— sin indicar —"],
  "CEPPB",
  "RSCE",
  "SETOV",
  "AMVAC",
  "AVEPA",
  "Otra entidad reconocida",
];


/* ------------------------------------------------------------
   El libro genealógico, por nombre
   ------------------------------------------------------------ */

/* Los nombres del libro, para las sugerencias. Se ofrecen los del sexo
   que toca y también los que aún no lo tienen: en el libro hay
   ejemplares antiguos sin sexo confirmado. */
function nombresDePerros(sexo){
  return C("perros")
    .filter(p => !sexo || !p.sexo || p.sexo === sexo)
    .map(p => p.nombre)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));
}

function nombreDePerro(id){
  const p = id ? byId(C("perros"), id) : null;
  return p ? p.nombre : "";
}

function abueloDe(perro, lado, cual){
  const padre = perro && perro[lado === "P" ? "padreId" : "madreId"];
  const p = padre ? byId(C("perros"), padre) : null;
  return p ? p[cual === "P" ? "padreId" : "madreId"] : null;
}

/* Busca un ejemplar por su nombre. Si no está en el libro, lo añade:
   entra sin dueño, como los que vinieron de working-dog, porque un
   ancestro no es de nadie hasta que alguien lo reclame. */
async function perroPorNombreOAlta(nombre, sexo){
  const t = String(nombre || "").replace(/\s+/g, " ").trim();
  if (!t) return null;

  const buscado = norm(t);
  const ya = C("perros").find(p => norm(p.nombre || "") === buscado);
  if (ya) return ya.id;

  const nuevo = {nombre: t, sexo: sexo || null, visibilidad: "socios",
                 origen: "añadido al registrar un ejemplar"};
  try {
    return await guardar("perros", null, nuevo);
  } catch(e){
    toast(`No se ha podido añadir «${t}» al libro: ${e.message || ""}`);
    return null;
  }
}

/* A un padre recién añadido se le pueden poner sus propios padres.
   Si ya los tenía, no se tocan: lo que está en el libro manda. */
async function ponerAbuelos(hijoId, nombrePadre, nombreMadre){
  if (!hijoId) return;
  const hijo = byId(C("perros"), hijoId);
  if (!hijo) return;
  if (hijo.padreId && hijo.madreId) return;

  const pId = hijo.padreId || await perroPorNombreOAlta(nombrePadre, "M");
  const mId = hijo.madreId || await perroPorNombreOAlta(nombreMadre, "H");
  if (!pId && !mId) return;

  const n = Object.assign({}, hijo, {padreId: pId, madreId: mId});
  delete n.id;
  try { await guardar("perros", hijoId, n); }
  catch(e){ /* si no tiene permiso sobre esa ficha, se deja como está */ }
}


/* El siguiente número libre del censo, para no tener que buscarlo */
function siguienteNumeroSocio(){
  const usados = C("socios").map(s => s.numero).filter(n => Number.isInteger(n));
  return usados.length ? Math.max(...usados) + 1 : 1;
}
