-- Close privilege-escalation paths left by the original permissive profile policies.
-- School registration must create the first admin profile through a trusted server function.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Use SECURITY DEFINER helpers to avoid querying profiles recursively from its own RLS policy.
CREATE OR REPLACE FUNCTION public.get_profile_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role FROM public.profiles p
  WHERE p.id = _user_id AND p.is_active = true
  LIMIT 1;
$$;

-- A school-scoped role is effective only while its school is approved.
-- Superadmins are global and do not belong to an approved school.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _user_id
      AND p.role = _role
      AND p.is_active = true
      AND (
        _role = 'superadmin'::public.app_role
        OR EXISTS (
          SELECT 1
          FROM public.schools s
          WHERE s.id = p.school_id
            AND s.statut = 'actif'
        )
      )
  );
$;

-- Prevent a user from changing their own role, tenant, or active state.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update safe own profile fields" ON public.profiles;
CREATE POLICY "Users update only non-privileged own profile fields"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() AND is_active = true)
WITH CHECK (
  id = auth.uid()
  AND role = public.get_profile_role(auth.uid())
  AND school_id IS NOT DISTINCT FROM public.get_user_school_id(auth.uid())
  AND is_active = true
);

-- Superadmins must be able to update any school; school admins only their own.
DROP POLICY IF EXISTS "School admins update their own school" ON public.schools;
CREATE POLICY "School admins and superadmins update schools"
ON public.schools FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    id = public.get_user_school_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'superadmin')
  OR (
    id = public.get_user_school_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  )
);

-- User role assignments are managed only by trusted server-side code.
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own role assignments"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());
