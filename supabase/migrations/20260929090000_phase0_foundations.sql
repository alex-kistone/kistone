-- Phase 0 du module ADV (docs/plan-adv.md) : marge étanche, CRA validables, pipeline
-- unique, messages sans appel externe, paramètres de la société.

-- ── 1. Marge étanche ─────────────────────────────────────────────────────────
-- Client et freelance ne lisent plus la table missions : seulement leur vue, qui
-- n'expose que leur propre TJM. Les vues deviennent « security definer » (droits du
-- propriétaire) et filtrent elles-mêmes sur auth.uid().
drop policy if exists "Clients can view missions for their needs" on public.missions;
drop policy if exists "Freelancers can view their own missions" on public.missions;

alter view public.client_missions set (security_invoker = false);
alter view public.freelance_missions set (security_invoker = false);
revoke all on public.client_missions, public.freelance_missions from anon;
grant select on public.client_missions, public.freelance_missions to authenticated;

-- L'historique des prolongations contient les deux TJM : réservé à l'admin.
drop policy if exists "Clients can view extensions for their missions" on public.mission_extensions;
drop policy if exists "Freelancers can view own mission extensions" on public.mission_extensions;

-- ── 2. CRA : règles par rôle ─────────────────────────────────────────────────
-- L'ancienne version bloquait tout non-admin qui touchait client_reviewed_at,
-- donc aussi la validation par le client. On raisonne désormais par rôle, sur la
-- liste des colonnes réellement modifiées.
create or replace function public.enforce_timesheet_freelancer_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed text[];
  is_client boolean;
begin
  if public.has_role(auth.uid(), 'admin'::app_role) then
    return new;
  end if;

  select coalesce(array_agg(n.key), '{}') into changed
  from jsonb_each(to_jsonb(new)) n
  where n.value is distinct from (to_jsonb(old) -> n.key)
    and n.key <> 'updated_at';

  is_client := exists (select 1 from public.client_needs where id = old.need_id and user_id = auth.uid());

  if is_client then
    -- Le client ne fait que valider ou refuser un CRA soumis.
    if not changed <@ array['status', 'client_reviewed_at', 'client_reviewed_by', 'client_comment', 'rejection_reason']
       or old.status <> 'submitted'
       or new.status not in ('client_approved', 'client_rejected')
       or (new.client_reviewed_by is not null and new.client_reviewed_by <> auth.uid()) then
      raise exception 'Le client peut seulement valider ou refuser un CRA soumis';
    end if;
    return new;
  end if;

  -- Freelance : saisie et soumission de son CRA, rien d'autre.
  if not changed <@ array['status', 'total_days', 'submitted_at', 'freelancer_comment', 'recruitments_count']
     or new.status not in ('draft', 'submitted') then
    raise exception 'Le freelance peut seulement saisir et soumettre son CRA';
  end if;
  return new;
end;
$$;

-- ── 3. Pipeline unique ───────────────────────────────────────────────────────
-- Suggestion : proposé → présélectionné → entretien → accepté (ou refusé). La suite
-- (mise en place, mission active, terminée) vit sur la mission elle-même.
drop trigger if exists trg_enforce_recruiter_first_name on public.profile_suggestions;
drop function if exists public.enforce_recruiter_first_name_stage();

update public.profile_suggestions set pipeline_status = 'accepted'
where pipeline_status in ('validated', 'contract_pending', 'contract_signed', 'active', 'completed', 'mission_started');

alter table public.profile_suggestions drop constraint if exists profile_suggestions_pipeline_status_check;
alter table public.profile_suggestions add constraint profile_suggestions_pipeline_status_check
  check (pipeline_status in ('suggested', 'shortlisted', 'interview', 'accepted', 'rejected'));

-- Mission : « onboarding » = dossiers (KYC) et contrats en cours, avant le démarrage.
alter table public.missions drop constraint if exists missions_status_check;
alter table public.missions add constraint missions_status_check
  check (status in ('onboarding', 'active', 'completed', 'cancelled'));

-- ── 4. Messages : plus d'appel vers d'anciens projets ────────────────────────
-- Le déclencheur postait vers deux projets Supabase étrangers, en double. Les
-- emails de messages reviendront avec le centre de notifications (phase 4).
drop trigger if exists on_new_message on public.messages;
drop trigger if exists on_new_message_notify on public.messages;
drop function if exists public.notify_new_message();

-- ── 5. Paramètres de la société ──────────────────────────────────────────────
-- Une seule ligne. Identité légale utilisée par les contrats et les factures ;
-- les clés d'API (Yousign, Pennylane) restent dans les secrets Supabase.
create table if not exists public.company_settings (
  id smallint primary key default 1 check (id = 1),
  legal_name text not null default 'Kistone SAS',
  legal_form text default 'SAS',
  siren text,
  vat_number text,
  address text,
  representative_name text,
  representative_title text,
  contact_email text,
  default_margin_eur integer not null default 100 check (default_margin_eur >= 0),
  client_payment_terms_days integer not null default 30,
  freelance_payment_terms_days integer not null default 30,
  yousign_enabled boolean not null default false,
  pennylane_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.company_settings (id) values (1) on conflict (id) do nothing;

alter table public.company_settings enable row level security;
drop policy if exists "Authenticated can read company settings" on public.company_settings;
create policy "Authenticated can read company settings" on public.company_settings
  for select to authenticated using (true);
drop policy if exists "Admins can update company settings" on public.company_settings;
create policy "Admins can update company settings" on public.company_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

drop trigger if exists update_company_settings_updated_at on public.company_settings;
create trigger update_company_settings_updated_at before update on public.company_settings
  for each row execute function public.update_updated_at_column();

-- ── 6. Consultant visible par le client pendant la mission ───────────────────
-- Le client ne lit pas recruiter_profiles : la vue lui donne le prénom et l'intitulé
-- du consultant (jamais le nom de famille ni le TJM freelance).
create or replace view public.client_missions with (security_invoker = false) as
select m.id, m.title, m.company_name, m.location, m.client_tjm, m.start_date, m.end_date,
       m.duration_text, m.status, m.need_id, m.suggestion_id, m.recruiter_profile_id,
       m.tenant_id, m.created_at, m.updated_at,
       rp.first_name as consultant_first_name,
       rp.job_title as consultant_job_title
from public.missions m
left join public.recruiter_profiles rp on rp.id = m.recruiter_profile_id
where m.need_id in (select cn.id from public.client_needs cn where cn.user_id = auth.uid());
grant select on public.client_missions to authenticated;
