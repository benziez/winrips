-- Compliance gates: age verification, Stripe Identity KYC, $600 tax threshold.
-- Apply in Supabase SQL editor after profiles exists.

alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists is_age_verified boolean not null default false,
  add column if not exists kyc_verified boolean not null default false,
  add column if not exists kyc_verification_session_id text,
  add column if not exists total_withdrawn_ytd integer not null default 0,
  add column if not exists withdrawn_ytd_year integer,
  add column if not exists tax_info_collected boolean not null default false,
  add column if not exists tax_name text,
  add column if not exists tax_address text,
  add column if not exists tax_ssn_last4 text;

comment on column public.profiles.date_of_birth is
  'Self-reported DOB at signup (soft age gate). Stripe Identity is hard KYC at withdrawal.';
comment on column public.profiles.is_age_verified is
  'True after user confirms DOB and passes 18+ check.';
comment on column public.profiles.kyc_verified is
  'True after Stripe Identity verification_session.verified webhook.';
comment on column public.profiles.total_withdrawn_ytd is
  'Calendar-year withdrawal total in cents; reset when withdrawn_ytd_year != current year.';
comment on column public.profiles.tax_ssn_last4 is
  'Last 4 of SSN/EIN only — TODO: migrate to Stripe Tax or W-9 service before scaling.';

-- Age gate RPC (authenticated user sets own DOB once).
create or replace function public.set_age_verification(p_date_of_birth date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_age integer;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'error', 'unauthorized');
  end if;

  if p_date_of_birth is null then
    return jsonb_build_object('success', false, 'error', 'invalid_dob');
  end if;

  if p_date_of_birth > current_date then
    return jsonb_build_object('success', false, 'error', 'invalid_dob');
  end if;

  v_age := extract(year from age(current_date, p_date_of_birth))::integer;
  if v_age < 18 then
    return jsonb_build_object('success', false, 'error', 'underage');
  end if;

  update public.profiles
  set
    date_of_birth = p_date_of_birth,
    is_age_verified = true
  where id = auth.uid();

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.set_age_verification(date) from public;
grant execute on function public.set_age_verification(date) to authenticated;

-- Tax info placeholder — last-4 only; replace with Stripe Tax / W-9 service at scale.
create or replace function public.submit_tax_info(
  p_tax_name text,
  p_tax_address text,
  p_tax_ssn_last4 text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(p_tax_name), '');
  v_address text := nullif(trim(p_tax_address), '');
  v_last4 text := nullif(trim(p_tax_ssn_last4), '');
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'error', 'unauthorized');
  end if;

  if v_name is null or v_address is null or v_last4 is null then
    return jsonb_build_object('success', false, 'error', 'missing_fields');
  end if;

  if length(v_last4) <> 4 or v_last4 !~ '^[0-9]{4}$' then
    return jsonb_build_object('success', false, 'error', 'invalid_ssn_last4');
  end if;

  update public.profiles
  set
    tax_name = v_name,
    tax_address = v_address,
    tax_ssn_last4 = v_last4,
    tax_info_collected = true
  where id = auth.uid();

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.submit_tax_info(text, text, text) from public;
grant execute on function public.submit_tax_info(text, text, text) to authenticated;

-- Extend debit_withdrawal to track calendar-year withdrawal totals.
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

  select coalesce(sum(amount), 0)
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

  insert into public.withdrawals (user_id, amount, status)
  values (p_user_id, p_amount_cents, 'pending')
  returning id into v_withdrawal_id;

  return jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id
  );
end;
$$;

revoke all on function public.debit_withdrawal(uuid, integer) from public;
grant execute on function public.debit_withdrawal(uuid, integer) to service_role;
