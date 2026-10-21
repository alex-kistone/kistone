import { describe, expect, it } from "vitest";
import { parseInvitees } from "./invitees";

describe("parseInvitees", () => {
  it("lit les différents formats et garde le prénom", () => {
    const { invitees, invalid } = parseInvitees(
      "marie.dupont@exemple.fr\nJean Martin <Jean.Martin@exemple.fr>\nsophie ; sophie@exemple.fr\nleo@exemple.fr, ines@exemple.fr\npas une adresse",
    );
    expect(invitees).toEqual([
      { email: "marie.dupont@exemple.fr", first_name: null },
      { email: "jean.martin@exemple.fr", first_name: "Jean" },
      { email: "sophie@exemple.fr", first_name: "Sophie" },
      { email: "leo@exemple.fr", first_name: null },
      { email: "ines@exemple.fr", first_name: null },
    ]);
    expect(invalid).toEqual(["pas une adresse"]);
  });

  it("dédoublonne sans tenir compte de la casse", () => {
    expect(parseInvitees("a@b.fr\nA@B.fr").invitees).toHaveLength(1);
  });
});
