-- Ouverture des départements C-Level fractional : DRH, CFO, COO, CRO, CTO à côté du RPO.
-- Configuration des verticales : supabase/functions/_shared/verticals.ts (garder les listes alignées).
-- Version 1 : un compte freelance = une verticale (contrainte unique_user_profile conservée).

-- 1. Verticales autorisées
alter table public.recruiter_profiles drop constraint if exists recruiter_profiles_vertical_check;
alter table public.recruiter_profiles add constraint recruiter_profiles_vertical_check
  check (vertical in ('rpo', 'drh', 'cfo', 'coo', 'cro', 'cto'));
alter table public.client_needs drop constraint if exists client_needs_vertical_check;
alter table public.client_needs add constraint client_needs_vertical_check
  check (vertical in ('rpo', 'drh', 'cfo', 'coo', 'cro', 'cto'));

-- 2. Profil freelance : spécialités de la verticale, capacité, séniorité
alter table public.recruiter_profiles
  add column if not exists specialties text[] not null default '{}',
  add column if not exists weekly_capacity smallint check (weekly_capacity between 1 and 5),
  add column if not exists years_experience smallint check (years_experience between 0 and 60),
  add column if not exists previous_companies text[] not null default '{}';
comment on column public.recruiter_profiles.specialties is 'Spécialités de la verticale (hors RPO, qui utilise skills = métiers recrutés).';
comment on column public.recruiter_profiles.weekly_capacity is 'Jours disponibles par semaine ; NULL ou 5 = temps plein.';
comment on column public.recruiter_profiles.previous_companies is 'Entreprises marquantes du parcours (« ex-Qonto »), affichées sur la fiche.';

-- 3. Besoin client : spécialités attendues et rythme demandé
alter table public.client_needs
  add column if not exists specialties text[] not null default '{}',
  add column if not exists days_per_week smallint check (days_per_week between 1 and 5);
comment on column public.client_needs.days_per_week is 'Jours par semaine demandés ; NULL ou 5 = temps plein.';

-- 4. Mission : rythme convenu (sert à calculer la capacité restante d'un freelance fractional)
alter table public.missions
  add column if not exists days_per_week smallint check (days_per_week between 1 and 5);

-- 5. Opportunités : un freelance ne voit que les besoins ouverts de sa verticale.
--    Le type de retour change : la règle d'insertion des candidatures et la vue sont recréées.
drop policy if exists "Users can create applications" on public.need_applications;
drop view if exists public.client_needs_open;
drop function if exists public.list_open_needs();

create function public.list_open_needs()
returns table (
  id uuid, job_title text, profile_types text[], budget_tjm_min integer, budget_tjm_max integer,
  mission_location text, remote_policy text, description text, created_at timestamptz, desired_start date,
  vertical text, specialties text[], days_per_week smallint
)
language sql stable security definer set search_path = public as $$
  select n.id, n.job_title, n.profile_types, n.budget_tjm_min, n.budget_tjm_max,
         n.mission_location, n.remote_policy, n.description, n.created_at, n.desired_start,
         n.vertical, n.specialties, n.days_per_week
  from public.client_needs n
  where n.status = 'pending'
    and (
      public.has_role(auth.uid(), 'admin')
      or (public.has_role(auth.uid(), 'user')
          and n.vertical = (select rp.vertical from public.recruiter_profiles rp where rp.user_id = auth.uid()))
    );
$$;
revoke all on function public.list_open_needs() from public, anon;
grant execute on function public.list_open_needs() to authenticated;

create view public.client_needs_open with (security_invoker = true) as
  select * from public.list_open_needs();
grant select on public.client_needs_open to authenticated;

create policy "Users can create applications" on public.need_applications
  for insert to authenticated
  with check (
    recruiter_profile_id in (select id from public.recruiter_profiles where user_id = auth.uid())
    and exists (select 1 from public.list_open_needs() o where o.id = need_applications.need_id)
  );

-- 6. Profil « complet » (entre dans le matching) : TJM, LinkedIn et, selon la verticale,
--    les métiers recrutés (RPO) ou les spécialités (départements C-Level).
create or replace function public.compute_onboarding_completed()
returns trigger
language plpgsql
as $$
begin
  new.onboarding_completed :=
    new.tjm is not null
    and new.linkedin_url is not null
    and case when coalesce(new.vertical, 'rpo') = 'rpo'
             then coalesce(array_length(new.skills, 1), 0) > 0
             else coalesce(array_length(new.specialties, 1), 0) > 0 end;
  return new;
end;
$$;
