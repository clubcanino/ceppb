-- ============================================================
--  Libro de Cría CEPPB — esquema y políticas de seguridad
--  Postgres / Supabase.  Aplicar en el editor SQL del proyecto.
--
--  Lo esencial de este archivo son las POLÍTICAS del final:
--  las reglas del club viven aquí, no en la pantalla.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- cuentas con permiso de junta directiva ----------
create table if not exists admins (
  email text primary key,
  nota  text,
  -- «presidencia» manda del todo; «gestion» hace el trabajo diario
  -- pero no toca esta lista ni nombra cargos del club.
  nivel text not null default 'gestion'
    check (nivel in ('presidencia', 'gestion')),
  creado timestamptz default now()
);
insert into admins (email, nota, nivel) values
  ('santiagodiazf@gmail.com', 'Presidencia', 'presidencia'),
  ('pres.ceppb@gmail.com',    'Cuenta de presidencia del club', 'presidencia'),
  ('tesoreria.ceppb@gmail.com','Tesorería', 'gestion')
on conflict (email) do nothing;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins a where lower(a.email) = lower(auth.jwt() ->> 'email'));
$$;

/* Quien manda del todo: la lista de administradores es la llave
   maestra, y los cargos del club los nombra la presidencia. */
create or replace function es_presidencia() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admins a
     where lower(a.email) = lower(auth.jwt() ->> 'email')
       and a.nivel = 'presidencia');
$$;

create or replace function es_socio() returns boolean
language sql stable as $$ select auth.uid() is not null; $$;

-- ---------- socios ----------
create table if not exists socios (
  id              uuid primary key default gen_random_uuid(),
  numero          integer unique not null,
  auth_user_id    uuid unique references auth.users(id) on delete set null,
  nombre          text not null,
  apellidos       text not null,
  nombre_completo text generated always as (nombre || ' ' || apellidos) stored,
  email           text,
  telefono        text,
  telefono2       text,
  poblacion       text,
  provincia       text,
  cp              text,
  pais            text default 'España',
  fecha_nacimiento date,
  profesion       text,
  bio             text,
  web             text,
  facebook        text,
  instagram       text,
  workingdog_perfil text,
  cuota           text,
  fecha_alta      date,
  fecha_baja      date,
  activo          boolean generated always as (fecha_baja is null) stored,
  socio_honor     boolean default false,
  -- cinofilia
  rsce_socio      boolean default false,
  rsce_numero     text,
  rsce_desde      date,
  afijo           text,
  afijo_fecha     date,
  es_criador      boolean generated always as (afijo is not null and afijo <> '') stored,
  grupo_trabajo   text,
  disciplinas     text[] default '{}',
  variedades      text[] default '{}',
  -- cargos: SÓLO los asigna la junta (ver trigger)
  roles           text[] default '{}',
  -- consentimiento
  perfil_publico  text default 'oculto' check (perfil_publico in ('oculto','socios','publico')),
  -- Que otros socios puedan escribirle desde la plataforma. Escribir a
  -- alguien no es ver sus datos: quien recibe no enseña ni su correo ni
  -- nada más que su nombre. Aun así, cada uno decide.
  acepta_mensajes boolean not null default true,
  priv            jsonb default '{}'::jsonb,
  avatar_url      text,
  idioma          text default 'es'
    check (idioma in ('es','ca','va','gl','eu','en','fr','de')),
  notas           text,          -- notas internas de secretaría
  creado          timestamptz default now()
);
create index if not exists socios_numero_idx   on socios(numero);
create index if not exists socios_email_idx    on socios(lower(email));
create index if not exists socios_perfil_idx   on socios(perfil_publico);

-- datos reservados, en tabla aparte: nunca viajan con el perfil
create table if not exists socios_privado (
  socio_id  uuid primary key references socios(id) on delete cascade,
  dni       text,
  direccion text,
  iban      text
);

-- ---------- invitaciones de alta ----------
create table if not exists invitaciones (
  token      text primary key default encode(gen_random_bytes(16), 'hex'),
  socio_id   uuid not null references socios(id) on delete cascade,
  estado     text default 'enviada' check (estado in ('enviada','aceptada','anulada')),
  enviada    timestamptz default now(),
  aceptada   timestamptz,
  caduca     timestamptz default now() + interval '30 days'
);
create index if not exists invitaciones_socio_idx on invitaciones(socio_id);

