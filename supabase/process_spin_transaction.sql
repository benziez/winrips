-- Secure server-side gem deduction for pack spins.
-- Run in Supabase SQL editor (Dashboard → SQL) or via Supabase CLI migrations.

-- Ensure profiles exposes a spendable gem balance column.
alter table public.profiles
  add column if not exists gems_balance integer not null default 0
  check (gems_balance >= 0);

create or replace function public.process_spin_transaction(
  p_user_id uuid,
  p_spin_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_new_balance integer;
begin
  if p_spin_cost is null or p_spin_cost <= 0 then
    raise exception 'invalid_spin_cost'
      using errcode = '22023',
            message = 'Spin cost must be a positive integer.';
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  if auth.uid() <> p_user_id then
    raise exception 'user_mismatch'
      using errcode = '42501',
            message = 'Cannot charge spins for another user.';
  end if;

  select coalesce(gems_balance, 0)
    into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile_not_found'
      using errcode = 'P0002',
            message = 'User profile not found.';
  end if;

  if v_balance < p_spin_cost then
    raise exception 'insufficient_gems'
      using errcode = 'P0001',
            message = 'Insufficient gems for this spin.';
  end if;

  v_new_balance := v_balance - p_spin_cost;

  update public.profiles
  set gems_balance = v_new_balance
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'gems_balance', v_new_balance
  );
end;
$$;

revoke all on function public.process_spin_transaction(uuid, integer) from public;
grant execute on function public.process_spin_transaction(uuid, integer) to authenticated;

comment on function public.process_spin_transaction(uuid, integer) is
  'Atomically deducts spin_cost from profiles.gems_balance after auth and balance checks.';
