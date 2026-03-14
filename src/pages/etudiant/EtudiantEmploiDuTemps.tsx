import { useEffect, useState } from "react";
import { Home, FileText, Calendar, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems = [
  { title: "Tableau de bord", url: "/etudiant", icon: Home },
  { title: "Notes & Bulletins", url: "/etudiant/notes", icon: FileText },
  { title: "Emploi du temps", url: "/etudiant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/etudiant/messagerie", icon: MessageSquare },
];

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] as const;
const HEURES = ["07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30"];

export default function EtudiantEmploiDuTemps() {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: el } = await supabase
        .from("eleves")
        .select("classe_id")
        .eq("email_parent", profile.email)
        .maybeSingle();
      if (!el?.classe_id) return;
      const { data } = await supabase
        .from("emplois_du_temps")
        .select("*, matieres(nom)")
        .eq("classe_id", el.classe_id);
      setSlots(data || []);
    };
    load();
  }, [profile]);

  const getSlot = (jour: string, heure: string) =>
    slots.find(s => s.jour === jour && s.heure_debut === heure + ":00");

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Élève">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mon emploi du temps</h1>
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border p-2 bg-muted">Heure</th>
                  {JOURS.map(j => (
                    <th key={j} className="border border-border p-2 bg-muted capitalize text-center">{j}</th>
                  ))}
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
                            <div>
                              <p className="font-medium text-xs">{(slot.matieres as any)?.nom}</p>
                              {slot.salle && <p className="text-xs text-muted-foreground">{slot.salle}</p>}
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
    </DashboardLayout>
  );
}
