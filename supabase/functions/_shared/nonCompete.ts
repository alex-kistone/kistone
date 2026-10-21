/**
 * Clause de non-concurrence d'Alexandre (jusqu'au 20/04/2028 inclus) : entreprises à ne pas
 * prospecter. Utilisée pour les invitations d'entreprises, à partir du domaine de l'email.
 * Source : skill « non-concurrence-prospection » (55 entreprises, exceptions décidées par Alex).
 * En cas de doute, on écarte : un faux positif vaut mieux qu'un contact interdit.
 */

export const NON_COMPETE_UNTIL = "2028-04-20";

/** Marques reconnues dans le domaine (« vinci-energies.com », « kpmg.fr »…). */
const SUBSTRING_MARKS: [string, string][] = [
  ["kering", "Kering"],
  ["vinci", "Vinci"], ["axians", "Vinci (Axians)"], ["actemium", "Vinci (Actemium)"], ["omexom", "Vinci (Omexom)"],
  ["citeos", "Vinci (Citeos)"], ["cegelec", "Vinci (Cegelec)"], ["cobrais", "Vinci (Cobra IS)"], ["eurovia", "Vinci (Eurovia)"],
  ["sogeasatom", "Vinci (Sogea-Satom)"], ["freyssinet", "Vinci (Freyssinet)"], ["soletanchebachy", "Vinci (Soletanche Bachy)"],
  ["entrepose", "Vinci (Entrepose)"], ["cofiroute", "Vinci (Cofiroute)"], ["escota", "Vinci (Escota)"], ["leonardvinci", "Vinci (Leonard)"],
  ["decathlon", "Decathlon"], ["mediaparticipations", "Média Participations"], ["cloudixio", "Cloudixio"],
  ["lohr", "Lohr Industries"], ["tereos", "Tereos"], ["protagoras", "Protagoras"], ["permisapoints", "Protagoras (PermisAPoints)"],
  ["iliad", "Free / Iliad"], ["freemobile", "Free / Iliad"], ["stoik", "Stoik"], ["backmarket", "BackMarket"],
  ["supervizor", "Supervizor"], ["antaria", "Antaria"], ["stelliant", "Stelliant"], ["bereal", "Voodoo (BeReal)"],
  ["hublo", "Hublo"], ["easyliance", "Easyliance"], ["neosoft", "Neosoft"], ["payplug", "PayPlug"], ["iadvize", "iAdvize"],
  ["zenika", "Zenika"], ["anozrway", "Anozr Way"], ["flowdesk", "Flowdesk"], ["payfit", "Payfit"], ["ouestfrance", "Ouest France"],
  ["seidor", "Seidor"], ["shipfox", "Shipfox"], ["leocare", "Leocare"], ["kpmg", "KPMG"], ["strangebee", "StrangeBee"],
  ["kokoroe", "Kokoroe"], ["dualsun", "Dualsun"], ["knconsulting", "KN Consulting"], ["gazechim", "Gazechim"], ["mirakl", "Mirakl"],
  ["mylight", "MyLight150"], ["veesion", "Veesion"], ["qare", "Qare"], ["diagnoly", "Diagnoly"],
  ["toyotamaterial", "Toyota Material"], ["toyotamh", "Toyota Material"], ["finary", "Finary"], ["linxea", "Linxea"],
  ["singulart", "Singulart"], ["digeiz", "Digeiz"],
];

/** Noms courts ou génériques : seulement si le domaine porte exactement ce nom, et à vérifier. */
const EXACT_GENERIC: [string, string][] = [
  ["indy", "Indy"], ["blank", "Blank"], ["axio", "Axio"], ["voodoo", "Voodoo"], ["cfm", "Capital Fund Management"],
  ["jasper", "Jasper"], ["gigz", "Gigz"], ["tesca", "Tesca"], ["noz", "NOZ"], ["steeple", "Steeple"], ["display", "Display"],
  ["free", "Free / Iliad"], ["asf", "Vinci (ASF)"],
];

/** Faux amis à laisser passer (sociétés distinctes) : décision d'Alex. */
const ALLOWED = ["freeda", "singular", "iad"];

export type NonCompeteMatch = { company: string; certain: boolean };

const label = (domain: string) => {
  const parts = domain.toLowerCase().split(".");
  // « mail.kpmg.fr » → « kpmg » ; « vinci-energies.com » → « vincienergies »
  const main = parts.length > 2 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2] ?? parts[0];
  return { main: main.replace(/[^a-z0-9]/g, ""), all: parts.slice(0, -1).join("").replace(/[^a-z0-9]/g, "") };
};

/**
 * Entreprise sous clause correspondant à une adresse email, ou null. `certain` = correspondance
 * nette (écartée) ; sinon homonyme possible, à vérifier par Alex (écartée aussi par prudence).
 */
export function nonCompeteMatch(email: string, today = new Date()): NonCompeteMatch | null {
  if (today.toISOString().slice(0, 10) > NON_COMPETE_UNTIL) return null;
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) return null;
  const { main, all } = label(domain);
  if (ALLOWED.includes(main)) return null;
  // Bpifrance : toutes les entités, sauf Bpifrance Digital Venture (même domaine : à vérifier)
  if (all.includes("bpifrance") || main === "bpi") return { company: "BPI France", certain: false };
  for (const [mark, company] of SUBSTRING_MARKS) if (all.includes(mark)) return { company, certain: true };
  for (const [name, company] of EXACT_GENERIC) if (main === name) return { company, certain: false };
  return null;
}