-- ---------- ejemplares ----------
create table if not exists perros (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  afijo             text,
  afijo_socio_id    uuid references socios(id) on delete set null,
  variedad          text check (variedad in ('Malinois','Tervueren','Groenendael','Laekenois')),
  sexo              text check (sexo in ('M','H')),
  fecha_nacimiento  date,
  fecha_fallecimiento date,
  color             text,
  loe               text,
  chip              text,
  tatuaje           text,
  propietario_id    uuid references socios(id) on delete set null,
  criador_id        uuid references socios(id) on delete set null,
  padre_id          uuid references perros(id) on delete set null,
  madre_id          uuid references perros(id) on delete set null,
  adn_ejemplar  boolean default false,
  -- Anexo A. hd: A..E · ed: 0..3 · lvt: libre|afectado · genes: {CACA,CJM,SDCA1,SDCA2}
  salud             jsonb default '{}'::jsonb,
  salud_validacion  text default 'pendiente' check (salud_validacion in ('pendiente','validado','rechazado')),
  salud_validada_por   text,
  salud_validada_fecha date,
  salud_validacion_nota text,
  visibilidad       text default 'socios' check (visibilidad in ('privado','socios','publico')),
  avatar_url        text,
  workingdog_url    text,
  pedigri_pegado    text,
  historial_titularidad jsonb default '[]'::jsonb,
  origen            text,          -- de dónde salió la ficha (working-dog, etc.)
  creado            timestamptz default now()
);
create index if not exists perros_prop_idx on perros(propietario_id);
create index if not exists perros_cria_idx on perros(criador_id);
create index if not exists perros_vis_idx  on perros(visibilidad);

-- ---------- eventos y resultados ----------
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, tipo text, fecha date, cierre date,
  lugar text, juez text, organizado_ceppb boolean default true,
  -- retransmisión en directo: se enlaza, no se aloja
  directo_url text, directo_titulo text,
  creado timestamptz default now()
);

create table if not exists resultados (
  id uuid primary key default gen_random_uuid(),
  perro_id uuid not null references perros(id) on delete cascade,
  tipo text check (tipo in ('estructura','caracter','trabajo','confirmacion')),
  fecha date,
  evento text, evento_id uuid references eventos(id) on delete set null,
  tipo_evento text, juez text, organizado_ceppb boolean default false,
  calificacion text,      -- EXC · MB · B · SUF
  clase text,             -- cachorro · junior · intermedia · abierta · trabajo · campeones · veteranos
                          -- o el grado, en mondioring
  equipo text,            -- grupo de trabajo con el que compite el guía
  puesto integer,
  distincion text,        -- CAC · CACIB · RCAC · RCACIB · CCPB · RCCPB · BOB
  modalidad text,         -- TS · TC
  resultado text,         -- APTO · NO APTO
  titulo text,            -- IGP1..3 · MR1..3
  -- NADA cuenta hasta que la junta valida
  validado text default 'pendiente' check (validado in ('pendiente','validado','rechazado')),
  validado_por text, validado_fecha date, validado_nota text,
  registrado_por uuid references socios(id) on delete set null,
  creado timestamptz default now()
);
create index if not exists resultados_perro_idx on resultados(perro_id);
create index if not exists resultados_val_idx   on resultados(validado);

create table if not exists inscripciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references eventos(id) on delete cascade,
  perro_id  uuid references perros(id) on delete cascade,
  socio_id  uuid references socios(id) on delete cascade,
  clase text, estado text default 'pendiente', fecha date default current_date
);

-- ---------- camadas ----------
create table if not exists camadas (
  id uuid primary key default gen_random_uuid(),
  padre_id uuid references perros(id) on delete set null,
  madre_id uuid references perros(id) on delete set null,
  criador_id uuid references socios(id) on delete set null,
  afijo text,
  fecha_nacimiento date,
  n_machos integer default 0, n_hembras integer default 0,
  loe_camada text,
  fecha_comunicacion date,     -- Cap. 6.1: dentro de los 30 días
  recomendada boolean default false,
  intervariedad boolean default false,
  notas text,
  creado timestamptz default now()
);

