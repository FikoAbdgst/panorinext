-- =============================================================================
-- PanoriCam - Storage buckets & policy
--   frames         : publik (baca bebas), tulis admin
--   payment-proofs : privat, upload publik; baca lewat signed URL (service role)
--   photo-results  : privat, upload publik; dipakai sementara untuk link email
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('frames',         'frames',         true,  10485760, array['image/png']),
  ('payment-proofs', 'payment-proofs', false,  2097152, array['image/jpeg', 'image/png', 'image/jpg']),
  ('photo-results',  'photo-results',  false, 10485760, array['image/png', 'image/gif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit     = excluded.file_size_limit,
      allowed_mime_types  = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- frames (bucket)
-- ---------------------------------------------------------------------------
drop policy if exists frames_bucket_read_public on storage.objects;
create policy frames_bucket_read_public
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'frames');

drop policy if exists frames_bucket_admin_write on storage.objects;
create policy frames_bucket_admin_write
  on storage.objects for all
  to authenticated
  using (bucket_id = 'frames' and public.is_admin())
  with check (bucket_id = 'frames' and public.is_admin());

-- ---------------------------------------------------------------------------
-- payment-proofs (bucket) - izinkan upload anon (sebelum ada transaksi).
-- Tidak ada policy SELECT publik: admin membaca via signed URL.
-- ---------------------------------------------------------------------------
drop policy if exists payment_proofs_insert_public on storage.objects;
create policy payment_proofs_insert_public
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

drop policy if exists payment_proofs_admin_read on storage.objects;
create policy payment_proofs_admin_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- ---------------------------------------------------------------------------
-- photo-results (bucket) - hasil sementara (PNG + GIF) untuk link email.
-- ---------------------------------------------------------------------------
drop policy if exists photo_results_insert_public on storage.objects;
create policy photo_results_insert_public
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'photo-results');

drop policy if exists photo_results_admin_read on storage.objects;
create policy photo_results_admin_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photo-results' and public.is_admin());
