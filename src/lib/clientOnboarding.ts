import { supabase } from "@/integrations/supabase/client";

type ClientIdentity = { first_name?: string | null; last_name?: string | null; phone?: string | null; company_name?: string | null };

/** Étape 1 de l'onboarding client faite : identité, téléphone et entreprise renseignés. */
export const clientIdentityComplete = (p: ClientIdentity | null | undefined) =>
  !!p && [p.first_name, p.last_name, p.phone, p.company_name].every((v) => !!v?.trim());

/** Page d'arrivée d'un client connecté : l'onboarding tant que l'étape 1 n'est pas faite. */
export async function clientHomePath(userId: string): Promise<string> {
  const { data } = await supabase
    .from("client_profiles" as never)
    .select("first_name, last_name, phone, company_name")
    .eq("user_id", userId)
    .maybeSingle();
  return clientIdentityComplete(data as ClientIdentity | null) ? "/client/dashboard" : "/client/onboarding";
}
