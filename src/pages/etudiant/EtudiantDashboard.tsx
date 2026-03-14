import { useEffect, useState } from "react";
import { Home, FileText, Calendar, BookOpen, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const sidebarItems = [
  { title: "Tableau de bord", url: "/etudiant", icon: Home },
  { title: "Notes & Bulletins", url: "/etudiant/notes", icon: FileText },
  { title: "Emploi du temps", url: "/etudiant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/etudiant/messagerie", icon: MessageSquare },
];

export default function EtudiantDashboard() {
  const { profile } = useAuth();
  const [eleve, setEleve] = useState<any>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      // Find student linked to this user's email
      const { data: el } = await supabase
        .from("eleves")
        .select("*, classes(nom)")
        .eq("email_parent", profile.email)
        .maybeSingle();
      setEleve(el);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("destinataire_id", profile.id)
        .eq("lu", false);
      setUnread(count || 0);
    };
    load();
  }, [profile]);

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Élève">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue, {profile?.prenom} {profile?.nom}
        </h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Ma classe</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-sans text-secondary">
                {eleve ? (eleve.classes as any)?.nom || "—" : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Matricule</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-mono text-secondary">{eleve?.matricule || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="font-sans text-sm">Messages non lus</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-sans text-secondary">{unread}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
