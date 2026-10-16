-- Pivot du 2026-10-16 : la plateforme devient celle des experts IA. Familles : AI Engineer,
-- AI Product, AI Leader, et le RPO « Tech recruiter ». Configuration : supabase/functions/_shared/verticals.ts.
--
-- Les anciennes fonctions C-Level sont rapprochées de la famille la plus proche ; leurs
-- spécialités n'existent plus et sont vidées (le freelance ou l'admin les ressaisit).

alter table public.recruiter_profiles drop constraint if exists recruiter_profiles_vertical_check;
alter table public.client_needs drop constraint if exists client_needs_vertical_check;

update public.recruiter_profiles
set vertical = case when vertical = 'cpo' then 'product' else 'leader' end,
    specialties = '{}'
where vertical in ('drh', 'cfo', 'coo', 'cro', 'cto', 'cpo', 'cdo');

update public.client_needs
set vertical = case when vertical = 'cpo' then 'product' else 'leader' end,
    specialties = '{}'
where vertical in ('drh', 'cfo', 'coo', 'cro', 'cto', 'cpo', 'cdo');

-- RPO recentré Tech / Data / IA : anciens métiers renommés (Tech → Dev, Data → Data/AI)
update public.recruiter_profiles
set skills = array(select distinct case s when 'Tech' then 'Dev' when 'Data' then 'Data/AI' when 'Sales' then 'GTM' else s end from unnest(skills) s)
where vertical = 'rpo' and skills && array['Tech', 'Data', 'Sales'];

update public.client_needs
set profile_types = array(select distinct case s when 'Tech' then 'Dev' when 'Data' then 'Data/AI' when 'Sales' then 'GTM' else s end from unnest(profile_types) s)
where vertical = 'rpo' and profile_types && array['Tech', 'Data', 'Sales'];

alter table public.recruiter_profiles add constraint recruiter_profiles_vertical_check
  check (vertical in ('rpo', 'engineer', 'product', 'leader'));
alter table public.client_needs add constraint client_needs_vertical_check
  check (vertical in ('rpo', 'engineer', 'product', 'leader'));
