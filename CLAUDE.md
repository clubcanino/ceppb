# Libro de Cría CEPPB

Plataforma de socios y ejemplares del **Club Español del Perro Pastor Belga**. Equivalente
propio de working-dog.com, ajustado al Reglamento de Cría del club (act. enero 2025).

## Interlocutor

Santiago Díaz Fandiño, presidente del CEPPB. Médico y juez FCI-IGP, **no programador**.
Explícale las cosas en español, sin jerga, y dile siempre qué tiene que hacer él, paso a paso.
Prefiere respuestas directas y con datos.

## Pila técnica

- **Frontend**: HTML + CSS + JavaScript sin framework. Sin paso de compilación: lo que hay en
  el repositorio es lo que se sirve. GitHub Pages desde la rama `main`.
- **Backend**: Supabase — Postgres, Auth (enlace mágico por correo), Storage (fotos), y
  **Row Level Security** haciendo cumplir las reglas.
- **Sin secretos en el repositorio**. La `anon key` de Supabase es pública por diseño; la
  `service_role` no entra nunca aquí.

## Reglas que no se negocian

1. **Nada cuenta hasta que la junta lo valida.** Las pruebas de salud y los resultados que
   introduce un propietario entran sin validar y **no computan** para aptos de cría, títulos
   ni baremos. Sólo la junta valida. Esto se protege con trigger en la base de datos, no con
   una comprobación en el navegador.
2. **Los perfiles son opt-in.** Un socio no ve el perfil ni la existencia de otro socio salvo
   que ese otro lo haya autorizado expresamente. Por defecto: oculto.
3. **El IBAN no se comparte jamás.** Sólo su titular y la junta. No aparece entre las opciones
   de privacidad.
4. **Los cargos del club son públicos** aunque el socio tenga el perfil reservado: de esos
   sólo se publica nombre y cargo. Sólo la junta los asigna.
5. **Los cruces intervariedades necesitan autorización previa.** Hasta que la Junta Directiva
   resuelve, la camada queda retenida y no se difunde.
6. **El cambio de titularidad de un perro exige autorización** de la junta.
7. **El afijo pertenece al criador** y forma parte del nombre registrado del ejemplar.

## Cuentas con permiso de junta directiva

```
santiagodiazf@gmail.com
pres.ceppb@gmail.com
tesoreria.ceppb@gmail.com
```

Van en la tabla `admins`. Las políticas de seguridad comprueban el correo del usuario
autenticado contra esa tabla.

## Documentación

- `docs/01-especificacion.md` — qué hace cada pantalla y el motor de reglas del reglamento
- `docs/02-modelo-datos.md` — entidades, campos y relaciones
- `db/schema.sql` — esquema y políticas de seguridad, listo para aplicar
- `datos/socios.csv` — censo real ya limpio (347 socios)
- `referencia/prototipo.html` — prototipo funcionando: lógica, pantallas y diseño

## Identidad visual

Tomada del emblema del club: **rojo #FF000E**, **oro #FFCF00**, **tinta #141311**. Tipografías
Archivo (titulares), IBM Plex Sans (texto) e IBM Plex Mono (datos: LOE, chip, fechas).
Lema del club: *belleza y funcionalidad* — las dos vías del reglamento; estructura va en oro,
utilidad en rojo. Modo claro y oscuro, con versión del emblema en negativo para el oscuro.
Todo esto ya está resuelto en el prototipo: reutilízalo.

## Cómo trabajar

- Commits en español, pequeños y explicados.
- Nada de datos inventados en la base de datos real. Si necesitas probar, usa un proyecto
  aparte de Supabase o datos claramente marcados y bórralos después.
- Antes de tocar el censo real, haz copia.
