/* ============================================================
   Motor de reglas del Reglamento de Cría CEPPB (act. enero 2025)
   Portado literalmente del prototipo: la lógica NO se toca.
   ============================================================ */
/* ---------- vocabulario de la raza ---------- */
const VARIEDADES = ["Malinois","Tervueren","Groenendael","Laekenois"];
const VCLASE = {Malinois:"vM",Tervueren:"vT",Groenendael:"vG",Laekenois:"vL"};
const GENES = [
  {k:"CACA",  n:"Atrofia SNC con ataxia cerebelar"},
  {k:"CJM",   n:"Cardiomiopatía con mortalidad juvenil"},
  {k:"SDCA1", n:"Degeneración esponjosa con ataxia tipo 1"},
  {k:"SDCA2", n:"Degeneración esponjosa con ataxia tipo 2"},
];
const HD_OK = ["A","B"], HD_TODOS = ["A","B","C","D","E"];
const ED_OK = ["0","1"], ED_TODOS = ["0","1","2","3"];
const EST_GEN = ["", "libre", "portador", "afectado"];
const CALIF = ["EXC","MB","B","SUF","NR","DESC"];
const CAL_RANK = {EXC:4, MB:3, B:2, SUF:1, NR:0, DESC:0};
const DISTINCIONES = ["","CAC","CACIB","RCAC","RCACIB","CCPB","RCCPB","Rappel CAC","BOB"];
const TIT_TRABAJO = ["","IGP1","IGP2","IGP3","IGP-FH","MR1","MR2","MR3"];
const DISCIPLINAS = ["IGP","Mondioring","Agility","Obediencia","Pastoreo","Mushing","Salvamento y rescate","Búsqueda y detección","Canicross","Belleza","Perro de asistencia y terapia"];
/* Figuras del club reconocidas en el Cap. 5 del reglamento */
const ROLES_CLUB = ["Junta Directiva","Comisión de Cría","Delegación de Trabajo","Delegado de zona",
  "Juez de Trabajo CEPPB","Juez Confirmador CEPPB","Figurante / Hombre de ataque","Maestro Figurante",
  "Instructor RSCE","Juez RSCE","Veterinario registrado en el CEPPB"];
const TIPOS_EVENTO = ["Especial de Cría","Monográfica de Zona","Especial Regional","Exposición FCI","Prueba de carácter CEPPB","Prueba de confirmación","CNI","CNM","Concurso monográfico CEPPB","Otro"];

/* Las cinco figuras de apto de cría — Capítulo 2 del reglamento */
const FIGURAS = [
  {c:"ACE",  n:"Apto de Cría de Estructura",           edad:15, via:"estructura", estr:{min:"MB",  n:2, ceppb:true},  caracter:"TS", art:"2.1"},
  {c:"ACES", n:"Apto de Cría de Estructura Superior",  edad:18, via:"estructura", estr:{min:"EXC", n:2, ceppb:true},  caracter:"TS", art:"2.2"},
  {c:"ACU",  n:"Apto de Cría de Utilidad",             edad:15, via:"utilidad",   estr:{min:"B",   n:1, ceppb:false}, caracter:"TC", art:"2.3"},
  {c:"ACUS", n:"Apto de Cría de Utilidad Superior",    edad:20, via:"utilidad",   estr:{min:"B",   n:1, ceppb:false}, trabajo:["IGP3","MR3"], art:"2.4"},
  {c:"ACSS", n:"Apto Cría Gran Seleccionado CEPPB",    edad:20, via:"mixta",      estr:{min:"EXC", n:2, ceppb:true, edadMin:18}, trabajo:["IGP3","MR3"], art:"2.5"},
];
const FIG_POR_CODIGO = Object.fromEntries(FIGURAS.map(f => [f.c, f]));

/* Títulos derivados — Capítulo 7 */
const TITULOS_DERIVADOS = [
  {c:"RE",       n:"Reproductor de Estructura",            de:"ACE"},
  {c:"RES",      n:"Reproductor de Estructura Superior",   de:"ACES"},
  {c:"RU",       n:"Reproductor de Utilidad",              de:"ACU"},
  {c:"RUS",      n:"Reproductor de Utilidad Superior",     de:"ACUS"},
  {c:"RGSCEPPB", n:"Reproductor Gran Seleccionado CEPPB",  de:"ACSS"},
];

