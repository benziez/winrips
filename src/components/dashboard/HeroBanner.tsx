const HERO_CARDS = [
  {
    src: "https://images.pokemontcg.io/swsh4/44_hires.png",
    alt: "Pikachu VMAX Rainbow Rare",
    className: "left-[4%] top-[14%] z-10 -rotate-6",
    delay: "0s",
  },
  {
    src: "https://images.pokemontcg.io/base1/4_hires.png",
    alt: "1st Edition Base Set Charizard",
    className: "left-[32%] top-[4%] z-20 rotate-0 scale-105",
    delay: "0.35s",
  },
  {
    src: "https://images.pokemontcg.io/swsh7/215_hires.png",
    alt: "Umbreon VMAX Alternate Art",
    className: "right-[2%] top-[12%] z-30 rotate-6",
    delay: "0.7s",
  },
] as const;

export function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-border bg-[#0A0A0C]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(255,0,127,0.06),transparent_55%)]" />

      <div className="relative grid grid-cols-1 items-center gap-8 px-5 py-8 sm:px-8 sm:py-10 min-h-[200px] sm:min-h-[240px] lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="z-10 flex max-w-lg flex-col">
          <span className="inline-flex w-fit items-center rounded border border-[#FF007F]/50 bg-[#FF007F]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#FF007F] sm:text-[10px]">
            Featured Drops Now Active
          </span>

          <h1 className="mt-4 text-2xl font-black uppercase leading-[1.08] tracking-[-0.02em] text-white sm:text-3xl lg:text-[2.125rem]">
            Unbox the Ultimate
            <br />
            Pokémon Grails
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-[15px] sm:leading-[1.65]">
            Hunt for Scarlet & Violet ultra-rares, classic 151 chase hits, and legendary
            vintage slabs. Open premium custom-curated mystery packs, secure top-tier cards,
            and build your dream collection today!
          </p>
        </div>

        <div className="relative hidden h-[180px] sm:block lg:h-[210px]">
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div className="h-[140%] w-[85%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,0,127,0.15)_0%,transparent_70%)]" />
          </div>

          <div className="relative mx-auto h-full w-full max-w-[340px]">
            {HERO_CARDS.map((card) => (
              <HeroFloatingCard key={card.src} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroFloatingCard({
  src,
  alt,
  className,
  delay,
}: {
  src: string;
  alt: string;
  className: string;
  delay: string;
}) {
  return (
    <article
      className={`absolute aspect-[2.5/3.5] w-[72px] animate-pack-float overflow-hidden rounded-lg border border-neutral-800 bg-[#0A0A0C] shadow-2xl sm:w-[84px] lg:w-[92px] ${className}`}
      style={{ animationDelay: delay }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </article>
  );
}
