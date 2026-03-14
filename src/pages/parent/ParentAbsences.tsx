import { useEffect, useState } from "react";
import { Home, FileText, CreditCard, Calendar, Clock, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems = [
  { title: "Tableau de bord", url: "/parent", icon: Home },
  { title: "Bulletins", url: "/parent/bulletins", icon: FileText },
  { title: "Paiements", url: "/parent/paiements", icon: CreditCard },
  { title: "Emploi du temps", url: "/parent/emploi-du-temps", icon: Calendar },
  { title: "Absences", url: "/parent/absences", icon: Clock },
  { title: "Messagerie", url: "/parent/messagerie", icon: MessageSquare },
];

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  retard: "bg-yellow-100 text-yellow-800",
  excuse: "bg-blue-100 text-blue-800",
};

export default function ParentAbsences() {
  const { profile } = useAuth();
  const [enfants, setEnfants] = useState<any[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState("");
  const [absences, setAbsences] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("parents_eleves")
      .select("eleve_id, eleves(id, prenom, nom)")
      .eq("parent_id", profile.id)
      .then(({ data }) => {
        const e = (data || []).map((p: any) => p.eleves).filter(Boolean);
        setEnfants(e);
        if (e.length === 1) setSelectedEnfant(e[0].id);
      });
  }, [profile]);

  useEffect(() => {
    if (!selectedEnfant) return;
    supabase
      .from("absences")
      .select("*, matieres(nom)")
      .eq("eleve_id", selectedEnfant)
      .order("date", { ascending: false })
      .then(({ data }) => setAbsences(data || []));
  }, [selectedEnfant]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Parent">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Absences & Retards</h1>
        {enfants.length > 1 && (
          <Select value={selectedEnfant} onValueChange={setSelectedEnfant}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Choisir un enfant" /></SelectTrigger>
            <SelectContent>
              {enfants.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {selectedEnfant && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{(a.matieres as any)?.nom || "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[a.statut] || ""}>{a.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.commentaire || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {absences.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucune absence enregistrée</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
