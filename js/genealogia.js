/* ============================================================
   Genealogía del libro de cría.

   Calcula la consanguinidad de una alianza antes de hacerla, la
   profundidad del pedigrí y qué ancestros la provocan.

   El coeficiente es el de Wright, por la vía del parentesco: la
   consanguinidad de un cachorro es el parentesco entre su padre y
   su madre. Padre × hija da 25 %, hermanos completos 25 %, medio
   hermanos 12,5 %, primos 6,25 % — las cifras de toda la vida.
   ============================================================ */
"use strict";

/* El censo con el que se calcula. En la plataforma son los perros
   cargados; en las pruebas, un pedigrí de laboratorio. */
let CENSO = null;

function ponerCenso(perros){
  CENSO = new Map();
  for (const p of perros) CENSO.set(p.id, p);
  memoria.clear();
}

function perroDe(id){
  if (CENSO) return CENSO.get(id) || null;
  return (typeof C === "function" ? C("perros").find(p => p.id === id) : null) || null;
}

/* Al cambiar los datos hay que olvidar lo calculado */
const memoria = new Map();
function olvidarGenealogia(){ memoria.clear(); }

/* ------------------------------------------------------------
   Generación de cada ejemplar: cuántos escalones tiene por encima.
   Sirve para expandir siempre al más reciente, que es lo que hace
   que la recursión termine.
   ------------------------------------------------------------ */
function generacion(id, visto){
  if (!id) return 0;
  visto = visto || new Set();
  if (visto.has(id)) return 0;          // dato en bucle: se corta
  visto.add(id);
  const p = perroDe(id);
  if (!p) return 0;
  const a = generacion(p.padreId, visto), b = generacion(p.madreId, visto);
  visto.delete(id);
  return 1 + Math.max(a, b);
}

/* ------------------------------------------------------------
   Parentesco entre dos ejemplares (coeficiente de Malécot).
   ------------------------------------------------------------ */
function parentesco(aId, bId, hondura){
  if (!aId || !bId) return 0;
  hondura = hondura || 0;
  if (hondura > 40) return 0;           // red de seguridad ante datos en bucle

  const clave = aId < bId ? aId + "|" + bId : bId + "|" + aId;
  if (memoria.has(clave)) return memoria.get(clave);

  let r;
  if (aId === bId){
    /* Consigo mismo: la mitad, más lo que aporte su propia consanguinidad */
    const p = perroDe(aId);
    const f = p ? parentesco(p.padreId, p.madreId, hondura + 1) : 0;
    r = 0.5 * (1 + f);
  } else {
    /* Se expande siempre el más reciente: así se avanza hacia atrás
       en el tiempo y el cálculo termina. */
    const ga = generacion(aId), gb = generacion(bId);
    const [joven, otro] = ga >= gb ? [aId, bId] : [bId, aId];
    const p = perroDe(joven);
    if (!p || (!p.padreId && !p.madreId)) r = 0;
    else r = 0.5 * (parentesco(p.padreId, otro, hondura + 1)
                  + parentesco(p.madreId, otro, hondura + 1));
  }

  memoria.set(clave, r);
  return r;
}

/* La consanguinidad de una camada es el parentesco de sus padres */
function consanguinidadPrevista(padreId, madreId){
  if (!padreId || !madreId) return 0;
  return parentesco(padreId, madreId);
}

/* La de un ejemplar ya nacido, la de la alianza que lo produjo */
function consanguinidad(perroId){
  const p = perroDe(perroId);
  if (!p) return 0;
  return consanguinidadPrevista(p.padreId, p.madreId);
}

/* ------------------------------------------------------------
   Profundidad y completitud del pedigrí
   ------------------------------------------------------------ */

/* Generaciones seguidas que se conocen hacia atrás */
function profundidadPedigri(perroId){
  const p = perroDe(perroId);
  if (!p) return 0;
  return Math.max(generacion(p.padreId), generacion(p.madreId));
}

/* Qué parte del pedigrí tenemos, hasta n generaciones.
   En n generaciones caben 2 + 4 + 8 … ancestros. */
function completitudPedigri(perroId, generaciones){
  const n = generaciones || 3;
  let conocidos = 0, huecos = 0;

  const recorrer = (id, nivel, visto) => {
    if (nivel > n) return;
    if (!id || visto.has(id)){ huecos += Math.pow(2, n - nivel + 1) - 1; return; }
    const p = perroDe(id);
    if (!p){ huecos += Math.pow(2, n - nivel + 1) - 1; return; }
    conocidos++;
    visto.add(id);
    recorrer(p.padreId, nivel + 1, visto);
    recorrer(p.madreId, nivel + 1, visto);
    visto.delete(id);
  };

  const p = perroDe(perroId);
  if (!p) return 0;
  recorrer(p.padreId, 1, new Set());
  recorrer(p.madreId, 1, new Set());

  const caben = Math.pow(2, n + 1) - 2;
  return conocidos / caben;
}

/* ------------------------------------------------------------
   Quién aporta la consanguinidad
   ------------------------------------------------------------ */

/* Todos los ancestros de un ejemplar, con las generaciones a las que
   aparece (un mismo perro puede salir por varias ramas). */
function ancestrosDe(id, tope){
  const n = tope || 8;
  const salida = new Map();
  const andar = (x, nivel, visto) => {
    if (!x || nivel > n || visto.has(x)) return;
    const p = perroDe(x);
    if (!p) return;
    if (!salida.has(x)) salida.set(x, []);
    salida.get(x).push(nivel);
    visto.add(x);
    andar(p.padreId, nivel + 1, visto);
    andar(p.madreId, nivel + 1, visto);
    visto.delete(x);
  };
  const p = perroDe(id);
  if (p){ andar(p.padreId, 1, new Set()); andar(p.madreId, 1, new Set()); }
  return salida;
}

