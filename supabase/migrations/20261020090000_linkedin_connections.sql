-- Connexion LinkedIn de l'admin (publication des cartes de besoins sur son profil).
-- Jetons sensibles : aucune policy, la table n'est lue et écrite que par les fonctions
-- (clé service) linkedin-auth et linkedin-publish.

create table if not exists public.linkedin_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text,
  expires_at timestamptz,
  member_urn text,
  member_name text,
  oauth_state text,
  state_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.linkedin_connections enable row level security;
revoke all on public.linkedin_connections from anon, authenticated;