/* Cruces intervariedades autorizados — Capítulo 8.2 */
const CRUCES_INTER = [
  {a:"Malinois",  b:"Tervueren",    nota:"Sólo Tervueren fuego. No se permiten grises ni deslavados."},
  {a:"Malinois",  b:"Laekenois",    nota:"Sólo si el Malinois es portador del gen de pelo duro."},
  {a:"Tervueren", b:"Groenendael",  nota:"Cruce autorizado por el reglamento."},
];

/* ============================================================
   Motor de reglas
   ============================================================ */
const R = {};

/* Anexo A — requisitos veterinarios comunes a las cinco figuras */
R.anexoA = function(p){
  const s = p.salud || {}, items = [];
  const val = s.validacion || {};
  items.push({k:"val", t:"Expediente de salud validado por el club",
    d: val.estado === "validado" ? `Validado el ${fmtF(val.fecha)}${val.por?" · "+val.por:""}`
      : val.estado === "rechazado" ? `Rechazado: ${val.nota || "documentación no conforme"}`
      : "Pendiente de que la Comisión de Cría coteje los certificados",
    e: val.estado === "validado" ? "ok" : val.estado === "rechazado" ? "no" : "falta",
    r:"Los datos los aporta el propietario; sólo cuentan una vez cotejados por el club"});
  const hd = (s.hd||"").toUpperCase();
  items.push({k:"hd", t:"Displasia de cadera", d: hd ? `Grado ${hd}${s.hdEntidad?" · "+s.hdEntidad:""}` : "Sin diagnóstico registrado",
    e: !hd ? "falta" : (HD_OK.includes(hd) ? "ok" : "no"), r:"Anexo A.1 — sólo A o B"});
  const ed = String(s.ed ?? "");
  items.push({k:"ed", t:"Displasia de codo", d: ed!=="" ? `Grado ${ed}${s.edEntidad?" · "+s.edEntidad:""}` : "Sin diagnóstico registrado",
    e: ed==="" ? "falta" : (ED_OK.includes(ed) ? "ok" : "no"), r:"Anexo A.2 — sólo 0 o 1"});
  const lvt = s.lvt||"";
  items.push({k:"lvt", t:"Vértebra de transición (LVT)", d: lvt ? (lvt==="libre"?"Libre de LVT":"Con vértebra de transición") : "Radiografías no tramitadas",
    e: !lvt ? "falta" : (lvt==="libre" ? "ok" : "no"), r:"Anexo A.3 — diagnóstico del CEPPB, sólo libres"});
  GENES.forEach(g => {
    const v = (s.genes||{})[g.k] || "";
    items.push({k:"gen"+g.k, t:g.k, d: v ? v[0].toUpperCase()+v.slice(1) : "Sin analizar", gen:true,
      e: !v ? "falta" : (v==="afectado" ? "no" : "ok"), r:`Anexo A.4 — ${g.n}. Afectado: excluido. Portador: sólo con libre`});
  });
  items.push({k:"adn", t:"ADN de progenitores", d: p.adnProgenitores ? "Verificado (RSCE)" : "Sin verificar",
    e: p.adnProgenitores ? "ok" : "falta", r:"Cap. 2 — verificación de pureza de línea (regulación RSCE)"});
  return {items, ok: items.every(i => i.e === "ok"), bloqueos: items.filter(i => i.e === "no")};
};

/* Resultados de un perro, agrupados */
R.esValidado = x => (x && x.validado) === "validado";
R.res = function(perroId, resultados, incluirNoValidados){
  const r = resultados.filter(x => x.perroId === perroId && (incluirNoValidados || R.esValidado(x)));
  return {
    estructura: r.filter(x => x.tipo === "estructura"),
    caracter:   r.filter(x => x.tipo === "caracter"),
    trabajo:    r.filter(x => x.tipo === "trabajo"),
    confirm:    r.filter(x => x.tipo === "confirmacion"),
    todos: r,
  };
};

/* ¿Tiene título de trabajo de grado n o superior? */
R.tieneTrabajo = function(rs, lista){
  const grados = {IGP1:1,IGP2:2,IGP3:3,MR1:1,MR2:2,MR3:3};
  const fam = t => t.startsWith("IGP") ? "IGP" : (t.startsWith("MR") ? "MR" : "");
  return rs.trabajo.some(x => lista.some(req => fam(x.titulo||"") === fam(req) && (grados[x.titulo]||0) >= (grados[req]||9)));
};
R.mejorTrabajo = function(rs){
  const grados = {IGP1:1,IGP2:2,IGP3:3,"IGP-FH":2,MR1:1,MR2:2,MR3:3};
  let best = null;
  rs.trabajo.forEach(x => { if(!best || (grados[x.titulo]||0) > (grados[best]||0)) best = x.titulo; });
  return best;
};

