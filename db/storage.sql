-- ============================================================
--  Almacén de fotos y vídeos — bucket 'media'
--  Aplicar en el editor SQL de Supabase, después de schema.sql.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Las fotos se ven: son de perros de exposición y de perfiles del club.
-- Lo que se protege es quién puede subir, cambiar y borrar.
drop policy if exists media_ver on storage.objects;
create policy media_ver on storage.objects
  for select using (bucket_id = 'media');

-- Sube quien ha entrado. Nadie sube sin cuenta.
drop policy if exists media_subir on storage.objects;
create policy media_subir on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

-- Cada uno cambia y borra lo suyo. La junta, además, cualquier cosa.
drop policy if exists media_cambiar on storage.objects;
create policy media_cambiar on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or es_admin()));

drop policy if exists media_borrar on storage.objects;
create policy media_borrar on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or es_admin()));