/* Los ancestros que aparecen por las dos ramas, y cuánto aporta cada
   uno a la consanguinidad. Es lo que un criador quiere ver: no solo
   el número, sino de quién viene. */
function ancestrosComunes(padreId, madreId){
  const porPadre = ancestrosDe(padreId), porMadre = ancestrosDe(madreId);
  const fuera = [];

  for (const [id, nivelesPadre] of porPadre){
    const nivelesMadre = porMadre.get(id);
    if (!nivelesMadre) continue;

    const p = perroDe(id);
    const fA = p ? consanguinidad(id) : 0;

    let aporta = 0;
    for (const n1 of nivelesPadre)
      for (const n2 of nivelesMadre)
        aporta += Math.pow(0.5, n1 + n2 + 1) * (1 + fA);

    fuera.push({
      id,
      nombre: p ? nombrePerro(p) : "",
      aporta,
      porPadre: Math.min(...nivelesPadre),
      porMadre: Math.min(...nivelesMadre),
    });
  }

  /* Los padres del propio cruce también cuentan como ancestro común
     si uno desciende del otro (padre × hija, abuelo × nieta). */
  for (const [extremo, otro, ladoPadre] of [[padreId, madreId, true], [madreId, padreId, false]]){
    const enElOtro = ancestrosDe(otro).get(extremo);
    if (!enElOtro || fuera.some(f => f.id === extremo)) continue;
    const p = perroDe(extremo);
    const fA = p ? consanguinidad(extremo) : 0;
    let aporta = 0;
    for (const n of enElOtro) aporta += Math.pow(0.5, n + 1) * (1 + fA);
    fuera.push({
      id: extremo, nombre: p ? nombrePerro(p) : "", aporta,
      porPadre: ladoPadre ? 0 : Math.min(...enElOtro),
      porMadre: ladoPadre ? Math.min(...enElOtro) : 0,
    });
  }

  return fuera.sort((a, b) => b.aporta - a.aporta);
}

/* ------------------------------------------------------------
   Cómo leerlo, en cristiano
   ------------------------------------------------------------ */
function juzgarConsanguinidad(f){
  const p = f * 100;
  if (p === 0)   return {nivel:"ok",    t:"Sin parentesco conocido",
                         d:"No comparten ancestros en el pedigrí que tiene el club"};
  if (p < 3.13)  return {nivel:"ok",    t:"Parentesco lejano",
                         d:"Por debajo de lo que se considera consanguinidad"};
  if (p < 6.25)  return {nivel:"ok",    t:"Consanguinidad baja",
                         d:"Equivale a un parentesco más lejano que primos"};
  if (p < 12.5)  return {nivel:"warn",  t:"Consanguinidad moderada",
                         d:"Del orden de primos hermanos. Aceptable puntualmente, no como norma"};
  if (p < 25)    return {nivel:"warn",  t:"Consanguinidad alta",
                         d:"Del orden de tío y sobrina o abuelo y nieta. Solo con un motivo de selección claro"};
  return {nivel:"block", t:"Consanguinidad muy alta",
          d:"Del orden de padres con hijos o hermanos entre sí. Desaconsejado: sube la carga de enfermedades recesivas"};
}

/* ============================================================
   Hermanos.

   Completos: mismo padre Y misma madre. Comparten la mitad de su
   herencia, igual que padre e hijo.

   Medio hermanos: uno de los dos progenitores. Comparten la
   cuarta parte. Un criador los mira porque dicen mucho más de una
   línea que un solo ejemplar: si tres hermanos tienen las caderas
   mal, el problema no es del perro, es del cruce.

   Sin padre ni madre conocidos no hay hermandad que valga: dos
   perros sin pedigrí no son hermanos por no tenerlo.
   ============================================================ */
function hermanosDe(perroId){
  const yo = perroDe(perroId);
  const vacio = { completos: [], porPadre: [], porMadre: [] };
  if (!yo || (!yo.padreId && !yo.madreId)) return vacio;

  const completos = [], porPadre = [], porMadre = [];
  for (const otro of (CENSO ? CENSO.values() : [])){
    if (!otro || otro.id === perroId) continue;
    const mismoPadre = !!yo.padreId && otro.padreId === yo.padreId;
    const mismaMadre = !!yo.madreId && otro.madreId === yo.madreId;
    if (mismoPadre && mismaMadre) completos.push(otro);
    else if (mismoPadre) porPadre.push(otro);
    else if (mismaMadre) porMadre.push(otro);
  }

  /* Los de la misma camada juntos: por fecha de nacimiento y, a
     igualdad, por nombre. */
  const ordenar = l => l.sort((a, b) =>
    String(a.fechaNacimiento || "9999").localeCompare(String(b.fechaNacimiento || "9999")) ||
    nombrePerro(a).localeCompare(nombrePerro(b), "es"));

  return { completos: ordenar(completos),
           porPadre: ordenar(porPadre),
           porMadre: ordenar(porMadre) };
}

/* Cuánta herencia comparten dos perros por ser hermanos. No es el
   parentesco completo —eso lo calcula parentesco()—, sino el grado
   de hermandad, que es lo que se nombra al hablar de una línea. */
function gradoDeHermandad(aId, bId){
  const a = perroDe(aId), b = perroDe(bId);
  if (!a || !b || a.id === b.id) return null;
  const mismoPadre = !!a.padreId && a.padreId === b.padreId;
  const mismaMadre = !!a.madreId && a.madreId === b.madreId;
  if (mismoPadre && mismaMadre) return "completos";
  if (mismoPadre) return "porPadre";
  if (mismaMadre) return "porMadre";
  return null;
}
