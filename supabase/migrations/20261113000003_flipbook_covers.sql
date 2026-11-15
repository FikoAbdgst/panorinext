-- =============================================================================
-- PanoriCam - Desain sampul & penutup flipbook
-- Desain dikelola admin, bukan dipilih user. Setiap baris mewakili satu
-- halaman pembuka/penutup:
--   kind       : 'cover' atau 'back' (satu baris per jenis)
--   image_path : overlay PNG opsional di bucket `flipbook-covers`
--   use_photo  : tampilkan foto pertama/terakhir di belakang overlay
-- =============================================================================

create table if not exists public.flipbook_covers (
  kind        text primary key check (kind in ('cover', 'back')),
  image_path  text,
  use_photo   boolean not null default false,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- Dua baris bawaan supaya halaman admin langsung punya sesuatu untuk diedit.
-- Tanpa overlay, tampilan memakai desain bawaan aplikasi.
insert into public.flipbook_covers (kind, image_path, use_photo, is_active)
values
  ('cover', null, true, true),
  ('back', null, false, true)
on conflict (kind) do nothing;

alter table public.flipbook_covers enable row level security;

drop policy if exists flipbook_covers_select_public on public.flipbook_covers;
create policy flipbook_covers_select_public
  on public.flipbook_covers for select
  to anon, authenticated
  using (is_active);

drop policy if exists flipbook_covers_admin_write on public.flipbook_covers;
create policy flipbook_covers_admin_write
  on public.flipbook_covers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket overlay sampul/penutup
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flipbook-covers', 'flipbook-covers', true, 10485760, array['image/png'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit     = excluded.file_size_limit,
      allowed_mime_types  = excluded.allowed_mime_types;

drop policy if exists flipbook_covers_bucket_read_public on storage.objects;
create policy flipbook_covers_bucket_read_public
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'flipbook-covers');

drop policy if exists flipbook_covers_bucket_admin_write on storage.objects;
create policy flipbook_covers_bucket_admin_write
  on storage.objects for all
  to authenticated
  using (bucket_id = 'flipbook-covers' and public.is_admin())
  with check (bucket_id = 'flipbook-covers' and public.is_admin());
