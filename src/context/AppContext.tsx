import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { parseAppPath, parseBattleIdFromPath, pathForView } from "../constants/appRoutes";
import type { FooterPageSlug } from "../constants/footerContent";
import {
  infoPathForSlug,
  parseInfoPath,
} from "../constants/footerContent";
import { clearLoggedIn, persistLoggedIn } from "../constants/userSession";
import {
  persistActiveCurrency,
  readPersistedActiveCurrency,
  DAILY_BONUS_GEMS,
  STARTER_GEMS_CLAIM_KEY,
  STARTER_GEMS_GRANT,
} from "../constants/dualCurrency";
import type { AppView, AuthModalMode, Currency, Pack, VaultedCard } from "../types";
import type { WalletModalTab } from "../types/wallet";
import { fetchUserBalances, resolveSyncedGemBalance } from "../lib/userBalances";
import { fetchProfileUsername } from "../lib/userProfile";
import {
  fetchUserVaultInventory,
  persistVaultAdd,
  persistVaultRemove,
} from "../lib/userVault";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

interface AppState {
  isLoggedIn: boolean;
  currentView: AppView;
  infoPageSlug: FooterPageSlug | null;
  walletConnected: boolean;
  activeCurrency: Currency;
  goldVolts: number;
  gemBalanceLoading: boolean;
  sweepsCash: number;
  selectedPack: Pack | null;
  mobileMenuOpen: boolean;
  shippingModalOpen: boolean;
  purchaseModalOpen: boolean;
  /** True when Gem Refill was opened from the wallet modal (shows back to overview). */
  purchaseOpenedFromWallet: boolean;
  depositModalOpen: boolean;
  walletModalOpen: boolean;
  walletModalTab: WalletModalTab;
  userId: string;
  profileUsername: string | null;
  profileLoading: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  cashoutToast: string | null;
  toastVariant: "default" | "deposit" | "error";
  vaultItems: VaultedCard[];
  vaultItemsLoading: boolean;
  shippingVaultItem: VaultedCard | null;
  selectedBattleId: string | null;
}

function normalizeView(view: AppView): AppView {
  return view === "inventory" ? "vault" : view;
}

function readInitialBattleId(): string | null {
  return parseBattleIdFromPath(window.location.pathname);
}

function readInitialView(): AppView {
  const infoSlug = parseInfoPath(window.location.pathname);
  if (infoSlug) return "lobby";
  return parseAppPath(window.location.pathname) ?? "lobby";
}

