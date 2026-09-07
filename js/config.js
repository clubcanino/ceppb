/* ============================================================
   Conexión con Supabase.

   Estos dos datos NO son contraseñas. Supabase los llama públicos
   por diseño: van dentro de la página y cualquiera puede leerlos.
   Lo que protege el club son las políticas de la base de datos
   (db/schema.sql), no el ocultar esta clave.

   La clave que NUNCA se escribe aquí es la `service_role`.

   Los sacas del panel de Supabase:
     Project Settings > API  >  "Project URL"  y  "anon public"
   ============================================================ */
window.CONFIG = {
  SUPABASE_URL:  "https://qqyodehvkivvvcifcjrr.supabase.co",
  SUPABASE_ANON: "sb_publishable_ElFFX0K_M8mA5D90loHjQQ_QEFQJ4vI",
};

CONFIG.configurado = CONFIG.SUPABASE_URL !== "PENDIENTE" &&
                     CONFIG.SUPABASE_ANON !== "PENDIENTE";

/* La web del club. El calendario de convocatorias y las inscripciones
   viven allí y se muestran aquí dentro, para no llevarlos por
   duplicado ni obligar al socio a saltar de una página a otra. */
CONFIG.WEB_CLUB    = "https://www.ceppb.info";
CONFIG.WEB_EVENTOS = "https://www.ceppb.info/eventos";
CONFIG.WEB_ALTA    = "https://www.ceppb.info/inscripcion";
