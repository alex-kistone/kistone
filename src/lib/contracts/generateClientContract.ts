import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak,
} from "docx";
import type { ContractData } from "./types";

const FONT = "Calibri";
const SIZE = 22; // 11pt

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

export async function generateClientContract(data: ContractData): Promise<Blob> {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      children: [
        // Title
        p("GOTAM", { bold: true, size: 32, alignment: AlignmentType.CENTER }),
        new Paragraph({ spacing: { after: 200 }, children: [] }),
        heading(`Contrat de Prestation de Services RPO`),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Parties
        p("Entre les soussignés :"),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: `${data.clientCompanyName}`, font: FONT, size: SIZE, bold: true }),
            new TextRun({ text: `, ${data.clientLegalForm || "société"}, inscrite auprès du RCS sous le numéro SIREN ${data.clientSiren || "___"} et située au ${data.clientAddress || "___"}, représentée par ${data.clientRepresentativeName || "___"} en qualité de ${data.clientRepresentativeTitle || "___"}.`, font: FONT, size: SIZE }),
          ],
        }),
        p("Ci-après dénommée le « Client » d'autre part,"),
        p("Et"),
        p("Connect2, société par actions simplifiée, inscrite auprès du RCS de Rennes sous le numéro SIREN 845 060 193 et située au 18/20 Boulevard de Beaumont, 35000 Rennes, représentée par Monsieur Dylan DAHYOT en qualité de Directeur Général."),
        p("Ci-après dénommée le « Prestataire » d'une part,"),
        p("Ci-après individuellement désignée la « Partie » et collectivement les « Parties »."),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Préambule
        heading("ÉTANT PRÉALABLEMENT RAPPELÉ QUE :"),
        p("Le Client est amené à sous-traiter des services d'acquisition et de gestion de nouveaux talents suite à des plans de recrutement ambitieux."),
        p("Le Prestataire peut intervenir aux présentes soit en qualité de société spécialisée en ressources humaines, incluant la mise en place de processus, le recrutement et la gestion de nouveaux collaborateurs pour ses clients ou en tant qu'intermédiaire ayant une mission de mise en relation avec des prestataires compétents."),
        p("Après une phase de négociation, les Parties se sont rapprochées et ont convenu ce qui suit (ci-après : le « Contrat »)."),

        heading("IL A ÉTÉ CONVENU QUE :"),

        // Articles condensés
        heading("Article 1 – OBJET", HeadingLevel.HEADING_2),
        p("Le Prestataire s'engage à exécuter, au profit du Client, les Services tels que décrits en annexe au présent Contrat."),

        heading("Article 2 – DURÉE", HeadingLevel.HEADING_2),
        p(`Le Contrat prend effet à compter du ${formatDate(data.startDate)} pour une durée initiale de ${data.durationText || "la durée prévue en annexe"}. Il pourra être renouvelé par avenant signé entre les Parties.`),

        heading("Article 3 – CONDITIONS FINANCIÈRES", HeadingLevel.HEADING_2),
        p(`Le Client s'engage à régler au Prestataire la somme de ${data.clientTjm}€ HT par jour presté. La facturation est mensuelle, sur la base des rapports de suivi dûment validés par le Client.`),
        p("Le règlement s'effectue dans un délai de 30 jours à compter de la réception de la facture."),

        heading("Article 4 – OBLIGATIONS DU PRESTATAIRE", HeadingLevel.HEADING_2),
        p("Le Prestataire s'engage à exécuter les Services avec diligence et professionnalisme. Il s'assure que le personnel affecté dispose des compétences nécessaires."),

        heading("Article 5 – OBLIGATIONS DU CLIENT", HeadingLevel.HEADING_2),
        p("Le Client s'engage à fournir au Prestataire toutes les informations et moyens nécessaires à la bonne exécution des Services."),

        heading("Article 6 – CONFIDENTIALITÉ", HeadingLevel.HEADING_2),
        p("Chaque Partie s'engage à garder strictement confidentielles toutes les informations communiquées par l'autre Partie dans le cadre du présent Contrat."),

        heading("Article 7 – RÉSILIATION", HeadingLevel.HEADING_2),
        p("Le Contrat peut être résilié à tout moment par chacune des Parties moyennant le respect d'un préavis de 15 jours adressé par écrit."),

        heading("Article 8 – PROTECTION DES DONNÉES", HeadingLevel.HEADING_2),
        p("Les Parties s'engagent à respecter la réglementation applicable en matière de protection des données personnelles, notamment le RGPD."),

        heading("Article 9 – NON-SOLLICITATION", HeadingLevel.HEADING_2),
        p("Le Client s'interdit, pendant la durée du Contrat et les 12 mois suivant son terme, de solliciter directement le personnel du Prestataire affecté à l'exécution des Services."),

        heading("Article 10 – LOI APPLICABLE", HeadingLevel.HEADING_2),
        p("Le présent Contrat est soumis au droit français. Tout différend sera soumis au Tribunal de Commerce de Paris."),

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
                    p("Le Client :", { bold: true }),
                    field("Nom du signataire", data.clientRepresentativeName),
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
        heading("ANNEXE 1 : Fiche de Prestations"),
        new Paragraph({ spacing: { after: 200 }, children: [] }),

        heading("Informations relatives au Prestataire :", HeadingLevel.HEADING_2),
        field("Société du Prestataire", "Connect2 (SAS)"),
        field("Numéro SIREN", "845 060 193"),
        field("Adresse", "18/20 Boulevard de Beaumont, 35000 Rennes"),
        field("Individu intervenant", `${data.recruiterFirstName} ${data.recruiterLastName}`),
        field("Description des services", data.needDescription || data.needJobTitle),

        new Paragraph({ spacing: { after: 200 }, children: [] }),
        heading("Informations relatives au Client et à la Prestation :", HeadingLevel.HEADING_2),
        field("Nom du Client", data.clientCompanyName),
        field("Adresse de facturation", data.clientAddress),
        field("Adresse du lieu de prestation", `${data.missionLocation}${data.remotePolicy !== "on-site" ? " + Télétravail" : ""}`),
        field("Responsable Opérationnel", data.clientContactName),
        field("Date de début", formatDate(data.startDate)),
        field("Date de fin estimée", formatDate(data.endDate)),
        field("Périodes de facturation", "Mensuelle"),
        field("Taux de facturation", `${data.clientTjm}€ HT par journée prestée`),

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
                    p("Le Client :", { bold: true }),
                    field("Nom du signataire", data.clientRepresentativeName),
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
