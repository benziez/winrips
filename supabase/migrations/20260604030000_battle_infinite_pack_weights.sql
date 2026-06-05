-- Battles: roll from pack_card_weights (same as open_pack) so Infinite Series and all
-- calibrated packs work in resolve_battle / 1v1 bot flow (open_pack).
-- Re-upsert Infinite Series boxes for environments that missed 20260603160000.

insert into public.boxes (
  id,
  name,
  cost,
  description,
  category,
  image_url,
  theme,
  accent_label,
  ribbon,
  is_active,
  sort_order,
  daily_limit,
  opens_today
)
values
  (
    'infinite-prime',
    'Infinite Prime',
    50000,
    'High-roller Infinite Series — 30-card curated pool with 77/18/5 floor, mid, and grail variance.',
    'pokemon',
    '',
    'gold',
    '∞ INFINITE',
    'High Roller',
    true,
    90,
    50,
    0
  ),
  (
    'infinite-apex',
    'Infinite Apex',
    75000,
    'Elevated Infinite Series tier — tighter mid-tier hits and stronger grail ceiling.',
    'pokemon',
    '',
    'gold',
    '∞ INFINITE',
    'High Roller',
    true,
    91,
    50,
    0
  ),
  (
    'infinite-zenith',
    'Infinite Zenith',
    85000,
    'Near-peak Infinite Series — vintage grails blended with modern alt-art chase cards.',
    'pokemon',
    '',
    'mystic',
    '∞ INFINITE',
    'High Roller',
    true,
    92,
    25,
    0
  ),
  (
    'infinite-omega',
    'Infinite Omega',
    100000,
    'Flagship Infinite Series — maximum grail ceiling with WOTC 1st Edition chase hits.',
    'pokemon',
    '',
    'mystic',
    '∞ LEGENDARY',
    'Omega Tier',
    true,
    93,
    25,
    0
  )
on conflict (id) do update
set
  name = excluded.name,
  cost = excluded.cost,
  description = excluded.description,
  category = excluded.category,
  theme = excluded.theme,
  accent_label = excluded.accent_label,
  ribbon = excluded.ribbon,
  is_active = true,
  daily_limit = excluded.daily_limit,
  opens_today = coalesce(public.boxes.opens_today, 0);

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
  v_pack_id text;
  v_roll numeric;
  v_total numeric;
  v_row record;
  v_cumulative numeric := 0;
  v_last record;
begin
  v_pack_id := trim(coalesce(p_box_id, ''));

  if v_pack_id = '1999-god' then
    v_pack_id := 'god-pack-1999';
  end if;

  select coalesce(sum(roll_weight), 0)
    into v_total
  from public.pack_card_weights
  where pack_id = v_pack_id;

  if v_total <= 0 then
    raise exception 'pack_weights_missing'
      using errcode = '22023',
            message = 'Pack roll weights are not configured';
  end if;

  v_roll := random() * v_total;

  for v_row in
    select
      catalog_item_id,
      item_name,
      store_rarity,
      value_gems,
      image_url,
      roll_weight
    from public.pack_card_weights
    where pack_id = v_pack_id
    order by catalog_item_id
  loop
    v_last := v_row;
    v_cumulative := v_cumulative + v_row.roll_weight;
    if v_roll <= v_cumulative then
      item_id := v_row.catalog_item_id;
      item_name := v_row.item_name;
      store_rarity := v_row.store_rarity;
      gem_value := v_row.value_gems;
      image_url := coalesce(v_row.image_url, '');
      return next;
      return;
    end if;
  end loop;

  if v_last is null then
    raise exception 'pack_weights_missing'
      using errcode = '22023',
            message = 'Pack roll weights are not configured';
  end if;

  item_id := v_last.catalog_item_id;
  item_name := v_last.item_name;
  store_rarity := v_last.store_rarity;
  gem_value := v_last.value_gems;
  image_url := coalesce(v_last.image_url, '');
  return next;
end;
$$;

comment on function public._battle_roll_box_item(text) is
  'Weighted battle pull from pack_card_weights (mirrors open_pack).';
