-- Protect school approval status at the database boundary.
-- Ordinary school administrators may edit permitted school details, but only a
-- superadmin may activate or suspend an establishment.
CREATE OR REPLACE FUNCTION public.prevent_non_superadmin_school_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut
     AND NOT public.has_role(auth.uid(), 'superadmin'::public.app_role) THEN
    RAISE EXCEPTION 'Seul un superadministrateur peut modifier le statut d’un établissement.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_school_status_from_non_superadmin ON public.schools;
CREATE TRIGGER protect_school_status_from_non_superadmin
BEFORE UPDATE OF statut ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_superadmin_school_status_change();

REVOKE ALL ON FUNCTION public.prevent_non_superadmin_school_status_change() FROM PUBLIC, anon, authenticated;
