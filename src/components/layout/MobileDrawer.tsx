import { WinRipsLogo } from "../brand/WinRipsLogo";
import { SidebarHubNav } from "../NavigationDrawer";
import { useNavDrawer } from "./Sidebar";
import { SidebarNav } from "./SidebarNav";
import { SocialFooter } from "./SocialFooter";

export function MobileDrawer() {
  const { isMenuOpen, closeMenu } = useNavDrawer();

  if (!isMenuOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/80 lg:hidden"
        onClick={closeMenu}
        aria-label="Close menu"
      />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-[#111115] lg:hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-transparent px-5 py-4">
          <WinRipsLogo variant="sidebar" />
          <button
            type="button"
            onClick={closeMenu}
            className="text-xl text-muted hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <SidebarNav expanded />
          <SidebarHubNav expanded />
        </div>
        <SocialFooter expanded />
      </aside>
    </>
  );
}
