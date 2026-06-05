-- Retroactively refresh catalog display fields on historical rows.
-- Source of truth: public.pack_card_weights (synced from packPokemonPools.ts).
--
-- Does NOT truncate or delete any rows — only UPDATE where values differ.
--
-- Note: get_recent_pack_pulls / get_recent_lobby_pulls / get_hall_of_fame_pulls are
-- SQL functions over vault_items; fixing vault_items fixes those feeds automatically.
--
-- Run in Supabase SQL editor after npm run sync:weights.
-- Run the PREVIEW block first, then the UPDATE block.

-- ===========================================================================
-- PREVIEW — row counts that would change
-- ===========================================================================

select 'vault_items' as target, count(*) as rows_to_update
from public.vault_items vi
join (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    store_rarity,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
) c on c.catalog_item_id = vi.item_id
where vi.item_name is distinct from c.item_name
   or vi.rarity is distinct from case
        when c.store_rarity in ('Mythic', 'Legendary') then 'Ancient Rare'
        when c.store_rarity in ('Epic', 'Rare') then 'Rare'
        else 'Common'
      end
   or vi.gem_value is distinct from c.value_gems
   or vi.image_url is distinct from coalesce(c.image_url, '');

select 'play_history (image match)' as target, count(*) as rows_to_update
from public.play_history ph
join (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
) c on c.image_url <> '' and ph.won_item_image = c.image_url
where ph.won_item_name is distinct from c.item_name
   or ph.won_item_value is distinct from c.value_gems
   or ph.won_item_image is distinct from coalesce(c.image_url, '');

select 'play_history (vault timestamp match)' as target, count(*) as rows_to_update
from public.play_history ph
join public.vault_items vi
  on vi.user_id = ph.user_id
 and vi.gem_value = ph.won_item_value
 and abs(extract(epoch from (ph.created_at - vi.created_at))) <= 2
join (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
) c on c.catalog_item_id = vi.item_id
where ph.won_item_name is distinct from c.item_name
   or ph.won_item_value is distinct from c.value_gems
   or ph.won_item_image is distinct from coalesce(c.image_url, '');

select 'battle_pulls' as target, count(*) as rows_to_update
from public.battle_pulls bp
join public.pack_card_weights pcw
  on pcw.catalog_item_id = bp.item_id
 and pcw.pack_id = bp.box_id
where bp.item_name is distinct from pcw.item_name
   or bp.store_rarity is distinct from pcw.store_rarity
   or bp.gem_value is distinct from pcw.value_gems
   or bp.image_url is distinct from coalesce(pcw.image_url, '');

select 'box_items' as target, count(*) as rows_to_update
from public.box_items bi
join public.pack_card_weights pcw
  on pcw.catalog_item_id = bi.item_id
 and pcw.pack_id = bi.box_id
where bi.item_name is distinct from pcw.item_name
   or bi.store_rarity is distinct from pcw.store_rarity
   or bi.gem_value is distinct from pcw.value_gems
   or bi.image_url is distinct from coalesce(pcw.image_url, '');

select 'upgrade_catalog_items' as target, count(*) as rows_to_update
from public.upgrade_catalog_items uci
join (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    store_rarity,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
) c on c.catalog_item_id = uci.item_id
where uci.item_name is distinct from c.item_name
   or uci.store_rarity is distinct from c.store_rarity
   or uci.gem_value is distinct from c.value_gems
   or uci.image_url is distinct from coalesce(c.image_url, '');

-- ===========================================================================
-- APPLY — run inside a transaction after previews look correct
-- ===========================================================================

begin;

with catalog as (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    store_rarity,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
),
vault_rarity as (
  select
    catalog_item_id,
    item_name,
    value_gems,
    image_url,
    case
      when store_rarity in ('Mythic', 'Legendary') then 'Ancient Rare'
      when store_rarity in ('Epic', 'Rare') then 'Rare'
      else 'Common'
    end as vault_rarity_label
  from catalog
)

