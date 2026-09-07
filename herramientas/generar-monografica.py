#!/usr/bin/env python3
"""
Convierte el catálogo ya limpio de la monográfica en el volcado que
entra en la base de datos.

Dos cosas a la vez:

  · Las fichas de los treinta ejemplares. Muchos no estaban en el
    libro: son perros de belleza y el libro venía de campeonatos de
    trabajo. De los que ya estaban, se completa lo que faltara —LOE,
    chip, variedad, fecha de nacimiento— sin pisar lo que ya hubiera.

  · Sus resultados, como resultados de ESTRUCTURA. A diferencia del
    mundial, esto sí cuenta: el Anexo A pide calificaciones de EXC en
    evento del CEPPB para las figuras ACE, ACES y ACSS, y esto es
    exactamente eso.

    python3 herramientas/leer-monografica.py > copias/monografica.json
    python3 herramientas/generar-monografica.py > db/importaciones/monografica.sql
"""
import json, sys, uuid

# El mismo espacio de nombres que el resto del libro: un perro tiene
# siempre el mismo identificador, venga del pedigrí de un campeonato o
# del catálogo de una exposición. Así los dos se encuentran.
NAMESPACE = uuid.UUID("c1e9b0de-0000-4000-8000-000000000000")


def id_estable(clave):
    return str(uuid.uuid5(NAMESPACE, clave))


def esc(v):
    if v is None or v == "":
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    return "'" + str(v).replace("'", "''") + "'"


def num(v):
    try:
        return str(int(float(str(v).replace(",", "."))))
    except (TypeError, ValueError):
        return "null"


def main():
    d = json.load(open("copias/monografica.json", encoding="utf-8"))
    ev = d["evento"]
    ev_id = id_estable("evento:" + ev["nombre"])

    ejemplares = []
    for e in d["ejemplares"]:
        ejemplares.append(dict(e, id=id_estable(e["clave"])))

    resultados = []
    for r in d["resultados"]:
        resultados.append(dict(
            r,
            id=id_estable(f"resultado:{ev['nombre']}:{r['clave']}"),
            perro=id_estable(r["clave"]),
        ))

    out = []
    out.append("-- ============================================================")
    out.append(f"--  {ev['nombre']}")
    out.append(f"--  {len(ejemplares)} ejemplares · juez: "
               + (resultados[0]["juez"] if resultados else "—"))
    out.append("--")
    out.append("--  Exposición de estructura organizada por el CEPPB. Estas")
    out.append("--  calificaciones SÍ cuentan para las figuras del Anexo A que")
    out.append("--  exigen prueba en evento propio del club.")
    out.append("--")
    out.append("--  Se puede ejecutar más de una vez sin duplicar nada.")
    out.append("-- ============================================================")
    out.append("")
    out.append("begin;")
    out.append("")
    out.append("-- 0. La clase en la que se presentó el ejemplar: junior,")
    out.append("--    intermedia, abierta, trabajo, campeones, veteranos.")
    out.append("alter table resultados add column if not exists clase text;")
    out.append("")
    out.append("-- 1. El concurso")
    out.append(f"insert into eventos (id, nombre, tipo, fecha, lugar, juez, organizado_ceppb)")
    out.append(f"values ({esc(ev_id)}::uuid, {esc(ev['nombre'])}, {esc(ev['tipo'])}, "
               f"{esc(ev['fecha'])}, {esc(ev['lugar'])}, "
               f"{esc(resultados[0]['juez'] if resultados else None)}, true)")
    out.append("on conflict (id) do update set")
    out.append("  nombre = excluded.nombre, tipo = excluded.tipo,")
    out.append("  lugar = excluded.lugar, juez = excluded.juez,")
    out.append("  fecha = coalesce(excluded.fecha, eventos.fecha),")
    out.append("  organizado_ceppb = true;")
    out.append("")
    out.append("-- 2. Los ejemplares.")
    out.append("--    Lo que ya conste en el libro manda: de aquí sólo se")
    out.append("--    completa lo que estuviera en blanco.")
    out.append("insert into perros (id, nombre, sexo, variedad, loe, chip,"
               " fecha_nacimiento, origen, visibilidad) values")
    vals = []
    for e in ejemplares:
        vals.append(
            f"  ({esc(e['id'])}::uuid, {esc(e['nombre'])}, {esc(e['sexo'])}, "
            f"{esc(e['variedad'])}, {esc(e['loe'])}, {esc(e['chip'])}, "
            f"{esc(e['fecha_nacimiento'])}, {esc(ev['nombre'])}, 'socios')")
    out.append(",\n".join(vals))
    out.append("on conflict (id) do update set")
    out.append("  sexo = coalesce(perros.sexo, excluded.sexo),")
    out.append("  variedad = coalesce(perros.variedad, excluded.variedad),")
    out.append("  loe = coalesce(perros.loe, excluded.loe),")
    out.append("  chip = coalesce(perros.chip, excluded.chip),")
    out.append("  fecha_nacimiento = coalesce(perros.fecha_nacimiento, excluded.fecha_nacimiento),")
    out.append("  origen = coalesce(perros.origen, excluded.origen);")
    out.append("")
    out.append("-- 3. Las calificaciones.")
    out.append("--    Entran validadas: es el acta del juez del propio club.")
    out.append("alter table resultados disable trigger trg_proteger_resultado;")
    out.append("")
    out.append("insert into resultados (id, perro_id, tipo, evento_id, evento, fecha, anio,"
               " tipo_evento, organizado_ceppb, juez, clase, calificacion,"
               " calificacion_origen, puesto, distincion, titulo, validado, validado_por) values")
    vals = []
    for r in resultados:
        vals.append(
            f"  ({esc(r['id'])}::uuid, {esc(r['perro'])}::uuid, 'estructura', "
            f"{esc(ev_id)}::uuid, {esc(ev['nombre'])}, {esc(ev['fecha'])}, "
            f"{num((ev['fecha'] or '')[:4]) if ev['fecha'] else '2025'}, "
            f"{esc(ev['tipo'])}, true, {esc(r['juez'])}, {esc(r['clase'])}, "
            f"{esc(r['calificacion'])}, {esc(r['calificacion_origen'])}, "
            f"{num(r['puesto'])}, {esc(r['distincion'])}, {esc(r['titulo'])}, "
            f"'validado', 'pres.ceppb@gmail.com')")
    out.append(",\n".join(vals))
    out.append("on conflict (id) do update set")
    out.append("  calificacion = excluded.calificacion,")
    out.append("  calificacion_origen = excluded.calificacion_origen,")
    out.append("  puesto = excluded.puesto,")
    out.append("  distincion = excluded.distincion,")
    out.append("  titulo = excluded.titulo,")
    out.append("  clase = excluded.clase,")
    out.append("  juez = excluded.juez,")
    out.append("  fecha = coalesce(excluded.fecha, resultados.fecha),")
    out.append("  validado = 'validado';")
    out.append("")
    out.append("alter table resultados enable trigger trg_proteger_resultado;")
    out.append("")
    out.append("commit;")
    out.append("")
    out.append("-- Comprobación")
    out.append(f"select count(*) filter (where tipo = 'estructura') as calificaciones,")
    out.append(f"       count(*) filter (where distincion = 'CAC') as caces,")
    out.append(f"       count(distinct perro_id) as ejemplares")
    out.append(f"from resultados where evento_id = {esc(ev_id)}::uuid;")
    print("\n".join(out))

    json.dump({"evento": dict(ev, id=ev_id),
               "ejemplares": ejemplares, "resultados": resultados},
              open("db/importaciones/monografica.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
