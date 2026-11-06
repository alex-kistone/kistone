import { describe, expect, it } from "vitest";
import { offerFromTheirStack, rankRadar, RECRUITER_SIGNAL, sourceLabel, type RadarOffer, type RadarProfile } from "./jobRadar";
import { nonCompeteCompany } from "../../supabase/functions/_shared/nonCompete";

const today = new Date("2026-11-06T08:00:00Z");
let n = 0;
const offer = (over: Partial<RadarOffer>): RadarOffer => ({
  id: String(++n), metier: "Tech", job_title: "Développeur backend", company_name: "Acme", company_domain: "acme.fr",
  company_logo: null, company_industry: null, company_employees: null, company_funding: null,
  location: "Paris, Île-de-France", cities: ["Paris"], remote: false, hybrid: false,
  url: "https://www.linkedin.com/jobs/view/1", source_url: null, date_posted: "2026-11-05", fetched_at: "2026-11-06T06:00:00Z",
  ...over,
});
const profile = (over: Partial<RadarProfile> = {}): RadarProfile => ({
  skills: ["Tech"], sectors: [], mobility: ["Île-de-France"], remote_preference: "flexible", ...over,
});

describe("radar CDI : non-concurrence", () => {
  it("écarte les entreprises sous clause par leur nom ou leur domaine", () => {
    expect(nonCompeteCompany("Back Market", null, today)?.company).toBe("BackMarket");
    expect(nonCompeteCompany("VINCI Energies France", null, today)?.company).toBe("Vinci");
    expect(nonCompeteCompany("Une société", "https://www.payfit.com", today)?.company).toBe("Payfit");
    expect(nonCompeteCompany("Display", null, today)).toEqual({ company: "Display", certain: false });
  });

  it("laisse passer les noms qui ne font que contenir une marque, et les faux amis", () => {
    expect(nonCompeteCompany("Pickering Interfaces", null, today)).toBeNull();
    expect(nonCompeteCompany("Freeda", null, today)).toBeNull();
    expect(nonCompeteCompany("Doctolib", "doctolib.fr", today)).toBeNull();
  });

  it("ne filtre plus après le 20/04/2028", () => {
    expect(nonCompeteCompany("Back Market", null, new Date("2028-04-21T00:00:00Z"))).toBeNull();
  });
});

describe("radar CDI : classement", () => {
  it("regroupe les offres par entreprise et met en tête celles qui cherchent un recruteur", () => {
    const ranked = rankRadar(profile(), [
      offer({ company_name: "Acme" }), offer({ company_name: "Acme" }), offer({ company_name: "Acme" }),
      offer({ company_name: "Beta", company_domain: "beta.io", metier: RECRUITER_SIGNAL, job_title: "Talent Acquisition Manager" }),
    ], today);
    expect(ranked.map((c) => c.name)).toEqual(["Beta", "Acme"]);
    expect(ranked[1].metierCounts).toEqual([{ metier: "Tech", count: 3 }]);
  });

  it("ne garde que les métiers du freelance, plus les offres de recruteur", () => {
    const ranked = rankRadar(profile({ skills: ["Sales"] }), [
      offer({ metier: "Tech" }),
      offer({ company_name: "Gamma", company_domain: "gamma.fr", metier: "Sales" }),
      offer({ company_name: "Delta", company_domain: "delta.fr", metier: RECRUITER_SIGNAL }),
    ], today);
    expect(ranked.map((c) => c.name).sort()).toEqual(["Delta", "Gamma"]);
  });

  it("respecte la mobilité d'un freelance qui veut du sur site, sauf offre en remote", () => {
    const offers = [
      offer({ company_name: "Lyonnaise", company_domain: "lyon.fr", location: "Lyon", cities: ["Lyon"] }),
      offer({ company_name: "Distante", company_domain: "remote.fr", location: "Lyon", cities: ["Lyon"], remote: true }),
      offer({ company_name: "Parisienne", company_domain: "paris.fr" }),
    ];
    const onSite = rankRadar(profile({ remote_preference: "on-site" }), offers, today).map((c) => c.name);
    expect(onSite).toContain("Parisienne");
    expect(onSite).toContain("Distante");
    expect(onSite).not.toContain("Lyonnaise");
    expect(rankRadar(profile({ remote_preference: "full-remote" }), offers, today)).toHaveLength(3);
  });

  it("favorise le secteur du freelance", () => {
    const ranked = rankRadar(profile({ sectors: ["Banque/assurance"] }), [
      offer({ company_name: "Autre", company_domain: "autre.fr" }),
      offer({ company_name: "Banque", company_domain: "banque.fr", company_industry: "Banking" }),
    ], today);
    expect(ranked[0].name).toBe("Banque");
    expect(ranked[0].sectorMatch).toBe(true);
  });
});

describe("radar CDI : lecture des offres TheirStack", () => {
  it("prend le lien final, l'entreprise et le lieu court", () => {
    const row = offerFromTheirStack({
      id: 42, job_title: "Recruteur IT", company: "Acme", company_domain: "acme.fr",
      company_object: { logo: "https://logo", industry: "Software Development", employee_count: 120 },
      url: "https://acme.fr/jobs/1", final_url: "https://jobs.acme.fr/1", source_url: "https://fr.linkedin.com/jobs/view/1",
      short_location: "Paris", date_posted: "2026-11-05T10:00:00Z", remote: false, hybrid: true,
    }, RECRUITER_SIGNAL, "2026-11-06T06:00:00Z");
    expect(row).toMatchObject({ id: "42", url: "https://jobs.acme.fr/1", location: "Paris", date_posted: "2026-11-05", hybrid: true, company_employees: 120 });
    expect(offerFromTheirStack({ id: 1, job_title: "X" }, "Tech", "")).toBeNull();
    expect(sourceLabel(row!.source_url)).toBe("LinkedIn");
  });
});
