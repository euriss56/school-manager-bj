import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Home, Building2, Users, CreditCard, Mail } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const sidebarItems = [
  { title: "Tableau de bord", url: "/superadmin", icon: Home },
];

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schools } = useQuery({
    queryKey: ["all-schools"],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const updateSchoolStatus = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("schools").update({ statut: statut as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-schools"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { en_attente: "bg-warning/20 text-warning-foreground", actif: "bg-success/20 text-success", suspendu: "bg-destructive/20 text-destructive" };
    return <Badge className={map[s] || ""}>{s === "en_attente" ? "En attente" : s === "actif" ? "Actif" : "Suspendu"}</Badge>;
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Super Admin">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Super Admin</h1>
        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="font-sans text-sm">Écoles inscrites</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">{schools?.length || 0}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">Écoles actives</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">{schools?.filter(s => s.statut === "actif").length || 0}</p></CardContent></Card>
          <Card><CardHeader><CardTitle className="font-sans text-sm">En attente</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold font-sans">{schools?.filter(s => s.statut === "en_attente").length || 0}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-sans">Toutes les écoles</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools?.map(school => (
                  <TableRow key={school.id}>
                    <TableCell className="font-mono text-sm">{school.code_unique}</TableCell>
                    <TableCell className="font-medium">{school.nom}</TableCell>
                    <TableCell>{school.ville}</TableCell>
                    <TableCell><Badge variant="outline">{school.plan}</Badge></TableCell>
                    <TableCell>{statusBadge(school.statut)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {school.statut !== "actif" && (
                          <Button size="sm" variant="outline" onClick={() => updateSchoolStatus.mutate({ id: school.id, statut: "actif" })}>Activer</Button>
                        )}
                        {school.statut === "actif" && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateSchoolStatus.mutate({ id: school.id, statut: "suspendu" })}>Suspendre</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
