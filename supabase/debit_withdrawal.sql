-- Withdrawal audit + atomic debit + status helpers for Stripe Connect transfers.
-- Apply after add_withdrawable_balance.sql.

create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  amount_cents integer not null,
  stripe_transfer_id text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

alter table public.withdrawals enable row level security;

drop policy if exists "Users read own withdrawals" on public.withdrawals;
create policy "Users read own withdrawals"
  on public.withdrawals
  for select
  using (auth.uid() = user_id);

create or replace function public.debit_withdrawal(
  p_user_id uuid,
  p_amount_cents integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_withdrawable integer;
  v_withdrawal_id uuid;
  v_recent_total integer;
  v_ytd integer;
  v_ytd_year integer;
  v_current_year integer := extract(year from now())::integer;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'invalid_user_id');
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    return jsonb_build_object('success', false, 'error', 'invalid_amount');
  end if;

  select withdrawable_balance, total_withdrawn_ytd, withdrawn_ytd_year
    into v_withdrawable, v_ytd, v_ytd_year
  from public.profiles
  where id = p_user_id
  for update;

  if v_withdrawable is null or v_withdrawable < p_amount_cents then
    return jsonb_build_object('success', false, 'error', 'insufficient_withdrawable_balance');
  end if;

  if v_ytd_year is null or v_ytd_year <> v_current_year then
    v_ytd := 0;
  end if;

  select coalesce(sum(amount_cents), 0)
    into v_recent_total
  from public.withdrawals
  where user_id = p_user_id
    and status in ('pending', 'completed')
    and created_at > now() - interval '7 days';

  if v_recent_total + p_amount_cents > 25000 then
    return jsonb_build_object('success', false, 'error', 'weekly_cap_exceeded');
  end if;

  update public.profiles
  set
    gems_balance = gems_balance - p_amount_cents,
    withdrawable_balance = withdrawable_balance - p_amount_cents,
    total_withdrawn_ytd = v_ytd + p_amount_cents,
    withdrawn_ytd_year = v_current_year
  where id = p_user_id;

  insert into public.withdrawals (user_id, amount_cents, status)
  values (p_user_id, p_amount_cents, 'pending')
  returning id into v_withdrawal_id;

  return jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id
  );
end;
$$;

create or replace function public.mark_withdrawal_status(
  p_withdrawal_id uuid,
  p_status text,
  p_stripe_transfer_id text default null,
  p_reverse boolean default false
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_amount integer;
begin
  if p_withdrawal_id is null then
    return;
  end if;

  select user_id, amount_cents
    into v_user_id, v_amount
  from public.withdrawals
  where id = p_withdrawal_id;

  if not found then
    return;
  end if;

  update public.withdrawals
  set
    status = p_status,
    stripe_transfer_id = coalesce(p_stripe_transfer_id, stripe_transfer_id)
  where id = p_withdrawal_id;

  if p_reverse then
    update public.profiles
    set
      gems_balance = gems_balance + v_amount,
      withdrawable_balance = withdrawable_balance + v_amount
    where id = v_user_id;
  end if;
end;
$$;

revoke all on function public.debit_withdrawal(uuid, integer) from public;
grant execute on function public.debit_withdrawal(uuid, integer) to service_role;

revoke all on function public.mark_withdrawal_status(uuid, text, text, boolean) from public;
grant execute on function public.mark_withdrawal_status(uuid, text, text, boolean) to service_role;

comment on function public.debit_withdrawal(uuid, integer) is
  'Atomically debits gems_balance and withdrawable_balance and records a pending withdrawal.';

comment on function public.mark_withdrawal_status(uuid, text, text, boolean) is
  'Updates withdrawal status; optionally reverses profile debits on Stripe transfer failure.';
