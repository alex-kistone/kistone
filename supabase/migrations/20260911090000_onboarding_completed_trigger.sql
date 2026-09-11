-- ============================================================================
-- onboarding_completed est désormais calculé par la base, jamais saisi.
--
-- match-profiles ne retient que les profils onboardés. Le backfill de
-- 20260908090000 couvrait les profils existants, mais rien ne posait le drapeau
-- sur les nouveaux : sur une base neuve, aucun freelance n'aurait jamais été
-- matché. Le calculer ici plutôt que dans le front garde une seule définition
-- (celle du backfill), vaut pour tous les écrivains (formulaire freelance,
-- écran admin, import), et ne peut pas être forcé depuis le client.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.compute_onboarding_completed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.onboarding_completed :=
    NEW.tjm IS NOT NULL
    AND coalesce(array_length(NEW.skills, 1), 0) > 0;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compute_onboarding_completed ON public.recruiter_profiles;
CREATE TRIGGER compute_onboarding_completed
  BEFORE INSERT OR UPDATE ON public.recruiter_profiles
  FOR EACH ROW EXECUTE FUNCTION public.compute_onboarding_completed();
