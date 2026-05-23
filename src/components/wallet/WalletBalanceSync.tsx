import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { clearLoggedIn } from "../../constants/userSession";

/**
 * Keeps AppContext wallet state aligned with Supabase auth — wipes on sign-out,
 * fetches per authenticated user id only.
 */
export function WalletBalanceSync() {
  const { user, authLoading, isAuthenticated } = useAuth();
  const {
    setBalanceUserId,
    syncGemBalanceFromServer,
    syncUserProfileFromServer,
    syncVaultFromServer,
    logout,
  } = useApp();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      clearLoggedIn();
      logout();
      return;
    }

    setBalanceUserId(user.id);
    void syncGemBalanceFromServer(user.id);
    void syncUserProfileFromServer(user.id);
    void syncVaultFromServer(user.id);
  }, [
    authLoading,
    isAuthenticated,
    user?.id,
    logout,
    setBalanceUserId,
    syncGemBalanceFromServer,
    syncUserProfileFromServer,
    syncVaultFromServer,
  ]);

  return null;
}
