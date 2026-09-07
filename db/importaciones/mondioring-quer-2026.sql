-- ============================================================
--  Campeonato Nacional de Mondioring 2026 · Quer
--  2026-02-07 y 2026-02-08 · jueces: Antonio Crava · David Vargas Fernández
--  30 participaciones en tres grados
--
--  Actas oficiales de la RSCE, firmadas por los jueces y por el
--  club. Cada grado puntúa sobre un máximo distinto: 200, 300
--  y 400. Por eso cada resultado guarda sobre cuánto va.
--
--  NO se otorga aquí el título MR1, MR2 ni MR3: el acta da los
--  puntos, no si se alcanzó el título, y de eso dependen los
--  aptos de cría de utilidad. Lo pone la junta.
-- ============================================================

begin;

-- 0. Medio punto existe en mondioring: 247,5 no es 247 ni 248.
alter table resultados alter column puntos type numeric(6,1);
-- El grupo de trabajo con el que compite cada guía.
alter table resultados add column if not exists equipo text;

-- 1. El campeonato, que ya estaba en el calendario sin jueces.
update eventos set juez = 'Antonio Crava · David Vargas Fernández',
                   lugar = 'Quer (Guadalajara)',
                   fecha = coalesce(fecha, '2026-02-07'::date)
  where id = '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid;
