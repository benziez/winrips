-- Admin fulfillment — pending shipment queue + mark shipped.
-- Run in Supabase SQL editor after vault_items.sql and profiles setup.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.assert_current_user_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated'
      using errcode = '42501',
            message = 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and coalesce(is_admin, false) = true
  ) then
    raise exception 'not_admin'
      using errcode = '42501',
            message = 'Admin access required.';
  end if;
end;
$$;

create or replace function public.fetch_pending_shipments_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orders jsonb;
begin
  perform public.assert_current_user_admin();

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', vi.id,
        'user_id', vi.user_id,
        'item_name', vi.item_name,
        'image_url', vi.image_url,
        'gem_value', vi.gem_value,
        'shipping_name', vi.shipping_name,
        'shipping_address', vi.shipping_address,
        'created_at', vi.created_at,
        'username', p.username,
        'email', u.email
      )
      order by vi.created_at asc
    ),
    '[]'::jsonb
  )
  into v_orders
  from public.vault_items vi
  left join public.profiles p on p.id = vi.user_id
  left join auth.users u on u.id = vi.user_id
  where vi.status = 'pending_shipment';

  return jsonb_build_object(
    'success', true,
    'orders', v_orders
  );
end;
$$;

create or replace function public.mark_vault_item_shipped(
  p_item_id uuid,
  p_tracking_number text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tracking text;
  v_item_status text;
begin
  perform public.assert_current_user_admin();

  if p_item_id is null then
    raise exception 'invalid_item_id'
      using errcode = '22023',
            message = 'Vault item id is required.';
  end if;

  v_tracking := nullif(trim(p_tracking_number), '');

  if v_tracking is null then
    raise exception 'invalid_tracking_number'
      using errcode = '22023',
            message = 'Tracking number is required.';
  end if;

  select status
    into v_item_status
  from public.vault_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'item_not_found'
      using errcode = 'P0002',
            message = 'Vault item not found.';
  end if;

  if coalesce(v_item_status, 'vaulted') <> 'pending_shipment' then
    raise exception 'item_not_pending'
      using errcode = '22023',
            message = 'This item is not pending shipment.';
  end if;

  update public.vault_items
  set
    status = 'shipped',
    tracking_number = v_tracking
  where id = p_item_id;

  return jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'status', 'shipped',
    'tracking_number', v_tracking
  );
end;
$$;

revoke all on function public.assert_current_user_admin() from public;
revoke all on function public.fetch_pending_shipments_admin() from public;
revoke all on function public.mark_vault_item_shipped(uuid, text) from public;

grant execute on function public.fetch_pending_shipments_admin() to authenticated;
grant execute on function public.mark_vault_item_shipped(uuid, text) to authenticated;

comment on function public.fetch_pending_shipments_admin() is
  'Returns all vault_items pending shipment with buyer profile metadata. Admin only.';

comment on function public.mark_vault_item_shipped(uuid, text) is
  'Marks a pending_shipment vault item as shipped with a tracking number. Admin only.';
