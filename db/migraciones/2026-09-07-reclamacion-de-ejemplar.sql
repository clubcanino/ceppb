-- ============================================================
--  «Este perro es mío»
--
--  El libro tiene 3.773 ejemplares sin dueño: salieron de los
--  pedigríes de los campeonatos, no de la ficha de un socio. Un
--  socio puede reclamar el suyo, y cuando la junta lo autoriza la
--  ficha pasa a su nombre sola.
--
--  Antes esto sólo ocurría con los traspasos. Postgres no reescribe
--  el cuerpo de una función al cambiarla: hay que volver a crearla.
-- ============================================================

begin;

-- 4. Sólo la junta resuelve expedientes; el traspaso autorizado se aplica solo
create or replace function resolver_solicitud() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() and new.estado is distinct from old.estado then
    raise exception 'Sólo la Junta Directiva resuelve los expedientes';
  end if;
  /* Un traspaso autorizado se aplica solo, y una reclamación también:
     un socio dice «este perro es mío» y, cuando la junta lo autoriza,
     la ficha pasa a su nombre. Queda escrito de quién venía y a quién
     va, aunque viniera sin dueño. */
  if new.tipo in ('traspaso', 'reclamacion')
     and new.estado = 'autorizada' and old.estado <> 'autorizada' then
    update perros set
      propietario_id = new.a_socio_id,
      historial_titularidad = historial_titularidad || jsonb_build_object(
        'de', old.de_socio_id, 'a', new.a_socio_id, 'tipo', new.tipo,
        'fecha', coalesce(new.fecha_efecto, current_date), 'documento', new.documento)
    where id = new.perro_id;
  end if;
  return new;
end; $$;
drop trigger if exists trg_resolver_solicitud on solicitudes;
create trigger trg_resolver_solicitud before update on solicitudes
  for each row execute function resolver_solicitud();

-- Y las cuatro lenguas cooficiales, que la columna no admitía: quien
-- eligiera catalán o euskera no habría podido guardarlo.
alter table socios drop constraint if exists socios_idioma_check;
alter table socios add constraint socios_idioma_check
  check (idioma in ('es','ca','va','gl','eu','en','fr','de'));

commit;

-- Comprobación
select tipo, estado, count(*) from solicitudes group by 1, 2 order by 1, 2;
