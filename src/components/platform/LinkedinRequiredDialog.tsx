import { useState } from "react";
import { ChevronDown, ExternalLink, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LINKEDIN_HINT, normalizeLinkedinUrl } from "@/lib/linkedin";
import LinkedinUrlHowTo from "./LinkedinUrlHowTo";

type Props = {
  open: boolean;
  /** Première connexion (profil pas encore créé) ou profil existant sans URL. */
  firstVisit: boolean;
  /** Enregistre l'URL canonique ; renvoie un message d'erreur, ou null si tout va bien. */
  onSubmit: (url: string) => Promise<string | null>;
};

/**
 * linkedin.com/in/ redirige un membre connecté vers son propre profil : le lien
 * « Récupérer mon URL LinkedIn » l'y amène directement, il n'a plus qu'à copier l'adresse.
 */
const LINKEDIN_OWN_PROFILE = "https://www.linkedin.com/in/";

/**
 * Fenêtre bloquante : le freelance doit coller son URL LinkedIn avant d'accéder à son
 * profil. L'URL est la clé de synchronisation avec l'ATS (Jarvi).
 */
export default function LinkedinRequiredDialog({ open, firstVisit, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const save = async () => {
    const url = normalizeLinkedinUrl(value);
    if (!url) {
      setError(LINKEDIN_HINT);
      return;
    }
    setSaving(true);
    const failure = await onSubmit(url);
    setSaving(false);
    if (failure) setError(failure);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <img src="/logos/logo-full-black.png" alt="Kistone" width={1200} height={377} className="-ml-1.5 h-12 w-auto self-start" />
        <DialogHeader>
          <DialogTitle className="text-2xl leading-tight">
            {firstVisit ? "Créez votre profil freelance en partant de LinkedIn" : "Ajoutez votre profil LinkedIn"}
          </DialogTitle>
          <DialogDescription>
            {firstVisit
              ? "Nos clients veulent connaître la personne derrière le profil : votre LinkedIn est le point de départ."
              : "Il est obligatoire pour être proposé sur des missions : il nous permet de synchroniser votre profil avec notre outil de recrutement."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="linkedin-required">URL de votre profil LinkedIn</Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="linkedin-required"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder="https://www.linkedin.com/in/votre-profil"
              className="pl-10"
              aria-invalid={Boolean(error)}
              aria-describedby="linkedin-required-help"
              autoFocus
            />
          </div>
          <p id="linkedin-required-help" className={error ? "text-sm text-destructive" : "text-xs text-muted-foreground"}>
            {error ?? "Le lien ci-dessous ouvre votre profil LinkedIn : copiez son adresse, puis collez-la ici."}
          </p>
          <a
            href={LINKEDIN_OWN_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Récupérer mon URL LinkedIn
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">(nouvel onglet)</span>
          </a>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-expanded={showHelp}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Besoin d'aide ?
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showHelp ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {showHelp && <div className="mt-3"><LinkedinUrlHowTo /></div>}
        </div>
        {/* Dans un conteneur : la règle [&>button]:hidden ne doit masquer que la croix de fermeture */}
        <div>
          <Button onClick={save} disabled={saving || !value.trim()} className="w-full">
            {saving ? "Enregistrement…" : "Valider"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
