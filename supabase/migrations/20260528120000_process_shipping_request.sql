-- Redeploy process_shipping_request: use pending_shipment (not shipping_requested).

alter table public.vault_items
  add column if not exists status text not null default 'vaulted',
  add column if not exists shipping_name text,
  add column if not exists shipping_address text,
  add column if not exists tracking_number text;

alter table public.vault_items
  drop constraint if exists vault_items_status_check;

alter table public.vault_items
  add constraint vault_items_status_check
  check (
    status in (
      'vaulted',
      'pending_shipment',
      'shipped',
      'delivered',
      'exchanged',
      'upgraded_lost'
    )
  );

create or replace function public.process_shipping_request(
  param_item_id uuid,
  p_name text,
  p_address text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item_status text;
  v_balance integer;
  v_new_balance integer;
  v_name text;
  v_address text;
  v_shipping_cost constant integer := 2500;
begin
  if param_item_id is null then
    raise exception 'invalid_item_id'
      using errcode = '22023',
            message = 'Vault item id is required.';
  end if;

  v_name := nullif(trim(p_name), '');
  v_address := nullif(trim(p_address), '');

  if v_name is null or v_address is null then
    raise exception 'invalid_shipping_details'
      using errcode = '22023',
            message = 'Shipping name and address are required.';
  end if;

  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  select user_id, status
    into v_user_id, v_item_status
  from public.vault_items
  where id = param_item_id
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
    raise exception 'item_not_shippable'
      using errcode = '22023',
            message = 'This item is not available for shipping.';
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

  if v_balance < v_shipping_cost then
    raise exception 'insufficient_gems'
      using errcode = 'P0001',
            message = 'Insufficient gems for shipping.';
  end if;

  v_new_balance := v_balance - v_shipping_cost;

  update public.profiles
  set
    gems_balance = v_new_balance,
    withdrawable_balance = least(coalesce(withdrawable_balance, 0), v_new_balance)
  where id = auth.uid();

  update public.vault_items
  set
    status = 'pending_shipment',
    shipping_name = v_name,
    shipping_address = v_address
  where id = param_item_id;

  return jsonb_build_object(
    'success', true,
    'gems_balance', v_new_balance,
    'item_id', param_item_id,
    'status', 'pending_shipment'
  );
end;
$$;

revoke all on function public.process_shipping_request(uuid, text, text) from public;
grant execute on function public.process_shipping_request(uuid, text, text) to authenticated;

comment on function public.process_shipping_request(uuid, text, text) is
  'Charges 2,500 shipping gems, marks a vaulted item pending_shipment, and stores fulfillment address.';
