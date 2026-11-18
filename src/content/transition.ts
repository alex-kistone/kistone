/**
 * Contenu du site « cabinet de management de transition » (repris de transition.kistone.fr,
 * src/data.mjs) : une fiche par fonction, plus le recrutement (RPO). C'est ici qu'on modifie les
 * textes. Les identifiants (slug) servent aussi au métier du freelance et à la fonction recherchée
 * par le client (supabase/functions/_shared/fonctions.ts) : ne pas les renommer.
 */

export interface TransitionRole {
  slug: string;
  short: string;
  title: string;
  label: string;
  icon: string;
  pitch: string;
  context: string;
  situations: string[];
  missions: string[];
  livrables: string[];
  profil: string[];
  rattachement: string;
  duree: string;
}

// Icônes au trait (24x24, stroke 1.8)
export const ICONS: Record<string, string> = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m8 15 3-4 3 2 5-6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M17.5 14.6c1.6.6 2.7 2.1 3 4.4"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
  handshake: '<path d="m3 12 4-4 4 2 3-2 7 5"/><path d="m7 8-4 4 6 6 2-2"/><path d="m11 16 2 2 2-2"/><path d="m14 13 3 3"/>',
  megaphone: '<path d="M4 10v4h3l8 4V6l-8 4z"/><path d="M18 9.5a3.5 3.5 0 0 1 0 5"/><path d="M7 14l1 5h2.5l-1-5"/>',
  scale: '<path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 7h14"/><path d="m5 7-3 6a3 3 0 0 0 6 0z"/><path d="m19 7-3 6a3 3 0 0 0 6 0z"/>',
  leaf: '<path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19 13 11"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.5 9.5h5v5h-5z"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  factory: '<path d="M3 20V10l5 3V10l5 3V6h3l1 6h4v8z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
};

