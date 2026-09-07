-- ============================================================
--  Especial Nacional de Cría CEPPB 2025 · Igea
--  30 ejemplares · juez: Elena Viñolo
--
--  Exposición de estructura organizada por el CEPPB. Estas
--  calificaciones SÍ cuentan para las figuras del Anexo A que
--  exigen prueba en evento propio del club.
--
--  Se puede ejecutar más de una vez sin duplicar nada.
-- ============================================================

begin;

-- 0. La clase en la que se presentó el ejemplar: junior,
--    intermedia, abierta, trabajo, campeones, veteranos.
alter table resultados add column if not exists clase text;

-- 1. Fuera el duplicado: al importarlo la primera vez aún no se
--    sabía de qué evento del club era, y entró con otro nombre.
delete from resultados where evento_id = '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid;
delete from eventos where id = '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid;

-- 2. El concurso
insert into eventos (id, nombre, tipo, fecha, lugar, juez, organizado_ceppb)
values ('a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', 'Especial de Cría', '2025-11-08', 'Igea (La Rioja)', 'Elena Viñolo', true)
on conflict (id) do update set
  nombre = excluded.nombre, tipo = excluded.tipo,
  lugar = excluded.lugar, juez = excluded.juez,
  fecha = coalesce(excluded.fecha, eventos.fecha),
  organizado_ceppb = true;