/* Prueba de carácter. Cap. 4: TS y TC se convalidan a quien ostente FCI-IGP1 o Mondioring 1 */
R.caracter = function(rs, nivel){
  const apto = m => rs.caracter.some(x => x.modalidad === m && x.resultado === "APTO");
  const conv = R.tieneTrabajo(rs, ["IGP1","MR1"]);
  if(nivel === "TC"){
    if(apto("TC")) return {e:"ok", d:"Prueba completa superada"};
    if(conv)       return {e:"ok", d:"Convalidada por título de trabajo (IGP 1 / Mondioring 1)"};
    return {e:"falta", d: apto("TS") ? "Tiene la simple; falta la prueba de coraje" : "Sin prueba de carácter completa"};
  }
  if(apto("TS") || apto("TC")) return {e:"ok", d: apto("TC") ? "Prueba completa superada (incluye la simple)" : "Prueba simple superada"};
  if(conv) return {e:"ok", d:"Convalidada por título de trabajo (IGP 1 / Mondioring 1)"};
  const susp = rs.caracter.some(x => x.resultado === "NO APTO");
  return {e: susp ? "no" : "falta", d: susp ? "Presentado sin superar la prueba" : "Sin prueba de carácter"};
};

/* Calificaciones de estructura que valen para una figura */
R.estructura = function(rs, req, fechaNac){
  let vals = rs.estructura.filter(x => (CAL_RANK[x.calificacion]||0) >= (CAL_RANK[req.min]||0));
  if(req.edadMin && fechaNac) vals = vals.filter(x => (meses(fechaNac, x.fecha) ?? 0) >= req.edadMin);
  const ceppb = vals.filter(x => x.organizadoCEPPB);
  const okN = vals.length >= req.n;
  const okC = !req.ceppb || ceppb.length >= 1;
  let d;
  if(okN && okC) d = `${vals.length} calificación(es) de ${req.min} o superior` + (req.ceppb ? `, ${ceppb.length} en evento del CEPPB` : "");
  else if(!okN) d = `${vals.length} de ${req.n} calificaciones de ${req.min} o superior` + (req.edadMin ? ` con ${req.edadMin}+ meses` : "");
  else d = `Faltan calificaciones obtenidas en un evento organizado por el CEPPB`;
  return {e: (okN && okC) ? "ok" : "falta", d, n: vals.length, ceppb: ceppb.length};
};

/* Evalúa una figura de apto de cría para un perro */
R.figura = function(p, fig, rs){
  const items = [];
  const m = meses(p.fechaNacimiento);
  items.push({t:`Edad mínima ${fig.edad} meses`, d: m==null ? "Sin fecha de nacimiento" : `${edadTxt(m)} (${m} meses)`,
    e: m==null ? "falta" : (m >= fig.edad ? "ok" : "falta"), r:`Cap. ${fig.art}`});
  const a = R.anexoA(p);
  items.push({t:"Pruebas de salud (Anexo A)", d: a.ok ? "Todos los requisitos veterinarios cumplidos"
      : (a.bloqueos.length ? `Excluido por: ${a.bloqueos.map(b=>b.t).join(", ")}` : `Faltan ${a.items.filter(i=>i.e==="falta").length} pruebas`),
    e: a.ok ? "ok" : (a.bloqueos.length ? "no" : "falta"), r:"Anexo A"});
  const es = R.estructura(rs, fig.estr, p.fechaNacimiento);
  items.push({t:`Estructura: ${fig.estr.n}× ${fig.estr.min} o superior` + (fig.estr.ceppb ? " (una en evento CEPPB)" : " en evento FCI") + (fig.estr.edadMin ? ` con ${fig.estr.edadMin}+ meses` : ""),
    d: es.d, e: es.e, r:`Cap. ${fig.art}`});
  if(fig.caracter){
    const c = R.caracter(rs, fig.caracter);
    items.push({t: fig.caracter === "TC" ? "Prueba de carácter e instintos COMPLETA" : "Prueba de carácter SIMPLE", d:c.d, e:c.e, r:"Cap. 4"});
  }
  if(fig.trabajo){
    const ok = R.tieneTrabajo(rs, fig.trabajo);
    const mej = R.mejorTrabajo(rs);
    items.push({t:`Prueba de trabajo: ${fig.trabajo.join(" o ")}`, d: ok ? `Acredita ${mej}` : (mej ? `Máximo acreditado: ${mej}` : "Sin título de trabajo registrado"),
      e: ok ? "ok" : "falta", r:`Cap. ${fig.art}`});
  }
  const cumple = items.every(i => i.e === "ok");
  const excluido = items.some(i => i.e === "no");
  return {fig, items, cumple, excluido, faltan: items.filter(i => i.e !== "ok").length};
};

