-- CGU (rétablies le 2026-11-17 à la demande d'Alex) : chaque utilisateur (freelance ou client)
-- accepte les CGU dans leur version en vigueur (TERMS_VERSION dans src/lib/terms.ts) ; une
-- nouvelle version redemande l'acceptation. Même table que la migration retirée du 2026-11-12.

create table if not exists public.terms_acceptances (
  user_id uuid not null references auth.users (id) on delete cascade,
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, version)
);

alter table public.terms_acceptances enable row level security;

drop policy if exists "Chacun lit ses acceptations de CGU" on public.terms_acceptances;
create policy "Chacun lit ses acceptations de CGU" on public.terms_acceptances
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Chacun accepte les CGU pour lui-même" on public.terms_acceptances;
create policy "Chacun accepte les CGU pour lui-même" on public.terms_acceptances
  for insert to authenticated
  with check (user_id = auth.uid());

grant select, insert on public.terms_acceptances to authenticated;
