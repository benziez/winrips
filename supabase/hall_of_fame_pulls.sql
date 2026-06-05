-- All-time top pulls for the mobile Wins "Hall of Fame" grid.
-- Run in Supabase SQL editor. Exposes username only (no user_id).

create or replace function public.get_hall_of_fame_pulls(p_limit integer default 20)
returns table (
  id uuid,
  item_id text,
  item_name text,
  rarity text,
  gem_value integer,
  image_url text,
  created_at timestamptz,
  username text
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
    vi.created_at,
    coalesce(nullif(trim(p.username), ''), 'collector') as username
  from public.vault_items vi
  left join public.profiles p on p.id = vi.user_id
  where vi.status = 'vaulted'
  order by vi.gem_value desc, vi.created_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

create index if not exists vault_items_hall_of_fame_idx
  on public.vault_items (gem_value desc, created_at desc)
  where status = 'vaulted';

revoke all on function public.get_hall_of_fame_pulls(integer) from public;
grant execute on function public.get_hall_of_fame_pulls(integer) to anon, authenticated;

comment on function public.get_hall_of_fame_pulls(integer) is
  'Top all-time vaulted pulls by gem_value for the Wins Hall of Fame (username only).';
