import { CollectibleImage } from "../ui/CollectibleImage";

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
    delay: "1.5s",
  },
  {
    src: "https://images.pokemontcg.io/swsh7/215_hires.png",
    alt: "Umbreon VMAX Alternate Art",
    className: "right-[2%] top-[12%] z-30 rotate-6",
    delay: "3s",
  },
] as const;

export function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-border bg-slate">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(255,0,122,0.05),transparent_55%)]" />

      <div className="relative grid min-h-0 grid-cols-1 items-center gap-5 px-4 py-6 sm:min-h-[200px] sm:gap-8 sm:px-8 sm:py-10 md:min-h-[240px] lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div className="z-10 flex max-w-lg flex-col">
          <span className="inline-flex w-fit items-center rounded border border-fuchsia/40 bg-fuchsia/10 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-fuchsia sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.22em]">
            Featured Drops Now Active
          </span>

          <h1 className="mt-3 text-2xl font-black uppercase leading-[1.1] tracking-[-0.02em] text-white sm:mt-4 sm:text-3xl lg:text-[2.125rem]">
            <span className="block sm:inline">Unbox the World&apos;s Most </span>
            <span className="block sm:inline">Coveted </span>
            <span className="bg-gradient-to-r from-fuchsia-500 via-pink-400 to-amber-400 bg-clip-text text-transparent animate-pulse">
              Grails
            </span>
          </h1>

          <p className="mt-3 max-w-lg text-xs leading-relaxed text-slate-400 sm:mt-4 sm:text-sm sm:leading-relaxed md:text-[15px] md:leading-[1.65]">
            Curated drops across premium trading cards and authenticated slabs.
            Acquire grails directly from our secure marketplace vault.
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
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-fuchsia-600/20 blur-[100px] animate-pulse"
              aria-hidden
            />
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
    <div className={`absolute ${className}`}>
      <article
        className="aspect-[2.5/3.5] w-[72px] animate-pack-float overflow-hidden rounded-lg border border-neutral-800 bg-[#0A0A0C] shadow-2xl sm:w-[84px] lg:w-[92px]"
        style={{ animationDelay: delay }}
      >
        <CollectibleImage
          src={src}
          alt={alt}
          priority
          thumbnail={false}
          frameClassName="bg-transparent"
          className="h-full w-full object-contain"
        />
      </article>
    </div>
  );
}
