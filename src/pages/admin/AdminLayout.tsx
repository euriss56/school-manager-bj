import { Users, BookOpen, CreditCard, Calendar, BarChart3, Settings, Home, Bell, MessageSquare, ClipboardList, Clock, UserCog } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Outlet } from "react-router-dom";

const sidebarItems = [
  { title: "Tableau de bord", url: "/admin", icon: Home },
  { title: "Inscriptions", url: "/admin/inscriptions", icon: Users },
  { title: "Utilisateurs", url: "/admin/utilisateurs", icon: UserCog },
  { title: "Classes", url: "/admin/classes", icon: BookOpen },
  { title: "Paiements", url: "/admin/paiements", icon: CreditCard },
  { title: "Notes & Bulletins", url: "/admin/notes", icon: ClipboardList },
  { title: "Emplois du temps", url: "/admin/emplois-du-temps", icon: Calendar },
  { title: "Absences", url: "/admin/absences", icon: Clock },
  { title: "Annonces", url: "/admin/annonces", icon: Bell },
  { title: "Messagerie", url: "/admin/messagerie", icon: MessageSquare },
  { title: "Statistiques", url: "/admin/statistiques", icon: BarChart3 },
  { title: "Paramètres", url: "/admin/parametres", icon: Settings },
];

export default function AdminLayout() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Administration">
      <Outlet />
    </DashboardLayout>
  );
}
