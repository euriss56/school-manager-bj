import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Receipt, Search, Smartphone } from "lucide-react";
import { generateRecu } from "@/lib/generateRecu";
import { createFedaPayTransaction } from "@/lib/fedapay";

export default function ComptablePaiements() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("enregistrer");
  const [eleveSearch, setEleveSearch] = useState("");
  const [search, setSearch] = useState("");
  const [loadingFeda, setLoadingFeda] = useState(false);
  const [paiementForm, setPaiementForm] = useState({
    eleve_id: "",
    frais_type_id: "",
    montant_paye: "",
    mode_paiement: "especes" as const,
    reference: "",
  });

  const schoolId = profile?.school_id;

  const { data: school } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("*").eq("id", schoolId!).single();
      return data;
    },
    enabled: !!schoolId,
  });

  const { data: eleves } = useQuery({
    queryKey: ["eleves-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("eleves").select("*, classes(nom)").eq("school_id", schoolId!).eq("statut_inscription", "valide").order("nom");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: fraisTypes } = useQuery({
    queryKey: ["frais-types-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("frais_types").select("*").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: paiements } = useQuery({
    queryKey: ["paiements-liste-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("paiements").select("*, eleves(prenom, nom, matricule, classes(nom)), frais_types(nom, montant)").eq("school_id", schoolId!).order("date_paiement", { ascending: false });
      return data || [];
    },
    enabled: !!schoolId,
  });

  const createPaiement = useMutation({
    mutationFn: async () => {
      const recuNum = `REC-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("paiements").insert({
        school_id: schoolId!,
        eleve_id: paiementForm.eleve_id,
        frais_type_id: paiementForm.frais_type_id,
        montant_paye: parseFloat(paiementForm.montant_paye),
        mode_paiement: paiementForm.mode_paiement as any,
        reference: paiementForm.reference || null,
        recu_numero: recuNum,
        enregistre_par: profile!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paiements-liste-comptable"] });
      queryClient.invalidateQueries({ queryKey: ["paiements-comptable"] });
      setPaiementForm({ eleve_id: "", frais_type_id: "", montant_paye: "", mode_paiement: "especes", reference: "" });
      setEleveSearch("");
      toast({ title: "Paiement enregistré avec succès !" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const handleMobilePaiement = async () => {
    if (!paiementForm.eleve_id || !paiementForm.frais_type_id || !paiementForm.montant_paye) {
      toast({ variant: "destructive", title: "Erreur", description: "Remplissez tous les champs obligatoires" });
      return;
    }
    if (!school?.fedapay_public_key) {
      toast({ variant: "destructive", title: "FedaPay non configuré", description: "Configurez vos
