/**
 * Radar CDI des freelances : les entreprises qui recrutent en CDI, repérées sur LinkedIn,
 * Indeed et les sites carrières via l'agrégateur TheirStack. Idée d'Alex (2026-11-06) : là où
 * une entreprise recrute en CDI, il y a souvent de la place pour un recruteur freelance.
 *
 * Le freelance lance lui-même sa recherche (fonction job-radar-refresh ; une seule dans la version
 * gratuite). Les offres trouvées lui sont rattachées (job_radar_user_offers), puis classées ici
 * selon son profil : métiers, secteurs, mobilité, préférence de remote. Pas d'API Deno ici : le front
 * l'importe tel quel via src/lib/jobRadar.ts.
 */
import { mobilityCovers } from "./locations.ts";
import { normalizeMetiers } from "./taxonomy.ts";

/** Offres où l'entreprise cherche elle-même un recruteur : le signal le plus direct. */
export const RECRUITER_SIGNAL = "Recrutement";

/**
 * Une recherche TheirStack par métier. Chaque entrée de `titles` est un groupe de mots que le
 * titre doit tous contenir, dans n'importe quel ordre (pas de virgule : refusée par l'API).
 */
export const RADAR_QUERIES: { metier: string; titles: string[] }[] = [
  { metier: RECRUITER_SIGNAL, titles: ["talent acquisition", "recruteur", "recruteuse", "chargé de recrutement", "chargée de recrutement", "recruiter", "responsable recrutement", "head of talent"] },
  { metier: "Tech", titles: ["développeur", "développeuse", "developer", "software engineer", "ingénieur logiciel", "devops", "fullstack", "backend", "frontend", "sre"] },
  { metier: "Data/AI", titles: ["data engineer", "data scientist", "data analyst", "machine learning", "ai engineer", "ingénieur ia", "mlops"] },
  { metier: "Product", titles: ["product manager", "product owner", "product designer", "ux designer", "chef de produit"] },
  { metier: "GTM", titles: ["marketing", "growth", "customer success", "communication"] },
  { metier: "Sales", titles: ["account executive", "business developer", "sales", "commercial", "commerciale", "ingénieur d'affaires", "key account"] },
  { metier: "Finance", titles: ["comptable", "contrôleur de gestion", "contrôleuse de gestion", "fp&a", "financial analyst", "trésorier", "finance"] },
  { metier: "Industrie", titles: ["ingénieur production", "ingénieur méthodes", "technicien maintenance", "responsable qualité", "ingénieur procédés", "responsable production"] },
];

/** Métiers du freelance retenus pour le radar (Autres et Head of TA n'ont pas de recherche). */
export const radarMetiers = (skills: string[] | null | undefined) =>
  normalizeMetiers(skills).filter((m) => m !== "Autres" && m !== "Head of TA");

/** Recherches d'un freelance : les offres de recruteur, plus ses métiers (tous s'il n'en a aucun). */
export function radarQueriesFor(skills: string[] | null | undefined) {
  const metiers = radarMetiers(skills);
  return metiers.length ? RADAR_QUERIES.filter((q) => q.metier === RECRUITER_SIGNAL || metiers.includes(q.metier)) : RADAR_QUERIES;
}

/** Recherches offertes dans la version gratuite. */
export const FREE_RADAR_RUNS = 1;

/** Exclus de toutes les recherches : ni stage, ni alternance, ni mission freelance. */
export const RADAR_TITLE_EXCLUDE = ["stage", "stagiaire", "alternance", "alternant", "alternante", "apprenti", "apprentie", "intern", "internship", "freelance"];

/** Une offre telle que stockée dans job_radar_offers. */
export interface RadarOffer {
  id: string;
  metier: string;
  job_title: string;
  company_name: string;
  company_domain: string | null;
  company_logo: string | null;
  company_industry: string | null;
  company_employees: number | null;
  company_funding: string | null;
  location: string | null;
  cities: string[];
  remote: boolean;
  hybrid: boolean;
  url: string;
  source_url: string | null;
  date_posted: string | null;
  fetched_at: string;
}

