-- Harden vault_items RLS: block direct client INSERT/DELETE.
-- Vault writes must go through security definer RPCs (open_pack, exchange_vault_item, etc.).
-- Run in Supabase SQL editor after vault_items.sql.

alter table public.vault_items enable row level security;

drop policy if exists "Users insert own vault items" on public.vault_items;
drop policy if exists "Users delete own vault items" on public.vault_items;

-- SELECT policy remains from vault_items.sql ("Users read own vault items").
-- No INSERT/UPDATE/DELETE policies for authenticated.

comment on table public.vault_items is
  'Vaulted collectibles. RLS: select own rows only; inserts/updates via security definer RPCs.';