-- ---------- expedientes que resuelve la junta ----------
create table if not exists solicitudes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('intervariedad','traspaso','reclamacion')),
  estado text default 'pendiente' check (estado in ('pendiente','autorizada','denegada')),
  fecha date default current_date,
  -- cruce intervariedades (Cap. 8)
  macho_id uuid references perros(id) on delete cascade,
  hembra_id uuid references perros(id) on delete cascade,
  criador_id uuid references socios(id) on delete set null,
  linea text, motivo text, docs jsonb default '{}'::jsonb,
  -- cambio de titularidad
  perro_id uuid references perros(id) on delete cascade,
  de_socio_id uuid references socios(id) on delete set null,
  a_socio_id  uuid references socios(id) on delete set null,
  fecha_efecto date, documento text,
  -- resolución
  resolucion text, fecha_resolucion date, resuelta_por text,
  solicitante_id uuid references socios(id) on delete set null,
  creado timestamptz default now()
);
create index if not exists solicitudes_estado_idx on solicitudes(tipo, estado);

-- ---------- me gusta ----------
/* Un socio, un perro, una vez. Sirve para que un criador vea qué
   ejemplares suyos gustan; no cuenta para nada del reglamento. */
create table if not exists megusta (
  perro_id uuid not null references perros(id) on delete cascade,
  socio_id uuid not null references socios(id) on delete cascade,
  creado   timestamptz default now(),
  primary key (perro_id, socio_id)
);
create index if not exists megusta_perro_idx on megusta(perro_id);

-- ---------- mensajes entre socios ----------
/* Sin enseñar el correo de nadie. La regla del club es que un socio no
   ve los datos de otro salvo que ese otro los haya abierto; si para
   escribirle hubiera que darle su correo, esa regla se caería por la
   puerta de atrás. Los mensajes se quedan aquí dentro. */
create table if not exists mensajes (
  id       uuid primary key default gen_random_uuid(),
  de_id    uuid not null references socios(id) on delete cascade,
  para_id  uuid not null references socios(id) on delete cascade,
  perro_id uuid references perros(id) on delete set null,
  asunto   text,
  cuerpo   text not null,
  leido    timestamptz,
  creado   timestamptz default now()
);
create index if not exists mensajes_para_idx on mensajes(para_id, leido);
create index if not exists mensajes_de_idx   on mensajes(de_id);

-- ---------- cuotas ----------
create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid references socios(id) on delete cascade,
  anio text, concepto text default 'Cuota anual',
  importe numeric(8,2),
  estado text default 'pendiente' check (estado in ('pagado','pendiente','devuelto','exento')),
  fecha date
);

-- ---------- fotos y vídeos ----------
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  tipo text check (tipo in ('foto','video')),
  sujeto text check (sujeto in ('perro','socio')),
  perro_id uuid references perros(id) on delete cascade,
  socio_id uuid references socios(id) on delete cascade,
  storage_path text,     -- ruta en el bucket 'media' (fotos)
  url text,              -- enlace externo (vídeos)
  proveedor text, titulo text,
  subido_por uuid references socios(id) on delete set null,
  fecha date default current_date,
  -- los vídeos que sube un socio pasan por la junta antes de publicarse
  validado text default 'validado' check (validado in ('pendiente','validado','rechazado')),
  duracion integer,
  nota text,
  youtube_url text
);
create index if not exists media_perro_idx on media(perro_id);

-- ============================================================
--  BLINDAJES: campos que sólo puede tocar la junta
-- ============================================================

-- 1. Un socio no puede asignarse cargos, ni cambiarse el número, ni auto-publicarse datos de secretaría
create or replace function proteger_socio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.roles is distinct from old.roles and not es_presidencia() then
    raise exception 'Los cargos del club los nombra la presidencia';
  end if;
  if es_admin() then return new; end if;
  if new.numero is distinct from old.numero then
    raise exception 'El número de socio sólo lo cambia la secretaría';
  end if;
  if new.cuota is distinct from old.cuota or new.fecha_alta is distinct from old.fecha_alta
     or new.fecha_baja is distinct from old.fecha_baja or new.notas is distinct from old.notas then
    raise exception 'Los datos de secretaría sólo los cambia la Junta Directiva';
  end if;
  return new;
