-- /besoin passe au RPO seul : le client choisit le métier à recruter. Les anciennes demandes
-- gardent metier vide et leur modèle d'engagement.
alter table public.need_requests
  add column if not exists metier text check (metier in ('Tech', 'GTM', 'Finance', 'Industrie', 'Autres'));
