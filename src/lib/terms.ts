import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Version des CGU en vigueur : la changer redemande l'acceptation à tous les utilisateurs. */
export const TERMS_VERSION = "2026-11-17";
export const TERMS_PATH = "/cgu";

type Status = boolean | null; // null : en cours de vérification
let cached: { userId: string; accepted: boolean } | null = null;
const listeners = new Set<(s: Status) => void>();

async function check(): Promise<Status> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  if (cached?.userId === userId) return cached.accepted;
  const { data: row } = await supabase
    .from("terms_acceptances" as never)
    .select("version")
    .eq("user_id", userId)
    .eq("version", TERMS_VERSION)
    .maybeSingle();
  cached = { userId, accepted: !!row };
  return cached.accepted;
}

/** Enregistre l'acceptation des CGU en vigueur pour l'utilisateur connecté. */
export async function acceptTerms(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return "Session expirée : reconnectez-vous.";
  const { error } = await supabase.from("terms_acceptances" as never).insert({ user_id: userId, version: TERMS_VERSION } as never);
  // 23505 : déjà acceptées (double clic, autre onglet)
  if (error && error.code !== "23505") return error.message;
  cached = { userId, accepted: true };
  listeners.forEach((l) => l(true));
  return null;
}

/** Les CGU en vigueur sont-elles acceptées par l'utilisateur connecté ? (null pendant la vérification) */
export function useTermsAccepted(): Status {
  const [status, setStatus] = useState<Status>(null);
  useEffect(() => {
    let alive = true;
    check().then((s) => { if (alive) setStatus(s); });
    listeners.add(setStatus);
    return () => { alive = false; listeners.delete(setStatus); };
  }, []);
  return status;
}
