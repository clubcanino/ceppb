-- ============================================================
--  El calendario del club, dentro del libro
--  13 eventos nuevos · 4 que ya estaban
--
--  En la web cada concurso figura una vez por tarifa de
--  inscripción: 28 entradas para 17 eventos. Y cuatro de ellos
--  ya estaban en el libro con el nombre que les da working-dog:
--  a esos se les completa la fecha y el lugar, que es lo que
--  les faltaba, en vez de crearlos otra vez.
-- ============================================================

begin;

-- 1. Los que ya estaban: sólo se les pone la fecha y el sitio.
update eventos set fecha = coalesce(fecha, '2023-11-24'::date),
                   lugar = coalesce(lugar, 'Medina-Sidonia')
  where id = 'd274e6d7-c7b9-5fc0-a94a-1163dec2f0c5'::uuid;
update eventos set fecha = coalesce(fecha, '2024-11-22'::date),
                   lugar = coalesce(lugar, 'Castelldans')
  where id = 'fc30d24c-0c12-5160-b90e-399669730b62'::uuid;
update eventos set fecha = coalesce(fecha, '2025-11-08'::date),
                   lugar = coalesce(lugar, 'Igea')
  where id = 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid;
update eventos set fecha = coalesce(fecha, '2025-11-21'::date),
                   lugar = coalesce(lugar, 'Pedro Bernardo')
  where id = '6b64d39a-2104-58f6-9437-8b05318d068d'::uuid;

-- 2. Los que faltaban.
insert into eventos (id, nombre, tipo, fecha, lugar, organizado_ceppb) values
  ('fab658c4-1c8c-5877-a216-e6763dd70e92'::uuid, 'Examen y selección de figurantes IGP CEPPB · Quijorna', 'Otro', '2023-09-17', 'Quijorna', true),
  ('2b30356b-b5ae-58ce-a078-ed47c5b28adb'::uuid, 'Campeonato Nacional de Mondioring 2024 · Cártama', 'CNM', '2024-02-03', 'Cártama', true),
  ('6ac7bac2-46a8-5c17-b0a5-2a838b040ed4'::uuid, 'Campeonato Nacional de Obediencia FCI 2024 · Campo de Fútbol Miguel Reina', 'Otro', '2024-03-09', 'Campo de Fútbol Miguel Reina', true),
  ('09fd3b9e-33a7-58f0-af34-32c2f834bac1'::uuid, 'Summer Camp Mondioring CEPPB · Granada', 'Otro', '2024-08-30', 'Granada', true),
  ('ecdec0d0-eeaa-54ab-8e56-7351535d15ea'::uuid, 'Examen y selección de figurantes IGP CEPPB, temporada 2024/25 · Prádena', 'Otro', '2024-09-07', 'Prádena', true),
  ('0b0f6f02-1024-571f-a7c4-089a45d64b6f'::uuid, 'Work Shop Agility Ricardo Martínez · Puerto Real', 'Otro', '2024-10-26', 'Puerto Real', true),
  ('cfb8273f-5d70-5dd8-a1e4-129ceee5ec50'::uuid, 'Especial Nacional de Cría CEPPB 2024 · Navarra', 'Especial de Cría', '2024-11-02', 'Navarra', true),
  ('40963a0b-324c-5b7b-afc4-8cfc0ffe345f'::uuid, 'Monográfica Castelldans · Castelldans', 'Concurso monográfico CEPPB', '2024-11-23', 'Castelldans', true),
  ('e6e4b922-1ae6-5771-a829-766d34f652c7'::uuid, 'Monográfica Palafrugell · Palafrugell', 'Concurso monográfico CEPPB', '2025-02-01', 'Palafrugell', true),
  ('cf3aa3ca-6b9c-5ba5-a629-8f14ff4643e7'::uuid, 'Campeonato Nacional de Mondioring 2025 · Palafrugell', 'CNM', '2025-02-01', 'Palafrugell', true),
  ('3fbbf954-9b13-5139-a37f-00a28f2a9a41'::uuid, 'Monográfica Pedro Bernardo · Pedro Bernardo', 'Concurso monográfico CEPPB', '2025-11-22', 'Pedro Bernardo', true),
  ('1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', 'CNM', '2026-02-07', 'Quer', true),
  ('afcd5f60-feb9-58c1-8f74-387dbd177069'::uuid, 'Especial Nacional de Cría CEPPB 2026 · Igea', 'Especial de Cría', '2026-10-24', 'Igea', true)
on conflict (id) do update set
  nombre = excluded.nombre, tipo = excluded.tipo,
  fecha = coalesce(eventos.fecha, excluded.fecha),
  lugar = coalesce(eventos.lugar, excluded.lugar);

commit;

-- Comprobación: ningún evento repetido el mismo día y sitio
select fecha, lugar, count(*) from eventos
group by 1, 2 having count(*) > 1;
