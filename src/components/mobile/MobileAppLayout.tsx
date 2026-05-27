import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { AgeGate } from "../compliance/AgeGate";
import { AuthModal } from "../auth/AuthModal";
import { PurchaseModal } from "../wallet/PurchaseModal";
import { WalletModal } from "../wallet/WalletModal";
import { DepositModal } from "../modals/DepositModal";
import { VaultReleaseModal } from "../shipping/VaultReleaseModal";
import { GemBalanceDepositNotifier } from "../wallet/GemBalanceDepositNotifier";
import { createVaultReleaseOnConfirm } from "../../lib/vaultReleaseFlow";
import { configureRevenueCat } from "../../lib/revenueCat";
import { isAppStoreCommerce } from "../../constants/commerce";
import { MobileSignInScreen } from "./MobileSignInScreen";
import { MobileAppContent } from "./MobileAppContent";
import { MobileHistoryBridge } from "./MobileHistoryBridge";
import { MobileFloatingDock, MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { GlassSurface } from "./GlassSurface";
import { MOBILE_COLORS } from "./mobileTheme";
import { shouldSuppressMobileGemToast } from "../../utils/mobileGemUi";
import type { AppView } from "../../types";

const IMMERSIVE_VIEWS: AppView[] = ["pack-open", "settings"];

function MobileToast() {
  const { cashoutToast, toastVariant, clearCashoutToast } = useApp();
  if (!cashoutToast) return null;
  if (shouldSuppressMobileGemToast(cashoutToast)) return null;

  return (
    <GlassSurface
      variant="dock"
      className="pointer-events-auto fixed left-6 right-6 z-[60] mx-auto max-w-sm rounded-2xl px-4 py-3 text-sm font-semibold"
      style={{
        bottom: `calc(${MOBILE_DOCK_CLEARANCE} + 0.5rem)`,
        color: toastVariant === "error" ? "#fca5a5" : MOBILE_COLORS.textPrimary,
      }}
      role="status"
    >
      <button
        type="button"
        onClick={clearCashoutToast}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-[#A1A1AA] active:text-white"
        aria-label="Dismiss"
      >
        ×
      </button>
      <span className="block pr-4">{cashoutToast}</span>
    </GlassSurface>
  );
}

function MobileAppLayoutInner() {
  const {
    isLoggedIn,
    userId,
    currentView,
    infoPageSlug,
    shippingVaultItem,
    closeVaultShipping,
    markVaultItemPendingShipment,
  } = useApp();
  const [guestSession, setGuestSession] = useState(false);

  useEffect(() => {
    if (userId) {
      void configureRevenueCat(userId);
    }
  }, [userId]);

  useEffect(() => {
    document.documentElement.classList.add("capacitor-native");
    return () => {
      document.documentElement.classList.remove("capacitor-native");
    };
  }, []);

  const showSignIn = !isLoggedIn && !guestSession;
  const immersive = IMMERSIVE_VIEWS.includes(currentView);
  const showDock = !immersive && !infoPageSlug;

  if (showSignIn) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-black">
        <AgeGate />
        <MobileSignInScreen onGuestContinue={() => setGuestSession(true)} />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white" data-shell="mobile">
      <AgeGate />
      <main
        className="relative h-full min-h-0 overflow-hidden"
        style={{
          paddingBottom: showDock ? MOBILE_DOCK_CLEARANCE : "max(0px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="h-full min-h-0 overflow-hidden">
          <MobileAppContent />
        </div>
      </main>

      {showDock ? <MobileFloatingDock /> : null}
      <MobileToast />

      {!isAppStoreCommerce() ? <PurchaseModal /> : null}
      {!isAppStoreCommerce() ? <WalletModal /> : null}
      {!isAppStoreCommerce() ? <DepositModal /> : null}
      <AuthModal />
      {!isAppStoreCommerce() ? <GemBalanceDepositNotifier /> : null}

      {shippingVaultItem ? (
        <VaultReleaseModal
          vaultItemId={shippingVaultItem.vaultId}
          itemName={shippingVaultItem.name}
          itemImage={shippingVaultItem.image}
          itemValue={shippingVaultItem.value}
          onClose={closeVaultShipping}
          onSuccessDismiss={closeVaultShipping}
          onConfirm={createVaultReleaseOnConfirm({
            vaultItemId: shippingVaultItem.vaultId,
            markVaultItemPendingShipment,
          })}
        />
      ) : null}
    </div>
  );
}

export function MobileAppLayout() {
  return (
    <BrowserRouter>
      <MobileHistoryBridge>
        <MobileAppLayoutInner />
      </MobileHistoryBridge>
    </BrowserRouter>
  );
}
