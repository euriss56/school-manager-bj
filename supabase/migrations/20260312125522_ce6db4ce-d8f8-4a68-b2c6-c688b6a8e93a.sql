-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'enseignant', 'parent', 'etudiant');
CREATE TYPE public.school_status AS ENUM ('en_attente', 'actif', 'suspendu');
CREATE TYPE public.school_plan AS ENUM ('basique', 'pro', 'premium');
CREATE TYPE public.inscription_status AS ENUM ('en_attente', 'valide', 'refuse');
CREATE TYPE public.mode_paiement AS ENUM ('especes', 'mtn_money', 'moov_money', 'virement');
CREATE TYPE public.absence_status AS ENUM ('present', 'absent', 'retard', 'excuse');
CREATE TYPE public.jour_semaine AS ENUM ('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi');
CREATE TYPE public.periodicite AS ENUM ('unique', 'mensuel', 'trimestriel');

-- TABLE: schools
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  ville TEXT NOT NULL,
  adresse TEXT,
  telephone TEXT,
  email TEXT NOT NULL,
  plan school_plan NOT NULL DEFAULT 'basique',
  statut school_status NOT NULL DEFAULT 'en_attente',
  code_unique TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  date_inscription TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_expiration_abonnement TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- TABLE: profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'etudiant',
  telephone TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- TABLE: user_roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT school_id FROM public.profiles WHERE id = _user_id $$;

-- TABLE: annees_scolaires
CREATE TABLE public.annees_scolaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.annees_scolaires ENABLE ROW LEVEL SECURITY;

-- TABLE: classes
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  annee_id UUID NOT NULL REFERENCES public.annees_scolaires(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  niveau TEXT NOT NULL,
  capacite INTEGER DEFAULT 50,
  enseignant_principal_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- TABLE: eleves
CREATE TABLE public.eleves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  matricule TEXT NOT NULL UNIQUE,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  date_naissance DATE,
  lieu_naissance TEXT,
  sexe TEXT CHECK (sexe IN ('M', 'F')),
  nationalite TEXT DEFAULT 'Béninoise',
  numero_acte_naissance TEXT,
  photo_url TEXT,
  classe_id UUID REFERENCES public.classes(id),
  annee_id UUID REFERENCES public.annees_scolaires(id),
  statut_inscription inscription_status NOT NULL DEFAULT 'en_attente',
  nom_pere TEXT,
  telephone_pere TEXT,
  nom_mere TEXT,
  telephone_mere TEXT,
  email_parent TEXT,
  ancienne_ecole TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.eleves ENABLE ROW LEVEL SECURITY;

-- TABLE: parents_eleves
CREATE TABLE public.parents_eleves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  UNIQUE (parent_id, eleve_id)
);
ALTER TABLE public.parents_eleves ENABLE ROW LEVEL SECURITY;

-- TABLE: matieres
CREATE TABLE public.matieres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  code TEXT,
  coefficient NUMERIC(3,1) NOT NULL DEFAULT 1,
  classe_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;

-- TABLE: enseignant_matieres
CREATE TABLE public.enseignant_matieres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enseignant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  classe_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  UNIQUE (enseignant_id, matiere_id, classe_id)
);
ALTER TABLE public.enseignant_matieres ENABLE ROW LEVEL SECURITY;

