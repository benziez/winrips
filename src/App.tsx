import { AppLayout } from "./components/layout/AppLayout";
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
  return (
    <AppLayout>
      <AppContent />
    </AppLayout>
  );
}
