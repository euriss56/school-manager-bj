import { useEffect, useState } from "react";
import { Home, BookOpen, ClipboardList, Calendar, MessageSquare, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems = [
  { title: "Tableau de bord", url: "/enseignant", icon: Home },
  { title: "Mes classes", url: "/enseignant/classes", icon: BookOpen },
  { title: "Saisie des notes", url: "/enseignant/notes", icon: ClipboardList },
  { title: "Emploi du temps", url: "/enseignant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/enseignant/messagerie", icon: MessageSquare },
  { title: "Ressources", url: "/enseignant/ressources", icon: Upload },
];

export default function EnseignantDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ classes: 0, coursAujourdhui: 0, elevesTotal: 0 });

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      // Get teacher's classes
      const { data: em } = await supabase
        .from("enseignant_matieres")
        .select("classe_id")
        .eq("enseignant_id", profile.id);
      const classeIds = [...new Set((em || []).map(e => e.classe_id).filter(Boolean))];

      // Today's schedule
      const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
      const today = jours[new Date().getDay()] as any;
      const { data: edt } = await supabase
        .from("emplois_du_temps")
        .select("id")
        .eq("enseignant_id", profile.id)
        .eq("jour", today);

      // Student count
      let elevesCount = 0;
      if (classeIds.length > 0) {
        const { count } = await supabase
          .from("eleves")
          .select("id", { count: "exact", head: true })
          .in("classe_id", classeIds as string[]);
        elevesCount = count || 0;
      }

      setStats({
        classes: classeIds.length,
        coursAujourdhui: edt?.length || 0,
        elevesTotal: elevesCount,
      });
    };
    load();
  }, [profile]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Enseignant">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue, {profile?.prenom} {profile?.nom}
        </h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Mes classes</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-sans text-secondary">{stats.classes}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Cours aujourd'hui</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-sans text-secondary">{stats.coursAujourdhui}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Total élèves</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-sans text-secondary">{stats.elevesTotal}</p></CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
