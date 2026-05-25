import { fetchUserBalances, resolveSyncedGemBalance } from "../lib/userBalances";

export interface UserBalanceSnapshot {
  gemBalance: number;
  sweepsBalance: number;
}

export async function fetchUserBalanceSnapshot(userId: string): Promise<UserBalanceSnapshot> {
  const balances = await fetchUserBalances(userId);
  return {
    gemBalance: resolveSyncedGemBalance(balances.gemBalance, balances.gemBalanceFromProfile),
    sweepsBalance: balances.sweepsBalance,
  };
}
