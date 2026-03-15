export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      absences: {
        Row: {
          commentaire: string | null
          created_at: string
          date: string
          eleve_id: string
          id: string
          matiere_id: string | null
          saisie_par: string | null
          statut: Database["public"]["Enums"]["absence_status"]
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          date: string
          eleve_id: string
          id?: string
          matiere_id?: string | null
          saisie_par?: string | null
          statut?: Database["public"]["Enums"]["absence_status"]
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          date?: string
          eleve_id?: string
          id?: string
          matiere_id?: string | null
          saisie_par?: string | null
          statut?: Database["public"]["Enums"]["absence_status"]
        }
        Relationships: [
          {
            foreignKeyName: "absences_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absences_saisie_par_fkey"
            columns: ["saisie_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      annees_scolaires: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          is_active: boolean
          libelle: string
          school_id: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          is_active?: boolean
          libelle: string
          school_id: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          is_active?: boolean
          libelle?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annees_scolaires_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      annonces: {
        Row: {
          auteur_id: string
          classe_id: string | null
          contenu: string
          created_at: string
          destinataires: string
          id: string
          school_id: string
          titre: string
        }
        Insert: {
          auteur_id: string
          classe_id?: string | null
          contenu: string
          created_at?: string
          destinataires?: string
          id?: string
          school_id: string
          titre: string
        }
        Update: {
          auteur_id?: string
          classe_id?: string | null
          contenu?: string
          created_at?: string
          destinataires?: string
          id?: string
          school_id?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "annonces_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annonces_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annonces_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletins: {
        Row: {
          appreciation_directeur: string | null
          created_at: string
          decision: string | null
          eleve_id: string
          id: string
          is_published: boolean
          mention: string | null
          moyenne_generale: number | null
          periode_id: string
          published_at: string | null
          rang: number | null
        }
        Insert: {
          appreciation_directeur?: string | null
          created_at?: string
          decision?: string | null
          eleve_id: string
          id?: string
          is_published?: boolean
          mention?: string | null
          moyenne_generale?: number | null
          periode_id: string
          published_at?: string | null
          rang?: number | null
        }
        Update: {
          appreciation_directeur?: string | null
          created_at?: string
          decision?: string | null
          eleve_id?: string
          id?: string
          is_published?: boolean
          mention?: string | null
          moyenne_generale?: number | null
          periode_id?: string
          published_at?: string | null
          rang?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          annee_id: string
          capacite: number | null
          created_at: string
          enseignant_principal_id: string | null
          id: string
          niveau: string
          nom: string
          school_id: string
        }
        Insert: {
          annee_id: string
          capacite?: number | null
          created_at?: string
          enseignant_principal_id?: string | null
          id?: string
          niveau: string
          nom: string
          school_id: string
        }
        Update: {
          annee_id?: string
          capacite?: number | null
          created_at?: string
          enseignant_principal_id?: string | null
          id?: string
          niveau?: string
          nom?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_annee_id_fkey"
            columns: ["annee_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_enseignant_principal_id_fkey"
            columns: ["enseignant_principal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_landing: {
        Row: {
          created_at: string
          ecole: string | null
          email: string
          id: string
          message: string | null
          nom: string
          telephone: string | null
        }
        Insert: {
          created_at?: string
          ecole?: string | null
          email: string
          id?: string
          message?: string | null
          nom: string
          telephone?: string | null
        }
        Update: {
          created_at?: string
          ecole?: string | null
          email?: string
          id?: string
          message?: string | null
          nom?: string
          telephone?: string | null
        }
        Relationships: []
      }
      eleves: {
        Row: {
          ancienne_ecole: string | null
          annee_id: string | null
          classe_id: string | null
          created_at: string
          date_naissance: string | null
          email_parent: string | null
          id: string
          lieu_naissance: string | null
          matricule: string
          nationalite: string | null
          nom: string
          nom_mere: string | null
          nom_pere: string | null
          numero_acte_naissance: string | null
          photo_url: string | null
          prenom: string
          school_id: string
          sexe: string | null
          statut_inscription: Database["public"]["Enums"]["inscription_status"]
          telephone_mere: string | null
          telephone_pere: string | null
        }
        Insert: {
          ancienne_ecole?: string | null
          annee_id?: string | null
          classe_id?: string | null
          created_at?: string
          date_naissance?: string | null
          email_parent?: string | null
          id?: string
          lieu_naissance?: string | null
          matricule: string
          nationalite?: string | null
          nom: string
          nom_mere?: string | null
          nom_pere?: string | null
          numero_acte_naissance?: string | null
          photo_url?: string | null
          prenom: string
          school_id: string
          sexe?: string | null
          statut_inscription?: Database["public"]["Enums"]["inscription_status"]
          telephone_mere?: string | null
          telephone_pere?: string | null
        }
        Update: {
          ancienne_ecole?: string | null
          annee_id?: string | null
          classe_id?: string | null
          created_at?: string
          date_naissance?: string | null
          email_parent?: string | null
          id?: string
          lieu_naissance?: string | null
          matricule?: string
          nationalite?: string | null
          nom?: string
          nom_mere?: string | null
          nom_pere?: string | null
          numero_acte_naissance?: string | null
          photo_url?: string | null
          prenom?: string
          school_id?: string
          sexe?: string | null
          statut_inscription?: Database["public"]["Enums"]["inscription_status"]
          telephone_mere?: string | null
          telephone_pere?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eleves_annee_id_fkey"
            columns: ["annee_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eleves_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eleves_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      emplois_du_temps: {
        Row: {
          annee_id: string | null
          classe_id: string
          created_at: string
          enseignant_id: string | null
          heure_debut: string
          heure_fin: string
          id: string
          jour: Database["public"]["Enums"]["jour_semaine"]
          matiere_id: string
          salle: string | null
          school_id: string
        }
        Insert: {
          annee_id?: string | null
          classe_id: string
          created_at?: string
          enseignant_id?: string | null
          heure_debut: string
          heure_fin: string
          id?: string
          jour: Database["public"]["Enums"]["jour_semaine"]
          matiere_id: string
          salle?: string | null
          school_id: string
        }
        Update: {
          annee_id?: string | null
          classe_id?: string
          created_at?: string
          enseignant_id?: string | null
          heure_debut?: string
          heure_fin?: string
          id?: string
          jour?: Database["public"]["Enums"]["jour_semaine"]
          matiere_id?: string
          salle?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emplois_du_temps_annee_id_fkey"
            columns: ["annee_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emplois_du_temps_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emplois_du_temps_enseignant_id_fkey"
            columns: ["enseignant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emplois_du_temps_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emplois_du_temps_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enseignant_matieres: {
        Row: {
          classe_id: string | null
          enseignant_id: string
          id: string
          matiere_id: string
        }
        Insert: {
          classe_id?: string | null
          enseignant_id: string
          id?: string
          matiere_id: string
        }
        Update: {
          classe_id?: string | null
          enseignant_id?: string
          id?: string
          matiere_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enseignant_matieres_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enseignant_matieres_enseignant_id_fkey"
            columns: ["enseignant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enseignant_matieres_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
        ]
      }
      frais_types: {
        Row: {
          annee_id: string | null
          classe_id: string | null
          created_at: string
          id: string
          montant: number
          nom: string
          periodicite: Database["public"]["Enums"]["periodicite"]
          school_id: string
        }
        Insert: {
          annee_id?: string | null
          classe_id?: string | null
          created_at?: string
          id?: string
          montant: number
          nom: string
          periodicite?: Database["public"]["Enums"]["periodicite"]
          school_id: string
        }
        Update: {
          annee_id?: string | null
          classe_id?: string | null
          created_at?: string
          id?: string
          montant?: number
          nom?: string
          periodicite?: Database["public"]["Enums"]["periodicite"]
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "frais_types_annee_id_fkey"
            columns: ["annee_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frais_types_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frais_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      matieres: {
        Row: {
          classe_id: string | null
          code: string | null
          coefficient: number
          created_at: string
          id: string
          nom: string
          school_id: string
        }
        Insert: {
          classe_id?: string | null
          code?: string | null
          coefficient?: number
          created_at?: string
          id?: string
          nom: string
          school_id: string
        }
        Update: {
          classe_id?: string | null
          code?: string | null
          coefficient?: number
          created_at?: string
          id?: string
          nom?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matieres_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matieres_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contenu: string
          created_at: string
          destinataire_id: string
          expediteur_id: string
          id: string
          lu: boolean
          school_id: string
        }
        Insert: {
          contenu: string
          created_at?: string
          destinataire_id: string
          expediteur_id: string
          id?: string
          lu?: boolean
          school_id: string
        }
        Update: {
          contenu?: string
          created_at?: string
          destinataire_id?: string
          expediteur_id?: string
          id?: string
          lu?: boolean
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_destinataire_id_fkey"
            columns: ["destinataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_expediteur_id_fkey"
            columns: ["expediteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          appreciation: string | null
          created_at: string
          date_saisie: string | null
          eleve_id: string
          id: string
          is_locked: boolean
          matiere_id: string
          moyenne: number | null
          note_compo: number | null
          note_ds1: number | null
          note_ds2: number | null
          periode_id: string
          saisie_par: string | null
        }
        Insert: {
          appreciation?: string | null
          created_at?: string
          date_saisie?: string | null
          eleve_id: string
          id?: string
          is_locked?: boolean
          matiere_id: string
          moyenne?: number | null
          note_compo?: number | null
          note_ds1?: number | null
          note_ds2?: number | null
          periode_id: string
          saisie_par?: string | null
        }
        Update: {
          appreciation?: string | null
          created_at?: string
          date_saisie?: string | null
          eleve_id?: string
          id?: string
          is_locked?: boolean
          matiere_id?: string
          moyenne?: number | null
          note_compo?: number | null
          note_ds1?: number | null
          note_ds2?: number | null
          periode_id?: string
          saisie_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_saisie_par_fkey"
            columns: ["saisie_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lien: string | null
          lu: boolean
          message: string
          school_id: string
          titre: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lien?: string | null
          lu?: boolean
          message: string
          school_id: string
          titre: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lien?: string | null
          lu?: boolean
          message?: string
          school_id?: string
          titre?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          created_at: string
          date_paiement: string
          eleve_id: string
          enregistre_par: string | null
          frais_type_id: string
          id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"]
          montant_paye: number
          recu_numero: string | null
          recu_url: string | null
          reference: string | null
          school_id: string
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          eleve_id: string
          enregistre_par?: string | null
          frais_type_id: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant_paye: number
          recu_numero?: string | null
          recu_url?: string | null
          reference?: string | null
          school_id: string
        }
        Update: {
          created_at?: string
          date_paiement?: string
          eleve_id?: string
          enregistre_par?: string | null
          frais_type_id?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"]
          montant_paye?: number
          recu_numero?: string | null
          recu_url?: string | null
          reference?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_enregistre_par_fkey"
            columns: ["enregistre_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_frais_type_id_fkey"
            columns: ["frais_type_id"]
            isOneToOne: false
            referencedRelation: "frais_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parents_eleves: {
        Row: {
          eleve_id: string
          id: string
          parent_id: string
        }
        Insert: {
          eleve_id: string
          id?: string
          parent_id: string
        }
        Update: {
          eleve_id?: string
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_eleves_eleve_id_fkey"
            columns: ["eleve_id"]
            isOneToOne: false
            referencedRelation: "eleves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parents_eleves_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      periodes: {
        Row: {
          annee_id: string
          created_at: string
          date_debut: string
          date_fin: string
          id: string
          libelle: string
          school_id: string
        }
        Insert: {
          annee_id: string
          created_at?: string
          date_debut: string
          date_fin: string
          id?: string
          libelle: string
          school_id: string
        }
        Update: {
          annee_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string
          id?: string
          libelle?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodes_annee_id_fkey"
            columns: ["annee_id"]
            isOneToOne: false
            referencedRelation: "annees_scolaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          nom: string
          photo_url: string | null
          prenom: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          telephone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          nom: string
          photo_url?: string | null
          prenom: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          telephone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          nom?: string
          photo_url?: string | null
          prenom?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ressources: {
        Row: {
          auteur_id: string
          classe_id: string | null
          created_at: string
          fichier_url: string
          id: string
          matiere_id: string | null
          school_id: string
          titre: string
        }
        Insert: {
          auteur_id: string
          classe_id?: string | null
          created_at?: string
          fichier_url: string
          id?: string
          matiere_id?: string | null
          school_id: string
          titre: string
        }
        Update: {
          auteur_id?: string
          classe_id?: string | null
          created_at?: string
          fichier_url?: string
          id?: string
          matiere_id?: string | null
          school_id?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "ressources_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ressources_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ressources_matiere_id_fkey"
            columns: ["matiere_id"]
            isOneToOne: false
            referencedRelation: "matieres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ressources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          adresse: string | null
          code_unique: string
          created_at: string
          date_expiration_abonnement: string | null
          date_inscription: string
          email: string
          id: string
          logo_url: string | null
          nom: string
          plan: Database["public"]["Enums"]["school_plan"]
          statut: Database["public"]["Enums"]["school_status"]
          telephone: string | null
          type: string
          ville: string
        }
        Insert: {
          adresse?: string | null
          code_unique: string
          created_at?: string
          date_expiration_abonnement?: string | null
          date_inscription?: string
          email: string
          id?: string
          logo_url?: string | null
          nom: string
          plan?: Database["public"]["Enums"]["school_plan"]
          statut?: Database["public"]["Enums"]["school_status"]
          telephone?: string | null
          type: string
          ville: string
        }
        Update: {
          adresse?: string | null
          code_unique?: string
          created_at?: string
          date_expiration_abonnement?: string | null
          date_inscription?: string
          email?: string
          id?: string
          logo_url?: string | null
          nom?: string
          plan?: Database["public"]["Enums"]["school_plan"]
          statut?: Database["public"]["Enums"]["school_status"]
          telephone?: string | null
          type?: string
          ville?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      absence_status: "present" | "absent" | "retard" | "excuse"
      app_role:
        | "superadmin"
        | "admin"
        | "enseignant"
        | "parent"
        | "etudiant"
        | "comptable"
      inscription_status: "en_attente" | "valide" | "refuse"
      jour_semaine: "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi"
      mode_paiement: "especes" | "mtn_money" | "moov_money" | "virement"
      periodicite: "unique" | "mensuel" | "trimestriel"
      school_plan: "basique" | "pro" | "premium"
      school_status: "en_attente" | "actif" | "suspendu"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      absence_status: ["present", "absent", "retard", "excuse"],
      app_role: [
        "superadmin",
        "admin",
        "enseignant",
        "parent",
        "etudiant",
        "comptable",
      ],
      inscription_status: ["en_attente", "valide", "refuse"],
      jour_semaine: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"],
      mode_paiement: ["especes", "mtn_money", "moov_money", "virement"],
      periodicite: ["unique", "mensuel", "trimestriel"],
      school_plan: ["basique", "pro", "premium"],
      school_status: ["en_attente", "actif", "suspendu"],
    },
  },
} as const
