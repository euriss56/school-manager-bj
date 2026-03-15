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
  const [paiementForm, setPaiementForm] = useState({ eleve_id: "", frais_type_id: "", montant_paye: "", mode_paiement: "especes" as const, reference: "" });
  const schoolId = profile?.school_id;

  const { data: school } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: async () => { const { data } = await supabase.from("schools").select("*").eq("id", schoolId!).single(); return data; },
    enabled: !!schoolId,
  });

  const { data: eleves } = useQuery({
    queryKey: ["eleves-comptable", schoolId],
    queryFn: async () => { const { data } = await supabase.from("eleves").select("*, classes(nom)").eq("school_id", schoolId!).eq("statut_inscription", "valide").order("nom"); return data || []; },
    enabled: !!schoolId,
  });

  const { data: fraisTypes } = useQuery({
    queryKey: ["frais-types-comptable", schoolId],
    queryFn: async () => { const { data } = await supabase.from("frais_types").select("*").eq("school_id", schoolId!); return data || []; },
    enabled: !!schoolId,
  });

  const { data: paiements } = useQuery({
    queryKey: ["paiements-liste-comptable", schoolId],
    queryFn: async () => { const { data } = await supabase.from("paiements").select("*, eleves(prenom, nom, matricule, classes(nom)), frais_types(nom, montant)").eq("school_id", schoolId!).order("date_paiement", { ascending: false }); return data || []; },
    enabled: !!schoolId,
  });

  const createPaiement = useMutation({
    mutationFn: async () => {
      const recuNum = `REC-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("paiements").insert({ school_id: schoolId!, eleve_id: paiementForm.eleve_id, frais_type_id: paiementForm.frais_type_id, montant_paye: parseFloat(paiementForm.montant_paye), mode_paiement: paiementForm.mode_paiement as any, reference: paiementForm.reference || null, recu_numero: recuNum, enregistre_par: profile!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paiements-liste-comptable"] });
      queryClient.invalidateQueries({ queryKey: ["paiements-comptable"] });
      setPaiementForm({ eleve_id: "", frais_type_id: "", montant_paye: "", mode_paiement: "especes", reference: "" });
      setEleveSearch("");
      toast({ title: "Paiement enregistre avec succes !" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const handleMobilePaiement = async () => {
    if (!paiementForm.eleve_id || !paiementForm.frais_type_id || !paiementForm.montant_paye) {
      toast({ variant: "destructive", title: "Erreur", description: "Remplissez tous les champs" });
      return;
    }
    if (!school?.fedapay_public_key) {
      toast({ variant: "destructive", title: "FedaPay non configure", description: "Ajoutez vos cles FedaPay dans Parametres" });
      return;
    }
    setLoadingFeda(true);
    try {
      const eleve = eleves?.find(e => e.id === paiementForm.eleve_id);
      const frais = fraisTypes?.find(f => f.id === paiementForm.frais_type_id);
      const result = await createFedaPayTransaction(school.fedapay_public_key, school.fedapay_mode || "sandbox", {
        amount: parseFloat(paiementForm.montant_paye),
        description: `${frais?.nom || "Frais"} - ${eleve?.prenom} ${eleve?.nom}`,
        customer_name: `${eleve?.nom_pere || eleve?.prenom} ${eleve?.nom || ""}`,
        customer_email: eleve?.email_parent || "",
        customer_phone: eleve?.telephone_pere || eleve?.telephone_mere || "",
        callback_url: `${window.location.origin}/comptable/paiements`,
      });
      if (result?.url) {
        window.open(result.url, "_blank");
        toast({ title: "Redirection FedaPay", description: "Paiement via MTN/Moov/Celtis Money" });
      } else {
        toast({ variant: "destructive", title: "Erreur FedaPay", description: "Impossible de creer la transaction" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setLoadingFeda(false);
    }
  };

  const filteredEleves = eleves?.filter(e => `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(eleveSearch.toLowerCase())) || [];
  const filteredPaiements = paiements?.filter(p => `${(p as any).eleves?.prenom} ${(p as any).eleves?.nom}`.toLowerCase().includes(search.toLowerCase())) || [];
  const modeBadge = (m: string) => { const labels: Record<string, string> = { especes: "Especes", mtn_money: "MTN Money", moov_money: "Moov Money", virement: "Virement" }; return <Badge variant="outline">{labels[m] || m}</Badge>; };
  const handleRecu = (p: any) => { generateRecu({ recu_numero: p.recu_numero || "N/A", date_paiement: p.date_paiement, eleve_nom: p.eleves?.nom || "", eleve_prenom: p.eleves?.prenom || "", matricule: p.eleves?.matricule || "", classe: p.eleves?.classes?.nom || "", frais_nom: p.frais_types?.nom || "", montant_paye: Number(p.montant_paye), mode_paiement: p.mode_paiement, school_nom: school?.nom || "Ecole", school_ville: school?.ville || "", enregistre_par: profile?.prenom + " " + profile?.nom }); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Gestion des paiements</h1>
      {!school?.fedapay_public_key && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          Paiements mobiles non configures. Ajoutez vos cles FedaPay dans Parametres.
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="enregistrer">Enregistrer un paiement</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="enregistrer" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Nouveau paiement</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rechercher un eleve</Label>
                <Input placeholder="Nom ou matricule..." value={eleveSearch} onChange={e => setEleveSearch(e.target.value)} />
                {eleveSearch && !paiementForm.eleve_id && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredEleves.slice(0, 10).map(e => (
                      <button key={e.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm" onClick={() => { setPaiementForm(f => ({ ...f, eleve_id: e.id })); setEleveSearch(`${e.prenom} ${e.nom} (${e.matricule})`); }}>
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
                    <SelectContent>{fraisTypes?.map(f => <SelectItem key={f.id} value={f.id}>{f.nom} — {Number(f.montant).toLocaleString("fr-FR")} FCFA</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (FCFA)</Label>
                  <Input type="number" value={paiementForm.montant_paye} onChange={e => setPaiementForm(f => ({ ...f, montant_paye: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Mode de paiement</Label>
                  <Select value={paiementForm.mode_paiement} onValueChange={v => setPaiementForm(f => ({ ...f, mode_paiement: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="especes">Especes</SelectItem>
                      <SelectItem value="mtn_money">MTN Money</SelectItem>
                      <SelectItem value="moov_money">Moov Money</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input placeholder="Optionnel" value={paiementForm.reference} onChange={e => setPaiementForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => createPaiement.mutate()} disabled={!paiementForm.eleve_id || !paiementForm.frais_type_id || !paiementForm.montant_paye || createPaiement.isPending} className="flex-1">
                  <CreditCard className="w-4 h-4 mr-2" />{createPaiement.isPending ? "Enregistrement..." : "Paiement especes"}
                </Button>
                <Button onClick={handleMobilePaiement} disabled={!paiementForm.eleve_id || !paiementForm.frais_type_id || !paiementForm.montant_paye || loadingFeda} variant="outline" className="flex-1">
                  <Smartphone className="w-4 h-4 mr-2" />{loadingFeda ? "Connexion..." : "Mobile Money"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Rechercher un eleve..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>N Recu</TableHead>
                    <TableHead>Eleve</TableHead>
                    <TableHead>Type frais</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Recu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPaiements.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Aucun paiement</TableCell></TableRow>
                  ) : filteredPaiements.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-mono text-sm">{p.recu_numero || "—"}</TableCell>
                      <TableCell className="font-medium">{(p as any).eleves?.prenom} {(p as any).eleves?.nom}</TableCell>
                      <TableCell>{(p as any).frais_types?.nom}</TableCell>
                      <TableCell className="text-right font-bold">{Number(p.montant_paye).toLocaleString("fr-FR")} FCFA</TableCell>
                      <TableCell>{modeBadge(p.mode_paiement)}</TableCell>
                      <TableCell><Button size="sm" variant="outline" onClick={() => handleRecu(p)}><Receipt className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
