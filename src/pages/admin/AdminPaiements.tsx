import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPaiements() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Paiements & Frais scolaires</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Gestion des paiements</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Module de paiements en cours de développement. Configurez les frais et enregistrez les paiements ici.</p></CardContent>
      </Card>
    </div>
  );
}
