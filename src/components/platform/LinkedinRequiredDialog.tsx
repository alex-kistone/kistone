import { useState } from "react";
import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LINKEDIN_HINT, normalizeLinkedinUrl } from "@/lib/linkedin";

type Props = {
  open: boolean;
  /** Première connexion (profil pas encore créé) ou profil existant sans URL. */
  firstVisit: boolean;
  /** Enregistre l'URL canonique ; renvoie un message d'erreur, ou null si tout va bien. */
  onSubmit: (url: string) => Promise<string | null>;
};

/**
 * Fenêtre bloquante : le freelance doit coller son URL LinkedIn avant d'accéder à son
 * profil. L'URL est la clé de synchronisation avec l'ATS (Jarvi).
 */
export default function LinkedinRequiredDialog({ open, firstVisit, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        className="sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{firstVisit ? "Bienvenue sur Kistone" : "Ajoutez votre profil LinkedIn"}</DialogTitle>
          <DialogDescription>
            {firstVisit
              ? "Pour commencer, collez l'URL de votre profil LinkedIn. Elle est obligatoire pour être proposé sur des missions."
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
            {error ?? "Sur LinkedIn : votre profil, puis copiez l'adresse affichée dans le navigateur."}
          </p>
        </div>
        <Button onClick={save} disabled={saving || !value.trim()} className="w-full">
          {saving ? "Enregistrement…" : firstVisit ? "Accéder à mon profil" : "Enregistrer et continuer"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
