import { queryKeys } from "../queries/queryKeys";
import { fetchUserBalances, resolveSyncedGemBalance } from "./userBalances";
import { queryClient } from "./queryClient";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RefreshWalletAfterDepositOptions {
  userId: string;
  previousGemBalance: number;
  expectedIncreaseGems: number;
  /** Apply fetched balances to React state. */
  applyBalances: (gems: number, withdrawableBalance: number, sweepsBalance: number) => void;
  /** When the server returns an authoritative post-credit balance, skip polling. */
  knownNewBalance?: number | null;
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * After a Stripe deposit, poll profiles until gems reflect the credit (webhook may lag).
 * Also invalidates the React Query user snapshot so WalletBalanceSync stays aligned.
 */
export async function refreshWalletAfterDeposit(
  options: RefreshWalletAfterDepositOptions,
): Promise<number> {
  const {
    userId,
    previousGemBalance,
    expectedIncreaseGems,
    applyBalances,
    knownNewBalance,
    timeoutMs = 20_000,
    intervalMs = 800,
  } = options;

  const targetBalance = previousGemBalance + expectedIncreaseGems;

  if (
    typeof knownNewBalance === "number" &&
    Number.isFinite(knownNewBalance) &&
    knownNewBalance >= targetBalance
  ) {
    applyBalances(knownNewBalance, knownNewBalance, 0);
    await queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
    return knownNewBalance;
  }

  await queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const balances = await fetchUserBalances(userId);
    const gems = resolveSyncedGemBalance(
      balances.gemBalance,
      balances.gemBalanceFromProfile,
    );
    applyBalances(
      gems,
      Math.min(balances.withdrawableBalance, gems),
      balances.sweepsBalance,
    );

    if (gems >= targetBalance) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
      return gems;
    }

    await sleep(intervalMs);
  }

  const balances = await fetchUserBalances(userId);
  const gems = resolveSyncedGemBalance(
    balances.gemBalance,
    balances.gemBalanceFromProfile,
  );
  applyBalances(
    gems,
    Math.min(balances.withdrawableBalance, gems),
    balances.sweepsBalance,
  );
  await queryClient.invalidateQueries({ queryKey: queryKeys.user(userId) });
  return gems;
}
