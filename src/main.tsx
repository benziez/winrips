import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { BoxesCatalogProvider } from "./context/BoxesCatalogContext";
import { WalletBalanceSync } from "./components/wallet/WalletBalanceSync";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <BoxesCatalogProvider>
          <WalletBalanceSync />
          <App />
        </BoxesCatalogProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
);
