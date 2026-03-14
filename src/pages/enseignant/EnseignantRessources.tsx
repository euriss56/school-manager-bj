import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function EnseignantRessources() {
  const { profile } = useAuth();
  const [ressources, setRessources] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("ressources").select("*, matieres(nom), classes(nom)").eq("auteur_id", profile.id).order("created_at", { ascending: false })
      .then(({ data }) => setRessources(data || []));
  }, [profile]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mes ressources</h1>
      {ressources.length === 0 ? <p className="text-muted-foreground">Aucune ressource partagée.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ressources.map(r => (
            <Card key={r.id}>
              <CardHeader><CardTitle className="font-sans text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> {r.titre}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {r.matieres && <Badge variant="secondary">{(r.matieres as any).nom}</Badge>}
                {r.classes && <Badge variant="outline">{(r.classes as any).nom}</Badge>}
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
