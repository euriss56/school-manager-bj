import { useEffect, useState } from "react";
import { Home, FileText, Calendar, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems = [
  { title: "Tableau de bord", url: "/etudiant", icon: Home },
  { title: "Notes & Bulletins", url: "/etudiant/notes", icon: FileText },
  { title: "Emploi du temps", url: "/etudiant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/etudiant/messagerie", icon: MessageSquare },
];

export default function EtudiantNotes() {
  const { profile } = useAuth();
  const [eleve, setEleve] = useState<any>(null);
  const [periodes, setPeriodes] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [bulletin, setBulletin] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: el } = await supabase
        .from("eleves")
        .select("id, classe_id")
        .eq("email_parent", profile.email)
        .maybeSingle();
      setEleve(el);

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
    if (!eleve || !selectedPeriode) return;
    const load = async () => {
      const { data: n } = await supabase
        .from("notes")
        .select("*, matieres(nom, coefficient)")
        .eq("eleve_id", eleve.id)
        .eq("periode_id", selectedPeriode);
      setNotes(n || []);

      const { data: b } = await supabase
        .from("bulletins")
        .select("*, periodes(libelle)")
        .eq("eleve_id", eleve.id)
        .eq("periode_id", selectedPeriode)
        .eq("is_published", true)
        .maybeSingle();
      setBulletin(b);
    };
    load();
  }, [eleve, selectedPeriode]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Élève">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mes notes & bulletins</h1>

        <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choisir une période" /></SelectTrigger>
          <SelectContent>
            {periodes.map(p => <SelectItem key={p.id} value={p.id}>{p.libelle}</SelectItem>)}
          </SelectContent>
        </Select>

        {bulletin && (
          <Card className="border-secondary/30">
            <CardHeader>
              <CardTitle className="font-sans text-sm">Bulletin — {(bulletin.periodes as any)?.libelle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm">
                <span>Moyenne: <strong className="text-secondary">{bulletin.moyenne_generale?.toFixed(2)}/20</strong></span>
                <span>Rang: <strong>{bulletin.rang}</strong></span>
                {bulletin.mention && <Badge variant="secondary">{bulletin.mention}</Badge>}
              </div>
            </CardContent>
          </Card>
        )}

        {notes.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Coeff</TableHead>
                    <TableHead>DS1</TableHead>
                    <TableHead>DS2</TableHead>
                    <TableHead>Compo</TableHead>
                    <TableHead>Moyenne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="font-medium">{(n.matieres as any)?.nom}</TableCell>
                      <TableCell>{(n.matieres as any)?.coefficient}</TableCell>
                      <TableCell>{n.note_ds1 ?? "—"}</TableCell>
                      <TableCell>{n.note_ds2 ?? "—"}</TableCell>
                      <TableCell>{n.note_compo ?? "—"}</TableCell>
                      <TableCell className={`font-bold ${n.moyenne >= 10 ? "text-green-600" : "text-destructive"}`}>
                        {n.moyenne?.toFixed(2) ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedPeriode && notes.length === 0 && !bulletin && (
          <p className="text-muted-foreground">Aucune note disponible pour cette période.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
