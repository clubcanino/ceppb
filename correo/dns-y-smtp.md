# El correo del club: cómo está montado

El servidor de correo de pruebas de Supabase manda **2 correos por hora**. Con eso no se
puede invitar a 296 socios, así que el envío pasa por **Resend**, con el dominio del club.

## Registros DNS en Wix (hechos el 6-9-2026)

Estos cuatro son **añadidos**. No se ha tocado nada de lo que ya había: los tres `A` de la
raíz y el `CNAME` de `www` siguen apuntando a Wix y la web del club no se ha caído en
ningún momento.

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `rsend` | `rsend-euw1.forge.rmta.net` |
| CNAME | `send` | `send.forge.rmta.net` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |
| TXT | `resend._domainkey` | clave pública DKIM, 218 caracteres |

Comprobar que siguen en pie:

```
dig +short rsend.ceppb.info CNAME
dig +short send.ceppb.info CNAME
dig +short _dmarc.ceppb.info TXT
dig +short resend._domainkey.ceppb.info TXT
```

## El aviso de Wix que no aplica

Resend avisa de que «Wix no admite subdominios en registros MX». Eso solo hace falta para
**recibir** correo, y esa opción (*Enable Receiving*) está apagada. Para enviar invitaciones
no se necesita ningún MX, así que Wix sirve.

Si algún día el club quisiera **recibir** correo en el dominio a través de Resend, entonces
sí habría que mover el DNS a otro proveedor (Cloudflare, gratis).

## Lo que falta

1. Esperar a que Resend marque `ceppb.info` como **Verified**.
2. En Resend: **API Keys → Create API Key**, permiso *Sending access*. La clave se ve una
   sola vez.
3. En Supabase: **Project Settings › Authentication › SMTP Settings**, activar *Enable
   Custom SMTP*:

   | Campo | Valor |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | la clave `re_…` |
   | Sender email | `noreply@ceppb.info` |
   | Sender name | `Club Español del Perro Pastor Belga` |

4. Subir el límite en **Auth › Rate Limits** (con SMTP propio deja tocarlo).
5. Pegar las plantillas de `correo/` en **Authentication › Emails**.

La clave `re_…` es una credencial: la mete el presidente, no se escribe en este repositorio.
