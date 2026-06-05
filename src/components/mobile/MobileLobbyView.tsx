import { memo } from "react";
import { MobileRipLobby } from "./MobileRipLobby";

/** Pack browse lobby — carousel, stats, buy CTA. */
export const MobileLobbyView = memo(function MobileLobbyView({
  isActive = true,
}: {
  isActive?: boolean;
}) {
  return <MobileRipLobby isActive={isActive} />;
});
