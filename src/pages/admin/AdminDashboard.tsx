import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, CreditCard, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return null;
      const [elevesRes, enseignantsRes, paiementsRes] = await Promise.all([
        supabase.from("eleves").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("role", "enseignant"),
        supabase.from("paiements").select("montant_paye").eq("school_id", profile.school_id),
      ]);
      const totalPaiements = paiementsRes.data?.reduce((sum, p) => sum + Number(p.montant_paye), 0) || 0;
      return {
        eleves: elevesRes.count || 0,
        enseignants: enseignantsRes.count || 0,
        paiements: totalPaiements,
      };
    },
    enabled: !!profile?.school_id,
  });

  const statCards = [
    { label: "Total élèves", value: stats?.eleves || 0, icon: Users, color: "text-secondary" },
    { label: "Enseignants", value: stats?.enseignants || 0, icon: GraduationCap, color: "text-accent" },
    { label: "Paiements (FCFA)", value: (stats?.paiements || 0).toLocaleString("fr-FR"), icon: CreditCard, color: "text-secondary" },
    { label: "Taux recouvrement", value: "—", icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur votre espace d'administration</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-sans">{stat.label}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground font-sans">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Alertes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Aucune alerte pour le moment.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Événements à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Aucun événement planifié.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
