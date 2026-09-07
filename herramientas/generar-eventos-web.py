#!/usr/bin/env python3
"""
Trae al libro el calendario de eventos de la web del club.

Dos cosas hay que evitar, y las dos son duplicados:

  1. En la web, el mismo concurso figura una vez por tarifa de
     inscripción —socios, no socios, socios de clubes de la FMBB—.
     Son 28 entradas para 17 eventos. Eso ya viene resuelto en
     datos/eventos-web-ceppb.json.

  2. Cuatro de esos eventos YA están en el libro con otro nombre:
     entraron con las actas de working-dog, que los llama de otra
     manera. A esos no se les crea ficha nueva: se les completa la
     fecha y el lugar, que es justo lo que les faltaba.

    python3 herramientas/generar-eventos-web.py > db/importaciones/eventos-web.sql
"""
import json, uuid

NAMESPACE = uuid.UUID("c1e9b0de-0000-4000-8000-000000000000")


def id_estable(clave):
    return str(uuid.uuid5(NAMESPACE, clave))


def esc(v):
    if v is None or v == "":
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


# Los que ya están en el libro, con el nombre que llevan allí. La clave
# es el título tal como figura en la web del club.
YA_EN_EL_LIBRO = {
    "Campeonato Nacional de IGP 2023":   "XXIV CNI 2023 (CEPPB)",
    "Campeonato Nacional de IGP 2024":   "Campeonato Nacional 2024 (CEPPB)",
    "Campeonato Nacional de IGP 2025":   "C.N.I. Campeonato Nacional IGP 2025 (CEPPB)",
    "Especial Nacional de Cría CEPPB 2025": "Especial Nacional de Cría CEPPB 2025 · Igea",
}

# El tipo decide cómo puntúa en el baremo del Capítulo 7: una Especial
# de Cría vale un 50 % más. Lo que no es un concurso —un examen de
# figurantes, un curso— entra como «Otro» y no puntúa.
def tipo_de(titulo):
    t = titulo.lower()
    if "especial nacional de cría" in t or "especial de cría" in t:
        return "Especial de Cría"
    if "monográfica" in t:
        return "Concurso monográfico CEPPB"
    if "campeonato nacional de igp" in t:
        return "CNI"
    if "campeonato nacional de mondioring" in t:
        return "CNM"
    return "Otro"


def main():
    eventos = json.load(open("datos/eventos-web-ceppb.json", encoding="utf-8"))

    nuevos, completados = [], []
    for e in eventos:
        if e["titulo"] in YA_EN_EL_LIBRO:
            nombre = YA_EN_EL_LIBRO[e["titulo"]]
            completados.append(dict(e, nombre=nombre, id=id_estable("evento:" + nombre)))
        else:
            nombre = f"{e['titulo']} · {e['lugar']}" if e["lugar"] else e["titulo"]
            nuevos.append(dict(e, nombre=nombre, id=id_estable("evento:" + nombre),
                               tipo=tipo_de(e["titulo"])))

    out = []
    out.append("-- ============================================================")
    out.append("--  El calendario del club, dentro del libro")
    out.append(f"--  {len(nuevos)} eventos nuevos · {len(completados)} que ya estaban")
    out.append("--")
    out.append("--  En la web cada concurso figura una vez por tarifa de")
    out.append("--  inscripción: 28 entradas para 17 eventos. Y cuatro de ellos")
    out.append("--  ya estaban en el libro con el nombre que les da working-dog:")
    out.append("--  a esos se les completa la fecha y el lugar, que es lo que")
    out.append("--  les faltaba, en vez de crearlos otra vez.")
    out.append("-- ============================================================")
    out.append("")
    out.append("begin;")
    out.append("")
    out.append("-- 1. Los que ya estaban: sólo se les pone la fecha y el sitio.")
    for e in completados:
        out.append(f"update eventos set fecha = coalesce(fecha, {esc(e['fecha'])}::date),")
        out.append(f"                   lugar = coalesce(lugar, {esc(e['lugar'])})")
        out.append(f"  where id = {esc(e['id'])}::uuid;")
    out.append("")
    out.append("-- 2. Los que faltaban.")
    out.append("insert into eventos (id, nombre, tipo, fecha, lugar, organizado_ceppb) values")
    vals = [f"  ({esc(e['id'])}::uuid, {esc(e['nombre'])}, {esc(e['tipo'])}, "
            f"{esc(e['fecha'])}, {esc(e['lugar'])}, true)" for e in nuevos]
    out.append(",\n".join(vals))
    out.append("on conflict (id) do update set")
    out.append("  nombre = excluded.nombre, tipo = excluded.tipo,")
    out.append("  fecha = coalesce(eventos.fecha, excluded.fecha),")
    out.append("  lugar = coalesce(eventos.lugar, excluded.lugar);")
    out.append("")
    out.append("commit;")
    out.append("")
    out.append("-- Comprobación: ningún evento repetido el mismo día y sitio")
    out.append("select fecha, lugar, count(*) from eventos")
    out.append("group by 1, 2 having count(*) > 1;")
    print("\n".join(out))

    json.dump({"nuevos": nuevos, "completados": completados},
              open("db/importaciones/eventos-web.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
