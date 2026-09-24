import { useState } from "react";
import { cn } from "@/lib/utils";
import { BOOKING } from "@/content/studio";
import { Arrow, Calendar, Timer } from "./icons";

/**
 * Carte de réservation (ancre #rdv). Maquette visuelle : le choix du créneau
 * est local, rien n'est envoyé. Le bouton affiche un placeholder tant que
 * l'outil de prise de rendez-vous n'est pas branché.
 */
export default function BookingCard() {
  const [slot, setSlot] = useState<string>(BOOKING.defaultSlot);
  const [asked, setAsked] = useState(false);
  const label = slot ? `Confirmer le créneau de ${slot}` : "Choisir un créneau";
  const labelShort = slot ? `Confirmer ${slot}` : "Choisir un créneau";

  const confirm = (
    <button
      type="button"
      onClick={() => setAsked(true)}
      className="ks-btn inline-flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-ks-pink px-7 text-base font-semibold text-white shadow-ks-pink md:h-14 md:w-auto"
    >
      <span className="md:hidden">{labelShort}</span>
      <span className="hidden md:inline">{label}</span>
      <Arrow size={16} className="hidden md:block" />
    </button>
  );

  return (
    <section id="rdv" className="mt-[72px] scroll-mt-24 px-3 md:mt-[120px] md:px-8">
      <div className="ks-reveal mx-auto grid max-w-ks items-center gap-5 rounded-[28px] border border-[rgba(20,19,18,0.06)] bg-white px-5 py-7 shadow-[0_1px_2px_rgba(20,19,18,0.04),0_30px_60px_-32px_rgba(60,40,20,0.22)] md:gap-10 md:rounded-[36px] md:p-12 lg:grid-cols-2 lg:gap-14 lg:p-14">
        <div>
          <div className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-ks-pink-100 px-3 text-xs font-medium text-ks-pink-ink md:h-8 md:gap-2 md:px-3.5 md:text-[13px]">
            <Timer className="hidden md:block" />
            {BOOKING.badge}
          </div>
          <h2 className="mt-4 font-ks-display text-[38px] font-bold leading-[1.02] tracking-[-0.045em] md:mt-5 md:text-[52px] md:leading-none lg:text-[60px]">
            {BOOKING.title}
          </h2>
          <p className="mt-3 max-w-[480px] text-[15px] leading-[1.55] text-ks-soft md:mt-[18px] md:text-lg">{BOOKING.text}</p>
          <div className="mt-8 hidden lg:block">{confirm}</div>
        </div>

        <div>
          <div className="rounded-[20px] border-ks-line bg-ks-bg p-[18px] md:rounded-3xl md:border md:p-7">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold md:text-[15px]">{BOOKING.date}</span>
              <Calendar className="hidden md:block" />
            </div>
            <div role="group" aria-label={`Créneaux disponibles, ${BOOKING.date}`} className="mt-3.5 grid grid-cols-3 gap-2 md:mt-[18px] md:gap-2.5">
              {BOOKING.slots.map((t) => {
                const on = slot === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setSlot(t);
                      setAsked(false);
                    }}
                    className={cn(
                      "ks-slot h-11 rounded-xl border font-ks-mono text-[13px] md:h-12 md:text-sm",
                      on ? "border-ks-dark bg-ks-dark text-ks-dark-fg" : "border-[rgba(20,19,18,0.08)] bg-white text-ks-ink",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <p className="mt-3.5 text-[13px] text-ks-subtle md:mt-[18px] md:text-sm">{BOOKING.where}</p>
          </div>
          <div className="mt-[18px] md:mt-6 lg:hidden">{confirm}</div>
          <p role="status" className="mt-3 min-h-[1.5em] text-[13px] text-ks-subtle md:text-sm">
            {asked ? BOOKING.pending : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
