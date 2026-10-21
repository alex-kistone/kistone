-- Invitations : aussi des entreprises clientes (modèle « client »), en plus des freelances.
alter table public.freelance_invitations drop constraint if exists freelance_invitations_audience_check;
alter table public.freelance_invitations
  add constraint freelance_invitations_audience_check check (audience in ('ai', 'rpo', 'client'));
