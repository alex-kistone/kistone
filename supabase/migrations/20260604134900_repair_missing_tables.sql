-- ============================================================================
-- Réparation de la chaîne de migrations.
--
-- Ces tables existent dans la base Lovable mais aucune migration ne les crée :
-- elles ont été ajoutées à la main depuis le dashboard. Conséquence, la chaîne
-- ne rejouait pas sur une base vierge (« relation public.studio_requests does
-- not exist ») et il était impossible de reconstruire le projet ailleurs.
--
-- Cette migration rétablit la reproductibilité. Les définitions viennent du
-- schéma réel (src/integrations/supabase/types.ts).
-- ============================================================================

-- ── Référentiels utilisés par l'app RPO ─────────────────────────────────────

-- Compétences proposées à la saisie, par persona (rpo / hr / finance).
CREATE TABLE IF NOT EXISTS public.specialties (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona        text NOT NULL DEFAULT 'rpo',
  label          text NOT NULL,
  sort_order     integer NOT NULL DEFAULT 0,
  jarvi_value_id text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Grille de qualification interne éditable par l'admin.
CREATE TABLE IF NOT EXISTS public.admin_qual_fields (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text,
  icon        text NOT NULL DEFAULT '',
  type        text NOT NULL DEFAULT 'text',
  is_default  boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.specialties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_qual_fields  ENABLE ROW LEVEL SECURITY;

-- Référentiels : lisibles par tout compte connecté, écrits par l'admin seul.
DROP POLICY IF EXISTS specialties_read ON public.specialties;
CREATE POLICY specialties_read ON public.specialties
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage specialties" ON public.specialties;
CREATE POLICY "Admins can manage specialties" ON public.specialties
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS admin_qual_read ON public.admin_qual_fields;
CREATE POLICY admin_qual_read ON public.admin_qual_fields
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS admin_qual_admin ON public.admin_qual_fields;
CREATE POLICY admin_qual_admin ON public.admin_qual_fields
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Tables hors périmètre RPO ───────────────────────────────────────────────
-- Recréées uniquement pour que les migrations suivantes (qui les ALTERent)
-- s'appliquent. `tenants` est un vestige du SaaS marque blanche et
-- `studio_requests` du site vitrine : le script
-- 20260908090100_drop_multitenant.sql.OPTIONAL les supprime en fin de chaîne.

CREATE TABLE IF NOT EXISTS public.studio_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       text NOT NULL DEFAULT '',
  last_name        text NOT NULL DEFAULT '',
  email            text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  theme            text,
  project_type     text,
  existing_project text,
  phone            text,
  status           text NOT NULL DEFAULT 'new',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tenants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                text NOT NULL UNIQUE,
  name                text NOT NULL DEFAULT '',
  subscription_status text NOT NULL DEFAULT 'active',
  -- Migrées vers tenant_billing puis supprimées par 20260615141628 ; présentes
  -- ici parce que son backfill les lit.
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ── Intégration Jarvi et multi-tenant : tables également absentes de la chaîne
-- Hors périmètre RPO, recréées pour que les migrations suivantes (DROP POLICY,
-- ALTER, GRANT) s'appliquent sur une base vierge.

CREATE TABLE IF NOT EXISTS public.jarvi_field_mappings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_field   text NOT NULL,
  platform_type    text NOT NULL DEFAULT 'text',
  direction        text NOT NULL DEFAULT 'both',
  jarvi_field_id   text,
  jarvi_field_kind text,
  jarvi_field_name text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jarvi_value_mappings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_field   text NOT NULL,
  platform_value   text NOT NULL,
  jarvi_value_id   text NOT NULL,
  jarvi_value_name text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pending_platform_fields (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                    text NOT NULL,
  label                   text NOT NULL,
  type                    text NOT NULL DEFAULT 'text',
  source_jarvi_field_id   text,
  source_jarvi_field_name text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.persona_jarvi_mapping (
  persona          text PRIMARY KEY,
  label            text,
  short_label      text,
  client_title     text,
  freelance_title  text,
  description      text,
  color            text,
  jarvi_field_uuid text,
  jarvi_project_id text,
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.tenant_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  logo_url        text,
  primary_color   text,
  secondary_color text,
  accent_color    text,
  custom_domain   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jarvi_field_mappings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jarvi_value_mappings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_platform_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_jarvi_mapping   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings         ENABLE ROW LEVEL SECURITY;

-- ── Colonnes tenant_id, elles aussi ajoutées hors migration ─────────────────
-- Des vues créées plus loin dans la chaîne (client_missions, freelance_missions)
-- les sélectionnent : sans elles, le replay casse sur « column m.tenant_id does
-- not exist ». Aucune contrainte ni index : ces colonnes ne servent plus qu'à
-- la compatibilité historique et disparaissent avec le script OPTIONAL.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'blog_articles','client_needs','client_profiles','messages','missions',
    'need_applications','profile_suggestions','recruiter_profiles',
    'timesheets','timesheet_days'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid', t);
  END LOOP;
END $$;

-- ── Policies attendues par des ALTER POLICY plus loin dans la chaîne ────────
-- Elles aussi créées depuis le dashboard. Les noms doivent correspondre au
-- caractère près, sinon « policy ... does not exist » au replay.
CREATE POLICY "Admins manage field mappings" ON public.jarvi_field_mappings
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage value mappings" ON public.jarvi_value_mappings
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage pending platform fields" ON public.pending_platform_fields
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage mapping" ON public.persona_jarvi_mapping
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all studio requests" ON public.studio_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update studio requests" ON public.studio_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete studio requests" ON public.studio_requests
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
