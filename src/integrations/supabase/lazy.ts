/**
 * Accès Supabase pour les pages publiques, sans charger le SDK complet (≈ 500 Ko de code).
 *
 * - getSupabase() : charge le client complet à la demande (envoi d'un besoin, visiteur connecté).
 * - hasStoredSession() : un visiteur a-t-il une session enregistrée ? (lecture du stockage local)
 * - restSelect() / restRpc() : lectures publiques directes sur l'API REST, avec la clé publique.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const URL_ = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

let client: Promise<SupabaseClient<Database>> | null = null;
export function getSupabase(): Promise<SupabaseClient<Database>> {
  client ??= import("./client").then((m) => m.supabase);
  return client;
}

/** Clé de stockage de la session Supabase (sb-<projet>-auth-token). */
export function hasStoredSession(): boolean {
  try {
    const ref = new URL(URL_).hostname.split(".")[0];
    return Boolean(localStorage.getItem(`sb-${ref}-auth-token`));
  } catch {
    return false;
  }
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

/** GET /rest/v1/<query> (ex. « blog_posts?status=eq.published »). Renvoie null en cas d'échec. */
export async function restSelect<T>(query: string): Promise<T | null> {
  try {
    const res = await fetch(`${URL_}/rest/v1/${query}`, { headers });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** POST /rest/v1/rpc/<fn>. Renvoie null en cas d'échec. */
export async function restRpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(args) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
