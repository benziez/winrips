import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseAppPath, pathForView } from "../constants/appRoutes";
import type { FooterPageSlug } from "../constants/footerContent";
import {
  infoPathForSlug,
  parseInfoPath,
} from "../constants/footerContent";
import { exchangeCreditGems } from "../constants/retail";
import { VAULT_ITEMS } from "../constants/vaultItems";
import { persistLoggedIn, readLoggedInFromStorage } from "../constants/userSession";
import type { AppView, AuthModalMode, Currency, Pack, VaultedCard } from "../types";
import { fetchAccountBalance } from "../lib/paymentsApi";
import { getOrCreateUserId } from "../utils/userId";

interface AppState {
  isLoggedIn: boolean;
  currentView: AppView;
  infoPageSlug: FooterPageSlug | null;
  walletConnected: boolean;
  activeCurrency: Currency;
  goldVolts: number;
  sweepsCash: number;
  selectedPack: Pack | null;
  mobileMenuOpen: boolean;
  shippingModalOpen: boolean;
  purchaseModalOpen: boolean;
  depositModalOpen: boolean;
  userId: string;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  cashoutToast: string | null;
  vaultItems: VaultedCard[];
  shippingVaultItem: VaultedCard | null;
}

function normalizeView(view: AppView): AppView {
  return view === "inventory" ? "vault" : view;
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
  syncGemBalanceFromServer: () => Promise<void>;
  setMobileMenuOpen: (open: boolean) => void;
  setShippingModalOpen: (open: boolean) => void;
  setPurchaseModalOpen: (open: boolean) => void;
  setDepositModalOpen: (open: boolean) => void;
  completeLogin: () => void;
  openAuthModal: (mode: AuthModalMode, options?: { keepPurchaseModalOpen?: boolean }) => void;
  setAuthModalOpen: (open: boolean) => void;
  showCashoutToast: (message: string) => void;
  clearCashoutToast: () => void;
  vaultItems: VaultedCard[];
  shippingVaultItem: VaultedCard | null;
  openVaultShipping: (card: VaultedCard) => void;
  closeVaultShipping: () => void;
  exchangeVaultCard: (vaultId: string) => void;
  removeVaultCard: (vaultId: string) => void;
  addVaultCard: (card: VaultedCard) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readInfoSlugFromLocation(): FooterPageSlug | null {
  return parseInfoPath(window.location.pathname);
}

const INITIAL_STATE: AppState = {
  isLoggedIn: typeof window !== "undefined" ? readLoggedInFromStorage() : false,
  currentView: readInitialView(),
  infoPageSlug: readInfoSlugFromLocation(),
  walletConnected: false,
  activeCurrency: "sweeps-cash",
  goldVolts: 0,
  sweepsCash: 250,
  selectedPack: null,
  mobileMenuOpen: false,
  shippingModalOpen: false,
  purchaseModalOpen: false,
  depositModalOpen: false,
  userId: typeof window !== "undefined" ? getOrCreateUserId() : "server",
  authModalOpen: false,
  authModalMode: "login",
  cashoutToast: null,
  vaultItems: [...VAULT_ITEMS],
  shippingVaultItem: null,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  useEffect(() => {
    const syncFromUrl = () => {
      const slug = readInfoSlugFromLocation();
      if (slug) {
        setState((s) => ({ ...s, infoPageSlug: slug, currentView: "lobby" }));
        return;
      }
      const view = parseAppPath(window.location.pathname);
      if (view) {
        setState((s) => ({ ...s, infoPageSlug: null, currentView: view }));
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
      selectedPack: currentView === "pack-open" ? s.selectedPack : null,
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

  const syncGemBalanceFromServer = useCallback(async () => {
    const userId = state.userId;
    if (!userId) return;

    try {
      const balance = await fetchAccountBalance(userId);
      setState((s) => ({
        ...s,
        goldVolts: balance.gemBalance,
      }));
    } catch {
      /* API unavailable — keep local balance */
    }
  }, [state.userId]);

  useEffect(() => {
    void syncGemBalanceFromServer();
  }, [state.userId, syncGemBalanceFromServer]);

  const setMobileMenuOpen = useCallback((mobileMenuOpen: boolean) => {
    setState((s) => ({ ...s, mobileMenuOpen }));
  }, []);

  const setShippingModalOpen = useCallback((shippingModalOpen: boolean) => {
    setState((s) => ({ ...s, shippingModalOpen }));
  }, []);

  const setPurchaseModalOpen = useCallback((purchaseModalOpen: boolean) => {
    setState((s) => ({ ...s, purchaseModalOpen }));
  }, []);

  const setDepositModalOpen = useCallback((depositModalOpen: boolean) => {
    setState((s) => ({
      ...s,
      depositModalOpen,
      purchaseModalOpen: depositModalOpen ? false : s.purchaseModalOpen,
    }));
  }, []);

  const completeLogin = useCallback(() => {
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
        mobileMenuOpen: false,
      }));
    },
    [],
  );

  const setAuthModalOpen = useCallback((authModalOpen: boolean) => {
    setState((s) => ({ ...s, authModalOpen }));
  }, []);

  const showCashoutToast = useCallback((cashoutToast: string) => {
    setState((s) => ({ ...s, cashoutToast }));
    setTimeout(() => {
      setState((s) => ({ ...s, cashoutToast: null }));
    }, 4000);
  }, []);

  const clearCashoutToast = useCallback(() => {
    setState((s) => ({ ...s, cashoutToast: null }));
  }, []);

  const openVaultShipping = useCallback((card: VaultedCard) => {
    setState((s) => ({ ...s, shippingVaultItem: card }));
  }, []);

  const closeVaultShipping = useCallback(() => {
    setState((s) => ({ ...s, shippingVaultItem: null }));
  }, []);

  const removeVaultCard = useCallback((vaultId: string) => {
    setState((s) => ({
      ...s,
      vaultItems: s.vaultItems.filter((c) => c.vaultId !== vaultId),
    }));
  }, []);

  const addVaultCard = useCallback((card: VaultedCard) => {
    setState((s) => ({ ...s, vaultItems: [card, ...s.vaultItems] }));
  }, []);

  const exchangeVaultCard = useCallback(
    (vaultId: string) => {
      setState((s) => {
        const card = s.vaultItems.find((c) => c.vaultId === vaultId);
        if (!card) return s;
        const credit = exchangeCreditGems(card.value);
        return {
          ...s,
          goldVolts: s.goldVolts + credit,
          vaultItems: s.vaultItems.filter((c) => c.vaultId !== vaultId),
        };
      });
    },
    [],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      view: state.currentView,
      navigateToView,
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
      syncGemBalanceFromServer,
      setMobileMenuOpen,
      setShippingModalOpen,
      setPurchaseModalOpen,
      setDepositModalOpen,
      completeLogin,
      openAuthModal,
      setAuthModalOpen,
      showCashoutToast,
      clearCashoutToast,
      vaultItems: state.vaultItems,
      shippingVaultItem: state.shippingVaultItem,
      openVaultShipping,
      closeVaultShipping,
      exchangeVaultCard,
      removeVaultCard,
      addVaultCard,
    }),
    [
      state,
      navigateToView,
      setView,
      goToLobby,
      openInfoPage,
      toggleWallet,
      setActiveCurrency,
      selectPack,
      deductPackCost,
      addSweepsCash,
      addGoldVolts,
      syncGemBalanceFromServer,
      setMobileMenuOpen,
      setShippingModalOpen,
      setPurchaseModalOpen,
      setDepositModalOpen,
      completeLogin,
      openAuthModal,
      setAuthModalOpen,
      showCashoutToast,
      clearCashoutToast,
      openVaultShipping,
      closeVaultShipping,
      exchangeVaultCard,
      removeVaultCard,
      addVaultCard,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
