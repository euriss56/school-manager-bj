import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function ParentPaiements() {
  const { profile } = useAuth();
  const [enfants, setEnfants] = useState<any[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState("");
  const [paiements, setPaiements] = useState<any[]>([]);
  const [fraisTypes, setFraisTypes] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("parents_eleves").select("eleve_id, eleves(id, prenom, nom, classe_id)").eq("parent_id", profile.id)
      .then(({ data }) => { const e = (data || []).map((p: any) => p.eleves).filter(Boolean); setEnfants(e); if (e.length === 1) setSelectedEnfant(e[0].id); });
  }, [profile]);

  useEffect(() => {
    if (!selectedEnfant) return;
    const load = async () => {
      const { data: p } = await supabase.from("paiements").select("*, frais_types(nom, montant)").eq("eleve_id", selectedEnfant).order("date_paiement", { ascending: false });
      setPaiements(p || []);
      const enfant = enfants.find(e => e.id === selectedEnfant);
      if (enfant?.classe_id) {
        const { data: ft } = await supabase.from("frais_types").select("*").or(`classe_id.eq.${enfant.classe_id},classe_id.is.null`);
        setFraisTypes(ft || []);
      }
    };
    load();
  }, [selectedEnfant, enfants]);

  const totalPaye = paiements.reduce((s, p) => s + (p.montant_paye || 0), 0);
  const totalDu = fraisTypes.reduce((s, f) => s + (f.montant || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Suivi des paiements</h1>
      {enfants.length > 1 && (
        <Select value={selectedEnfant} onValueChange={setSelectedEnfant}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choisir un enfant" /></SelectTrigger>
          <SelectContent>{enfants.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedEnfant && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card><CardHeader><CardTitle className="font-sans text-sm">Total dû</CardTitle></CardHeader><CardContent><p className="text-xl font-bold font-sans">{totalDu.toLocaleString()} FCFA</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-sans text-sm">Total payé</CardTitle></CardHeader><CardContent><p className="text-xl font-bold font-sans text-green-600">{totalPaye.toLocaleString()} FCFA</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="font-sans text-sm">Reste à payer</CardTitle></CardHeader><CardContent><p className={`text-xl font-bold font-sans ${totalDu - totalPaye > 0 ? "text-destructive" : "text-green-600"}`}>{(totalDu - totalPaye).toLocaleString()} FCFA</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Historique des paiements</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Montant</TableHead><TableHead>Mode</TableHead><TableHead>Reçu</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paiements.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{(p.frais_types as any)?.nom}</TableCell>
                      <TableCell className="font-bold">{p.montant_paye?.toLocaleString()} FCFA</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{p.mode_paiement.replace("_", " ")}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{p.recu_numero || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {paiements.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucun paiement</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
