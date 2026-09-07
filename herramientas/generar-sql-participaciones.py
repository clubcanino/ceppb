#!/usr/bin/env python3
"""
Convierte la hoja «Participaciones» del Excel de campeonatos en SQL.

Dos competiciones distintas en la misma hoja:

  · Campeonato Nacional de IGP del CEPPB, 2021-2025. Lo organiza el
    club, así que cuenta para las figuras del reglamento que exigen
    prueba en evento propio. Puntuación sobre 300.

  · FMBB World Championship IGP, 2022-2026. No lo organiza el club y
    NO cuenta para esas figuras. Puntuación sobre 500, porque suma dos
    jornadas: un 463 del mundial y un 290 del nacional no son
    comparables, y por eso cada resultado guarda sobre cuánto va.

Entran ya validadas porque son actas oficiales, no algo que aporte un
socio: por eso el volcado desactiva un momento el trigger que obliga a
que todo nazca «pendiente».

El perro se casa por su identificador de working-dog, no por el
nombre: así no hay confusiones entre homónimos.

    python3 herramientas/generar-sql-participaciones.py > db/importaciones/participaciones.sql
"""
import json, sys, uuid, zipfile
from xml.etree import ElementTree as ET

XLSX = "datos/CEPPB_FMBB_pedigries_IGP.xlsx"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

NAMESPACE = uuid.UUID("c1e9b0de-0000-4000-8000-000000000000")

# La escala oficial IGP viene en el acta en alemán e inglés mezclados.
# Los puntos confirman la equivalencia: EX 290 · SG/VG 270-285 ·
# G 240-269 · B/S 228-239 · M y U por debajo.
#   Ojo con la trampa: la «G» alemana (Gut) es el «B» (Bueno) del club,
#   y la «B» alemana (Befriedigend) es nuestro «SUF».
#
# En el mundial, la casilla de calificación trae a veces la nota de una
# fase (93, 85,5) en lugar de una letra. Eso no es una calificación de
# la escala del club y no se traduce a ninguna: se guarda tal cual vino
# y la calificación queda vacía. Traducirla a ojo sería inventarla.
CALIFICACION = {
    "EX": "EXC", "V": "EXC",
    "SG": "MB", "VG": "MB",
    "G": "B",
    "B": "SUF", "S": "SUF",
    "M": "NR", "U": "NR",
    "ABBRUCH": "NR", "ABBR.": "NR",          # abandono en pista
    "DIS": "DESC", "DIS.": "DESC", "DISQ.": "DESC",
    "HURT": "NR",                            # retirado por lesión
}

# Cada competición con su escala y con quién la organiza.
COMPETICIONES = {
    "CEPPB": {"sobre": 300, "propio": True},
    "FMBB":  {"sobre": 500, "propio": False},
}