export const ROLES: TransitionRole[] = [
  {
    slug: 'direction-generale',
    short: 'Direction générale',
    title: 'Directeur général de transition',
    label: 'CEO · DG · DIRECTEUR DE BU',
    icon: 'compass',
    pitch: 'Reprendre la barre, stabiliser l\'entreprise et remettre l\'équipe de direction en mouvement.',
    context: 'Départ imprévu d\'un dirigeant, retournement, intégration post-acquisition ou passage de relais dans une PME familiale : le manager de transition prend la direction générale avec un mandat clair et un horizon défini. Il pilote l\'entreprise au quotidien tout en menant le chantier qui justifie sa venue.',
    situations: ['Vacance de direction générale', 'Retournement et redressement', 'Intégration post-acquisition', 'Transmission et succession'],
    missions: [
      'Assurer la continuité de la direction générale et la relation avec les actionnaires et le conseil',
      'Établir un diagnostic à 30 jours : situation financière, organisation, clients, risques',
      'Construire et faire valider un plan de transformation ou de redressement',
      'Piloter le comité de direction et réaligner les priorités de chaque fonction',
      'Conduire les négociations clés : banques, partenaires sociaux, grands clients',
      'Préparer et accompagner l\'arrivée du dirigeant permanent',
    ],
    livrables: ['Diagnostic de la situation et plan de transformation', 'Plan d\'actions validé par les actionnaires', 'Tableau de bord de direction', 'Passation documentée au successeur'],
    profil: [
      'Ancien DG ou directeur de business unit, avec une expérience P&L complète',
      'Plusieurs situations de crise ou de transformation menées jusqu\'au bout',
      'Posture d\'arbitre : écoute, décision rapide, sens politique',
      'À l\'aise face aux actionnaires, aux banques et aux représentants du personnel',
    ],
    rattachement: 'Conseil d\'administration, actionnaires',
    duree: '6 à 18 mois',
  },
  {
    slug: 'finance',
    short: 'Finance',
    title: 'Directeur administratif et financier de transition',
    label: 'DAF · CFO · RAF · CONTRÔLE DE GESTION',
    icon: 'chart',
    pitch: 'Sécuriser la trésorerie, fiabiliser les chiffres et outiller la direction pour décider.',
    context: 'Tension de trésorerie, clôture qui dérape, levée de fonds, LBO ou changement d\'ERP : le DAF de transition prend la fonction finance immédiatement. Il remet de la visibilité, rassure les partenaires financiers et structure l\'équipe pour la suite.',
    situations: ['Tension de trésorerie', 'Levée de fonds, LBO, cession', 'Clôture et reporting à fiabiliser', 'Remplacement d\'un DAF'],
    missions: [
      'Mettre en place un suivi de trésorerie à 13 semaines et sécuriser les financements',
      'Fiabiliser les clôtures mensuelles et le reporting de gestion',
      'Piloter le budget, les prévisions et le plan de financement',
      'Préparer les opérations de haut de bilan : data room, due diligence, négociation',
      'Gérer la relation avec les banques, les commissaires aux comptes et les investisseurs',
      'Structurer l\'équipe comptable et contrôle de gestion, recruter le DAF permanent',
    ],
    livrables: ['Plan de trésorerie à 13 semaines', 'Reporting mensuel et KPI de pilotage', 'Budget et business plan révisés', 'Procédures de clôture documentées'],
    profil: [
      'Ancien DAF ou CFO de PME, ETI ou filiale de groupe',
      'Expérience de situations tendues : trésorerie, restructuration, opérations de capital',
      'Maîtrise des normes comptables françaises, IFRS selon contexte',
      'Pédagogue avec les opérationnels, ferme sur les chiffres',
    ],
    rattachement: 'Direction générale',
    duree: '4 à 12 mois',
  },
  {
    slug: 'rh',
    short: 'Ressources humaines',
    title: 'Directeur des ressources humaines de transition',
    label: 'DRH · RRH · HRBP · RELATIONS SOCIALES',
    icon: 'users',
    pitch: 'Accompagner les hommes et les femmes dans le changement, en gardant le dialogue social ouvert.',
    context: 'Réorganisation, plan de sauvegarde de l\'emploi, fusion d\'équipes, climat social dégradé ou fonction RH à construire : le DRH de transition apporte l\'expérience des moments sensibles. Il sécurise le cadre juridique et fait avancer le projet humain avec les managers.',
    situations: ['Réorganisation, PSE, rupture conventionnelle collective', 'Fusion et harmonisation des statuts', 'Climat social dégradé', 'Structuration d\'une fonction RH'],
    missions: [
      'Conduire le dialogue social avec le CSE et les organisations syndicales',
      'Piloter les projets de réorganisation dans le respect du cadre légal',
      'Harmoniser les statuts, accords et politiques de rémunération',
      'Structurer les processus RH : recrutement, onboarding, entretiens, paie',
      'Accompagner les managers dans la conduite du changement',
      'Recruter et intégrer le DRH permanent',
    ],
    livrables: ['Cartographie sociale et des risques', 'Calendrier d\'information et de consultation', 'Accords et politiques RH harmonisés', 'Processus RH documentés'],
    profil: [
      'Ancien DRH de PME, ETI ou groupe, en environnement syndiqué',
      'Expérience de réorganisations et de négociations collectives',
      'Solide culture du droit social',
      'Calme, à l\'écoute, capable de tenir une position',
    ],
    rattachement: 'Direction générale',
    duree: '6 à 12 mois',
  },
  {
    slug: 'logistique',
    short: 'Logistique',
    title: 'Directeur logistique et supply chain de transition',
    label: 'SUPPLY CHAIN · ENTREPÔTS · TRANSPORT · ACHATS',
    icon: 'truck',
    pitch: 'Remettre les flux sous contrôle : stocks, délais, coûts et qualité de service.',
    context: 'Ruptures, stocks qui gonflent, taux de service en baisse, ouverture ou transfert d\'entrepôt, changement de WMS ou de prestataire : le directeur supply chain de transition reprend la main sur les flux et pose une organisation durable.',
    situations: ['Taux de service en baisse', 'Ouverture ou transfert d\'entrepôt', 'Changement de WMS ou de prestataire', 'Réduction des coûts logistiques'],
    missions: [
      'Diagnostiquer la chaîne de bout en bout : prévisions, appros, stocks, transport',
      'Mettre en place un S&OP et des indicateurs de pilotage partagés',
      'Optimiser les niveaux de stocks et le besoin en fonds de roulement',
      'Piloter les projets d\'entrepôt, d\'outils (WMS, TMS) ou d\'externalisation',
      'Renégocier les contrats transport et prestataires logistiques',
      'Animer les équipes terrain et la relation avec les fonctions commerce et production',
    ],
    livrables: ['Diagnostic supply chain et plan d\'actions', 'Processus S&OP en place', 'Tableau de bord taux de service, stocks, coûts', 'Cahier des charges et sélection de prestataires'],
    profil: [
      'Ancien directeur supply chain ou logistique, en industrie, distribution ou e-commerce',
      'Expérience de projets d\'entrepôt et de systèmes d\'information logistiques',
      'Approche chiffrée : coûts, stocks, BFR',
      'Présent sur le terrain, proche des équipes',
    ],
    rattachement: 'Direction générale ou direction des opérations',
    duree: '6 à 12 mois',
  },
  {
    slug: 'commerce',
    short: 'Commerce',
    title: 'Directeur commercial de transition',
    label: 'DIRECTION COMMERCIALE · VENTES · GRANDS COMPTES',
    icon: 'handshake',
    pitch: 'Relancer la croissance du chiffre d\'affaires et structurer une équipe commerciale qui performe.',
    context: 'Chiffre d\'affaires qui stagne, équipe démotivée, conquête d\'un nouveau marché ou départ d\'un directeur commercial clé : le manager de transition remet de la méthode, du rythme et des objectifs clairs dans l\'organisation commerciale.',
    situations: ['Chiffre d\'affaires en recul', 'Ouverture d\'un nouveau marché', 'Restructuration de la force de vente', 'Départ du directeur commercial'],
    missions: [
      'Analyser le portefeuille clients, le pipeline et la performance par segment',
      'Redéfinir la stratégie commerciale, la politique tarifaire et les priorités',
      'Organiser la force de vente : territoires, objectifs, rémunération variable',
      'Déployer un rituel de pilotage et un CRM réellement utilisé',
      'Reprendre en direct les négociations grands comptes sensibles',
      'Recruter et former les managers commerciaux',
    ],
    livrables: ['Plan d\'actions commercial', 'Politique tarifaire et conditions générales revues', 'Pipeline et prévisions fiables dans le CRM', 'Plan de rémunération variable'],
    profil: [
      'Ancien directeur commercial ou des ventes en B2B ou B2B2C',
      'Track record de relance de croissance et de management d\'équipes terrain',
      'Négociateur grands comptes',
      'Énergie, exigence, sens du résultat',
    ],
    rattachement: 'Direction générale',
    duree: '6 à 12 mois',
  },
  {
    slug: 'marketing',
    short: 'Marketing',
    title: 'Directeur marketing de transition',
    label: 'CMO · MARKETING · MARQUE · ACQUISITION',
    icon: 'megaphone',
    pitch: 'Clarifier le positionnement, aligner marque et ventes, et rendre le marketing mesurable.',
    context: 'Repositionnement, lancement d\'offre, refonte de marque, marketing digital à structurer ou équipe sans pilote : le directeur marketing de transition remet une stratégie lisible et des indicateurs qui parlent à la direction et aux ventes.',
    situations: ['Repositionnement ou refonte de marque', 'Lancement d\'une offre ou d\'un marché', 'Marketing digital à structurer', 'Vacance du CMO'],
    missions: [
      'Auditer le positionnement, la marque, le mix et les canaux d\'acquisition',
      'Définir la plateforme de marque et les messages par cible',
      'Construire le plan marketing et l\'allocation budgétaire',
      'Aligner marketing et ventes : génération de leads, qualification, contenus',
      'Piloter les agences et les prestataires',
      'Mettre en place les indicateurs de performance marketing',
    ],
    livrables: ['Audit marketing et recommandations', 'Plateforme de marque et messages clés', 'Plan marketing et budget', 'Tableau de bord acquisition et conversion'],
    profil: [
      'Ancien directeur marketing, en B2B ou B2C',
      'Double culture marque et performance digitale',
      'Expérience de lancements et de repositionnements',
      'Capacité à piloter des agences et à convaincre un comité de direction',
    ],
    rattachement: 'Direction générale',
    duree: '4 à 9 mois',
  },
  {
    slug: 'juridique',
    short: 'Juridique',
    title: 'Directeur juridique de transition',
    label: 'DIRECTION JURIDIQUE · CONFORMITÉ · CONTRATS',
    icon: 'scale',
    pitch: 'Sécuriser les opérations, les contrats et la conformité pendant une période de changement.',
    context: 'Opération de M&A, contentieux important, mise en conformité (RGPD, Sapin II, devoir de vigilance), absence longue d\'un directeur juridique : le juriste de transition prend la fonction et protège l\'entreprise sans ralentir le business.',
    situations: ['Opération de fusion ou d\'acquisition', 'Contentieux stratégique', 'Mise en conformité réglementaire', 'Absence ou départ du directeur juridique'],
    missions: [
      'Assurer le conseil juridique au quotidien auprès de la direction et des opérationnels',
      'Piloter les opérations corporate : M&A, restructurations, secrétariat juridique',
      'Superviser les contentieux et coordonner les avocats externes',
      'Déployer les programmes de conformité : RGPD, Sapin II, devoir de vigilance',
      'Standardiser les contrats et les processus de validation',
      'Organiser la direction juridique et son budget',
    ],
    livrables: ['Cartographie des risques juridiques', 'Bibliothèque de contrats types', 'Programme de conformité déployé', 'Suivi des contentieux et des honoraires'],
    profil: [
      'Ancien directeur juridique ou avocat d\'affaires passé en entreprise',
      'Expérience en droit des affaires, des contrats et des sociétés',
      'Pratique des programmes de conformité',
      'Juriste orienté solutions, à l\'aise avec les opérationnels',
    ],
    rattachement: 'Direction générale ou secrétariat général',
    duree: '4 à 12 mois',
  },
  {
    slug: 'rse',
    short: 'RSE',
    title: 'Directeur RSE de transition',
    label: 'RSE · DÉVELOPPEMENT DURABLE · CSRD · ESG',
    icon: 'leaf',
    pitch: 'Passer de l\'intention au plan d\'actions : reporting, trajectoire carbone et engagement des équipes.',
    context: 'Premier reporting de durabilité, bilan carbone, demandes des clients et des investisseurs, labellisation : le directeur RSE de transition structure la démarche, embarque les directions métiers et livre un premier cycle complet.',
    situations: ['Premier reporting de durabilité (CSRD)', 'Bilan carbone et trajectoire de réduction', 'Exigences ESG des clients ou investisseurs', 'Démarche de labellisation'],
    missions: [
      'Réaliser l\'analyse de double matérialité et cadrer le reporting',
      'Piloter le bilan carbone et construire une trajectoire de réduction',
      'Définir la stratégie RSE et le plan d\'actions avec la direction',
      'Mettre en place la collecte des données et les indicateurs ESG',
      'Répondre aux questionnaires clients, investisseurs et notations extra-financières',
      'Former et embarquer les directions métiers',
    ],
    livrables: ['Analyse de double matérialité', 'Bilan carbone et plan de réduction', 'Stratégie et plan d\'actions RSE', 'Premier rapport de durabilité'],
    profil: [
      'Ancien directeur ou responsable RSE en entreprise',
      'Maîtrise des référentiels : CSRD, ESRS, GHG Protocol, labels',
      'Capacité à mobiliser des fonctions variées sans autorité hiérarchique',
      'Rigueur sur la donnée et sens du concret',
    ],
    rattachement: 'Direction générale',
    duree: '6 à 12 mois',
  },
  {
    slug: 'dsi-innovation-digitale',
    short: 'DSI et innovation digitale',
    title: 'DSI et directeur de l\'innovation digitale de transition',
    label: 'DSI · CIO · CDO · TRANSFORMATION DIGITALE',
    icon: 'cpu',
    pitch: 'Reprendre la main sur le système d\'information et faire aboutir les projets digitaux.',
    context: 'Projet ERP en difficulté, dette technique, cybersécurité, migration cloud, projets data et IA qui ne passent pas en production : le DSI de transition remet de la gouvernance, arbitre les priorités et sécurise les projets critiques.',
    situations: ['Projet ERP ou SI en difficulté', 'Cybersécurité et continuité d\'activité', 'Migration cloud, data, IA', 'Vacance du DSI'],
    missions: [
      'Auditer le SI : applications, infrastructure, sécurité, contrats, équipes',
      'Établir le schéma directeur et le portefeuille de projets priorisé',
      'Redresser les projets critiques et la relation avec les intégrateurs',
      'Renforcer la cybersécurité et le plan de continuité',
      'Lancer les cas d\'usage data et IA à fort impact métier',
      'Organiser la DSI, le budget et les contrats fournisseurs',
    ],
    livrables: ['Audit du SI et schéma directeur', 'Portefeuille de projets priorisé', 'Plan de sécurité et de continuité', 'Gouvernance projets et budget IT'],
    profil: [
      'Ancien DSI, CIO ou CDO en PME, ETI ou groupe',
      'Expérience de projets ERP et de transformation digitale',
      'Culture cybersécurité, cloud, data et IA',
      'Capacité à traduire le métier en priorités techniques',
    ],
    rattachement: 'Direction générale',
    duree: '6 à 18 mois',
  },
  {
    slug: 'operations-industrielles',
    short: 'Opérations industrielles',
    title: 'Directeur d\'usine et des opérations industrielles de transition',
    label: 'DIRECTION D\'USINE · PRODUCTION · LEAN · QUALITÉ',
    icon: 'factory',
    pitch: 'Restaurer la performance du site : sécurité, qualité, coûts et délais.',
    context: 'Dérive de la productivité, problèmes qualité, démarrage d\'une nouvelle ligne, transfert ou fermeture de site, départ d\'un directeur d\'usine : le manager de transition prend la direction du site et remet la performance industrielle sur ses rails.',
    situations: ['Dérive de performance industrielle', 'Crise qualité ou réclamations clients', 'Démarrage, transfert ou fermeture de site', 'Vacance de la direction d\'usine'],
    missions: [
      'Diriger le site : sécurité, qualité, coûts, délais, environnement',
      'Diagnostiquer la performance et lancer un plan de progrès lean',
      'Résoudre les problèmes qualité et restaurer la confiance des clients',
      'Piloter les investissements, les démarrages ou les transferts de production',
      'Animer l\'encadrement et le dialogue social sur le site',
      'Préparer l\'arrivée du directeur d\'usine permanent',
    ],
    livrables: ['Diagnostic industriel et plan de progrès', 'Rituels de performance (QRQC, revues SQCD)', 'Plan qualité et actions correctives', 'Budget et plan d\'investissements'],
    profil: [
      'Ancien directeur d\'usine ou des opérations, multi-sites idéalement',
      'Pratique du lean, de l\'amélioration continue et des certifications qualité',
      'Expérience de redressement de site et de dialogue social',
      'Leader de terrain, exigeant sur la sécurité',
    ],
    rattachement: 'Direction des opérations ou direction générale',
    duree: '6 à 18 mois',
  },
  {
    slug: 'recrutement',
    short: 'Recrutement (RPO)',
    title: 'Responsable recrutement de transition',
    label: 'RPO · TALENT ACQUISITION · RECRUTEUR',
    icon: 'search',
    pitch: 'Absorber un pic de recrutements et structurer la fonction, sans attendre l\'arrivée d\'une équipe permanente.',
    context: 'Levée de fonds, ouverture de site, plan de croissance ou départ du responsable recrutement : les postes s\'accumulent et l\'équipe ne suit plus. Le recruteur de transition (RPO) s\'intègre à vos équipes, prend en charge les recrutements de bout en bout et laisse des processus en place à son départ.',
    situations: ['Pic de recrutements après une levée de fonds', 'Ouverture d\'un site ou d\'une nouvelle activité', 'Départ du responsable recrutement', 'Structuration de la fonction recrutement'],
    missions: [
      'Cadrer les besoins avec les managers et prioriser les postes ouverts',
      'Rédiger et diffuser les offres, sourcer et approcher les candidats',
      'Mener les entretiens et présenter des short-lists qualifiées',
      'Piloter le processus jusqu\'à l\'offre et l\'intégration du candidat',
      'Mettre en place les outils, les indicateurs et la marque employeur',
      'Préparer le relais avec l\'équipe recrutement permanente',
    ],
    livrables: ['Plan de recrutement priorisé', 'Processus et grilles d\'entretien documentés', 'Tableau de bord des recrutements', 'Passation à l\'équipe permanente'],
    profil: [
      'Recruteur ou responsable talent acquisition confirmé, en cabinet ou en entreprise',
      'Spécialiste d\'une famille de métiers : tech, commerce, finance, industrie',
      'Maîtrise des outils de sourcing et des ATS',
      'Autonome, organisé, à l\'aise avec les managers opérationnels',
    ],
    rattachement: 'Direction des ressources humaines ou direction générale',
    duree: '3 à 12 mois',
  },
];

