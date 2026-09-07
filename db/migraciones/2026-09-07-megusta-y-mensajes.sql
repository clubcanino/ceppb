-- ============================================================
--  Dos cosas que piden los socios: aplaudir un perro y hablarse
--
--  «Me gusta»: un socio, un perro, una vez. Sirve para que un
--  criador vea qué ejemplares suyos gustan, y no es una votación
--  del club: no cuenta para nada del reglamento.
--
--  Mensajes: sin enseñar el correo de nadie. La regla del club es
--  que un socio no ve los datos de otro salvo que ese otro los
--  haya abierto; si para escribirle hubiera que darle su correo,
--  esa regla se caería por la puerta de atrás. Los mensajes se
--  quedan aquí dentro.
-- ============================================================

begin;

-- ---------- me gusta ----------
create table if not exists megusta (
  perro_id uuid not null references perros(id) on delete cascade,
  socio_id uuid not null references socios(id) on delete cascade,
  creado   timestamptz default now(),
  primary key (perro_id, socio_id)
);
create index if not exists megusta_perro_idx on megusta(perro_id);

alter table megusta enable row level security;

/* Cuántos le gustan a un perro lo ve cualquier socio; el suyo sólo
   lo pone y lo quita él. */
drop policy if exists megusta_lectura on megusta;
create policy megusta_lectura on megusta for select using (es_socio() or es_admin());
drop policy if exists megusta_propio on megusta;
create policy megusta_propio on megusta for insert
  with check (socio_id = mi_socio_id());
drop policy if exists megusta_quitar on megusta;
create policy megusta_quitar on megusta for delete
  using (socio_id = mi_socio_id() or es_admin());

-- ---------- mensajes entre socios ----------
create table if not exists mensajes (
  id       uuid primary key default gen_random_uuid(),
  de_id    uuid not null references socios(id) on delete cascade,
  para_id  uuid not null references socios(id) on delete cascade,
  perro_id uuid references perros(id) on delete set null,   -- si nace de una ficha
  asunto   text,
  cuerpo   text not null,
  leido    timestamptz,
  creado   timestamptz default now()
);
create index if not exists mensajes_para_idx on mensajes(para_id, leido);
create index if not exists mensajes_de_idx   on mensajes(de_id);

alter table mensajes enable row level security;

/* Un mensaje lo ven dos personas: quien lo escribe y quien lo
   recibe. La junta no lee el correo de los socios. */
drop policy if exists mensajes_lectura on mensajes;
create policy mensajes_lectura on mensajes for select
  using (de_id = mi_socio_id() or para_id = mi_socio_id());

/* Se escribe en nombre propio y sólo a socios, no a fichas sueltas. */
drop policy if exists mensajes_envio on mensajes;
create policy mensajes_envio on mensajes for insert
  with check (de_id = mi_socio_id() and para_id <> mi_socio_id());

/* Marcar como leído es cosa de quien lo recibe. Y sólo eso: el
   trigger impide que se reescriba lo que se dijo. */
drop policy if exists mensajes_leido on mensajes;
create policy mensajes_leido on mensajes for update
  using (para_id = mi_socio_id());

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

/* Cada uno borra lo suyo: el que lo recibió, de su bandeja. */
drop policy if exists mensajes_borrado on mensajes;
create policy mensajes_borrado on mensajes for delete
  using (para_id = mi_socio_id() or de_id = mi_socio_id());

commit;

select (select count(*) from megusta) as megusta,
       (select count(*) from mensajes) as mensajes;
