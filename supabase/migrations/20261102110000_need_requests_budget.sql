-- /besoin : budget journalier du client (fourchette, ou « pas encore sûr »).
alter table public.need_requests
  add column if not exists budget text check (budget in ('lt500', '500-600', '600-800', 'gt800', 'unsure'));
