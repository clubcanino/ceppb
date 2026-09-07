-- ============================================================
--  Sólo entra quien está en el censo, y entra en su ficha
--
--  Hasta ahora bastaba con crearse una cuenta con cualquier correo:
--  la plataforma daba por socio a todo el que se autenticaba, y la
--  ficha del censo sólo se ataba al abrir un enlace de invitación.
--  Como no se había enviado ninguno, cuatro personas del censo
--  entraron sin quedar vinculadas a su propia ficha.
--
--  A partir de aquí:
--    · Ser socio es tener ficha en el censo, no haberse registrado.
--      Quien no la tenga no ve el libro: ni ejemplares, ni camadas,
--      ni el directorio.
--    · Al entrar, si el correo consta en el censo y esa ficha no
--      tiene dueño, se ata sola. Es la misma garantía que daba la
--      invitación: que la persona controla ese buzón, y el buzón lo
--      puso la secretaría.
--    · Quince correos del censo están compartidos por dos o tres
--      socios —familias—. Ahí no se adivina: se le pregunta cuál es
--      la suya.
-- ============================================================

begin;

-- 1. Socio es quien tiene ficha, no quien tiene cuenta.
create or replace function es_socio() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from socios where auth_user_id = auth.uid());
$$;

-- 2. Qué fichas del censo llevan mi correo y siguen sin dueño.
create or replace function fichas_para_mi_correo()
returns table (socio_id uuid, numero integer, nombre_completo text)
language sql stable security definer set search_path = public, auth as $$
  select s.id, s.numero, s.nombre_completo
    from socios s
    join auth.users u on u.id = auth.uid()
   where lower(s.email) = lower(u.email)
     and s.auth_user_id is null
     and u.email_confirmed_at is not null
   order by s.numero;
$$;

-- 3. Atar mi cuenta a una de ellas. Comprueba otra vez todo: que el
--    correo es el mío, que está confirmado y que nadie se le ha
--    adelantado. Sin eso, cualquiera podría pedir la ficha ajena.
create or replace function vincular_a_mi_ficha(p_socio uuid) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare v_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'Hay que entrar primero';
  end if;
  if exists (select 1 from socios where auth_user_id = auth.uid()) then
    raise exception 'Tu cuenta ya está atada a una ficha';
  end if;
  select exists (
    select 1 from socios s join auth.users u on u.id = auth.uid()
     where s.id = p_socio
       and lower(s.email) = lower(u.email)
       and s.auth_user_id is null
       and u.email_confirmed_at is not null
  ) into v_ok;
  if not v_ok then
    raise exception 'Ese perfil no corresponde a tu correo, o ya lo ha reclamado alguien';
  end if;
  update socios set auth_user_id = auth.uid() where id = p_socio;
  return p_socio;
end; $$;

revoke all on function fichas_para_mi_correo()      from public;
revoke all on function vincular_a_mi_ficha(uuid)    from public;
grant execute on function fichas_para_mi_correo()   to authenticated;
grant execute on function vincular_a_mi_ficha(uuid) to authenticated;

commit;

-- Comprobación: cuántas cuentas quedarían atadas solas
select u.email, count(s.id) as fichas_con_ese_correo
  from auth.users u
  left join socios s on lower(s.email) = lower(u.email) and s.auth_user_id is null
 group by u.email order by 2 desc;