ICONS.search = '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>';

export const SITUATIONS: [tag: string, title: string, text: string][] = [
  ['Vacance', 'Départ soudain d\'un dirigeant', 'La fonction ne peut pas rester vide le temps d\'un recrutement. Nous assurons la continuité dès la semaine suivante.'],
  ['Crise', 'Situation financière ou sociale tendue', 'Trésorerie, perte d\'un client majeur, climat social : un manager qui a déjà traversé ces situations.'],
  ['Transformation', 'Un projet structurant à faire aboutir', 'Réorganisation, ERP, CSRD, nouveau site : un pilote dédié, avec un mandat et une échéance.'],
  ['Croissance', 'Un changement d\'échelle', 'Structurer une fonction, professionnaliser une équipe, préparer l\'arrivée d\'un dirigeant permanent.'],
  ['Opérations de capital', 'Acquisition, cession, LBO', 'Sécuriser l\'opération, rassurer les investisseurs, réussir l\'intégration.'],
  ['Retournement', 'Une performance qui décroche', 'Diagnostic rapide, plan de redressement, exécution jusqu\'aux résultats.'],
];

export const STEPS: [when: string, title: string, text: string][] = [
  ['J0', 'Cadrage', 'Un associé du cabinet qualifie avec vous la situation, le mandat et les objectifs. Échange confidentiel de 30 minutes.'],
  ['J+2', 'Présentation', 'Nous vous présentons une short-list de managers ayant déjà mené des missions comparables, références vérifiées.'],
  ['J+7', 'Prise de fonction', 'Lettre de mission, objectifs écrits, contrat tripartite. Le manager prend ses fonctions.'],
  ['Pendant la mission', 'Suivi et passation', 'Points réguliers avec l\'associé référent, bilan des objectifs, passation organisée au successeur.'],
];

