import { Capacitor } from "@capacitor/core";
import { MobileAppLayout } from "./components/mobile/MobileAppLayout";
import { WebDashboardLayout } from "./components/layout/AppLayout";
import { InfoPageView } from "./components/views/InfoPageView";
import { ViewRouter } from "./components/views/ViewRouter";
import { useApp } from "./context/AppContext";

function AppContent() {
  const { infoPageSlug } = useApp();

  if (infoPageSlug) {
    return <InfoPageView pageSlug={infoPageSlug} />;
  }

  return <ViewRouter />;
}

export default function App() {
  if (Capacitor.getPlatform() !== "web") {
    return <MobileAppLayout />;
  }

  return (
    <WebDashboardLayout>
      <AppContent />
    </WebDashboardLayout>
  );
}
