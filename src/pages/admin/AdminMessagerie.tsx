import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMessagerie() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Messagerie</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Messagerie interne</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Communiquez avec les enseignants et parents de votre établissement.</p></CardContent>
      </Card>
    </div>
  );
}
