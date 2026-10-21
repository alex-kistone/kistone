import { clientPrice } from "@/lib/pricing";
import { rhythmLabel, verticalOf } from "@/lib/verticals";
import type { SheetClient, SheetKpi, SheetSpec } from "./profileSheet";

/** Profil freelance tel que lu dans l'admin (champs utiles aux fiches). */
export type SheetFreelance = {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  photo_url?: string | null;
  job_title?: string | null;
  vertical?: string | null;
  specialties?: string[] | null;
  skills?: string[] | null;
  tech_specialties?: string[] | null;
  sectors?: string[] | null;
  intro_text?: string | null;
  years_experience?: number | null;
  weekly_capacity?: number | null;
  mobility?: string[] | null;
  remote_preference?: string | null;
  available?: boolean | null;
  availability_date?: string | null;
  tjm?: number | null;
  clients?: string[] | null;
  previous_companies?: string[] | null;
  missions?: { client_name?: string; profile_types?: string; kpis?: string; duration?: string }[] | null;
  languages?: { language: string; level: string }[] | null;
  admin_english_rating?: number | null;
};

/** Champs modifiables d'une fiche (une ligne par client : « Nom | sous-titre | 29 postes ; 19 jours… »). */
export type SheetFields = {
  name: string;
  headline: string;
  meta: string;
  specialties: string;
  sectors: string;
  clients: string;
  others: string;
  english: string;
  englishLevel: number;
  tjm: string;
  availability: string;
  availabilityNote: string;
};

const ENGLISH = ["", "Débutant", "Intermédiaire", "Avancé", "Courant", "Bilingue"];
const LEVELS: Record<string, number> = { "débutant": 1, "intermédiaire": 2, "avancé": 3, courant: 4, natif: 5 };
const REMOTE: Record<string, string> = { "on-site": "sur site", hybrid: "hybride", "full-remote": "full remote", flexible: "remote flexible" };

export function englishLevelOf(p: SheetFreelance): number {
  if (p.admin_english_rating) return p.admin_english_rating;
  const en = (p.languages ?? []).find((l) => l.language === "Anglais");
  return en ? LEVELS[en.level] ?? 0 : 0;
}

export function availabilityOf(p: SheetFreelance): { value: string; badge: string; available: boolean } {
  if (p.available !== false) return { value: "Immédiate", badge: "Dispo immédiatement", available: true };
  if (!p.availability_date) return { value: "À confirmer", badge: "Disponibilité à confirmer", available: false };
  const d = new Date(p.availability_date);
  if (d <= new Date()) return { value: "Immédiate", badge: "Dispo immédiatement", available: true };
  const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return { value: `Dès le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`, badge: `Dispo le ${date}`, available: false };
}

const isNumber = (s: string) => /^\s*[\d\s.,]+\s*%?\s*$/.test(s);

/** « 29 postes · FR, DE, NL ; 19 jours de time to fill » → chiffres et libellés. */
export function parseKpis(raw: string): SheetKpi[] {
  return raw.split(";").map((k) => k.trim()).filter(Boolean).map((k) => {
    const m = k.match(/^([\d][\d\s.,]*\s?(?:%|€|k|K)?)\s+(.+)$/);
    return m ? { value: m[1].trim(), label: m[2].trim() } : { value: "", label: k };
  });
}

/** Une ligne « Nom | sous-titre | chiffres » par client. */
export function parseClients(raw: string): SheetClient[] {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [name = "", subtitle = "", kpis = ""] = l.split("|").map((x) => x.trim());
    return { name, subtitle, kpis: parseKpis(kpis) };
  });
}

/** Chiffres d'une mission : recrutements (ou résultat) et durée. */
function missionKpis(m: NonNullable<SheetFreelance["missions"]>[number], rpo: boolean): string {
  const parts: string[] = [];
  const k = (m.kpis ?? "").trim();
  if (k) parts.push(isNumber(k) ? `${k} ${rpo ? "recrutements" : "résultat"}` : k);
  const d = (m.duration ?? "").trim();
  if (d) parts.push(/^\d/.test(d) ? `${d} de mission` : d);
  return parts.join(" ; ");
}

