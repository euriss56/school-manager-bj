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
import { CreditCard, Receipt, Search } from "lucide-react";
import { generateRecu } from "@/lib/generateRecu";

export default function ComptablePaiements() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("enregistrer");
  const [eleveSearch, setEleveSearch] = useState("");
  const [search, setSearch] = useState("");
  const [paiementForm, setPaiementForm] = useState({
    eleve_id: "",
    frais_type_id: "",
    montant_paye: "",
    mode_paiement: "especes" as const,
    reference: "",
  });

  const schoolId = profile?.school_id;

  const { data: eleves } = useQuery({
    queryKey: ["eleves-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("eleves")
        .select("*, classes(nom)")
        .eq("school_id", schoolId!)
        .eq("statut_inscription", "valide")
        .order("nom");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: fraisTypes } = useQuery({
    queryKey: ["frais-types-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("frais_types")
        .select("*")
        .eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: paiements } = useQuery({
    queryKey: ["paiements-liste-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("paiements")
        .select("*, eleves(prenom, nom, matricule, classes(nom)), frais_types(nom, montant)")
        .eq("school_id", schoolId!)
        .order("date_paiement", { ascending: false });
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

  const filteredEleves = eleves?.filter(e =>
    `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(eleveSearch.toLowerCase())
  ) || [];

  const filteredPaiements = paiements?.filter(p =>
    `${(p as any).eleves?.prenom} ${(p as any).eleves?.nom}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const modeBadge = (m: string) => {
    const labels: Record<string, string> = { especes: "Espèces", mtn_money: "MTN Money", moov_money: "Moov Money", virement: "Virement" };
    return <Badge variant="outline">{labels[m] || m}</Badge>;
  };

  const handleRecu = (p: any) => {
    generateRecu({
      recu_numero: p.recu_numero || "N/A",
      date_paiement: p.date_paiement,
      eleve_nom: p.eleves?.nom || "",
      eleve_prenom: p.eleves?.prenom || "",
      matricule: p.eleves?.matricule || "",
      classe: p.eleves?.classes?.nom || "",
      frais_nom: p.frais_types?.nom || "",
      montant_paye: Number(p.montant_paye),
      mode_paiement: p.mode_paiement,
      school_nom: "École Test Bénin",
      school_ville: "Cotonou",
      enregistre_par: profile?.prenom + " " + profile?.nom,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Gestion des paiements</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="enregistrer">Enregistrer un paiement</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* ENREGISTRER TAB */}
        <TabsContent value="enregistrer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rechercher l'élève</Label>
                <Input
                  placeholder="Nom ou matricule..."
                  value={eleveSearch}
                  onChange={e => setEleveSearch(e.target.value)}
                />
                {eleveSearch && !paiementForm.eleve_id && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredEleves.slice(0, 10).map(e => (
                      <button
                        key={e.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          setPaiementForm(f => ({ ...f, eleve_id: e.id }));
                          setEleveSearch(`${e.prenom} ${e.nom} (${e.matricule})`);
                        }}
                      >
                        {e.prenom} {e.nom} — <span className="font-mono">{e.matricule}</span> — {(e as any).classes?.nom || "Sans classe"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de frais</Label>
                  <Select value={paiementForm.frais_type_id} onValueChange={v => setPaiementForm(f => ({ ...f, frais_type_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>
                      {fraisTypes?.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nom} — {Number(f.montant).toLocaleString("fr-FR")} FCFA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Montant payé (FCFA)</Label>
                  <Input
                    type="number"
                    value={paiementForm.montant_paye}
                    onChange={e => setPaiementForm(f => ({ ...f, montant_paye: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={paiementForm.mode_paiement} onValueChange={v => setPaiementForm(f => ({ ...f, mode_paiement: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Espèces</SelectItem>
                      <SelectItem value="mtn_money">MTN Money</SelectItem>
                      <SelectItem value="moov_money">Moov Money</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Référence transaction</Label>
                  <Input
                    placeholder="Optionnel"
                    value={paiementForm.reference}
                    onChange={e => setPaiementForm(f => ({ ...f, reference: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={() => createPaiement.mutate()}
                disabled={!paiementForm.eleve_id || !paiementForm.frais_type_id || !paiementForm.montant_paye || createPaiement.isPending}
                className="w-full"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {createPaiement.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
