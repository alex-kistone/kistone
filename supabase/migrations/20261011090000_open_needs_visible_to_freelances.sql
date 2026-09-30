-- « Mes opportunités » était vide pour tous les freelances : la vue client_needs_open est passée
-- en security_invoker (20260604160002), si bien que les règles RLS de client_needs — réservées
-- au client et à l'admin — masquaient tous les besoins aux freelances.
-- Correctif : une fonction security definer qui ne renvoie que les colonnes publiques des besoins
-- ouverts, et seulement aux freelances et aux admins ; la vue (security_invoker, conforme au
-- linter Supabase) s'appuie dessus, le site n'a donc rien à changer.
create or replace function public.list_open_needs()
returns table (
  id uuid, job_title text, profile_types text[], budget_tjm_min integer, budget_tjm_max integer,
  mission_location text, remote_policy text, description text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select n.id, n.job_title, n.profile_types, n.budget_tjm_min, n.budget_tjm_max,
         n.mission_location, n.remote_policy, n.description, n.created_at
  from public.client_needs n
  where n.status = 'pending'
    and (public.has_role(auth.uid(), 'user') or public.has_role(auth.uid(), 'admin'));
$$;

revoke all on function public.list_open_needs() from public, anon;
grant execute on function public.list_open_needs() to authenticated;

create or replace view public.client_needs_open with (security_invoker = true) as
  select * from public.list_open_needs();

grant select on public.client_needs_open to authenticated;
