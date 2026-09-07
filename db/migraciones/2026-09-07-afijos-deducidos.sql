-- ============================================================
--  El afijo, como dato aparte, sin tocar el nombre
--
--  El nombre registrado de un ejemplar lleva el afijo dentro:
--  «Ninfa de Supercan», «Blitz des Ombres Valeureux». Así vinieron
--  los 3.833 del libro y así se queda, porque así figura en el
--  pedigrí y es lo que la gente escribe cuando busca.
--
--  Pero saber de qué criadero es cada perro sirve para mucho: para
--  agrupar, para enlazar la ficha con el socio que tiene ese afijo
--  registrado, y para que un criador vea lo suyo. Así que el afijo
--  se anota además en su propia columna, deducido de los nombres.
--
--  Cómo se deduce, y por qué es de fiar: un afijo es un final que
--  comparten varios ejemplares del mismo criadero. Se toma, de cada
--  nombre, el final más largo que aparezca en dos o más ejemplares
--  distintos del libro. Un final que sólo tiene un perro no se
--  toca: podría ser parte de su nombre.
--
--  Sale bien porque el libro es grande: «des Deux Pottois» aparece
--  en 108 ejemplares, «des Loups Mutins» en 67, «de Duvetorre» en
--  56. Y los que no empiezan por preposición salen igual de bien:
--  «Perle de Tourbière», «Airport Hannover», «Force Canina».
--
--  2.388 de 3.833 quedan con afijo. Los otros 1.445 se quedan sin
--  él, que es lo correcto: de esos no lo sabemos.
--
--  No se toca ningún nombre. Sólo se rellena una columna que estaba
--  vacía, y sólo donde estaba vacía.
-- ============================================================

begin;

with pal as (
  select id, btrim(nombre) as nombre, string_to_array(btrim(nombre), ' ') as w
    from perros
   where nombre is not null and btrim(nombre) <> ''
),
suf as (
  -- Todos los finales de 2 a 6 palabras, dejando siempre al menos
  -- una palabra de nombre propio delante (de ahí el generate_series
  -- desde 2): el afijo nunca es el nombre entero.
  select p.id, p.nombre,
         array_to_string(p.w[i:array_length(p.w,1)], ' ') as s,
         array_length(p.w,1) - i + 1 as np
    from pal p, generate_series(2, array_length(p.w,1)) i
   where array_length(p.w,1) - i + 1 between 2 and 6
),
cuenta as (
  select llano(s) as k, count(distinct id) as cuantos
    from suf group by 1
),
mejor as (
  -- Para cada ejemplar, el final más largo que comparta con otros.
  select distinct on (s.id) s.id, s.s as afijo
    from suf s join cuenta c on c.k = llano(s.s)
   where c.cuantos >= 2
   order by s.id, s.np desc, c.cuantos desc
)
update perros p
   set afijo = m.afijo
  from mejor m
 where p.id = m.id
   and (p.afijo is null or btrim(p.afijo) = '');

-- Y donde ese afijo es el de un socio del club, se enlaza la ficha
-- con él: así el criador ve lo criado bajo su afijo.
update perros p
   set afijo_socio_id = s.id
  from socios s
 where p.afijo is not null and btrim(p.afijo) <> ''
   and s.afijo is not null and btrim(s.afijo) <> ''
   and llano(p.afijo) = llano(s.afijo)
   and p.afijo_socio_id is null;

commit;

-- Comprobación
-- select count(*) filter (where afijo is not null) as con_afijo,
--        count(*) filter (where afijo is null) as sin_afijo,
--        count(distinct llano(afijo)) as afijos_distintos,
--        count(*) filter (where afijo_socio_id is not null) as enlazados_a_socio
--   from perros;
