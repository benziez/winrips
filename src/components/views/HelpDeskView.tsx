import { UtilityPageShell } from "./UtilityPageShell";

const FAQ = [
  {
    q: "How do Gems and Sweeps Cash work?",
    a: "Gems are your storefront currency for unlocking mystery drops (~100 Gems = $1 USD). Sweeps Cash enters you into promotional sweepstakes pack events.",
  },
  {
    q: "When will my physical ship arrive?",
    a: "Verified ships dispatch within 5–10 business days after KYC approval (simulated in demo).",
  },
  {
    q: "Is WinRips provably fair?",
    a: "Yes — visit the Fairness hub to audit seeds and nonce chains for every rip.",
  },
];

export function HelpDeskView() {
  return (
    <UtilityPageShell
      eyebrow="Support"
      title="Help Desk"
      description="Live support for account, shipping, sweeps eligibility, and vault questions."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <a
          href="#"
          className="card-pack rounded-xl p-4 hover:border-fuchsia/40 transition-colors"
        >
          <p className="text-xs text-fuchsia font-bold uppercase mb-1">Live Chat</p>
          <p className="text-sm text-white font-semibold">Average wait: 2 min</p>
        </a>
        <a
          href="#"
          className="card-pack rounded-xl p-4 hover:border-fuchsia/40 transition-colors"
        >
          <p className="text-xs text-fuchsia font-bold uppercase mb-1">Email</p>
          <p className="text-sm text-white font-semibold">support@winrips.gg</p>
        </a>
        <a
          href="#"
          className="card-pack rounded-xl p-4 hover:border-fuchsia/40 transition-colors"
        >
          <p className="text-xs text-fuchsia font-bold uppercase mb-1">Discord Ticket</p>
          <p className="text-sm text-white font-semibold">Open #help-desk</p>
        </a>
      </div>
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="card-pack rounded-xl p-4 group open:border-fuchsia/30"
          >
            <summary className="text-sm font-semibold text-white cursor-pointer list-none flex justify-between items-center">
              {item.q}
              <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="text-sm text-muted mt-3 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </UtilityPageShell>
  );
}
