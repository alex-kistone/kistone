/** Lueur rose discrète en coin (même rose, qui s'estompe : pas de dégradé de couleurs). */
export function PinkGlow({ className, strength = 0.35 }: { className: string; strength?: number }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(circle, rgba(177,77,245,${strength}), rgba(255,46,110,${strength / 3}) 45%, rgba(76,125,255,0) 72%)` }}
      aria-hidden="true"
    />
  );
}
