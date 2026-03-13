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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] as const;
const JOURS_LABELS: Record<string, string> = { lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi", jeudi: "Jeudi", vendredi: "Vendredi" };
const HEURES = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const CRENEAUX_DISPLAY = ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30"];

const COULEURS_MATIERES = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-red-100 border-red-300 text-red-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-teal-100 border-teal-300 text-teal-800",
];

export default function AdminEmploisDuTemps() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClasse, setSelectedClasse] = useState("");
  const [viewMode, setViewMode] = useState<"classe" | "enseignant">("classe");
  const [selectedEnseignant, setSelectedEnseignant] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ jour: "lundi", heure_debut: "08:00", heure_fin: "09:00", matiere_id: "", enseignant_id: "", salle: "" });
  const [conflicts, setConflicts] = useState<string[]>([]);

  const schoolId = profile?.school_id;

  const { data: classes } = useQuery({
    queryKey: ["classes", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: matieres } = useQuery({
    queryKey: ["matieres", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("matieres").select("*").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: enseignants } = useQuery({
    queryKey: ["enseignants", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("school_id", schoolId!).eq("role", "enseignant");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: emplois } = useQuery({
    queryKey: ["emplois", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("emplois_du_temps").select("*, matieres(nom), profiles:enseignant_id(prenom, nom), classes(nom)").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const filteredEmplois = emplois?.filter(e => {
    if (viewMode === "classe") return e.classe_id === selectedClasse;
    return e.enseignant_id === selectedEnseignant;
  }) || [];

  // Build color map for matieres
  const matiereColorMap: Record<string, string> = {};
  matieres?.forEach((m, i) => { matiereColorMap[m.id] = COULEURS_MATIERES[i % COULEURS_MATIERES.length]; });

  // Detect conflicts
  const detectConflicts = (jour: string, debut: string, fin: string, enseignantId: string) => {
    const found: string[] = [];
    emplois?.forEach(e => {
      if (e.jour === jour && e.enseignant_id === enseignantId) {
        if (debut < e.heure_fin && fin > e.heure_debut) {
          const enseignant = enseignants?.find(p => p.id === e.enseignant_id);
          found.push(`Conflit: ${enseignant?.prenom} ${enseignant?.nom} déjà occupé(e) le ${JOURS_LABELS[e.jour]} de ${e.heure_debut} à ${e.heure_fin}`);
        }
      }
    });
    return found;
  };

  const createCreneau = useMutation({
    mutationFn: async () => {
      const c = detectConflicts(addForm.jour, addForm.heure_debut, addForm.heure_fin, addForm.enseignant_id);
      if (c.length > 0) {
        setConflicts(c);
        throw new Error("Conflits détectés");
      }
      const { error } = await supabase.from("emplois_du_temps").insert({
        school_id: schoolId!,
        classe_id: selectedClasse,
        matiere_id: addForm.matiere_id,
        enseignant_id: addForm.enseignant_id || null,
        jour: addForm.jour as any,
        heure_debut: addForm.heure_debut,
        heure_fin: addForm.heure_fin,
        salle: addForm.salle || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emplois"] });
      setAddOpen(false);
      setConflicts([]);
      setAddForm({ jour: "lundi", heure_debut: "08:00", heure_fin: "09:00", matiere_id: "", enseignant_id: "", salle: "" });
      toast({ title: "Créneau ajouté" });
    },
    onError: (err: any) => {
      if (err.message !== "Conflits détectés") toast({ variant: "destructive", title: "Erreur", description: err.message });
    },
  });

  const deleteCreneau = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emplois_du_temps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emplois"] });
      toast({ title: "Créneau supprimé" });
    },
  });

  const getSlotForCell = (jour: string, heure: string) => {
    return filteredEmplois.filter(e => {
      return e.jour === jour && e.heure_debut <= heure && e.heure_fin > heure;
    });
  };

  const isSlotStart = (e: any, heure: string) => e.heure_debut === heure;

  const getSlotHeight = (debut: string, fin: string) => {
    const dh = parseInt(debut.split(":")[0]) * 60 + parseInt(debut.split(":")[1]);
    const fh = parseInt(fin.split(":")[0]) * 60 + parseInt(fin.split(":")[1]);
    return Math.max(1, Math.floor((fh - dh) / 60));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-foreground">Emplois du temps</h1>
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={v => setViewMode(v as any)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="classe">Vue par classe</SelectItem>
              <SelectItem value="enseignant">Vue par enseignant</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === "classe" ? (
            <Select value={selectedClasse} onValueChange={setSelectedClasse}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
              <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Select value={selectedEnseignant} onValueChange={setSelectedEnseignant}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger>
              <SelectContent>{enseignants?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
      </div>

      {(selectedClasse || selectedEnseignant) && (
        <>
          {viewMode === "classe" && (
            <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); setConflicts([]); }}>
              <DialogTrigger asChild><Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-2" />Ajouter un créneau</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouveau créneau</DialogTitle></DialogHeader>
                {conflicts.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 space-y-1">
                    {conflicts.map((c, i) => (
                      <p key={i} className="text-sm text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{c}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Jour</Label>
                      <Select value={addForm.jour} onValueChange={v => setAddForm(f => ({ ...f, jour: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{JOURS.map(j => <SelectItem key={j} value={j}>{JOURS_LABELS[j]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Salle</Label>
                      <Input placeholder="Ex: Salle 101" value={addForm.salle} onChange={e => setAddForm(f => ({ ...f, salle: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Heure début</Label>
                      <Select value={addForm.heure_debut} onValueChange={v => setAddForm(f => ({ ...f, heure_debut: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{HEURES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Heure fin</Label>
                      <Select value={addForm.heure_fin} onValueChange={v => setAddForm(f => ({ ...f, heure_fin: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{HEURES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Matière</Label>
                    <Select value={addForm.matiere_id} onValueChange={v => setAddForm(f => ({ ...f, matiere_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>{matieres?.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Enseignant</Label>
                    <Select value={addForm.enseignant_id} onValueChange={v => setAddForm(f => ({ ...f, enseignant_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>{enseignants?.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => createCreneau.mutate()} disabled={!addForm.matiere_id || createCreneau.isPending} className="w-full">
                  {createCreneau.isPending ? "Ajout..." : "Ajouter le créneau"}
                </Button>
              </DialogContent>
            </Dialog>
          )}

          {/* GRILLE EMPLOI DU TEMPS */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Header */}
                  <div className="grid grid-cols-6 gap-1 mb-1">
                    <div className="p-2 text-xs font-bold text-muted-foreground">Heure</div>
                    {JOURS.map(j => (
                      <div key={j} className="p-2 text-center text-xs font-bold text-foreground bg-muted rounded-md">{JOURS_LABELS[j]}</div>
                    ))}
                  </div>
                  {/* Rows */}
                  {CRENEAUX_DISPLAY.map(heure => (
                    <div key={heure} className="grid grid-cols-6 gap-1 mb-1" style={{ minHeight: "60px" }}>
                      <div className="p-2 text-xs text-muted-foreground font-mono flex items-start">{heure}</div>
                      {JOURS.map(jour => {
                        const slots = getSlotForCell(jour, heure);
                        return (
                          <div key={`${jour}-${heure}`} className="relative border border-border/30 rounded-sm min-h-[60px]">
                            {slots.filter(s => isSlotStart(s, heure)).map(slot => (
                              <div key={slot.id} className={`absolute inset-x-0 top-0 p-1.5 rounded-md border text-xs ${matiereColorMap[slot.matiere_id] || "bg-muted"} z-10`}
                                style={{ height: `${getSlotHeight(slot.heure_debut, slot.heure_fin) * 60}px` }}>
                                <div className="font-bold truncate">{(slot as any).matieres?.nom}</div>
                                <div className="truncate opacity-75">{(slot as any).profiles?.prenom} {(slot as any).profiles?.nom}</div>
                                {slot.salle && <div className="truncate opacity-60">{slot.salle}</div>}
                                <button onClick={() => deleteCreneau.mutate(slot.id)} className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity">
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Légende des matières</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matieres?.map((m, i) => (
                  <Badge key={m.id} className={`${COULEURS_MATIERES[i % COULEURS_MATIERES.length]} border`}>{m.nom}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedClasse && viewMode === "classe" && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Sélectionnez une classe pour afficher son emploi du temps.</CardContent></Card>
      )}
      {!selectedEnseignant && viewMode === "enseignant" && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Sélectionnez un enseignant pour afficher son emploi du temps.</CardContent></Card>
      )}
    </div>
  );
}
