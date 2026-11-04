-- School creation is now performed only by the trusted auth.users trigger.
-- Remove the legacy public INSERT policy that allowed anonymous school creation.
DROP POLICY IF EXISTS "Anyone can register a school" ON public.schools;

-- Storage upload policies need a separate audit of the application's object
-- naming convention before tenant-folder restrictions can be applied safely.
