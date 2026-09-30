-- Budget TJM d'un besoin : positif, et min strictement inférieur au max quand les deux sont
-- renseignés. Filet de sécurité derrière la validation des formulaires client.
alter table public.client_needs drop constraint if exists client_needs_budget_check;
alter table public.client_needs add constraint client_needs_budget_check check (
  (budget_tjm_min is null or budget_tjm_min > 0)
  and (budget_tjm_max is null or budget_tjm_max > 0)
  and (budget_tjm_min is null or budget_tjm_max is null or budget_tjm_min < budget_tjm_max)
);
