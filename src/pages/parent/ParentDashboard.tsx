import { useEffect, useState } from "react";
import { Home, FileText, CreditCard, Calendar, Clock, MessageSquare, Bell } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function ParentDashboard() {
  const { profile } = useAuth();
  const [enfants, setEnfants] = useState<any[]>([]);
  const [totalDu, setTotalDu] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: pe } = await supabase
        .from("parents_eleves")
        .select("eleve_id, eleves(id, prenom, nom, classe_id, classes(nom))")
        .eq("parent_id", profile.id);
      setEnfants((pe || []).map((p: any) => p.eleves).filter(Boolean));

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("destinataire_id", profile.id)
        .eq("lu", false);
      setUnreadMsgs(count || 0);
    };
    load();
  }, [profile]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Parent">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue, {profile?.prenom} {profile?.nom}
        </h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Mes enfants</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-sans text-secondary">{enfants.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Messages non lus</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold font-sans text-secondary">{unreadMsgs}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Enfants inscrits</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {enfants.map((e: any) => (
                  <p key={e.id} className="text-sm">{e.prenom} {e.nom} — <span className="text-muted-foreground">{(e.classes as any)?.nom || "—"}</span></p>
                ))}
                {enfants.length === 0 && <p className="text-sm text-muted-foreground">Aucun enfant lié</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
