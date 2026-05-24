-- Secure server-side upgrade rolls with 10% house edge.
-- Run in Supabase SQL editor after vault_items.sql and box_items are populated.

alter table public.vault_items
  drop constraint if exists vault_items_status_check;

alter table public.vault_items
  add constraint vault_items_status_check
  check (
    status in (
      'vaulted',
      'pending_shipment',
      'shipped',
      'delivered',
      'exchanged',
      'upgraded_lost'
    )
  );

create or replace function public.process_upgrade_roll(
  p_input_item_id uuid,
  p_target_catalog_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_input_status text;
  v_input_value integer;
  v_target record;
  v_target_rarity text;
  v_win_chance numeric;
  v_random numeric;
  v_won boolean;
  v_new_item_id uuid;
begin
  if p_input_item_id is null then
    raise exception 'invalid_input_item_id'
      using errcode = '22023',
            message = 'Input vault item id is required.';
  end if;

  if p_target_catalog_id is null or trim(p_target_catalog_id) = '' then
    raise exception 'invalid_target_catalog_id'
      using errcode = '22023',
            message = 'Target catalog item id is required.';
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  select user_id, status, gem_value
    into v_user_id, v_input_status, v_input_value
  from public.vault_items
  where id = p_input_item_id
  for update;

  if not found then
    raise exception 'input_item_not_found'
      using errcode = 'P0002',
            message = 'Input vault item not found.';
  end if;

  if v_user_id <> auth.uid() then
    raise exception 'input_item_not_owned'
      using errcode = '42501',
            message = 'You do not own this vault item.';
  end if;

  if coalesce(v_input_status, 'vaulted') <> 'vaulted' then
    raise exception 'input_item_not_upgradeable'
      using errcode = '22023',
            message = 'This item cannot be used for an upgrade.';
  end if;

  if v_input_value is null or v_input_value <= 0 then
    raise exception 'invalid_input_value'
      using errcode = '22023',
            message = 'Input item has no upgrade value.';
  end if;

  select
    item_id,
    item_name,
    store_rarity,
    gem_value,
    image_url
    into v_target
  from public.upgrade_catalog_items
  where item_id = trim(p_target_catalog_id)
  limit 1;

  if not found then
    select
      item_id,
      item_name,
      store_rarity,
      gem_value,
      image_url
      into v_target
    from public.box_items
    where item_id = trim(p_target_catalog_id)
    order by gem_value desc
    limit 1;
  end if;

  if not found then
    raise exception 'invalid_target_item'
      using errcode = '22023',
            message = 'Target catalog item not found.';
  end if;

  if v_target.gem_value is null or v_target.gem_value <= 0 then
    raise exception 'invalid_target_value'
      using errcode = '22023',
            message = 'Target item has no upgrade value.';
  end if;

  v_win_chance := least(
    (v_input_value::numeric / v_target.gem_value::numeric) * 0.9,
    0.9
  );

  v_random := random();
  v_won := v_random <= v_win_chance;

  update public.vault_items
  set status = 'upgraded_lost'
  where id = p_input_item_id;

  if v_won then
    v_target_rarity := case
      when v_target.store_rarity in ('Mythic', 'Legendary') then 'Ancient Rare'
      when v_target.store_rarity in ('Epic', 'Rare') then 'Rare'
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
      auth.uid(),
      v_target.item_id,
      v_target.item_name,
      v_target_rarity,
      v_target.gem_value,
      coalesce(v_target.image_url, ''),
      'vaulted'
    )
    returning id into v_new_item_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'won', v_won,
    'new_item_id', v_new_item_id,
    'win_chance', v_win_chance
  );
end;
$$;

revoke all on function public.process_upgrade_roll(uuid, text) from public;
grant execute on function public.process_upgrade_roll(uuid, text) to authenticated;

comment on function public.process_upgrade_roll(uuid, text) is
  'Consumes a vaulted input item and rolls for a target catalog item using (input/target)*0.9 win chance. Targets resolve from upgrade_catalog_items, then box_items.';
