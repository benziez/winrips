import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { AgeGate } from "../compliance/AgeGate";
import { DobCollectionScreen } from "../compliance/DobCollectionScreen";
import { fetchComplianceProfile, setAgeVerification } from "../../lib/complianceProfile";
import { captureReferralFromLocation } from "../../constants/pendingReferral";
import { persistGuestBrowse } from "../../constants/termsAcknowledgment";
import { isShippingNoticeSeen } from "../../constants/shippingNotice";
import { AuthModal } from "../auth/AuthModal";
import { PurchaseModal } from "../wallet/PurchaseModal";
import { WalletModal } from "../wallet/WalletModal";
import { DepositModal } from "../modals/DepositModal";
import { VaultReleaseModal } from "../shipping/VaultReleaseModal";
import { GemBalanceDepositNotifier } from "../wallet/GemBalanceDepositNotifier";
import { createVaultReleaseOnConfirm } from "../../lib/vaultReleaseFlow";
import { MobileAppContent } from "./MobileAppContent";
import { MobileHistoryBridge } from "./MobileHistoryBridge";
import { MobileFloatingDock, MOBILE_DOCK_CLEARANCE } from "./MobileFloatingDock";
import { USShippingModal } from "./USShippingModal";
import { GlassSurface } from "./GlassSurface";
import { MOBILE_COLORS } from "./mobileTheme";
import { shouldSuppressMobileGemToast } from "../../utils/mobileGemUi";
import { APP_SHELL_BG } from "./mobileShellTheme";
import type { AppView } from "../../types";

const IMMERSIVE_VIEWS: AppView[] = ["pack-open", "settings"];

/** Opaque strip over the Dynamic Island / status bar — blocks lobby gradient bleed. */
function NativeSafeAreaTopCover() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[9999]"
      style={{
        height: "env(safe-area-inset-top)",
        background: "#000000",
      }}
    />
  );
}

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
    currentView,
    cardDetailOverlayOpen,
    addFundsModalOpen,
    withdrawModalOpen,
    shippingVaultItem,
    closeVaultShipping,
    markVaultItemPendingShipment,
  } = useApp();
  const { user, isAuthenticated } = useAuth();
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [showShippingNotice, setShowShippingNotice] = useState(() => !isShippingNoticeSeen());

  useEffect(() => {
    document.documentElement.classList.add("capacitor-native");
    persistGuestBrowse();
    captureReferralFromLocation(window.location.search);
    return () => {
      document.documentElement.classList.remove("capacitor-native");
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !isAuthenticated || !user?.id) {
      setAgeVerified(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      const profile = await fetchComplianceProfile(user.id);
      if (cancelled) return;

      if (profile?.isAgeVerified) {
        setAgeVerified(true);
        return;
      }

      const pendingDob = user.user_metadata?.pending_date_of_birth;
      if (typeof pendingDob === "string" && pendingDob.trim()) {
        const { error } = await setAgeVerification(pendingDob.trim());
        if (!error) {
          setAgeVerified(true);
          return;
        }
      }

      setAgeVerified(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoggedIn, user?.id, user?.user_metadata?.pending_date_of_birth]);

  const immersive =
    IMMERSIVE_VIEWS.includes(currentView) ||
    cardDetailOverlayOpen ||
    addFundsModalOpen ||
    withdrawModalOpen;
  const showDock = !immersive;

  if (isLoggedIn && ageVerified === false) {
    return (
      <>
        <NativeSafeAreaTopCover />
        <DobCollectionScreen onVerified={() => setAgeVerified(true)} />
      </>
    );
  }

  return (
    <>
      <NativeSafeAreaTopCover />
      <div
        className="fixed inset-0 overflow-hidden text-white"
        style={{ background: APP_SHELL_BG }}
        data-shell="mobile"
      >
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

      <USShippingModal
        open={showShippingNotice}
        onDismiss={() => setShowShippingNotice(false)}
      />

      <PurchaseModal />
      <WalletModal />
      <DepositModal />
      <AuthModal />
      <GemBalanceDepositNotifier />

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
    </>
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
