import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminNotes() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Notes & Bulletins</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Gestion des notes</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Configurez les périodes d'évaluation, saisissez les notes et générez les bulletins.</p></CardContent>
      </Card>
    </div>
  );
}
