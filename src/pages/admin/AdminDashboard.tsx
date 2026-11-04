import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, CreditCard, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { profile } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats", profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return null;
      const [elevesRes, enseignantsRes, paiementsRes, fraisRes] = await Promise.all([
        supabase.from("eleves").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("statut_inscription", "valide"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", profile.school_id).eq("role", "enseignant"),
        supabase.from("paiements").select("montant_paye").eq("school_id", profile.school_id),
        supabase.from("frais_types").select("id, montant, classe_id").eq("school_id", profile.school_id),
      ]);

      if (elevesRes.error) throw elevesRes.error;
      if (enseignantsRes.error) throw enseignantsRes.error;
      if (paiementsRes.error) throw paiementsRes.error;
      if (fraisRes.error) throw fraisRes.error;

      const totalPaye = (paiementsRes.data || []).reduce((sum, p) => sum + Number(p.montant_paye || 0), 0);
      // Sum of configured fee amounts is not a collection rate: fee frequency
      // and class assignment must be accounted for before calculating that metric.
      const fraisConfigures = (fraisRes.data || []).reduce((sum, fee) => sum + Number(fee.montant || 0), 0);

      return {
        eleves: elevesRes.count || 0,
        enseignants: enseignantsRes.count || 0,
        paiements: totalPaye,
        fraisConfigures,
      };
    },
    enabled: !!profile?.school_id,
  });

  const { data: paiementsMensuels } = useQuery({
    queryKey: ["admin-paiements-chart", profile?.school_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("paiements")
        .select("montant_paye, date_paiement")
        .eq("school_id", profile!.school_id!);

      const byMonth: Record<string, number> = {};
      (data || []).forEach(p => {
        const m = new Date(p.date_paiement).toLocaleDateString("fr-FR", { month: "short" });
        byMonth[m] = (byMonth[m] || 0) + Number(p.montant_paye);
      });
      return Object.entries(byMonth).map(([mois, montant]) => ({ mois, montant }));
    },
    enabled: !!profile?.school_id,
  });

  const statCards = [
    { label: "Total élèves", value: stats?.eleves || 0, icon: Users, color: "text-secondary" },
    { label: "Enseignants", value: stats?.enseignants || 0, icon: GraduationCap, color: "text-accent" },
    { label: "Paiements (FCFA)", value: (stats?.paiements || 0).toLocaleString("fr-FR"), icon: CreditCard, color: "text-secondary" },
    { label: "Frais configurés (FCFA)", value: (stats?.fraisConfigures || 0).toLocaleString("fr-FR"), icon: TrendingUp, color: "text-accent" },
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
          <CardHeader><CardTitle className="font-sans text-base">Paiements récents</CardTitle></CardHeader>
          <CardContent>
            {(paiementsMensuels || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paiementsMensuels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} FCFA`} />
                  <Bar dataKey="montant" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun paiement enregistré.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-sans">Événements à venir</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Aucun événement planifié.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
