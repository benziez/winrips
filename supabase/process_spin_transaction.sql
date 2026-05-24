-- Secure server-side gem deduction for pack spins (debug-friendly, step-tagged responses).
-- Run in Supabase SQL editor (Dashboard → SQL) or via Supabase CLI migrations.
--
-- DEBUG FLOW:
--   1. RAISE NOTICE logs incoming params (visible in Supabase Logs → Postgres).
--   2. Block 1 deducts gems only.
--   3. On gem success, returns {"success": true, "step": "gems_deducted"}.
--   4. Comment out that early return to enable Block 2 (vault registration).
--      Vault failures return {"success": false, "step": "vault_failed", "error": ...}.

alter table public.profiles
  add column if not exists gems_balance integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_gems_balance_check;

create or replace function public.process_spin_transaction(
  p_user_id uuid,
  p_spin_cost integer,
  p_box_id text default null,
  p_catalog_item_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_new_balance integer;
  v_pull record;
  v_vault_item_id uuid;
  v_rarity text;
begin
  -- 1. Log incoming params (check Supabase Dashboard → Logs → Postgres).
  raise notice
    'process_spin_transaction received p_user_id=%, p_spin_cost=%, p_box_id=%, p_catalog_item_id=%',
    p_user_id,
    p_spin_cost,
    p_box_id,
    p_catalog_item_id;

  if p_spin_cost is null or p_spin_cost <= 0 then
    return jsonb_build_object(
      'success', false,
      'step', 'gems_failed',
      'error', 'Invalid spin cost',
      'code', 'invalid_spin_cost'
    );
  end if;

  if auth.uid() is null then
    return jsonb_build_object(
      'success', false,
      'step', 'gems_failed',
      'error', 'Authentication required',
      'code', 'not_authenticated'
    );
  end if;

  if auth.uid() <> p_user_id then
    return jsonb_build_object(
      'success', false,
      'step', 'gems_failed',
      'error', 'Cannot charge spins for another user',
      'code', 'user_mismatch'
    );
  end if;

  -- ============================================================
  -- BLOCK 1: GEM DEDUCTION (standalone — not nested with vault)
  -- ============================================================
  begin
    select coalesce(gems_balance, 0)
      into v_balance
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
      return jsonb_build_object(
        'success', false,
        'step', 'gems_failed',
        'error', 'User profile not found',
        'code', 'profile_not_found'
      );
    end if;

    if v_balance < p_spin_cost then
      return jsonb_build_object(
        'success', false,
        'step', 'gems_failed',
        'error', 'Insufficient gems',
        'code', 'insufficient_gems',
        'gems_balance', v_balance
      );
    end if;

    v_new_balance := v_balance - p_spin_cost;

    update public.profiles
    set gems_balance = v_new_balance
    where id = p_user_id;
  exception
    when others then
      return jsonb_build_object(
        'success', false,
        'step', 'gems_failed',
        'error', SQLERRM
      );
  end;

  -- 3. Gem deduction succeeded — return this to confirm balance update works.
  --    Comment out the next line once gems deduct correctly and you want vault testing.
  return jsonb_build_object('success', true, 'step', 'gems_deducted');

  -- ============================================================
  -- BLOCK 2: VAULT REGISTRATION (standalone — runs only after Block 1)
  -- ============================================================
  if p_box_id is null or p_catalog_item_id is null then
    return jsonb_build_object(
      'success', true,
      'step', 'complete',
      'gems_balance', v_new_balance
    );
  end if;

  begin
    select
      item_id,
      item_name,
      store_rarity,
      gem_value,
      image_url
      into v_pull
    from public.box_items
    where box_id = p_box_id
      and item_id = p_catalog_item_id
    limit 1;

    if not found then
      return jsonb_build_object(
        'success', false,
        'step', 'vault_failed',
        'error', 'Pull item is not valid for this box',
        'code', 'invalid_pull_item',
        'gems_balance', v_new_balance
      );
    end if;

    v_rarity := case
      when v_pull.store_rarity in ('Mythic', 'Legendary') then 'Ancient Rare'
      when v_pull.store_rarity in ('Epic', 'Rare') then 'Rare'
      else 'Common'
    end;

    insert into public.vault_items (
      user_id,
      item_id,
      item_name,
      rarity,
      gem_value,
      image_url,
      status
    )
    values (
      p_user_id,
      v_pull.item_id,
      v_pull.item_name,
      v_rarity,
      v_pull.gem_value,
      coalesce(v_pull.image_url, ''),
      'vaulted'
    )
    returning id into v_vault_item_id;
  exception
    when others then
      -- 4. Vault registration failed after gems were already deducted.
      return jsonb_build_object(
        'success', false,
        'step', 'vault_failed',
        'error', SQLERRM,
        'gems_balance', v_new_balance
      );
  end;

  return jsonb_build_object(
    'success', true,
    'step', 'complete',
    'gems_balance', v_new_balance,
    'vault_item_id', v_vault_item_id
  );
end;
$$;

revoke all on function public.process_spin_transaction(uuid, integer, text, text) from public;
grant execute on function public.process_spin_transaction(uuid, integer, text, text) to authenticated;

comment on function public.process_spin_transaction(uuid, integer, text, text) is
  'Debug-friendly spin RPC: separate gem deduction and vault registration blocks with step-tagged JSON responses.';
