-- ============================================================
--  Que no se den de alta perros que ya están en el libro
--
--  El libro trae 3.833 ejemplares sacados de los pedigríes de los
--  campeonatos. La mayoría no tienen titular: la ficha existe pero
--  nadie la gobierna. Cuando un socio va a dar de alta a su perro,
--  lo más probable es que ese perro YA esté ahí. Si lo mete otra
--  vez, el libro se parte en dos fichas del mismo animal, con dos
--  pedigríes a medias, y eso no se arregla solo.
--
--  Dos piezas:
--
--  1. coincidencias_de_ejemplar() — busca en TODO el libro, no en
--     lo que ese socio alcanza a ver. Tenía que ser así: si sólo
--     mirara lo visible, el duplicado se colaría justo contra las
--     fichas reservadas, que son las que nadie puede comprobar.
--     De una ficha que el socio no puede ver no se devuelve ni el
--     nombre ni el dueño: sólo que existe y por qué ha saltado.
--     Basta para no duplicar y no enseña lo que no toca.
--
--  2. alta_declarada — la declaración del guía de que miró las
--     coincidencias y su perro no es ninguna. Queda en la ficha,
--     con la fecha y las fichas que se le enseñaron, para que la
--     junta pueda mirarlo cuando aparezca un duplicado.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Comparar nombres como los compara una persona: sin acentos, sin
-- mayúsculas y sin los guiones, puntos y espacios que cada uno pone
-- donde quiere. «Gas de Azarbe», «GAS DE AZARBE» y «Gas-de-Azarbe»
-- son el mismo perro.
-- ------------------------------------------------------------
create or replace function llano(t text) returns text
language sql immutable as $$
  select regexp_replace(
    lower(translate(coalesce(t, ''),
      'ÁÀÄÂÃÅáàäâãåÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc')),
    '[^a-z0-9]', '', 'g');
$$;

-- ------------------------------------------------------------
-- La declaración del guía al dar de alta.
-- ------------------------------------------------------------
alter table perros add column if not exists alta_declarada jsonb;
comment on column perros.alta_declarada is
  'Declaración de quien dio de alta la ficha de que comprobó las coincidencias del libro y su ejemplar no era ninguna: {fecha, socio_id, coincidencias:[uuid]}';

-- ------------------------------------------------------------
-- Las coincidencias.
--
-- El microchip y el LOE identifican a un animal: si coinciden, es
-- el mismo perro y no hay más que hablar. El nombre no identifica
-- —hay cuatro «Alan» en el libro— pero es lo único que se tiene
-- cuando el socio no sabe el LOE, así que también salta, avisando
-- de que es sólo el nombre.
-- ------------------------------------------------------------
drop function if exists coincidencias_de_ejemplar(text, text, text, text);
create or replace function coincidencias_de_ejemplar(
  p_nombre text default null,
  p_afijo  text default null,
  p_loe    text default null,
  p_chip   text default null)
returns table (
  perro_id uuid,
  motivo   text,       -- chip | loe | nombre
  visible  boolean,    -- si este socio puede ver la ficha
  nombre   text, afijo text, variedad text, sexo text,
  fecha_nacimiento date, loe text, chip text,
  con_titular boolean, -- si ya tiene dueño (sin decir quién)
  es_mio      boolean)
language sql stable security definer set search_path = public as $$
  with busca as (
    select nullif(llano(p_nombre), '') as n,
           nullif(llano(coalesce(p_nombre,'') || coalesce(p_afijo,'')), '') as na,
           nullif(llano(p_loe),  '') as l,
           nullif(llano(p_chip), '') as c
  ),
  cand as (
    select p.*,
      case
        when b.c is not null and llano(p.chip) = b.c then 'chip'
        when b.l is not null and llano(p.loe)  = b.l then 'loe'
        when b.n is not null and llano(p.nombre) = b.n then 'nombre'
        when b.na is not null
         and llano(coalesce(p.nombre,'') || coalesce(p.afijo,'')) = b.na then 'nombre'
      end as m,
      (es_admin()
        or p.propietario_id = mi_socio_id()
        or p.visibilidad = 'publico'
        or (p.visibilidad = 'socios' and es_socio())) as ve
    from perros p, busca b
  )
  select
    c.id, c.m, c.ve,
    case when c.ve then c.nombre   end,
    case when c.ve then c.afijo    end,
    case when c.ve then c.variedad end,
    case when c.ve then c.sexo     end,
    case when c.ve then c.fecha_nacimiento end,
    case when c.ve then c.loe      end,
    case when c.ve then c.chip     end,
    c.propietario_id is not null,
    c.propietario_id is not distinct from mi_socio_id()
  from cand c
  where c.m is not null
  order by case c.m when 'chip' then 1 when 'loe' then 2 else 3 end,
           c.ve desc, c.nombre
  limit 20;
$$;

revoke all on function coincidencias_de_ejemplar(text, text, text, text) from public;
grant execute on function coincidencias_de_ejemplar(text, text, text, text) to authenticated;

commit;

-- Comprobación: un perro que sabemos que está debe salir por su nombre
-- select motivo, visible, nombre, loe from coincidencias_de_ejemplar('Gas de Azarbe');
