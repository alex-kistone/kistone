-- « Me positionner » échouait pour tous les freelances (violation RLS) : la règle d'insertion
-- vérifiait l'existence du besoin en lisant client_needs, table que le freelance ne voit pas.
-- On vérifie désormais via list_open_needs() (security definer) : un freelance ne peut se
-- positionner que sur un besoin ouvert, et seulement avec son propre profil.
drop policy if exists "Users can create applications" on public.need_applications;
create policy "Users can create applications" on public.need_applications
  for insert to authenticated
  with check (
    recruiter_profile_id in (select id from public.recruiter_profiles where user_id = auth.uid())
    and exists (select 1 from public.list_open_needs() o where o.id = need_applications.need_id)
  );
