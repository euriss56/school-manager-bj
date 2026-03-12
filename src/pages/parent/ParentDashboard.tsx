import { Home, FileText, CreditCard, Calendar, Clock, MessageSquare, Bell } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sidebarItems = [
  { title: "Tableau de bord", url: "/parent", icon: Home },
  { title: "Bulletins", url: "/parent/bulletins", icon: FileText },
  { title: "Paiements", url: "/parent/paiements", icon: CreditCard },
  { title: "Emploi du temps", url: "/parent/emploi-du-temps", icon: Calendar },
  { title: "Absences", url: "/parent/absences", icon: Clock },
  { title: "Messagerie", url: "/parent/messagerie", icon: MessageSquare },
  { title: "Notifications", url: "/parent/notifications", icon: Bell },
];

export default function ParentDashboard() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Parent">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord parent</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="font-sans text-sm">Dernière note</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Prochain cours</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">—</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Solde à payer</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">— FCFA</p></CardContent></Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
