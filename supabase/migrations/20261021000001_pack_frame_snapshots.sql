-- =============================================================================
-- Snapshot isi paket saat checkout dan saat akses premium dibuat.
-- Perubahan isi paket setelah pembelian tidak mengubah frame pembeli lama.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- transaction_frames: snapshot isi paket pada saat transaksi dibuat.
-- ---------------------------------------------------------------------------
create table if not exists public.transaction_frames (
  transaction_id bigint not null references public.transactions (id) on delete cascade,
  frame_id       bigint not null references public.frames (id) on delete cascade,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  primary key (transaction_id, frame_id)
);

alter table public.transaction_frames enable row level security;

create index if not exists transaction_frames_frame_idx
  on public.transaction_frames (frame_id);

drop policy if exists transaction_frames_admin_all on public.transaction_frames;
create policy transaction_frames_admin_all
  on public.transaction_frames for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- premium_access_frames: snapshot frame milik satu kode akses.
-- Tetap ada walau transaksi asal dihapus.
-- ---------------------------------------------------------------------------
create table if not exists public.premium_access_frames (
  access_id  bigint not null references public.premium_access (id) on delete cascade,
  frame_id   bigint not null references public.frames (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (access_id, frame_id)
);

alter table public.premium_access_frames enable row level security;

create index if not exists premium_access_frames_frame_idx
  on public.premium_access_frames (frame_id);

drop policy if exists premium_access_frames_admin_all on public.premium_access_frames;
create policy premium_access_frames_admin_all
  on public.premium_access_frames for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Snapshot transaksi dibuat oleh trigger agar atomik dengan insert transaksi,
-- termasuk bila transaksi dibuat langsung lewat SQL/Studio.
-- ---------------------------------------------------------------------------
create or replace function public.snapshot_transaction_frames()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if new.pack_id is null then
    return new;
  end if;

  insert into public.transaction_frames (transaction_id, frame_id, sort_order)
  select new.id, pf.frame_id, pf.sort_order
  from public.pack_frames pf
  where pf.pack_id = new.pack_id
  on conflict (transaction_id, frame_id) do nothing;

  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Paket belum memiliki frame';
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_snapshot_frames on public.transactions;
create trigger transactions_snapshot_frames
  after insert on public.transactions
  for each row execute function public.snapshot_transaction_frames();

-- ---------------------------------------------------------------------------
-- Snapshot akses: ambil dari transaksi bila ada, jika tidak dari isi paket.
-- Trigger juga menyegarkan snapshot saat admin memindahkan paket akses manual.
-- ---------------------------------------------------------------------------
create or replace function public.snapshot_premium_access_frames()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if tg_op = 'UPDATE' then
    if new.transaction_id is not null
       or old.pack_id is not distinct from new.pack_id then
      return new;
    end if;

    delete from public.premium_access_frames paf
    where paf.access_id = new.id;
  end if;

  if new.transaction_id is not null then
    insert into public.premium_access_frames (access_id, frame_id, sort_order)
    select new.id, tf.frame_id, tf.sort_order
    from public.transaction_frames tf
    where tf.transaction_id = new.transaction_id
    on conflict (access_id, frame_id) do nothing;
  else
    insert into public.premium_access_frames (access_id, frame_id, sort_order)
    select new.id, pf.frame_id, pf.sort_order
    from public.pack_frames pf
    where pf.pack_id = new.pack_id
    on conflict (access_id, frame_id) do nothing;
  end if;

  get diagnostics v_count = row_count;

  if v_count = 0 then
    raise exception 'Paket belum memiliki frame';
  end if;

  return new;
end;
$$;

drop trigger if exists premium_access_snapshot_frames on public.premium_access;
create trigger premium_access_snapshot_frames
  after insert on public.premium_access
  for each row execute function public.snapshot_premium_access_frames();

drop trigger if exists premium_access_refresh_manual_frames on public.premium_access;
create trigger premium_access_refresh_manual_frames
  after update of pack_id on public.premium_access
  for each row execute function public.snapshot_premium_access_frames();

-- ---------------------------------------------------------------------------
-- Backfill data lama dengan isi paket saat migrasi dijalankan.
-- ---------------------------------------------------------------------------
insert into public.transaction_frames (transaction_id, frame_id, sort_order)
select t.id, pf.frame_id, pf.sort_order
from public.transactions t
join public.pack_frames pf on pf.pack_id = t.pack_id
where t.pack_id is not null
on conflict (transaction_id, frame_id) do nothing;

insert into public.premium_access_frames (access_id, frame_id, sort_order)
select pa.id, tf.frame_id, tf.sort_order
from public.premium_access pa
join public.transaction_frames tf on tf.transaction_id = pa.transaction_id
where pa.transaction_id is not null
on conflict (access_id, frame_id) do nothing;

insert into public.premium_access_frames (access_id, frame_id, sort_order)
select pa.id, pf.frame_id, pf.sort_order
from public.premium_access pa
join public.pack_frames pf on pf.pack_id = pa.pack_id
where not exists (
  select 1
  from public.premium_access_frames paf
  where paf.access_id = pa.id
)
on conflict (access_id, frame_id) do nothing;

revoke all on function public.snapshot_transaction_frames() from public;
revoke all on function public.snapshot_premium_access_frames() from public;
