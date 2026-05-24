-- Box Battles Phase 1 — schema, RLS, Realtime, and create_battle RPC.
-- Run in Supabase SQL editor after profiles + boxes tables exist.

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting',
  box_ids text[] not null,
  entry_cost integer not null check (entry_cost > 0),
  winner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint battles_status_check
    check (status in ('waiting', 'in_progress', 'completed')),
  constraint battles_box_ids_not_empty
    check (coalesce(array_length(box_ids, 1), 0) > 0)
);

create table if not exists public.battle_participants (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position integer not null check (position between 1 and 4),
  total_pulled_value integer not null default 0 check (total_pulled_value >= 0),
  joined_at timestamptz not null default now(),
  constraint battle_participants_battle_user_unique unique (battle_id, user_id),
  constraint battle_participants_battle_position_unique unique (battle_id, position)
);

create index if not exists battles_status_created_at_idx
  on public.battles (status, created_at desc);

create index if not exists battle_participants_battle_id_idx
  on public.battle_participants (battle_id);

create index if not exists battle_participants_user_id_idx
  on public.battle_participants (user_id);

alter table public.battles enable row level security;
alter table public.battle_participants enable row level security;

drop policy if exists "Authenticated users can read battles" on public.battles;
create policy "Authenticated users can read battles"
  on public.battles
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read battle participants" on public.battle_participants;
create policy "Authenticated users can read battle participants"
  on public.battle_participants
  for select
  to authenticated
  using (true);

-- Enable Supabase Realtime for lobby live updates.
alter publication supabase_realtime add table public.battles;
alter publication supabase_realtime add table public.battle_participants;

create or replace function public.create_battle(p_box_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_entry_cost integer;
  v_requested_count integer;
  v_valid_count integer;
  v_battle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  v_user_id := auth.uid();

  if p_box_ids is null or coalesce(array_length(p_box_ids, 1), 0) = 0 then
    raise exception 'invalid_box_ids'
      using errcode = '22023',
            message = 'Select at least one box for the battle.';
  end if;

  v_requested_count := coalesce(array_length(p_box_ids, 1), 0);

  select
    coalesce(sum(cost), 0),
    count(*)
    into v_entry_cost, v_valid_count
  from public.boxes
  where id = any (p_box_ids)
    and is_active = true;

  if v_valid_count <> v_requested_count then
    raise exception 'invalid_box_ids'
      using errcode = '22023',
            message = 'One or more selected boxes are invalid or inactive.';
  end if;

  if v_entry_cost <= 0 then
    raise exception 'invalid_entry_cost'
      using errcode = '22023',
            message = 'Battle entry cost must be greater than zero.';
  end if;

  select coalesce(gems_balance, 0)
    into v_balance
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found'
      using errcode = 'P0002',
            message = 'User profile not found.';
  end if;

  if v_balance < v_entry_cost then
    raise exception 'insufficient_gems'
      using errcode = 'P0001',
            message = 'Insufficient gems to create this battle.';
  end if;

  v_new_balance := v_balance - v_entry_cost;

  update public.profiles
  set gems_balance = v_new_balance
  where id = v_user_id;

  insert into public.battles (status, box_ids, entry_cost)
  values ('waiting', p_box_ids, v_entry_cost)
  returning id into v_battle_id;

  insert into public.battle_participants (battle_id, user_id, position)
  values (v_battle_id, v_user_id, 1);

  return jsonb_build_object(
    'success', true,
    'battle_id', v_battle_id,
    'entry_cost', v_entry_cost,
    'gems_balance', v_new_balance,
    'status', 'waiting'
  );
end;
$$;

revoke all on function public.create_battle(text[]) from public;
grant execute on function public.create_battle(text[]) to authenticated;

comment on function public.create_battle(text[]) is
  'Creates a waiting battle, charges entry_cost from profiles.gems_balance, and seats the creator at position 1.';

comment on table public.battles is
  'Multiplayer box battle lobbies and match state.';

comment on table public.battle_participants is
  'Players seated in a box battle (up to 4 positions).';
