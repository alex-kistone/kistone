# Plan — ADV intégré à la plateforme Kistone (option C)

Décidé le 2026-09-29 avec Alex. Kistone devient un **tout-en-un** : matching RPO puis
administration des missions (KYC, contrat, CRA, facturation), **dans le même compte**
pour le client, le freelance et l'admin.

- On construit un **nouveau module ADV dans kistone-rpo** (Vite + React Router + Supabase
  `Plateforme-rpo`), à la suite du parcours RPO.
- Le produit **ADV « Partnered »** (`~/Documents/LocalClaude/adv-freelance`, Supabase
  `Freelance-adv`) **reste indépendant et n'est jamais modifié** : il est vendu en marque
  blanche. Il sert uniquement de **référence fonctionnelle** (README, docs, parcours).
- Chaque projet reste revendable séparément via le studio : le module ADV doit rester
  isolé (tables, pages et fonctions préfixées ou regroupées), sans dépendre du matching.
- KYC demandé **au moment de la mission** (accord client ⇄ freelance), jamais à l'inscription.

## Parcours cible

1. Inscription libre, sans KYC (client ou freelance, rôles exclusifs).
2. Freelance : **Mon profil**, **Mes opportunités**. Client : **Déposer un besoin**, **Mes besoins**.
3. Matching (règles + IA) → admin propose → client présélectionne puis **accepte** un profil.
4. Admin crée la mission (TJM client / TJM freelance, marge par défaut 100 €/j, modifiable).
5. Demande de **dossier (KYC)** aux deux parties, dans leur compte : SIRET, documents, IBAN.
   L'admin valide ou refuse chaque dossier.
6. **Contrats** client et freelance générés, stockés, signés.
7. **Mission active** → CRA mensuel rempli par le freelance → validé (signé) par le client.
8. **Factures** : facture client (numérotée) + facture freelance (déposée, écart contrôlé),
   suivi des paiements, relances. **Trésorerie** et **stats** pour l'admin.

## État de départ (inventaire du 2026-09-29)

| Étape | Existant | Manque / cassé |
|---|---|---|
| Pipeline après matching | partiel (`suggested/shortlisted/interview/validated`) | statuts du front ≠ trigger DB (`accepted`, `contract_*`) ; pas d'acceptation client |
| Missions | oui (`missions`, `mission_extensions`, vues) | **fuite de marge** : les policies sur la table de base rendent les deux TJM lisibles ; marge figée à 100 dans le front |
| KYC | partiel (champs société, 3 documents, recherche SIREN) | aucun statut ni validation, pas d'écran admin, pas de SIRET/IBAN/Kbis/pièce d'identité |
| Contrats | partiel (2 DOCX générés dans le navigateur) | ni stockage, ni statut, ni signature ; identité du prestataire codée en dur (corrigé en phase 0 : `company_settings`) |
| CRA | partiel (saisie, soumission, écran client) | **validation client bloquée par un trigger** ; pas de signature ni PDF ; relances non planifiées |
| Facturation | non (seulement un statut `admin_invoiced`) | tout : factures, numérotation, factures freelance, paiements, relances |
| Notifications | partiel (chat, assistant) | pas de centre de notifications ; le trigger des messages appelle **d'autres projets Supabase**, deux fois |
| Interfaces | 3 espaces sans navigation commune | barre latérale par rôle, pages détail, stats, trésorerie, paramètres |

## Phases

### Phase 0 — Fondations (fait le 2026-09-29, migrations `20260929090000` et `20260929091000`)
- Fuite de marge : plus aucune lecture de `missions` par client/freelance hors des vues
  `client_missions` / `freelance_missions` ; le front ne lit que les vues.
- Débloquer la validation client des CRA (trigger `enforce_timesheet_freelancer_update`).
- Pipeline unique et contraint (CHECK) : `suggested → shortlisted → accepted → onboarding →
  active → completed` (+ `rejected`), aligné front / trigger du prénom.
