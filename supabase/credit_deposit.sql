-- Stripe balance deposits — credits profiles.gems_balance (100 gems = $1).
-- Apply via Supabase SQL editor. Webhook calls credit_deposit with service role.

create table if not exists public.deposits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  stripe_payment_intent_id text unique not null,
  amount_cents integer not null,
  created_at timestamptz default now()
);

alter table public.deposits enable row level security;

drop policy if exists "Users can read own deposits" on public.deposits;
create policy "Users can read own deposits"
  on public.deposits for select
  using (auth.uid() = user_id);

create or replace function public.credit_deposit(
  p_user_id uuid,
  p_amount_cents integer,
  p_stripe_payment_intent_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount_gems integer;
  v_new_balance integer;
  v_existing_deposit_id uuid;
begin
  if p_user_id is null then
    raise exception 'invalid_user_id'
      using errcode = '22023',
            message = 'User id is required.';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'invalid_amount'
      using errcode = '22023',
            message = 'Deposit amount must be greater than zero.';
  end if;

  if p_stripe_payment_intent_id is null or trim(p_stripe_payment_intent_id) = '' then
    raise exception 'invalid_payment_intent'
      using errcode = '22023',
            message = 'Payment intent id is required.';
  end if;

  select id into v_existing_deposit_id
  from public.deposits
  where stripe_payment_intent_id = p_stripe_payment_intent_id;

  if v_existing_deposit_id is not null then
    return jsonb_build_object(
      'success', true,
      'already_processed', true,
      'deposit_id', v_existing_deposit_id
    );
  end if;

  -- 100 gems = $1.00 → 1 cent = 1 gem
  v_amount_gems := p_amount_cents;

  insert into public.deposits (user_id, stripe_payment_intent_id, amount_cents)
  values (p_user_id, p_stripe_payment_intent_id, p_amount_cents);

  update public.profiles
  set gems_balance = coalesce(gems_balance, 0) + v_amount_gems
  where id = p_user_id
  returning gems_balance into v_new_balance;

  if not found then
    raise exception 'profile_not_found'
      using errcode = 'P0002',
            message = 'User profile not found.';
  end if;

  return jsonb_build_object(
    'success', true,
    'amount_gems_added', v_amount_gems,
    'new_balance', v_new_balance
  );
end;
$$;

revoke all on function public.credit_deposit(uuid, integer, text) from public;
grant execute on function public.credit_deposit(uuid, integer, text) to service_role;

comment on function public.credit_deposit(uuid, integer, text) is
  'Idempotent Stripe deposit credit: inserts deposits audit row and adds gems to profiles.gems_balance.';
