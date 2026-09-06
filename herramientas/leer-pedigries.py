#!/usr/bin/env python3
"""
Lee el archivo de pedigríes del club y lo deja en un JSON ordenado.

Es una hoja de cálculo con los participantes de los cinco últimos
campeonatos y su pedigrí de cinco generaciones, sacada de working-dog.
De 110 perros que compitieron salen más de mil ejemplares distintos:
ese es el esqueleto del libro genealógico.

Aquí solo se lee y se ordena. Escribir en la base de datos va aparte,
para poder revisar antes de tocar nada.

    python3 herramientas/leer-pedigries.py datos/CEPPB_pedigries_IGP_2021-2025.xlsx
"""
import json, re, sys, unicodedata, zipfile
from xml.etree import ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def abrir(ruta):
    z = zipfile.ZipFile(ruta)
    sst = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(NS + 'si'):
            sst.append("".join(t.text or "" for t in si.iter(NS + 't')))

    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    destino = {r.get('Id'): r.get('Target') for r in rels}

    hojas = {}
    for sh in wb.find(NS + 'sheets'):
        t = destino[sh.get(REL + 'id')].lstrip('/')
        hojas[sh.get('name')] = t if t.startswith('xl/') else 'xl/' + t

    def leer(nombre):
        filas = []
        for row in ET.fromstring(z.read(hojas[nombre])).iter(NS + 'row'):
            celdas = []
            for c in row:
                v = c.find(NS + 'v')
                txt = ""
                if v is not None:
                    txt = sst[int(v.text)] if c.get('t') == 's' else (v.text or "")
                celdas.append(txt.strip())
            filas.append(celdas)
        return filas

    return hojas, leer


def clave(nombre):
    """Dos nombres son el mismo perro si coinciden sin acentos, sin
    mayúsculas y sin dobles espacios: en working-dog conviven
    «Klemm vom Roten Falken» y «KLEMM VOM ROTEN  FALKEN»."""
    t = unicodedata.normalize('NFD', str(nombre or "").lower())
    t = "".join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()


def partir_nombre(bruto):
    """Los nombres traen a veces el libro de orígenes pegado:
    «Abanero LOE 2115297»."""
    t = re.sub(r'\s+', ' ', str(bruto or "")).strip()
    if not t:
        return None
    m = re.match(r'^(.*?)\s+((?:LOE|LOI|LOSH|SHSB|NHSB|LOF|KCSB|DK|CMKU)\s*[\w./-]+)$', t, re.I)
    if m:
        return {"nombre": m.group(1).strip(), "loe": re.sub(r'\s+', ' ', m.group(2)).strip()}
    return {"nombre": t, "loe": None}


def sexo_por_nombre(nombre):
    """Últim  o recurso para los que no ocupan sitio de padre ni de madre
    en ningún árbol: la terminación de su nombre de pila.

    No es fiable —en perros de trabajo abundan los nombres extranjeros,
    y Ozone, Cronos o Bowie no siguen ninguna regla del castellano— así
    que lo que salga de aquí queda marcado como deducido, para que la
    junta lo repase."""
    # el nombre de pila es la PRIMERA palabra: todo lo demás es afijo
    # o criadero. «Aciro EvelMark Slovakia» es Aciro, un macho, no una
    # hembra por acabar en «Slovakia».
    pila = str(nombre or "").strip().split()[0].lower() if str(nombre or "").strip() else ""
    pila = re.sub(r"[^a-záéíóúüñ']", "", pila)
    if not pila:
        return None

    # terminaciones que en castellano no dejan lugar a duda
    if re.search(r'(a|ia|na|la|ra|ta|sa)$', pila) and not re.search(r'(ma|pa)$', pila):
        return "H"
    if re.search(r'(o|os|us|or|er|an|on|in|ux|ax|ix)$', pila):
        return "M"
    return None


def main(ruta):
    hojas, leer = abrir(ruta)
    ped = leer('Pedigrí 5 gen')
    per = leer('Perros')

    cabecera = ped[0]
    # columna -> ruta en el árbol: «G3 PPM» significa padre del padre de la madre
    rutas = {}
    for i, cab in enumerate(cabecera):
        m = re.match(r'^G(\d+)\s+([PM]+)$', str(cab).strip())
        if m:
            rutas[i] = m.group(2)

    ejemplares = {}

    def anotar(info, wd_id=None):
        if not info:
            return None
        k = clave(info["nombre"])
        if not k:
            return None
        e = ejemplares.setdefault(k, {"nombre": info["nombre"], "loe": info["loe"],
                                      "padre": None, "madre": None, "wd": None,
                                      "sexo": None})
        if info["loe"] and not e["loe"]:
            e["loe"] = info["loe"]
        if wd_id and not e["wd"]:
            e["wd"] = wd_id
        return k

    for fila in ped[1:]:
        if len(fila) < 2:
            continue
        wd = fila[0]
        cabeza = anotar(partir_nombre(fila[1]), wd)
        if not cabeza:
            continue

        arbol = {}
        for i, ruta in rutas.items():
            if i < len(fila):
                info = partir_nombre(fila[i])
                if info:
                    k = anotar(info)
                    arbol[ruta] = k
                    # la posición dice el sexo: quien ocupa un sitio de
                    # padre es macho, y de madre, hembra
                    if k and not ejemplares[k]["sexo"]:
                        ejemplares[k]["sexo"] = "M" if ruta[-1] == "P" else "H"

        # cada uno con su padre y su madre, según la posición
        for ruta in [""] + list(arbol.keys()):
            yo = cabeza if ruta == "" else arbol.get(ruta)
            if not yo:
                continue
            for lado, campo in (("P", "padre"), ("M", "madre")):
                otro = arbol.get(ruta + lado)
                if otro and not ejemplares[yo][campo]:
                    ejemplares[yo][campo] = otro

    # los que compitieron, con sus datos
    cab = [c.lower() for c in per[0]]
    def col(pref):
        for i, c in enumerate(cab):
            if c.startswith(pref):
                return i
        return None
    i_id, i_perro = col('id'), col('perro')
    i_part, i_puesto, i_coi = col('participaciones'), col('mejor'), col('coi')

    competidores = []
    for f in per[1:]:
        info = partir_nombre(f[i_perro] if i_perro is not None and i_perro < len(f) else "")
        if not info:
            continue
        def num(i, dec=False):
            try:
                return (float if dec else int)(f[i])
            except (TypeError, ValueError, IndexError):
                return None
        competidores.append({
            "clave": clave(info["nombre"]), "nombre": info["nombre"],
            "wd": f[i_id] if i_id is not None and i_id < len(f) else "",
            "participaciones": num(i_part) or 0,
            "mejorPuesto": num(i_puesto),
            "coi5": num(i_coi, True) or 0.0,
        })

    # los que no ocupan sitio de padre ni de madre en ningún árbol
    deducidos = 0
    for e in ejemplares.values():
        if not e["sexo"]:
            s2 = sexo_por_nombre(e["nombre"])
            if s2:
                e["sexo"] = s2
                e["sexoDeducido"] = True
                deducidos += 1

    salida = {
        "origen": ruta.split("/")[-1],
        "sexoDeducidoPorNombre": deducidos,
        "ejemplares": ejemplares,
        "competidores": competidores,
    }
    print(json.dumps(salida, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "datos/CEPPB_pedigries_IGP_2021-2025.xlsx")
