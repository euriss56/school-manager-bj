import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminStatistiques() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Analyses et rapports</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Consultez les statistiques de votre établissement : inscriptions, résultats, finances.</p></CardContent>
      </Card>
    </div>
  );
}
