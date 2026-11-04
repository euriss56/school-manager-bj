-- Security hardening: remove permissive policies that exposed cross-school data.
-- Existing policies are permissive (OR-combined), so the unsafe policies must be dropped.

-- Profiles: users may read same-school profiles, but cannot change their role or school.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can create a non-privileged own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  id = auth.uid()
  AND role IN ('admin', 'enseignant', 'parent', 'etudiant', 'comptable')
  AND is_active = true
);
CREATE POLICY "Users can update safe own profile fields"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  AND school_id IS NOT DISTINCT FROM (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid())
  AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
);

-- Parent/student relationships must never be writable by arbitrary visitors.
DROP POLICY IF EXISTS "Manage parent-eleve" ON public.parents_eleves;
CREATE POLICY "Parents can link themselves to same-school students"
ON public.parents_eleves FOR INSERT TO authenticated
WITH CHECK (
  parent_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.eleves e ON e.id = eleve_id
    WHERE p.id = auth.uid() AND p.school_id = e.school_id AND p.role = 'parent'
  )
);
CREATE POLICY "Parents can unlink their own student links"
ON public.parents_eleves FOR DELETE TO authenticated
USING (parent_id = auth.uid());

-- Teacher-subject assignments must be scoped to the teacher's school.
DROP POLICY IF EXISTS "View enseignant_matieres" ON public.enseignant_matieres;
DROP POLICY IF EXISTS "Manage enseignant_matieres" ON public.enseignant_matieres;
DROP POLICY IF EXISTS "Delete enseignant_matieres" ON public.enseignant_matieres;
CREATE POLICY "View teacher subject assignments in own school"
ON public.enseignant_matieres FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles t
    JOIN public.matieres m ON m.id = matiere_id
    WHERE t.id = enseignant_id AND t.school_id = m.school_id
      AND t.school_id = public.get_user_school_id(auth.uid())
  )
);
CREATE POLICY "Admins manage teacher subject assignments"
ON public.enseignant_matieres FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.profiles t
    JOIN public.matieres m ON m.id = matiere_id
    WHERE t.id = enseignant_id AND t.school_id = m.school_id
      AND t.school_id = public.get_user_school_id(auth.uid())
  )
);
CREATE POLICY "Admins delete teacher subject assignments"
ON public.enseignant_matieres FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.profiles t
    JOIN public.matieres m ON m.id = matiere_id
    WHERE t.id = enseignant_id AND t.school_id = m.school_id
      AND t.school_id = public.get_user_school_id(auth.uid())
  )
);

-- Notes: no global read/write access. Every note is checked through its student.
DROP POLICY IF EXISTS "View notes" ON public.notes;
DROP POLICY IF EXISTS "Insert notes" ON public.notes;
DROP POLICY IF EXISTS "Update notes" ON public.notes;
CREATE POLICY "Read notes in own school"
ON public.notes FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
);
CREATE POLICY "Teachers and admins insert notes in own school"
ON public.notes FOR INSERT TO authenticated
WITH CHECK (
  saisie_par = auth.uid()
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'enseignant'))
  AND EXISTS (
    SELECT 1 FROM public.eleves e JOIN public.matieres m ON m.id = matiere_id
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid())
      AND m.school_id = e.school_id
  )
);
CREATE POLICY "Teachers and admins update notes in own school"
ON public.notes FOR UPDATE TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'enseignant') AND saisie_par = auth.uid()))
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'enseignant') AND saisie_par = auth.uid()))
  AND EXISTS (SELECT 1 FROM public.eleves e JOIN public.matieres m ON m.id = matiere_id
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid())
      AND m.school_id = e.school_id)
);

-- Bulletins: only own-school users can read; admins manage, students/parents read published bulletins.
DROP POLICY IF EXISTS "View bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "Manage bulletins" ON public.bulletins;
DROP POLICY IF EXISTS "Update bulletins" ON public.bulletins;
CREATE POLICY "Read published bulletins in own school"
ON public.bulletins FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'enseignant')
    OR is_published = true
  )
);
CREATE POLICY "Admins create bulletins in own school"
ON public.bulletins FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
);
CREATE POLICY "Admins update bulletins in own school"
ON public.bulletins FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
);

-- Absences have no school_id: enforce tenant isolation through the student record.
DROP POLICY IF EXISTS "View absences" ON public.absences;
DROP POLICY IF EXISTS "Insert absences" ON public.absences;
DROP POLICY IF EXISTS "Update absences" ON public.absences;
CREATE POLICY "Read absences in own school"
ON public.absences FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
);
CREATE POLICY "Staff record absences in own school"
ON public.absences FOR INSERT TO authenticated
WITH CHECK (
  saisie_par = auth.uid()
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'enseignant'))
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
);
CREATE POLICY "Staff update absences in own school"
ON public.absences FOR UPDATE TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'enseignant') AND saisie_par = auth.uid()))
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
)
WITH CHECK (
  (public.has_role(auth.uid(), 'admin') OR (public.has_role(auth.uid(), 'enseignant') AND saisie_par = auth.uid()))
  AND EXISTS (SELECT 1 FROM public.eleves e
    WHERE e.id = eleve_id AND e.school_id = public.get_user_school_id(auth.uid()))
);

-- Ensure all tenant-linked tables require authenticated access for reads.