/**
 * Valeurs de départ d'une fiche. `anonymous` : carte LinkedIn publique (métier à la place du
 * prénom, missions sans nom de client, pas d'autres clients).
 */
export function initialSheetFields(p: SheetFreelance, anonymous: boolean): SheetFields {
  const v = verticalOf(p.vertical);
  const rpo = v.id === "rpo";
  const missions = (p.missions ?? []).filter((m) => (m.client_name ?? "").trim() || (m.profile_types ?? "").trim());
  const highlights = missions.slice(0, 3).map((m) =>
    anonymous
      ? `${(m.profile_types ?? "").trim() || "Mission"} | ${(m.duration ?? "").trim()} | ${missionKpis({ ...m, duration: "" }, rpo)}`
      : `${(m.client_name ?? "").trim()} | ${(m.profile_types ?? "").trim()} | ${missionKpis(m, rpo)}`,
  );
  const used = new Set(missions.slice(0, 3).map((m) => (m.client_name ?? "").trim().toLowerCase()));
  const others = anonymous ? [] : (p.clients ?? []).filter((c) => !used.has(c.trim().toLowerCase())).slice(0, 3).map((c) => `${c} | `);
  const level = englishLevelOf(p);
  const dispo = availabilityOf(p);
  const place = (p.mobility ?? [])[0]?.split(",")[0].trim();
  const roleName = rpo ? "Tech Recruiter" : v.short;
  return {
    name: anonymous ? roleName : p.first_name.trim().split(/\s+/)[0],
    headline: (p.job_title ?? "").trim() || `${roleName} freelance`,
    meta: [p.years_experience ? `${p.years_experience} ans d'expérience` : "", rpo ? "RPO freelance" : `${v.short} freelance`, rhythmLabel(p.weekly_capacity)].filter(Boolean).join(" · "),
    specialties: (rpo ? [...(p.skills ?? []).filter((s) => s !== "Autres"), ...(p.tech_specialties ?? [])] : p.specialties ?? []).filter((x, i, a) => a.indexOf(x) === i).slice(0, 7).join(", "),
    sectors: (p.sectors ?? []).filter((s) => s !== "Autre").join(", "),
    clients: highlights.join("\n"),
    others: others.join("\n"),
    english: ENGLISH[level] ?? "",
    englishLevel: level,
    tjm: p.tjm ? `${clientPrice(p.tjm)} €` : "Sur demande",
    availability: dispo.value,
    availabilityNote: [place, p.remote_preference ? REMOTE[p.remote_preference] : ""].filter(Boolean).join(" · "),
  };
}

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

/** Fiche à dessiner à partir des champs. */
export function sheetSpec(p: SheetFreelance, f: SheetFields, anonymous: boolean, withPhoto: boolean): SheetSpec {
  const v = verticalOf(p.vertical);
  const dispo = availabilityOf(p);
  return {
    vertical: p.vertical,
    header: `Profil expert · ${v.id === "rpo" ? "Tech recruiter" : v.short}`,
    badge: { text: dispo.badge, available: dispo.available },
    photo: withPhoto ? p.photo_url : null,
    name: f.name,
    headline: f.headline,
    meta: f.meta,
    specialties: list(f.specialties),
    sectors: list(f.sectors),
    clientsLabel: anonymous ? "Missions récentes" : "Clients majeurs",
    highlights: parseClients(f.clients),
    others: anonymous ? [] : parseClients(f.others).map((c) => ({ name: c.name, subtitle: c.subtitle })),
    english: f.english ? { label: f.english, level: f.englishLevel } : null,
    tjm: f.tjm,
    availability: { value: f.availability, note: f.availabilityNote },
    ref: !anonymous && p.id ? `Réf. ${p.id.replace(/-/g, "").slice(0, 5).toUpperCase()}` : undefined,
  };
}
