#!/usr/bin/env python3
"""
Lee el catálogo de una exposición monográfica del club y lo deja listo
para importar: los ejemplares por un lado y sus resultados por otro.

Esto es belleza, no trabajo. Aquí sí cuenta para el Reglamento de
Cría: una calificación de EXC en un evento del CEPPB es lo que pide
el Anexo A para las figuras ACE, ACES y ACSS.

El catálogo lo rellena una persona a mano el día de la exposición, y
se nota: la fecha de nacimiento viene escrita de cinco maneras, el LOE
con y sin dos puntos, y hay una clase escrita «IMNTERMEDIA». Todo eso
se limpia aquí, y lo que no se puede leer con seguridad se deja vacío
antes que adivinarlo.

    python3 herramientas/leer-monografica.py "datos/MONOGRAFICA ....xlsx" > copias/monografica.json
"""
import json, re, sys, unicodedata, zipfile
from xml.etree import ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

# --- el evento -------------------------------------------------------
# El catálogo no trae ni el nombre del concurso ni su fecha: sólo la
# lista de inscritos. Van aquí, y la fecha se rellena en cuanto la
# confirme la secretaría del club.
EVENTO = {
    "nombre": "Monográfica Nacional del Perro Pastor Belga 2025 · Igea",
    "tipo":   "Concurso monográfico CEPPB",
    "lugar":  "Igea (La Rioja)",
    "fecha":  None,          # pendiente de confirmar
    "organizado_ceppb": True,
}


def columna(ref):
    n = 0
    for ch in ref:
        if ch.isalpha():
            n = n * 26 + (ord(ch.upper()) - 64)
        else:
            break
    return n - 1