// Réponse brute de l'API TheirStack, lue champ par champ avec des gardes de type
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const str = (v: Json): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
/** Offres publiées sans nom d'entreprise : inexploitables pour un freelance. */
const HIDDEN_COMPANY = /^(anonymous|anonyme|confidential|confidentiel|confidentielle|entreprise confidentielle|undisclosed)$/i;
/** TheirStack tronque parfois le lieu court (« Île-de- ») : on prend alors le lieu complet. */
const placeOf = (job: Json): string | null => {
  const short = str(job.short_location);
  return short && !/[-,]$/.test(short) ? short : str(job.location) ?? short;
};

/** Offre TheirStack → ligne de job_radar_offers (null si l'offre est inexploitable). */
export function offerFromTheirStack(job: Json, metier: string, fetchedAt: string): RadarOffer | null {
  const company = job?.company_object ?? {};
  const name = str(job?.company) ?? str(company.name);
  const url = str(job?.final_url) ?? str(job?.url) ?? str(job?.source_url);
  if (job?.id == null || !name || HIDDEN_COMPANY.test(name) || !url || !str(job?.job_title)) return null;
  const employees = Number(company.employee_count);
  return {
    id: String(job.id),
    metier,
    job_title: str(job.job_title)!,
    company_name: name,
    company_domain: str(job.company_domain) ?? str(company.domain),
    company_logo: str(company.logo),
    company_industry: str(company.industry),
    company_employees: Number.isFinite(employees) && employees > 0 ? Math.round(employees) : null,
    company_funding: str(company.funding_stage),
    location: placeOf(job),
    cities: Array.isArray(job.cities) ? job.cities.filter((c: Json) => typeof c === "string") : [],
    remote: job.remote === true,
    hybrid: job.hybrid === true,
    url,
    source_url: str(job.source_url),
    date_posted: str(job.date_posted)?.slice(0, 10) ?? null,
    fetched_at: fetchedAt,
  };
}

/** Secteurs Kistone déduits du secteur LinkedIn de l'entreprise et de sa taille. */
export function offerSectors(o: Pick<RadarOffer, "company_industry" | "company_employees" | "company_funding">): string[] {
  const industry = (o.company_industry ?? "").toLowerCase();
  const out: string[] = [];
  const funded = !!o.company_funding && !/ipo|public/i.test(o.company_funding);
  if (funded && (o.company_employees == null || o.company_employees <= 1000)) out.push("Startup/scaleup");
  if (/bank|banking|insurance|financial services|banque|assurance/.test(industry)) out.push("Banque/assurance");
  if (/retail|e-?commerce|consumer goods|apparel|fashion|luxury/.test(industry)) out.push("Retail");
  if (/it services|it consulting|consulting|outsourcing/.test(industry)) out.push("ESN");
  if (/manufactur|industrial|automotive|aerospace|aviation|chemical|machinery|energy|construction|utilities|oil/.test(industry)) out.push("Industrie");
  return out;
}

export interface RadarProfile {
  skills: string[] | null;
  sectors: string[] | null;
  mobility: string[] | null;
  remote_preference: string | null;
}

export interface RadarCompany {
  key: string;
  name: string;
  domain: string | null;
  logo: string | null;
  industry: string | null;
  employees: number | null;
  /** Offres où l'entreprise cherche un recruteur en CDI. */
  recruiterOffers: RadarOffer[];
  /** Offres dans les métiers du freelance. */
  metierOffers: RadarOffer[];
  /** Nombre d'offres par métier, du plus fourni au moins fourni. */
  metierCounts: { metier: string; count: number }[];
  sectorMatch: boolean;
  /** Au moins une offre dans la zone de mobilité du freelance. */
  nearby: boolean;
  remoteFriendly: boolean;
  latest: string | null;
  score: number;
}

