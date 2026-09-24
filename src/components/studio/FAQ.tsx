import { useState } from "react";
import SectionTag from "@/components/site/SectionTag";
import { BOOKING_HREF, FAQ as CONTENT, type FaqItem } from "@/content/studio";
import { Plus } from "./icons";

function Item({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const panelId = `faq-${item.id}`;
  const buttonId = `faq-${item.id}-q`;
  return (
    <div className="overflow-hidden rounded-[18px] border border-[rgba(20,19,18,0.06)] bg-white md:rounded-[20px]">
      <h4>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="ks-faq-q flex min-h-[60px] w-full items-center justify-between gap-3 bg-white py-3.5 pl-[18px] pr-4 text-left text-base font-medium leading-[1.35] text-ks-ink md:min-h-16 md:gap-4 md:px-[22px] md:text-[17px]"
        >
          {item.q}
          <span
            className="ks-faq-icon flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full md:h-8 md:w-8"
            style={{ background: open ? "#FFE3EC" : "#F3EEE6", transform: open ? "rotate(45deg)" : "none" }}
            aria-hidden="true"
          >
            <Plus size={13} />
          </span>
        </button>
      </h4>
      <div id={panelId} role="region" aria-labelledby={buttonId} className="ks-faq-panel" data-open={open}>
        <div>
          <p className="max-w-[640px] px-[18px] pb-[18px] text-[15px] leading-[1.6] text-ks-soft md:px-[22px] md:pb-[22px] md:text-base">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

/** FAQ groupée par thème, accordéon (une question ouverte à la fois). */
export default function FAQ() {
  const [open, setOpen] = useState<string | null>(CONTENT.defaultOpen);
  return (
    <section id="faq" className="mt-24 scroll-mt-24 px-5 md:mt-[140px] md:px-8">
      <div className="mx-auto grid max-w-ks items-start gap-7 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-20">
        <div className="ks-reveal lg:sticky lg:top-28">
          <SectionTag studio>{CONTENT.tag}</SectionTag>
          <h2 className="mt-4 font-ks-display text-[40px] font-bold leading-[1.02] tracking-[-0.045em] md:mt-5 md:text-[56px] md:leading-none lg:text-[60px]">
            {CONTENT.title}
          </h2>
          <p className="mt-[18px] hidden text-[17px] leading-[1.55] text-ks-soft md:block">{CONTENT.subtitle}</p>
          <a
            href={BOOKING_HREF}
            className="ks-ghost mt-7 hidden h-[50px] items-center rounded-full border border-ks-line-strong bg-white px-[22px] text-[15px] font-semibold md:inline-flex"
          >
            {CONTENT.cta}
          </a>
        </div>
        <div className="flex flex-col gap-8 md:gap-10">
          {CONTENT.groups.map((g) => (
            <div key={g.theme} className="ks-reveal flex flex-col gap-2.5 md:gap-3">
              <h3 className="mb-0.5 font-ks-mono text-[11px] font-medium uppercase tracking-[0.14em] ks-grad-text md:mb-1 md:text-xs">{g.theme}</h3>
              {g.items.map((item) => (
                <Item key={item.id} item={item} open={open === item.id} onToggle={() => setOpen(open === item.id ? null : item.id)} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
