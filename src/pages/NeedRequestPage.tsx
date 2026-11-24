import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, MailCheck, Pencil } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/KistoneHeader";
import { BoltWatermark } from "@/components/brand/Bolt";
import Highlight from "@/components/site/Highlight";
import { ArrowIcon } from "@/components/site/Cta";
import { supabase } from "@/integrations/supabase/client";
import { takeHomeBrief } from "@/lib/homeBrief";
import { BUDGETS, DURATIONS, NEED_METIERS, STARTS, isEmail, needRequestLines, type Option } from "@/lib/needRequest";
import { pendingNeedFromRequest, savePendingNeed } from "@/lib/pendingNeed";
import { FREE_EMAIL_MESSAGE, isFreeEmail } from "@/lib/emailDomains";
import { cn } from "@/lib/utils";
import { BOOKING_URL } from "@/content/site";
import { PRICING_PATH, PRICING_READY } from "@/content/pricing";

/** Réassurance affichée à chaque étape (promesses déjà annoncées sur le site). */
const REASSURANCE = ["Un premier recruteur qualifié sous 48 h", "Gratuit et sans engagement", "Facturé au jour, sans honoraires au placement"];

type Step = 1 | 2 | 3 | 4 | 5;

/** Le parcours RPO : une mission de recruteur, dont le client précise le métier et la durée. */
const REQUEST = { vertical: "rpo", engagement: "mission", rhythm: null, open_positions: null } as const;
const TOTAL = 5;

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
 * Parcours public « Déposer un besoin » (/besoin), sans compte : métier, durée de la mission,
 * démarrage, budget, récapitulatif avec l'email. La demande est alors enregistrée (fonction
 * need-request, email à Alex), puis le client choisit : réserver un appel, ou voir les profils
 * qui correspondent et créer son compte (le besoin suit dans le parcours /client).
 */
