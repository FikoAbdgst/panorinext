-- =============================================================================
-- PanoriCam - RLS untuk pack & premium access
-- =============================================================================

-- ---------------------------------------------------------------------------
-- packs
-- ---------------------------------------------------------------------------
drop policy if exists packs_select_public on public.packs;
create policy packs_select_public
  on public.packs for select
  to anon, authenticated
  using (is_active);

drop policy if exists packs_admin_write on public.packs;
create policy packs_admin_write
  on public.packs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- pack_frames
-- ---------------------------------------------------------------------------
drop policy if exists pack_frames_select_public on public.pack_frames;
create policy pack_frames_select_public
  on public.pack_frames for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.packs p
      where p.id = pack_frames.pack_id
        and p.is_active = true
    )
  );

drop policy if exists pack_frames_admin_write on public.pack_frames;
create policy pack_frames_admin_write
  on public.pack_frames for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- premium_access: kode dan sesi hanya boleh dibaca lewat server/service role.
-- ---------------------------------------------------------------------------
drop policy if exists premium_access_admin_all on public.premium_access;
create policy premium_access_admin_all
  on public.premium_access for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
