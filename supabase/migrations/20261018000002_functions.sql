-- =============================================================================
-- PanoriCam - Trigger & RPC
-- =============================================================================

-- ---------------------------------------------------------------------------
-- is_admin(): helper untuk policy RLS. SECURITY DEFINER agar membaca tabel
-- admins tanpa terhalang RLS-nya sendiri.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admins where id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- set_transaction_defaults(): dipanggil BEFORE INSERT pada transactions.
-- Menegakkan invariant walau client mengirim nilai palsu:
--   - order_id SELALU di-generate (format ORD{YYYYMMDD}{6 uppercase})
--   - amount SELALU diambil dari frames.price
--   - status SELALU 'pending', approved_at SELALU null
-- ---------------------------------------------------------------------------
create or replace function public.set_transaction_defaults()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_price numeric(10, 2);
begin
  select f.price into v_price from public.frames f where f.id = new.frame_id;

  if v_price is null then
    raise exception 'Frame tidak ditemukan';
  end if;

  new.amount := v_price;
  new.status := 'pending';
  new.approved_at := null;

  -- Selalu buat order_id baru (abaikan input client).
  loop
    new.order_id :=
      'ORD'
      || to_char(now(), 'YYYYMMDD')
      || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1 from public.transactions t where t.order_id = new.order_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists transactions_set_defaults on public.transactions;
create trigger transactions_set_defaults
  before insert on public.transactions
  for each row execute function public.set_transaction_defaults();

-- ---------------------------------------------------------------------------
-- get_transaction_status(order_id): endpoint status publik.
-- Hanya mengembalikan status, tidak membocorkan kolom lain.
-- ---------------------------------------------------------------------------
create or replace function public.get_transaction_status(p_order_id text)
returns public.transaction_status
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select t.status from public.transactions t where t.order_id = p_order_id;
$$;

-- ---------------------------------------------------------------------------
-- increment_frame_used(frame_id): menambah counter populer.
-- ---------------------------------------------------------------------------
create or replace function public.increment_frame_used(p_frame_id bigint)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.frames set used = used + 1 where id = p_frame_id;
$$;

-- ---------------------------------------------------------------------------
-- Hak eksekusi
-- ---------------------------------------------------------------------------
revoke all on function public.set_transaction_defaults() from public;
revoke all on function public.set_updated_at() from public;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

revoke all on function public.get_transaction_status(text) from public;
grant execute on function public.get_transaction_status(text) to anon, authenticated;

revoke all on function public.increment_frame_used(bigint) from public;
grant execute on function public.increment_frame_used(bigint) to anon, authenticated;
