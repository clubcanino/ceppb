-- ============================================================
--  Que la mensajería sirva de algo
--
--  Estaba lo escrito y lo recibido, pero no había a quién escribir:
--  el botón sólo sale en la ficha de un socio, y un socio sólo ve
--  las fichas de quien ha abierto su perfil. Con un perfil abierto
--  en todo el club, nadie podía escribir a nadie.
--
--  La regla del club protege los DATOS de un socio, y escribirle no
--  es verlos: quien recibe un mensaje no enseña su correo, ni su
--  teléfono, ni su dirección. Sólo su nombre, que es lo mínimo para
--  dirigirse a alguien.
--
--  Aun así, cada uno decide: quien no quiera que le escriban, lo
--  apaga en su perfil.
-- ============================================================

begin;

alter table socios add column if not exists acepta_mensajes boolean not null default true;

/* A quién puedo escribir: los socios que lo aceptan, y de ellos sólo
   el nombre. Ni un dato más sale por aquí. */
create or replace function socios_a_los_que_escribir()
returns table (socio_id uuid, nombre_completo text, numero integer)
language sql stable security definer set search_path = public as $$
  select s.id, s.nombre_completo, s.numero
    from socios s
   where es_socio()
     and s.acepta_mensajes
     and s.id <> mi_socio_id()
     and s.fecha_baja is null
   order by s.apellidos, s.nombre;
$$;

revoke all on function socios_a_los_que_escribir() from public;
grant execute on function socios_a_los_que_escribir() to authenticated;

/* Y no se puede escribir a quien ha dicho que no. La pantalla ya no
   se lo ofrece, pero esto es lo que de verdad lo impide. */
drop policy if exists mensajes_envio on mensajes;
create policy mensajes_envio on mensajes for insert
  with check (
    de_id = mi_socio_id()
    and para_id <> mi_socio_id()
    and exists (select 1 from socios s
                 where s.id = para_id and s.acepta_mensajes and s.fecha_baja is null));

commit;

select count(*) filter (where acepta_mensajes) as aceptan,
       count(*) filter (where not acepta_mensajes) as no_aceptan
  from socios;
