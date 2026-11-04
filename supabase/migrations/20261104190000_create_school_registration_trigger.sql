-- Create the school and its first administrator atomically when a school
-- registration signup is created. The role is hard-coded server-side.
CREATE OR REPLACE FUNCTION public.handle_school_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_school_id uuid;
  v_school_name text;
  v_school_type text;
  v_city text;
  v_plan public.school_plan;
  v_phone text;
  v_address text;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data ->> 'register_school', 'false') <> 'true' THEN
    RETURN NEW;
  END IF;

  v_school_name := NULLIF(btrim(NEW.raw_user_meta_data ->> 'school_name'), '');
  v_school_type := NULLIF(btrim(NEW.raw_user_meta_data ->> 'school_type'), '');
  v_city := NULLIF(btrim(NEW.raw_user_meta_data ->> 'city'), '');
  v_phone := NULLIF(btrim(NEW.raw_user_meta_data ->> 'phone'), '');
  v_address := NULLIF(btrim(NEW.raw_user_meta_data ->> 'address'), '');

  IF v_school_name IS NULL OR v_school_type IS NULL OR v_city IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Informations obligatoires de l’établissement manquantes';
  END IF;

  IF length(v_school_name) > 160 OR length(v_school_type) > 80
     OR length(v_city) > 100 OR length(COALESCE(v_address, '')) > 240
     OR length(COALESCE(v_phone, '')) > 30 THEN
    RAISE EXCEPTION 'Certaines informations dépassent la longueur autorisée';
  END IF;

  -- Public registration must never grant a paid plan by editing user metadata.
  v_plan := 'basique'::public.school_plan;

  INSERT INTO public.schools (
    nom, type, ville, adresse, telephone, email, plan, statut, code_unique
  ) VALUES (
    v_school_name, v_school_type, v_city, v_address, v_phone,
    lower(NEW.email), v_plan, 'en_attente',
    'ECO-BJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  )
  RETURNING id INTO v_school_id;

  INSERT INTO public.profiles (
    id, school_id, prenom, nom, email, role, telephone, is_active
  ) VALUES (
    NEW.id, v_school_id, 'Admin', v_school_name, lower(NEW.email),
    'admin', v_phone, true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_school_registration_created ON auth.users;
CREATE TRIGGER on_school_registration_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_school_registration();

REVOKE ALL ON FUNCTION public.handle_school_registration() FROM PUBLIC, anon, authenticated;
