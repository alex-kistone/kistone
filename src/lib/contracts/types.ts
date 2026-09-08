export interface ContractData {
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
