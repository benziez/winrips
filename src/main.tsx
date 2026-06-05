import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { BoxesCatalogProvider } from "./context/BoxesCatalogContext";
import { WalletBalanceSync } from "./components/wallet/WalletBalanceSync";
import { queryClient } from "./lib/queryClient";
import { initializeStripe } from "./lib/stripeClient";
import { registerStripeAppUrlHandler } from "./lib/registerStripeAppUrlHandler";
import "./index.css";

void initializeStripe()
  .then(() => registerStripeAppUrlHandler())
  .catch((error) => {
    console.warn("Stripe init failed:", error);
  });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <BoxesCatalogProvider>
            <WalletBalanceSync />
            <App />
          </BoxesCatalogProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
