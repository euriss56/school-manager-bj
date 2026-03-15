import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function AdminStatistiques() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id;

  const { data: paiementsData } = useQuery({
    queryKey: ["stats-paiements", schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from("paiements")
        .select("montant_paye, date_paiement")
        .eq("school_id", schoolId!);
      
      const byMonth: Record<string, number> = {};
      (data || []).forEach(p => {
        const month = new Date(p.date_paiement).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        byMonth[month] = (byMonth[month] || 0) + Number(p.montant_paye);
      });
      return Object.entries(byMonth).map(([mois, montant]) => ({ mois, montant })).slice(-12);
    },
    enabled: !!schoolId,
  });

  const { data: sexeData } = useQuery({
    queryKey: ["stats-sexe", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("eleves").select("sexe").eq("school_id", schoolId!).eq("statut_inscription", "valide");
      const m = (data || []).filter(e => e.sexe === "M").length;
      const f = (data || []).filter(e => e.sexe === "F").length;
      return [{ name: "Garçons", value: m }, { name: "Filles", value: f }];
    },
    enabled: !!schoolId,
  });

  const { data: moyennesData } = useQuery({
    queryKey: ["stats-moyennes", schoolId],
    queryFn: async () => {
      const { data: classes } = await supabase.from("classes").select("id, nom").eq("school_id", schoolId!);
      const { data: eleves } = await supabase.from("eleves").select("id, classe_id").eq("school_id", schoolId!);
      const { data: notes } = await supabase.from("notes").select("eleve_id, moyenne");

      const classeMap = new Map<string, { nom: string; moyennes: number[] }>();
      (classes || []).forEach(c => classeMap.set(c.id, { nom: c.nom, moyennes: [] }));

      const eleveClasse = new Map<string, string>();
      (eleves || []).forEach(e => { if (e.classe_id) eleveClasse.set(e.id, e.classe_id); });

      (notes || []).forEach(n => {
        if (n.moyenne !== null) {
          const cid = eleveClasse.get(n.eleve_id);
          if (cid && classeMap.has(cid)) classeMap.get(cid)!.moyennes.push(Number(n.moyenne));
        }
      });

      return Array.from(classeMap.values())
        .filter(c => c.moyennes.length > 0)
        .map(c => ({
          classe: c.nom,
          moyenne: +(c.moyennes.reduce((a, b) => a + b, 0) / c.moyennes.length).toFixed(2),
        }));
    },
    enabled: !!schoolId,
  });

  const { data: recouvrementData } = useQuery({
    queryKey: ["stats-recouvrement", schoolId],
    queryFn: async () => {
      const { data: frais } = await supabase.from("frais_types").select("id, montant, classe_id").eq("school_id", schoolId!);
      const { data: eleves } = await supabase.from("eleves").select("id, classe_id").eq("school_id", schoolId!).eq("statut_inscription", "valide");
      const { data: paiements } = await supabase.from("paiements").select("montant_paye, frais_type_id").eq("school_id", schoolId!);

      let totalAttendu = 0;
      (frais || []).forEach(f => {
        const nb = (eleves || []).filter(e => !f.classe_id || e.classe_id === f.classe_id).length;
        totalAttendu += Number(f.montant) * nb;
      });

      const totalPaye = (paiements || []).reduce((s, p) => s + Number(p.montant_paye), 0);
      const taux = totalAttendu > 0 ? Math.round((totalPaye / totalAttendu) * 100) : 0;

      return { totalAttendu, totalPaye, taux };
    },
    enabled: !!schoolId,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{recouvrementData?.taux || 0}%</p>
            <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-secondary">{(recouvrementData?.totalPaye || 0).toLocaleString("fr-FR")}</p>
            <p className="text-sm text-muted-foreground">Total perçu (FCFA)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-accent">{(recouvrementData?.totalAttendu || 0).toLocaleString("fr-FR")}</p>
            <p className="text-sm text-muted-foreground">Total attendu (FCFA)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-sans text-base">Évolution des paiements</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={paiementsData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("fr-FR")} FCFA`} />
                <Line type="monotone" dataKey="montant" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-sans text-base">Répartition par sexe</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={sexeData || []} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {(sexeData || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-sans text-base">Moyennes par classe</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moyennesData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="classe" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v}/20`} />
                <Bar dataKey="moyenne" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
