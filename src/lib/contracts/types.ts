/** Société qui porte les missions (table company_settings). */
export interface ProviderIdentity {
  legalName: string;
  legalForm: string | null;
  siren: string | null;
  address: string | null;
  representativeName: string | null;
  representativeTitle: string | null;
  clientPaymentTermsDays: number;
  freelancePaymentTermsDays: number;
}

/** Phrase d'identification du prestataire, avec des blancs pour ce qui n'est pas encore renseigné. */
export function providerClause(p: ProviderIdentity): string {
  const form = p.legalForm === "SAS" ? "société par actions simplifiée" : p.legalForm || "société";
  return `${p.legalName}, ${form}, inscrite au RCS sous le numéro SIREN ${p.siren || "___"} et située au ${p.address || "___"}, représentée par ${p.representativeName || "___"} en qualité de ${p.representativeTitle || "___"}.`;
}

export interface ContractData {
  provider: ProviderIdentity;
  // Mission info
  missionTitle: string;
  missionLocation: string;
  startDate: string;
  endDate: string | null;
  durationText: string | null;
  recruiterTjm: number;
  clientTjm: number;
  // Client info
  clientCompanyName: string;
  clientLegalForm: string;
  clientSiren: string;
  clientAddress: string;
  clientRepresentativeName: string;
  clientRepresentativeTitle: string;
  clientContactName: string;
  clientContactEmail: string;
  // Recruiter info
  recruiterFirstName: string;
  recruiterLastName: string;
  recruiterCompanyName: string;
  recruiterLegalForm: string;
  recruiterSiren: string;
  recruiterAddress: string;
  recruiterTvaNumber: string;
  recruiterEmail: string;
  recruiterPhone: string;
  // Need description
  needDescription: string;
  needJobTitle: string;
  remotePolicy: string;
}
