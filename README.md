# Kistone Connect — plateforme RPO freelance

Plateforme **mono-tenant** de Gotam : les entreprises clientes déposent un besoin,
les recruteurs RPO freelances remplissent leur profil, et le matching rapproche
les deux. Fork local du projet Lovable `kistone-connect`, recentré sur l'app
(la surface vitrine Kistone Studio a été retirée).

## Stack

Vite + React 18 + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres, Auth,
RLS, Storage, Edge Functions Deno) · Claude pour l'étage IA du matching.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:8080
```

`.env` (non versionné) attend :

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Vérifier le moteur de matching sans base ni réseau :

```bash
cd supabase/functions/_shared/__tests__ && node matching.test.ts
```

## Les trois rôles

| Rôle | Entrée | Ce qu'il fait |
|---|---|---|
| **freelance** | `/register` → `/profile` | Compétences, TJM, mobilité, disponibilité, docs légaux. Voit les besoins ouverts anonymisés (`/open-needs`), peut candidater. |
| **client** | `/client` → `/client/dashboard` | Profil entreprise, dépôt de besoin (`/client/new-need`), suivi du pipeline, CRA. |
| **admin** | `/dashboard` | Profils, besoins, matching, pipeline global, clients, missions, CRA, KPI. |

Le rôle vit dans `user_roles` (jamais côté client) et se lit via `has_role()`,
une fonction `SECURITY DEFINER` — sans ça, une policy sur `user_roles` qui
appellerait `has_role()` récurserait à l'infini.

## Anonymisation

Le client ne lit **jamais** `recruiter_profiles`. Il voit des lignes de
`profile_suggestions` portant un label anonyme ; l'identité n'apparaît qu'une
fois le profil validé. Symétriquement le freelance passe par la vue
`client_needs_open`, qui expose le besoin sans le nom de l'entreprise ni les
coordonnées du contact.

## Le matching

`supabase/functions/match-profiles` — deux étages.

**1. Déterministe** (`_shared/matching.ts`), toujours exécuté. Écarte les
profils inéligibles puis note ceux qui restent sur 7 critères pondérés :

| Critère | Poids | Règle |
|---|---|---|
| Budget | 25 | `TJM recruteur + 100 € de marge` doit tenir dans le budget **client**. Tolérance 10 %, au-delà → exclu. |
| Disponibilité | 20 | Dispo immédiate = plein score. Indispo sans date → exclu, sauf profil noté ≥ 4 ou Super TAM. |
| Remote | 15 | `full-remote` sur un besoin `on-site` (et l'inverse) → 0. |
| Compétences | 20 | Croisement tags × typologies demandées **et** texte du besoin. |
| Secteurs | 10 | Recouvrement. |
| Mobilité | 10 | Ville de mission, ignoré si `full-remote`. |
| Qualification | 15 | Note admin + badge Super TAM. Note 1 → jamais suggéré. |

**2. Claude** (`claude-sonnet-5`), sur les 12 meilleurs seulement. Re-classe et
rédige 2-3 raisons lisibles par le client. Score final = 60 % IA / 40 % règles ;
la part déterministe est conservée dans `profile_suggestions.rule_score` pour
auditer l'écart.

Sans `ANTHROPIC_API_KEY`, ou si l'appel échoue, l'étage 1 fait foi et les motifs
factuels servent de justification — **le matching ne tombe jamais en panne**.

Les profils envoyés au modèle sont anonymisés : ni nom, ni email, ni téléphone,
ni LinkedIn ne quittent la base.

Déclenchement : bouton « Lancer le matching » dans `/dashboard` → Besoins, ou
depuis le dashboard client. Un rejeu ne détruit que les suggestions encore au
statut `suggested` : celles engagées dans le pipeline sont de l'historique.

## Migrations

54 migrations héritées de Lovable, plus :

- `20260908090000_rpo_matching.sql` — **additive, à appliquer**. Ajoute
  `onboarding_completed` (avec backfill), `rule_score`, et un trigger qui
  empêche un freelance d'écrire sa propre qualification interne. La RLS de
  Postgres est par ligne, pas par colonne : la policy « je modifie mon profil »
  lui donnait aussi `admin_rating` et `super_tam`.
- `20260908090100_drop_multitenant.sql.OPTIONAL` — **destructive, à auditer**.
  Supprime les tables `tenant_*` et les colonnes `tenant_id`, vestiges du SaaS
  marque blanche (le front ne les référence plus). Lire l'en-tête du fichier
  avant de le renommer en `.sql`.

Secret à poser sur le projet Supabase pour l'étage IA :

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy match-profiles
```

## Base locale (Docker)

La chaîne de migrations rejoue intégralement sur une base vierge — 55 migrations,
25 tables, 3 vues, 82 policies :

```bash
npx supabase start     # démarre Postgres + Auth + Studio + Inbucket
npx supabase status    # URLs et clés locales
npx supabase db reset  # rejoue tout à neuf
npx supabase stop      # arrête (--no-backup pour repartir vide)
```

Studio local : http://127.0.0.1:54323 · emails capturés : http://127.0.0.1:54324

> Ça n'a pas toujours été le cas : 10 des 25 tables, leurs colonnes `tenant_id`
> et 8 policies avaient été créées à la main dans le dashboard Lovable, jamais
> versionnées. `20260604134900_repair_missing_tables.sql` répare ce trou.

## Basculer sur un projet Supabase dédié

Aujourd'hui `.env` pointe sur le Supabase de l'app Lovable — base *et* code sont
partagés avec elle. Pour prendre son indépendance :

1. Créer un projet sur https://supabase.com/dashboard (choisir la région UE).
   Noter le **project ref** et la **clé anon** ; garder le mot de passe DB.
2. Authentifier la CLI, une fois : `npx supabase login`
3. Lier et pousser le schéma :

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

4. Reporter `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et
   `VITE_SUPABASE_PROJECT_ID` dans `.env`, et `project_id` dans
   `supabase/config.toml`.
5. Déployer les fonctions et poser les secrets :

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy match-profiles
```

6. Se créer un compte via `/register`, puis se donner le rôle admin :

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'ton@email.fr';
```

7. Configurer Auth (Site URL, Redirect URLs, providers Google/LinkedIn) et
   réactiver la confirmation d'email avec un SMTP avant la mise en production.

Une base neuve démarre sans référentiels : `specialties` et `admin_qual_fields`
sont vides, à alimenter depuis l'espace admin.

## Reste à faire

- Décider du sort de `20260908090100_drop_multitenant.sql.OPTIONAL` (destructif,
  lire son en-tête).
- Les autres edge functions passent encore par la passerelle IA de Lovable
  (`LOVABLE_API_KEY`) : `parse-need`, `optimize-intro`, `support-assistant`.
  À recâbler sur l'API Anthropic comme `match-profiles`.
- Le dépôt GitHub est synchronisé dans les deux sens avec Lovable : décider si
  ce fork s'en détache (nouveau remote) ou reste couplé.
