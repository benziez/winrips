-- Recent pulls for a single pack on the mobile pack detail screen.
-- Matches vault_items.item_id to catalog_item_id rows in pack_card_weights.
-- Run in Supabase SQL editor after pack_card_weights is populated.

create or replace function public.get_recent_pack_pulls(
  p_pack_id text,
  p_limit integer default 8
)
returns table (
  id uuid,
  item_id text,
  item_name text,
  rarity text,
  gem_value integer,
  image_url text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    vi.id,
    vi.item_id,
    vi.item_name,
    vi.rarity,
    vi.gem_value,
    vi.image_url,
    vi.created_at
  from public.vault_items vi
  inner join public.pack_card_weights pcw
    on pcw.catalog_item_id = vi.item_id
    and pcw.pack_id = p_pack_id
  where vi.status = 'vaulted'
  order by vi.created_at desc
  limit greatest(1, least(coalesce(p_limit, 8), 20));
$$;

create index if not exists vault_items_recent_pulls_idx
  on public.vault_items (created_at desc)
  where status = 'vaulted';

revoke all on function public.get_recent_pack_pulls(text, integer) from public;
grant execute on function public.get_recent_pack_pulls(text, integer) to anon, authenticated;

comment on function public.get_recent_pack_pulls(text, integer) is
  'Recent vaulted pulls for one pack (no PII). Used on pack detail Just Pulled feed.';