const NeedRequestPage = () => {
  const [step, setStep] = useState<Step>(1);
  const [metier, setMetier] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  // Lien de connexion envoyé à cette adresse : remplace le formulaire
  const [sentTo, setSentTo] = useState<string | null>(null);
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
    go((current + 1) as Step);
  };
  const back = () => go((step - 1) as Step);
  const edit = (target: Step) => { setEditing(true); go(target); };

  /**
   * Lien de connexion (magic link) : crée le compte client ou connecte un client existant. Le
   * client choisit ensuite son mot de passe à l'étape des coordonnées (?via=link).
   */
  const sendLink = async (address: string) => {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/client?via=link` },
    });
    if (!otpError) return null;
    return /rate|seconds/i.test(otpError.message)
      ? "Un lien vient déjà de vous être envoyé : patientez une minute avant d'en demander un autre."
      : otpError.message;
  };

  /** Continuer avec Google : le besoin attend dans le navigateur, repris après la connexion. */
  const google = async () => {
    if (start) savePendingNeed(pendingNeedFromRequest({ metier, duration, start_window: start, budget, brief }));
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/client`, queryParams: { prompt: "select_account" } },
    });
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const address = email.trim().toLowerCase();
    if (!isEmail(address)) { setError("Indiquez une adresse email valide."); return; }
    if (isFreeEmail(address)) { setError(FREE_EMAIL_MESSAGE); return; }
    setSending(true);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("need-request", {
      body: { ...REQUEST, email: address, metier, duration, start_window: start, budget, brief, website },
    });
    if (fnError) {
      let message = "Enregistrement impossible. Réessayez dans un instant.";
      try {
        const body = await (fnError as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch { /* réponse illisible */ }
      setSending(false);
      setError(message);
      return;
    }
    // Le besoin attend dans le navigateur : il est créé, puis matché, une fois le compte ouvert
    if (start) savePendingNeed(pendingNeedFromRequest({ metier, duration, start_window: start, budget, brief }));
    const linkError = await sendLink(address);
    setSending(false);
    if (linkError) { setError(linkError); return; }
    setSentTo(address);
  };

  const recap = metier && duration && start && budget ? needRequestLines({ ...REQUEST, metier, duration, start_window: start, budget }) : [];
  const recapStep: Record<string, Step> = { Métier: 1, Durée: 2, Démarrage: 3, Budget: 4 };

  return (
    <div className="ks-site relative isolate min-h-screen overflow-x-clip bg-background">
      <SEO
        title="Partager un besoin de recrutement"
        description="Décrivez votre besoin de recrutement en quatre questions (Tech, Data, Product, Sales, Finance, Industrie) : un recruteur freelance qualifié sous 48 h. Gratuit."
        path="/besoin"
      />
      <BoltWatermark strokeWidth={14} className="-right-48 top-32 h-[820px] w-auto rotate-[14deg]" />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
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

        {step === 1 && (
          <>
            <StepTitle title="Sur quel métier recrutez-vous ?" lead="Votre recruteur est choisi pour sa spécialité." />
            <ul className="mt-10 space-y-3">
              {NEED_METIERS.map((o) => <Choice key={o.value} option={o} selected={metier === o.value} onPick={() => { setMetier(o.value); after(1); }} />)}
            </ul>
            <p className="mt-10 text-sm text-ks-soft">
              Déjà client ? <Link to="/client" className="font-medium text-ks-ink underline underline-offset-2">Se connecter</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <StepTitle title="Pour combien de temps ?" lead="La durée prévue de la mission, même approximative." />
            <ul className="mt-10 space-y-3">
              {DURATIONS.map((o) => <Choice key={o.value} option={o} selected={duration === o.value} onPick={() => { setDuration(o.value); after(2); }} />)}
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <StepTitle title="Quand souhaitez-vous démarrer ?" lead="Nous proposons en priorité des profils disponibles à cette date." />
            <ul className="mt-10 space-y-3">
              {STARTS.map((o) => <Choice key={o.value} option={o} selected={start === o.value} onPick={() => { setStart(o.value); after(3); }} />)}
            </ul>
          </>
        )}

        {step === 4 && (
          <>
            <StepTitle title="Quel budget journalier ?" lead="Une fourchette suffit : elle nous aide à vous présenter les bons profils." />
            <ul className="mt-10 space-y-3">
              {BUDGETS.map((o) => <Choice key={o.value} option={o} selected={budget === o.value} onPick={() => { setBudget(o.value); after(4); }} />)}
            </ul>
          </>
        )}

        {step === 5 && sentTo && (
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-ks-pink-100">
              <MailCheck className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <StepTitle title="Ouvrez votre boîte mail" />
            <p className="mt-4 text-[17px] leading-relaxed text-ks-soft">
              Un lien vient de partir à <strong className="text-ks-ink">{sentTo}</strong>. Cliquez dessus pour créer votre accès : vous choisirez
              votre mot de passe, et l'analyse des profils pour votre besoin démarrera aussitôt.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button type="button" onClick={google} className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[rgba(20,19,18,0.12)] bg-white px-6 font-medium hover:bg-[#FBF8F3]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Ou continuer avec Google
              </button>
              <p className="text-sm text-ks-soft">
                Rien reçu ? Regardez dans vos spams,{" "}
                <button type="button" className="underline underline-offset-2" onClick={async () => { const e = await sendLink(sentTo); setError(e); }}>renvoyez le lien</button>
                {" "}ou{" "}
                <button type="button" className="underline underline-offset-2" onClick={() => { setSentTo(null); setError(null); }}>changez d'adresse</button>.
              </p>
              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
            </div>
          </div>
        )}

        {step === 5 && !sentTo && (
          <form onSubmit={submit} noValidate>
            <StepTitle title="Votre besoin, en bref" lead="Vérifiez vos réponses et indiquez votre email professionnel pour accéder aux profils." />
            <div className="mt-10 rounded-[20px] border border-[rgba(20,19,18,0.08)] bg-white p-6">
              <p className="font-ks-mono text-xs uppercase tracking-[0.14em] text-ks-subtle">Votre besoin</p>
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {recap.map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-[15px]">
                    <dt className="sr-only">{l.label}</dt>
                    <dd className="text-ks-ink">{l.value}</dd>
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
                Accédez aux profils {!sending && <ArrowIcon />}
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

        {!sentTo && (
          <aside aria-label="Ce qui vous attend" className="mt-14 rounded-[24px] bg-white p-6 shadow-ks-card">
            <ul className="grid gap-3 text-[15px] text-ks-ink-2 sm:grid-cols-3">
              {REASSURANCE.map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <span className="ks-grad-bg mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md" aria-hidden="true"><Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /></span>
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-[rgba(20,19,18,0.08)] pt-4 text-sm text-ks-soft">
              Une question avant de commencer ?{" "}
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-ks-ink underline underline-offset-2">Réservez 30 minutes avec Alexandre</a>
              {/* Lien vers les tarifs une fois la page publiée (grille remplie) */}
              {PRICING_READY && <>{" "}· <Link to={PRICING_PATH} className="font-medium text-ks-ink underline underline-offset-2">Voir les tarifs</Link></>}
            </p>
          </aside>
        )}
      </main>
    </div>
  );
};

export default NeedRequestPage;