R.figurasDe = function(p, resultados){
  const rs = R.res(p.id, resultados);
  return FIGURAS.map(f => R.figura(p, f, rs));
};
R.aptosDe = function(p, resultados){
  return R.figurasDe(p, resultados).filter(x => x.cumple).map(x => x.fig.c);
};

/* Baremo de puntuación — Cap. 7 */
R.puntosResultado = function(r, modo){
  let pts = 0;
  if(modo === "granch"){
    if(r.calificacion === "EXC") pts = ({1:14,2:12,3:11,4:10})[r.puesto] || 8;
    else if(r.calificacion === "MB") pts = 3;
  } else {
    if(["CAC","CACIB","CCPB","Rappel CAC"].includes(r.distincion)) pts = 12;
    else if(["RCAC","RCACIB","RCCPB"].includes(r.distincion)) pts = 10;
    else if(r.calificacion === "EXC") pts = 8;
    else if(r.calificacion === "MB") pts = 3;
    if(r.distincion === "BOB") pts += 2;
  }
  if(r.tipoEvento === "Especial de Cría") pts = Math.round(pts * 1.5 * 10) / 10;
  return pts;
};
R.puntuacion = function(perroId, resultados, modo, anio){
  const rs = R.res(perroId, resultados);
  let base = rs.estructura.filter(r => !anio || String(r.fecha||"").slice(0,4) === String(anio));
  if(modo !== "granch"){ // RA / Ch. Club: cada sujeto puntúa una sola vez, la mejor puntuación
    const mejorPor = {};
    base.forEach(r => { const k = r.tipoEvento || "otro"; const p = R.puntosResultado(r, modo);
      if(!mejorPor[k] || p > mejorPor[k].p) mejorPor[k] = {p, r}; });
    base = Object.values(mejorPor).map(x => x.r);
  }
  let total = base.reduce((s,r) => s + R.puntosResultado(r, modo), 0);
  const car = rs.caracter.filter(x => x.resultado === "APTO");
  if(car.some(x => x.modalidad === "TC")) total += 6;
  else if(car.some(x => x.modalidad === "TS")) total += 4;
  const especial = base.some(r => r.tipoEvento === "Especial de Cría");
  return {total: Math.round(total*10)/10, detalle: base, especial};
};

/* Reproductor Superior A/B — Cap. 7 (progenie con apto de cría, de dos alianzas distintas) */
R.reproductorSuperior = function(p, perros, resultados){
  const hijos = perros.filter(x => x.padreId === p.id || x.madreId === p.id);
  const conApto = hijos.filter(h => R.aptosDe(h, resultados).length > 0);
  const alianzas = new Set(conApto.map(h => (h.padreId === p.id ? h.madreId : h.padreId) || "desconocido"));
  const min = p.sexo === "M" ? 4 : 3;
  const propio = R.aptosDe(p, resultados).length > 0;
  return {hijos: hijos.length, conApto: conApto.length, alianzas: alianzas.size, min,
    rsB: conApto.length >= min && alianzas.size >= 2,
    rsA: propio && conApto.length >= min && alianzas.size >= 2};
};

