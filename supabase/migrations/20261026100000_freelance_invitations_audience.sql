-- Invitations de freelances : modèle utilisé (experts IA ou Tech recruiters).
alter table public.freelance_invitations
  add column if not exists audience text not null default 'ai' check (audience in ('ai', 'rpo'));
