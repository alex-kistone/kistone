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
- Coquille d'application : barre latérale par rôle, avec les onglets cibles.

### Phase 1 — Accord et mise en place de la mission
- Acceptation d'un profil par le client → notification admin.
- Création de mission par l'admin (marge modifiable), statut `onboarding`.
- Dossier KYC : table `documents`, statuts `pending/approved/rejected`, SIRET, IBAN/BIC,
  Kbis, pièce d'identité, assurance, URSSAF ; écran admin de revue ; relance des pièces manquantes.
- Contrats générés avec l'identité Kistone, stockés dans le bucket `contracts`, statut suivi ;
  signature (à décider : code par email comme les CRA, ou Yousign).

### Phase 2 — CRA
- Saisie mensuelle (jours / demi-journées, fériés), soumission, validation client signée
  (code par email + PDF de preuve avec empreinte), refus motivé, validation admin de secours.
- Taux figés au moment de la validation. Frais optionnels.
- Relances planifiées (freelance et client).

### Phase 3 — Facturation
- Facture client numérotée (jours validés × TJM client), échéances, paiement, relances.
- Facture freelance déposée par le freelance, contrôle d'écart avec jours × TJM freelance.
- Synchronisation comptable (Pennylane) si retenue.

### Phase 4 — Pilotage
- Centre de notifications (table + cloche), emails transactionnels (Resend, domaine kistone.fr).
- Trésorerie (encaissements, décaissements, frais fixes, TVA, projection) et stats (volume,
  marge, consultants en mission, prévisionnel).

### Phase 5 — Qualité
- Script de test de bout en bout (inscription → matching → mission → CRA → factures), comme
  `adv-freelance/scripts/e2e-flow.mjs`.

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

### Frais de mission (phase 2)
- Réglages par mission : frais autorisés, refacturables, plafond mensuel.
- Table `expenses` rattachée au CRA (date, catégorie, montant TTC, TVA, justificatif dans un
  bucket privé), validée avec le CRA et reprise sur la facture si refacturable.
