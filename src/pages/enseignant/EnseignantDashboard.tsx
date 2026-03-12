import { Home, BookOpen, ClipboardList, Calendar, MessageSquare, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sidebarItems = [
  { title: "Tableau de bord", url: "/enseignant", icon: Home },
  { title: "Mes classes", url: "/enseignant/classes", icon: BookOpen },
  { title: "Saisie des notes", url: "/enseignant/notes", icon: ClipboardList },
  { title: "Présences", url: "/enseignant/presences", icon: Calendar },
  { title: "Messagerie", url: "/enseignant/messagerie", icon: MessageSquare },
  { title: "Ressources", url: "/enseignant/ressources", icon: Upload },
];

export default function EnseignantDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Enseignant">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord enseignant</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="font-sans text-sm">Mes classes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Cours aujourd'hui</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Notes à saisir</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
