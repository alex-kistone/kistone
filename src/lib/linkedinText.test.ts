import { describe, expect, it } from "vitest";
import { toLittleText } from "../../supabase/functions/_shared/linkedinText";

describe("texte LinkedIn (little text)", () => {
  it("échappe les caractères réservés et convertit les hashtags", () => {
    expect(toLittleText("Paris (hybride)")).toBe("Paris \\(hybride\\)");
    expect(toLittleText("#freelance #fractional")).toBe("{hashtag|\\#|freelance} {hashtag|\\#|fractional}");
    expect(toLittleText("TJM : 583 – 916 € HT/jour")).toBe("TJM : 583 – 916 € HT/jour");
  });
});
