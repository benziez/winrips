import { isSupabaseConfigured, supabase } from "./supabaseClient";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Writes a daily snapshot of total vault value to Supabase.
 * Called once per app open if no snapshot exists for today's date.
 * Table: portfolio_snapshots (user_id, date, total_value_usd, created_at)
 *
 * Backend NOTE: create table in Supabase before real persistence:
 *   CREATE TABLE portfolio_snapshots (
 *     id uuid default gen_random_uuid() primary key,
 *     user_id uuid references auth.users(id) on delete cascade,
 *     date date not null,
 *     total_value_usd numeric not null,
 *     created_at timestamptz default now(),
 *     unique(user_id, date)
 *   );
 */
export async function writeTodaySnapshotIfMissing(userId: string, totalUsd: number): Promise<void> {
  if (!userId.trim() || !isSupabaseConfigured() || !supabase) return;

  const safeTotal = Number.isFinite(totalUsd) && totalUsd >= 0 ? totalUsd : 0;
  const date = todayIsoDate();

  try {
    const { data: existing, error: readError } = await supabase
      .from("portfolio_snapshots")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (readError) return;
    if (existing) return;

    const { error: insertError } = await supabase
      .from("portfolio_snapshots" as "vault_items")
      .insert({
        user_id: userId,
        date,
        total_value_usd: safeTotal,
      } as never);

    if (insertError) return;
  } catch {
    // Silent failure — graph still works with synthetic data.
  }
}
