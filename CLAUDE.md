# Mi CEPPB

Plataforma de socios y ejemplares del **Club Español del Perro Pastor Belga**. Equivalente
propio de working-dog.com, ajustado al Reglamento de Cría del club (act. enero 2025).

Se llama **Mi CEPPB**. Vive en <https://clubcanino.github.io/ceppb/> y su manual público,
para los socios, en `manual.html`.

## Interlocutor

Santiago Díaz Fandiño, presidente del CEPPB. Médico y juez FCI-IGP, **no programador**.
Explícale las cosas en español, sin jerga, y dile siempre qué tiene que hacer él, paso a paso.
Prefiere respuestas directas y con datos.

## Estado a 7 de septiembre de 2026

Lo que hay dentro, y de dónde salió:

- **347 socios** del censo real. Sólo los correos del censo pueden entrar, y la cuenta se
  ata sola a su ficha. 33 socios no tienen correo y no pueden acceder hasta que secretaría
  se lo anote.
- **3.833 ejemplares**, 2.935 con padre y madre enlazados. Salieron de los pedigríes de
  working-dog de los participantes en los cinco últimos Campeonatos Nacionales y en el
  Mundial FMBB, más las actas de la RSCE.
- **24 eventos y 1.718 resultados**. 931 títulos esperan la validación de la junta.
- Ocho idiomas: castellano, catalán, valenciano, gallego, euskera, inglés, francés y alemán.

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

## Decisiones tomadas que no se deducen del código

1. **El nombre de un ejemplar lleva su afijo dentro**: «Ninfa de Supercan», no «Ninfa». Así
   vinieron los 3.833 y así se pide en el alta. `nombrePerro()` en `js/util.js` es el único
   sitio donde se decide cómo se escribe; úsalo en todas partes. El campo `afijo` es un dato
   aparte —de qué criadero es—, deducido de los nombres (2.388 lo tienen).
2. **Antes de dar de alta un ejemplar se cotejan los repetidos** contra todo el libro, no
   contra lo que ese socio ve: si sólo mirase lo visible, el duplicado se colaría justo
   contra las fichas reservadas. De una ficha que no puede ver no se le dice ni el nombre.
3. **El simulador de cruce informa; quien autoriza es la Junta Directiva.** No dice «cruce
   no autorizable»: dice qué le falta a cada uno. Cuando los dos cumplen, «Cruce autorizable
   y recomendado por el club».
4. **La camada la declara el propietario de la madre.** En el formulario y en la política de
   la base de datos, que es la que manda.
5. **Tesorería tiene acceso de gestión pero no de presidencia**: puede casi todo menos tocar
   la configuración de la plataforma, nombrar jueces o repartir cargos. Y no se le nota.
6. La plataforma **se instala en el móvil** como aplicación (PWA), sin pasar por ninguna
   tienda. El service worker va **siempre a la red primero**: guardar copias significaría que
   un socio se queda con una versión vieja del libro sin enterarse.

## Palabras del presidente sobre seguridad y privacidad

Se citan tal cual porque gobiernan decisiones y no se deducen del código:

- «no seas tan severo con la seguridad, no pasa nada xq los correos y datos estén subidos»
- «los socios solo los pueden añadir los perfiles de administración»
- «no quiero que un perfil no administración vea las opciones de administración»
- «el listado de socios debe poder exportarse a un excel […] (solo para administración)»
- «a tesorería dale un acceso parcial sin que se note»
- «solo los correos del censo deberían poder acceder y se tiene que vincular a su ficha de
  manera automática»

## Cuentas con permiso de junta directiva

```
santiagodiazf@gmail.com     presidencia
pres.ceppb@gmail.com        presidencia
tesoreria.ceppb@gmail.com   gestión
```

Van en la tabla `admins`, con una columna `nivel`. Las políticas comprueban el correo del
usuario autenticado contra esa tabla: `es_admin()` para cualquiera de los tres,
`es_presidencia()` para los dos primeros.

**Tesorería puede casi todo y no se le nota**: da de alta socios, valida salud y resultados,
exporta a Excel. Lo que no puede: cambiar la configuración de la plataforma, repartir
cargos, nombrar jueces, tocar la tabla `admins` ni ascenderse a sí misma. Comprobado
atacando la base de datos con su sesión.