insert into eventos (id, nombre, tipo, fecha, lugar, juez, organizado_ceppb)
select '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', 'CNM', '2026-02-07', 'Quer (Guadalajara)', 'Antonio Crava · David Vargas Fernández', true
where not exists (select 1 from eventos where id = '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid);

-- 2. Los ejemplares. Lo que ya conste en el libro manda.
insert into perros (id, nombre, variedad, loe, chip, origen, visibilidad) values
  ('c09e13ab-d471-5618-ac9d-fcd7cd0b920e'::uuid, 'Vida de Duques Negros', 'Malinois', 'LOE 2760987', '620098201341133', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('8c168e02-e392-53ad-9278-e79b4ccc9f3b'::uuid, 'Río', 'Malinois', 'RRC 0198323', '941010000662851', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('81fc112d-378a-5b22-82d6-d4c2fb1aa2fa'::uuid, 'Ron des Deux Sabres', 'Malinois', 'LOE 2714221', '250269300134702', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('adc5ca14-36f4-51aa-91d7-8fa68c6e639e'::uuid, 'Sirius', 'Malinois', 'RRC 0195156', '992000001041334', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('e3d5a8d8-a485-5ea5-bed4-42b66fa42e46'::uuid, 'Rhaegar de Alrasican', 'Malinois', 'LOE 2588052', '992000003744254', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('8f9ed7d3-37dc-5abb-af9d-f4fbf1cbfb47'::uuid, 'Noa de Secrica', 'Malinois', 'LOE 2668082', '620098102321771', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('f6434145-6f99-50d7-acf3-48baeba66ccf'::uuid, 'Nois', 'Malinois', 'RRC 0198415', '941000029411914', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('05f94694-8249-5f5b-b944-72b27a5e7da3'::uuid, 'Txakur-Bai Ntxistu', 'Malinois', 'LOE 2595648', '941000026627446', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('7661ccdf-8591-5523-88e7-013a0e04a4ac'::uuid, 'Zodiac Killer Versión Malinés', 'Malinois', 'LOE 2549976', '900113002402780', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('05961c80-8370-5227-ae06-a73a0662ae87'::uuid, 'Kafre de Chacalcan', 'Malinois', 'LOE 2626153', '992000001226865', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('5433f2fc-061f-5984-97da-730ef9b2d32f'::uuid, 'Boston', 'Malinois', 'LOE 2591423', '941000026607491', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('5fc0294b-a267-5018-9226-ae3e6da89dff'::uuid, 'Loki', 'Malinois', 'RRC 0194542', '528210006932088', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('7e47f32f-a4db-53c5-8899-1eecf1bb7501'::uuid, 'Txakur-Bai Rtsurtur', 'Malinois', 'LOE 2514852', '978101082006824', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('2d224d19-6a57-5060-96f7-3d67a5a87097'::uuid, 'Rex Miniaturas Granada', 'Malinois', 'LOE 2730868', '941000030675534', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('4d9b1b09-7fea-5800-bfad-7b368403b474'::uuid, 'Armani von Leiderschap', 'Malinois', 'LOE 2523106', '985113004160178', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('3e08873a-0a9c-52c2-ade0-6303e7399063'::uuid, 'Enzo de Alrasican', 'Malinois', 'LOE 2702961', '992000003270661', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('23f5e0f8-22f4-5fff-980f-fb94f34bb3cf'::uuid, 'Elton Canem du Fire', 'Malinois', 'RRC 0183173', '941000026503908', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('ecf362c2-6438-555e-a0d9-35d5b676f1b8'::uuid, 'Txakur-Bai Kg''dino', 'Malinois', 'LOE 2596886', '985113006179353', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('dcdb602f-4c2b-5c9f-8b83-b0a364a3aaf9'::uuid, 'Uma des Filii Cradle', 'Malinois', 'LOE 2726296', '620090000074932', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('26ca6860-5273-58ab-bf54-7ce213f80733'::uuid, 'Río de Miniaturas Granada', 'Malinois', 'LOE 2650046', '941010000524611', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('cbb3a94b-d90e-5801-af51-c38c1d4ac44d'::uuid, 'Domitila de Harás del Oeste', 'Malinois', 'RRC 0183692', '941000026505060', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('8e30e33c-d686-5770-97d4-40f8dc789f44'::uuid, 'Pandora I de Akilkan de Ditak', 'Malinois', 'LOE 2524734', '941000025401488', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('793ef8d0-5d99-5872-af83-5cb6544c6f06'::uuid, 'Tauro de los Guardianes', 'Malinois', 'LOE 2523283', '941000025360512', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('8c7454d4-3dc0-524a-b943-36e0eaebe17c'::uuid, 'B. Terrible de Bocadura', 'Malinois', 'LOE 2610808', '978101083934364', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('fad931c3-dbe2-5423-bf77-728371e03d3f'::uuid, 'A''río', 'Malinois', 'RRC 0176043', '941000025231545', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('5a2de36e-bd0d-5d29-9b56-849b583acc4b'::uuid, 'Zulú de Corralet', 'Malinois', 'LOE 2511969', '941000024845202', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('6280f107-c74a-5552-8a9f-a88fa0cf6ebb'::uuid, 'Ricard du Calvaire aux Acacias', 'Malinois', null, '925026850183359', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('823255de-69cc-561d-a235-1c1c6e34fa0d'::uuid, 'Odin Canem du Fire', 'Malinois', 'LOE 2728481', '992000001904612', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('3cb3bcbc-b298-5412-9136-c61f80fc3949'::uuid, 'Trooper D''hélitesport', 'Malinois', 'LOE 2639383', '941010000340708', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios'),
  ('99d6da77-536b-5258-95b4-af2171974cf2'::uuid, 'Ambar', 'Malinois', 'RRC 0176042', '985113003978217', 'Campeonato Nacional de Mondioring 2026 · Quer', 'socios')
on conflict (id) do update set
  variedad = coalesce(perros.variedad, excluded.variedad),
  loe = coalesce(perros.loe, excluded.loe),
  chip = coalesce(perros.chip, excluded.chip),
  origen = coalesce(perros.origen, excluded.origen);

-- 3. Las participaciones.
alter table resultados disable trigger trg_proteger_resultado;

insert into resultados (id, perro_id, tipo, evento_id, evento, fecha, anio, tipo_evento, organizado_ceppb, juez, clase, puesto, puntos, puntos_sobre, guia, equipo, validado, validado_por) values
  ('483a24a5-b9c3-57ef-b6d6-0b083f9636a4'::uuid, 'c09e13ab-d471-5618-ac9d-fcd7cd0b920e'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 1', 1, 193, 200, 'Francisco José Estévez Morales', 'Can Zafra', 'validado', 'pres.ceppb@gmail.com'),
  ('a2a888ed-20d9-5bdb-8727-bc35b045b79d'::uuid, '8c168e02-e392-53ad-9278-e79b4ccc9f3b'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 1', 2, 186, 200, 'Javier Escudero de Santos', 'Siete Flechas', 'validado', 'pres.ceppb@gmail.com'),
  ('63fa86cd-b8aa-5576-815c-a5cf921c2055'::uuid, '81fc112d-378a-5b22-82d6-d4c2fb1aa2fa'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 1', 3, 182, 200, 'Juan José García Ruiz', 'Lor-K9', 'validado', 'pres.ceppb@gmail.com'),
  ('31661d4b-f506-5f3b-bfd4-1edc294ac05a'::uuid, 'adc5ca14-36f4-51aa-91d7-8fa68c6e639e'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 1', 4, 165, 200, 'Abraham Palmero Romero', 'Unioncan', 'validado', 'pres.ceppb@gmail.com'),
  ('5f49bb12-bd4f-5ed7-82dc-050eb837c6fe'::uuid, 'e3d5a8d8-a485-5ea5-bed4-42b66fa42e46'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 1', 5, 74.5, 200, 'Alejandra Morato Aguilar', 'Kangú', 'validado', 'pres.ceppb@gmail.com'),
  ('055f48e3-6d6b-5eef-8b92-f88a028b50f0'::uuid, '8f9ed7d3-37dc-5abb-af9d-f4fbf1cbfb47'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 1', 6, 45.5, 200, 'Daniel Sobrino Pérez', 'Unioncan', 'validado', 'pres.ceppb@gmail.com'),
  ('6a7d3d17-3cda-5316-82cb-914322d23802'::uuid, 'f6434145-6f99-50d7-acf3-48baeba66ccf'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 1, 255, 300, 'Roberto Almohalla Fernández', 'Lupus Shadow', 'validado', 'pres.ceppb@gmail.com'),
  ('f2f725af-48de-50f9-bf01-f56d4194ef8e'::uuid, '05f94694-8249-5f5b-b944-72b27a5e7da3'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 2, 247.5, 300, 'Iñaki Olaeta Larrauri', 'Txakur-Bai', 'validado', 'pres.ceppb@gmail.com'),
  ('c88e7626-8593-5325-bdbf-dd35bcdee20f'::uuid, '7661ccdf-8591-5523-88e7-013a0e04a4ac'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 3, 232, 300, 'Joaquín Rodríguez Portela', 'Siete Flechas', 'validado', 'pres.ceppb@gmail.com'),
  ('53150c97-5256-5d2d-9f59-042fec2ab59a'::uuid, '05961c80-8370-5227-ae06-a73a0662ae87'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 4, 207.5, 300, 'Rubén Acosta de Haro', 'Chacalcan', 'validado', 'pres.ceppb@gmail.com'),
  ('c7e8970c-f456-53d4-8f27-9a2f6122180b'::uuid, '5433f2fc-061f-5984-97da-730ef9b2d32f'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 5, 207, 300, 'José Antonio Núñez López', 'Canem du Fire', 'validado', 'pres.ceppb@gmail.com'),
  ('925fed67-c26e-5aa7-b0fe-6b7b6b77b9cc'::uuid, '5fc0294b-a267-5018-9226-ae3e6da89dff'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 6, 202.5, 300, 'Giorgia Ossola', 'Evolución 83''', 'validado', 'pres.ceppb@gmail.com'),
  ('05969893-4551-5ff9-9bdc-2c0a18963079'::uuid, '7e47f32f-a4db-53c5-8899-1eecf1bb7501'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', 7, 161, 300, 'Eneko Etxebarria Goikoetxea', 'Txakur-Bai', 'validado', 'pres.ceppb@gmail.com'),
  ('9edc5fad-4dd5-522a-91ae-858d19bf45c5'::uuid, '2d224d19-6a57-5060-96f7-3d67a5a87097'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 2', null, null, 300, 'Juan Antonio Urbano Rodríguez', 'MG', 'validado', 'pres.ceppb@gmail.com'),
  ('6b2c5d61-9908-5927-92b8-455adfe86205'::uuid, '4d9b1b09-7fea-5800-bfad-7b368403b474'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 264, 400, 'Yanira Stratermans Bisan-Etame', 'Canem du Fire', 'validado', 'pres.ceppb@gmail.com'),
  ('e5efd006-818f-50a1-96ee-ec659ce5854f'::uuid, '3e08873a-0a9c-52c2-ade0-6303e7399063'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 228.5, 400, 'Víctor Luján Rueda Fagúndez', 'Siete Flechas', 'validado', 'pres.ceppb@gmail.com'),
  ('c487cb57-5b52-591d-80ed-1029d3b7065e'::uuid, '23f5e0f8-22f4-5fff-980f-fb94f34bb3cf'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 287, 400, 'Ramón Jorge Ortega Delgado', 'Bocallena', 'validado', 'pres.ceppb@gmail.com'),
  ('4b3c9471-b003-5d41-b9c0-d4a2452843b6'::uuid, 'ecf362c2-6438-555e-a0d9-35d5b676f1b8'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 300, 400, 'Mihai Razvan Ciotina', 'Kalekan', 'validado', 'pres.ceppb@gmail.com'),
  ('c23a0572-4fee-5127-9b8a-4e09ce132029'::uuid, 'dcdb602f-4c2b-5c9f-8b83-b0a364a3aaf9'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 357.5, 400, 'Juan Francisco Sánchez Rodal', 'Unioncan', 'validado', 'pres.ceppb@gmail.com'),
  ('0966493d-dcb7-54b8-b3d0-b39db1157624'::uuid, '26ca6860-5273-58ab-bf54-7ce213f80733'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 328.5, 400, 'Juan Antonio Urbano Rodríguez', 'MG', 'validado', 'pres.ceppb@gmail.com'),
  ('8731866f-d573-5a86-aeed-3dbbd6297b8f'::uuid, 'cbb3a94b-d90e-5801-af51-c38c1d4ac44d'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 262.5, 400, 'Juan Navarro Pajares', 'Canem du Fire', 'validado', 'pres.ceppb@gmail.com'),
  ('3d1f3386-3be6-551b-8d33-e02ac5c0c7c0'::uuid, '8e30e33c-d686-5770-97d4-40f8dc789f44'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 176, 400, 'José Amezcua Hervás', 'MG', 'validado', 'pres.ceppb@gmail.com'),
  ('43560f38-c54f-5085-9d7d-46260ee6a446'::uuid, '793ef8d0-5d99-5872-af83-5cb6544c6f06'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 250, 400, 'Janet Correa Dernoncourt', 'Los Guardianes', 'validado', 'pres.ceppb@gmail.com'),
  ('f45447fc-68f1-563c-986e-7915ae355de9'::uuid, '8c7454d4-3dc0-524a-b943-36e0eaebe17c'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 265, 400, 'Gabriel Gallego Arenas', 'Siete Flechas', 'validado', 'pres.ceppb@gmail.com'),
  ('e0699733-7337-53de-8803-0a6f88cf8a88'::uuid, 'fad931c3-dbe2-5423-bf77-728371e03d3f'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, null, 400, 'Fco. Javier Herrera Villanueva', 'Bocallena', 'validado', 'pres.ceppb@gmail.com'),
  ('c7a3ebdf-e992-5913-bc8b-b2a3f6bfba8a'::uuid, '5a2de36e-bd0d-5d29-9b56-849b583acc4b'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 232.5, 400, 'Francisco González Otero', 'Lor-K9', 'validado', 'pres.ceppb@gmail.com'),
  ('d8521941-f808-5f45-b443-9f377a6f3d38'::uuid, '6280f107-c74a-5552-8a9f-a88fa0cf6ebb'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 303.5, 400, 'Jean Marie Julien de Ville', 'Vinaros', 'validado', 'pres.ceppb@gmail.com'),
  ('9b021044-0bb6-58b3-8fb3-22bf27f092f4'::uuid, '823255de-69cc-561d-a235-1c1c6e34fa0d'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 308, 400, 'David Ramos Martínez', 'Canem du Fire', 'validado', 'pres.ceppb@gmail.com'),
  ('28919881-8e08-5f5d-9c18-01c6ed807f2e'::uuid, '3cb3bcbc-b298-5412-9136-c61f80fc3949'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 292, 400, 'Cristian del Río Rementería', 'Mond. Cantabria', 'validado', 'pres.ceppb@gmail.com'),
  ('7e73d79b-0988-519a-8c3b-140a3dbc4aa4'::uuid, '99d6da77-536b-5258-95b4-af2171974cf2'::uuid, 'trabajo', '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid, 'Campeonato Nacional de Mondioring 2026 · Quer', '2026-02-07', 2026, 'CNM', true, 'Antonio Crava · David Vargas Fernández', 'Mondioring grado 3', null, 296.5, 400, 'Albert Casaled Marcos', 'Kalekan', 'validado', 'pres.ceppb@gmail.com')
on conflict (id) do update set
  puesto = excluded.puesto, puntos = excluded.puntos,
  puntos_sobre = excluded.puntos_sobre, clase = excluded.clase,
  guia = excluded.guia, equipo = excluded.equipo,
  juez = excluded.juez, fecha = excluded.fecha,
  validado = 'validado';

alter table resultados enable trigger trg_proteger_resultado;

commit;

-- Comprobación
select clase, count(*), max(puntos) from resultados
 where evento_id = '1180714b-4eb2-57b9-b383-99efcdcfd3ab'::uuid group by 1 order by 1;
