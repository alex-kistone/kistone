import { describe, expect, it } from "vitest";
import { nonCompeteMatch } from "../../supabase/functions/_shared/nonCompete";

const before = new Date("2026-10-21");

describe("nonCompeteMatch", () => {
  it("écarte les entreprises sous clause et leurs filiales", () => {
    expect(nonCompeteMatch("drh@backmarket.com", before)).toEqual({ company: "BackMarket", certain: true });
    expect(nonCompeteMatch("p.martin@vinci-energies.com", before)?.company).toBe("Vinci");
    expect(nonCompeteMatch("x@axians.fr", before)?.company).toBe("Vinci (Axians)");
    expect(nonCompeteMatch("a@mail.kpmg.fr", before)?.company).toBe("KPMG");
    expect(nonCompeteMatch("a@free-mobile.fr", before)?.company).toBe("Free / Iliad");
  });

  it("met de côté les homonymes possibles", () => {
    expect(nonCompeteMatch("a@display.fr", before)).toEqual({ company: "Display", certain: false });
    expect(nonCompeteMatch("a@bpifrance.fr", before)).toEqual({ company: "BPI France", certain: false });
  });

  it("laisse passer les faux amis et les autres entreprises", () => {
    expect(nonCompeteMatch("a@freeda.com", before)).toBeNull();
    expect(nonCompeteMatch("a@singular.net", before)).toBeNull();
    expect(nonCompeteMatch("a@iad.fr", before)).toBeNull();
    expect(nonCompeteMatch("a@doctolib.fr", before)).toBeNull();
    expect(nonCompeteMatch("a@gmail.com", before)).toBeNull();
    expect(nonCompeteMatch("a@displayscreens.com", before)).toBeNull();
  });

  it("ne filtre plus après la fin de la clause", () => {
    expect(nonCompeteMatch("drh@backmarket.com", new Date("2028-04-21"))).toBeNull();
  });
});
