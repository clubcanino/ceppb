-- ============================================================
--  Monográfica Nacional del Perro Pastor Belga 2025 · Igea
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

-- 1. El concurso
insert into eventos (id, nombre, tipo, fecha, lugar, juez, organizado_ceppb)
values ('2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'Concurso monográfico CEPPB', null, 'Igea (La Rioja)', 'Elena Viñolo', true)
on conflict (id) do update set
  nombre = excluded.nombre, tipo = excluded.tipo,
  lugar = excluded.lugar, juez = excluded.juez,
  fecha = coalesce(excluded.fecha, eventos.fecha),
  organizado_ceppb = true;

-- 2. Los ejemplares.
--    Lo que ya conste en el libro manda: de aquí sólo se
--    completa lo que estuviera en blanco.
insert into perros (id, nombre, sexo, variedad, loe, chip, fecha_nacimiento, origen, visibilidad) values
  ('ab796842-39f3-5e86-a61d-718aab20eddc'::uuid, 'Zeus de las Condovanas', 'M', 'Groenendael', 'LOE 2748588', null, '2025-01-01', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('e339a3ab-c3e6-57a4-9316-62348b3a9b4c'::uuid, 'Xaloc de Belliamici', 'M', 'Groenendael', 'LOE 2707065', '941010001214592', '2023-12-25', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('d8d119f0-62bc-5bf6-9332-65bd551c2382'::uuid, 'Thor de Ancano', 'M', 'Groenendael', 'LOE 2457064', '941000022765228', '2019-03-02', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('07480635-abf8-50f5-b090-db1a38266faa'::uuid, 'Orion de Belliamici', 'M', 'Groenendael', 'LOE 2219927', '941000016319526', '2014-09-12', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('e25d53dd-c795-5317-b984-43fc912b7b2c'::uuid, 'Xenia de Belliamici', 'H', 'Groenendael', 'LOE 2707066', '941010001197237', '2023-12-25', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('680684e9-0659-541c-9557-7a715baf3962'::uuid, 'Vendetta de Perles Noires', 'H', 'Groenendael', null, '250269591033474', '2024-04-17', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('fe6de016-0552-5e23-b143-626a0d8a037c'::uuid, 'Vinka-G di Torre D’aresse', 'H', 'Groenendael', 'LOE 2732399', '380260160428332', '2024-04-19', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('bbca93c7-352c-5f06-8096-fb121f463cda'::uuid, 'Alhambra-G del Colle Ombroso', 'H', 'Groenendael', 'LOE 2618704', '380260044719098', '2022-10-01', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('26a30dc4-9204-5880-9c9c-95d5857c0fae'::uuid, 'Vennus de la Dynastie des Cheyennes', 'H', 'Groenendael', 'LOE 2741566', '250268781081887', '2024-01-07', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('ebf9a306-c9db-5612-8f88-5fe297bcc4cf'::uuid, 'Hamilton de Viña Indomita', 'M', 'Laekenois', 'LOE 2748041', '991001006281943', '2024-03-14', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('c55f6ad4-8c35-5bbf-bad4-c397505078bd'::uuid, 'Yoda de Il Vecchio Mulino', 'H', 'Laekenois', 'LOE 2718066', '992000003768481', '2024-03-14', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('13b40adc-39ae-5757-a09c-eafa749f8e11'::uuid, 'Savannah Sunrise D´eroudur', 'H', 'Laekenois', 'LOE 2487690', null, '2019-06-15', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('3c881de4-d910-571c-96ff-6d70be9b0fc3'::uuid, 'Txakur-Bai Ro-Miko', 'M', 'Malinois', 'LOE 2620621', '985113006167986', '2021-08-14', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('a57f3b7a-7db1-5c48-8c94-caa232d2bdae'::uuid, 'Txakur-Bai Kmtina', 'H', 'Malinois', 'LOE 2743723', '992000004133551', '2024-12-18', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('106c86f6-3804-58e0-b426-1a7c823f6680'::uuid, 'Zeus de Lacanin de As', 'M', 'Tervueren', 'LOE 2755766', null, '2025-07-17', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('a7a5ebf1-1c1e-5244-9b90-a361a4da344c'::uuid, 'Leyenda del Segadal', 'H', 'Tervueren', null, '941000030128176', '2025-04-14', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('25d1316a-2688-559c-97c6-705411aefffe'::uuid, 'Y-Zarco de Lacanin de As', 'M', 'Tervueren', 'LOE 2729029', '941000030161702', '2024-09-16', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('e27c8465-68be-594f-9dbf-819540bf0ae8'::uuid, 'Ebano del Segadal', 'M', 'Tervueren', 'LOE 271762', '941010001502597', '2024-03-02', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('ff47aeb0-d933-502b-892b-7e14ef92ef2c'::uuid, 'Matylda ‘ S Turron', 'M', 'Tervueren', 'LOE 2460582', '941000023592084', '2019-03-26', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('72ed776e-31d9-58b5-9b22-80f91132959f'::uuid, 'Urko de Lacanin de As', 'M', 'Tervueren', 'LOE 2565346', '941000026380354', '2020-12-25', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('b740b701-1945-5cf9-9d7b-3b4ad6b4b801'::uuid, 'Yala de Lacanin de As', 'H', 'Tervueren', 'LOE 2729031', '941000030161470', '2024-09-16', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('c63654fd-2426-54b8-bb9a-fb61e4e1741f'::uuid, 'Yaira de Lacanin de As', 'H', 'Tervueren', 'LOE 2729030', '941000030161469', '2024-09-16', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('12d6150f-6639-5364-ac5f-184c2c685e80'::uuid, 'Arabella du Bois du Tot', 'H', 'Tervueren', null, '250268600456216', '2025-01-15', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('4873c434-7317-5585-88ca-d43604c2fd4b'::uuid, 'Deedee del Segadal', 'H', 'Tervueren', 'LOE 2691615', '978101084269756', '2023-06-17', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('6412f88f-4ec8-5988-98a1-37216369053a'::uuid, 'Duna del Clamiu', 'H', 'Tervueren', 'LOE 2688326', '992000002905135', '2023-05-01', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('e6abf182-046f-54d4-a23a-cfedd0f155be'::uuid, 'Matyldas Damasco', 'H', 'Tervueren', 'LOE 2667779', '941010000569822', '2023-03-03', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('289a0b71-c925-5014-93d4-73eaefb6a687'::uuid, 'Uma de Lacanin de As', 'H', 'Tervueren', 'LOE 2565343', '941000026380357', '2020-12-25', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('e8b24754-2aa8-5d5b-aeaa-3cf2db5a54a4'::uuid, 'Siboney del Segadal', 'H', 'Tervueren', 'LOE 2453044', '941000023372710', '2018-12-20', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('b7675889-2e0b-525b-8f33-e8c2274b1027'::uuid, 'Quelia del Clamiu', 'H', 'Tervueren', 'LOE 2317281', '941000019341903', '2016-07-15', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios'),
  ('804e28fd-ba60-517b-8ca8-a8d0f7ec7925'::uuid, 'Aris', 'H', 'Tervueren', 'LOE 2317281', '941000018548814', '2016-07-15', 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', 'socios')
on conflict (id) do update set
  sexo = coalesce(perros.sexo, excluded.sexo),
  variedad = coalesce(perros.variedad, excluded.variedad),
  loe = coalesce(perros.loe, excluded.loe),
  chip = coalesce(perros.chip, excluded.chip),
  fecha_nacimiento = coalesce(perros.fecha_nacimiento, excluded.fecha_nacimiento),
  origen = coalesce(perros.origen, excluded.origen);

-- 3. Las calificaciones.
--    Entran validadas: es el acta del juez del propio club.
alter table resultados disable trigger trg_proteger_resultado;

insert into resultados (id, perro_id, tipo, evento_id, evento, fecha, anio, tipo_evento, organizado_ceppb, juez, clase, calificacion, calificacion_origen, puesto, distincion, titulo, validado, validado_por) values
  ('e0d79231-b3e2-537b-aca6-1a875e83e62b'::uuid, 'ab796842-39f3-5e86-a61d-718aab20eddc'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, 'BOB', 'CCJ · MJ', 'validado', 'pres.ceppb@gmail.com'),
  ('dcb7a0d7-d107-55c6-94ac-97f83e006a13'::uuid, 'e339a3ab-c3e6-57a4-9316-62348b3a9b4c'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('ff311506-d11e-5d01-91db-8c7e20bd0116'::uuid, 'd8d119f0-62bc-5bf6-9332-65bd551c2382'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('4e6dbd01-c985-5870-abc8-fbf0997d7119'::uuid, '07480635-abf8-50f5-b090-db1a38266faa'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'VETERANOS', 'EXC', 'EXC', 1, null, 'CCV', 'validado', 'pres.ceppb@gmail.com'),
  ('ba5582fb-fe7f-59f8-9a17-33e3c3040a3c'::uuid, 'e25d53dd-c795-5317-b984-43fc912b7b2c'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 3, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('9bb79f55-e9b1-54e3-b987-51ae5cd74475'::uuid, '680684e9-0659-541c-9557-7a715baf3962'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 1, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('9469c9db-a63a-57a1-8172-17ab5bc57b75'::uuid, 'fe6de016-0552-5e23-b143-626a0d8a037c'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 2, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('1c41744c-569e-5bfa-bf00-8156de3113c5'::uuid, 'bbca93c7-352c-5f06-8096-fb121f463cda'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('ed4f0b0f-fbbd-542c-ab74-43689965aa26'::uuid, '26a30dc4-9204-5880-9c9c-95d5857c0fae'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('377a54c2-e80c-582a-bc53-4bdc415f7f44'::uuid, 'ebf9a306-c9db-5612-8f88-5fe297bcc4cf'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('b7ac417a-08bb-57cb-a493-c409d070e952'::uuid, 'c55f6ad4-8c35-5bbf-bad4-c397505078bd'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 2, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('fc6dd188-3e08-5e3b-89d1-012cf8ef8b10'::uuid, '13b40adc-39ae-5757-a09c-eafa749f8e11'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('63581e5e-2eab-581e-9748-a7aef3b68e3f'::uuid, '3c881de4-d910-571c-96ff-6d70be9b0fc3'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'TRABAJO', 'MB', 'MB', null, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('1937a488-77ff-5904-92f0-f59f045f6680'::uuid, 'a57f3b7a-7db1-5c48-8c94-caa232d2bdae'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, 'BOB', 'CCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('88532110-d662-5d22-9e98-c842e2affaaa'::uuid, '106c86f6-3804-58e0-b426-1a7c823f6680'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'MUY CACHORRO', null, 'MP', 1, null, 'MMC · MMG', 'validado', 'pres.ceppb@gmail.com'),
  ('06553697-cc6c-5fe2-8dd5-76913174a914'::uuid, 'a7a5ebf1-1c1e-5244-9b90-a361a4da344c'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'CACHORRO', null, 'MP', 1, null, 'MC', 'validado', 'pres.ceppb@gmail.com'),
  ('2f9dab46-51f3-527d-819b-a1d15194fe40'::uuid, '25d1316a-2688-559c-97c6-705411aefffe'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, null, 'CCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('6037e18f-b3b1-5eb1-b874-4747e08eaf6d'::uuid, 'e27c8465-68be-594f-9dbf-819540bf0ae8'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'INTERMEDIA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('fb4484ce-13df-5921-b46d-5783761b13cc'::uuid, 'ff47aeb0-d933-502b-892b-7e14ef92ef2c'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('aee086f4-b5a1-597c-95a4-869b6c828901'::uuid, '72ed776e-31d9-58b5-9b22-80f91132959f'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, 'Rappel CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('778048a3-9e93-5e31-87c5-0366e438d0bf'::uuid, 'b740b701-1945-5cf9-9d7b-3b4ad6b4b801'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 2, null, 'RCCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('297270e1-f5bc-556b-bbb2-97e32aaeeb8b'::uuid, 'c63654fd-2426-54b8-bb9a-fb61e4e1741f'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 1, null, 'CCJ', 'validado', 'pres.ceppb@gmail.com'),
  ('8bac92cb-24d9-5937-a2d5-3152d6207c62'::uuid, '12d6150f-6639-5364-ac5f-184c2c685e80'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'JUNIOR', 'EXC', 'EXC', 3, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('3f6bf9cd-5cfd-5cb1-b396-5a56b46e1c8f'::uuid, '4873c434-7317-5585-88ca-d43604c2fd4b'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 1, 'CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('abe3f763-8316-5d03-b31d-5a2ebabe4a24'::uuid, '6412f88f-4ec8-5988-98a1-37216369053a'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 3, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('f0e22fe5-8392-5c8d-9538-ab8de1bb0f3f'::uuid, 'e6abf182-046f-54d4-a23a-cfedd0f155be'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'ABIERTA', 'EXC', 'EXC', 2, 'RCAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('5cee9990-883a-5e7f-8498-cb49611d2f03'::uuid, '289a0b71-c925-5014-93d4-73eaefb6a687'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 2, null, null, 'validado', 'pres.ceppb@gmail.com'),
  ('a31cccc5-4cb7-5a28-8b5d-970ee7e8be5b'::uuid, 'e8b24754-2aa8-5d5b-aeaa-3cf2db5a54a4'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'CAMPEONES', 'EXC', 'EXC', 1, 'Rappel CAC', null, 'validado', 'pres.ceppb@gmail.com'),
  ('3ff3de8b-0824-5d43-87a2-185b7028bcab'::uuid, 'b7675889-2e0b-525b-8f33-e8c2274b1027'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'VETERANOS', 'EXC', 'EXC', 2, null, 'RCCV', 'validado', 'pres.ceppb@gmail.com'),
  ('f025d4f3-e8f0-590f-b94c-7b4ae753246d'::uuid, '804e28fd-ba60-517b-8ca8-a8d0f7ec7925'::uuid, 'estructura', '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid, 'Monográfica Nacional del Perro Pastor Belga 2025 · Igea', null, 2025, 'Concurso monográfico CEPPB', true, 'Elena Viñolo', 'VETERANOS', 'EXC', 'EXC', 1, null, 'CCV · MV', 'validado', 'pres.ceppb@gmail.com')
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
from resultados where evento_id = '2208f7dc-7b4d-5122-8605-9120817a9d7e'::uuid;
