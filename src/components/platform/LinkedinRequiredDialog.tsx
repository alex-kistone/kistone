import { useState } from "react";
import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LINKEDIN_HINT, normalizeLinkedinUrl } from "@/lib/linkedin";

type Props = {
  open: boolean;
  profileId: string;
  onSaved: (url: string) => void;
};

/**
 * Fenêtre bloquante pour un freelance déjà inscrit sans URL LinkedIn : elle ne se
 * ferme qu'une fois l'URL enregistrée (clé de synchronisation avec l'ATS).
 */
export default function LinkedinRequiredDialog({ open, profileId, onSaved }: Props) {
  const { toast } = useToast();
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
    const { error: dbError } = await supabase.from("recruiter_profiles").update({ linkedin_url: url }).eq("id", profileId);
    setSaving(false);
    if (dbError) {
      toast({ title: "Erreur", description: dbError.message, variant: "destructive" });
      return;
    }
    onSaved(url);
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
          <DialogTitle>Ajoutez votre profil LinkedIn</DialogTitle>
          <DialogDescription>
            Il est obligatoire pour être proposé sur des missions : il nous permet de synchroniser votre profil avec notre outil de
            recrutement.
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
              aria-describedby="linkedin-required-error"
              autoFocus
            />
          </div>
          {error ? <p id="linkedin-required-error" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <Button onClick={save} disabled={saving || !value.trim()} className="w-full">
          {saving ? "Enregistrement…" : "Enregistrer et continuer"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
