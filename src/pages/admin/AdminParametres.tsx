import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminParametres() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Paramètres de l'école</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Configurez les années scolaires, classes, matières et autres paramètres.</p></CardContent>
      </Card>
    </div>
  );
}
