-- Modèle du freelance : RPO et/ou Succès (valeurs séparées par une virgule, comme le formulaire
-- et le champ Jarvi « Modèle »). L'ancienne contrainte n'acceptait qu'une seule valeur.
alter table public.recruiter_profiles drop constraint if exists recruiter_profiles_model_check;
alter table public.recruiter_profiles add constraint recruiter_profiles_model_check
  check (model is null or model ~ '^(RPO|Succès)(,(RPO|Succès))?$');
