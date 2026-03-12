import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAbsences() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Absences & Retards</h1>
      <Card>
        <CardHeader><CardTitle className="font-sans">Suivi des absences</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Consultez et gérez les absences et retards des élèves.</p></CardContent>
      </Card>
    </div>
  );
}
