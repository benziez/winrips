-- Daily per-pack open limits on public.boxes + midnight America/New_York reset.
-- Run in Supabase SQL editor after the boxes table exists.
-- Then re-apply supabase/open_pack.sql (daily limit enforcement lives there).

alter table public.boxes
  add column if not exists daily_limit integer,
  add column if not exists opens_today integer not null default 0;

comment on column public.boxes.daily_limit is
  'Maximum pack opens allowed per Eastern calendar day. NULL or 0 = unlimited.';
comment on column public.boxes.opens_today is
  'Opens consumed since the last midnight America/New_York reset.';

alter table public.boxes
  drop constraint if exists boxes_opens_today_nonneg_chk;

alter table public.boxes
  add constraint boxes_opens_today_nonneg_chk check (opens_today >= 0);

-- Seed / refresh daily limits for active Pokémon lobby packs.
update public.boxes set daily_limit = 500, opens_today = coalesce(opens_today, 0)
  where id = 'trainers-starter';

update public.boxes set daily_limit = 200, opens_today = coalesce(opens_today, 0)
  where id in ('mega-evolution', 'shiny-vault', '151-booster-collector', '151-booster');

update public.boxes set daily_limit = 150, opens_today = coalesce(opens_today, 0)
  where id in ('legendary-hunt', 'waifu-vault');

update public.boxes set daily_limit = 100, opens_today = coalesce(opens_today, 0)
  where id in ('prismatic-sir', 'psa-10-chaser', 'evolving-skies');

update public.boxes set daily_limit = 50, opens_today = coalesce(opens_today, 0)
  where id in ('obsidian-vault', 'god-pack-1999', '1999-god');

update public.boxes set daily_limit = 25, opens_today = coalesce(opens_today, 0)
  where id = 'wotc-first-edition';

-- Tracks the last Eastern calendar date we reset counters (prevents double-resets).
create table if not exists public.pack_daily_reset_state (
  id smallint primary key default 1 check (id = 1),
  last_reset_date date not null default '1970-01-01'::date
);

insert into public.pack_daily_reset_state (id, last_reset_date)
values (1, '1970-01-01'::date)
on conflict (id) do nothing;

create or replace function public.reset_daily_pack_opens_at_midnight_eastern()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/New_York', now()))::date;
  v_hour integer := extract(hour from timezone('America/New_York', now()))::integer;
  v_did_reset boolean := false;
begin
  -- Only act during the midnight hour in America/New_York (handles EST/EDT).
  if v_hour <> 0 then
    return;
  end if;

  update public.pack_daily_reset_state
  set last_reset_date = v_today
  where id = 1
    and last_reset_date < v_today
  returning true into v_did_reset;

  if coalesce(v_did_reset, false) then
    update public.boxes
    set opens_today = 0
    where coalesce(daily_limit, 0) > 0;
  end if;
end;
$$;

revoke all on function public.reset_daily_pack_opens_at_midnight_eastern() from public;
grant execute on function public.reset_daily_pack_opens_at_midnight_eastern() to postgres;

-- pg_cron: enable in Supabase Dashboard → Database → Extensions if not already on.
-- Runs at :05 past every hour; the function no-ops unless it's midnight Eastern.
do $$
begin
  create extension if not exists pg_cron with schema extensions;
exception
  when others then
    raise notice 'Could not create pg_cron extension: %', SQLERRM;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'reset-daily-pack-opens') then
    perform cron.unschedule('reset-daily-pack-opens');
  end if;

  perform cron.schedule(
    'reset-daily-pack-opens',
    '5 * * * *',
    $$select public.reset_daily_pack_opens_at_midnight_eastern()$$
  );
exception
  when undefined_table then
    raise notice 'pg_cron not available — enable the extension and schedule reset_daily_pack_opens_at_midnight_eastern() manually.';
  when insufficient_privilege then
    raise notice 'Insufficient privilege for pg_cron — schedule reset_daily_pack_opens_at_midnight_eastern() via Dashboard.';
  when others then
    raise notice 'Could not schedule daily reset job: %', SQLERRM;
end;
$$;
