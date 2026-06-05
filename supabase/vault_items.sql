-- Vault items — run in Supabase SQL editor if the table is not created yet.

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  item_name text not null,
  rarity text not null default 'Rare',
  gem_value integer not null check (gem_value >= 0),
  image_url text not null default '',
  status text not null default 'vaulted',
  shipping_name text,
  shipping_address text,
  tracking_number text,
  created_at timestamptz not null default now()
);

create index if not exists vault_items_user_id_created_at_idx
  on public.vault_items (user_id, created_at desc);

alter table public.vault_items enable row level security;

create policy "Users read own vault items"
  on public.vault_items for select
  using (auth.uid() = user_id);

-- Inserts and deletes are restricted to security definer RPCs (open_pack, etc.).
-- Do not grant INSERT/DELETE policies to authenticated clients.