end; $$;
drop trigger if exists trg_proteger_socio on socios;
create trigger trg_proteger_socio before update on socios
  for each row execute function proteger_socio();

-- 2. La validación del expediente de salud sólo la firma la junta
create or replace function proteger_validacion_salud() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if es_admin() then return new; end if;
  if new.salud_validacion is distinct from old.salud_validacion then
    raise exception 'Las pruebas de salud sólo las valida la Junta Directiva';
  end if;
  -- si el propietario toca los datos, el expediente vuelve a pendiente
  if new.salud is distinct from old.salud
     or new.adn_ejemplar is distinct from old.adn_ejemplar then
    new.salud_validacion := 'pendiente';
    new.salud_validada_por := null; new.salud_validada_fecha := null;
  end if;
  -- la titularidad no se cambia a mano: pasa por expediente autorizado
  if new.propietario_id is distinct from old.propietario_id then
    raise exception 'El cambio de titularidad requiere autorización de la Junta Directiva';
  end if;
  return new;
end; $$;
drop trigger if exists trg_proteger_perro on perros;
create trigger trg_proteger_perro before update on perros
  for each row execute function proteger_validacion_salud();

-- 3. Los resultados nacen sin validar; sólo la junta los valida
create or replace function proteger_validacion_resultado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not es_admin() then new.validado := 'pendiente'; end if;
    return new;
  end if;
  if not es_admin() and new.validado is distinct from old.validado then
    raise exception 'Los resultados sólo los valida la Junta Directiva';
  end if;
  return new;
end; $$;
drop trigger if exists trg_proteger_resultado on resultados;
create trigger trg_proteger_resultado before insert or update on resultados
  for each row execute function proteger_validacion_resultado();

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
        'fecha', coalesce(new.fecha_efecto, current_date),
        'documento', new.documento,
        'resolucion', new.resolucion)
    where id = new.perro_id;
  end if;
  return new;
end; $$;
drop trigger if exists trg_resolver_solicitud on solicitudes;
create trigger trg_resolver_solicitud before update on solicitudes
  for each row execute function resolver_solicitud();

-- 5. Una camada intervariedades sin autorización no se difunde
create or replace function comprobar_difusion_camada() returns trigger
language plpgsql security definer set search_path = public as $$
declare vm text; vh text; autorizada boolean;
begin
  select variedad into vm from perros where id = new.padre_id;
  select variedad into vh from perros where id = new.madre_id;
  new.intervariedad := (vm is not null and vh is not null and vm <> vh);
  if new.intervariedad and new.recomendada then
    select exists (select 1 from solicitudes s where s.tipo = 'intervariedad'
      and s.estado = 'autorizada' and s.macho_id = new.padre_id and s.hembra_id = new.madre_id)
      into autorizada;
    if not autorizada then
      raise exception 'Cruce intervariedades sin autorización: la camada no puede difundirse';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists trg_camada_difusion on camadas;
create trigger trg_camada_difusion before insert or update on camadas
  for each row execute function comprobar_difusion_camada();

-- ============================================================
--  POLÍTICAS DE ACCESO (RLS)
-- ============================================================
alter table socios          enable row level security;
alter table socios_privado  enable row level security;
alter table perros          enable row level security;
alter table resultados      enable row level security;
alter table camadas         enable row level security;
alter table eventos         enable row level security;
alter table inscripciones   enable row level security;
alter table pagos           enable row level security;
alter table solicitudes     enable row level security;
alter table media           enable row level security;
alter table invitaciones    enable row level security;
alter table megusta         enable row level security;
alter table mensajes        enable row level security;
alter table admins          enable row level security;

create or replace function mi_socio_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from socios where auth_user_id = auth.uid();
$$;

