import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] as const;
const HEURES = ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30"];

export default function EnseignantEmploiDuTemps() {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("emplois_du_temps").select("*, matieres(nom), classes(nom)").eq("enseignant_id", profile.id)
      .then(({ data }) => setSlots(data || []));
  }, [profile]);

  const getSlot = (jour: string, heure: string) => slots.find(s => s.jour === jour && s.heure_debut === heure + ":00");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mon emploi du temps</h1>
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-border p-2 bg-muted text-left">Heure</th>
                {JOURS.map(j => <th key={j} className="border border-border p-2 bg-muted capitalize text-center">{j}</th>)}
              </tr>
            </thead>
            <tbody>
              {HEURES.map(h => (
                <tr key={h}>
                  <td className="border border-border p-2 font-mono text-xs bg-muted/50">{h}</td>
                  {JOURS.map(j => {
                    const slot = getSlot(j, h);
                    return (
                      <td key={j} className="border border-border p-2 text-center">
                        {slot && (
                          <div className="space-y-1">
                            <p className="font-medium text-xs">{(slot.matieres as any)?.nom}</p>
                            <Badge variant="outline" className="text-xs">{(slot.classes as any)?.nom}</Badge>
                            {slot.salle && <p className="text-xs text-muted-foreground">Salle: {slot.salle}</p>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
