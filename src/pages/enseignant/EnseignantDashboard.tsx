import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function EnseignantDashboardContent() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ classes: 0, coursAujourdhui: 0, elevesTotal: 0 });

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: em } = await supabase
        .from("enseignant_matieres")
        .select("classe_id")
        .eq("enseignant_id", profile.id);
      const classeIds = [...new Set((em || []).map(e => e.classe_id).filter(Boolean))];

      const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
      const today = jours[new Date().getDay()] as any;
      const { data: edt } = await supabase
        .from("emplois_du_temps")
        .select("id")
        .eq("enseignant_id", profile.id)
        .eq("jour", today);

      let elevesCount = 0;
      if (classeIds.length > 0) {
        const { count } = await supabase
          .from("eleves")
          .select("id", { count: "exact", head: true })
          .in("classe_id", classeIds as string[]);
        elevesCount = count || 0;
      }
      setStats({ classes: classeIds.length, coursAujourdhui: edt?.length || 0, elevesTotal: elevesCount });
    };
    load();
  }, [profile]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Bienvenue, {profile?.prenom} {profile?.nom}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="font-sans text-sm">Mes classes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans text-secondary">{stats.classes}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-sans text-sm">Cours aujourd'hui</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans text-secondary">{stats.coursAujourdhui}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-sans text-sm">Total élèves</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans text-secondary">{stats.elevesTotal}</p></CardContent></Card>
      </div>
    </div>
  );
}