/* Validador de cruce — Cap. 1.III, Cap. 8 y Anexo A.4 */
R.cruce = function(macho, hembra, perros, resultados, fecha){
  const out = [];
  const f = fecha || hoy();
  if(!macho || !hembra) return [{n:"falta", t:"Selecciona un macho y una hembra"}];
  if(macho.sexo !== "M") out.push({n:"bloqueo", t:`${macho.nombre} no está registrado como macho`});
  if(hembra.sexo !== "H") out.push({n:"bloqueo", t:`${hembra.nombre} no está registrada como hembra`});

  const em = meses(macho.fechaNacimiento, f), eh = meses(hembra.fechaNacimiento, f);
  if(em == null) out.push({n:"aviso", t:"El macho no tiene fecha de nacimiento registrada", r:"Cap. 1.III"});
  else if(em < 15) out.push({n:"bloqueo", t:`Macho con ${edadTxt(em)}: la edad mínima de monta es 15 meses`, r:"Cap. 1.III"});
  else if(em > 144) out.push({n:"bloqueo", t:`Macho con ${edadTxt(em)}: el límite reglamentario son 12 años`, r:"Cap. 1.III"});
  if(eh == null) out.push({n:"aviso", t:"La hembra no tiene fecha de nacimiento registrada", r:"Cap. 1.III"});
  else if(eh < 18) out.push({n:"bloqueo", t:`Hembra con ${edadTxt(eh)}: la edad mínima de cría es 18 meses`, r:"Cap. 1.III"});
  else if(eh > 108) out.push({n:"bloqueo", t:`Hembra con ${edadTxt(eh)}: el límite reglamentario son 9 años`, r:"Cap. 1.III"});

  [[macho,"Macho"],[hembra,"Hembra"]].forEach(([p,rol]) => {
    const aptos = R.aptosDe(p, resultados);
    if(!aptos.length) out.push({n:"bloqueo", t:`${rol} ${p.nombre} no tiene ningún apto de cría del CEPPB`, r:"Cap. 1 §4.1"});
    else out.push({n:"ok", t:`${rol} ${p.nombre}: ${aptos.join(", ")}`});
    const a = R.anexoA(p);
    a.bloqueos.forEach(b => out.push({n:"bloqueo", t:`${rol}: ${b.t} — ${b.d}`, r:b.r}));
  });

  GENES.forEach(g => {
    const gm = (macho.salud?.genes||{})[g.k] || "", gh = (hembra.salud?.genes||{})[g.k] || "";
    if(gm === "afectado" || gh === "afectado")
      out.push({n:"bloqueo", t:`${g.k}: ejemplar afectado — el cruce nunca está permitido`, r:"Anexo A.4"});
    else if(gm === "portador" && gh === "portador")
      out.push({n:"bloqueo", t:`${g.k}: portador × portador — un portador sólo puede cruzarse con un ejemplar libre`, r:"Anexo A.4"});
    else if(gm === "portador" || gh === "portador")
      out.push({n:"aviso", t:`${g.k}: portador × libre — permitido; hasta el 50 % de la camada será portadora`, r:"Anexo A.4"});
    else if(!gm || !gh)
      out.push({n:"aviso", t:`${g.k}: falta el análisis genético de ${!gm ? "el macho" : ""}${!gm&&!gh?" y ":""}${!gh ? "la hembra" : ""}`, r:"Anexo A.4"});
  });

  if(macho.variedad && hembra.variedad && macho.variedad !== hembra.variedad){
    const ok = CRUCES_INTER.find(c => (c.a===macho.variedad&&c.b===hembra.variedad)||(c.b===macho.variedad&&c.a===hembra.variedad));
    if(ok) out.push({n:"aviso", t:`Cruce intervariedades ${macho.variedad} × ${hembra.variedad}: autorizado por el reglamento pero requiere solicitud previa a la Comisión de Cría. ${ok.nota}`, r:"Cap. 8.2"});
    else out.push({n:"bloqueo", t:`Cruce ${macho.variedad} × ${hembra.variedad} no está entre los autorizados por el CEPPB`, r:"Cap. 8.2 — uniones directas entre variedades prohibidas"});
  }

  if(macho.padreId && hembra.padreId && macho.padreId === hembra.padreId)
    out.push({n:"aviso", t:"Ambos comparten padre: consanguinidad alta, valórese la diversidad genética", r:"Preámbulo"});
  if(macho.id === hembra.padreId || hembra.id === macho.madreId)
    out.push({n:"aviso", t:"Cruce entre progenitor y descendiente", r:"Preámbulo"});

  return out;
};
R.cruceVeredicto = function(lista){
  if(lista.some(x => x.n === "bloqueo")) return "bloqueo";
  if(lista.some(x => x.n === "aviso")) return "aviso";
  return "ok";
};

