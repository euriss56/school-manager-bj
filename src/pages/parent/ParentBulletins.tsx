import { useEffect, useState } from "react";
import { Home, FileText, CreditCard, Calendar, Clock, MessageSquare, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function ParentBulletins() {
  const { profile } = useAuth();
  const [enfants, setEnfants] = useState<any[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState("");
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedBulletin, setSelectedBulletin] = useState<any>(null);

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
      .from("bulletins")
      .select("*, periodes(libelle)")
      .eq("eleve_id", selectedEnfant)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setBulletins(data || []));
  }, [selectedEnfant]);

  const viewBulletin = async (bulletin: any) => {
    setSelectedBulletin(bulletin);
    const { data } = await supabase
      .from("notes")
      .select("*, matieres(nom, coefficient)")
      .eq("eleve_id", selectedEnfant)
      .eq("periode_id", bulletin.periode_id);
    setNotes(data || []);
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Parent">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Bulletins scolaires</h1>

        {enfants.length > 1 && (
          <Select value={selectedEnfant} onValueChange={setSelectedEnfant}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Choisir un enfant" /></SelectTrigger>
            <SelectContent>
              {enfants.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {!selectedBulletin ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bulletins.map(b => (
              <Card key={b.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => viewBulletin(b)}>
                <CardHeader>
                  <CardTitle className="font-sans text-sm">{(b.periodes as any)?.libelle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-2xl font-bold text-secondary">{b.moyenne_generale?.toFixed(2)}/20</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">Rang: {b.rang || "—"}</Badge>
                    {b.mention && <Badge variant="secondary">{b.mention}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {bulletins.length === 0 && selectedEnfant && (
              <p className="text-muted-foreground col-span-full">Aucun bulletin publié.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedBulletin(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">
                  Bulletin — {(selectedBulletin.periodes as any)?.libelle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-4 text-sm">
                  <span>Moyenne: <strong className="text-secondary">{selectedBulletin.moyenne_generale?.toFixed(2)}/20</strong></span>
                  <span>Rang: <strong>{selectedBulletin.rang}</strong></span>
                  {selectedBulletin.mention && <Badge variant="secondary">{selectedBulletin.mention}</Badge>}
                </div>
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
                {selectedBulletin.appreciation_directeur && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Appréciation du directeur:</p>
                    <p className="text-sm text-muted-foreground">{selectedBulletin.appreciation_directeur}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
