import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { acceptTerms, TERMS_PATH, useTermsAccepted } from "@/lib/terms";
import type { PlatformRole } from "@/content/platformNav";

const INTRO: Record<"client" | "freelance", string> = {
  freelance:
    "Pour créer votre profil et rester visible, acceptez les conditions générales d'utilisation. Votre profil (prénom, photo, métier, expérience, clients, missions, TJM, disponibilité) pourra être consulté par les entreprises inscrites sur Kistone, qui pourront vous proposer une visio.",
  client:
    "Pour accéder aux profils et proposer des visios, acceptez les conditions générales d'utilisation. Les profils sont réservés à vos recrutements : ni copie, ni extraction, ni revente.",
};

/**
 * Acceptation obligatoire des CGU en vigueur (espaces freelance et client) : tant qu'elles ne
 * sont pas acceptées, la fenêtre reste ouverte et ne se ferme pas.
 */
export default function TermsGate({ role }: { role: PlatformRole }) {
  const accepted = useTermsAccepted();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (role === "admin" || accepted !== false) return null;

  const accept = async () => {
    setSaving(true);
    setError(await acceptTerms());
    setSaving(false);
  };

  return (
    <Dialog open>
      <DialogContent className="max-w-lg [&>button]:hidden" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Conditions générales d'utilisation</DialogTitle>
          <DialogDescription>{INTRO[role]}</DialogDescription>
        </DialogHeader>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={checked} onCheckedChange={(c) => setChecked(c === true)} className="mt-0.5" />
          <span>
            J'ai lu et j'accepte les{" "}
            <a href={TERMS_PATH} target="_blank" rel="noreferrer" className="underline">conditions générales d'utilisation</a>{" "}
            et la <a href="/privacy" target="_blank" rel="noreferrer" className="underline">politique de confidentialité</a>.
          </span>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>Se déconnecter</Button>
          <Button onClick={accept} disabled={!checked || saving}>{saving ? "Enregistrement…" : "Accepter et continuer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
