-- Restrict writes to school staff. Tenant checks alone are insufficient:
-- every authenticated user in a school (including parents/students) could otherwise
-- create or modify academic and financial records.

-- Remove the original permissive mutation policies (policy names contain spaces).
DROP POLICY IF EXISTS "Manage annees_scolaires" ON public.annees_scolaires;
DROP POLICY IF EXISTS "Update annees_scolaires" ON public.annees_scolaires;
DROP POLICY IF EXISTS "Delete annees_scolaires" ON public.annees_scolaires;
DROP POLICY IF EXISTS "Manage classes" ON public.classes;
DROP POLICY IF EXISTS "Update classes" ON public.classes;
DROP POLICY IF EXISTS "Delete classes" ON public.classes;
DROP POLICY IF EXISTS "Manage eleves" ON public.eleves;
DROP POLICY IF EXISTS "Update eleves" ON public.eleves;
DROP POLICY IF EXISTS "Delete eleves" ON public.eleves;
DROP POLICY IF EXISTS "Manage matieres" ON public.matieres;
DROP POLICY IF EXISTS "Update matieres" ON public.matieres;
DROP POLICY IF EXISTS "Delete matieres" ON public.matieres;
DROP POLICY IF EXISTS "Manage periodes" ON public.periodes;
DROP POLICY IF EXISTS "Update periodes" ON public.periodes;
DROP POLICY IF EXISTS "Manage frais_types" ON public.frais_types;
DROP POLICY IF EXISTS "Update frais_types" ON public.frais_types;
DROP POLICY IF EXISTS "Delete frais_types" ON public.frais_types;
DROP POLICY IF EXISTS "Manage emplois_du_temps" ON public.emplois_du_temps;
DROP POLICY IF EXISTS "Update emplois_du_temps" ON public.emplois_du_temps;
DROP POLICY IF EXISTS "Delete emplois_du_temps" ON public.emplois_du_temps;
DROP POLICY IF EXISTS "Create annonces" ON public.annonces;
DROP POLICY IF EXISTS "Create ressources" ON public.ressources;
DROP POLICY IF EXISTS "Delete ressources" ON public.ressources;

-- Keep the existing SELECT policies; make all mutations admin-only and same-school.
CREATE POLICY "Admins create school years"
ON public.annees_scolaires FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update school years"
ON public.annees_scolaires FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete school years"
ON public.annees_scolaires FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin')
  AND EXISTS (SELECT 1 FROM public.annees_scolaires a
    WHERE a.id = public.classes.annee_id AND a.school_id = public.classes.school_id));
CREATE POLICY "Admins update classes"
ON public.classes FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin')
  AND EXISTS (SELECT 1 FROM public.annees_scolaires a
    WHERE a.id = public.classes.annee_id AND a.school_id = public.classes.school_id));
CREATE POLICY "Admins delete classes"
ON public.classes FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create students"
ON public.eleves FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update students"
ON public.eleves FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete students"
ON public.eleves FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create subjects"
ON public.matieres FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update subjects"
ON public.matieres FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete subjects"
ON public.matieres FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create periods"
ON public.periodes FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin')
  AND EXISTS (SELECT 1 FROM public.annees_scolaires a
    WHERE a.id = public.periodes.annee_id AND a.school_id = public.periodes.school_id));
CREATE POLICY "Admins update periods"
ON public.periodes FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin')
  AND EXISTS (SELECT 1 FROM public.annees_scolaires a
    WHERE a.id = public.periodes.annee_id AND a.school_id = public.periodes.school_id));
CREATE POLICY "Admins delete periods"
ON public.periodes FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create fee types"
ON public.frais_types FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update fee types"
ON public.frais_types FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete fee types"
ON public.frais_types FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create timetables"
ON public.emplois_du_temps FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update timetables"
ON public.emplois_du_temps FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'))
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete timetables"
ON public.emplois_du_temps FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins create announcements"
ON public.annonces FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND auteur_id = auth.uid()
  AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete announcements"
ON public.annonces FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid()) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Staff create resources"
ON public.ressources FOR INSERT TO authenticated
WITH CHECK (school_id = public.get_user_school_id(auth.uid()) AND auteur_id = auth.uid()
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'enseignant')));
CREATE POLICY "Authors and admins delete resources"
ON public.ressources FOR DELETE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid())
  AND (auteur_id = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- Payments: only administrators and accountants may record payments.
DROP POLICY IF EXISTS "Manage paiements" ON public.paiements;
CREATE POLICY "Finance staff record payments"
ON public.paiements FOR INSERT TO authenticated
WITH CHECK (
  school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable'))
  AND EXISTS (SELECT 1 FROM public.eleves e WHERE e.id = public.paiements.eleve_id AND e.school_id = public.paiements.school_id)
  AND EXISTS (SELECT 1 FROM public.frais_types f WHERE f.id = public.paiements.frais_type_id AND f.school_id = public.paiements.school_id)
);
CREATE POLICY "Finance staff update payments"
ON public.paiements FOR UPDATE TO authenticated
USING (school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable')))
WITH CHECK (school_id = public.get_user_school_id(auth.uid())
  AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comptable')));

-- Messages cannot be forged across schools or edited by the sender after delivery.
DROP POLICY IF EXISTS "Send messages" ON public.messages;
DROP POLICY IF EXISTS "Update messages" ON public.messages;
CREATE POLICY "Users send messages within their school"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  expediteur_id = auth.uid()
  AND school_id = public.get_user_school_id(auth.uid())
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.messages.destinataire_id AND p.school_id = public.messages.school_id)
);
CREATE POLICY "Recipients mark messages read"
ON public.messages FOR UPDATE TO authenticated
USING (destinataire_id = auth.uid() AND school_id = public.get_user_school_id(auth.uid()))
WITH CHECK (destinataire_id = auth.uid() AND school_id = public.get_user_school_id(auth.uid()));
