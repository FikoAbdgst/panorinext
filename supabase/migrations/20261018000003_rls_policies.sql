-- =============================================================================
-- PanoriCam - Row Level Security
-- Ringkasan:
--   categories   : SELECT publik, tulis admin
--   frames       : SELECT publik, tulis admin
--   testimonials : SELECT publik, INSERT publik, ubah/hapus admin
--   transactions : INSERT publik (status dipaksa 'pending' oleh trigger),
--                  SELECT/UPDATE/DELETE admin saja
--   admins       : SELECT baris sendiri saja
-- =============================================================================

alter table public.categories   enable row level security;
alter table public.frames       enable row level security;
alter table public.testimonials enable row level security;
alter table public.transactions enable row level security;
alter table public.admins       enable row level security;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
drop policy if exists categories_select_public on public.categories;
create policy categories_select_public
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- frames
-- ---------------------------------------------------------------------------
drop policy if exists frames_select_public on public.frames;
create policy frames_select_public
  on public.frames for select
  to anon, authenticated
  using (true);

drop policy if exists frames_admin_write on public.frames;
create policy frames_admin_write
  on public.frames for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
drop policy if exists testimonials_select_public on public.testimonials;
create policy testimonials_select_public
  on public.testimonials for select
  to anon, authenticated
  using (true);

drop policy if exists testimonials_insert_public on public.testimonials;
create policy testimonials_insert_public
  on public.testimonials for insert
  to anon, authenticated
  with check (rating between 1 and 5);

drop policy if exists testimonials_admin_write on public.testimonials;
create policy testimonials_admin_write
  on public.testimonials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
drop policy if exists transactions_insert_public on public.transactions;
create policy transactions_insert_public
  on public.transactions for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists transactions_admin_read on public.transactions;
create policy transactions_admin_read
  on public.transactions for select
  to authenticated
  using (public.is_admin());

drop policy if exists transactions_admin_update on public.transactions;
create policy transactions_admin_update
  on public.transactions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists transactions_admin_delete on public.transactions;
create policy transactions_admin_delete
  on public.transactions for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self
  on public.admins for select
  to authenticated
  using (id = auth.uid());
