-- Box Battles Phase 2 — join_battle RPC (1v1: seats player at position 2).
-- Run in Supabase SQL editor after box_battles_schema.sql.

create or replace function public.join_battle(p_battle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_balance integer;
  v_new_balance integer;
  v_battle record;
  v_participant_count integer;
  v_participant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  if p_battle_id is null then
    raise exception 'invalid_battle_id'
      using errcode = '22023',
            message = 'Battle id is required.';
  end if;

  v_user_id := auth.uid();

  select
    id,
    status,
    entry_cost
    into v_battle
  from public.battles
  where id = p_battle_id
  for update;

  if not found then
    raise exception 'battle_not_found'
      using errcode = 'P0002',
            message = 'Battle not found.';
  end if;

  if v_battle.status <> 'waiting' then
    raise exception 'battle_not_joinable'
      using errcode = '22023',
            message = 'This battle is no longer accepting players.';
  end if;

  if exists (
    select 1
    from public.battle_participants bp
    where bp.battle_id = p_battle_id
      and bp.user_id = v_user_id
  ) then
    raise exception 'already_joined'
      using errcode = '22023',
            message = 'You are already in this battle.';
  end if;

  select count(*)
    into v_participant_count
  from public.battle_participants
  where battle_id = p_battle_id;

  if v_participant_count >= 2 then
    raise exception 'battle_full'
      using errcode = '22023',
            message = 'This battle already has two players.';
  end if;

  if v_participant_count <> 1 then
    raise exception 'battle_not_joinable'
      using errcode = '22023',
            message = 'This battle is not ready for a second player.';
  end if;

  if exists (
    select 1
    from public.battle_participants bp
    where bp.battle_id = p_battle_id
      and bp.position = 2
  ) then
    raise exception 'battle_full'
      using errcode = '22023',
            message = 'Position 2 is already taken.';
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

  if v_balance < v_battle.entry_cost then
    raise exception 'insufficient_gems'
      using errcode = 'P0001',
            message = 'Insufficient gems to join this battle.';
  end if;

  v_new_balance := v_balance - v_battle.entry_cost;

  update public.profiles
  set gems_balance = v_new_balance
  where id = v_user_id;

  insert into public.battle_participants (battle_id, user_id, position)
  values (p_battle_id, v_user_id, 2)
  returning id into v_participant_id;

  update public.battles
  set status = 'in_progress'
  where id = p_battle_id;

  return jsonb_build_object(
    'success', true,
    'battle_id', p_battle_id,
    'participant_id', v_participant_id,
    'position', 2,
    'entry_cost', v_battle.entry_cost,
    'gems_balance', v_new_balance,
    'status', 'in_progress'
  );
end;
$$;

revoke all on function public.join_battle(uuid) from public;
grant execute on function public.join_battle(uuid) to authenticated;

comment on function public.join_battle(uuid) is
  'Joins a waiting 1v1 battle at position 2, charges entry_cost, and sets status to in_progress.';
