const PARTICLES = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  left: `${(i * 5.1) % 100}%`,
  duration: `${11 + (i % 7)}s`,
  delay: `${(i % 9) * 1.1}s`,
  size: `${12 + (i % 5) * 4}px`,
  opacity: (0.32 + (i % 4) * 0.1).toFixed(2),
}));

export default function LoveParticles() {
  return (
    <div className="love-particles" aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="love-particle"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.size,
            opacity: p.opacity,
          }}
        >
          ❤
        </span>
      ))}
    </div>
  );
}
