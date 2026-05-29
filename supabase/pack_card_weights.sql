-- Precomputed per-(pack, card) roll weights + vault value, mirrored from the
-- client roll engine: getPackRollPool (src/data/boxCatalog.ts) ->
-- applyValueScaledProbabilities / calibrateHouseEdge / normalizePackWeights
-- (src/utils/packProbability.ts), including PACK_FLOOR_OVERRIDES + floor fillers.
--
-- PART 1 of the server-side roll migration: ADDITIVE ONLY. Nothing reads this yet.
-- It exists so a future server-side open_pack RPC can roll off these exact weights
-- without re-implementing the calibration math in SQL (avoids rounding drift).
--
-- Populated by scripts/syncPackWeights.ts (service role). Re-run that script
-- whenever pools / card values / PACK_FLOOR_OVERRIDES change.
-- Apply in the Supabase SQL editor (Dashboard -> SQL) or via the Supabase CLI.
--
-- NOTE: we intentionally do NOT reuse box_items.probability — that column holds the
-- RAW pre-calibration seed weight (e.g. 4.8 from defineItem), not the engine's final
-- normalized post-calibration weight. box_items also has no rows for runtime-generated
-- floor-filler cards (pk-floor-<packId>-NN), and its gem_value can lag pool edits.

create table if not exists public.pack_card_weights (
  id uuid primary key default gen_random_uuid(),
  pack_id text not null,
  catalog_item_id text not null,
  item_name text not null default '',
  store_rarity text not null,
  -- Normalized probability/weight used for the weighted draw (~sums to 100 per pack).
  roll_weight numeric not null check (roll_weight >= 0),
  -- Engine gem value = exactly what the client vaults today (100 gems = $1).
  value_gems integer not null check (value_gems >= 0),
  image_url text not null default '',
  updated_at timestamptz not null default now(),
  unique (pack_id, catalog_item_id)
);

create index if not exists pack_card_weights_pack_id_idx
  on public.pack_card_weights (pack_id);

alter table public.pack_card_weights enable row level security;

-- Drop odds are public (shown on the odds sheet, pre-login included), so reads are
-- open. Writes are service-role only — service_role bypasses RLS and no write policy
-- is granted, so authenticated/anon clients can never mutate weights.
drop policy if exists "pack_card_weights readable" on public.pack_card_weights;
create policy "pack_card_weights readable"
  on public.pack_card_weights
  for select
  using (true);

comment on table public.pack_card_weights is
  'Precomputed per-pack per-card roll weight (normalized probability, ~sums to 100 per pack) and gem value, mirrored from the client roll engine. Single source of truth for the future server-side open_pack RPC. Maintained by scripts/syncPackWeights.ts; additive in Part 1 (nothing reads it yet).';
