import { describe, expect, it } from "vitest";
import { initialSheetFields, parseClients, parseKpis, sheetSpec, type SheetFreelance } from "@/components/platform/admin/linkedin/profileSheetData";

const leila: SheetFreelance = {
  id: "k879n000-0000",
  first_name: "Leïla Sophie",
  last_name: "Martin",
  vertical: "rpo",
  job_title: "Senior Talent Acquisition Partner",
  skills: ["Tech", "Data/AI"],
  tech_specialties: ["Cyber"],
  sectors: ["Télécom", "Autre"],
  years_experience: 11,
  clients: ["Veepee", "AWS", "AXA"],
  missions: [{ client_name: "Veepee", profile_types: "Tech, IA & corporate", kpis: "29", duration: "1 an" }],
  admin_english_rating: 5,
  available: true,
  tjm: 500,
  mobility: ["Paris"],
  remote_preference: "flexible",
};

describe("fiche profil", () => {
  it("lit les chiffres et les lignes de clients", () => {
    expect(parseKpis("29 postes · FR, DE, NL ; 97 % offres acceptées ; en cours")).toEqual([
      { value: "29", label: "postes · FR, DE, NL" },
      { value: "97 %", label: "offres acceptées" },
      { value: "", label: "en cours" },
    ]);
    expect(parseClients("AWS | Cloud, DevOps | 1200 recrutements / an\n\nAXA | Data")).toEqual([
      { name: "AWS", subtitle: "Cloud, DevOps", kpis: [{ value: "1200", label: "recrutements / an" }] },
      { name: "AXA", subtitle: "Data", kpis: [] },
    ]);
  });

  it("fiche client : prénom, clients nommés, référence", () => {
    const f = initialSheetFields(leila, false);
    expect(f.name).toBe("Leïla");
    expect(f.clients).toBe("Veepee | Tech, IA & corporate | 29 recrutements ; 1 an de mission");
    expect(f.others).toBe("AWS | \nAXA | ");
    expect(f.tjm).toBe("600 €");
    expect(f.english).toBe("Bilingue");
    expect(f.specialties).toBe("Tech, Data/AI, Cyber");
    expect(f.sectors).toBe("Télécom");
    expect(sheetSpec(leila, f, false, true).ref).toBe("Réf. K879N");
  });

  it("carte LinkedIn : anonyme, sans nom ni client", () => {
    const f = initialSheetFields(leila, true);
    expect(f.name).toBe("Tech Recruiter");
    expect(f.clients).not.toMatch(/Veepee|AWS|AXA/);
    expect(f.others).toBe("");
    const spec = sheetSpec(leila, f, true, true);
    expect(spec.ref).toBeUndefined();
    expect(spec.clientsLabel).toBe("Missions récentes");
    expect(JSON.stringify(spec)).not.toMatch(/Leïla|Martin|Veepee/);
  });
});
