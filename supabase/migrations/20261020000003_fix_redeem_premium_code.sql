-- =============================================================================
-- Fix ambiguous session_token reference in redeem_premium_code().
-- The function's OUT parameter is also named session_token, so the UPDATE must
-- qualify the table column with an alias.
-- =============================================================================

create or replace function public.redeem_premium_code(p_code text)
returns table (
  access_id bigint,
  pack_id bigint,
  pack_name text,
  room_code text,
  first_used_at timestamptz,
  expires_at timestamptz,
  session_token uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_access public.premium_access%rowtype;
  v_pack public.packs%rowtype;
  v_normalized text;
begin
  v_normalized := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  if length(v_normalized) <> 8 then
    return;
  end if;

  select * into v_access
  from public.premium_access a
  where a.code = v_normalized
  for update;

  if not found or v_access.revoked_at is not null then
    return;
  end if;

  select * into v_pack
  from public.packs p
  where p.id = v_access.pack_id
    and p.is_active = true;

  if not found then
    return;
  end if;

  if v_access.first_used_at is null then
    update public.premium_access a
    set first_used_at = now(),
        expires_at = now() + make_interval(days => v_pack.duration_days),
        session_token = coalesce(a.session_token, gen_random_uuid())
    where a.id = v_access.id
    returning * into v_access;
  elsif v_access.expires_at is null or v_access.expires_at <= now() then
    return;
  elsif v_access.session_token is null then
    update public.premium_access a
    set session_token = gen_random_uuid()
    where a.id = v_access.id
    returning * into v_access;
  end if;

  return query
    select
      v_access.id,
      v_access.pack_id,
      v_pack.name,
      v_access.code,
      v_access.first_used_at,
      v_access.expires_at,
      v_access.session_token;
end;
$$;

revoke all on function public.redeem_premium_code(text) from public;
grant execute on function public.redeem_premium_code(text) to service_role;
