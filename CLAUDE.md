# Mi CEPPB

Plataforma de socios y ejemplares del **Club Español del Perro Pastor Belga**. Equivalente
propio de working-dog.com, ajustado al Reglamento de Cría del club (act. enero 2025).

Se llama **Mi CEPPB**. Vive en <https://clubcanino.github.io/ceppb/> y su manual público,
para los socios, en `manual.html`.

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

## Pendiente

- Mandar las 296 invitaciones a los socios que aún no han entrado (dijo: «no mandes
  invitaciones aún»).
- Socio nº 1108, Samuel Enrique Rios, sin fecha de alta (venía como 31 de febrero).
- Dos fichas con el mismo LOE 2317281 —«Quelia del Clamiu» y «Aris»—, probablemente un LOE
  mal transcrito en la importación. Lo tiene que mirar la junta con el pedigrí delante.
- 931 títulos de working-dog esperando validación de la junta.
