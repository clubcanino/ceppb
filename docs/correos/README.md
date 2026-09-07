# Los correos que salen del club

Supabase envía cinco correos automáticos. Los textos se editan **en el panel
de Supabase**, no en este repositorio: aquí están guardados para que quede
constancia de lo que dice cada uno y para poder volver a pegarlos si un día
se pierden.

## Dónde se pegan

Panel de Supabase → proyecto **ceppb-libro-de-cria** → menú izquierdo
**Authentication** → **Emails** (o *Email Templates*).

Hay una pestaña por correo. En cada una se cambian dos cosas:

1. **Subject** (asunto) — la línea de arriba.
2. **Message body** (cuerpo) — el recuadro grande. Pega el HTML entero,
   sustituyendo lo que hubiera.

Después de cada uno, **Save**.

## Por qué están escritos así

- **Todos los asuntos empiezan por «CEPPB»**. La plataforma le dice al socio
  que busque esa palabra en su correo cuando el mensaje no aparece: si el
  asunto no la lleva, esa instrucción no sirve de nada.
- **Un solo enlace por correo** y ninguna imagen suelta. Cuantos más enlaces
  e imágenes, más papeletas para el buzón de no deseado.
- **Se dice quién escribe y por qué**. Un correo automático que no se
  presenta es exactamente lo que un filtro antispam espera de un fraude.
- **Se avisa de qué hacer si no era él quien lo pidió**. Es lo que separa un
  correo legítimo de uno que no lo es.
- Nada de mayúsculas de más ni signos de exclamación: encienden los filtros.

## Los cinco

| Pestaña en Supabase | Cuándo sale | Archivo |
|---|---|---|
| Magic Link | El socio pide entrar con un enlace | `magic-link.html` |
| Invite user | La junta invita a un socio por primera vez | `invitacion.html` |
| Reset Password | El socio ha olvidado la contraseña | `contrasena.html` |
| Confirm signup | Confirmación de correo al darse de alta | `alta.html` |
| Change Email Address | El socio cambia su correo | `cambio-correo.html` |

Los asuntos están en `asuntos.txt`.