-- TABLE: periodes
CREATE TABLE public.periodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  annee_id UUID NOT NULL REFERENCES public.annees_scolaires(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.periodes ENABLE ROW LEVEL SECURITY;

-- TABLE: notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  periode_id UUID NOT NULL REFERENCES public.periodes(id) ON DELETE CASCADE,
  note_ds1 NUMERIC(4,2),
  note_ds2 NUMERIC(4,2),
  note_compo NUMERIC(4,2),
  moyenne NUMERIC(4,2),
  appreciation TEXT,
  saisie_par UUID REFERENCES public.profiles(id),
  date_saisie TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- TABLE: bulletins
CREATE TABLE public.bulletins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  periode_id UUID NOT NULL REFERENCES public.periodes(id) ON DELETE CASCADE,
  moyenne_generale NUMERIC(4,2),
  rang INTEGER,
  mention TEXT,
  appreciation_directeur TEXT,
  decision TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

-- TABLE: frais_types
CREATE TABLE public.frais_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  montant NUMERIC(10,0) NOT NULL,
  classe_id UUID REFERENCES public.classes(id),
  periodicite periodicite NOT NULL DEFAULT 'unique',
  annee_id UUID REFERENCES public.annees_scolaires(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.frais_types ENABLE ROW LEVEL SECURITY;

-- TABLE: paiements
CREATE TABLE public.paiements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  frais_type_id UUID NOT NULL REFERENCES public.frais_types(id) ON DELETE CASCADE,
  montant_paye NUMERIC(10,0) NOT NULL,
  mode_paiement mode_paiement NOT NULL DEFAULT 'especes',
  reference TEXT,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  recu_numero TEXT,
  recu_url TEXT,
  enregistre_par UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

-- TABLE: emplois_du_temps
CREATE TABLE public.emplois_du_temps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  matiere_id UUID NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  enseignant_id UUID REFERENCES public.profiles(id),
  jour jour_semaine NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle TEXT,
  annee_id UUID REFERENCES public.annees_scolaires(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.emplois_du_temps ENABLE ROW LEVEL SECURITY;

-- TABLE: absences
CREATE TABLE public.absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  matiere_id UUID REFERENCES public.matieres(id),
  date DATE NOT NULL,
  statut absence_status NOT NULL DEFAULT 'present',
  commentaire TEXT,
  saisie_par UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

-- TABLE: messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  expediteur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  destinataire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- TABLE: annonces
CREATE TABLE public.annonces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  destinataires TEXT NOT NULL DEFAULT 'tous',
  classe_id UUID REFERENCES public.classes(id),
  auteur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

-- TABLE: ressources
CREATE TABLE public.ressources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  fichier_url TEXT NOT NULL,
  matiere_id UUID REFERENCES public.matieres(id),
  classe_id UUID REFERENCES public.classes(id),
  auteur_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ressources ENABLE ROW LEVEL SECURITY;

-- TABLE: contacts_landing
CREATE TABLE public.contacts_landing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  ecole TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts_landing ENABLE ROW LEVEL SECURITY;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('photos-eleves', 'photos-eleves', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents-scolaires', 'documents-scolaires', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos-ecoles', 'logos-ecoles', true);

-- RLS POLICIES

-- Schools
CREATE POLICY "Anyone can register a school" ON public.schools FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own school" ON public.schools FOR SELECT USING (
  id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Admin can update own school" ON public.schools FOR UPDATE USING (
  id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);

-- Profiles
CREATE POLICY "Users can view profiles in their school" ON public.profiles FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR id = auth.uid() OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- User roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- annees_scolaires
CREATE POLICY "View annees_scolaires" ON public.annees_scolaires FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage annees_scolaires" ON public.annees_scolaires FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update annees_scolaires" ON public.annees_scolaires FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Delete annees_scolaires" ON public.annees_scolaires FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));

-- classes
CREATE POLICY "View classes" ON public.classes FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage classes" ON public.classes FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update classes" ON public.classes FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Delete classes" ON public.classes FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));

-- eleves
CREATE POLICY "View eleves" ON public.eleves FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage eleves" ON public.eleves FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update eleves" ON public.eleves FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Delete eleves" ON public.eleves FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));

-- parents_eleves
CREATE POLICY "View parent-eleve" ON public.parents_eleves FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Manage parent-eleve" ON public.parents_eleves FOR INSERT WITH CHECK (true);

-- matieres
CREATE POLICY "View matieres" ON public.matieres FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage matieres" ON public.matieres FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update matieres" ON public.matieres FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Delete matieres" ON public.matieres FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));

-- enseignant_matieres
CREATE POLICY "View enseignant_matieres" ON public.enseignant_matieres FOR SELECT USING (true);
CREATE POLICY "Manage enseignant_matieres" ON public.enseignant_matieres FOR INSERT WITH CHECK (true);
CREATE POLICY "Delete enseignant_matieres" ON public.enseignant_matieres FOR DELETE USING (true);

-- periodes
CREATE POLICY "View periodes" ON public.periodes FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage periodes" ON public.periodes FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update periodes" ON public.periodes FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));

