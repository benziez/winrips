-- Box Battles Phase 2 — resolve_battle RPC (server-side rolls + winner payout).
-- Run in Supabase SQL editor after box_battles_schema.sql and join_battle.sql.

alter table public.battles
  add column if not exists results jsonb;

create table if not exists public.battle_pulls (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles (id) on delete cascade,
  participant_id uuid not null references public.battle_participants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  box_id text not null,
  item_id text not null,
  item_name text not null,
  store_rarity text,
  gem_value integer not null check (gem_value >= 0),
  image_url text not null default '',
  pull_index integer not null check (pull_index >= 0),
  created_at timestamptz not null default now()
);

create index if not exists battle_pulls_battle_id_idx
  on public.battle_pulls (battle_id);

alter table public.battle_pulls enable row level security;

drop policy if exists "Authenticated users can read battle pulls" on public.battle_pulls;
create policy "Authenticated users can read battle pulls"
  on public.battle_pulls
  for select
  to authenticated
  using (true);

alter publication supabase_realtime add table public.battle_pulls;

create or replace function public._battle_roll_box_item(p_box_id text)
returns table (
  item_id text,
  item_name text,
  store_rarity text,
  gem_value integer,
  image_url text
)
language plpgsql
volatile
set search_path = public
as $$
declare
  v_roll numeric;
  v_total numeric;
  v_row record;
  v_cumulative numeric := 0;
  v_last record;
begin
  select coalesce(sum(probability), 0)
    into v_total
  from public.box_items
  where box_id = p_box_id;

  if v_total <= 0 then
    raise exception 'box_has_no_items'
      using errcode = '22023',
            message = 'Box has no rollable items.';
  end if;

  v_roll := random() * v_total;

  for v_row in
    select
      bi.item_id,
      bi.item_name,
      bi.store_rarity,
      bi.gem_value,
      bi.image_url,
      bi.probability
    from public.box_items bi
    where bi.box_id = p_box_id
    order by bi.sort_order nulls last, bi.item_id
  loop
    v_last := v_row;
    v_cumulative := v_cumulative + v_row.probability;
    if v_roll <= v_cumulative then
      item_id := v_row.item_id;
      item_name := v_row.item_name;
      store_rarity := v_row.store_rarity;
      gem_value := v_row.gem_value;
      image_url := coalesce(v_row.image_url, '');
      return next;
      return;
    end if;
  end loop;

  if v_last is null then
    raise exception 'box_has_no_items'
      using errcode = '22023',
            message = 'Box has no rollable items.';
  end if;

  item_id := v_last.item_id;
  item_name := v_last.item_name;
  store_rarity := v_last.store_rarity;
  gem_value := v_last.gem_value;
  image_url := coalesce(v_last.image_url, '');
  return next;
end;
$$;