## Lo que un socio puede hacer

Dar de alta sus perros (con cotejo de repetidos), ver el pedigrí hasta 8 generaciones,
registrar salud y títulos para que la junta los valide, consultar qué le falta para cada
apto de cría, simular un cruce con la consanguinidad prevista, ver hermanos y descendencia,
reclamar un ejemplar del libro que sea suyo, sacar el certificado del ejemplar y su carnet
de socio, dar «me gusta» a un perro, escribir a otro socio sin que se crucen los correos,
elegir idioma entre ocho, y llevarse la plataforma al móvil como aplicación.

## Dónde está cada cosa

| Archivo | Qué gobierna |
|---|---|
| `js/datos.js` | La única puerta a Supabase. Traduce snake_case ↔ camelCase |
| `js/columnas.js` | **Generado** por `herramientas/generar-columnas.mjs` desde `db/schema.sql` |
| `js/sesion.js` | Quién entra, y el atado automático de la cuenta a su ficha del censo |
| `js/reglamento.js` | El motor del Reglamento de Cría: aptos, cruces, baremo, títulos |
| `js/genealogia.js` | Pedigrí, consanguinidad de Wright, ancestros comunes, hermanos |
| `js/cotejo.js` | Que no se dé de alta un perro que ya está en el libro |
| `js/privacidad.js` | Qué ve cada uno de cada quién |
| `js/componentes.js` | El buscador de fichas por nombre y el buscador de la barra |
| `js/formularios-def.js` | Todos los formularios. `guardarEjemplar()` vive aquí, fuera de `FORMS` |
| `js/vistas/cria.js` | Aptos, simulador de cruce, pedigrí de la camada, intervariedades |
| `manual.html` | Página suelta y pública para los socios. No carga nada de la plataforma |

## Trampas: cosas que ya han fallado aquí

Cada una costó tiempo. Están aquí para no repetirlas.

1. **`aFila` descarta en silencio lo que no sea una columna real.** Guardar un campo que no
   existe en la tabla no da error: se pierde y el estado nunca cambia. Ya pasó dos veces
   (`invitacion`, `cuentaVinculada`). Si algo «se guarda pero no se guarda», mira
   `js/columnas.js` primero.
2. **`js/columnas.js` se genera desde `db/schema.sql`.** Varias columnas entraron por
   migración sin volver al esquema, y al regenerar desaparecieron del navegador sin avisar.
   Toda columna nueva va **también** a `db/schema.sql`.
3. **El editor SQL de Supabase no tiene JWT**: ahí `es_admin()` y `mi_socio_id()` son nulos,
   así que las escrituras que exigen junta fallan. Se hacen desde la plataforma, con sesión.
   Y pide **una segunda confirmación** en un botón «Run query»: sin ese segundo clic la
   migración parece aplicada y no lo está. Ha pasado.
4. **El trigger `trg_proteger_perro` bloquea el cambio de titularidad.** Para montar pruebas
   hay que apartarlo dentro de la transacción y volver a ponerlo, con `rollback` al final.
5. **Excel omite las celdas vacías.** Leer las filas por orden de aparición metía a los
   abuelos en el sitio de los padres. Se leen por letra de columna.
6. **El enlace a working-dog necesita el número y el nombre con guiones**:
   `…/dogs-details/6431570/Gas-de-Azarbe`. Sólo con el número da 404.
7. **Chrome congela las animaciones en las pestañas de fondo.** Un menú que parecía roto
   estaba bien: se medía el valor inicial de la transición. Activa la pestaña antes de medir.
8. **En CSS grid, una columna no encoge por debajo de su contenido** salvo `min-width:0`. Es
   lo que hacía que el pedigrí ancho echara de la pantalla al resto del simulador.
9. **`offsetTop` va contra el primer ancestro posicionado**, no contra la caja con scroll.
   Para posicionar dentro de un contenedor, `getBoundingClientRect`.
10. **En las pruebas**, `assert.deepEqual` falla entre contextos de `vm` porque los
    prototipos son distintos: compara longitudes o cadenas unidas. Y los `const` de
    `js/util.js` no se pueden sobrescribir dentro del contexto.
11. **macOS puede revocar el acceso a ~/Desktop y ~/Downloads a mitad de sesión.** Si hace
    falta trabajar con archivos de ahí, cópialos a `/tmp` al empezar.

