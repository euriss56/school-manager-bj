import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, LogOut, Search, PanelLeft } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  title: string;
}

function SidebarNav({ items, title }: { items: SidebarItem[]; title: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="flex h-full flex-col bg-[#10251f] text-white">
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#c5f36b] text-[#10251f] shadow-lg shadow-black/10">
              <GraduationCap className="h-6 w-6" />
            </div>
            {!collapsed && <div className="min-w-0">
              <p className="truncate text-[15px] font-bold tracking-tight text-white">SchoolManager</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Gestion scolaire</p>
            </div>}
          </div>
        </div>

        <SidebarGroup className="px-3">
          {!collapsed && <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{title}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const active = location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url + "/"));
                return <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-11 rounded-xl px-3 text-white/65 transition-all duration-200 hover:bg-white/[0.07] hover:text-white data-[active=true]:bg-[#c5f36b] data-[active=true]:font-semibold data-[active=true]:text-[#10251f]">
                    <NavLink to={item.url} end className="flex items-center gap-3" activeClassName="bg-[#c5f36b] text-[#10251f] font-semibold shadow-md shadow-black/10">
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="text-[13px]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto px-4 pb-5">
          {!collapsed && <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c5f36b] text-xs font-bold text-[#10251f]">
                {profile?.prenom?.[0]}{profile?.nom?.[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{profile?.prenom} {profile?.nom}</p>
                <p className="truncate text-[10px] text-white/45">{profile?.email}</p>
              </div>
            </div>
          </div>}
          <Button variant="ghost" size="sm" className="h-10 w-full justify-start rounded-xl text-white/55 hover:bg-white/[0.07] hover:text-white" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {!collapsed && "Déconnexion"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout({ children, sidebarItems, title }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f5f7f4]">
        <SidebarNav items={sidebarItems} title={title} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-[#e8ece7] bg-white/90 px-5 backdrop-blur-xl md:px-8">
            <SidebarTrigger className="h-9 w-9 rounded-xl text-[#52615a] hover:bg-[#f0f4ed]">
              <PanelLeft className="h-4 w-4" />
            </SidebarTrigger>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#91a098]">Espace de travail</p>
              <h2 className="truncate text-base font-bold tracking-tight text-[#172b23]">{title}</h2>
            </div>
            <div className="hidden h-10 max-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[#e9eee8] bg-[#f8faf7] px-3 text-xs text-[#9aa69e] md:flex">
              <Search className="h-4 w-4" /> Rechercher...
              <kbd className="ml-auto rounded-md border border-[#e1e8df] bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9eee8] bg-white">
              <NotificationBell />
            </div>
          </header>
          <main className="dashboard-main flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
