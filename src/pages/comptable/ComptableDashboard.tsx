import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Receipt, TrendingUp, AlertCircle } from "lucide-react";

export default function ComptableDashboard() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;

  const { data: paiements } = useQuery({
    queryKey: ["paiements-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("paiements")
        .select("*, eleves(nom, prenom), frais_types(nom, montant)")
        .eq("school_id", schoolId!)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: eleves } = useQuery({
    queryKey: ["eleves-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("eleves")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("statut_inscription", "valide");
      return data || [];
    },
    enabled: !!schoolId,
  });

  const { data: fraisTypes } = useQuery({
    queryKey: ["frais-types-comptable", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("frais_types")
        .select("*")
        .eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const totalEncaisse = paiements?.reduce((s, p) => s + Number(p.montant_paye), 0) || 0;
  const totalAttendu = (eleves?.length || 0) * (fraisTypes?.reduce((s, f) => s + Number(f.montant), 0) || 0);
  const tauxRecouvrement = totalAttendu > 0 ? ((totalEncaisse / totalAttendu) * 100).toFixed(1) : "0";
  const impayesCount = eleves?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bonjour, {profile?.prenom} 👋
        </h1>
        <p className="text-muted-foreground">Tableau de bord comptable</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total encaissé</CardTitle>
            <CreditCard className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEncaisse.toLocaleString("fr-FR")} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total attendu</CardTitle>
            <Receipt className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAttendu.toLocaleString("fr-FR")} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux recouvrement</CardTitle>
            <TrendingUp className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tauxRecouvrement}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Élèves</CardTitle>
            <AlertCircle className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{impayesCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Derniers paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {paiements?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Aucun paiement enregistré</p>
          ) : (
            <div className="space-y-3">
              {paiements?.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{(p as any).eleves?.prenom} {(p as any).eleves?.nom}</p>
                    <p className="text-sm text-muted-foreground">{(p as any).frais_types?.nom}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-success">{Number(p.montant_paye).toLocaleString("fr-FR")} FCFA</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.date_paiement).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
