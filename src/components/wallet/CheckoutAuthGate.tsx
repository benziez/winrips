import { useApp } from "../../context/AppContext";

export function CheckoutAuthGate() {
  const { openAuthModal } = useApp();

  return (
    <div className="flex w-full flex-col items-center gap-5 rounded-xl border border-[#213743] bg-[#0f212e]/80 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-white">Sign in to add funds</p>
      <p className="max-w-xs text-xs leading-relaxed text-muted">
        Create an account or log in to generate a secure crypto deposit address and manage your
        wallet.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => openAuthModal("login", { keepPurchaseModalOpen: true })}
          className="flex-1 rounded-md border border-[#213743] bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-fuchsia/40 hover:bg-slate-elevated"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => openAuthModal("signup", { keepPurchaseModalOpen: true })}
          className="flex-1 rounded-md bg-[#ff007a] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
        >
          Register
        </button>
      </div>
    </div>
  );
}