- Réparer le trigger des messages (bon projet, un seul envoi) ou le couper.
- Paramètres de la société (nom, SIREN, adresse, TVA, conditions de paiement) en base,
  à la place de l'identité codée en dur.
- Coquille d'application : barre latérale par rôle, avec les onglets cibles (fait : `AppShell`, onglets pilotés par `?tab=`).

### Phase 1 — Accord et mise en place de la mission (fait le 2026-09-30, migration `20260930090000`)
Reste : contrats en PDF pour Yousign (nouveaux modèles d'Alex), test réel de Yousign, notifications (phase 4).
- Acceptation d'un profil par le client → notification admin.
- Création de mission par l'admin (marge modifiable), statut `onboarding`.
- Dossier KYC : table `documents`, statuts `pending/approved/rejected`, SIRET, IBAN/BIC,
  Kbis, pièce d'identité, assurance, URSSAF ; écran admin de revue ; relance des pièces manquantes.
- Contrats générés avec l'identité Kistone, stockés dans le bucket `contracts`, statut suivi ;
  signature (à décider : code par email comme les CRA, ou Yousign).

### Phase 2 — CRA (fait le 2026-09-29, migration `20261001090000`)
- Saisie mensuelle (jours / demi-journées, fériés et hors mission grisés), un CRA par mission et
  par mois, total recalculé en base à l'envoi.
- Validation client signée : fonction `cra-sign` (code à 6 chiffres par email, 10 min, 5 essais,
  certification, PDF de preuve horodaté + empreinte SHA-256 dans le bucket `timesheet-proofs`,
  lisible par le client et l'admin, jamais par le freelance). Refus motivé. Validation de secours
  par l'admin avec motif, même preuve.
- Taux figés à la validation dans `timesheet_rates` (admin uniquement).
- Frais de mission (`timesheet_expenses`, justificatifs dans `expense-receipts`), validés avec le CRA.
- Relances : `remind-cra` chaque matin via pg_cron (vault : `project_url`, `cron_secret`) —
  freelance J-5/J-1 et le 2/le 5 du mois suivant, client toutes les 48 h.
- **Reste à brancher : `RESEND_API_KEY`** (et le domaine d'envoi kistone.fr). Sans elle, aucun
  email ne part et le client ne peut pas recevoir de code : seule la validation de secours marche.

### Phase 3 — Facturation (fait le 2026-09-29, migrations `20261002090000` et `20261002120000`)
- Factures client (`client_invoices`) : brouillon depuis un CRA validé (taux figés + frais,
  TVA de `company_settings`), émission par la fonction `invoices` (numéro KS-AAAA-NNNN sans trou
  via `invoice_counters`, identités figées, PDF dans le bucket `invoices`, email au client),
  facture figée une fois émise, annulation par avoir AV-AAAA-NNNN, paiement enregistré par l'admin.
  L'émission est refusée tant que SIREN, adresse et IBAN de Kistone manquent.
- Relances d'impayés : `remind-invoices` via pg_cron (J+1, J+8, J+15, 5 jours minimum entre deux,
  admin en copie de la dernière).
- Factures freelance (`freelance_invoices`) : dépôt PDF sur un CRA validé, montant attendu calculé
  en base, écart signalé, validation / refus motivé / paiement par l'admin.
- Export comptable CSV (clients et freelances) ; Pennylane prêt mais **non testé** (clé à poser,
  `pennylane_enabled` à activer).

### Phase 4 — Pilotage (fait le 2026-09-29, migration `20261003090000`)
- Notifications (`notifications`) créées par déclencheurs sur tous les événements, cloche en
  temps réel dans les trois espaces, emails groupés par `notify-dispatch` (pg_cron, 5 min).
- Onglet admin « Trésorerie » : tableau de bord (CA, marge, missions, prévisionnel du mois,
  12 mois), flux réalisés et prévus avec projection à 3 mois et seuil, à encaisser / à
  décaisser, TVA du mois, frais fixes (`fixed_costs`). Code couleur repris d'ADV-Freelance.
- Emails : tout est prêt, rien ne part tant que `RESEND_API_KEY` n'est pas posée.

### Phase 5 — Qualité (fait le 2026-09-29)
- `npm run e2e` (`scripts/e2e-flow.mjs`) : 68 vérifications sur le projet lié, chaque acteur
  avec sa propre session — comptes et rôles, profil et besoin, matching, accord, mission
  (dossiers, contrats, démarrage), CRA (saisie, frais, refus, signature par code, preuve,
  taux figés), facturation en mode Pennylane et factures freelance, notifications, et les
  cloisonnements (marge, pièces, contrats, preuves, factures). Comptes fictifs
  `e2e-*@test.kistone.invalid`, tout est supprimé à la fin (`--keep` pour conserver).
  Prérequis : `.env` et la CLI Supabase liée (aucune clé secrète).

## Décisions (2026-09-29)

- **Signature des contrats : Yousign.** Pas encore de compte : l'architecture est prévue, le
  branchement se fera quand la clé sera disponible.
- **Comptabilité : Pennylane.** Clé API fournie plus tard.
- **Société qui porte les missions : Kistone SAS** (SIREN, adresse et représentant à compléter
  dans `company_settings`). Nouveaux modèles de contrat fournis par Alex plus tard.
- **Frais de mission : oui**, en phase 2.

## Architecture des intégrations

Chaque intégration est **désactivable** : un interrupteur dans `company_settings`
(`yousign_enabled`, `pennylane_enabled`) et une clé dans les secrets Supabase. Sans clé, la
plateforme fonctionne en mode manuel ; avec la clé, le même parcours s'automatise.

### Yousign (phase 1)
- Table `contracts` : `mission_id`, `party` (`client` | `freelance`), `status` (`draft`, `sent`,
  `signed`, `declined`, `expired`), `document_path` (bucket privé `contracts`),
  `yousign_request_id`, `sent_at`, `signed_at`, `signed_document_path`.
- Fonction `contracts-send` : génère le contrat, le stocke, crée la demande de signature
  (API Yousign v3) avec les signataires de chaque partie.
- Fonction `yousign-webhook` : vérifie la signature HMAC, met à jour le statut et range le PDF
  signé. La mission passe `onboarding → active` quand dossiers validés **et** contrats signés.
- Secrets : `YOUSIGN_API_KEY`, `YOUSIGN_WEBHOOK_SECRET`. Sans clé : téléchargement du contrat
  (comportement actuel) et dépôt manuel de la version signée.

### Pennylane (phase 3)
- Tables `invoices` (client) et `supplier_invoices` (freelance) avec `pennylane_id`,
  `sync_status`, `sync_error`.
- Fonction `pennylane-sync` : crée client et fournisseur à la demande
  (`external_reference` `kistone-client-<id>` / `kistone-freelance-<id>`), pousse les factures
  en brouillon, remonte les paiements.
- Secret : `PENNYLANE_API_KEY`. Sans clé : factures numérotées et PDF générés dans la
  plateforme, export CSV pour la comptabilité.

### Jarvi (ATS) — à concevoir
- L'URL LinkedIn du freelance est **obligatoire** (formulaire + règle en base, 2026-09-29) et
  stockée sous forme canonique `https://www.linkedin.com/in/<identifiant>` : c'est la clé de
  rapprochement avec les profils Jarvi.
- Les anciennes tables Lovable `jarvi_*` (vides, inutilisées) ont été supprimées en phase 0 ;
  la synchronisation sera reconstruite proprement (sens des échanges, champs, fréquence à définir).

### Frais de mission (phase 2)
- Réglages par mission : frais autorisés, refacturables, plafond mensuel.
- Table `expenses` rattachée au CRA (date, catégorie, montant TTC, TVA, justificatif dans un
  bucket privé), validée avec le CRA et reprise sur la facture si refacturable.
