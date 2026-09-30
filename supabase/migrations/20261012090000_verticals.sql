-- Verticales : le niveau au-dessus des métiers (RPO aujourd'hui ; DRH, CFO, CRO, Legal, CTO…
-- plus tard, sur la même plateforme). Chaque profil freelance et chaque besoin appartient à une
-- verticale, et le matching ne croise jamais deux verticales. RPO est la seule valeur pour
-- l'instant : ajouter une verticale = élargir ces contraintes (cf. VERTICALS dans
-- supabase/functions/_shared/taxonomy.ts).
alter table public.recruiter_profiles
  add column if not exists vertical text not null default 'rpo';
alter table public.recruiter_profiles drop constraint if exists recruiter_profiles_vertical_check;
alter table public.recruiter_profiles add constraint recruiter_profiles_vertical_check check (vertical in ('rpo'));

alter table public.client_needs
  add column if not exists vertical text not null default 'rpo';
alter table public.client_needs drop constraint if exists client_needs_vertical_check;
alter table public.client_needs add constraint client_needs_vertical_check check (vertical in ('rpo'));

create index if not exists recruiter_profiles_vertical_idx on public.recruiter_profiles (vertical);
create index if not exists client_needs_vertical_idx on public.client_needs (vertical);

-- Marge : prix client = TJM freelance + 20 % (supabase/functions/_shared/pricing.ts), qui
-- remplace la marge fixe par défaut. La colonne n'est plus lue ; conservée pour l'historique.
comment on column public.company_settings.default_margin_eur is
  'Obsolète depuis le 2026-09-30 : la marge est de 20 % du TJM freelance (_shared/pricing.ts).';
