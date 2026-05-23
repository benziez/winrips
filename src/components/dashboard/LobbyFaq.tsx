import { useState } from "react";
import { ChevronDown } from "../icons/AppIcons";

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
    <section className="w-full pt-2">
      <header className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
          Still Have Questions?
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Quick answers about sweepstakes play and claims
        </p>
      </header>

      <ul className="border-t border-[#213743]">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id} className="border-b border-[#213743]">
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="group flex w-full items-center justify-between gap-4 bg-transparent py-4 text-left transition-colors duration-200"
                aria-expanded={isOpen}
              >
                <span
                  className={`text-sm font-semibold tracking-tight transition-colors duration-200 sm:text-base ${
                    isOpen
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                >
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition-all duration-300 ease-out ${
                    isOpen
                      ? "rotate-180 text-[#ff007a]"
                      : "rotate-0 text-slate-500 group-hover:text-slate-300"
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-3xl pb-5 pr-8 text-sm leading-relaxed text-slate-400">
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
