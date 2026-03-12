import { Home, FileText, Calendar, BookOpen, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sidebarItems = [
  { title: "Tableau de bord", url: "/etudiant", icon: Home },
  { title: "Notes & Bulletins", url: "/etudiant/notes", icon: FileText },
  { title: "Emploi du temps", url: "/etudiant/emploi-du-temps", icon: Calendar },
  { title: "Ressources", url: "/etudiant/ressources", icon: BookOpen },
  { title: "Messagerie", url: "/etudiant/messagerie", icon: MessageSquare },
];

export default function EtudiantDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Élève">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="font-sans text-sm">Cours aujourd'hui</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Dernière note</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Annonces</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
