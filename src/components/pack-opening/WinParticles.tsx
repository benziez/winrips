const PARTICLE_COUNT = 48;

export function WinParticles() {
  return (
    <div className="win-particles pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const isGold = i % 3 === 0;
        const left = `${(i * 17 + 7) % 100}%`;
        const delay = `${(i * 0.07) % 2}s`;
        const duration = `${1.8 + (i % 5) * 0.25}s`;
        const size = 6 + (i % 4) * 3;

        return (
          <span
            key={i}
            className={`win-particle ${isGold ? "win-particle--gold" : "win-particle--fuchsia"}`}
            style={{
              left,
              animationDelay: delay,
              animationDuration: duration,
              width: size,
              height: size,
            }}
          />
        );
      })}
    </div>
  );
}
