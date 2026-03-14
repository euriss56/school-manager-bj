import { Outlet } from "react-router-dom";
import { Home, FileText, CreditCard, Calendar, Clock, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { title: "Tableau de bord", url: "/parent", icon: Home },
  { title: "Bulletins", url: "/parent/bulletins", icon: FileText },
  { title: "Paiements", url: "/parent/paiements", icon: CreditCard },
  { title: "Emploi du temps", url: "/parent/emploi-du-temps", icon: Calendar },
  { title: "Absences", url: "/parent/absences", icon: Clock },
  { title: "Messagerie", url: "/parent/messagerie", icon: MessageSquare },
];

export default function ParentLayout() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Parent">
      <Outlet />
    </DashboardLayout>
  );
}
