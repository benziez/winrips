-- Pack Battles: per-user W/L record, win bonus, leaderboard.
-- Run in Supabase SQL editor after profiles exists.

create table if not exists public.battle_record (
  user_id uuid references auth.users primary key,
  wins integer not null default 0,
  losses integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists battle_record_wins_idx
  on public.battle_record (wins desc);

alter table public.battle_record enable row level security;

drop policy if exists battle_record_select_own on public.battle_record;
create policy battle_record_select_own
  on public.battle_record
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists battle_record_insert_own on public.battle_record;
create policy battle_record_insert_own
  on public.battle_record
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists battle_record_update_own on public.battle_record;
create policy battle_record_update_own
  on public.battle_record
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.award_battle_bonus(
  p_user_id uuid,
  p_amount_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus_gems integer;
  v_new_withdrawable integer;
  v_new_gems integer;
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  if auth.uid() is distinct from p_user_id then
    return jsonb_build_object('success', false, 'error', 'forbidden');
  end if;

  v_bonus_gems := greatest(0, coalesce(p_amount_cents, 0));

  update public.profiles
  set
    gems_balance = coalesce(gems_balance, 0) + v_bonus_gems,
    withdrawable_balance = least(
      coalesce(gems_balance, 0) + v_bonus_gems,
      coalesce(withdrawable_balance, 0) + v_bonus_gems
    )
  where id = p_user_id
  returning gems_balance, withdrawable_balance
  into v_new_gems, v_new_withdrawable;

  if not found then
    return jsonb_build_object('success', false, 'error', 'profile_not_found');
  end if;

  insert into public.battle_record (user_id, wins, losses, updated_at)
  values (p_user_id, 1, 0, now())
  on conflict (user_id) do update
  set
    wins = public.battle_record.wins + 1,
    updated_at = now();

  return jsonb_build_object(
    'success', true,
    'bonus_gems', v_bonus_gems,
    'gems_balance', v_new_gems,
    'withdrawable_balance', v_new_withdrawable
  );
end;
$$;

create or replace function public.record_battle_loss(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  if auth.uid() is distinct from p_user_id then
    return jsonb_build_object('success', false, 'error', 'forbidden');
  end if;

  insert into public.battle_record (user_id, wins, losses, updated_at)
  values (p_user_id, 0, 1, now())
  on conflict (user_id) do update
  set
    losses = public.battle_record.losses + 1,
    updated_at = now();

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.fetch_top_battlers(p_limit integer default 10)
returns table (
  user_id uuid,
  username text,
  wins integer,
  losses integer,
  win_rate numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    br.user_id,
    coalesce(nullif(trim(p.username), ''), 'Ripp3r') as username,
    br.wins,
    br.losses,
    case
      when (br.wins + br.losses) > 0
        then round((br.wins::numeric / (br.wins + br.losses)::numeric) * 100, 1)
      else 0
    end as win_rate
  from public.battle_record br
  join public.profiles p on p.id = br.user_id
  where br.wins > 0
  order by br.wins desc, win_rate desc, br.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.award_battle_bonus(uuid, integer) from public;
revoke all on function public.record_battle_loss(uuid) from public;
revoke all on function public.fetch_top_battlers(integer) from public;

grant execute on function public.award_battle_bonus(uuid, integer) to authenticated;
grant execute on function public.record_battle_loss(uuid) to authenticated;
grant execute on function public.fetch_top_battlers(integer) to authenticated, anon;
