import { FOOTER_NAV_COLUMNS, infoPathForSlug } from "../../constants/footerContent";
import { useApp } from "../../context/AppContext";
import { SOCIAL_LINKS } from "../../data/navigation";

function SocialIcon({ id }: { id: string }) {
  if (id === "x") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (id === "discord") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12.12 12.12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function CorporateFooter() {
  const { openInfoPage } = useApp();

  return (
    <footer className="mt-auto w-full shrink-0 border-t border-neutral-800 bg-[#111115]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {FOOTER_NAV_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.slug}>
                    <a
                      href={infoPathForSlug(link.slug)}
                      onClick={(e) => {
                        e.preventDefault();
                        openInfoPage(link.slug);
                      }}
                      className="text-sm text-muted hover:text-fuchsia transition-colors text-left"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-metallic text-muted transition-all hover:text-fuchsia hover:border-fuchsia/50 hover:shadow-[0_0_12px_rgba(255,0,127,0.45)]"
              >
                <SocialIcon id={link.id} />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted text-center">
            © 2026 WinRips | All Rights Reserved.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-obsidian border-t border-border">
        <p className="text-[10px] sm:text-[11px] text-muted/55 leading-relaxed max-w-5xl mx-auto text-center">
          WINRIPS is a gamified e-commerce storefront owned and operated by Drops Retail
          Limited. All digital tokens purchased on the platform are virtual items used exclusively
          to open randomized mystery packages containing physical goods. Purchases of tokens are
          final and non-refundable. Opened digital vouchers can be exchanged for alternative digital
          assets or processed for physical shipping to verified addresses. This service is for
          consumer entertainment purposes only. This is not a gambling website — every unboxing
          purchase results in a physical inventory item secured in professional vault storage.
        </p>
      </div>
    </footer>
  );
}
