-- School creation is now performed only by the trusted auth.users trigger.
-- Remove the legacy public INSERT policy that allowed anonymous school creation.
DROP POLICY IF EXISTS "Anyone can register a school" ON public.schools;

-- Storage uploads were previously allowed to every authenticated user in every
-- tenant. Keep public reads where buckets are public, but require an active
-- school administrator for uploads and isolate objects by school UUID folder.
DROP POLICY IF EXISTS "Upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Upload documents" ON storage.objects;

CREATE POLICY "School admins upload student photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'photos-eleves'
  AND (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "School admins upload school logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'logos-ecoles'
  AND (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "School staff upload school documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents-scolaires'
  AND (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'enseignant')
    OR public.has_role(auth.uid(), 'comptable')
  )
);
