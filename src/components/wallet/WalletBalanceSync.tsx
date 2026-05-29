import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { clearLoggedIn } from "../../constants/userSession";
import { fetchUserBalanceSnapshot } from "../../queries/userBalances";
import { queryKeys } from "../../queries/queryKeys";
import { claimPendingReferralIfNeeded } from "../../lib/referrals";

/**
 * Keeps AppContext wallet state aligned with Supabase auth — wipes on sign-out,
 * fetches per authenticated user id via React Query.
 */
export function WalletBalanceSync() {
  const { user, authLoading, isAuthenticated } = useAuth();
  const {
    setBalanceUserId,
    setGoldVolts,
    syncUserProfileFromServer,
    syncVaultFromServer,
    syncGemBalanceFromServer,
    logout,
  } = useApp();

  const userId = user?.id ?? "";

  const { data: balanceSnapshot } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => fetchUserBalanceSnapshot(userId),
    enabled: !authLoading && isAuthenticated && Boolean(userId),
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !userId) {
      clearLoggedIn();
      logout();
      return;
    }

    setBalanceUserId(userId);
    void syncUserProfileFromServer(userId);
    void syncVaultFromServer(userId);
    void claimPendingReferralIfNeeded(userId).then(() => syncGemBalanceFromServer(userId));
  }, [
    authLoading,
    isAuthenticated,
    userId,
    logout,
    setBalanceUserId,
    syncUserProfileFromServer,
    syncVaultFromServer,
    syncGemBalanceFromServer,
  ]);

  useEffect(() => {
    if (!balanceSnapshot) return;
    setGoldVolts(balanceSnapshot.gemBalance);
  }, [balanceSnapshot, setGoldVolts]);

  return null;
}
