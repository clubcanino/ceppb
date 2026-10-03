-- ============================================================
--  Las bajas cierran la puerta, y se puede invitar a quien no es socio
--
--  Hasta aquí, dar de baja a un socio era ponerle una fecha en la
--  ficha. El listado y el carnet lo reflejaban, pero la base de datos
--  seguía tratándolo como socio: podía entrar, ver el libro y tocar
--  sus perros. A partir de aquí:
--
--    · La baja corta el acceso desde su fecha. Readmitir es quitar la
--      fecha: vuelve todo lo que tenía, porque nada se ha borrado.
--
--    · Se puede dar acceso a personas que no son socias —un juez, un
--      veterinario, un criador de otro club—. Llevan ficha, como los
--      socios, porque es esa ficha la que se ata sola a su cuenta al
--      entrar con su correo. Pero no cuentan en el censo ni llevan
--      número. Dos alcances, a elegir con cada uno:
--        «invitado»: lo mismo que un socio — da de alta sus perros,
--                    declara camadas, escribe a socios.
--        «consulta»: ve el libro —ejemplares, pedigríes, camadas,
--                    eventos— y nada más. Ni directorio ni mensajes,
--                    y no registra nada.
--      Con fecha de caducidad opcional: pasada, la puerta se cierra
--      igual que con una baja.
-- ============================================================

begin;

-- 1. Qué es cada ficha, hasta cuándo vale y por qué se fue
alter table socios add column if not exists acceso text not null default 'socio';
alter table socios drop constraint if exists socios_acceso_check;
alter table socios add constraint socios_acceso_check
  check (acceso in ('socio', 'invitado', 'consulta'));
alter table socios add column if not exists acceso_hasta date;
alter table socios add column if not exists baja_motivo text;

-- Los invitados no llevan número de socio; los socios, siempre.
alter table socios alter column numero drop not null;
alter table socios drop constraint if exists socios_numero_si_socio;
alter table socios add constraint socios_numero_si_socio
  check (acceso <> 'socio' or numero is not null);

-- 2. Quién sigue dentro: ni de baja ni con el acceso caducado.
--    La baja corta desde su misma fecha.

/* Quien puede leer el libro: socios e invitados de cualquier alcance,
   mientras su ficha siga vigente. */
create or replace function es_socio() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from socios
     where auth_user_id = auth.uid()
       and (fecha_baja is null or fecha_baja > current_date)
       and (acceso_hasta is null or acceso_hasta >= current_date));
$$;

/* Quien puede participar: tener perros, declarar camadas, escribir.
   Todas las políticas de escritura cuelgan de esta función, así que
   una baja o un acceso de consulta se quedan sin nada que tocar. */
create or replace function mi_socio_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from socios
   where auth_user_id = auth.uid()
     and acceso <> 'consulta'
     and (fecha_baja is null or fecha_baja > current_date)
     and (acceso_hasta is null or acceso_hasta >= current_date);
$$;

-- 3. El directorio: los perfiles abiertos «a los socios» los ve quien
--    participa, no el acceso de consulta.
drop policy if exists socios_lectura on socios;
create policy socios_lectura on socios for select using (
  es_admin()
  or auth_user_id = auth.uid()
  or perfil_publico = 'publico'
  or (perfil_publico = 'socios' and mi_socio_id() is not null)
  or array_length(roles, 1) > 0
);

-- Su propio perfil lo edita quien sigue dentro.
drop policy if exists socios_propia on socios;
create policy socios_propia on socios for update
  using (es_admin() or id = mi_socio_id());

-- 4. A quién escribir: a quien participa y sigue vigente
create or replace function socios_a_los_que_escribir()
returns table (socio_id uuid, nombre_completo text, numero integer)
language sql stable security definer set search_path = public as $$
  select s.id, s.nombre_completo, s.numero
    from socios s
   where mi_socio_id() is not null
     and s.acepta_mensajes
     and s.id <> mi_socio_id()
     and s.acceso <> 'consulta'
     and (s.fecha_baja is null or s.fecha_baja > current_date)
     and (s.acceso_hasta is null or s.acceso_hasta >= current_date)
   order by s.apellidos, s.nombre;
$$;

drop policy if exists mensajes_envio on mensajes;
create policy mensajes_envio on mensajes for insert
  with check (
    de_id = mi_socio_id()
    and para_id <> mi_socio_id()
    and exists (select 1 from socios s
                 where s.id = para_id and s.acepta_mensajes
                   and s.acceso <> 'consulta'
                   and (s.fecha_baja is null or s.fecha_baja > current_date)
                   and (s.acceso_hasta is null or s.acceso_hasta >= current_date)));

-- 5. Nadie se cambia a sí mismo el alcance, la caducidad ni la baja
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
     or new.fecha_baja is distinct from old.fecha_baja or new.notas is distinct from old.notas
     or new.baja_motivo is distinct from old.baja_motivo
     or new.acceso is distinct from old.acceso
     or new.acceso_hasta is distinct from old.acceso_hasta then
    raise exception 'Los datos de secretaría sólo los cambia la Junta Directiva';
  end if;
  return new;
end; $$;

commit;

-- Comprobación
select acceso,
       count(*) filter (where fecha_baja is null) as vigentes,
       count(*) filter (where fecha_baja is not null) as de_baja
  from socios group by acceso;