-- notes
CREATE POLICY "View notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Insert notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Update notes" ON public.notes FOR UPDATE USING (saisie_par = auth.uid() OR true);

-- bulletins
CREATE POLICY "View bulletins" ON public.bulletins FOR SELECT USING (true);
CREATE POLICY "Manage bulletins" ON public.bulletins FOR INSERT WITH CHECK (true);
CREATE POLICY "Update bulletins" ON public.bulletins FOR UPDATE USING (true);

-- frais_types
CREATE POLICY "View frais_types" ON public.frais_types FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage frais_types" ON public.frais_types FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update frais_types" ON public.frais_types FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Delete frais_types" ON public.frais_types FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));

-- paiements
CREATE POLICY "View paiements" ON public.paiements FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage paiements" ON public.paiements FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

-- emplois_du_temps
CREATE POLICY "View emplois_du_temps" ON public.emplois_du_temps FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Manage emplois_du_temps" ON public.emplois_du_temps FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Update emplois_du_temps" ON public.emplois_du_temps FOR UPDATE USING (school_id = public.get_user_school_id(auth.uid()));
CREATE POLICY "Delete emplois_du_temps" ON public.emplois_du_temps FOR DELETE USING (school_id = public.get_user_school_id(auth.uid()));

-- absences
CREATE POLICY "View absences" ON public.absences FOR SELECT USING (true);
CREATE POLICY "Insert absences" ON public.absences FOR INSERT WITH CHECK (true);
CREATE POLICY "Update absences" ON public.absences FOR UPDATE USING (true);

-- messages
CREATE POLICY "View messages" ON public.messages FOR SELECT USING (
  expediteur_id = auth.uid() OR destinataire_id = auth.uid()
);
CREATE POLICY "Send messages" ON public.messages FOR INSERT WITH CHECK (expediteur_id = auth.uid());
CREATE POLICY "Update messages" ON public.messages FOR UPDATE USING (destinataire_id = auth.uid());

-- annonces
CREATE POLICY "View annonces" ON public.annonces FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Create annonces" ON public.annonces FOR INSERT WITH CHECK (school_id = public.get_user_school_id(auth.uid()));

-- ressources
CREATE POLICY "View ressources" ON public.ressources FOR SELECT USING (
  school_id = public.get_user_school_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin')
);
CREATE POLICY "Create ressources" ON public.ressources FOR INSERT WITH CHECK (auteur_id = auth.uid());
CREATE POLICY "Delete ressources" ON public.ressources FOR DELETE USING (auteur_id = auth.uid());

-- contacts_landing
CREATE POLICY "Anyone can submit contact" ON public.contacts_landing FOR INSERT WITH CHECK (true);
CREATE POLICY "Superadmin can view contacts" ON public.contacts_landing FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

-- Storage policies
CREATE POLICY "Public photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos-eleves');
CREATE POLICY "Upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos-eleves' AND auth.role() = 'authenticated');
CREATE POLICY "Public logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos-ecoles');
CREATE POLICY "Upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos-ecoles' AND auth.role() = 'authenticated');
CREATE POLICY "View documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents-scolaires' AND auth.role() = 'authenticated');
CREATE POLICY "Upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents-scolaires' AND auth.role() = 'authenticated');