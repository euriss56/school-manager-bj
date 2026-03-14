import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] as const;
const HEURES = ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30"];

export default function ParentEmploiDuTemps() {
  const { profile } = useAuth();
  const [enfants, setEnfants] = useState<any[]>([]);
  const [selectedEnfant, setSelectedEnfant] = useState("");
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("parents_eleves").select("eleve_id, eleves(id, prenom, nom, classe_id)").eq("parent_id", profile.id)
      .then(({ data }) => { const e = (data || []).map((p: any) => p.eleves).filter(Boolean); setEnfants(e); if (e.length === 1) setSelectedEnfant(e[0].id); });
  }, [profile]);

  useEffect(() => {
    if (!selectedEnfant) return;
    const enfant = enfants.find(e => e.id === selectedEnfant);
    if (!enfant?.classe_id) return;
    supabase.from("emplois_du_temps").select("*, matieres(nom)").eq("classe_id", enfant.classe_id)
      .then(({ data }) => setSlots(data || []));
  }, [selectedEnfant, enfants]);

  const getSlot = (jour: string, heure: string) => slots.find(s => s.jour === jour && s.heure_debut === heure + ":00");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Emploi du temps</h1>
      {enfants.length > 1 && (
        <Select value={selectedEnfant} onValueChange={setSelectedEnfant}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choisir un enfant" /></SelectTrigger>
          <SelectContent>{enfants.map(e => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {selectedEnfant && (
        <Card><CardContent className="pt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead><tr><th className="border border-border p-2 bg-muted">Heure</th>{JOURS.map(j => <th key={j} className="border border-border p-2 bg-muted capitalize text-center">{j}</th>)}</tr></thead>
            <tbody>{HEURES.map(h => (
              <tr key={h}><td className="border border-border p-2 font-mono text-xs bg-muted/50">{h}</td>
                {JOURS.map(j => { const slot = getSlot(j, h); return (
                  <td key={j} className="border border-border p-2 text-center">{slot && <div><p className="font-medium text-xs">{(slot.matieres as any)?.nom}</p>{slot.salle && <p className="text-xs text-muted-foreground">{slot.salle}</p>}</div>}</td>
                ); })}
              </tr>
            ))}</tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}
