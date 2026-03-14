import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, LayoutDashboard, CreditCard, LogOut } from "lucide-react";

export default function ComptableLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-6 border-b border-primary-foreground/20">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="text-xl font-bold">SchoolManager</span>
          </div>
          <p className="text-sm text-primary-foreground/70 mt-1">Espace Comptable</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/comptable"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-primary-foreground/10"
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            Tableau de bord
          </NavLink>

          <NavLink
            to="/comptable/paiements"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-primary-foreground/10"
              }`
            }
          >
            <CreditCard className="w-5 h-5" />
            Paiements
          </NavLink>
        </nav>

        <div className="p-4 border-t border-primary-foreground/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
              {profile?.prenom?.[0]}{profile?.nom?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.prenom} {profile?.nom}</p>
              <p className="text-xs text-primary-foreground/70">Comptable</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground w-full"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
