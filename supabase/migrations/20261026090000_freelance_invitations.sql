-- Invitations envoyées par l'admin à des freelances pas encore inscrits (fonction invite-freelances).
-- Sert d'historique : qui a été invité, quand, comment, et si l'envoi a échoué.
create table if not exists public.freelance_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  mode text not null check (mode in ('individual', 'bcc')),
  invited_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  error text
);

create index if not exists freelance_invitations_email_idx on public.freelance_invitations (lower(email));

alter table public.freelance_invitations enable row level security;

drop policy if exists "Admins read freelance invitations" on public.freelance_invitations;
create policy "Admins read freelance invitations" on public.freelance_invitations
  for select using (public.has_role(auth.uid(), 'admin'::public.app_role));
