import { Outlet } from "react-router-dom";
import { Home, CreditCard, Wallet } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const sidebarItems = [
  { title: "Tableau de bord", url: "/comptable", icon: Home },
  { title: "Paiements", url: "/comptable/paiements", icon: CreditCard },
];

export default function ComptableLayout() {
  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Comptable">
      <Outlet />
    </DashboardLayout>
  );
}
