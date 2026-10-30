import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/KistoneHeader";
import { BoltWatermark } from "@/components/brand/Bolt";
import Highlight from "@/components/site/Highlight";
import { ArrowIcon } from "@/components/site/Cta";
import { BOOKING_EMBED_URL } from "@/content/site";
import { supabase } from "@/integrations/supabase/client";
import { takeHomeBrief } from "@/lib/homeBrief";
import { palettes } from "@/lib/palettes";
import { VERTICALS, isVertical, type Vertical } from "@/lib/verticals";
import {
  DURATIONS, ENGAGEMENTS, OPEN_POSITIONS_MAX, RHYTHMS, STARTS, isEmail, needRequestLines,
  type Engagement, type Option,
} from "@/lib/needRequest";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
const TOTAL = 6;

/** Ligne de choix : un clic répond et passe à l'étape suivante. */
function Choice({ option, selected, onPick }: { option: Option; selected: boolean; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-pressed={selected}
        className={cn(
          "ks-lift flex w-full items-center justify-between gap-4 rounded-[20px] border bg-white px-6 py-5 text-left shadow-[0_1px_2px_rgba(20,19,18,0.04)]",
          selected ? "border-ks-ink" : "border-[rgba(20,19,18,0.08)]",
        )}
      >
        <span className="flex flex-col gap-1">
          <span className="text-[17px] font-semibold text-ks-ink">{option.label}</span>
          {option.hint && <span className="text-sm text-ks-soft">{option.hint}</span>}
        </span>
        <span className="shrink-0 text-ks-ink"><ArrowIcon /></span>
      </button>
    </li>
  );
}

