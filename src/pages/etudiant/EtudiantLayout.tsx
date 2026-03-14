import { Outlet } from "react-router-dom";
import { Home, FileText, Calendar, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { title: "Tableau de bord", url: "/etudiant", icon: Home },
  { title: "Notes & Bulletins", url: "/etudiant/notes", icon: FileText },
  { title: "Emploi du temps", url: "/etudiant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/etudiant/messagerie", icon: MessageSquare },
];

export default function EtudiantLayout() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Élève">
      <Outlet />
    </DashboardLayout>
  );
}
