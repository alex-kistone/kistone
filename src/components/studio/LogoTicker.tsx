import { LOGOS } from "@/content/studio";

/** Bandeau des clients (36s), pause au survol. */
export default function LogoTicker() {
  const list = [...LOGOS.items, ...LOGOS.items];
  return (
    <section className="mt-12 flex flex-col items-center gap-5 md:mt-[72px] md:gap-7 md:px-8">
      <p className="px-5 text-[13px] text-ks-subtle md:text-sm">{LOGOS.caption}</p>
      <div className="ks-marquee w-full max-w-ks">
        <ul className="ks-track items-center">
          {list.map((l, i) => (
            <li
              key={i}
              aria-hidden={i >= LOGOS.items.length || undefined}
              className="mr-11 shrink-0 whitespace-nowrap font-ks-display text-xl font-semibold tracking-[-0.02em] text-[#8F8980] md:mr-[72px] md:text-2xl"
            >
              {l}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
