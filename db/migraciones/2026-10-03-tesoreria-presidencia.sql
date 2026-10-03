-- ============================================================
--  Tesorería pasa a presidencia
--
--  Decisión del presidente (3-10-2026): la cuenta de tesorería
--  tiene el mismo acceso que la presidencia — configuración,
--  cargos del club, jueces y la lista de administradores.
-- ============================================================

update admins set nivel = 'presidencia', nota = 'Tesorería'
  where lower(email) = 'tesoreria.ceppb@gmail.com';

select email, nivel from admins order by email;