interface AppContextValue extends AppState {
  /** @deprecated use currentView */
  view: AppView;
  navigateToView: (view: AppView) => void;
  navigateToBattle: (battleId: string) => void;
  setView: (view: AppView) => void;
  goToLobby: () => void;
  infoPageSlug: FooterPageSlug | null;
  openInfoPage: (slug: FooterPageSlug) => void;
  toggleWallet: () => void;
  setActiveCurrency: (currency: Currency) => void;
  selectPack: (pack: Pack) => void;
  deductPackCost: (cost: number, quantity: number) => boolean;
  addSweepsCash: (amount: number) => void;
  addGoldVolts: (amount: number) => void;
  setGoldVolts: (balance: number) => void;
  syncGemBalanceFromServer: (authUserId?: string) => Promise<void>;
  syncUserProfileFromServer: (authUserId?: string) => Promise<void>;
  syncVaultFromServer: (authUserId?: string) => Promise<void>;
  setBalanceUserId: (authUserId: string | null) => void;
  resetWalletBalances: () => void;
  logout: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setShippingModalOpen: (open: boolean) => void;
  setPurchaseModalOpen: (open: boolean) => void;
  openGemRefillFromWallet: () => void;
  backToWalletFromGemRefill: () => void;
  setDepositModalOpen: (open: boolean) => void;
  openWalletModal: (tab?: WalletModalTab) => void;
  closeWalletModal: () => void;
  claimStarterGems: () => boolean;
  claimDailyBonusGems: () => boolean;
  completeLogin: () => void;
  openAuthModal: (mode: AuthModalMode, options?: { keepPurchaseModalOpen?: boolean }) => void;
  setAuthModalOpen: (open: boolean) => void;
  showCashoutToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showDepositSuccessToast: (gemsAdded: number) => void;
  clearCashoutToast: () => void;
  vaultItems: VaultedCard[];
  shippingVaultItem: VaultedCard | null;
  openVaultShipping: (card: VaultedCard) => void;
  closeVaultShipping: () => void;
  markVaultItemPendingShipment: (
    vaultId: string,
    shippingName: string,
    shippingAddress: string,
  ) => void;
  applyVaultExchange: (vaultId: string, gemsAdded: number, serverGemsBalance?: number) => void;
  removeVaultCard: (vaultId: string) => void;
  addVaultCard: (card: VaultedCard) => void;
  appendVaultPullFromSpin: (card: VaultedCard) => void;
  setSpinInProgress: (active: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readInfoSlugFromLocation(): FooterPageSlug | null {
  return parseInfoPath(window.location.pathname);
}

const INITIAL_STATE: AppState = {
  isLoggedIn: false,
  currentView: readInitialView(),
  infoPageSlug: readInfoSlugFromLocation(),
  walletConnected: false,
  activeCurrency:
    typeof window !== "undefined" ? readPersistedActiveCurrency() : "gold-volts",
  goldVolts: 0,
  gemBalanceLoading: false,
  sweepsCash: 0,
  selectedPack: null,
  mobileMenuOpen: false,
  shippingModalOpen: false,
  purchaseModalOpen: false,
  purchaseOpenedFromWallet: false,
  depositModalOpen: false,
  walletModalOpen: false,
  walletModalTab: "overview",
  userId: "",
  profileUsername: null,
  profileLoading: false,
  authModalOpen: false,
  authModalMode: "login",
  cashoutToast: null,
  toastVariant: "default",
  vaultItems: [],
  vaultItemsLoading: false,
  shippingVaultItem: null,
  selectedBattleId: readInitialBattleId(),
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const spinInProgressRef = useRef(false);

  useEffect(() => {
    const syncFromUrl = () => {
      const slug = readInfoSlugFromLocation();
      if (slug) {
        setState((s) => ({ ...s, infoPageSlug: slug, currentView: "lobby" }));
        return;
      }
      const battleId = parseBattleIdFromPath(window.location.pathname);
      if (battleId) {
        setState((s) => ({
          ...s,
          infoPageSlug: null,
          currentView: "battle-arena",
          selectedBattleId: battleId,
        }));
        return;
      }
      const view = parseAppPath(window.location.pathname);
      if (view) {
        setState((s) => ({
          ...s,
          infoPageSlug: null,
          currentView: view,
          selectedBattleId: null,
        }));
      }
    };

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const navigateToView = useCallback((nextView: AppView) => {
    const currentView = normalizeView(nextView);
    const path = pathForView(currentView);
    window.history.pushState({ view: currentView }, "", path);
    setState((s) => ({
      ...s,
      currentView,
      infoPageSlug: null,
      selectedBattleId: null,
      selectedPack: currentView === "pack-open" ? s.selectedPack : null,
      mobileMenuOpen: false,
      shippingModalOpen: false,
      shippingVaultItem: null,
    }));
    window.scrollTo(0, 0);
  }, []);

  const navigateToBattle = useCallback((battleId: string) => {
    const normalizedId = battleId.trim();
    if (!normalizedId) return;

    const path = pathForView("battle-arena", normalizedId);
    window.history.pushState({ view: "battle-arena", battleId: normalizedId }, "", path);
    setState((s) => ({
      ...s,
      currentView: "battle-arena",
      selectedBattleId: normalizedId,
      infoPageSlug: null,
      selectedPack: null,
      mobileMenuOpen: false,
      shippingModalOpen: false,
      shippingVaultItem: null,
    }));
    window.scrollTo(0, 0);
  }, []);

  const setView = navigateToView;

  const goToLobby = useCallback(() => {
    if (readInfoSlugFromLocation()) {
      window.history.pushState({}, "", "/");
    }
    setState((s) => ({
      ...s,
      currentView: "lobby",
      infoPageSlug: null,
      selectedPack: null,
      mobileMenuOpen: false,
      shippingModalOpen: false,
    }));
    window.scrollTo(0, 0);
  }, []);

  const openInfoPage = useCallback((slug: FooterPageSlug) => {
    const path = infoPathForSlug(slug);
    window.history.pushState({ infoSlug: slug }, "", path);
    setState((s) => ({
      ...s,
      infoPageSlug: slug,
      currentView: "lobby",
      selectedPack: null,
      mobileMenuOpen: false,
      shippingModalOpen: false,
    }));
    window.scrollTo(0, 0);
  }, []);

  const toggleWallet = useCallback(() => {
    setState((s) => ({ ...s, walletConnected: !s.walletConnected }));
  }, []);

  const setActiveCurrency = useCallback((activeCurrency: Currency) => {
    persistActiveCurrency(activeCurrency);
    setState((s) => ({ ...s, activeCurrency }));
  }, []);

  const selectPack = useCallback((pack: Pack) => {
    setState((s) => ({
      ...s,
      selectedPack: pack,
      currentView: "pack-open",
      mobileMenuOpen: false,
    }));
  }, []);

  const deductPackCost = useCallback((cost: number, quantity: number): boolean => {
    const total = cost * quantity;
    let success = false;

    setState((s) => {
      if (s.goldVolts < total) {
        return s;
      }
      success = true;
      return { ...s, goldVolts: s.goldVolts - total };
    });

    return success;
  }, []);

  const addSweepsCash = useCallback((amount: number) => {
    setState((s) => ({ ...s, sweepsCash: s.sweepsCash + amount }));
  }, []);

  const addGoldVolts = useCallback((amount: number) => {
    setState((s) => ({ ...s, goldVolts: s.goldVolts + amount }));
  }, []);

  const setGoldVolts = useCallback((balance: number) => {
    const parsed = Number(balance);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setState((s) => ({ ...s, goldVolts: Math.round(parsed) }));
  }, []);

  const resetWalletBalances = useCallback(() => {
    setState((s) => ({
      ...s,
      goldVolts: 0,
      sweepsCash: 0,
      gemBalanceLoading: false,
      userId: "",
      profileUsername: null,
      profileLoading: false,
      isLoggedIn: false,
      vaultItems: [],
      vaultItemsLoading: false,
      shippingVaultItem: null,
    }));
  }, []);

  const setBalanceUserId = useCallback((authUserId: string | null) => {
    setState((s) => ({
      ...s,
      userId: authUserId ?? "",
      isLoggedIn: Boolean(authUserId),
    }));
    if (authUserId) {
      persistLoggedIn();
    }
  }, []);

  const syncGemBalanceFromServer = useCallback(async (authUserId?: string) => {
    const userId = authUserId ?? state.userId;
    if (!userId) {
      setState((s) => ({
        ...s,
        goldVolts: 0,
        sweepsCash: 0,
        gemBalanceLoading: false,
      }));
      return;
    }

    setState((s) => ({ ...s, gemBalanceLoading: true, userId }));

    try {
      const balances = await fetchUserBalances(userId);
      setState((s) => ({
        ...s,
        goldVolts: resolveSyncedGemBalance(
          balances.gemBalance,
          balances.gemBalanceFromProfile,
        ),
        sweepsCash: balances.sweepsBalance,
        gemBalanceLoading: false,
      }));
    } catch {
      setState((s) => ({
        ...s,
        gemBalanceLoading: false,
      }));
    }
  }, [state.userId]);

  const syncUserProfileFromServer = useCallback(async (authUserId?: string) => {
    const userId = authUserId ?? state.userId;
    if (!userId) {
      setState((s) => ({
        ...s,
        profileUsername: null,
        profileLoading: false,
      }));
      return;
    }

    setState((s) => ({ ...s, profileLoading: true, userId }));

    try {
      const username = await fetchProfileUsername(userId);
      setState((s) => ({
        ...s,
        profileUsername: username,
        profileLoading: false,
      }));
    } catch {
      setState((s) => ({
        ...s,
        profileUsername: null,
        profileLoading: false,
      }));
    }
  }, [state.userId]);

  const syncVaultFromServer = useCallback(async (authUserId?: string) => {
    if (spinInProgressRef.current) {
      if (import.meta.env.DEV) {
        console.warn("[vault] Skipping server sync while a spin is in progress.");
      }
      return;
    }

    const userId = authUserId ?? state.userId;
    if (!userId) {
      setState((s) => ({
        ...s,
        vaultItems: [],
        vaultItemsLoading: false,
      }));
      return;
    }

    setState((s) => ({ ...s, vaultItemsLoading: true, userId }));

    try {
      const items = await fetchUserVaultInventory(userId);
      setState((s) => {
        if (spinInProgressRef.current) {
          return { ...s, vaultItemsLoading: false };
        }
        if (items.length === 0 && s.vaultItems.length > 0) {
          if (import.meta.env.DEV) {
            console.warn("[vault] Ignoring empty vault fetch — keeping local vault state.");
          }
          return { ...s, vaultItemsLoading: false };
        }
        return {
          ...s,
          vaultItems: items,
          vaultItemsLoading: false,
        };
      });
    } catch {
      setState((s) => ({
        ...s,
        vaultItemsLoading: false,
      }));
    }
  }, [state.userId]);

  const logout = useCallback(() => {
    clearLoggedIn();
    resetWalletBalances();
  }, [resetWalletBalances]);

  const setMobileMenuOpen = useCallback((mobileMenuOpen: boolean) => {
    setState((s) => ({ ...s, mobileMenuOpen }));
  }, []);

  const setShippingModalOpen = useCallback((shippingModalOpen: boolean) => {
    setState((s) => ({ ...s, shippingModalOpen }));
  }, []);

  const setPurchaseModalOpen = useCallback((purchaseModalOpen: boolean) => {
    setState((s) => {
      if (purchaseModalOpen && !s.isLoggedIn) {
        return {
          ...s,
          authModalOpen: true,
          authModalMode: "login",
          purchaseModalOpen: false,
          purchaseOpenedFromWallet: false,
        };
      }
      if (!purchaseModalOpen) {
        return { ...s, purchaseModalOpen: false, purchaseOpenedFromWallet: false };
      }
      return { ...s, purchaseModalOpen: true, purchaseOpenedFromWallet: false };
    });
  }, []);

  const openGemRefillFromWallet = useCallback(() => {
    setState((s) => {
      if (!s.isLoggedIn) {
        return {
          ...s,
          authModalOpen: true,
          authModalMode: "login",
          purchaseModalOpen: false,
          purchaseOpenedFromWallet: false,
        };
      }
      return {
        ...s,
        walletModalOpen: false,
        purchaseModalOpen: true,
        purchaseOpenedFromWallet: true,
      };
    });
  }, []);

  const backToWalletFromGemRefill = useCallback(() => {
    setState((s) => ({
      ...s,
      purchaseModalOpen: false,
      purchaseOpenedFromWallet: false,
      walletModalOpen: true,
      walletModalTab: "overview",
    }));
  }, []);

  const setDepositModalOpen = useCallback((depositModalOpen: boolean) => {
    setState((s) => {
      if (depositModalOpen && !s.isLoggedIn) {
        return {
          ...s,
          authModalOpen: true,
          authModalMode: "login",
          depositModalOpen: false,
        };
      }
      return {
        ...s,
        depositModalOpen,
        purchaseModalOpen: depositModalOpen ? false : s.purchaseModalOpen,
        purchaseOpenedFromWallet: depositModalOpen ? false : s.purchaseOpenedFromWallet,
        walletModalOpen: depositModalOpen ? false : s.walletModalOpen,
      };
    });
  }, []);

  const openWalletModal = useCallback((tab: WalletModalTab = "overview") => {
    setState((s) => {
      if (!s.isLoggedIn) {
        return {
          ...s,
          authModalOpen: true,
          authModalMode: "login",
          walletModalOpen: false,
        };
      }
      return {
        ...s,
        walletModalOpen: true,
        walletModalTab: tab,
        purchaseModalOpen: false,
        purchaseOpenedFromWallet: false,
        depositModalOpen: false,
      };
    });
  }, []);

  const closeWalletModal = useCallback(() => {
    setState((s) => ({ ...s, walletModalOpen: false }));
  }, []);

  const claimStarterGems = useCallback((): boolean => {
    let granted = false;
    setState((s) => {
      if (s.goldVolts >= 10) return s;
      try {
        if (localStorage.getItem(STARTER_GEMS_CLAIM_KEY) === "1") return s;
        localStorage.setItem(STARTER_GEMS_CLAIM_KEY, "1");
      } catch {
        return s;
      }
      granted = true;
      return { ...s, goldVolts: s.goldVolts + STARTER_GEMS_GRANT };
    });
    return granted;
  }, []);

  const claimDailyBonusGems = useCallback((): boolean => {
    let granted = false;
    setState((s) => {
      granted = true;
      return { ...s, goldVolts: s.goldVolts + DAILY_BONUS_GEMS };
    });
    return granted;
  }, []);

  const completeLogin = useCallback(() => {
    /** UI-only mock login — real balances require Supabase auth via WalletBalanceSync. */
    persistLoggedIn();
    setState((s) => ({ ...s, isLoggedIn: true }));
  }, []);

  const openAuthModal = useCallback(
    (authModalMode: AuthModalMode, options?: { keepPurchaseModalOpen?: boolean }) => {
      setState((s) => ({
        ...s,
        authModalOpen: true,
        authModalMode,
        purchaseModalOpen: options?.keepPurchaseModalOpen ? s.purchaseModalOpen : false,
        purchaseOpenedFromWallet: options?.keepPurchaseModalOpen
          ? s.purchaseOpenedFromWallet
          : false,
        mobileMenuOpen: false,
      }));
    },
    [],
  );

  const setAuthModalOpen = useCallback((authModalOpen: boolean) => {
    setState((s) => ({ ...s, authModalOpen }));
  }, []);

  const showCashoutToast = useCallback((cashoutToast: string) => {
    setState((s) => ({ ...s, cashoutToast, toastVariant: "default" }));
    setTimeout(() => {
      setState((s) => ({ ...s, cashoutToast: null, toastVariant: "default" }));
    }, 4000);
  }, []);

  const showErrorToast = useCallback((cashoutToast: string) => {
    setState((s) => ({ ...s, cashoutToast, toastVariant: "error" }));
    setTimeout(() => {
      setState((s) => ({ ...s, cashoutToast: null, toastVariant: "default" }));
    }, 4500);
  }, []);

  const showDepositSuccessToast = useCallback((gemsAdded: number) => {
    const amount = Math.max(0, Math.round(gemsAdded));
    const cashoutToast = `💎 Success! ${amount.toLocaleString()} Gems have been credited to your locker.`;
    setState((s) => ({ ...s, cashoutToast, toastVariant: "deposit" }));
    setTimeout(() => {
      setState((s) => ({ ...s, cashoutToast: null, toastVariant: "default" }));
    }, 5500);
  }, []);

  const clearCashoutToast = useCallback(() => {
    setState((s) => ({ ...s, cashoutToast: null, toastVariant: "default" }));
  }, []);

  const openVaultShipping = useCallback((card: VaultedCard) => {
    if (card.status === "pending_shipment") return;
    setState((s) => ({ ...s, shippingVaultItem: card }));
  }, []);

  const closeVaultShipping = useCallback(() => {
    setState((s) => ({ ...s, shippingVaultItem: null }));
  }, []);

  const markVaultItemPendingShipment = useCallback(
    (vaultId: string, shippingName: string, shippingAddress: string) => {
      setState((s) => ({
        ...s,
        vaultItems: s.vaultItems.map((item) =>
          item.vaultId === vaultId
            ? {
                ...item,
                status: "pending_shipment",
                shippingName,
                shippingAddress,
              }
            : item,
        ),
      }));
    },
    [],
  );

  const setSpinInProgress = useCallback((active: boolean) => {
    spinInProgressRef.current = active;
  }, []);

  const appendVaultPullFromSpin = useCallback((card: VaultedCard) => {
    setState((s) => {
      if (s.vaultItems.some((item) => item.vaultId === card.vaultId)) {
        return s;
      }
      return { ...s, vaultItems: [card, ...s.vaultItems] };
    });
  }, []);

  const removeVaultCard = useCallback((vaultId: string) => {
    setState((s) => {
      const userId = s.userId;
      if (userId) {
        void persistVaultRemove(userId, vaultId)
          .then((items) => setState((current) => ({ ...current, vaultItems: items })))
          .catch(() => undefined);
      }
      return {
        ...s,
        vaultItems: s.vaultItems.filter((c) => c.vaultId !== vaultId),
      };
    });
  }, []);

  const addVaultCard = useCallback((card: VaultedCard) => {
    setState((s) => {
      const userId = s.userId;
      if (userId && !spinInProgressRef.current) {
        void persistVaultAdd(userId, card)
          .then((items) => {
            if (spinInProgressRef.current) return;
            setState((current) => ({ ...current, vaultItems: items }));
          })
          .catch(() => undefined);
      }
      return { ...s, vaultItems: [card, ...s.vaultItems] };
    });
  }, []);

  const applyVaultExchange = useCallback(
    (vaultId: string, gemsAdded: number, serverGemsBalance?: number) => {
      setState((s) => {
        const currentBalance = s.goldVolts;
        const normalizedAdded = Math.max(0, Math.round(gemsAdded));
        const hasServerBalance =
          serverGemsBalance != null &&
          Number.isFinite(serverGemsBalance) &&
          serverGemsBalance > 0;
        const newBalance = hasServerBalance
          ? Math.round(serverGemsBalance)
          : currentBalance + normalizedAdded;

        console.log("[applyVaultExchange] balance update:", {
          currentBalance,
          gemsAdded: normalizedAdded,
          serverGemsBalance,
          newBalance,
        });

        return {
          ...s,
          goldVolts: newBalance,
          vaultItems: s.vaultItems.filter((c) => c.vaultId !== vaultId),
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !state.userId) return;

    const client = supabase;
    const userId = state.userId;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleVaultRefresh = () => {
      if (spinInProgressRef.current) return;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        if (spinInProgressRef.current) return;
        void syncVaultFromServer(userId);
      }, 400);
    };

    const channel = client
      .channel(`vault-items-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vault_items",
          filter: `user_id=eq.${userId}`,
        },
        scheduleVaultRefresh,
      )
      .subscribe();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      void client.removeChannel(channel);
    };
  }, [state.userId, syncVaultFromServer]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      view: state.currentView,
      navigateToView,
      navigateToBattle,
      setView,
      goToLobby,
      infoPageSlug: state.infoPageSlug,
      openInfoPage,
      toggleWallet,
      setActiveCurrency,
      selectPack,
      deductPackCost,
      addSweepsCash,
      addGoldVolts,
      setGoldVolts,
      syncGemBalanceFromServer,
      syncUserProfileFromServer,
      syncVaultFromServer,
      setBalanceUserId,
      resetWalletBalances,
      logout,
      setMobileMenuOpen,
      setShippingModalOpen,
      setPurchaseModalOpen,
      openGemRefillFromWallet,
      backToWalletFromGemRefill,
      setDepositModalOpen,
      openWalletModal,
      closeWalletModal,
      claimStarterGems,
      claimDailyBonusGems,
      completeLogin,
      openAuthModal,
      setAuthModalOpen,
      showCashoutToast,
      showErrorToast,
      showDepositSuccessToast,
      clearCashoutToast,
      vaultItems: state.vaultItems,
      shippingVaultItem: state.shippingVaultItem,
      openVaultShipping,
      closeVaultShipping,
      markVaultItemPendingShipment,
      applyVaultExchange,
      removeVaultCard,
      addVaultCard,
      appendVaultPullFromSpin,
      setSpinInProgress,
    }),
    [
      state,
      navigateToView,
      navigateToBattle,
      setView,
      goToLobby,
      openInfoPage,
      toggleWallet,
      setActiveCurrency,
      selectPack,
      deductPackCost,
      addSweepsCash,
      addGoldVolts,
      setGoldVolts,
      syncGemBalanceFromServer,
      syncUserProfileFromServer,
      syncVaultFromServer,
      setBalanceUserId,
      resetWalletBalances,
      logout,
      setMobileMenuOpen,
      setShippingModalOpen,
      setPurchaseModalOpen,
      openGemRefillFromWallet,
      backToWalletFromGemRefill,
      setDepositModalOpen,
      openWalletModal,
      closeWalletModal,
      claimStarterGems,
      claimDailyBonusGems,
      completeLogin,
      openAuthModal,
      setAuthModalOpen,
      showCashoutToast,
      showErrorToast,
      showDepositSuccessToast,
      clearCashoutToast,
      openVaultShipping,
      closeVaultShipping,
      markVaultItemPendingShipment,
      applyVaultExchange,
      removeVaultCard,
      addVaultCard,
      appendVaultPullFromSpin,
      setSpinInProgress,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
