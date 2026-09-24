import { WHY } from "@/content/studio";
import { Cross } from "./icons";

/** Bloc « Fini les… » : ce que les RH ne feront plus à la main, barré en rose. */
export default function StrikeList() {
  const s = WHY.strike;
  return (
    <div className="ks-reveal mt-3 grid gap-4 rounded-3xl bg-ks-secondary p-[26px] text-left md:mt-5 md:grid-cols-2 md:gap-12 md:rounded-[28px] md:p-10 lg:p-12">
      <div>
        <h3 className="font-ks-display text-[38px] font-bold leading-none tracking-[-0.045em] md:text-5xl lg:text-[56px]">{s.title}</h3>
        <p className="mt-2.5 text-[15px] leading-normal text-ks-soft md:mt-3.5 md:text-[17px] md:leading-[1.55]">{s.subtitle}</p>
      </div>
      <ul className="flex flex-col">
        {s.items.map((item) => (
          <li
            key={item}
            className="flex min-h-[50px] items-center gap-3 border-b border-[rgba(20,19,18,0.08)] py-2 text-[15px] text-ks-soft md:min-h-[54px] md:gap-3.5 md:text-base"
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white text-[#B14DF5] md:h-6 md:w-6" aria-hidden="true">
              <Cross size={10} />
            </span>
            <span className="line-through decoration-[rgba(177,77,245,0.55)] decoration-[length:1.5px]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
