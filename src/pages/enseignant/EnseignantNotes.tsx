import { useEffect, useState } from "react";
import { Home, BookOpen, ClipboardList, Calendar, MessageSquare, Upload, Save } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const sidebarItems = [
  { title: "Tableau de bord", url: "/enseignant", icon: Home },
  { title: "Mes classes", url: "/enseignant/classes", icon: BookOpen },
  { title: "Saisie des notes", url: "/enseignant/notes", icon: ClipboardList },
  { title: "Emploi du temps", url: "/enseignant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/enseignant/messagerie", icon: MessageSquare },
  { title: "Ressources", url: "/enseignant/ressources", icon: Upload },
];

export default function EnseignantNotes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [matieres, setMatieres] = useState<any[]>([]);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [notes, setNotes] = useState<Record<string, { ds1: string; ds2: string; compo: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: em } = await supabase
        .from("enseignant_matieres")
        .select("classe_id, matiere_id, matieres(id, nom), classes(id, nom)")
        .eq("enseignant_id", profile.id);

      const uniqueClasses = new Map();
      const matieresMap = new Map<string, any[]>();
      (em || []).forEach((e: any) => {
        if (e.classes) uniqueClasses.set(e.classes.id, e.classes);
        if (e.classe_id && e.matieres) {
          const arr = matieresMap.get(e.classe_id) || [];
          arr.push(e.matieres);
          matieresMap.set(e.classe_id, arr);
        }
      });
      setClasses([...uniqueClasses.values()]);

      if (profile.school_id) {
        const { data: per } = await supabase
          .from("periodes")
          .select("*")
          .eq("school_id", profile.school_id)
          .order("date_debut");
        setPeriodes(per || []);
      }
    };
    load();
  }, [profile]);

  useEffect(() => {
    if (!selectedClasse || !profile) return;
    const load = async () => {
      const { data: em } = await supabase
        .from("enseignant_matieres")
        .select("matiere_id, matieres(id, nom)")
        .eq("enseignant_id", profile.id)
        .eq("classe_id", selectedClasse);
      setMatieres((em || []).map((e: any) => e.matieres).filter(Boolean));
    };
    load();
  }, [selectedClasse, profile]);

  useEffect(() => {
    if (!selectedClasse || !selectedMatiere || !selectedPeriode) return;
    const load = async () => {
      const { data: els } = await supabase
        .from("eleves")
        .select("id, nom, prenom, matricule")
        .eq("classe_id", selectedClasse)
        .eq("statut_inscription", "valide")
        .order("nom");
      setEleves(els || []);

      // Load existing notes
      const { data: existingNotes } = await supabase
        .from("notes")
        .select("*")
        .eq("matiere_id", selectedMatiere)
        .eq("periode_id", selectedPeriode)
        .in("eleve_id", (els || []).map(e => e.id));

      const notesMap: Record<string, { ds1: string; ds2: string; compo: string }> = {};
      (els || []).forEach(e => {
        const n = (existingNotes || []).find(n => n.eleve_id === e.id);
        notesMap[e.id] = {
          ds1: n?.note_ds1?.toString() || "",
          ds2: n?.note_ds2?.toString() || "",
          compo: n?.note_compo?.toString() || "",
        };
      });
      setNotes(notesMap);
    };
    load();
  }, [selectedClasse, selectedMatiere, selectedPeriode]);

  const updateNote = (eleveId: string, field: "ds1" | "ds2" | "compo", value: string) => {
    setNotes(prev => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], [field]: value },
    }));
  };

  const calcMoyenne = (ds1: string, ds2: string, compo: string) => {
    const d1 = parseFloat(ds1), d2 = parseFloat(ds2), c = parseFloat(compo);
    if (isNaN(c)) return null;
    const dsAvg = (!isNaN(d1) && !isNaN(d2)) ? (d1 + d2) / 2 : !isNaN(d1) ? d1 : !isNaN(d2) ? d2 : null;
    if (dsAvg === null) return c;
    return Math.round(((dsAvg + c * 2) / 3) * 100) / 100;
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      for (const eleveId of Object.keys(notes)) {
        const n = notes[eleveId];
        const moyenne = calcMoyenne(n.ds1, n.ds2, n.compo);
        const noteData = {
          eleve_id: eleveId,
          matiere_id: selectedMatiere,
          periode_id: selectedPeriode,
          note_ds1: n.ds1 ? parseFloat(n.ds1) : null,
          note_ds2: n.ds2 ? parseFloat(n.ds2) : null,
          note_compo: n.compo ? parseFloat(n.compo) : null,
          moyenne,
          saisie_par: profile.id,
          date_saisie: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from("notes")
          .select("id")
          .eq("eleve_id", eleveId)
          .eq("matiere_id", selectedMatiere)
          .eq("periode_id", selectedPeriode)
          .maybeSingle();

        if (existing) {
          await supabase.from("notes").update(noteData).eq("id", existing.id);
        } else {
          await supabase.from("notes").insert(noteData);
        }
      }
      toast({ title: "Notes enregistrées avec succès !" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Enseignant">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Saisie des notes</h1>

        <Card>
          <CardHeader><CardTitle className="font-sans text-sm">Sélection</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <Select value={selectedClasse} onValueChange={v => { setSelectedClasse(v); setSelectedMatiere(""); }}>
                <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
                <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                <SelectContent>
                  {matieres.map(m => <SelectItem key={m.id} value={m.id}>{m.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
                <SelectContent>
                  {periodes.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {eleves.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Nom & Prénom</TableHead>
                      <TableHead className="w-24">DS1 /20</TableHead>
                      <TableHead className="w-24">DS2 /20</TableHead>
                      <TableHead className="w-24">Compo /20</TableHead>
                      <TableHead className="w-24">Moyenne</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eleves.map(e => {
                      const n = notes[e.id] || { ds1: "", ds2: "", compo: "" };
                      const moy = calcMoyenne(n.ds1, n.ds2, n.compo);
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs">{e.matricule}</TableCell>
                          <TableCell className="font-medium">{e.nom} {e.prenom}</TableCell>
                          <TableCell>
                            <Input type="number" min="0" max="20" step="0.25" value={n.ds1}
                              onChange={ev => updateNote(e.id, "ds1", ev.target.value)} className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="0" max="20" step="0.25" value={n.ds2}
                              onChange={ev => updateNote(e.id, "ds2", ev.target.value)} className="w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="0" max="20" step="0.25" value={n.compo}
                              onChange={ev => updateNote(e.id, "compo", ev.target.value)} className="w-20" />
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${moy !== null && moy >= 10 ? "text-green-600" : "text-destructive"}`}>
                              {moy !== null ? moy.toFixed(2) : "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer les notes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
