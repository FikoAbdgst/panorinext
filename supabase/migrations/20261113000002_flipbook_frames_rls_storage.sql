-- =============================================================================
-- PanoriCam - RLS & storage untuk frame flipbook
--   flipbook_frames : SELECT publik (hanya yang aktif), tulis admin
--   bucket          : `flipbook-frames`, publik baca, tulis admin
-- =============================================================================

alter table public.flipbook_frames enable row level security;

drop policy if exists flipbook_frames_select_public on public.flipbook_frames;
create policy flipbook_frames_select_public
  on public.flipbook_frames for select
  to anon, authenticated
  using (is_active);

drop policy if exists flipbook_frames_admin_write on public.flipbook_frames;
create policy flipbook_frames_admin_write
  on public.flipbook_frames for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket khusus flipbook
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flipbook-frames', 'flipbook-frames', true, 10485760, array['image/png'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit     = excluded.file_size_limit,
      allowed_mime_types  = excluded.allowed_mime_types;

drop policy if exists flipbook_frames_bucket_read_public on storage.objects;
create policy flipbook_frames_bucket_read_public
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'flipbook-frames');

drop policy if exists flipbook_frames_bucket_admin_write on storage.objects;
create policy flipbook_frames_bucket_admin_write
  on storage.objects for all
  to authenticated
  using (bucket_id = 'flipbook-frames' and public.is_admin())
  with check (bucket_id = 'flipbook-frames' and public.is_admin());
