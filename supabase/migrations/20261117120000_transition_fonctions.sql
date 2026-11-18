-- Cabinet de management de transition (décision d'Alex, 2026-11-17) : kistone.fr propose des
-- managers de transition par fonction (supabase/functions/_shared/fonctions.ts).
--
-- 1. Demandes de rappel du site : nom, entreprise, téléphone et fonction recherchée, sans email.
--    Elles vont dans need_requests (kind « callback ») pour apparaître dans l'onglet Besoins.
-- 2. Métier du freelance (recruiter_profiles.fonction), choisi à l'inscription. Les profils
--    existants, tous recruteurs, passent en « recrutement ».
-- Purement additif : l'ancien questionnaire /besoin et les profils existants restent valides.

alter table public.need_requests
  add column if not exists kind text not null default 'need' check (kind in ('need', 'callback')),
  add column if not exists contact_name text check (char_length(contact_name) <= 120),
  add column if not exists company text check (char_length(company) <= 160),
  add column if not exists phone text check (char_length(phone) <= 40),
  add column if not exists fonction text,
  add column if not exists source text check (char_length(source) <= 330);

alter table public.need_requests
  alter column email drop not null,
  alter column vertical drop not null,
  alter column engagement drop not null,
  alter column start_window drop not null;

alter table public.need_requests drop constraint if exists need_requests_fonction_check;
alter table public.need_requests add constraint need_requests_fonction_check check (fonction in (
  'direction-generale', 'finance', 'rh', 'logistique', 'commerce', 'marketing', 'juridique', 'rse',
  'dsi-innovation-digitale', 'operations-industrielles', 'recrutement', 'autre'));

-- Chaque forme garde ses champs obligatoires
alter table public.need_requests drop constraint if exists need_requests_kind_fields_check;
alter table public.need_requests add constraint need_requests_kind_fields_check check (
  case kind
    when 'need' then email is not null and vertical is not null and engagement is not null and start_window is not null
    else contact_name is not null and company is not null and phone is not null and fonction is not null
  end);

alter table public.recruiter_profiles add column if not exists fonction text;
alter table public.recruiter_profiles drop constraint if exists recruiter_profiles_fonction_check;
alter table public.recruiter_profiles add constraint recruiter_profiles_fonction_check check (fonction in (
  'direction-generale', 'finance', 'rh', 'logistique', 'commerce', 'marketing', 'juridique', 'rse',
  'dsi-innovation-digitale', 'operations-industrielles', 'recrutement'));
update public.recruiter_profiles set fonction = 'recrutement' where fonction is null;
