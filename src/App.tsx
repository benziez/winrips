import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
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
  const { authLoading } = useAuth();
  const isNative = Capacitor.getPlatform() !== "web";

  useEffect(() => {
    if (!isNative) return;
    void configureNativeKeyboard();
  }, [isNative]);

  useEffect(() => {
    if (!isNative || authLoading) return;

    let cancelled = false;

    void (async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      if (cancelled) return;
      await SplashScreen.hide();
    })();

    return () => {
      cancelled = true;
    };
  }, [isNative, authLoading]);

  if (isNative) {
    return <MobileAppLayout />;
  }

  return (
    <WebDashboardLayout>
      <AppContent />
    </WebDashboardLayout>
  );
}
