import type { ReactNode } from "react";
import { Header } from "./Header";
import { NavDrawerProvider, Sidebar, useNavDrawer } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileDrawer } from "./MobileDrawer";
import { DepositModal } from "../modals/DepositModal";
import { PurchaseModal } from "../wallet/PurchaseModal";
import { AuthModal } from "../auth/AuthModal";
import { CorporateFooter } from "./CorporateFooter";
import { ShippingModal } from "../pack-opening/ShippingModal";
import { GemBalanceDepositNotifier } from "../wallet/GemBalanceDepositNotifier";
import { WalletModal } from "../wallet/WalletModal";
import { VAULT_SHIPPING_COST } from "../../constants/shipping";
import { processShippingRequest } from "../../lib/shippingLogic";
import { useApp } from "../../context/AppContext";

function AppLayoutFrame({ children }: { children: ReactNode }) {
  const {
    cashoutToast,
    toastVariant,
    clearCashoutToast,
    shippingVaultItem,
    closeVaultShipping,
    showCashoutToast,
    userId,
    setGoldVolts,
    syncVaultFromServer,
    markVaultItemPendingShipment,
  } = useApp();
  const { isMenuOpen } = useNavDrawer();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-obsidian">
      <Sidebar />

      <div
        className={`relative flex min-h-screen w-full min-w-0 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] transition-[padding-left] duration-300 ease-out max-lg:pl-0 lg:pb-0 ${
          isMenuOpen ? "lg:pl-60" : "lg:pl-16"
        }`}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-w-0 flex-1 bg-obsidian">{children}</main>
        </div>

        <CorporateFooter />
      </div>

      <MobileDrawer />
      <MobileNav />
      <PurchaseModal />
      <WalletModal />
      <DepositModal />
      <AuthModal />
      <GemBalanceDepositNotifier />

      {shippingVaultItem && (
        <ShippingModal
          itemName={shippingVaultItem.name}
          onClose={closeVaultShipping}
          vaultMode={{
            shippingCost: VAULT_SHIPPING_COST,
            onConfirm: async ({ name, address }) => {
              const result = await processShippingRequest({
                itemId: shippingVaultItem.vaultId,
                shippingCost: VAULT_SHIPPING_COST,
                name,
                address,
              });

              if (!result.ok) {
                return { ok: false, error: result.error };
              }

              setGoldVolts(result.gemsBalance);
              markVaultItemPendingShipment(shippingVaultItem.vaultId, name, address);
              if (userId) {
                void syncVaultFromServer(userId);
              }
              showCashoutToast(
                `Shipping request submitted for ${shippingVaultItem.name}. ${VAULT_SHIPPING_COST.toLocaleString()} Gems charged.`,
              );
              closeVaultShipping();
              return { ok: true };
            },
          }}
        />
      )}

      {cashoutToast ? (
        <div
          className={
            toastVariant === "deposit"
              ? "app-toast app-deposit-toast deposit-success-toast rounded-xl border border-gold/35 bg-[#1a2c38] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(255,0,122,0.25),0_12px_40px_rgba(0,0,0,0.5)]"
              : toastVariant === "error"
                ? "app-toast app-default-toast rounded-lg border border-red-500/50 bg-[#1a1218] px-5 py-3.5 text-sm font-semibold text-red-100 shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
                : "app-toast app-default-toast rounded-lg border border-fuchsia/40 bg-slate px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
          }
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={clearCashoutToast}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-obsidian text-[10px] text-muted hover:text-white"
            aria-label="Dismiss notification"
          >
            ×
          </button>
          {toastVariant === "deposit" ? (
            <p className="bg-gradient-to-r from-gold via-white to-fuchsia bg-clip-text pr-6 text-transparent">
              {cashoutToast}
            </p>
          ) : (
            cashoutToast
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <NavDrawerProvider>
      <AppLayoutFrame>{children}</AppLayoutFrame>
    </NavDrawerProvider>
  );
}
