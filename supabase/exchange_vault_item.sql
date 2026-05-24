-- Vault item exchange — 65% gem credit back to profiles.gems_balance.
-- Run in Supabase SQL editor after vault_items.sql and process_spin_transaction.sql.

alter table public.vault_items
  drop constraint if exists vault_items_status_check;

alter table public.vault_items
  add constraint vault_items_status_check
  check (status in ('vaulted', 'pending_shipment', 'shipped', 'delivered', 'exchanged'));

create or replace function public.exchange_vault_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item_status text;
  v_gem_value integer;
  v_credit integer;
  v_balance integer;
  v_new_balance integer;
begin
  if p_item_id is null then
    raise exception 'invalid_item_id'
      using errcode = '22023',
            message = 'Vault item id is required.';
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  select user_id, status, gem_value
    into v_user_id, v_item_status, v_gem_value
  from public.vault_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'item_not_found'
      using errcode = 'P0002',
            message = 'Vault item not found.';
  end if;

  if v_user_id <> auth.uid() then
    raise exception 'item_not_owned'
      using errcode = '42501',
            message = 'You do not own this vault item.';
  end if;

  if coalesce(v_item_status, 'vaulted') <> 'vaulted' then
    raise exception 'item_not_exchangeable'
      using errcode = '22023',
            message = 'This item cannot be exchanged.';
  end if;

  if v_gem_value is null or v_gem_value <= 0 then
    raise exception 'invalid_item_value'
      using errcode = '22023',
            message = 'Vault item has no exchange value.';
  end if;

  v_credit := floor(v_gem_value * 0.65);

  if v_credit <= 0 then
    raise exception 'invalid_exchange_credit'
      using errcode = '22023',
            message = 'Exchange credit must be greater than zero.';
  end if;

  select coalesce(gems_balance, 0)
    into v_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'profile_not_found'
      using errcode = 'P0002',
            message = 'User profile not found.';
  end if;

  v_new_balance := v_balance + v_credit;

  update public.profiles
  set gems_balance = v_new_balance
  where id = auth.uid();

  update public.vault_items
  set status = 'exchanged'
  where id = p_item_id;

  return jsonb_build_object(
    'success', true,
    'gems_added', v_credit,
    'gems_balance', v_new_balance,
    'item_id', p_item_id,
    'status', 'exchanged'
  );
end;
$$;

revoke all on function public.exchange_vault_item(uuid) from public;
grant execute on function public.exchange_vault_item(uuid) to authenticated;

comment on function public.exchange_vault_item(uuid) is
  'Credits 65% of gem_value to profiles.gems_balance and marks the vault item as exchanged.';