/* Requisitos del expediente de cruce intervariedades — Capítulo 8 */
R.intervariedad = function(macho, hembra, ctx){
  const items = [], cr = ctx.criador || null;
  const pagos = (ctx.pagos || []).filter(p => cr && p.socioId === cr.id);
  const debe = pagos.filter(p => p.estado !== "pagado").length;
  items.push({t:"Criador socio del CEPPB y al día en sus obligaciones", r:"Cap. 8.3.1",
    d: !cr ? "Sin criador asignado" : (debe ? `${debe} recibo(s) pendientes` : "Al corriente"),
    e: !cr ? "falta" : (debe ? "no" : "ok")});
  items.push({t:"Afijo de criador FCI/RSCE", r:"Cap. 8.3.2",
    d: cr && cr.afijo ? cr.afijo : "Sin afijo registrado en la ficha del socio",
    e: cr && cr.afijo ? "ok" : "falta"});
  items.push({t:"Cruce entre las variedades autorizadas", r:"Cap. 8.2",
    d: (()=>{ const ok = CRUCES_INTER.find(c => (c.a===macho.variedad&&c.b===hembra.variedad)||(c.b===macho.variedad&&c.a===hembra.variedad));
      return ok ? `${macho.variedad} × ${hembra.variedad}. ${ok.nota}` : `${macho.variedad} × ${hembra.variedad} no figura entre los cruces admitidos`; })(),
    e: CRUCES_INTER.some(c => (c.a===macho.variedad&&c.b===hembra.variedad)||(c.b===macho.variedad&&c.a===hembra.variedad)) ? "ok" : "no"});
  [[macho,"macho"],[hembra,"hembra"]].forEach(([p,rol]) => {
    const s = p.salud || {};
    items.push({t:`Radiografías de cadera y codos del ${rol}`, r:"Cap. 8.4.2.3",
      d: `${p.nombre}: HD ${s.hd||"—"} · ED ${s.ed!==undefined&&s.ed!==""?s.ed:"—"}`,
      e: (s.hd && s.ed!==undefined && s.ed!=="") ? (HD_OK.includes(s.hd)&&ED_OK.includes(String(s.ed)) ? "ok" : "no") : "falta"});
  });
  items.push({t:"Identificación genética (ADN) de ambos reproductores", r:"Cap. 8.4.2.4",
    d: [macho,hembra].filter(p=>p.adnProgenitores).length + " de 2 verificados",
    e: (macho.adnProgenitores && hembra.adnProgenitores) ? "ok" : "falta"});
  const gen = k => [macho,hembra].map(p => (p.salud?.genes||{})[k] || "");
  const ataxia = ["SDCA1","SDCA2"].every(k => gen(k).every(v => v === "libre"));
  const faltaAtaxia = ["SDCA1","SDCA2"].some(k => gen(k).some(v => !v));
  items.push({t:"Exentos de ataxia cerebelosa (SDCA1 y SDCA2)", r:"Cap. 8.4.2.5.1",
    d: ataxia ? "Ambos libres" : faltaAtaxia ? "Falta algún análisis" : "Algún reproductor no es libre",
    e: ataxia ? "ok" : faltaAtaxia ? "falta" : "no"});
  items.push({t:"Exentos de carcinoma gástrico", r:"Cap. 8.4.2.5.2",
    d: "Se acredita con el informe del laboratorio; no se deduce de la ficha",
    e: "falta"});
  const aptos = p => R.aptosDe(p, ctx.resultados || []);
  const conApto = [macho,hembra].every(p => aptos(p).length);
  items.push({t:"Mérito de los reproductores", r:"Cap. 8.5, 8.6 y 8.7",
    d: conApto ? `Sustituido por los aptos de cría del club: ${macho.nombre} (${aptos(macho).join(", ")}) y ${hembra.nombre} (${aptos(hembra).join(", ")})`
      : "Sin apto de cría: hay que acreditar calificaciones y pruebas de la línea solicitada",
    e: conApto ? "ok" : "falta"});
  return {items, completo: items.every(i => i.e === "ok"), bloqueos: items.filter(i => i.e === "no")};
};

/* Qué le queda a un ejemplar por validar */
R.pendientes = function(p, resultados){
  const val = (p.salud || {}).validacion || {};
  const conDatos = ["hd","ed","lvt"].some(k => (p.salud||{})[k]) || Object.keys((p.salud||{}).genes || {}).length;
  const salud = conDatos && val.estado !== "validado" && val.estado !== "rechazado" ? 1 : 0;
  const res = resultados.filter(x => x.perroId === p.id && !x.validado).length;
  return {salud, resultados: res, total: salud + res};
};

/* ¿Es intervariedades este cruce? */
R.esInter = (m, h) => !!(m && h && m.variedad && h.variedad && m.variedad !== h.variedad);
