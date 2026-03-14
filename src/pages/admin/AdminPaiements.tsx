import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, CreditCard, Receipt, TrendingUp } from "lucide-react";
import { generateRecu } from "@/lib/generateRecu";

export default function AdminPaiements() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("enregistrer");
  const [fraisOpen, setFraisOpen] = useState(false);
  const [paiementOpen, setPaiementOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClasse, setFilterClasse] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");

  const [fraisForm, setFraisForm] = useState({ nom: "", montant: "", classe_id: "", periodicite: "unique" as const });
  const [paiementForm, setPaiementForm] = useState({ eleve_id: "", frais_type_id: "", montant_paye: "", mode_paiement: "especes" as const, reference: "" });
  const [eleveSearch, setEleveSearch] = useState("");

  const schoolId = profile?.school_id;

  const { data: activeAnnee } = useQuery({
    queryKey: ["active-annee", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("annees_scolaires").select("*").eq("school_id", schoolId!).eq("is_active", true).single();
      return data;
    },
    enabled: !!schoolId,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: fraisTypes } = useQuery({
    queryKey: ["frais-types", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("frais_types").select("*, classes(nom)").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: eleves } = useQuery({
    queryKey: ["eleves", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("eleves").select("*, classes(nom)").eq("school_id", schoolId!).eq("statut_inscription", "valide").order("nom");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: paiements } = useQuery({
    queryKey: ["paiements", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("paiements").select("*, eleves(prenom, nom, matricule, classe_id, classes(nom)), frais_types(nom, montant)").eq("school_id", schoolId!).order("date_paiement", { ascending: false });
      return data || [];
    },
    enabled: !!schoolId,
  });

  const createFrais = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("frais_types").insert({
        school_id: schoolId!,
        nom: fraisForm.nom,
        montant: parseFloat(fraisForm.montant),
        classe_id: fraisForm.classe_id || null,
        periodicite: fraisForm.periodicite as any,
        annee_id: activeAnnee?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frais-types"] });
      setFraisOpen(false);
      setFraisForm({ nom: "", montant: "", classe_id: "", periodicite: "unique" });
      toast({ title: "Type de frais créé" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
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
      queryClient.invalidateQueries({ queryKey: ["paiements"] });
      setPaiementOpen(false);
      setPaiementForm({ eleve_id: "", frais_type_id: "", montant_paye: "", mode_paiement: "especes", reference: "" });
      toast({ title: "Paiement enregistré avec succès" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const studentSummaries = eleves?.map(eleve => {
    const applicableFrais = fraisTypes?.filter(f => !f.classe_id || f.classe_id === eleve.classe_id) || [];
    const totalDu = applicableFrais.reduce((s, f) => s + Number(f.montant), 0);
    const totalPaye = paiements?.filter(p => p.eleve_id === eleve.id).reduce((s, p) => s + Number(p.montant_paye), 0) || 0;
    const reste = totalDu - totalPaye;
    const statut = reste <= 0 ? "solde" : totalPaye > 0 ? "partiel" : "impaye";
    return { ...eleve, totalDu, totalPaye, reste, statut };
  }) || [];

  const filteredSummaries = studentSummaries.filter(s => {
    const matchSearch = `${s.prenom} ${s.nom} ${s.matricule}`.toLowerCase().includes(search.toLowerCase());
    const matchClasse = filterClasse === "all" || s.classe_id === filterClasse;
    const matchStatut = filterStatut === "all" || s.statut === filterStatut;
    return matchSearch && matchClasse && matchStatut;
  });

  const totalEncaisse = paiements?.reduce((s, p) => s + Number(p.montant_paye), 0) || 0;
  const totalAttendu = studentSummaries.reduce((s, e) => s + e.totalDu, 0);
  const tauxRecouvrement = totalAttendu > 0 ? ((totalEncaisse / totalAttendu) * 100).toFixed(1) : "0";

  const filteredElevesSearch = eleves?.filter(e => `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(eleveSearch.toLowerCase())) || [];

  const statutBadge = (s: string) => {
    if (s === "solde") return <Badge className="bg-success/20 text-success">Soldé</Badge>;
    if (s === "partiel") return <Badge className="bg-warning/20 text-warning-foreground">Partiel</Badge>;
    return <Badge className="bg-destructive/20 text-destructive">Impayé</Badge>;
  };

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
      <h1 className="text-2xl font-bold text-foreground">Paiements & Frais scolaires</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-sans">Total encaissé</CardTitle>
            <CreditCard className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground font-sans">{totalEncaisse.toLocaleString("fr-FR")} FCFA</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-sans">Total attendu</CardTitle>
            <Receipt className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground font-sans">{totalAttendu.toLocaleString("fr-FR")} FCFA</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-sans">Taux recouvrement</CardTitle>
            <TrendingUp className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-foreground font-sans">{tauxRecouvrement}%</p></CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="suivi">Suivi des paiements</TabsTrigger>
          <TabsTrigger value="enregistrer">Enregistrer un paiement</TabsTrigger>
          <TabsTrigger value="frais">Configuration des frais</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* SUIVI TAB */}
        <TabsContent value="suivi" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterClasse} onValueChange={setFilterClasse}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Classe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les classes</SelectItem>
                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="solde">Soldé</SelectItem>
                    <SelectItem value="partiel">Partiel</SelectItem>
                    <SelectItem value="impaye">Impayé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="text-right">Montant dû</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun élève</TableCell></TableRow>
                  ) : filteredSummaries.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.prenom} {s.nom}</TableCell>
                      <TableCell>{(s as any).classes?.nom || "—"}</TableCell>
                      <TableCell className="text-right">{s.totalDu.toLocaleString("fr-FR")}</TableCell>
                      <TableCell className="text-right">{s.totalPaye.toLocaleString("fr-FR")}</TableCell>
                      <TableCell className="text-right font-bold">{s.reste.toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{statutBadge(s.statut)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENREGISTRER TAB */}
        <TabsContent value="enregistrer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Nouveau paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rechercher l'élève</Label>
                <Input placeholder="Nom ou matricule..." value={eleveSearch} onChange={e => setEleveSearch(e.target.value)} />
                {eleveSearch && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredElevesSearch.slice(0, 10).map(e => (
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
                  <Label>Montant payé (FCFA)</Label>
                  <Input type="number" value={paiementForm.montant_paye} onChange={e => setPaiementForm(f => ({ ...f, montant_paye: e.target.value }))} />
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
                  <Input placeholder="Optionnel" value={paiementForm.reference} onChange={e => setPaiementForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
              </div>
              <Button variant="hero" onClick={() => createPaiement.mutate()} disabled={!paiementForm.eleve_id || !paiementForm.frais_type_id || !paiementForm.montant_paye || createPaiement.isPending} className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />{createPaiement.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FRAIS TAB */}
        <TabsContent value="frais" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-sans">Types de frais</CardTitle>
              <Dialog open={fraisOpen} onOpenChange={setFraisOpen}>
                <DialogTrigger asChild><Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-2" />Nouveau frais</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Configurer un frais</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nom du frais</Label><Input placeholder="Ex: Frais inscription" value={fraisForm.nom} onChange={e => setFraisForm(f => ({ ...f, nom: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Montant (FCFA)</Label><Input type="number" value={fraisForm.montant} onChange={e => setFraisForm(f => ({ ...f, montant: e.target.value }))} /></div>
                    <div className="space-y-2">
                      <Label>Classe (optionnel)</Label>
                      <Select value={fraisForm.classe_id} onValueChange={v => setFraisForm(f => ({ ...f, classe_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Toutes les classes" /></SelectTrigger>
                        <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Périodicité</Label>
                      <Select value={fraisForm.periodicite} onValueChange={v => setFraisForm(f => ({ ...f, periodicite: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unique">Unique</SelectItem>
                          <SelectItem value="mensuel">Mensuel</SelectItem>
                          <SelectItem value="trimestriel">Trimestriel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={() => createFrais.mutate()} disabled={!fraisForm.nom || !fraisForm.montant || createFrais.isPending} className="w-full">
                    {createFrais.isPending ? "Création..." : "Créer"}
                  </Button>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Montant (FCFA)</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Périodicité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fraisTypes?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucun frais configuré</TableCell></TableRow>
                  ) : fraisTypes?.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nom}</TableCell>
                      <TableCell>{Number(f.montant).toLocaleString("fr-FR")}</TableCell>
                      <TableCell>{(f as any).classes?.nom || "Toutes"}</TableCell>
                      <TableCell><Badge variant="outline">{f.periodicite === "unique" ? "Unique" : f.periodicite === "mensuel" ? "Mensuel" : "Trimestriel"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORIQUE TAB */}
        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-sans">Historique des paiements</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>N° Reçu</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Type frais</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reçu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements?.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Aucun paiement</TableCell></TableRow>
                  ) : paiements?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="font-mono text-sm">{p.recu_numero || "—"}</TableCell>
                      <TableCell className="font-medium">{(p as any).eleves?.prenom} {(p as any).eleves?.nom}</TableCell>
                      <TableCell>{(p as any).frais_types?.nom}</TableCell>
                      <TableCell className="text-right font-bold">{Number(p.montant_paye).toLocaleString("fr-FR")} FCFA</TableCell>
                      <TableCell>{modeBadge(p.mode_paiement)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleRecu(p)}>
                          <Receipt className="w-4 h-4" />
                        </Button>
                      </TableCell>
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
