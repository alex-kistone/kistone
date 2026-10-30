-- Demandes de besoin déposées sans compte (parcours public /besoin) : l'email et 4 réponses.
-- Écrites uniquement par la fonction need-request (service), lues et traitées par l'admin.

create table if not exists public.need_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254),
  vertical text not null check (vertical in ('rpo', 'engineer', 'product', 'leader')),
  engagement text not null check (engagement in ('fractional', 'mission', 'cdi', 'unsure')),
  rhythm text check (rhythm in ('1-day', '2-3-days', 'unsure')),
  duration text check (duration in ('3m', '3-6m', '6m+', 'unsure')),
  open_positions text check (char_length(open_positions) <= 300),
  start_window text not null check (start_window in ('asap', '1-2w', '1m', 'unsure')),
  brief text check (char_length(brief) <= 4000),
  status text not null default 'new' check (status in ('new', 'done', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists need_requests_created_at_idx on public.need_requests (created_at desc);
create index if not exists need_requests_email_idx on public.need_requests (email, created_at desc);

alter table public.need_requests enable row level security;

drop policy if exists "Admins read need requests" on public.need_requests;
create policy "Admins read need requests" on public.need_requests
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update need requests" on public.need_requests;
create policy "Admins update need requests" on public.need_requests
  for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins delete need requests" on public.need_requests;
create policy "Admins delete need requests" on public.need_requests
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
