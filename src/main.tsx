import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { WalletBalanceSync } from "./components/wallet/WalletBalanceSync";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <WalletBalanceSync />
        <App />
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
);
