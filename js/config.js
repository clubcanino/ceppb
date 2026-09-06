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
