-- Withdrawal balance split + Stripe Connect account id on profiles.
-- Apply via Supabase SQL editor before updated RPCs and debit_withdrawal.sql.

alter table public.profiles
  add column if not exists withdrawable_balance integer not null default 0;

alter table public.profiles
  add column if not exists stripe_connect_account_id text;

comment on column public.profiles.withdrawable_balance is
  'Gems from card sales/exchanges only (100 gems = $1). Must be <= gems_balance.';

comment on column public.profiles.stripe_connect_account_id is
  'Stripe Connect Express account id for withdrawals.';
