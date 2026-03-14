import { Outlet } from "react-router-dom";
import { Home, BookOpen, ClipboardList, Calendar, MessageSquare, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { title: "Tableau de bord", url: "/enseignant", icon: Home },
  { title: "Mes classes", url: "/enseignant/classes", icon: BookOpen },
  { title: "Saisie des notes", url: "/enseignant/notes", icon: ClipboardList },
  { title: "Emploi du temps", url: "/enseignant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/enseignant/messagerie", icon: MessageSquare },
  { title: "Ressources", url: "/enseignant/ressources", icon: Upload },
];

export default function EnseignantLayout() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Enseignant">
      <Outlet />
    </DashboardLayout>
  );
}
