import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, PageBreak,
} from "docx";
import type { ContractData } from "./types";

const FONT = "Calibri";
const SIZE = 22;

const p = (text: string, opts?: { bold?: boolean; italic?: boolean; size?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] }) =>
  new Paragraph({
    alignment: opts?.alignment,
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: opts?.size || SIZE, bold: opts?.bold, italics: opts?.italic })],
  });

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
  new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT, bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : 24 })],
  });

const field = (label: string, value: string) =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label} : `, font: FONT, size: SIZE, bold: true }),
      new TextRun({ text: value || "_______________", font: FONT, size: SIZE }),
    ],
  });

const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR") : "_______________";

export async function generateContractorContract(data: ContractData): Promise<Blob> {
  const recruiterFullName = `${data.recruiterFirstName} ${data.recruiterLastName}`;

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: [
        // Title
        p("GOTAM", { bold: true, size: 32, alignment: AlignmentType.CENTER }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        heading("Contrat de Prestation de Services RPO"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Parties
        p("Entre les soussignés :"),
        p("Connect2, société par actions simplifiée, inscrite auprès du RCS de Rennes sous le numéro SIREN 845 060 193 et située au 18/20 Boulevard de Beaumont, 35000 Rennes, représentée par Monsieur Dylan DAHYOT en qualité de Directeur Général."),
        p("Ci-après dénommé le « Cabinet » d'une part,"),
        p("Et"),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: `${data.recruiterCompanyName || recruiterFullName}`, font: FONT, size: SIZE, bold: true }),
            new TextRun({ text: `, ${data.recruiterLegalForm || "___"}, inscrite auprès du RCS sous le numéro SIREN ${data.recruiterSiren || "___"} et située au ${data.recruiterAddress || "___"}, représentée par ${recruiterFullName}.`, font: FONT, size: SIZE }),
          ],
        }),
        p("Ci-après dénommé le « Prestataire » d'autre part,"),
        p("Ci-après individuellement désignée la « Partie » et collectivement les « Parties »."),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Préambule
        heading("ÉTANT PRÉALABLEMENT RAPPELÉ QUE :"),
        p("Les Parties entendent conclure le présent contrat de prestation de services (ci-après : le « Contrat ») qui prendra effet à la date indiquée en annexe des présentes."),
        p("Le Client (ci-après défini) est amené à sous-traiter des prestations car il a identifié un besoin d'assistance technique pour l'exécution et la réalisation d'un projet ponctuel nécessitant une expertise spécifique."),
        p("Le Cabinet a donc présenté le Prestataire au Client, lequel déclare disposer de la compétence, la disponibilité et le savoir-faire nécessaire pour effectuer la prestation."),

        // Articles
        heading("1. DÉFINITIONS", HeadingLevel.HEADING_2),
        p("Client : Fait référence au client du Cabinet pour le compte duquel la prestation est réalisée."),
        p("Ensemble contractuel : Fait référence aux dispositions du présent Contrat et ses annexes et les rapports de suivi de prestation."),

        heading("2. OBJET", HeadingLevel.HEADING_2),
        p("Le Cabinet confie au Prestataire l'exécution des Services décrits en annexe, dans le cadre d'une mission pour le Client."),

        heading("3. DURÉE", HeadingLevel.HEADING_2),
        p(`Le Contrat prend effet à compter du ${formatDate(data.startDate)} pour une durée de ${data.durationText || "la durée prévue en annexe"}. En cas de renouvellement, une annexe précisant les nouvelles dates doit être établie.`),

        heading("4. CONDITIONS FINANCIÈRES", HeadingLevel.HEADING_2),
        p(`Le Cabinet s'engage à régler au Prestataire la somme de ${data.recruiterTjm}€ HT par jour presté, sur la base des rapports de suivi validés.`),
        p("Le règlement s'effectue dans un délai de 30 jours à compter de la réception de la facture, à la fin de chaque mois."),

        heading("5. OBLIGATIONS DU PRESTATAIRE", HeadingLevel.HEADING_2),
        p("Le Prestataire s'engage à exécuter les Services avec diligence, professionnalisme et dans le respect des règles déontologiques de la profession."),
        p("Le Prestataire est responsable de sa couverture sociale, fiscale et de ses assurances professionnelles."),

        heading("6. OBLIGATIONS DU CABINET", HeadingLevel.HEADING_2),
        p("Le Cabinet s'engage à fournir au Prestataire les informations nécessaires et à faciliter ses relations avec le Client."),

        heading("7. CONFIDENTIALITÉ", HeadingLevel.HEADING_2),
        p("Le Prestataire s'engage à garder strictement confidentielles toutes les informations relatives au Cabinet, au Client et à leurs activités."),

        heading("8. NON-SOLLICITATION", HeadingLevel.HEADING_2),
        p("Le Prestataire s'interdit, pendant la durée du Contrat et les 12 mois suivant son terme, de contracter directement avec le Client présenté par le Cabinet."),

        heading("9. RÉSILIATION", HeadingLevel.HEADING_2),
        p("Le Contrat peut être résilié à tout moment par chacune des Parties sur préavis de 15 jours adressé par écrit à l'autre partie."),

        heading("10. LOI APPLICABLE", HeadingLevel.HEADING_2),
        p("Le présent Contrat est soumis au droit français. En cas de litige, compétence exclusive au Tribunal de Commerce de Paris."),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Signatures
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    p("Connect2 :", { bold: true }),
                    field("Nom du signataire", "Dylan DAHYOT"),
                    field("Date", ""),
                    p("Signature :", { bold: true }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    p("Société du Prestataire :", { bold: true }),
                    field("Nom du signataire", recruiterFullName),
                    field("Date", ""),
                    p("Signature :", { bold: true }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ANNEXE 1
        new Paragraph({ children: [new PageBreak()] }),
        p("GOTAM", { bold: true, size: 32, alignment: AlignmentType.CENTER }),
        heading("Annexe 1 : INFORMATIONS RELATIVES À LA PRESTATION"),

        heading("Informations relatives au Prestataire", HeadingLevel.HEADING_2),
        field("Membre du personnel", recruiterFullName),
        field("Nom du prestataire", data.recruiterCompanyName || recruiterFullName),
        field("Numéro d'immatriculation (SIREN)", data.recruiterSiren),
        field("Adresse du prestataire", data.recruiterAddress),
        field("Numéro de TVA", data.recruiterTvaNumber),
        field("Nom du projet", `${data.needJobTitle} — ${data.clientCompanyName}`),
        field("Description des Services", data.needDescription || data.needJobTitle),

        new Paragraph({ spacing: { after: 200 }, children: [] }),
        heading("Informations relatives à la prestation", HeadingLevel.HEADING_2),
        field("Nom du client", data.clientCompanyName),
        field("Adresse du client", data.clientAddress),
        field("Adresse du lieu de prestation", `${data.missionLocation}${data.remotePolicy !== "on-site" ? " + Télétravail" : ""}`),
        field("Nom du Contact client", data.clientContactName),
        field("Date de début", formatDate(data.startDate)),
        field("Date de fin estimée", formatDate(data.endDate)),
        field("Taux de facturation", `${data.recruiterTjm}€ HT par journée prestée`),
        field("Période de préavis", "15 jours"),
        field("Périodes de facturation", "Mensuelle - À la fin de chaque mois (paiement à 30 jours)"),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Signatures annexe
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    p("Connect2 :", { bold: true }),
                    field("Nom du signataire", "Dylan DAHYOT"),
                    field("Date", ""),
                    p("Signature :", { bold: true }),
                  ],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  children: [
                    p("Société du Prestataire :", { bold: true }),
                    field("Nom du signataire", recruiterFullName),
                    field("Date", ""),
                    p("Signature :", { bold: true }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  return Packer.toBlob(doc);
}