-- vault_items (+ feeds: recent_pack_pulls, lobby, hall of fame)
update public.vault_items vi
set
  item_name = c.item_name,
  rarity = c.vault_rarity_label,
  gem_value = c.value_gems,
  image_url = coalesce(c.image_url, '')
from vault_rarity c
where c.catalog_item_id = vi.item_id
  and (
    vi.item_name is distinct from c.item_name
    or vi.rarity is distinct from c.vault_rarity_label
    or vi.gem_value is distinct from c.value_gems
    or vi.image_url is distinct from coalesce(c.image_url, '')
  );

-- play_history pass 1: stable TCG image URL (no item_id on this table)
with catalog as (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
)
update public.play_history ph
set
  won_item_name = c.item_name,
  won_item_value = c.value_gems,
  won_item_image = coalesce(c.image_url, ph.won_item_image)
from catalog c
where c.image_url <> ''
  and ph.won_item_image = c.image_url
  and (
    ph.won_item_name is distinct from c.item_name
    or ph.won_item_value is distinct from c.value_gems
    or ph.won_item_image is distinct from coalesce(c.image_url, '')
  );

-- play_history pass 2: same pull as a vaulted row (user + value + timestamp)
with catalog as (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
)
update public.play_history ph
set
  won_item_name = c.item_name,
  won_item_value = c.value_gems,
  won_item_image = coalesce(c.image_url, ph.won_item_image)
from public.vault_items vi
join catalog c on c.catalog_item_id = vi.item_id
where ph.user_id = vi.user_id
  and ph.won_item_value = vi.gem_value
  and abs(extract(epoch from (ph.created_at - vi.created_at))) <= 2
  and (
    ph.won_item_name is distinct from c.item_name
    or ph.won_item_value is distinct from c.value_gems
    or ph.won_item_image is distinct from coalesce(c.image_url, '')
  );

-- battle_pulls (pack-scoped: box_id = pack_id)
update public.battle_pulls bp
set
  item_name = pcw.item_name,
  store_rarity = pcw.store_rarity,
  gem_value = pcw.value_gems,
  image_url = coalesce(pcw.image_url, '')
from public.pack_card_weights pcw
where pcw.catalog_item_id = bp.item_id
  and pcw.pack_id = bp.box_id
  and (
    bp.item_name is distinct from pcw.item_name
    or bp.store_rarity is distinct from pcw.store_rarity
    or bp.gem_value is distinct from pcw.value_gems
    or bp.image_url is distinct from coalesce(pcw.image_url, '')
  );

-- box_items (remote catalog / legacy spin paths)
update public.box_items bi
set
  item_name = pcw.item_name,
  store_rarity = pcw.store_rarity,
  gem_value = pcw.value_gems,
  image_url = coalesce(pcw.image_url, '')
from public.pack_card_weights pcw
where pcw.catalog_item_id = bi.item_id
  and pcw.pack_id = bi.box_id
  and (
    bi.item_name is distinct from pcw.item_name
    or bi.store_rarity is distinct from pcw.store_rarity
    or bi.gem_value is distinct from pcw.value_gems
    or bi.image_url is distinct from coalesce(pcw.image_url, '')
  );

-- upgrade_catalog_items (upgrader target metadata)
with catalog as (
  select distinct on (catalog_item_id)
    catalog_item_id,
    item_name,
    store_rarity,
    value_gems,
    image_url
  from public.pack_card_weights
  order by catalog_item_id, updated_at desc nulls last
)
update public.upgrade_catalog_items uci
set
  item_name = c.item_name,
  store_rarity = c.store_rarity,
  gem_value = c.value_gems,
  image_url = coalesce(c.image_url, '')
from catalog c
where c.catalog_item_id = uci.item_id
  and (
    uci.item_name is distinct from c.item_name
    or uci.store_rarity is distinct from c.store_rarity
    or uci.gem_value is distinct from c.value_gems
    or uci.image_url is distinct from coalesce(c.image_url, '')
  );

commit;
