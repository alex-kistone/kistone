import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  /** Page de retour après LinkedIn : elle récupère la session et attribue le rôle freelance. */
  redirectTo: string;
  disabled?: boolean;
  onStart?: () => void;
  onError?: () => void;
};

/** Connexion / inscription LinkedIn, réservée aux freelances (fournisseur Supabase linkedin_oidc). */
export default function LinkedInButton({ redirectTo, disabled, onStart, onError }: Props) {
  const { toast } = useToast();

  const signIn = async () => {
    onStart?.();
    const { error } = await supabase.auth.signInWithOAuth({ provider: "linkedin_oidc", options: { redirectTo } });
    if (error) {
      onError?.();
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" size="lg" className="mb-4 w-full gap-3" onClick={signIn} disabled={disabled}>
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#0A66C2"
          d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z"
        />
      </svg>
      Continuer avec LinkedIn
    </Button>
  );
}
