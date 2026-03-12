import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminEmploisDuTemps() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Emplois du temps</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Gestion des emplois du temps</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Créez et gérez les emplois du temps par classe et par enseignant.</p></CardContent>
      </Card>
    </div>
  );
}