function StepTitle({ title, lead }: { title: ReactNode; lead?: ReactNode }) {
  return (
    <>
      <h1 className="font-ks-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-ks-ink [text-wrap:balance] md:text-[48px]">{title}</h1>
      {lead && <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-ks-soft">{lead}</p>}
    </>
  );
}

const primaryButton = "ks-btn ks-grad-border inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-7 text-base font-semibold disabled:opacity-60";

/**
 * Parcours public « Déposer un besoin » (/besoin), sans compte : profil, modèle, rythme ou durée
 * ou postes, démarrage, récapitulatif avec l'email, puis confirmation et prise de rendez-vous.
 * La demande est enregistrée par la fonction need-request et traitée dans l'admin.
 */
const NeedRequestPage = () => {
  const [searchParams] = useSearchParams();
  const preset = searchParams.get("fonction");
  const [step, setStep] = useState<Step>(isVertical(preset) ? 2 : 1);
  const [vertical, setVertical] = useState<Vertical | null>(isVertical(preset) ? preset : null);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [rhythm, setRhythm] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [positions, setPositions] = useState("");
  const [start, setStart] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // champ piège pour les robots
  const [brief] = useState(() => takeHomeBrief());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Depuis le récapitulatif, une modification ramène au récapitulatif
  const [editing, setEditing] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const go = (next: Step) => { setError(null); setStep(next); };
  const after = (current: Step) => {
    if (editing) { setEditing(false); return go(5); }
    if (current === 2 && engagement === "unsure") return go(4);
    go((current + 1) as Step);
  };
  const back = () => {
    if (step === 4 && engagement === "unsure") return go(2);
    go((step - 1) as Step);
  };
  const edit = (target: Step) => { setEditing(true); go(target); };

  const pickEngagement = (e: Engagement) => {
    setEngagement(e);
    if (editing && e !== "unsure") { go(3); return; } // nouveau modèle : sa question 3, puis retour au récapitulatif
    if (editing) { setEditing(false); go(5); return; }
    go(e === "unsure" ? 4 : 3);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isEmail(email.trim())) { setError("Indiquez une adresse email valide."); return; }
    setSending(true);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("need-request", {
      body: { email: email.trim(), vertical, engagement, rhythm, duration, open_positions: positions, start_window: start, brief, website },
    });
    setSending(false);
    if (fnError) {
      let message = "Enregistrement impossible. Réessayez dans un instant.";
      try {
        const body = await (fnError as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch { /* réponse illisible */ }
      setError(message);
      return;
    }
    go(6);
  };

  const recap = vertical && engagement && start
    ? needRequestLines({ vertical, engagement, rhythm, duration, open_positions: positions.trim() || null, start_window: start })
    : [];
  const recapStep: Record<string, Step> = { Profil: 1, Modèle: 2, Rythme: 3, Durée: 3, "Postes ouverts": 3, Démarrage: 4 };

  return (
    <div className="ks-site relative isolate min-h-screen overflow-x-clip bg-background">
      <SEO
        title="Déposer un besoin : un expert IA sous 48 h"
        description="AI Engineer, AI Product, AI Leader ou Tech Recruiter : décrivez votre besoin en quatre questions et réservez 30 minutes pour le préciser. Gratuit et sans engagement."
        path="/besoin"
      />
      <BoltWatermark strokeWidth={14} className="-right-48 top-32 h-[820px] w-auto rotate-[14deg]" />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
        {step < 6 && (
          <div className="mb-10 flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={back} className="inline-flex items-center gap-2 text-sm font-medium text-ks-soft hover:text-ks-ink">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour
              </button>
            ) : <span />}
            <span className="font-ks-mono text-xs uppercase tracking-[0.14em] text-ks-subtle" aria-live="polite">
              Étape {step} sur {TOTAL}
            </span>
          </div>
        )}

        {step === 1 && (
          <>
            <StepTitle title="De quel profil avez-vous besoin ?" lead="Un expert IA en freelance, ou un recruteur pour internaliser vos talents." />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {VERTICALS.map((v) => {
                const p = palettes[v.palette];
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => { setVertical(v.id); after(1); }}
                      aria-pressed={vertical === v.id}
                      className={cn(
                        "ks-lift flex h-full w-full flex-col items-start gap-4 rounded-[28px] border bg-white p-6 text-left shadow-[0_1px_2px_rgba(20,19,18,0.04)]",
                        vertical === v.id ? "border-ks-ink" : "border-[rgba(20,19,18,0.08)]",
                      )}
                    >
                      <span className="font-ks-mono text-xs font-medium" style={{ color: p.ink }}>[{v.group}]</span>
                      <span className="text-xl font-bold leading-tight text-ks-ink">Je recherche {v.seeking.split(" ")[0]} <Highlight>{v.seeking.split(" ").slice(1).join(" ")}</Highlight></span>
                      <span className="text-sm text-ks-soft">{v.description}</span>
                      <span className="h-1 w-12 rounded-full" style={{ background: p.accent }} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-10 text-sm text-ks-soft">
              Déjà client ? <Link to="/client" className="font-medium text-ks-ink underline underline-offset-2">Se connecter</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <StepTitle title="Quel modèle d'engagement ?" lead="Choisissez celui qui correspond à votre situation. Rien n'est figé : on l'ajuste ensemble." />
            <ul className="mt-10 space-y-3">
              {ENGAGEMENTS.map((o) => <Choice key={o.value} option={o} selected={engagement === o.value} onPick={() => pickEngagement(o.value)} />)}
            </ul>
          </>
        )}

        {step === 3 && engagement === "fractional" && (
          <>
            <StepTitle title="Combien de temps par semaine ?" lead="À peu près, combien de jours par semaine l'expert doit-il vous consacrer ?" />
            <ul className="mt-10 space-y-3">
              {RHYTHMS.map((o) => <Choice key={o.value} option={o} selected={rhythm === o.value} onPick={() => { setRhythm(o.value); after(3); }} />)}
            </ul>
          </>
        )}

        {step === 3 && engagement === "mission" && (
          <>
            <StepTitle title="Pour combien de temps ?" lead="La durée prévue de la mission, même approximative." />
            <ul className="mt-10 space-y-3">
              {DURATIONS.map((o) => <Choice key={o.value} option={o} selected={duration === o.value} onPick={() => { setDuration(o.value); after(3); }} />)}
            </ul>
          </>
        )}

        {step === 3 && engagement === "cdi" && (
          <form onSubmit={(e) => { e.preventDefault(); if (positions.trim()) after(3); }}>
            <StepTitle title="Combien de postes à pourvoir ?" lead="Le nombre de recrutements en CDI, et les métiers si vous les connaissez." />
            <label htmlFor="positions" className="sr-only">Postes ouverts</label>
            <input
              id="positions"
              value={positions}
              onChange={(e) => setPositions(e.target.value)}
              maxLength={OPEN_POSITIONS_MAX}
              autoFocus
              placeholder="Ex. : 4 postes, 2 Data Engineers et 2 développeurs back-end"
              className="mt-10 h-14 w-full rounded-[14px] border border-[rgba(20,19,18,0.12)] bg-white px-5 text-base text-ks-ink outline-none placeholder:text-ks-subtle focus-visible:ring-2 focus-visible:ring-ks-pink focus-visible:ring-offset-2"
            />
            <button type="submit" disabled={!positions.trim()} className={cn(primaryButton, "mt-6")}>
              Continuer <ArrowIcon />
            </button>
          </form>
        )}

        {step === 4 && (
          <>
            <StepTitle title="Quand souhaitez-vous démarrer ?" lead="Nous proposons en priorité des profils disponibles à cette date." />
            <ul className="mt-10 space-y-3">
              {STARTS.map((o) => <Choice key={o.value} option={o} selected={start === o.value} onPick={() => { setStart(o.value); after(4); }} />)}
            </ul>
          </>
        )}

        {step === 5 && (
          <form onSubmit={submit} noValidate>
            <StepTitle title="Votre besoin, en bref" lead="Vérifiez vos réponses et indiquez votre email professionnel pour enregistrer votre besoin." />
            <div className="mt-10 rounded-[20px] border border-[rgba(20,19,18,0.08)] bg-white p-6">
              <p className="font-ks-mono text-xs uppercase tracking-[0.14em] text-ks-subtle">Votre besoin</p>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {recap.map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-[15px]">
                    <dt className="sr-only">{l.label}</dt>
                    <dd className="text-ks-ink">{l.label === "Postes ouverts" ? `Postes : ${l.value}` : l.value}</dd>
                    <button type="button" onClick={() => edit(recapStep[l.label])} className="text-ks-subtle hover:text-ks-ink" aria-label={`Modifier : ${l.label}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </dl>
              {brief && <p className="mt-4 whitespace-pre-line border-t border-[rgba(20,19,18,0.06)] pt-4 text-sm text-ks-soft">« {brief} »</p>}
            </div>

            <label htmlFor="email" className="mt-8 block font-ks-mono text-xs uppercase tracking-[0.14em] text-ks-subtle">Email professionnel</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@entreprise.fr"
                aria-invalid={!!error}
                aria-describedby={error ? "need-error" : undefined}
                className="h-14 min-w-0 flex-1 rounded-[14px] border border-[rgba(20,19,18,0.12)] bg-white px-5 text-base text-ks-ink outline-none placeholder:text-ks-subtle focus-visible:ring-2 focus-visible:ring-ks-pink focus-visible:ring-offset-2"
              />
              <button type="submit" disabled={sending} className={primaryButton}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Enregistrer mon besoin {!sending && <ArrowIcon />}
              </button>
            </div>
            {/* Champ piège : invisible pour les humains, rempli par les robots */}
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />
            {error && <p id="need-error" role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
            <p className="mt-4 text-sm text-ks-soft">
              Votre recherche reste confidentielle : rien n'est partagé sans votre accord. En envoyant, vous acceptez notre{" "}
              <Link to="/privacy" className="underline underline-offset-2">politique de confidentialité</Link>.
            </p>
            <p className="mt-8 border-t border-[rgba(20,19,18,0.08)] pt-6 text-sm text-ks-soft">
              Vous êtes freelance ? <Link to="/freelances" className="font-medium text-ks-ink underline underline-offset-2">Rejoindre la communauté</Link>
            </p>
          </form>
        )}

        {step === 6 && (
          <div className="pt-6">
            <p className="font-ks-mono text-xs uppercase tracking-[0.14em]"><span className="ks-grad-text">Besoin enregistré</span></p>
            <div className="mt-4">
              <StepTitle
                title={<>Merci, on s'en occupe. <Highlight>Parlons-en 30 minutes.</Highlight></>}
                lead="Choisissez un créneau avec Alexandre pour préciser le contexte et les compétences clés. Vous recevez ensuite un premier profil qualifié sous 48 h."
              />
            </div>
            {/* Agenda Google intégré (iframe autorisée par frame-src) */}
            <div className="mt-10 overflow-hidden rounded-[20px] border border-[rgba(20,19,18,0.08)] bg-white">
              <iframe
                src={BOOKING_EMBED_URL}
                title="Réserver un appel de 30 minutes avec Alexandre"
                className="block h-[1050px] w-full md:h-[720px]"
                loading="lazy"
              />
            </div>
            <p className="mt-6 text-sm text-ks-soft">
              Pas le temps maintenant ? Nous vous écrivons à {email.trim()} pour convenir d'un moment.{" "}
              <Link to="/" className="font-medium text-ks-ink underline underline-offset-2">Retour à l'accueil</Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NeedRequestPage;
