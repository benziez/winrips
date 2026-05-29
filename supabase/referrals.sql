-- Referral codes + $5 signup bonus for referrer and referee (500 gems each).
-- Run in Supabase SQL editor after profiles exists.

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists referral_bonus_credited_at timestamptz;

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

create or replace function public.generate_referral_code(p_user_id uuid)
returns text
language sql
immutable
as $$
  select case
    when length(replace(p_user_id::text, '-', '')) >= 6
      then 'WR-' || upper(substr(replace(p_user_id::text, '-', ''), 1, 8))
    else 'WR-GUEST'
  end;
$$;

create or replace function public.credit_referral_signup_bonus(p_new_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_bonus_gems integer := 500;
  v_already_credited timestamptz;
begin
  if p_new_user_id is null then
    return;
  end if;

  select referred_by, referral_bonus_credited_at
  into v_referrer_id, v_already_credited
  from public.profiles
  where id = p_new_user_id;

  if v_referrer_id is null or v_already_credited is not null then
    return;
  end if;

  if v_referrer_id = p_new_user_id then
    return;
  end if;

  update public.profiles
  set gems_balance = coalesce(gems_balance, 0) + v_bonus_gems
  where id = p_new_user_id;

  update public.profiles
  set gems_balance = coalesce(gems_balance, 0) + v_bonus_gems
  where id = v_referrer_id;

  update public.profiles
  set referral_bonus_credited_at = now()
  where id = p_new_user_id;
end;
$$;

create or replace function public.apply_referral_code_to_user(
  p_user_id uuid,
  p_referral_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_referrer_id uuid;
begin
  if p_user_id is null then
    return;
  end if;

  v_code := upper(trim(coalesce(p_referral_code, '')));
  if v_code = '' then
    return;
  end if;

  if not v_code like 'WR-%' then
    v_code := 'WR-' || v_code;
  end if;

  select id
  into v_referrer_id
  from public.profiles
  where referral_code = v_code
    and id <> p_user_id
  limit 1;

  if v_referrer_id is null then
    return;
  end if;

  update public.profiles
  set referred_by = v_referrer_id
  where id = p_user_id
    and referred_by is null;

  perform public.credit_referral_signup_bonus(p_user_id);
end;
$$;

create or replace function public.claim_referral_signup(p_referral_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Sign in to claim a referral code.';
  end if;

  perform public.apply_referral_code_to_user(v_user_id, p_referral_code);

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.claim_referral_signup(text) to authenticated;

-- Extend new-user trigger: persist referral_code and apply signup referral metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_username text;
  signup_referral_code text;
begin
  chosen_username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  if chosen_username is null then
    chosen_username := 'collector_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, referral_code)
  values (new.id, chosen_username, public.generate_referral_code(new.id))
  on conflict (id) do update
    set username = excluded.username,
        referral_code = coalesce(public.profiles.referral_code, excluded.referral_code);

  signup_referral_code := nullif(trim(new.raw_user_meta_data->>'referral_code'), '');
  if signup_referral_code is not null then
    perform public.apply_referral_code_to_user(new.id, signup_referral_code);
  end if;

  return new;
end;
$$;

-- Backfill referral_code for existing profiles.
update public.profiles
set referral_code = public.generate_referral_code(id)
where referral_code is null or referral_code = '';
