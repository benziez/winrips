-- Lock down profiles: authenticated users may read their own row only.
-- Balance, admin, and compliance fields are writable only via security definer RPCs.
-- Run in Supabase SQL editor after profiles table exists.

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- No INSERT/UPDATE/DELETE policies for authenticated — writes go through
-- handle_new_user trigger and security definer RPCs (service role bypasses RLS).

comment on table public.profiles is
  'User profiles. RLS: select own row only; mutations via security definer functions.';