export const GUARANTEES: [icon: string, title: string, text: string][] = [
  ['<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 'Confidentialité', 'Chaque mission est couverte par un engagement de confidentialité, dès le premier échange.'],
  ['<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>', 'Références vérifiées', 'Chaque manager présenté a été rencontré par un associé et ses références contrôlées.'],
  ['<path d="M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3"/><path d="M6 21v-4h4"/>', 'Continuité garantie', 'Si la mission l\'exige, nous assurons le remplacement du manager dans les meilleurs délais.'],
  ['<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h6"/>', 'Cadre contractuel clair', 'Contrat tripartite, lettre de mission et objectifs écrits. Vous savez ce que vous achetez.'],
  ['<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>', 'Un associé référent', 'Un interlocuteur unique au cabinet, du cadrage à la fin de mission.'],
  ['<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/>', 'Résultats mesurés', 'Des points d\'étape réguliers avec vous, sur des objectifs définis ensemble dès le départ.'],
];

export const FAQ: { q: string; a: string }[] = [
  { q: 'Qu\'est-ce qu\'un manager de transition ?', a: 'Un dirigeant ou un cadre supérieur expérimenté, indépendant, qui prend une fonction de direction pour une durée limitée. Il est opérationnel dès son arrivée, porte un mandat clair et quitte l\'entreprise une fois la mission accomplie.' },
  { q: 'Sous quel délai un manager peut-il intervenir ?', a: 'Nous présentons une short-list sous 48 heures. Après vos entretiens, la prise de fonction intervient généralement en moins d\'une semaine.' },
  { q: 'Quelle différence avec un cabinet de conseil ?', a: 'Le consultant analyse et recommande. Le manager de transition occupe la fonction : il décide, encadre les équipes et répond des résultats.' },
  { q: 'Comment la mission est-elle encadrée ?', a: 'Par un contrat tripartite entre votre entreprise, le cabinet et le manager, une lettre de mission et des objectifs écrits. Un associé du cabinet suit la mission jusqu\'à son terme.' },
  { q: 'Comment la mission est-elle facturée ?', a: 'Au jour d\'intervention, selon la fonction, la séniorité et le contexte. Le tarif est fixé avec vous lors du cadrage.' },
  { q: 'Le manager peut-il être recruté à l\'issue de la mission ?', a: 'Oui, lorsque la situation s\'y prête. Les conditions sont prévues dès le départ dans le contrat.' },
];

export const rolePath = (r: Pick<TransitionRole, "slug">) => `/expertises/${r.slug}`;
export const roleBySlug = (slug: string | undefined) => ROLES.find((r) => r.slug === slug);
