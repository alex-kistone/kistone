-- Invitations d'entreprises : deux modèles, experts IA (« client_ai ») et RPO (« client_rpo »).
-- Les invitations déjà envoyées avec l'ancien modèle unique « client » deviennent « client_ai ».
alter table public.freelance_invitations drop constraint if exists freelance_invitations_audience_check;
update public.freelance_invitations set audience = 'client_ai' where audience = 'client';
alter table public.freelance_invitations
  add constraint freelance_invitations_audience_check check (audience in ('ai', 'rpo', 'client_ai', 'client_rpo'));
