import SectionHeader, { Section, TwoPartTitle } from "@/components/site/SectionHeader";
import { RPO_VS_CABINET } from "@/content/home";

/** RPO freelance ou cabinet : le tableau en grand écran, une carte par critère sur mobile. */
export default function RpoVsCabinet() {
  return (
    <Section id="rpo-ou-cabinet">
      <SectionHeader title={<TwoPartTitle a={RPO_VS_CABINET.titleA} b={RPO_VS_CABINET.titleB} />} subtitle={RPO_VS_CABINET.subtitle} />
      <div className="ks-reveal mt-8 overflow-hidden rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white shadow-ks-card md:mt-14">
        <table className="w-full border-collapse text-left text-[15px] leading-[1.5]">
          <thead className="hidden md:table-header-group">
            <tr className="font-ks-mono text-[11px] uppercase tracking-[0.14em]">
              <th scope="col" className="w-[22%] px-7 py-5 font-medium text-ks-subtle"><span className="sr-only">Critère</span></th>
              <th scope="col" className="w-[39%] px-7 py-5 font-medium text-ks-subtle">Cabinet de recrutement</th>
              <th scope="col" className="w-[39%] px-7 py-5 font-medium"><span className="ks-grad-text">Recruteur RPO freelance</span></th>
            </tr>
          </thead>
          <tbody>
            {RPO_VS_CABINET.rows.map((r) => (
              <tr key={r.label} className="block border-t border-[rgba(20,19,18,0.06)] p-6 first:border-t-0 md:table-row md:p-0 md:first:border-t">
                <th scope="row" className="block pb-3 font-ks-display text-[18px] font-semibold tracking-[-0.02em] md:table-cell md:px-7 md:py-5">{r.label}</th>
                <td className="block pb-3 text-ks-soft md:table-cell md:px-7 md:py-5">
                  <span className="mb-1 block font-ks-mono text-[11px] uppercase tracking-[0.14em] text-ks-subtle md:hidden">Cabinet</span>
                  {r.cabinet}
                </td>
                <td className="block font-medium text-ks-ink md:table-cell md:px-7 md:py-5">
                  <span className="mb-1 block font-ks-mono text-[11px] uppercase tracking-[0.14em] md:hidden"><span className="ks-grad-text">Recruteur RPO freelance</span></span>
                  {r.rpo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