## Cómo trabajar

- Commits en español, pequeños y explicados. **El commit dice por qué, no qué**: el qué ya
  está en el diff. Los porqués de este proyecto viven en los mensajes de commit y en los
  comentarios del código, no en la conversación con Claude, que se pierde.
- Nada de datos inventados en la base de datos real. Si necesitas probar, usa un proyecto
  aparte de Supabase o datos claramente marcados y bórralos después.
- Antes de tocar el censo real, haz copia.
- **Las reglas se comprueban atacando la base de datos**, no mirando la pantalla. Para
  suplantar a un socio en el editor SQL, dentro de una transacción que se deshace:
  `select set_config('request.jwt.claims', json_build_object('sub', <auth_user_id>)::text, true);`
  `set local role authenticated;` … `rollback;`
- `npm test` antes de subir. Hay 344 pruebas en `pruebas/`.
- Cada cambio sube el `?v=NN` de **todas** las referencias de `index.html` (van 71): sin eso
  los socios se quedan con la versión vieja en la caché.

## Desplegar

`git push` a `main` y GitHub Pages tarda **entre 45 y 90 segundos**. No se da por bueno un
cambio hasta verlo servido:

```
curl -s https://clubcanino.github.io/ceppb/index.html | grep -c "v=NN"
```

## Los correos que salen del club

Las cinco plantillas están en `docs/correos/` y **aplicadas en Supabase** (Authentication ›
Emails). Todas dicen «Mi CEPPB», llevan el diseño del club y avisan de mirar la carpeta de
spam, que es la razón número uno por la que un socio se queda fuera creyendo que el enlace
no le ha llegado. Los asuntos empiezan por `CEPPB ·` para que se puedan buscar.

Si se editan en el panel de Supabase: comprobar que el campo del asunto es el que toca
(`MAILER_SUBJECTS_*`) antes de guardar. Navegar entre plantillas con `history.pushState` no
recarga el formulario y se sobrescribió el asunto de una con el de otra.

## Identidad visual

Tomada del emblema del club: **rojo #FF000E**, **oro #FFCF00**, **tinta #141311**. Tipografías
Archivo (titulares), IBM Plex Sans (texto) e IBM Plex Mono (datos: LOE, chip, fechas).
Lema del club: *belleza y funcionalidad* — las dos vías del reglamento; estructura va en oro,
utilidad en rojo. Modo claro y oscuro, con versión del emblema en negativo para el oscuro.
Todo esto ya está resuelto en el prototipo: reutilízalo.

## Documentación

- `docs/01-especificacion.md` — qué hace cada pantalla y el motor de reglas del reglamento
- `docs/02-modelo-datos.md` — entidades, campos y relaciones
- `db/schema.sql` — esquema y políticas de seguridad, listo para aplicar
- `datos/socios.csv` — censo real ya limpio (347 socios)
- `referencia/prototipo.html` — prototipo funcionando: lógica, pantallas y diseño

## Pendiente

- Mandar las 296 invitaciones a los socios que aún no han entrado (dijo: «no mandes
  invitaciones aún»).
- Socio nº 1108, Samuel Enrique Rios, sin fecha de alta (venía como 31 de febrero).
- Dos fichas con el mismo LOE 2317281 —«Quelia del Clamiu» y «Aris»—, probablemente un LOE
  mal transcrito en la importación. Lo tiene que mirar la junta con el pedigrí delante.
- 931 títulos de working-dog esperando validación de la junta.
- El manual para socios (`manual.html`) y los textos de redes sociales están hechos. El
  enlace que se reparte es <https://clubcanino.github.io/ceppb/manual.html>.

## Cómo seguir en otra conversación

Este archivo se lee entero al empezar cualquier conversación nueva desde esta carpeta. Lo
que esté aquí sobrevive; lo que sólo se dijo hablando, no. Cuando se tome una decisión que
no se pueda deducir leyendo el código, se apunta aquí.

Para retomar la conversación anterior: `cd /Users/santi && claude --continue`. Está guardada
en `~/.claude/projects/-Users-santi/`. Pero conviene más empezar limpio desde la carpeta del
proyecto y dejar que este archivo haga su trabajo.
