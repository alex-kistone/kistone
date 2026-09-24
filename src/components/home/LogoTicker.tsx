import { LOGOS } from "@/content/home";

export default function LogoTicker() {
  const loop = [...LOGOS, ...LOGOS];
  return (
    <section className="mt-[72px] flex flex-col items-center gap-7 px-5 md:px-8">
      <p className="text-sm text-ks-subtle">Ils recrutent avec Kistone</p>
      <div className="ks-marquee w-full max-w-ks">
        <ul className="ks-track items-center">
          {loop.map((l, i) => (
            <li
              key={i}
              aria-hidden={i >= LOGOS.length}
              className="mr-[72px] shrink-0 whitespace-nowrap font-ks-display text-2xl font-semibold tracking-[-0.02em] text-[#8F8980]"
            >
              {l}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
