import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { MobileAppLayout } from "./components/mobile/MobileAppLayout";
import { WebDashboardLayout } from "./components/layout/AppLayout";
import { InfoPageView } from "./components/views/InfoPageView";
import { ViewRouter } from "./components/views/ViewRouter";
import { useApp } from "./context/AppContext";
import { configureNativeKeyboard } from "./lib/keyboardSetup";

function AppContent() {
  const { infoPageSlug } = useApp();

  if (infoPageSlug) {
    return <InfoPageView pageSlug={infoPageSlug} />;
  }

  return <ViewRouter />;
}

export default function App() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "web") {
      void configureNativeKeyboard();
    }
  }, []);

  if (Capacitor.getPlatform() !== "web") {
    return <MobileAppLayout />;
  }

  return (
    <WebDashboardLayout>
      <AppContent />
    </WebDashboardLayout>
  );
}
