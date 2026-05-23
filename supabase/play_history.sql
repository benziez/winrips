-- Play History — run in Supabase SQL editor if the table is not created yet.

create table if not exists public.play_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pack_name text not null,
  spin_cost integer not null check (spin_cost >= 0),
  won_item_name text not null,
  won_item_value integer not null check (won_item_value >= 0),
  won_item_image text not null default '',
  rolled_number double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists play_history_user_id_created_at_idx
  on public.play_history (user_id, created_at desc);

alter table public.play_history enable row level security;

create policy "Users read own play history"
  on public.play_history for select
  using (auth.uid() = user_id);

create policy "Users insert own play history"
  on public.play_history for insert
  with check (auth.uid() = user_id);
