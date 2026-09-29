import { supabase } from "@/integrations/supabase/client";
import { functionErrorMessage } from "@/components/platform/admin/adv";
import { getFrenchHolidays } from "@/lib/frenchHolidays";

/** CRA : libellés, calendrier et appels communs aux espaces freelance, client et admin. */

export const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** Statuts d'un CRA vus par l'administration (libellé et pastille). */
export const ADMIN_TIMESHEET_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  submitted: { label: "Soumis", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  client_approved: { label: "Validé", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  client_rejected: { label: "Refusé client", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  admin_invoiced: { label: "Facturé", color: "bg-accent text-accent-foreground" },
};

/** CRA validé par le client (ou par l'administration), facturé ou non. */
export const isValidatedTimesheet = (status: string) => status === "client_approved" || status === "admin_invoiced";

export type ExpenseCategory = "transport" | "hebergement" | "repas" | "autre";
export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  transport: "Transport",
  hebergement: "Hébergement",
  repas: "Repas",
  autre: "Autre",
};

export interface TimesheetExpense {
  id: string;
  timesheet_id: string;
  expense_date: string;
  category: ExpenseCategory;
  label: string;
  amount_ht: number;
  vat_amount: number;
  receipt_path: string | null;
}

export interface TimesheetSignature {
  signer_name: string;
  signer_email: string;
  method: "otp_email" | "admin";
  signed_at: string;
  document_sha256: string;
  certificate: { reference?: string; reason?: string | null };
}

export const euro = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
export const dayCount = (n: number) => `${String(n).replace(".", ",")} j`;

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Jour saisissable : ni week-end, ni férié, dans la période de mission. */
export function dayIsWorkable(dateStr: string, mission: { start_date: string; end_date: string | null }) {
  const date = new Date(`${dateStr}T12:00:00`);
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false;
  if (getFrenchHolidays(date.getFullYear()).has(dateStr)) return false;
  if (dateStr < mission.start_date) return false;
  if (mission.end_date && dateStr > mission.end_date) return false;
  return true;
}

/** Le mois peut-il avoir un CRA ? (déjà commencé et couvert par la mission) */
export function monthIsOpen(month: number, year: number, mission: { start_date: string; end_date: string | null }) {
  const first = iso(year, month, 1);
  const last = iso(year, month, new Date(year, month, 0).getDate());
  const today = new Date().toISOString().slice(0, 10);
  return first <= today && last >= mission.start_date && (!mission.end_date || first <= mission.end_date);
}

/** Appel de la fonction cra-sign ; renvoie les données ou lève une Error lisible. */
export async function craSign<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("cra-sign", { body });
  if (error) throw new Error(await functionErrorMessage(error));
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

/** Ouvre la preuve PDF d'un CRA validé (client ou admin). Renvoie un message d'erreur ou null. */
export async function openCraProof(timesheetId: string): Promise<string | null> {
  const win = window.open("", "_blank");
  try {
    const { url } = await craSign<{ url: string }>({ action: "proof_url", timesheet_id: timesheetId });
    if (win) {
      win.opener = null;
      win.location.href = url;
    } else {
      window.open(url, "_blank", "noopener");
    }
    return null;
  } catch (e) {
    win?.close();
    return e instanceof Error ? e.message : String(e);
  }
}
