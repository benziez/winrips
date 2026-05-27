import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import {
  registerMobileNavigator,
  unregisterMobileNavigator,
} from "../../lib/mobileNavigation";

interface MobileHistoryBridgeProps {
  children: ReactNode;
}

/** Registers react-router navigate for AppContext + syncs URL → view state. */
export function MobileHistoryBridge({ children }: MobileHistoryBridgeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { syncFromPathname } = useApp();

  useEffect(() => {
    registerMobileNavigator(navigate);
    return () => unregisterMobileNavigator();
  }, [navigate]);

  useEffect(() => {
    syncFromPathname(location.pathname);
  }, [location.pathname, syncFromPathname]);

  return children;
}
