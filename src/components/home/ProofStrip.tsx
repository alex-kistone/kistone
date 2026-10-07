import { PROOF } from "@/content/home";

/** Chiffres clés : valeur XXL, unité rose, filets verticaux entre les colonnes. */
export default function ProofStrip() {
  return (
    <section aria-label="Kistone en chiffres" className="mx-auto mt-20 max-w-ks px-5 md:mt-[120px] md:px-8 xl:px-0">
      <dl className="grid divide-y divide-[rgba(20,19,18,0.08)] md:grid-cols-3 md:divide-x md:divide-y-0">
        {PROOF.map((f) => (
          <div key={f.label} className="ks-reveal flex flex-col items-center gap-2 py-8 text-center md:py-2">
            <dt className="order-2 max-w-[240px] text-[15px] leading-[1.5] text-ks-soft">{f.label}</dt>
            <dd className="order-1 font-ks-display text-[72px] font-bold leading-[0.9] tracking-[-0.05em] md:text-[96px]">
              {f.value}
              <span className="ml-1 text-[34px] tracking-[-0.03em] text-ks-pink md:text-[44px]">{f.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