def leer_hoja(ruta, hoja):
    """Devuelve cada fila como {letra de columna: valor}.

    Por letra y no por posición a propósito: cuando una celda va vacía
    —hay tres actas sin puntuación— Excel se la salta y una lista
    corrida desplazaría todo lo que viene detrás."""
    z = zipfile.ZipFile(ruta)
    sst = ["".join(t.text or "" for t in si.iter(NS + "t"))
           for si in ET.fromstring(z.read("xl/sharedStrings.xml"))]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    destino = {r.get("Id"): r.get("Target")
               for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
    ruta_hoja = None
    for sh in wb.find(NS + "sheets"):
        if sh.get("name") == hoja:
            t = destino[sh.get(REL + "id")].lstrip("/")
            ruta_hoja = t if t.startswith("xl/") else "xl/" + t
    filas = []
    for row in ET.fromstring(z.read(ruta_hoja)).iter(NS + "row"):
        celdas = {}
        for c in row:
            col = "".join(ch for ch in c.get("r") if ch.isalpha())
            v = c.find(NS + "v")
            if c.get("t") == "inlineStr":
                celdas[col] = "".join(x.text or "" for x in c.iter(NS + "t")).strip()
            elif v is None:
                celdas[col] = ""
            elif c.get("t") == "s":
                celdas[col] = sst[int(v.text)].strip()
            else:
                celdas[col] = (v.text or "").strip()
        filas.append(celdas)
    return filas


def id_estable(clave):
    return str(uuid.uuid5(NAMESPACE, clave))

def esc(v):
    if v is None or v == "":
        return "null"
    return "'" + str(v).replace("'", "''") + "'"

def num(v):
    """Los puntos del mundial llevan medio punto (444.5). Se redondea al
    entero más cercano porque la columna es entera, y el valor exacto
    queda en el acta original."""
    try:
        return str(int(round(float(str(v).replace(",", ".")))))
    except (TypeError, ValueError):
        return "null"

def main():
    filas = leer_hoja(XLSX, "Participaciones")

    ped = json.load(open("copias/pedigries.json", encoding="utf-8"))
    porWd = {c["wd"]: c for c in ped["competidores"] if c.get("wd")}

    cuerpo = filas[1:]          # la primera fila son los encabezados
    eventos, resultados, huerfanos = {}, [], []

    for r in cuerpo:
        cual, anio, evento = r.get("A"), r.get("B"), r.get("C")
        cfg = COMPETICIONES.get(cual, COMPETICIONES["CEPPB"])
        wd = (r.get("I") or "").strip()
        comp = porWd.get(wd)
        if not comp:
            huerfanos.append((r.get("E"), wd))
            continue

        # Los cinco campeonatos del club se importaron cuando el nombre
        # llevaba el sufijo «(CEPPB)». Se conserva para que reimportar
        # actualice aquellas actas en vez de duplicarlas.
        nombre = f"{evento} (CEPPB)" if cual == "CEPPB" else evento

        ev = id_estable("evento:" + nombre)
        eventos[ev] = {"id": ev, "nombre": nombre, "anio": anio,
                       "propio": cfg["propio"]}
        bruto = (r.get("H") or "").strip()
        resultados.append({
            "id": id_estable(f"resultado:{nombre}:{wd}"),
            "perro": id_estable(comp["clave"]),
            "evento_id": ev,
            "evento": nombre,
            "anio": anio,
            "propio": cfg["propio"],
            "sobre": cfg["sobre"],
            "puesto": r.get("D"),
            "puntos": r.get("G"),
            "calificacion": CALIFICACION.get(bruto.upper()),
            "calificacion_origen": bruto,
            "guia": r.get("F"),
        })

    # Dos identificadores de working-dog que caen en la misma ficha son
    # dos perros con el mismo nombre: o es una ficha duplicada en el
    # origen, o son dos perros distintos y hay que separarlos a mano.
    porFicha = {}
    for r in cuerpo:
        wd = (r.get("I") or "").strip()
        c = porWd.get(wd)
        if c:
            porFicha.setdefault(id_estable(c["clave"]), set()).add((wd, c["nombre"]))
    for pid, wds in porFicha.items():
        if len(wds) > 1:
            print("-- REVISAR, misma ficha para varios working-dog: " +
                  ", ".join(f"{n} ({w})" for w, n in sorted(wds)), file=sys.stderr)

    if huerfanos:
        print(f"-- ATENCIÓN, {len(huerfanos)} participaciones sin ficha de perro. "
              "Las primeras: " + "; ".join(
                  f"{n} ({w})" for n, w in huerfanos[:5]), file=sys.stderr)

    out = []
    out.append("-- ============================================================")
    out.append("--  Campeonatos de IGP: CEPPB 2021-2025 y FMBB 2022-2026")
    out.append(f"--  {len(eventos)} campeonatos · {len(resultados)} participaciones")
    out.append(f"--  {len({r['perro'] for r in resultados})} ejemplares distintos")
    out.append("--")
    out.append("--  Actas oficiales extraídas de working-dog. Entran ya validadas:")
    out.append("--  las publica el club, no un particular. El mundial NO cuenta como")
    out.append("--  evento organizado por el CEPPB.")
    out.append("--  Se puede ejecutar más de una vez sin duplicar nada.")
    out.append("-- ============================================================")
    out.append("")
    out.append("begin;")
    out.append("")
    out.append("-- 0. Columnas nuevas del acta: puntos, guía, año y la")
    out.append("--    calificación tal cual venía escrita en el original.")
    out.append("alter table resultados add column if not exists puntos integer;")
    out.append("alter table resultados add column if not exists guia text;")
    out.append("alter table resultados add column if not exists anio integer;")
    out.append("alter table resultados add column if not exists calificacion_origen text;")
    out.append("-- Sobre cuánto va la puntuación: 300 en el nacional, 500 en el")
    out.append("-- mundial, que suma dos jornadas. Sin esto los números engañan.")
    out.append("alter table resultados add column if not exists puntos_sobre integer;")
    out.append("")
    out.append("-- 1. Los campeonatos")
    for e in sorted(eventos.values(), key=lambda x: x["anio"]):
        out.append(
            f"insert into eventos (id, nombre, tipo, organizado_ceppb) values "
            f"({esc(e['id'])}::uuid, {esc(e['nombre'])}, 'trabajo', "
            f"{'true' if e['propio'] else 'false'}) "
            f"on conflict (id) do update set nombre = excluded.nombre, "
            f"organizado_ceppb = excluded.organizado_ceppb;")
    out.append("")
    out.append("-- 2. Las participaciones.")
    out.append("--    El trigger obliga a que todo resultado nazca sin validar y")
    out.append("--    sólo lo levante la junta desde la plataforma. Aquí es la")
    out.append("--    junta quien vuelca sus propias actas, así que se aparta un")
    out.append("--    momento y se vuelve a poner al terminar.")
    out.append("alter table resultados disable trigger trg_proteger_resultado;")
    out.append("")
    for i in range(0, len(resultados), 100):
        trozo = resultados[i:i+100]
        out.append("insert into resultados (id, perro_id, tipo, evento_id, evento, anio,"
                   " tipo_evento, organizado_ceppb, puesto, puntos, puntos_sobre,"
                   " calificacion, calificacion_origen, guia, validado, validado_por) values")
        vals = []
        for f in trozo:
            vals.append(
                f"  ({esc(f['id'])}::uuid, {esc(f['perro'])}::uuid, 'trabajo', "
                f"{esc(f['evento_id'])}::uuid, {esc(f['evento'])}, {num(f['anio'])}, "
                f"'IGP', {'true' if f['propio'] else 'false'}, "
                f"{num(f['puesto'])}, {num(f['puntos'])}, {f['sobre']}, "
                f"{esc(f['calificacion'])}, {esc(f['calificacion_origen'])}, "
                f"{esc(f['guia'])}, 'validado', 'pres.ceppb@gmail.com')")
        out.append(",\n".join(vals))
        out.append("on conflict (id) do update set")
        out.append("  puesto = excluded.puesto,")
        out.append("  puntos = excluded.puntos,")
        out.append("  puntos_sobre = excluded.puntos_sobre,")
        out.append("  organizado_ceppb = excluded.organizado_ceppb,")
        out.append("  anio = excluded.anio,")
        out.append("  calificacion = excluded.calificacion,")
        out.append("  calificacion_origen = excluded.calificacion_origen,")
        out.append("  guia = excluded.guia,")
        out.append("  evento_id = excluded.evento_id,")
        out.append("  validado = 'validado';")
        out.append("")
    out.append("alter table resultados enable trigger trg_proteger_resultado;")
    out.append("")
    out.append("commit;")
    out.append("")
    out.append("-- 3. Comprobación: deben salir 5 campeonatos, 197 participaciones")
    out.append("--    y los ejemplares que hayan competido.")
    out.append("select (select count(*) from eventos where tipo = 'trabajo') as campeonatos,")
    out.append("       (select count(*) from resultados where tipo_evento = 'IGP') as participaciones,")
    out.append("       (select count(distinct perro_id) from resultados where tipo_evento = 'IGP') as ejemplares,")
    out.append("       (select count(*) from resultados where tipo_evento = 'IGP' and validado <> 'validado') as sin_validar;")
    print("\n".join(out))

    # El mismo volcado en JSON, para poder cargarlo desde la propia
    # plataforma con la sesión de la junta en vez de por el editor SQL.
    json.dump({
        "eventos": sorted(eventos.values(), key=lambda x: x["anio"]),
        "resultados": resultados,
    }, open("db/importaciones/participaciones.json", "w", encoding="utf-8"),
        ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
