-- /besoin : « Head of TA » parmi les métiers proposés au client.
alter table public.need_requests drop constraint if exists need_requests_metier_check;
alter table public.need_requests
  add constraint need_requests_metier_check check (metier in ('Tech', 'GTM', 'Finance', 'Industrie', 'Head of TA', 'Autres'));