def leer(ruta, hoja):
    """Cada fila con sus celdas en la columna que les toca: Excel se
    salta las vacías y leerlas en fila corre todo lo que viene detrás."""
    z = zipfile.ZipFile(ruta)
    sst = ["".join(t.text or "" for t in si.iter(NS + 't'))
           for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    destino = {r.get('Id'): r.get('Target')
               for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    ruta_hoja = None
    for sh in wb.find(NS + 'sheets'):
        if sh.get('name') == hoja:
            t = destino[sh.get(REL + 'id')].lstrip('/')
            ruta_hoja = t if t.startswith('xl/') else 'xl/' + t
    filas = []
    for row in ET.fromstring(z.read(ruta_hoja)).iter(NS + 'row'):
        celdas, ancho = {}, 0
        for c in row:
            i = columna(c.get('r') or 'A')
            v = c.find(NS + 'v')
            if c.get('t') == 'inlineStr':
                txt = "".join(x.text or "" for x in c.iter(NS + 't'))
            elif v is not None:
                txt = sst[int(v.text)] if c.get('t') == 's' else (v.text or "")
            else:
                txt = ""
            celdas[i] = txt.strip()
            ancho = max(ancho, i + 1)
        filas.append([celdas.get(i, "") for i in range(ancho)])
    return filas


# --- limpieza --------------------------------------------------------
def clave(nombre):
    """La misma normalización que el resto del libro: sin acentos, sin
    signos y en minúsculas. Dos nombres iguales así son el mismo perro."""
    s = unicodedata.normalize('NFD', str(nombre or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# Títulos que la gente escribe pegados al nombre. No forman parte del
# nombre registrado del ejemplar: son lo que ha ganado.
PREFIJOS = re.compile(
    r"^\s*(che|ch\.?es|ch|mch|jch|multi\s*ch|int\s*ch|campeon[ao]?)\s*[.\-:]\s*",
    re.I)

def limpiar_nombre(bruto):
    """«CHE.THOR DE ANCANO» es Thor de Ancano, campeón de España. El
    título va aparte; en el nombre del perro no pinta nada."""
    s = re.sub(r"\s+", " ", str(bruto or "")).strip()
    titulo = None
    m = PREFIJOS.match(s)
    if m:
        titulo = m.group(1).upper()
        s = PREFIJOS.sub("", s)
    # El catálogo va en mayúsculas; el libro, no.
    if s and s == s.upper():
        menores = {"de", "del", "la", "las", "los", "van", "von", "der", "den",
                   "het", "du", "des", "di", "da", "d", "of", "the", "y", "et"}
        partes = []
        for i, p in enumerate(s.split(" ")):
            b = p.lower()
            partes.append(b if (i and b in menores) else
                          "-".join(x[:1].upper() + x[1:] for x in b.split("-")))
        s = " ".join(partes)
    return s.strip(), titulo


def limpiar_loe(bruto):
    """Viene como «LOE2748588», «LOE: 2457064», «LOE:2707066   » o sólo
    «LOE», que es como no traerlo."""
    s = re.sub(r"\s+", "", str(bruto or "").upper())
    s = re.sub(r"^LOE[:\-]?", "", s)
    s = re.sub(r"[^0-9A-Z]", "", s)
    return ("LOE " + s) if s.isdigit() and len(s) >= 5 else None


def limpiar_chip(bruto):
    s = re.sub(r"\D", "", str(bruto or ""))
    return s if len(s) == 15 else None


def limpiar_fecha(bruto):
    """Cinco formatos en treinta filas: «1.01.2025», «19.04.24»,
    «: 01.10.20», «17-06.23», «2.03,202». Lo que no se lea entero se
    deja vacío: una fecha inventada en una ficha de cría es peor que
    ninguna, porque el reglamento mide edades con ella."""
    s = re.sub(r"[^\d]+", "-", str(bruto or "")).strip("-")
    p = [x for x in s.split("-") if x]
    if len(p) != 3:
        return None
    d, m, a = p
    if len(d) == 4:                      # ya venía al revés
        a, m, d = p
    if not (d.isdigit() and m.isdigit() and a.isdigit()):
        return None
    if len(a) == 2:
        a = "20" + a
    if len(a) != 4:                      # «202» y compañía: incompleta
        return None
    d, m, a = int(d), int(m), int(a)
    if not (1 <= d <= 31 and 1 <= m <= 12 and 1990 <= a <= 2030):
        return None
    return f"{a:04d}-{m:02d}-{d:02d}"


# La escala del club. «MP» (muy prometedor) es de las clases de
# cachorro y no está en la escala de aptos de cría: se guarda tal cual
# vino, pero no se traduce, para que no cuente donde no debe.
CALIFICACION = {"EXC": "EXC", "EX": "EXC", "V": "EXC",
                "MB": "MB", "SG": "MB",
                "B": "B", "SUF": "SUF",
                "DESC": "DESC", "DIS": "DESC"}

# Lo que puntúa en el baremo del Cap. 7 va a «distinción»; los
# certificados de clase —joven, veterano— van aparte, a «título».
DISTINCION = {"CAC": "CAC", "RCAC": "RCAC", "RAPPEL CAC": "Rappel CAC",
              "MR": "BOB"}                # Mejor de Raza = Best of Breed
TITULO_CLASE = {"CCJ", "RCCJ", "CCV", "RCCV", "MMC", "MMG", "MJ", "MC", "MV"}

CLASES = {"IMNTERMEDIA": "INTERMEDIA", "CAMPEONAS": "CAMPEONES",
          "VETERANAS": "VETERANOS", "JOVEN": "JUNIOR"}

VARIEDADES = {"GROENENDAEL": "Groenendael", "TERVUEREN": "Tervueren",
              "MALINOIS": "Malinois", "LAEKENOIS": "Laekenois"}


def main(ruta):
    filas = leer(ruta, "Hoja1")
    cab = [c.upper() for c in filas[0]]
    col = lambda nombre: cab.index(nombre) if nombre in cab else None
    dame = lambda f, i: (f[i] if i is not None and i < len(f) else "").strip()

    i = {k: col(v) for k, v in {
        "juez": "JUEZ NOMBRE", "catalogo": "NºCATALOGO", "loe": "LOE7RRC",
        "chip": "CHIP", "nombre": "NOMBRE PERRO", "sexo": "SEXO",
        "nacimiento": "NACIMIENTO", "variedad": "VARIEDAD", "clase": "CLASE",
        "calificacion": "CALIFICACION", "puesto": "PUESTO",
    }.items()}
    # las tres columnas de título se llaman casi igual
    i_titulos = [n for n, c in enumerate(cab) if c.startswith("TITULO")]

    ejemplares, resultados, avisos = [], [], []

    for f in filas[1:]:
        bruto = dame(f, i["nombre"])
        if not bruto:
            continue
        nombre, ch_titulo = limpiar_nombre(bruto)
        k = clave(nombre)
        if not k:
            continue

        sexo = dame(f, i["sexo"]).upper()[:1]
        nacimiento = limpiar_fecha(dame(f, i["nacimiento"]))
        if not nacimiento:
            avisos.append(f"sin fecha de nacimiento legible: {nombre} "
                          f"(«{dame(f, i['nacimiento'])}»)")

        ejemplares.append({
            "clave": k, "nombre": nombre,
            "sexo": sexo if sexo in ("M", "H") else None,
            "variedad": VARIEDADES.get(dame(f, i["variedad"]).upper()),
            "loe": limpiar_loe(dame(f, i["loe"])),
            "chip": limpiar_chip(dame(f, i["chip"])),
            "fecha_nacimiento": nacimiento,
            "campeon": ch_titulo,
        })

        titulos = [dame(f, n).upper() for n in i_titulos]
        titulos = [t for t in titulos if t]
        distinciones = [DISTINCION[t] for t in titulos if t in DISTINCION]
        clase_tit = [t for t in titulos if t in TITULO_CLASE]
        sueltos = [t for t in titulos if t not in DISTINCION and t not in TITULO_CLASE]
        for t in sueltos:
            avisos.append(f"título no reconocido: «{t}» en {nombre}")

        bruta = dame(f, i["calificacion"]).upper()
        clase = dame(f, i["clase"]).upper()
        resultados.append({
            "clave": k,
            "catalogo": dame(f, i["catalogo"]),
            "clase": CLASES.get(clase, clase),
            "calificacion": CALIFICACION.get(bruta),
            "calificacion_origen": bruta,
            "puesto": dame(f, i["puesto"]),
            # El baremo del Cap. 7 sólo entiende una: se queda la que
            # más puntúa, y el resto se apunta al lado.
            "distincion": ("CAC" if "CAC" in distinciones else
                           "Rappel CAC" if "Rappel CAC" in distinciones else
                           "RCAC" if "RCAC" in distinciones else
                           "BOB" if "BOB" in distinciones else None),
            "distinciones": distinciones,
            "titulo": " · ".join(clase_tit) or None,
            "juez": dame(f, i["juez"]).title(),
        })

    for a in avisos:
        print("-- " + a, file=sys.stderr)

    print(json.dumps({
        "origen": ruta.split("/")[-1],
        "evento": EVENTO,
        "ejemplares": ejemplares,
        "resultados": resultados,
        "avisos": avisos,
    }, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1
         else "datos/MONOGRAFICA NACIONAL PERRO PASTOR BELGA   IGEA25.xlsx")
