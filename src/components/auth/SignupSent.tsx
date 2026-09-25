import { useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  email: string;
  /** Page où le lien de confirmation ramène (elle attribue le rôle puis redirige vers l'espace). */
  redirectTo: string;
  onBack: () => void;
};

/** Remplace le formulaire d'inscription une fois le compte créé : l'utilisateur n'a plus rien à remplir. */
export default function SignupSent({ email, redirectTo, onBack }: Props) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo } });
    setSending(false);
    toast(
      error
        ? { title: "Envoi impossible", description: error.message, variant: "destructive" }
        : { title: "Mail renvoyé", description: `Un nouveau lien a été envoyé à ${email}.` },
    );
  };

  return (
    <main className="mx-3 my-8 flex max-w-[480px] flex-col items-center rounded-[28px] border border-border bg-card px-5 py-10 text-center shadow-md sm:mx-auto sm:my-16 sm:px-10 sm:py-12">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[16px] bg-ks-pink-100">
        <MailCheck className="h-6 w-6 text-foreground" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <h1 className="mb-3 font-heading text-[34px] font-bold leading-none tracking-[-0.045em] sm:text-[40px]">
        Vérifiez votre boîte mail
      </h1>
      <p className="text-muted-foreground">
        Nous avons envoyé un lien de confirmation à <span className="font-medium text-foreground">{email}</span>. Cliquez dessus pour
        activer votre compte : vous arriverez directement dans votre espace.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">Rien reçu ? Pensez à regarder dans vos spams.</p>
      <div className="mt-8 flex w-full flex-col gap-2.5">
        <Button variant="outline" size="lg" className="w-full" onClick={resend} disabled={sending}>
          {sending ? "Envoi…" : "Renvoyer le mail"}
        </Button>
        <button type="button" onClick={onBack} className="mt-2 text-sm text-muted-foreground hover:text-foreground">
          Retour à la connexion
        </button>
      </div>
    </main>
  );
}