-- SOCIOS: el perfil se ve si su titular lo ha autorizado; los cargos son públicos
drop policy if exists socios_lectura on socios;
create policy socios_lectura on socios for select using (
  es_admin()
  or auth_user_id = auth.uid()
  or perfil_publico = 'publico'
  or (perfil_publico = 'socios' and es_socio())
  or array_length(roles, 1) > 0        -- listado oficial de cargos (Cap. 5 y 6.2)
);
drop policy if exists socios_propia on socios;
create policy socios_propia on socios for update using (es_admin() or auth_user_id = auth.uid());
drop policy if exists socios_alta on socios;
create policy socios_alta on socios for insert with check (es_admin());

-- DATOS RESERVADOS: su titular y la junta. Nadie más, en ningún nivel.
drop policy if exists privado_lectura on socios_privado;
create policy privado_lectura on socios_privado for select using (
  es_admin() or socio_id = mi_socio_id());
drop policy if exists privado_escritura on socios_privado;
create policy privado_escritura on socios_privado for all using (
  es_admin() or socio_id = mi_socio_id())
  with check (es_admin() or socio_id = mi_socio_id());

-- PERROS
drop policy if exists perros_lectura on perros;
create policy perros_lectura on perros for select using (
  es_admin() or propietario_id = mi_socio_id()
  or visibilidad = 'publico' or (visibilidad = 'socios' and es_socio()));
drop policy if exists perros_escritura on perros;
create policy perros_escritura on perros for all using (
  es_admin() or propietario_id = mi_socio_id())
  with check (es_admin() or propietario_id = mi_socio_id());

-- RESULTADOS: los ve quien ve el perro; los registra su propietario, los valida la junta
drop policy if exists resultados_lectura on resultados;
create policy resultados_lectura on resultados for select using (
  exists (select 1 from perros p where p.id = perro_id));
drop policy if exists resultados_escritura on resultados;
create policy resultados_escritura on resultados for all using (
  es_admin() or exists (select 1 from perros p where p.id = perro_id and p.propietario_id = mi_socio_id()))
  with check (
  es_admin() or exists (select 1 from perros p where p.id = perro_id and p.propietario_id = mi_socio_id()));

-- CAMADAS, EVENTOS: lectura abierta a quien entra; escritura restringida
drop policy if exists camadas_lectura on camadas;
create policy camadas_lectura on camadas for select using (true);
drop policy if exists camadas_escritura on camadas;
create policy camadas_escritura on camadas for all using (
  es_admin() or criador_id = mi_socio_id()) with check (es_admin() or criador_id = mi_socio_id());

drop policy if exists eventos_lectura on eventos;
create policy eventos_lectura on eventos for select using (true);
drop policy if exists eventos_escritura on eventos;
create policy eventos_escritura on eventos for all using (es_admin()) with check (es_admin());

drop policy if exists inscripciones_pol on inscripciones;
create policy inscripciones_pol on inscripciones for all using (
  es_admin() or socio_id = mi_socio_id()) with check (es_admin() or socio_id = mi_socio_id());

-- PAGOS: su titular y la tesorería
drop policy if exists pagos_pol on pagos;
create policy pagos_pol on pagos for select using (es_admin() or socio_id = mi_socio_id());
drop policy if exists pagos_escritura on pagos;
create policy pagos_escritura on pagos for all using (es_admin()) with check (es_admin());

-- SOLICITUDES: las presenta el interesado, las resuelve la junta
drop policy if exists solicitudes_lectura on solicitudes;
create policy solicitudes_lectura on solicitudes for select using (
  es_admin() or criador_id = mi_socio_id() or solicitante_id = mi_socio_id()
  or de_socio_id = mi_socio_id() or a_socio_id = mi_socio_id());
drop policy if exists solicitudes_alta on solicitudes;
create policy solicitudes_alta on solicitudes for insert with check (
  es_admin() or solicitante_id = mi_socio_id() or criador_id = mi_socio_id());
drop policy if exists solicitudes_resolucion on solicitudes;
create policy solicitudes_resolucion on solicitudes for update using (es_admin());
/* Un expediente abierto por error tiene que poder retirarse. Denegarlo
   no vale: dejaría en la ficha del perro constancia de una reclamación
   que nunca debió existir. Sólo la junta, y sólo mientras esté
   pendiente: lo ya resuelto es el registro de lo que pasó y se queda. */
drop policy if exists solicitudes_borrado on solicitudes;
create policy solicitudes_borrado on solicitudes for delete
  using (es_admin() and estado = 'pendiente');

