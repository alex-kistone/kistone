-- L'admin est seul aux commandes du pipeline : c'est lui qui retient ou écarte un profil et
-- prépare la mission. Le client peut seulement signaler son intérêt pour un profil proposé
-- (« Je souhaite en savoir plus » : suggested → shortlisted), ce qui prévient l'admin.
drop policy if exists "Clients can move their own suggestions" on public.profile_suggestions;
create policy "Clients can flag interest in their suggestions" on public.profile_suggestions
  for update to authenticated
  using (
    need_id in (select id from public.client_needs where user_id = auth.uid())
    and pipeline_status = 'suggested'
  )
  with check (
    need_id in (select id from public.client_needs where user_id = auth.uid())
    and pipeline_status = 'shortlisted'
  );
