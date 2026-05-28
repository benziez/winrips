-- Apple-compliant account deletion — explicit user data wipe before auth.admin.deleteUser.
-- Run in Supabase SQL editor (Dashboard → SQL).

create or replace function public.delete_account_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_count integer;
begin
  if target_user_id is null then
    raise exception 'invalid_user_id'
      using errcode = '22023',
            message = 'User id is required.';
  end if;

  select count(*)::integer
    into pending_count
    from public.vault_items
  where user_id = target_user_id
    and status in ('pending_shipment');

  if pending_count > 0 then
    raise exception 'pending_shipment'
      using errcode = 'P0001',
            message = 'Cannot delete account while a physical shipment is in progress.',
            detail = 'pending_shipment';
  end if;

  delete from public.battle_pulls
  where user_id = target_user_id;

  delete from public.battle_participants
  where user_id = target_user_id;

  update public.battles
  set winner_id = null
  where winner_id = target_user_id;

  delete from public.play_history
  where user_id = target_user_id;

  delete from public.vault_items
  where user_id = target_user_id;

  delete from public.profiles
  where id = target_user_id;
end;
$$;

revoke all on function public.delete_account_for_user(uuid) from public;
revoke all on function public.delete_account_for_user(uuid) from anon;
revoke all on function public.delete_account_for_user(uuid) from authenticated;

grant execute on function public.delete_account_for_user(uuid) to service_role;

comment on function public.delete_account_for_user(uuid) is
  'Deletes all app data for a user in one transaction. Raises pending_shipment if vault fulfillment is active.';