const companyKey = (o: RadarOffer) =>
  (o.company_domain ?? "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase() ||
  o.company_name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const offerPlaces = (o: RadarOffer) => [o.location ?? "", ...o.cities].filter(Boolean);

/**
 * Entreprises du radar pour un freelance, les plus prometteuses d'abord. On garde les offres de
 * recruteur et celles des métiers du freelance (tous les métiers s'il n'en a coché aucun).
 * Un freelance qui veut du sur site ou de l'hybride ne voit pas les entreprises hors de sa zone,
 * sauf offre en remote ; un freelance flexible ou full remote voit tout, les plus proches d'abord.
 */
export function rankRadar(profile: RadarProfile, offers: RadarOffer[], today = new Date()): RadarCompany[] {
  const skills = radarMetiers(profile.skills);
  const mobility = (profile.mobility ?? []).filter(Boolean);
  const sectors = new Set(profile.sectors ?? []);
  const local = profile.remote_preference === "on-site" || profile.remote_preference === "hybrid";

  const groups = new Map<string, RadarOffer[]>();
  for (const o of offers) {
    if (o.metier !== RECRUITER_SIGNAL && skills.length && !skills.includes(o.metier)) continue;
    const key = companyKey(o);
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }

  const out: RadarCompany[] = [];
  for (const [key, list] of groups) {
    const byDate = [...list].sort((a, b) => (b.date_posted ?? "").localeCompare(a.date_posted ?? ""));
    const first = byDate[0];
    const nearby = mobility.length > 0 && list.some((o) => offerPlaces(o).some((p) => mobility.some((m) => mobilityCovers(m, p))));
    const remoteFriendly = list.some((o) => o.remote || o.hybrid);
    if (local && mobility.length > 0 && !nearby && !list.some((o) => o.remote)) continue;

    const recruiterOffers = byDate.filter((o) => o.metier === RECRUITER_SIGNAL);
    const metierOffers = byDate.filter((o) => o.metier !== RECRUITER_SIGNAL);
    const counts = new Map<string, number>();
    for (const o of metierOffers) counts.set(o.metier, (counts.get(o.metier) ?? 0) + 1);
    const metierCounts = [...counts].map(([metier, count]) => ({ metier, count })).sort((a, b) => b.count - a.count);
    const withInfo = list.find((o) => o.company_industry || o.company_employees) ?? first;
    const sectorMatch = offerSectors(withInfo).some((s) => sectors.has(s));
    const latest = first.date_posted;
    const ageDays = latest ? (today.getTime() - new Date(`${latest}T00:00:00Z`).getTime()) / 86_400_000 : 99;

    const score =
      (recruiterOffers.length ? 40 + Math.min(recruiterOffers.length - 1, 3) * 5 : 0) +
      Math.min(metierOffers.length, 10) * 4 +
      (sectorMatch ? 10 : 0) +
      (nearby ? 10 : remoteFriendly ? 5 : 0) +
      (ageDays <= 3 ? 5 : 0);

    out.push({
      key,
      name: first.company_name,
      domain: list.find((o) => o.company_domain)?.company_domain ?? null,
      logo: list.find((o) => o.company_logo)?.company_logo ?? null,
      industry: withInfo.company_industry,
      employees: withInfo.company_employees,
      recruiterOffers,
      metierOffers,
      metierCounts,
      sectorMatch,
      nearby,
      remoteFriendly,
      latest,
      score,
    });
  }
  return out.sort((a, b) => b.score - a.score || (b.latest ?? "").localeCompare(a.latest ?? ""));
}

/** « linkedin.com », « fr.indeed.com » → « LinkedIn », « Indeed » ; sinon le domaine. */
export function sourceLabel(url: string | null): string | null {
  if (!url) return null;
  let host: string;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
  if (host.includes("linkedin.")) return "LinkedIn";
  if (host.includes("indeed.")) return "Indeed";
  if (host.includes("welcometothejungle.")) return "Welcome to the Jungle";
  return host;
}
