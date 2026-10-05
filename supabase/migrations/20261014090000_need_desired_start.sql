-- Date d'arrivée souhaitée d'un besoin : NULL = « Dès que possible », sinon la date choisie
-- par le client. Le matching mesure la disponibilité des profils par rapport à cette date,
-- avec 30 jours de tolérance (supabase/functions/_shared/matching.ts).
alter table public.client_needs add column if not exists desired_start date;
comment on column public.client_needs.desired_start is
  'Date d''arrivée souhaitée ; NULL = dès que possible.';

-- Les freelances voient aussi la date de démarrage dans leurs opportunités : on ajoute la
-- colonne à list_open_needs (le type de retour change, d'où la recréation de la vue et de la
-- règle d'insertion des candidatures qui en dépendent).
drop policy if exists "Users can create applications" on public.need_applications;
drop view if exists public.client_needs_open;
drop function if exists public.list_open_needs();

create function public.list_open_needs()
returns table (
  id uuid, job_title text, profile_types text[], budget_tjm_min integer, budget_tjm_max integer,
  mission_location text, remote_policy text, description text, created_at timestamptz, desired_start date
)
language sql stable security definer set search_path = public as $$
  select n.id, n.job_title, n.profile_types, n.budget_tjm_min, n.budget_tjm_max,
         n.mission_location, n.remote_policy, n.description, n.created_at, n.desired_start
  from public.client_needs n
  where n.status = 'pending'
    and (public.has_role(auth.uid(), 'user') or public.has_role(auth.uid(), 'admin'));
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
