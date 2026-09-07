#!/usr/bin/env python3
"""
Convierte el JSON de pedigríes en SQL para el editor de Supabase.

Los ejemplares entran sin propietario y marcados como importados: son
el esqueleto genealógico del club, no fichas de socios. Cuando un
socio reclame uno, la junta lo autoriza y a partir de ahí es suyo.

    python3 herramientas/leer-pedigries.py datos/...xlsx > copias/pedigries.json
    python3 herramientas/generar-sql-pedigries.py > copias/pedigries.sql
"""
import json, sys, uuid

NAMESPACE = uuid.UUID("c1e9b0de-0000-4000-8000-000000000000")

def id_estable(clave):
    """El mismo perro tiene siempre el mismo identificador, se importe
    una vez o diez: así reimportar no crea duplicados."""
    return str(uuid.uuid5(NAMESPACE, clave))

def esc(v):
    if v is None or v == "":
        return "null"
    return "'" + str(v).replace("'", "''") + "'"

def main():
    d = json.load(open("copias/pedigries.json", encoding="utf-8"))
    ej = d["ejemplares"]
    comp = {c["clave"]: c for c in d["competidores"]}

    filas = []
    for k, e in ej.items():
        c = comp.get(k)
        wd = e.get("wd") or (c or {}).get("wd")
        filas.append({
            "id": id_estable(k),
            "nombre": e["nombre"],
            "sexo": e.get("sexo"),
            "loe": e.get("loe"),
            "padre": id_estable(e["padre"]) if e.get("padre") else None,
            "madre": id_estable(e["madre"]) if e.get("madre") else None,
            "wd": f"https://es.working-dog.com/dogs-details/{wd}" if wd else None,
            "origen": "working-dog · campeonatos CEPPB 2021-2025 y FMBB 2022-2026",
        })

    out = []
    out.append("-- ============================================================")
    out.append(f"--  Libro genealógico del CEPPB: {len(filas)} ejemplares")
    out.append("--")
    out.append("--  Salen de los pedigríes de los participantes en los cinco")
    out.append("--  últimos campeonatos. Entran SIN PROPIETARIO: son el árbol")
    out.append("--  del club, no fichas de socios. Cuando alguien reclame uno,")
    out.append("--  la junta lo autoriza y a partir de ahí es suyo.")
    out.append("--")
    out.append("--  Se puede ejecutar más de una vez sin duplicar nada.")
    out.append("-- ============================================================")
    out.append("")
    out.append("begin;")
    out.append("")

    # primero los ejemplares, sin padres: aún no existen todos
    out.append("-- 1. Los ejemplares")
    for i in range(0, len(filas), 200):
        trozo = filas[i:i+200]
        out.append("insert into perros (id, nombre, sexo, loe, workingdog_url, origen, visibilidad) values")
        vals = [f"  ({esc(f['id'])}::uuid, {esc(f['nombre'])}, {esc(f['sexo'])}, "
                f"{esc(f['loe'])}, {esc(f['wd'])}, {esc(f['origen'])}, 'socios')"
                for f in trozo]
        out.append(",\n".join(vals))
        out.append("on conflict (id) do update set")
        out.append("  nombre = excluded.nombre,")
        out.append("  sexo = coalesce(perros.sexo, excluded.sexo),")
        out.append("  loe = coalesce(perros.loe, excluded.loe),")
        out.append("  workingdog_url = coalesce(perros.workingdog_url, excluded.workingdog_url),")
        out.append("  origen = coalesce(perros.origen, excluded.origen);")
        out.append("")

    # y ahora los vínculos, cuando ya están todos dentro
    out.append("-- 2. Padres y madres, una vez que todos existen")
    conPadres = [f for f in filas if f["padre"] or f["madre"]]
    for i in range(0, len(conPadres), 200):
        trozo = conPadres[i:i+200]
        out.append("update perros p set padre_id = v.padre::uuid, madre_id = v.madre::uuid")
        out.append("from (values")
        vals = [f"  ({esc(f['id'])}, {esc(f['padre'])}, {esc(f['madre'])})" for f in trozo]
        out.append(",\n".join(vals))
        out.append(") as v(id, padre, madre)")
        out.append("where p.id = v.id::uuid")
        out.append("  and (p.padre_id is null and p.madre_id is null);")
        out.append("")

    out.append("commit;")
    out.append("")
    out.append("-- Comprobación")
    out.append("select")
    out.append("  count(*) as ejemplares,")
    out.append("  count(*) filter (where padre_id is not null) as con_padre,")
    out.append("  count(*) filter (where sexo is not null) as con_sexo,")
    out.append("  count(*) filter (where propietario_id is not null) as con_propietario")
    out.append("from perros;")

    print("\n".join(out))

    # El mismo volcado en JSON, para poder cargarlo desde la propia
    # plataforma con la sesión de la junta en vez de por el editor SQL.
    json.dump(filas, open("db/importaciones/ejemplares.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
