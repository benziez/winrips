-- Authoritative server-side pack opening: weighted card selection, gem deduction, and
-- vault insert in ONE atomic transaction per pull. The client must NEVER supply the
-- winning card id or gem value — it calls open_pack, receives the server-decided
-- winner, then animates toward that result.
--
-- Apply in Supabase SQL editor (Dashboard -> SQL) after pack_card_weights.sql.
-- Requires: pack_card_weights (Part 1), profiles.gems_balance, vault_items.

create or replace function public.open_pack(
  p_user_id uuid,
  p_pack_id text,
  p_quantity integer default 1,
  p_spin_cost integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_withdrawable integer;
  v_new_balance integer;
  v_new_withdrawable integer;
  v_total_weight numeric;
  v_roll numeric;
  v_cumulative numeric;
  v_winner record;
  v_last_winner record;
  v_found boolean;
  v_vault_item_id uuid;
  v_vault_rarity text;
  v_results jsonb := '[]'::jsonb;
  v_pull_index integer;
  v_normalized_pack_id text;
begin
  v_normalized_pack_id := trim(coalesce(p_pack_id, ''));

  if p_quantity is null or p_quantity < 1 then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid quantity',
      'code', 'invalid_quantity'
    );
  end if;

  if p_spin_cost is null or p_spin_cost <= 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid spin cost',
      'code', 'invalid_spin_cost'
    );
  end if;

  if v_normalized_pack_id = '' then
    return jsonb_build_object(
      'success', false,
      'error', 'Invalid pack id',
      'code', 'invalid_pack_id'
    );
  end if;

  if auth.uid() is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Authentication required',
      'code', 'not_authenticated'
    );
  end if;

  if auth.uid() <> p_user_id then
    return jsonb_build_object(
      'success', false,
      'error', 'Cannot open packs for another user',
      'code', 'user_mismatch'
    );
  end if;

  select coalesce(sum(roll_weight), 0)
    into v_total_weight
  from public.pack_card_weights
  where pack_id = v_normalized_pack_id;

  if v_total_weight <= 0 then
    raise exception 'pack not found';
  end if;

  select coalesce(gems_balance, 0), coalesce(withdrawable_balance, 0)
    into v_balance, v_withdrawable
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'code', 'profile_not_found'
    );
  end if;

  if v_balance < (p_spin_cost * p_quantity) then
    return jsonb_build_object(
      'success', false,
      'error', 'Insufficient gems',
      'code', 'insufficient_gems',
      'gems_balance', v_balance
    );
  end if;

  for v_pull_index in 1..p_quantity loop
    v_roll := random() * v_total_weight;
    v_cumulative := 0;
    v_found := false;
    v_winner := null;
    v_last_winner := null;

    for v_winner in
      select
        catalog_item_id,
        item_name,
        store_rarity,
        value_gems,
        image_url,
        roll_weight
      from public.pack_card_weights
      where pack_id = v_normalized_pack_id
      order by catalog_item_id
    loop
      v_last_winner := v_winner;
      v_cumulative := v_cumulative + v_winner.roll_weight;
      if v_roll <= v_cumulative then
        v_found := true;
        exit;
      end if;
    end loop;

    if not v_found then
      v_winner := v_last_winner;
    end if;

    if v_winner.catalog_item_id is null then
      raise exception 'pack not found';
    end if;

    v_balance := v_balance - p_spin_cost;
    v_withdrawable := least(v_withdrawable, v_balance);

    update public.profiles
    set
      gems_balance = v_balance,
      withdrawable_balance = v_withdrawable
    where id = p_user_id;

    v_vault_rarity := case
      when v_winner.store_rarity in ('Mythic', 'Legendary') then 'Ancient Rare'
      when v_winner.store_rarity in ('Epic', 'Rare') then 'Rare'
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
      p_user_id,
      v_winner.catalog_item_id,
      v_winner.item_name,
      v_vault_rarity,
      v_winner.value_gems,
      coalesce(v_winner.image_url, ''),
      'vaulted'
    )
    returning id into v_vault_item_id;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'item_id', v_winner.catalog_item_id,
        'item_name', v_winner.item_name,
        'store_rarity', v_winner.store_rarity,
        'gem_value', v_winner.value_gems,
        'image_url', coalesce(v_winner.image_url, ''),
        'vault_item_id', v_vault_item_id
      )
    );
  end loop;

  v_new_balance := v_balance;
  v_new_withdrawable := v_withdrawable;

  return jsonb_build_object(
    'success', true,
    'gems_balance', v_new_balance,
    'withdrawable_balance', v_new_withdrawable,
    'results', v_results
  );
exception
  when others then
    if SQLERRM = 'pack not found' then
      raise;
    end if;

    return jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$;

revoke all on function public.open_pack(uuid, text, integer, integer) from public;
grant execute on function public.open_pack(uuid, text, integer, integer) to authenticated;

comment on function public.open_pack(uuid, text, integer, integer) is
  'Atomic pack open: server-side weighted draw from pack_card_weights, gem deduction, and vault insert. Client must never supply card id or value.';
