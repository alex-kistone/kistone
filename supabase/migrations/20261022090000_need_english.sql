-- Niveau d'anglais requis par le client (1 débutant … 5 natif, même échelle que la note d'anglais
-- des freelances ; vide = non requis), visible des freelances et pris en compte par le matching.

alter table public.client_needs
  add column if not exists english_level smallint check (english_level between 1 and 5);

-- list_open_needs renvoie une colonne de plus : on recrée la fonction et ce qui en dépend.
drop policy if exists "Users can create applications" on public.need_applications;
drop view if exists public.client_needs_open;
drop function if exists public.list_open_needs();

create function public.list_open_needs()
returns table (
  id uuid, job_title text, profile_types text[], budget_tjm_min integer, budget_tjm_max integer,
  mission_location text, remote_policy text, description text, created_at timestamptz, desired_start date,
  vertical text, specialties text[], days_per_week smallint, duration_months smallint, english_level smallint
)
language sql stable security definer set search_path = public as $$
  select n.id, n.job_title, n.profile_types, n.budget_tjm_min, n.budget_tjm_max,
         n.mission_location, n.remote_policy, n.description, n.created_at, n.desired_start,
         n.vertical, n.specialties, n.days_per_week, n.duration_months, n.english_level
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
