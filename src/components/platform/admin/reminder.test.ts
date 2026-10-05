import { describe, expect, it } from "vitest";
import { reminderMessage } from "./DossierReminderDialog";

describe("message de relance", () => {
  it("liste les éléments manquants et renvoie vers la bonne rubrique", () => {
    const m = reminderMessage("Claire", "RPO Tech", ["Forme juridique", "Email de facturation"], "client");
    expect(m).toContain("Bonjour Claire,");
    expect(m).toContain("« RPO Tech »");
    expect(m).toContain("- Forme juridique\n- Email de facturation");
    expect(m).toContain("« Mon dossier »");
    expect(reminderMessage("", "RPO Data", ["Kbis"], "freelance")).toContain("« Mon administratif »");
  });
});