-- MEDIA: sigue la visibilidad del ejemplar
drop policy if exists media_lectura on media;
create policy media_lectura on media for select using (
  perro_id is null or exists (select 1 from perros p where p.id = perro_id));
drop policy if exists media_escritura on media;
create policy media_escritura on media for all using (
  es_admin() or socio_id = mi_socio_id()
  or exists (select 1 from perros p where p.id = perro_id and p.propietario_id = mi_socio_id()))
  with check (
  es_admin() or socio_id = mi_socio_id()
  or exists (select 1 from perros p where p.id = perro_id and p.propietario_id = mi_socio_id()));

-- ME GUSTA: cuántos tiene un perro lo ve cualquier socio; el propio,
-- sólo lo pone y lo quita su dueño.
drop policy if exists megusta_lectura on megusta;
create policy megusta_lectura on megusta for select using (es_socio() or es_admin());
drop policy if exists megusta_propio on megusta;
create policy megusta_propio on megusta for insert with check (socio_id = mi_socio_id());
drop policy if exists megusta_quitar on megusta;
create policy megusta_quitar on megusta for delete using (socio_id = mi_socio_id() or es_admin());

-- MENSAJES: los ven dos personas, quien escribe y quien recibe. La
-- junta no lee el correo de los socios.
drop policy if exists mensajes_lectura on mensajes;
create policy mensajes_lectura on mensajes for select
  using (de_id = mi_socio_id() or para_id = mi_socio_id());
drop policy if exists mensajes_envio on mensajes;
create policy mensajes_envio on mensajes for insert
  with check (
    de_id = mi_socio_id()
    and para_id <> mi_socio_id()
    /* y no se escribe a quien ha dicho que no */
    and exists (select 1 from socios s
                 where s.id = para_id and s.acepta_mensajes and s.fecha_baja is null));
drop policy if exists mensajes_leido on mensajes;
create policy mensajes_leido on mensajes for update using (para_id = mi_socio_id());
drop policy if exists mensajes_borrado on mensajes;
create policy mensajes_borrado on mensajes for delete
  using (para_id = mi_socio_id() or de_id = mi_socio_id());

/* Lo dicho, dicho está: marcar como leído es lo único que se puede
   cambiar de un mensaje enviado. */
create or replace function proteger_mensaje() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.cuerpo is distinct from old.cuerpo
     or new.asunto is distinct from old.asunto
     or new.de_id is distinct from old.de_id
     or new.para_id is distinct from old.para_id then
    raise exception 'Un mensaje enviado no se puede reescribir';
  end if;
  return new;
end; $$;
drop trigger if exists trg_proteger_mensaje on mensajes;
create trigger trg_proteger_mensaje before update on mensajes
  for each row execute function proteger_mensaje();

-- INVITACIONES y ADMINS: sólo la junta
drop policy if exists invitaciones_pol on invitaciones;
create policy invitaciones_pol on invitaciones for all using (es_admin()) with check (es_admin());
drop policy if exists admins_lectura on admins;
create policy admins_lectura on admins for select using (es_admin());
drop policy if exists admins_escritura on admins;
create policy admins_escritura on admins for all
  using (es_presidencia()) with check (es_presidencia());

-- ============================================================
--  ALTA: al entrar con el enlace de invitación, la cuenta se ata al socio
-- ============================================================
create or replace function reclamar_perfil(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_socio uuid;
begin
  select socio_id into v_socio from invitaciones
   where token = p_token and estado = 'enviada' and caduca > now();
  if v_socio is null then raise exception 'Enlace no válido o caducado'; end if;
  if exists (select 1 from socios where id = v_socio and auth_user_id is not null) then
    raise exception 'Este perfil ya ha sido reclamado';
  end if;
  update socios set auth_user_id = auth.uid() where id = v_socio;
  update invitaciones set estado = 'aceptada', aceptada = now() where token = p_token;
  return v_socio;
end; $$;

-- ============================================================
--  Almacenamiento de fotos: bucket 'media'
--  (crear el bucket desde el panel de Supabase, y luego estas políticas)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('media','media', true)
--   on conflict (id) do nothing;
