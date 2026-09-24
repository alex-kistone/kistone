import type { ReactNode } from "react";
import { PRODUCTS, type Product, type ProductKind } from "@/content/studio";

const Row = ({ children, last }: { children: ReactNode; last?: boolean }) => (
  <div className={`flex h-[38px] items-center gap-2 md:h-[46px] md:gap-2.5 ${last ? "" : "border-b border-[rgba(20,19,18,0.05)]"}`}>{children}</div>
);

function Progress({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-[5px] md:gap-1.5">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="text-ks-subtle">{value} %</span>
      </div>
      <div className="h-[5px] rounded-full bg-ks-secondary md:h-1.5">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function Screen({ kind }: { kind: ProductKind }) {
  switch (kind) {
    case "onboarding":
      return (
        <div className="flex flex-col gap-3 p-4 text-xs md:gap-3.5 md:px-5 md:py-[18px] md:text-[13px]">
          <Progress label="Signature du contrat" value={100} color="#141312" />
          <Progress label="Matériel & accès" value={80} color="#141312" />
          <Progress label="Rencontre équipe" value={45} color="#FF2E6E" />
        </div>
      );
    case "assistant":
      return (
        <div className="flex flex-col gap-2 p-3.5 text-xs leading-[1.35] md:gap-2.5 md:px-5 md:py-4 md:text-[13px] md:leading-[1.4]">
          <div className="max-w-[190px] self-end rounded-[14px_14px_4px_14px] bg-ks-dark px-3 py-2 text-ks-dark-fg md:max-w-[240px] md:rounded-[16px_16px_4px_16px] md:px-3.5 md:py-2.5">
            Combien de jours de congés me reste-t-il ?
          </div>
          <div className="max-w-[200px] self-start rounded-[14px_14px_14px_4px] bg-[#F0EBE2] px-3 py-2 md:max-w-[260px] md:rounded-[16px_16px_16px_4px] md:px-3.5 md:py-2.5">
            Il vous reste 12 jours. Je pose une demande<span className="hidden md:inline"> pour la semaine du 14</span> ?
          </div>
          <div className="hidden self-end rounded-[16px_16px_4px_16px] bg-ks-dark px-3.5 py-2.5 text-ks-dark-fg md:block">Oui, parfait.</div>
        </div>
      );
    case "talents": {
      const people = [
        ["C", "Camille R. · Chargée RH", "94"],
        ["Y", "Yanis B. · Talent Partner", "88"],
        ["L", "Léa M. · HRBP", "81"],
        ["H", "Hugo T. · Recruteur", "76"],
      ];
      return (
        <div className="flex flex-col px-4 py-1 text-xs md:px-5 md:py-1.5 md:text-[13px]">
          {people.map(([i, name, score], idx) => (
            <div key={name} className={idx === 3 ? "hidden md:block" : ""}>
              <Row last={idx === 3}>
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-semibold md:h-[26px] md:w-[26px] md:text-[11px]"
                  style={{ background: idx === 0 ? "#FFE3EC" : "#F0EBE2" }}
                >
                  {i}
                </span>
                <span className="grow">{name}</span>
                <span className="font-ks-mono md:text-xs">{score}</span>
              </Row>
            </div>
          ))}
        </div>
      );
    }
    case "interviews":
      return (
        <div className="flex flex-col gap-2.5 p-4 text-xs md:gap-3 md:px-5 md:py-[18px] md:text-[13px]">
          <div className="flex justify-between">
            <span>Entretiens annuels</span>
            <span className="text-ks-subtle">38 / 52</span>
          </div>
          <div className="grid grid-cols-7 gap-[5px] md:gap-1.5">
            {["#141312", "#141312", "#141312", "#141312", "#FF2E6E", "#EDE7DC", "#EDE7DC"].map((c, i) => (
              <span key={i} className="h-6 rounded-[5px] md:h-7 md:rounded-md" style={{ background: c }} />
            ))}
          </div>
          <div className="hidden text-xs text-ks-subtle md:block">14 managers relancés automatiquement</div>
        </div>
      );
    case "leave": {
      const rows = [
        ["Inès · 14 → 18 oct.", "Validé", false],
        ["Marc · 21 → 25 oct.", "En attente", true],
        ["Sarah · 28 oct.", "Validé", false],
      ] as const;
      return (
        <div className="flex flex-col gap-2 p-3.5 text-xs md:gap-2.5 md:px-5 md:py-[18px] md:text-[13px]">
          {rows.map(([who, status, pending], idx) => (
            <div
              key={who}
              className={`${idx === 2 ? "hidden md:flex" : "flex"} items-center justify-between rounded-[10px] bg-[#F7F3EC] px-2.5 py-2 md:rounded-xl md:px-3 md:py-2.5`}
            >
              <span>{who}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs md:px-2.5 md:py-[3px] ${pending ? "bg-ks-pink-100 text-ks-pink-ink" : "bg-ks-dark text-ks-dark-fg"}`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      );
    }
  }
}

function ProductCard({ p, hidden }: { p: Product; hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className="mr-4 flex w-[280px] shrink-0 flex-col gap-3 md:mr-6 md:w-[380px] md:gap-3.5">
      <div className="h-[190px] overflow-hidden rounded-[22px] border border-[rgba(20,19,18,0.06)] bg-white shadow-ks-card md:h-[236px] md:rounded-3xl">
        <div className="flex h-8 items-center gap-[5px] border-b border-[rgba(20,19,18,0.05)] px-3.5 md:h-9 md:gap-1.5 md:px-4">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[7px] w-[7px] rounded-full bg-[#E6E0D6] md:h-2 md:w-2" />
          ))}
          <span className="mx-auto text-[10px] text-ks-subtle md:text-[11px]">{p.url}</span>
        </div>
        <Screen kind={p.kind} />
      </div>
      <div className="flex flex-col gap-0.5 text-left md:gap-1">
        <span className="text-sm font-semibold md:text-[15px]">{p.title}</span>
        <span className="text-[13px] text-ks-subtle md:text-sm">
          <span className="md:hidden">{p.descMobile}</span>
          <span className="hidden md:inline">{p.desc}</span>
        </span>
      </div>
    </div>
  );
}

/** Bandeau de maquettes produits en boucle (60s), pause au survol. */
export default function ProductTicker() {
  return (
    <div className="ks-marquee mt-11 pb-6 pt-1 md:mt-[72px] md:pb-10 md:pt-2">
      <div className="ks-track ks-track-slow">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.kind} p={p} />
        ))}
        {PRODUCTS.map((p) => (
          <ProductCard key={`${p.kind}-dup`} p={p} hidden />
        ))}
      </div>
    </div>
  );
}
