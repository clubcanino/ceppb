-- ============================================================
--  Dos niveles dentro de la junta
--
--  Tesorería tiene que poder trabajar: validar expedientes y
--  resultados, llevar el censo, cobrar las cuotas, resolver
--  traspasos. Todo eso queda igual.
--
--  Lo que no puede es cambiar la plataforma misma. Y hay dos cosas
--  que son exactamente eso:
--
--    · La lista de administradores. Es la llave maestra: quien la
--      edita puede darse cualquier permiso, o quitárselo a la
--      presidencia.
--    · Los cargos del club —jueces, figurantes, junta directiva—,
--      que los nombra la presidencia.
--
--  Sin carteles de «no tienes permiso»: esas opciones sencillamente
--  no se le ofrecen. Y si aun así llegara la orden, la base de datos
--  la rechaza, que es donde de verdad se decide.
-- ============================================================

begin;

alter table admins add column if not exists nivel text
  not null default 'gestion'
  check (nivel in ('presidencia', 'gestion'));

update admins set nivel = 'presidencia'
  where lower(email) in ('santiagodiazf@gmail.com', 'pres.ceppb@gmail.com');
update admins set nivel = 'gestion'
  where lower(email) = 'tesoreria.ceppb@gmail.com';

-- Quien manda del todo. es_admin() no cambia: tesorería sigue
-- siendo junta directiva para todo lo demás.
create or replace function es_presidencia() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admins a
     where lower(a.email) = lower(auth.jwt() ->> 'email')
       and a.nivel = 'presidencia');
$$;

-- La lista de administradores: la lee la junta, la toca la presidencia.
drop policy if exists admins_lectura on admins;
create policy admins_lectura on admins for select using (es_admin());
drop policy if exists admins_escritura on admins;
create policy admins_escritura on admins for all
  using (es_presidencia()) with check (es_presidencia());

-- Los cargos del club los nombra la presidencia. El resto de datos de
-- secretaría —cuota, altas, bajas, notas— sigue siendo de toda la junta.
create or replace function proteger_socio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.roles is distinct from old.roles and not es_presidencia() then
    raise exception 'Los cargos del club los nombra la presidencia';
  end if;
  if es_admin() then return new; end if;
  if new.numero is distinct from old.numero then
    raise exception 'El número de socio sólo lo cambia la secretaría';
  end if;
  if new.cuota is distinct from old.cuota or new.fecha_alta is distinct from old.fecha_alta
     or new.fecha_baja is distinct from old.fecha_baja or new.notas is distinct from old.notas then
    raise exception 'Los datos de secretaría sólo los cambia la Junta Directiva';
  end if;
  return new;
end; $$;
drop trigger if exists trg_proteger_socio on socios;
create trigger trg_proteger_socio before update on socios
  for each row execute function proteger_socio();

commit;

-- Comprobación
select email, nivel, nota from admins order by nivel, email;
