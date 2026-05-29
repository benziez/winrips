-- Align withdrawals.amount column name with deployed schema (amount, not amount_cents).
-- Safe to run if the table already uses amount or amount_cents.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'withdrawals'
      and column_name = 'amount_cents'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'withdrawals'
      and column_name = 'amount'
  ) then
    alter table public.withdrawals rename column amount_cents to amount;
  end if;
end $$;
