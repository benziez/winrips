import { MobileWhatsInsideDrawer } from "./MobileWhatsInsideDrawer";

interface WhatsInsideModalProps {
  packId: string;
  packName: string;
  onClose: () => void;
}

/** Slide-up drawer for drop table — no web grid on mobile. */
export function WhatsInsideModal({ packId, packName, onClose }: WhatsInsideModalProps) {
  return (
    <MobileWhatsInsideDrawer
      packId={packId}
      packName={packName}
      open
      onClose={onClose}
    />
  );
}
