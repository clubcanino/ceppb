#!/usr/bin/env python3
"""
Lleva al libro las actas del Campeonato Nacional de Mondioring.

Son las actas oficiales de la RSCE, firmadas por los jueces y por el
club. Entran validadas: las publica el club.

Lo que NO se hace aquí, a propósito: otorgar el título MR1, MR2 o MR3.
El acta dice cuántos puntos sacó cada perro en cada grado, no si
alcanzó el título, y de eso dependen los aptos de cría de utilidad.
Lo pone la junta cuando corresponda, ejemplar por ejemplar.

    python3 herramientas/generar-mondioring.py > db/importaciones/mondioring-quer-2026.sql
"""
import json, re, unicodedata, uuid

NAMESPACE = uuid.UUID("c1e9b0de-0000-4000-8000-000000000000")

MENORES = {"de", "del", "la", "las", "los", "van", "von", "der", "den", "het",
           "du", "des", "di", "da", "d", "of", "the", "y", "et", "aux", "au"}


def id_estable(clave):
    return str(uuid.uuid5(NAMESPACE, clave))


def clave(nombre):
    s = unicodedata.normalize('NFD', str(nombre or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def bonito(bruto):
    """El acta va en mayúsculas; el libro, no."""
    s = re.sub(r"\s+", " ", str(bruto or "")).strip()
    if not s or s != s.upper():
        return s
    partes = []
    for i, p in enumerate(s.split(" ")):
        b = p.lower()
        partes.append(b if (i and b in MENORES) else
                      "-".join(x[:1].upper() + x[1:] for x in b.split("-")))
    return " ".join(partes)


def esc(v):
    if v is None or v == "":
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def num(v):
    return "null" if v is None else str(v)


def main():
    d = json.load(open("datos/mondioring-quer-2026.json", encoding="utf-8"))
    ev = d["evento"]
    ev_id = id_estable("evento:" + ev["nombre"])

    perros, resultados = [], []
    for g in d["grados"]:
        for r in g["resultados"]:
            nombre = bonito(r["nombre"])
            k = clave(nombre)
            perros.append({
                "id": id_estable(k), "nombre": nombre,
                # PBM en el acta: Pastor Belga Malinois, los tres grados
                "variedad": "Malinois",
                "loe": r.get("registro"),
                "chip": r.get("chip"),
            })
            resultados.append({
                "id": id_estable(f"resultado:{ev['nombre']}:G{g['grado']}:{k}"),
                "perro": id_estable(k),
                "clase": f"Mondioring grado {g['grado']}",
                "sobre": g["sobre"],
                "puesto": r.get("puesto"),
                "puntos": r.get("puntos"),
                "guia": bonito(r.get("guia")),
                "equipo": r.get("equipo"),
            })

    out = []
    out.append("-- ============================================================")
    out.append(f"--  {ev['nombre']}")
    out.append(f"--  {ev['fecha']} y {ev['fecha_fin']} · jueces: {ev['jueces']}")
    out.append(f"--  {len(resultados)} participaciones en tres grados")
    out.append("--")
    out.append("--  Actas oficiales de la RSCE, firmadas por los jueces y por el")
    out.append("--  club. Cada grado puntúa sobre un máximo distinto: 200, 300")
    out.append("--  y 400. Por eso cada resultado guarda sobre cuánto va.")
    out.append("--")
    out.append("--  NO se otorga aquí el título MR1, MR2 ni MR3: el acta da los")
    out.append("--  puntos, no si se alcanzó el título, y de eso dependen los")
    out.append("--  aptos de cría de utilidad. Lo pone la junta.")
    out.append("-- ============================================================")
    out.append("")
    out.append("begin;")
    out.append("")
    out.append("-- 0. Medio punto existe en mondioring: 247,5 no es 247 ni 248.")
    out.append("alter table resultados alter column puntos type numeric(6,1);")
    out.append("-- El grupo de trabajo con el que compite cada guía.")
    out.append("alter table resultados add column if not exists equipo text;")
    out.append("")
    out.append("-- 1. El campeonato, que ya estaba en el calendario sin jueces.")
    out.append(f"update eventos set juez = {esc(ev['jueces'])},")
    out.append(f"                   lugar = {esc(ev['lugar'])},")
    out.append(f"                   fecha = coalesce(fecha, {esc(ev['fecha'])}::date)")
    out.append(f"  where id = {esc(ev_id)}::uuid;")
    out.append(f"insert into eventos (id, nombre, tipo, fecha, lugar, juez, organizado_ceppb)")
    out.append(f"select {esc(ev_id)}::uuid, {esc(ev['nombre'])}, {esc(ev['tipo'])}, "
               f"{esc(ev['fecha'])}, {esc(ev['lugar'])}, {esc(ev['jueces'])}, true")
    out.append(f"where not exists (select 1 from eventos where id = {esc(ev_id)}::uuid);")
    out.append("")
    out.append("-- 2. Los ejemplares. Lo que ya conste en el libro manda.")
    out.append("insert into perros (id, nombre, variedad, loe, chip, origen, visibilidad) values")
    vals = [f"  ({esc(p['id'])}::uuid, {esc(p['nombre'])}, {esc(p['variedad'])}, "
            f"{esc(p['loe'])}, {esc(p['chip'])}, {esc(ev['nombre'])}, 'socios')"
            for p in perros]
    out.append(",\n".join(vals))
    out.append("on conflict (id) do update set")
    out.append("  variedad = coalesce(perros.variedad, excluded.variedad),")
    out.append("  loe = coalesce(perros.loe, excluded.loe),")
    out.append("  chip = coalesce(perros.chip, excluded.chip),")
    out.append("  origen = coalesce(perros.origen, excluded.origen);")
    out.append("")
    out.append("-- 3. Las participaciones.")
    out.append("alter table resultados disable trigger trg_proteger_resultado;")
    out.append("")
    out.append("insert into resultados (id, perro_id, tipo, evento_id, evento, fecha, anio,"
               " tipo_evento, organizado_ceppb, juez, clase, puesto, puntos, puntos_sobre,"
               " guia, equipo, validado, validado_por) values")
    vals = []
    for r in resultados:
        vals.append(
            f"  ({esc(r['id'])}::uuid, {esc(r['perro'])}::uuid, 'trabajo', "
            f"{esc(ev_id)}::uuid, {esc(ev['nombre'])}, {esc(ev['fecha'])}, "
            f"{ev['fecha'][:4]}, {esc(ev['tipo'])}, true, {esc(ev['jueces'])}, "
            f"{esc(r['clase'])}, {num(r['puesto'])}, {num(r['puntos'])}, {r['sobre']}, "
            f"{esc(r['guia'])}, {esc(r['equipo'])}, 'validado', 'pres.ceppb@gmail.com')")
    out.append(",\n".join(vals))
    out.append("on conflict (id) do update set")
    out.append("  puesto = excluded.puesto, puntos = excluded.puntos,")
    out.append("  puntos_sobre = excluded.puntos_sobre, clase = excluded.clase,")
    out.append("  guia = excluded.guia, equipo = excluded.equipo,")
    out.append("  juez = excluded.juez, fecha = excluded.fecha,")
    out.append("  validado = 'validado';")
    out.append("")
    out.append("alter table resultados enable trigger trg_proteger_resultado;")
    out.append("")
    out.append("commit;")
    out.append("")
    out.append("-- Comprobación")
    out.append("select clase, count(*), max(puntos) from resultados")
    out.append(f" where evento_id = {esc(ev_id)}::uuid group by 1 order by 1;")
    print("\n".join(out))

    json.dump({"evento": dict(ev, id=ev_id), "perros": perros, "resultados": resultados},
              open("db/importaciones/mondioring-quer-2026.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
