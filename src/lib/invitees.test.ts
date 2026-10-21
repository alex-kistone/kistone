import { describe, expect, it } from "vitest";
import { csvToInviteeLines, parseInvitees } from "./invitees";

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

describe("csvToInviteeLines", () => {
  it("reconnaît les colonnes d'un export avec en-tête", () => {
    const csv = "﻿First Name;Last Name;Email Address\nMarie;Dupont;marie@exemple.fr\nJean;Martin;\n\"Léo\";\"Bernard\";leo@exemple.fr";
    expect(csvToInviteeLines(csv)).toEqual(["Marie ; marie@exemple.fr", "Léo ; leo@exemple.fr"]);
  });

  it("lit un fichier sans en-tête", () => {
    expect(csvToInviteeLines("sophie@exemple.fr,Sophie\nines@exemple.fr")).toEqual(["Sophie ; sophie@exemple.fr", "ines@exemple.fr"]);
  });

  it("s'enchaîne avec la lecture des invitations", () => {
    const { invitees } = parseInvitees(csvToInviteeLines("Prénom,Email\nMarie,marie@exemple.fr").join("\n"));
    expect(invitees).toEqual([{ email: "marie@exemple.fr", first_name: "Marie" }]);
  });
});
