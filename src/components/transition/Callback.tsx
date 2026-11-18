import { useId, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLES } from "@/content/transition";
import { Lock } from "./TrBits";

interface Props {
  title: string;
  sub: string;
  /** Fonction présélectionnée (slug), sur une fiche de poste. */
  selected?: string;
  /** Version courte (hero, fiche) : une colonne, sans message. */
  compact?: boolean;
}

/**
 * Demande de rappel : enregistrée dans le back office (onglet Besoins) et envoyée par email à
 * Alex, via la fonction need-request.
 */
export default function Callback({ title, sub, selected = "", compact = false }: Props) {
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setState("sending");
    const { data: res, error: fnError } = await supabase.functions.invoke("need-request", {
      body: { kind: "callback", ...data, source: title, page: document.title },
    });
    if (fnError || !res?.ok) {
      let message = "erreur réseau.";
      try { message = (await (fnError as { context?: Response })?.context?.json())?.error ?? message; } catch { /* réponse illisible */ }
      setError(`L'envoi n'a pas abouti : ${message} Réessayez dans un instant.`);
      setState("error");
      return;
    }
    setState("sent");
  };

  return (
    <div className="callback">
      <h3>{title}</h3>
      <p>{sub}</p>
      <form className={`fields${compact ? "" : " two"}${state === "sent" ? " sent" : ""}${state === "error" ? " error" : ""}`} onSubmit={submit}>
        <div className="field"><label htmlFor={`${id}n`}>Nom et prénom</label><input id={`${id}n`} name="name" autoComplete="name" required maxLength={120} /></div>
        <div className="field"><label htmlFor={`${id}c`}>Entreprise</label><input id={`${id}c`} name="company" autoComplete="organization" required maxLength={160} /></div>
        <div className="field"><label htmlFor={`${id}t`}>Téléphone</label><input id={`${id}t`} name="phone" type="tel" autoComplete="tel" required maxLength={40} /></div>
        <div className="field">
          <label htmlFor={`${id}f`}>Fonction recherchée</label>
          <select id={`${id}f`} name="fonction" defaultValue={selected || ROLES[0].slug}>
            {ROLES.map((r) => <option key={r.slug} value={r.slug}>{r.short}</option>)}
            <option value="autre">Autre</option>
          </select>
        </div>
        {!compact && (
          <div className="field full">
            <label htmlFor={`${id}m`}>Votre situation, en quelques mots</label>
            <textarea id={`${id}m`} name="message" maxLength={4000} placeholder="Contexte, urgence, durée envisagée, localisation…" />
          </div>
        )}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
        <div className={compact ? "" : "full"}>
          <button className="btn btn-green btn-block" type="submit" disabled={state === "sending" || state === "sent"}>
            {state === "sending" ? "Envoi en cours…" : state === "sent" ? "Demande envoyée" : "Être rappelé·e par un associé"}
          </button>
        </div>
      </form>
      <div className="form-ok" role="status">Merci. Un associé vous rappelle sous 24 h ouvrées.</div>
      <div className="form-err" role="alert">{error}</div>
      <div className="secure"><Lock /> Échange strictement confidentiel. Réponse sous 24 h ouvrées.</div>
    </div>
  );
}
