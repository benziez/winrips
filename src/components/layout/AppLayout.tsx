import type { ReactNode } from "react";
import { Header } from "./Header";
import { NavDrawerProvider, Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MobileDrawer } from "./MobileDrawer";
import { DepositModal } from "../modals/DepositModal";
import { PurchaseModal } from "../wallet/PurchaseModal";
import { AuthModal } from "../auth/AuthModal";
import { CorporateFooter } from "./CorporateFooter";
import { ShippingModal } from "../pack-opening/ShippingModal";
import { DevBalanceTools } from "../wallet/DevBalanceTools";
import { useApp } from "../../context/AppContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const {
    cashoutToast,
    clearCashoutToast,
    shippingVaultItem,
    closeVaultShipping,
    showCashoutToast,
  } = useApp();

  return (
    <NavDrawerProvider>
      <div className="flex min-h-screen flex-row bg-obsidian">
        <Sidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col justify-between pb-16 lg:pb-0">
          <div className="flex flex-col">
            <Header />
            <main className="w-full flex-1 bg-[#0A0A0C] transition-all duration-300">
              {children}
            </main>
          </div>
          <CorporateFooter />
        </div>

        <MobileDrawer />
        <MobileNav />
        <PurchaseModal />
        <DepositModal />
        <AuthModal />
        <DevBalanceTools />

        {shippingVaultItem && (
          <ShippingModal
            itemName={shippingVaultItem.name}
            onClose={closeVaultShipping}
            onSubmit={() => {
              showCashoutToast(
                `Physical delivery request received for ${shippingVaultItem.name}. Our fulfillment team will confirm shipping details shortly.`,
              );
              closeVaultShipping();
            }}
          />
        )}

        {cashoutToast && (
          <div
            className="fixed bottom-20 left-1/2 z-[80] max-w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-[#FF007F]/50 bg-[#1A1C20] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,0,127,0.4)] lg:bottom-6"
            role="status"
          >
            <button
              type="button"
              onClick={clearCashoutToast}
              className="absolute -right-2 -top-2 h-5 w-5 rounded-full border border-border bg-obsidian text-[10px] text-muted hover:text-white"
            >
              ×
            </button>
            {cashoutToast}
          </div>
        )}
      </div>
    </NavDrawerProvider>
  );
}
