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
import { Plus, Save, Lock, FileText, Download } from "lucide-react";
import { generateBulletin } from "@/lib/generateBulletin";

export default function AdminNotes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("saisie");
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [notesData, setNotesData] = useState<Record<string, { ds1: string; ds2: string; compo: string; appreciation: string }>>({});
  const [periodeOpen, setPeriodeOpen] = useState(false);
  const [matiereOpen, setMatiereOpen] = useState(false);
  const [periodeForm, setPeriodeForm] = useState({ libelle: "", date_debut: "", date_fin: "" });
  const [matiereForm, setMatiereForm] = useState({ nom: "", code: "", coefficient: "1", classe_id: "" });
  const [bulletinPeriode, setBulletinPeriode] = useState("");
  const [bulletinClasse, setBulletinClasse] = useState("");

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

  const { data: periodes } = useQuery({
    queryKey: ["periodes", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("periodes").select("*").eq("school_id", schoolId!).order("date_debut");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: matieres } = useQuery({
    queryKey: ["matieres", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("matieres").select("*, classes(nom)").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: eleves } = useQuery({
    queryKey: ["eleves-classe", selectedClasse],
    queryFn: async () => {
      const { data } = await supabase.from("eleves").select("*").eq("classe_id", selectedClasse).eq("statut_inscription", "valide").order("nom");
      return data || [];
    },
    enabled: !!selectedClasse,
  });

  const { data: existingNotes } = useQuery({
    queryKey: ["notes", selectedClasse, selectedMatiere, selectedPeriode],
    queryFn: async () => {
      const eleveIds = eleves?.map(e => e.id) || [];
      if (eleveIds.length === 0) return [];
      const { data } = await supabase.from("notes").select("*").eq("matiere_id", selectedMatiere).eq("periode_id", selectedPeriode).in("eleve_id", eleveIds);
      return data || [];
    },
    enabled: !!selectedMatiere && !!selectedPeriode && (eleves?.length || 0) > 0,
  });

  const { data: bulletins } = useQuery({
    queryKey: ["bulletins", bulletinClasse, bulletinPeriode],
    queryFn: async () => {
      const eleveIds = (await supabase.from("eleves").select("id").eq("classe_id", bulletinClasse).eq("statut_inscription", "valide")).data?.map(e => e.id) || [];
      if (eleveIds.length === 0) return [];
      const { data } = await supabase.from("bulletins").select("*, eleves(id, prenom, nom, matricule, classe_id, classes(nom))").eq("periode_id", bulletinPeriode).in("eleve_id", eleveIds).order("rang");
      return data || [];
    },
    enabled: !!bulletinClasse && !!bulletinPeriode,
  });

  useState(() => {
    if (existingNotes && eleves) {
      const init: Record<string, any> = {};
      eleves.forEach(e => {
        const note = existingNotes.find(n => n.eleve_id === e.id);
        init[e.id] = {
          ds1: note?.note_ds1?.toString() || "",
          ds2: note?.note_ds2?.toString() || "",
          compo: note?.note_compo?.toString() || "",
          appreciation: note?.appreciation || "",
        };
      });
      setNotesData(init);
    }
  });

  const createPeriode = useMutation({
    mutationFn: async () => {
      if (!activeAnnee) throw new Error("Aucune année scolaire active");
      const { error } = await supabase.from("periodes").insert({
        school_id: schoolId!, annee_id: activeAnnee.id,
        libelle: periodeForm.libelle, date_debut: periodeForm.date_debut, date_fin: periodeForm.date_fin,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["periodes"] }); setPeriodeOpen(false); setPeriodeForm({ libelle: "", date_debut: "", date_fin: "" }); toast({ title: "Période créée" }); },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const createMatiere = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("matieres").insert({
        school_id: schoolId!, nom: matiereForm.nom, code: matiereForm.code || null,
        coefficient: parseFloat(matiereForm.coefficient), classe_id: matiereForm.classe_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["matieres"] }); setMatiereOpen(false); setMatiereForm({ nom: "", code: "", coefficient: "1", classe_id: "" }); toast({ title: "Matière créée" }); },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      if (!eleves) return;
      for (const eleve of eleves) {
        const n = notesData[eleve.id];
        if (!n) continue;
        const ds1 = n.ds1 ? parseFloat(n.ds1) : null;
        const ds2 = n.ds2 ? parseFloat(n.ds2) : null;
        const compo = n.compo ? parseFloat(n.compo) : null;
        const values = [ds1, ds2, compo].filter(v => v !== null) as number[];
        const moyenne = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
        const existing = existingNotes?.find(ex => ex.eleve_id === eleve.id);
        if (existing) {
          await supabase.from("notes").update({ note_ds1: ds1, note_ds2: ds2, note_compo: compo, moyenne, appreciation: n.appreciation || null, saisie_par: profile!.id, date_saisie: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await supabase.from("notes").insert({ eleve_id: eleve.id, matiere_id: selectedMatiere, periode_id: selectedPeriode, note_ds1: ds1, note_ds2: ds2, note_compo: compo, moyenne, appreciation: n.appreciation || null, saisie_par: profile!.id });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notes"] }); toast({ title: "Notes enregistrées avec succès" }); },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const generateBulletins = useMutation({
    mutationFn: async () => {
      if (!bulletinClasse || !bulletinPeriode) throw new Error("Sélectionnez classe et période");
      const { data: elevesData } = await supabase.from("eleves").select("id").eq("classe_id", bulletinClasse).eq("statut_inscription", "valide");
      if (!elevesData?.length) throw new Error("Aucun élève dans cette classe");
      const studentAverages: { eleveId: string; moyenne: number }[] = [];
      for (const eleve of elevesData) {
        const { data: notes } = await supabase.from("notes").select("*, matieres(coefficient)").eq("eleve_id", eleve.id).eq("periode_id", bulletinPeriode);
        if (!notes?.length) { studentAverages.push({ eleveId: eleve.id, moyenne: 0 }); continue; }
        let totalCoeff = 0, totalWeighted = 0;
        notes.forEach(n => { if (n.moyenne !== null) { const coeff = (n as any).matieres?.coefficient || 1; totalWeighted += n.moyenne * coeff; totalCoeff += coeff; } });
        studentAverages.push({ eleveId: eleve.id, moyenne: totalCoeff > 0 ? totalWeighted / totalCoeff : 0 });
      }
      studentAverages.sort((a, b) => b.moyenne - a.moyenne);
      for (let i = 0; i < studentAverages.length; i++) {
        const sa = studentAverages[i];
        const rang = i + 1;
        const mention = sa.moyenne >= 16 ? "Très Bien" : sa.moyenne >= 14 ? "Bien" : sa.moyenne >= 12 ? "Assez Bien" : sa.moyenne >= 10 ? "Passable" : "Insuffisant";
        const existing = (await supabase.from("bulletins").select("id").eq("eleve_id", sa.eleveId).eq("periode_id", bulletinPeriode)).data;
        if (existing?.length) {
          await supabase.from("bulletins").update({ moyenne_generale: parseFloat(sa.moyenne.toFixed(2)), rang, mention }).eq("id", existing[0].id);
        } else {
          await supabase.from("bulletins").insert({ eleve_id: sa.eleveId, periode_id: bulletinPeriode, moyenne_generale: parseFloat(sa.moyenne.toFixed(2)), rang, mention });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulletins"] }); toast({ title: "Bulletins générés avec succès" }); },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const publishBulletins = useMutation({
    mutationFn: async () => {
      const ids = bulletins?.map(b => b.id) || [];
      for (const id of ids) { await supabase.from("bulletins").update({ is_published: true, published_at: new Date().toISOString() }).eq("id", id); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["bulletins"] }); toast({ title: "Bulletins publiés — visibles par les parents et élèves" }); },
  });

  const handleBulletinPDF = async (bulletin: any) => {
    const { data: notes } = await supabase.from("notes").select("*, matieres(nom, coefficient)").eq("eleve_id", bulletin.eleves?.id || bulletin.eleve_id).eq("periode_id", bulletinPeriode);
    const periode = periodes?.find(p => p.id === bulletinPeriode);
    const totalEleves = bulletins?.length || 1;
    generateBulletin({
      eleve_nom: bulletin.eleves?.nom || "",
      eleve_prenom: bulletin.eleves?.prenom || "",
      matricule: bulletin.eleves?.matricule || "",
      classe: bulletin.eleves?.classes?.nom || "",
      periode: periode?.libelle || "",
      annee_scolaire: activeAnnee?.libelle || "2025-2026",
      rang: bulletin.rang || 0,
      total_eleves: totalEleves,
      moyenne_generale: Number(bulletin.moyenne_generale) || 0,
      mention: bulletin.mention || "",
      school_nom: "École Test Bénin",
      school_ville: "Cotonou",
      matieres: (notes || []).map((n: any) => ({
        nom: n.matieres?.nom || "",
        coefficient: n.matieres?.coefficient || 1,
        note_ds1: n.note_ds1,
        note_ds2: n.note_ds2,
        note_compo: n.note_compo,
        moyenne: n.moyenne,
        appreciation: n.appreciation,
      })),
    });
  };

  const updateNoteField = (eleveId: string, field: string, value: string) => {
    setNotesData(prev => ({ ...prev, [eleveId]: { ...(prev[eleveId] || { ds1: "", ds2: "", compo: "", appreciation: "" }), [field]: value } }));
  };

  const getMention = (moyenne: number) => {
    if (moyenne >= 16) return <Badge className="bg-success/20 text-success">Très Bien</Badge>;
    if (moyenne >= 14) return <Badge className="bg-primary/20 text-primary">Bien</Badge>;
    if (moyenne >= 12) return <Badge className="bg-accent/20 text-accent-foreground">Assez Bien</Badge>;
    if (moyenne >= 10) return <Badge className="bg-warning/20 text-warning-foreground">Passable</Badge>;
    return <Badge className="bg-destructive/20 text-destructive">Insuffisant</Badge>;
  };

  const filteredMatieres = matieres?.filter(m => !selectedClasse || !m.classe_id || m.classe_id === selectedClasse) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Notes & Bulletins</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="saisie">Saisie des notes</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-sans">Périodes d'évaluation</CardTitle>
              <Dialog open={periodeOpen} onOpenChange={setPeriodeOpen}>
                <DialogTrigger asChild><Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-2" />Ajouter</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nouvelle période</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Libellé</Label><Input placeholder="Ex: Trimestre 1" value={periodeForm.libelle} onChange={e => setPeriodeForm(f => ({ ...f, libelle: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Date début</Label><Input type="date" value={periodeForm.date_debut} onChange={e => setPeriodeForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Date fin</Label><Input type="date" value={periodeForm.date_fin} onChange={e => setPeriodeForm(f => ({ ...f, date_fin: e.target.value }))} /></div>
                  </div>
                  <Button onClick={() => createPeriode.mutate()} disabled={!periodeForm.libelle || !periodeForm.date_debut || !periodeForm.date_fin || createPeriode.isPending} className="w-full">{createPeriode.isPending ? "Création..." : "Créer"}</Button>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Libellé</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead></TableRow></TableHeader>
                <TableBody>
                  {periodes?.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Aucune période</TableCell></TableRow>
                  : periodes?.map(p => <TableRow key={p.id}><TableCell className="font-medium">{p.libelle}</TableCell><TableCell>{p.date_debut}</TableCell><TableCell>{p.date_fin}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-sans">Matières & Coefficients</CardTitle>
              <Dialog open={matiereOpen} onOpenChange={setMatiereOpen}>
                <DialogTrigger asChild><Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-2" />Ajouter</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nouvelle matière</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nom</Label><Input placeholder="Ex: Mathématiques" value={matiereForm.nom} onChange={e => setMatiereForm(f => ({ ...f, nom: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Code</Label><Input placeholder="Ex: MATH" value={matiereForm.code} onChange={e => setMatiereForm(f => ({ ...f, code: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Coefficient</Label><Input type="number" min="1" value={matiereForm.coefficient} onChange={e => setMatiereForm(f => ({ ...f, coefficient: e.target.value }))} /></div>
                    <div className="space-y-2">
                      <Label>Classe (optionnel)</Label>
                      <Select value={matiereForm.classe_id} onValueChange={v => setMatiereForm(f => ({ ...f, classe_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Toutes les classes" /></SelectTrigger>
                        <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={() => createMatiere.mutate()} disabled={!matiereForm.nom || createMatiere.isPending} className="w-full">{createMatiere.isPending ? "Création..." : "Créer"}</Button>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Matière</TableHead><TableHead>Code</TableHead><TableHead>Coefficient</TableHead><TableHead>Classe</TableHead></TableRow></TableHeader>
                <TableBody>
                  {matieres?.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucune matière</TableCell></TableRow>
                  : matieres?.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nom}</TableCell>
                      <TableCell>{m.code || "—"}</TableCell>
                      <TableCell>{m.coefficient}</TableCell>
                      <TableCell>{(m as any).classes?.nom || "Toutes"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saisie" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-sans">Sélectionner classe, matière et période</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={selectedClasse} onValueChange={v => { setSelectedClasse(v); setSelectedMatiere(""); }}>
                    <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                    <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Matière</Label>
                  <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
                    <SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
                    <SelectContent>{filteredMatieres.map(m => <SelectItem key={m.id} value={m.id}>{m.nom} (coeff. {m.coefficient})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                    <SelectTrigger><SelectValue placeholder="Choisir une période" /></SelectTrigger>
                    <SelectContent>{periodes?.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedClasse && selectedMatiere && selectedPeriode && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-sans">Saisie des notes</CardTitle>
                <Button variant="hero" onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending}>
                  <Save className="w-4 h-4 mr-2" />{saveNotes.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </CardHeader>
              <CardContent>
                {!eleves?.length ? <p className="text-muted-foreground">Aucun élève validé dans cette classe.</p> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Élève</TableHead>
                          <TableHead className="w-20">DS1 /20</TableHead>
                          <TableHead className="w-20">DS2 /20</TableHead>
                          <TableHead className="w-20">Compo /20</TableHead>
                          <TableHead className="w-20">Moyenne</TableHead>
                          <TableHead className="min-w-[150px]">Appréciation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eleves.map(e => {
                          const n = notesData[e.id] || { ds1: "", ds2: "", compo: "", appreciation: "" };
                          const vals = [n.ds1, n.ds2, n.compo].filter(v => v !== "").map(Number);
                          const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—";
                          return (
                            <TableRow key={e.id}>
                              <TableCell className="font-medium">{e.prenom} {e.nom}</TableCell>
                              <TableCell><Input type="number" min="0" max="20" step="0.25" className="w-20 h-8" value={n.ds1} onChange={ev => updateNoteField(e.id, "ds1", ev.target.value)} /></TableCell>
                              <TableCell><Input type="number" min="0" max="20" step="0.25" className="w-20 h-8" value={n.ds2} onChange={ev => updateNoteField(e.id, "ds2", ev.target.value)} /></TableCell>
                              <TableCell><Input type="number" min="0" max="20" step="0.25" className="w-20 h-8" value={n.compo} onChange={ev => updateNoteField(e.id, "compo", ev.target.value)} /></TableCell>
                              <TableCell className="font-bold">{avg}</TableCell>
                              <TableCell><Input className="h-8" placeholder="Appréciation..." value={n.appreciation} onChange={ev => updateNoteField(e.id, "appreciation", ev.target.value)} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulletins" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="font-sans">Génération des bulletins</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={bulletinClasse} onValueChange={setBulletinClasse}>
                    <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                    <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={bulletinPeriode} onValueChange={setBulletinPeriode}>
                    <SelectTrigger><SelectValue placeholder="Choisir une période" /></SelectTrigger>
                    <SelectContent>{periodes?.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="hero" onClick={() => generateBulletins.mutate()} disabled={!bulletinClasse || !bulletinPeriode || generateBulletins.isPending}>
                  <FileText className="w-4 h-4 mr-2" />{generateBulletins.isPending ? "Calcul en cours..." : "Générer les bulletins"}
                </Button>
                {bulletins && bulletins.length > 0 && !bulletins[0].is_published && (
                  <Button variant="outline" onClick={() => publishBulletins.mutate()} disabled={publishBulletins.isPending}>
                    <Lock className="w-4 h-4 mr-2" />Publier
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {bulletins && bulletins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">
                  Résultats
                  {bulletins[0]?.is_published && <Badge className="ml-2 bg-success/20 text-success">Publié</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rang</TableHead>
                      <TableHead>Élève</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Moyenne</TableHead>
                      <TableHead>Mention</TableHead>
                      <TableHead>PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulletins.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-bold">{b.rang}e</TableCell>
                        <TableCell className="font-medium">{(b as any).eleves?.prenom} {(b as any).eleves?.nom}</TableCell>
                        <TableCell className="font-mono text-sm">{(b as any).eleves?.matricule}</TableCell>
                        <TableCell className="font-bold">{b.moyenne_generale?.toFixed(2)}/20</TableCell>
                        <TableCell>{b.moyenne_generale ? getMention(Number(b.moyenne_generale)) : "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleBulletinPDF(b)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
