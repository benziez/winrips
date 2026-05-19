import { useState } from "react";

const FAQ_ITEMS = [
  {
    id: "what-is",
    question: "What is WinRips?",
    answer:
      "WinRips is a gamified e-commerce collectibles storefront. Purchase Gems to open sealed mystery packages containing physical slabs, autographs, and graded cards — with every drop table published in our Fairness hub.",
  },
  {
    id: "safe",
    question: "Is shopping on WinRips safe?",
    answer:
      "We use encrypted checkout sessions, provably fair drop verification, and responsible-play guidelines. All openings are auditable in the Fairness hub. Never share your credentials, and enable two-factor authentication when account security launches.",
  },
  {
    id: "claim",
    question: "How do I claim my physical cards or crypto?",
    answer:
      "After a valuable pull, redeem your digital voucher for physical shipping to a verified address, or exchange for alternative digital assets in your vault. Fulfillment typically dispatches within 5–10 business days after order review.",
  },
] as const;

export function LobbyFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-border bg-[#121318] overflow-hidden">
      <header className="px-4 sm:px-5 py-4 border-b border-border">
        <h2 className="text-lg sm:text-xl font-bold text-white">Still Have Questions?</h2>
        <p className="text-xs text-muted mt-1">Quick answers about sweepstakes play and claims</p>
      </header>

      <ul className="divide-y divide-border">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left transition-colors hover:bg-metallic/50"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-semibold text-white">
                  {item.question}
                </span>
                <span
                  className={`shrink-0 text-muted transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 sm:px-5 pb-4 text-sm text-muted leading-relaxed bg-metallic/30 border-t border-border/50">
                    {item.answer}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
