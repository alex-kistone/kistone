-- ============================================================================
-- Matching hybride : colonnes nécessaires + verrou sur la qualification interne.
-- Migration ADDITIVE : ne supprime rien, sans risque sur la base en place.
-- ============================================================================

-- Un profil n'entre dans le matching que s'il a réellement rempli son onboarding.
ALTER TABLE public.recruiter_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Backfill : les profils déjà exploitables (TJM + au moins une compétence)
-- sont considérés comme onboardés, sinon le matching ne trouverait plus personne.
UPDATE public.recruiter_profiles
   SET onboarding_completed = true
 WHERE onboarding_completed = false
   AND tjm IS NOT NULL
   AND coalesce(array_length(skills, 1), 0) > 0;

-- Part déterministe du score, conservée pour auditer l'écart avec le modèle.
ALTER TABLE public.profile_suggestions
  ADD COLUMN IF NOT EXISTS rule_score smallint;

CREATE INDEX IF NOT EXISTS profile_suggestions_need_score_idx
  ON public.profile_suggestions (need_id, match_score DESC);

-- ============================================================================
-- La RLS de Postgres est par ligne, pas par colonne : la policy qui autorise un
-- freelance à modifier SON profil l'autorise aussi à écrire admin_rating,
-- admin_comments et super_tam — donc à s'auto-noter 5 et à truquer son
-- classement. Ce trigger réimpose les valeurs précédentes pour tout non-admin.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_recruiter_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  NEW.admin_rating   := OLD.admin_rating;
  NEW.admin_comments := OLD.admin_comments;
  NEW.super_tam      := OLD.super_tam;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_admin_fields ON public.recruiter_profiles;
CREATE TRIGGER guard_admin_fields
  BEFORE UPDATE ON public.recruiter_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_recruiter_admin_fields();
