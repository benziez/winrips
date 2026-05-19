import { AppLayout } from "./components/layout/AppLayout";
import { InfoPageView } from "./components/views/InfoPageView";
import { ViewRouter } from "./components/views/ViewRouter";
import { useApp } from "./context/AppContext";
import { WaitlistView } from "./views/WaitlistView";

function AppContent() {
  const { infoPageSlug } = useApp();

  if (infoPageSlug) {
    return <InfoPageView pageSlug={infoPageSlug} />;
  }

  return <ViewRouter />;
}

export default function App() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <WaitlistView />;
  }

  return (
    <AppLayout>
      <AppContent />
    </AppLayout>
  );
}