-- 3. Los ejemplares.
--    Lo que ya conste en el libro manda: de aquí sólo se
--    completa lo que estuviera en blanco.
insert into perros (id, nombre, sexo, variedad, loe, chip, fecha_nacimiento, origen, visibilidad) values
  ('ab796842-39f3-5e86-a61d-718aab20eddc'::uuid, 'Zeus de las Condovanas', 'M', 'Groenendael', 'LOE 2748588', null, '2025-01-01', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('e339a3ab-c3e6-57a4-9316-62348b3a9b4c'::uuid, 'Xaloc de Belliamici', 'M', 'Groenendael', 'LOE 2707065', '941010001214592', '2023-12-25', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('d8d119f0-62bc-5bf6-9332-65bd551c2382'::uuid, 'Thor de Ancano', 'M', 'Groenendael', 'LOE 2457064', '941000022765228', '2019-03-02', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('07480635-abf8-50f5-b090-db1a38266faa'::uuid, 'Orion de Belliamici', 'M', 'Groenendael', 'LOE 2219927', '941000016319526', '2014-09-12', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('e25d53dd-c795-5317-b984-43fc912b7b2c'::uuid, 'Xenia de Belliamici', 'H', 'Groenendael', 'LOE 2707066', '941010001197237', '2023-12-25', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('680684e9-0659-541c-9557-7a715baf3962'::uuid, 'Vendetta de Perles Noires', 'H', 'Groenendael', null, '250269591033474', '2024-04-17', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('fe6de016-0552-5e23-b143-626a0d8a037c'::uuid, 'Vinka-G di Torre D’aresse', 'H', 'Groenendael', 'LOE 2732399', '380260160428332', '2024-04-19', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('bbca93c7-352c-5f06-8096-fb121f463cda'::uuid, 'Alhambra-G del Colle Ombroso', 'H', 'Groenendael', 'LOE 2618704', '380260044719098', '2022-10-01', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('26a30dc4-9204-5880-9c9c-95d5857c0fae'::uuid, 'Vennus de la Dynastie des Cheyennes', 'H', 'Groenendael', 'LOE 2741566', '250268781081887', '2024-01-07', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('ebf9a306-c9db-5612-8f88-5fe297bcc4cf'::uuid, 'Hamilton de Viña Indomita', 'M', 'Laekenois', 'LOE 2748041', '991001006281943', '2024-03-14', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('c55f6ad4-8c35-5bbf-bad4-c397505078bd'::uuid, 'Yoda de Il Vecchio Mulino', 'H', 'Laekenois', 'LOE 2718066', '992000003768481', '2024-03-14', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('13b40adc-39ae-5757-a09c-eafa749f8e11'::uuid, 'Savannah Sunrise D´eroudur', 'H', 'Laekenois', 'LOE 2487690', null, '2019-06-15', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('3c881de4-d910-571c-96ff-6d70be9b0fc3'::uuid, 'Txakur-Bai Ro-Miko', 'M', 'Malinois', 'LOE 2620621', '985113006167986', '2021-08-14', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('a57f3b7a-7db1-5c48-8c94-caa232d2bdae'::uuid, 'Txakur-Bai Kmtina', 'H', 'Malinois', 'LOE 2743723', '992000004133551', '2024-12-18', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('106c86f6-3804-58e0-b426-1a7c823f6680'::uuid, 'Zeus de Lacanin de As', 'M', 'Tervueren', 'LOE 2755766', null, '2025-07-17', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('a7a5ebf1-1c1e-5244-9b90-a361a4da344c'::uuid, 'Leyenda del Segadal', 'H', 'Tervueren', null, '941000030128176', '2025-04-14', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('25d1316a-2688-559c-97c6-705411aefffe'::uuid, 'Y-Zarco de Lacanin de As', 'M', 'Tervueren', 'LOE 2729029', '941000030161702', '2024-09-16', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('e27c8465-68be-594f-9dbf-819540bf0ae8'::uuid, 'Ebano del Segadal', 'M', 'Tervueren', 'LOE 271762', '941010001502597', '2024-03-02', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('ff47aeb0-d933-502b-892b-7e14ef92ef2c'::uuid, 'Matylda ‘ S Turron', 'M', 'Tervueren', 'LOE 2460582', '941000023592084', '2019-03-26', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('72ed776e-31d9-58b5-9b22-80f91132959f'::uuid, 'Urko de Lacanin de As', 'M', 'Tervueren', 'LOE 2565346', '941000026380354', '2020-12-25', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('b740b701-1945-5cf9-9d7b-3b4ad6b4b801'::uuid, 'Yala de Lacanin de As', 'H', 'Tervueren', 'LOE 2729031', '941000030161470', '2024-09-16', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('c63654fd-2426-54b8-bb9a-fb61e4e1741f'::uuid, 'Yaira de Lacanin de As', 'H', 'Tervueren', 'LOE 2729030', '941000030161469', '2024-09-16', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('12d6150f-6639-5364-ac5f-184c2c685e80'::uuid, 'Arabella du Bois du Tot', 'H', 'Tervueren', null, '250268600456216', '2025-01-15', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('4873c434-7317-5585-88ca-d43604c2fd4b'::uuid, 'Deedee del Segadal', 'H', 'Tervueren', 'LOE 2691615', '978101084269756', '2023-06-17', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('6412f88f-4ec8-5988-98a1-37216369053a'::uuid, 'Duna del Clamiu', 'H', 'Tervueren', 'LOE 2688326', '992000002905135', '2023-05-01', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('e6abf182-046f-54d4-a23a-cfedd0f155be'::uuid, 'Matyldas Damasco', 'H', 'Tervueren', 'LOE 2667779', '941010000569822', '2023-03-03', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('289a0b71-c925-5014-93d4-73eaefb6a687'::uuid, 'Uma de Lacanin de As', 'H', 'Tervueren', 'LOE 2565343', '941000026380357', '2020-12-25', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('e8b24754-2aa8-5d5b-aeaa-3cf2db5a54a4'::uuid, 'Siboney del Segadal', 'H', 'Tervueren', 'LOE 2453044', '941000023372710', '2018-12-20', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('b7675889-2e0b-525b-8f33-e8c2274b1027'::uuid, 'Quelia del Clamiu', 'H', 'Tervueren', 'LOE 2317281', '941000019341903', '2016-07-15', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios'),
  ('804e28fd-ba60-517b-8ca8-a8d0f7ec7925'::uuid, 'Aris', 'H', 'Tervueren', 'LOE 2317281', '941000018548814', '2016-07-15', 'Especial Nacional de Cría CEPPB 2025 · Igea', 'socios')
on conflict (id) do update set
  sexo = coalesce(perros.sexo, excluded.sexo),
  variedad = coalesce(perros.variedad, excluded.variedad),
  loe = coalesce(perros.loe, excluded.loe),
  chip = coalesce(perros.chip, excluded.chip),
  fecha_nacimiento = coalesce(perros.fecha_nacimiento, excluded.fecha_nacimiento),
  origen = coalesce(perros.origen, excluded.origen);

-- 4. Las calificaciones.
--    Entran validadas: es el acta del juez del propio club.
alter table resultados disable trigger trg_proteger_resultado;

insert into resultados (id, perro_id, tipo, evento_id, evento, fecha, anio, tipo_evento, organizado_ceppb, juez, clase, calificacion, calificacion_origen, puesto, distincion, titulo, validado, validado_por) values
  ('48fb8929-160b-5e2d-a5dd-226cd1b5c19f'::uuid, 'ab796842-39f3-5e86-a61d-718aab20eddc'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, 'BOB', 'CCJ · MJ', 'validado', 'pres.ceppb@gmail.com'),
  ('db0bee43-6c21-58ee-ae46-d9a2a0da4122'::uuid, 'e339a3ab-c3e6-57a4-9316-62348b3a9b4c'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('1d924ebd-e318-5baa-8c50-1d6e4ce7e3e0'::uuid, 'd8d119f0-62bc-5bf6-9332-65bd551c2382'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('f06b4916-fec9-504e-811e-70165a0a43d3'::uuid, '07480635-abf8-50f5-b090-db1a38266faa'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'VETERANOS', 'EXC', 'EXC', 1, null, 'CCV', 'validado', 'pres.ceppb@gmail.com'),
  ('93248648-c41d-5169-b3db-9e6e9eb73c63'::uuid, 'e25d53dd-c795-5317-b984-43fc912b7b2c'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 3, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('459666d3-fa27-5351-8800-1bc01051f065'::uuid, '680684e9-0659-541c-9557-7a715baf3962'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 1, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('86347877-e9c8-5a57-ad90-f3e5ed98d4db'::uuid, 'fe6de016-0552-5e23-b143-626a0d8a037c'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 2, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('94ecdb78-33ee-5bdf-854a-dbf88dcf8e6f'::uuid, 'bbca93c7-352c-5f06-8096-fb121f463cda'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('b7e27268-a1f4-52b5-abf1-14ef1a0c01ba'::uuid, '26a30dc4-9204-5880-9c9c-95d5857c0fae'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('afd9a434-3fdf-55c8-8517-d17f06354473'::uuid, 'ebf9a306-c9db-5612-8f88-5fe297bcc4cf'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('5d5c3617-7d3a-5c8c-a2e8-4e8c87c16b59'::uuid, 'c55f6ad4-8c35-5bbf-bad4-c397505078bd'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 2, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('f61ebf38-1995-56e6-9d3f-8ead82c01da0'::uuid, '13b40adc-39ae-5757-a09c-eafa749f8e11'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('40cd10f3-08b4-536b-8338-284c597b2684'::uuid, '3c881de4-d910-571c-96ff-6d70be9b0fc3'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'TRABAJO', 'MB', 'MB', null, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('25c7ca0e-ac74-5531-8644-c8f677285ef1'::uuid, 'a57f3b7a-7db1-5c48-8c94-caa232d2bdae'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, 'BOB', 'CCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('387dba4e-0a65-5254-b6f3-7caf604bb1c2'::uuid, '106c86f6-3804-58e0-b426-1a7c823f6680'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'MUY CACHORRO', null, 'MP', 1, null, 'MMC · MMG', 'validado', 'pres.ceppb@gmail.com'),
  ('e950170b-1b28-5681-8ee6-e7342a60d0d2'::uuid, 'a7a5ebf1-1c1e-5244-9b90-a361a4da344c'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'CACHORRO', null, 'MP', 1, null, 'MC', 'validado', 'pres.ceppb@gmail.com'),
  ('075e4824-7472-5ee8-8e4e-bef8ae035295'::uuid, '25d1316a-2688-559c-97c6-705411aefffe'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, null, 'CCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('2b8bac14-f7a6-5e3e-ac7b-27d4642495de'::uuid, 'e27c8465-68be-594f-9dbf-819540bf0ae8'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('0871283d-b103-5a77-a70d-bb6ed7399881'::uuid, 'ff47aeb0-d933-502b-892b-7e14ef92ef2c'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('7cf70d94-f2d0-531d-a147-76fffa700b19'::uuid, '72ed776e-31d9-58b5-9b22-80f91132959f'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, 'Rappel CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('d39b6882-b65f-5304-a0a7-1fd19038494e'::uuid, 'b740b701-1945-5cf9-9d7b-3b4ad6b4b801'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 2, null, 'RCCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('2a295bd5-9f93-5425-a936-1b5cf4932d22'::uuid, 'c63654fd-2426-54b8-bb9a-fb61e4e1741f'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, null, 'CCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('d9fc93c8-9a8c-569a-ba64-f6dea3e6b468'::uuid, '12d6150f-6639-5364-ac5f-184c2c685e80'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 3, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('558a37a1-4339-5140-921a-ac0ce72143ae'::uuid, '4873c434-7317-5585-88ca-d43604c2fd4b'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('70412d09-1d4c-5827-a599-414619e2bc2b'::uuid, '6412f88f-4ec8-5988-98a1-37216369053a'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 3, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('0c5b9e2f-a27b-51f7-9377-c3587c28c5f4'::uuid, 'e6abf182-046f-54d4-a23a-cfedd0f155be'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 2, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('6567306a-45d8-5b1f-adf7-449ddd24778e'::uuid, '289a0b71-c925-5014-93d4-73eaefb6a687'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 2, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('c174365d-4ca8-54f5-ba98-264ec66df8f5'::uuid, 'e8b24754-2aa8-5d5b-aeaa-3cf2db5a54a4'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, 'Rappel CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('15f15f36-dde5-5dfa-a675-84816f55800c'::uuid, 'b7675889-2e0b-525b-8f33-e8c2274b1027'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'VETERANOS', 'EXC', 'EXC', 2, null, 'RCCV', 'validado', 'pres.ceppb@gmail.com'),
  ('361787df-6403-5a03-9691-c115f5459ec5'::uuid, '804e28fd-ba60-517b-8ca8-a8d0f7ec7925'::uuid, 'estructura', 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid, 'Especial Nacional de Cría CEPPB 2025 · Igea', '2025-11-08', 2025, 'Especial de Cría', true, 'Elena Viñolo', 'VETERANOS', 'EXC', 'EXC', 1, null, 'CCV · MV', 'validado', 'pres.ceppb@gmail.com')
on conflict (id) do update set
  calificacion = excluded.calificacion,
  calificacion_origen = excluded.calificacion_origen,
  puesto = excluded.puesto,
  distincion = excluded.distincion,
  titulo = excluded.titulo,
  clase = excluded.clase,
  juez = excluded.juez,
  fecha = coalesce(excluded.fecha, resultados.fecha),
  validado = 'validado';

alter table resultados enable trigger trg_proteger_resultado;

commit;

-- Comprobación
select count(*) filter (where tipo = 'estructura') as calificaciones,
       count(*) filter (where distincion = 'CAC') as caces,
       count(distinct perro_id) as ejemplares
from resultados where evento_id = 'a866144e-e190-58ee-ab5a-78fe2e667f53'::uuid;
