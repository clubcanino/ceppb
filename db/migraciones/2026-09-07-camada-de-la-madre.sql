-- ============================================================
--  La camada la declara quien es dueño de la madre
--
--  Hasta ahora bastaba con ponerse uno mismo de criador: cualquier
--  socio podía declarar la camada de la perra de otro. Quien pare
--  es la hembra y quien responde de la camada es su propietario,
--  así que es él quien la registra.
--
--  Se separa lo que se puede crear de lo que se puede tocar:
--
--  · with check (crear y dejar tras editar): la madre tiene que ser
--    tuya. Sin madre no hay camada que declarar.
--  · using (mirar, editar, borrar): también quien figure de criador,
--    para que una camada no se quede huérfana si la perra cambia de
--    manos después.
--
--  La junta puede todo, como siempre.
-- ============================================================

begin;

-- De quién es un ejemplar. Va con security definer porque el socio
-- puede no ver la ficha de la madre y aun así la regla tiene que
-- poder comprobarse.
create or replace function propietario_de(p_perro uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select propietario_id from perros where id = p_perro;
$$;

revoke all on function propietario_de(uuid) from public;
grant execute on function propietario_de(uuid) to authenticated;

drop policy if exists camadas_escritura on camadas;
create policy camadas_escritura on camadas for all
  using (
    es_admin()
    or criador_id = mi_socio_id()
    or propietario_de(madre_id) = mi_socio_id())
  with check (
    es_admin()
    or (madre_id is not null and propietario_de(madre_id) = mi_socio_id()));

commit;

-- Comprobación: camadas cuya madre no es del criador que las declaró
-- select c.id, c.criador_id, p.propietario_id
--   from camadas c left join perros p on p.id = c.madre_id
--  where p.propietario_id is distinct from c.criador_id;
