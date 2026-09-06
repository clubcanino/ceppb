# Los correos que manda la plataforma

Supabase envía cuatro correos distintos. Estas son las plantillas del club, para pegar en
**Authentication › Emails** del panel, una por una.

| Archivo | Cuándo se manda | Plantilla de Supabase |
|---|---|---|
| `invitacion.html` | Secretaría invita a un socio a reclamar su ficha | *Invite user* |
| `enlace.html` | Alguien pide entrar con enlace al correo | *Magic Link* |
| `contrasena.html` | Alguien ha olvidado la contraseña | *Reset Password* |
| `alta.html` | Confirmación de un alta nueva | *Confirm signup* |

Las variables entre llaves las rellena Supabase: `{{ .ConfirmationURL }}` es el enlace
personal, `{{ .Email }}` el destinatario. No cambiarlas de nombre.

Los correos van en texto sencillo y con el emblema en color plano, sin imágenes externas:
así llegan bien a Gmail, Outlook y a los clientes que bloquean imágenes.
