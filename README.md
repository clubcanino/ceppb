# Libro de Cría CEPPB

Plataforma de socios y ejemplares del **Club Español del Perro Pastor Belga**, con el
Reglamento de Cría (act. enero 2025) aplicado sobre cada ficha.

La página es HTML, CSS y JavaScript sin compilar: lo que hay en este repositorio es
exactamente lo que se sirve. La base de datos, el acceso por correo y las fotos los pone
**Supabase**.

## Lo que importa entender

Las reglas del club viven **dentro de la base de datos**, no en la pantalla. Aunque alguien
manipulase esta página desde su navegador, el servidor le seguiría negando el IBAN ajeno o
la validación de un apto de cría. Eso está en [`db/schema.sql`](db/schema.sql): cinco
triggers y las políticas de acceso.

Tres reglas que el código no puede saltarse:

1. **Nada cuenta hasta que la junta lo valida.** Lo que introduce un propietario entra sin
   validar y no computa para aptos, títulos ni baremos.
2. **Los perfiles nacen ocultos.** Un socio no ve ni la existencia de otro salvo que ese
   otro lo haya autorizado.
3. **El IBAN no se comparte jamás.** Solo su titular y la junta.

## Estructura

```
index.html            Única página. Las pantallas son rutas #/…
css/estilo.css        Identidad del club: rojo #FF000E, oro #FFCF00, tinta #141311
js/config.js          Dirección de Supabase (datos públicos, no contraseñas)
js/util.js            Utilidades y registro de pantallas
js/reglamento.js      Motor de reglas del Reglamento de Cría
js/privacidad.js      Quién ve qué
js/componentes.js     Piezas visuales compartidas
js/sesion.js          Entrada por enlace al correo y vinculación al nº de socio
js/datos.js           Único punto que habla con Supabase
js/vistas/            Una pantalla por archivo
db/schema.sql         Esquema, triggers y políticas de seguridad
herramientas/         Scripts que se ejecutan en el ordenador, no en la web
pruebas/              Comprobaciones del reglamento
docs/                 Especificación funcional y modelo de datos
referencia/           Prototipo de partida y reglamento en PDF
```

## Datos personales

El censo real (**DNI, direcciones e IBAN de 347 personas**) **no está en este repositorio y
no debe estarlo nunca**. Vive en el ordenador de secretaría, se usa para importar a Supabase
y ahí acaba. `.gitignore` lo bloquea. En Git nada se borra del todo: un IBAN subido por error
queda en el historial para siempre.

## Poner en marcha

1. Crear el proyecto en [supabase.com](https://supabase.com) con el correo del club.
2. Pegar `db/schema.sql` entero en el editor SQL de Supabase y ejecutarlo.
3. Copiar el **Project URL** y la clave **anon public** (Project Settings › API) en
   `js/config.js`.
4. Importar el censo con `herramientas/importar-socios.mjs`.
5. Publicar con GitHub Pages desde la rama `main`.

## Comprobar que el reglamento se aplica bien

```
npm test
```

Ejercita el Anexo A, las cinco figuras de apto, la convalidación del Cap. 4, las edades de
monta, los cruces intervariedades y el Reproductor Superior. Si algo falla ahí, la
plataforma estaría concediendo o negando aptos contra el reglamento.