create or replace function public.resolve_battle(p_battle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_creator_id uuid;
  v_battle record;
  v_participant record;
  v_box_id text;
  v_rolled record;
  v_pulled_row record;
  v_rarity text;
  v_total_value integer;
  v_pull_index integer;
  v_participant_pulls jsonb;
  v_all_pulls jsonb := '[]'::jsonb;
  v_standings jsonb := '[]'::jsonb;
  v_winner_id uuid;
  v_winner_total integer;
  v_vault_item_id uuid;
  v_results jsonb;
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
    box_ids,
    entry_cost,
    winner_id
    into v_battle
  from public.battles
  where id = p_battle_id
  for update;

  if not found then
    raise exception 'battle_not_found'
      using errcode = 'P0002',
            message = 'Battle not found.';
  end if;

  if v_battle.status = 'completed' then
    return coalesce(
      (select results from public.battles where id = p_battle_id),
      jsonb_build_object('success', true, 'status', 'completed')
    );
  end if;

  if v_battle.status <> 'in_progress' then
    raise exception 'battle_not_in_progress'
      using errcode = '22023',
            message = 'Battle must be in progress before it can be resolved.';
  end if;

  select bp.user_id
    into v_creator_id
  from public.battle_participants bp
  where bp.battle_id = p_battle_id
    and bp.position = 1;

  if v_creator_id is null then
    raise exception 'battle_invalid'
      using errcode = '22023',
            message = 'Battle creator not found.';
  end if;

  if v_user_id <> v_creator_id then
    raise exception 'not_battle_creator'
      using errcode = '42501',
            message = 'Only the battle creator can resolve this battle.';
  end if;

  if (
    select count(*)
    from public.battle_participants bp
    where bp.battle_id = p_battle_id
  ) <> 2 then
    raise exception 'battle_not_ready'
      using errcode = '22023',
            message = 'Both players must be seated before resolving.';
  end if;

  delete from public.battle_pulls
  where battle_id = p_battle_id;

  for v_participant in
    select
      bp.id,
      bp.user_id,
      bp.position
    from public.battle_participants bp
    where bp.battle_id = p_battle_id
    order by bp.position
  loop
    v_total_value := 0;
    v_pull_index := 0;
    v_participant_pulls := '[]'::jsonb;

    foreach v_box_id in array v_battle.box_ids
    loop
      select *
        into v_rolled
      from public._battle_roll_box_item(v_box_id);

      v_total_value := v_total_value + coalesce(v_rolled.gem_value, 0);

      insert into public.battle_pulls (
        battle_id,
        participant_id,
        user_id,
        box_id,
        item_id,
        item_name,
        store_rarity,
        gem_value,
        image_url,
        pull_index
      )
      values (
        p_battle_id,
        v_participant.id,
        v_participant.user_id,
        v_box_id,
        v_rolled.item_id,
        v_rolled.item_name,
        v_rolled.store_rarity,
        coalesce(v_rolled.gem_value, 0),
        coalesce(v_rolled.image_url, ''),
        v_pull_index
      );

      v_participant_pulls := v_participant_pulls || jsonb_build_array(
        jsonb_build_object(
          'box_id', v_box_id,
          'item_id', v_rolled.item_id,
          'item_name', v_rolled.item_name,
          'store_rarity', v_rolled.store_rarity,
          'gem_value', coalesce(v_rolled.gem_value, 0),
          'image_url', coalesce(v_rolled.image_url, '')
        )
      );

      v_all_pulls := v_all_pulls || jsonb_build_array(
        jsonb_build_object(
          'user_id', v_participant.user_id,
          'position', v_participant.position,
          'box_id', v_box_id,
          'item_id', v_rolled.item_id,
          'item_name', v_rolled.item_name,
          'store_rarity', v_rolled.store_rarity,
          'gem_value', coalesce(v_rolled.gem_value, 0),
          'image_url', coalesce(v_rolled.image_url, '')
        )
      );

      v_pull_index := v_pull_index + 1;
    end loop;

    update public.battle_participants
    set total_pulled_value = v_total_value
    where id = v_participant.id;

    v_standings := v_standings || jsonb_build_array(
      jsonb_build_object(
        'user_id', v_participant.user_id,
        'position', v_participant.position,
        'total_pulled_value', v_total_value,
        'pulls', v_participant_pulls
      )
    );
  end loop;

  select
    bp.user_id,
    bp.total_pulled_value
    into v_winner_id, v_winner_total
  from public.battle_participants bp
  where bp.battle_id = p_battle_id
  order by bp.total_pulled_value desc, bp.position asc, bp.joined_at asc
  limit 1;

  for v_pulled_row in
    select
      bp.item_id,
      bp.item_name,
      bp.store_rarity,
      bp.gem_value,
      bp.image_url
    from public.battle_pulls bp
    where bp.battle_id = p_battle_id
    order by bp.pull_index, bp.participant_id
  loop
    v_rarity := case
      when v_pulled_row.store_rarity in ('Mythic', 'Legendary') then 'Ancient Rare'
      when v_pulled_row.store_rarity in ('Epic', 'Rare') then 'Rare'
      else 'Common'
    end;

    insert into public.vault_items (
      user_id,
      item_id,
      item_name,
      rarity,
      gem_value,
      image_url,
      status
    )
    values (
      v_winner_id,
      v_pulled_row.item_id,
      v_pulled_row.item_name,
      v_rarity,
      v_pulled_row.gem_value,
      coalesce(v_pulled_row.image_url, ''),
      'vaulted'
    )
    returning id into v_vault_item_id;
  end loop;

  v_results := jsonb_build_object(
    'success', true,
    'battle_id', p_battle_id,
    'winner_id', v_winner_id,
    'winner_total', v_winner_total,
    'status', 'completed',
    'standings', v_standings,
    'pulls', v_all_pulls
  );

  update public.battles
  set
    winner_id = v_winner_id,
    status = 'completed',
    results = v_results
  where id = p_battle_id;

  return v_results;
end;
$$;

revoke all on function public._battle_roll_box_item(text) from public;
revoke all on function public.resolve_battle(uuid) from public;
grant execute on function public.resolve_battle(uuid) to authenticated;

comment on function public.resolve_battle(uuid) is
  'Server-side weighted rolls for all battle boxes and players, determines winner, vaults all pulls to winner, and marks battle completed.';

comment on table public.battle_pulls is
  'Individual pull outcomes recorded during battle resolution.';
