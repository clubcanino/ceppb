-- ============================================================
--  Constancia de quién ha entrado en la plataforma
--
--  Los datos de acceso —cuándo se creó la cuenta, cuándo entró por
--  última vez, si confirmó el correo— viven en el esquema de
--  autenticación, al que la plataforma no llega desde el navegador.
--
--  Esta función los saca, y sólo para la junta: la condición está
--  dentro, así que a cualquier otro le devuelve una lista vacía. No
--  expone contraseñas ni testigos de sesión, sólo fechas y el correo.
-- ============================================================

begin;

create or replace function accesos_a_la_plataforma()
returns table (
  socio_id        uuid,
  email           text,
  cuenta_creada   timestamptz,
  ultima_entrada  timestamptz,
  correo_confirmado boolean
)
language sql stable security definer set search_path = public, auth as $$
  select s.id, u.email::text, u.created_at, u.last_sign_in_at,
         (u.email_confirmed_at is not null)
    from auth.users u
    left join socios s on s.auth_user_id = u.id
   where es_admin();
$$;

revoke all on function accesos_a_la_plataforma() from public;
grant execute on function accesos_a_la_plataforma() to authenticated;

commit;

select * from accesos_a_la_plataforma();
