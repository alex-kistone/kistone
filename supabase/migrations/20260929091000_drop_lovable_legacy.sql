-- Nettoyage de l'héritage Lovable / Connect2 : multi-tenant, intégration Jarvi, tables
-- de l'ancien site vitrine. Tout est vide (vérifié le 2026-09-29) et plus rien ne s'en
-- sert, ni dans le front ni dans les fonctions ni dans les règles d'accès.
-- Remplace l'ancien 20260908090100_drop_multitenant.sql.OPTIONAL.

-- Les vues missions sélectionnent tenant_id : on les retire avant de supprimer la
-- colonne, puis on les recrée (mêmes règles que la phase 0 : security definer,
-- chacun ne voit que son TJM).
drop view if exists public.client_missions;
drop view if exists public.freelance_missions;

do $$
declare r record;
begin
  for r in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'tenant_id'
      and table_name in (select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE')
  loop
    execute format('alter table public.%I drop column if exists tenant_id cascade', r.table_name);
  end loop;
end $$;

drop table if exists public.tenant_billing cascade;
drop table if exists public.tenant_jarvi_config cascade;
drop table if exists public.tenant_candidate_fields cascade;
drop table if exists public.tenant_settings cascade;
drop table if exists public.tenant_members cascade;
drop table if exists public.tenants cascade;

drop function if exists public.has_tenant_role(uuid, text) cascade;
drop function if exists public.is_tenant_member(uuid) cascade;
drop function if exists public.current_tenant_id() cascade;
drop function if exists public.get_user_tenant_id(uuid) cascade;
drop type if exists public.tenant_role;

drop table if exists public.jarvi_field_mappings cascade;
drop table if exists public.jarvi_value_mappings cascade;
drop table if exists public.persona_jarvi_mapping cascade;

-- Ancien site vitrine Lovable (le site actuel n'a ni blog ni formulaire studio en base)
drop table if exists public.studio_requests cascade;
drop table if exists public.blog_articles cascade;
drop function if exists public.validate_studio_request() cascade;

create view public.client_missions with (security_invoker = false) as
select m.id, m.title, m.company_name, m.location, m.client_tjm, m.start_date, m.end_date,
       m.duration_text, m.status, m.need_id, m.suggestion_id, m.recruiter_profile_id,
       m.created_at, m.updated_at,
       rp.first_name as consultant_first_name,
       rp.job_title as consultant_job_title
from public.missions m
left join public.recruiter_profiles rp on rp.id = m.recruiter_profile_id
where m.need_id in (select cn.id from public.client_needs cn where cn.user_id = auth.uid());

create view public.freelance_missions with (security_invoker = false) as
select m.id, m.title, m.company_name, m.location, m.recruiter_tjm, m.start_date, m.end_date,
       m.duration_text, m.status, m.need_id, m.suggestion_id, m.recruiter_profile_id,
       m.created_at, m.updated_at
from public.missions m
where m.recruiter_profile_id in (select rp.id from public.recruiter_profiles rp where rp.user_id = auth.uid());

revoke all on public.client_missions, public.freelance_missions from anon;
grant select on public.client_missions, public.freelance_missions to authenticated;
