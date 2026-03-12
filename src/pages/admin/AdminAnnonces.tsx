import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnnonces() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Annonces</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Gestion des annonces</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Envoyez des annonces aux parents, enseignants ou à tout l'établissement.</p></CardContent>
      </Card>
    </div>
  );
}
