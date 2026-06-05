-- Public recent high-value pulls for the mobile lobby "Just Pulled" feed.
-- Run in Supabase SQL editor. Does not expose user_id.

create or replace function public.get_recent_lobby_pulls(p_limit integer default 20)
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
  where vi.gem_value >= 5000
    and vi.status = 'vaulted'
  order by vi.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

create index if not exists vault_items_lobby_feed_idx
  on public.vault_items (created_at desc)
  where gem_value >= 5000 and status = 'vaulted';

revoke all on function public.get_recent_lobby_pulls(integer) from public;
grant execute on function public.get_recent_lobby_pulls(integer) to anon, authenticated;

comment on function public.get_recent_lobby_pulls(integer) is
  'Recent vaulted pulls >= $50 for the lobby live feed (no PII).';
