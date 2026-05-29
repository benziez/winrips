-- In-app customer support tickets. Apply in Supabase SQL editor (Dashboard -> SQL).

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  subject text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_created_at_idx
  on public.support_tickets (user_id, created_at desc);

alter table public.support_tickets enable row level security;

drop policy if exists "Users insert own support tickets" on public.support_tickets;
create policy "Users insert own support tickets"
  on public.support_tickets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on table public.support_tickets is
  'Customer support messages submitted from the mobile settings form. Service role reads for ops; authenticated users may only insert their own rows.';
