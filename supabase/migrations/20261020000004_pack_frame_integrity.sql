-- =============================================================================
-- Paket premium harus berisi frame premium.
-- Menjaga invariant ini juga saat data diubah langsung lewat SQL/Studio.
-- =============================================================================

create or replace function public.ensure_pack_frame_is_premium()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_access_type public.frame_access_type;
begin
  select f.access_type into v_access_type
  from public.frames f
  where f.id = new.frame_id;

  if v_access_type is null then
    raise exception 'Frame tidak ditemukan';
  end if;

  if v_access_type <> 'premium' then
    raise exception 'Hanya frame premium yang boleh masuk ke paket';
  end if;

  return new;
end;
$$;

drop trigger if exists pack_frames_require_premium on public.pack_frames;
create trigger pack_frames_require_premium
  before insert or update of frame_id on public.pack_frames
  for each row execute function public.ensure_pack_frame_is_premium();

create or replace function public.prevent_pack_frame_downgrade()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.access_type <> 'premium'
     and exists (
       select 1
       from public.pack_frames pf
       where pf.frame_id = new.id
     ) then
    raise exception 'Frame masih menjadi isi paket dan tidak bisa diubah menjadi gratis';
  end if;

  return new;
end;
$$;

drop trigger if exists frames_prevent_pack_downgrade on public.frames;
create trigger frames_prevent_pack_downgrade
  before update of access_type on public.frames
  for each row execute function public.prevent_pack_frame_downgrade();

revoke all on function public.ensure_pack_frame_is_premium() from public;
revoke all on function public.prevent_pack_frame_downgrade() from public;
