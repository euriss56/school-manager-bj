import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ClasseInfo { id: string; nom: string; niveau: string; matieres: string[]; nbEleves: number; }

export default function EnseignantClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClasseInfo[]>([]);

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      const { data: em } = await supabase.from("enseignant_matieres").select("classe_id, matieres(nom)").eq("enseignant_id", profile.id);
      const classeMap = new Map<string, string[]>();
      (em || []).forEach((e: any) => { if (!e.classe_id) return; const arr = classeMap.get(e.classe_id) || []; arr.push(e.matieres?.nom || ""); classeMap.set(e.classe_id, arr); });
      const classeIds = [...classeMap.keys()];
      if (classeIds.length === 0) { setClasses([]); return; }
      const { data: cls } = await supabase.from("classes").select("id, nom, niveau").in("id", classeIds);
      const result: ClasseInfo[] = [];
      for (const c of cls || []) {
        const { count } = await supabase.from("eleves").select("id", { count: "exact", head: true }).eq("classe_id", c.id);
        result.push({ id: c.id, nom: c.nom, niveau: c.niveau, matieres: classeMap.get(c.id) || [], nbEleves: count || 0 });
      }
      setClasses(result);
    };
    load();
  }, [profile]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Mes classes</h1>
      {classes.length === 0 ? <p className="text-muted-foreground">Aucune classe assignée.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <Card key={c.id}>
              <CardHeader><CardTitle className="font-sans">{c.nom}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Niveau: {c.niveau}</p>
                <p className="text-sm text-muted-foreground">{c.nbEleves} élèves</p>
                <div className="flex flex-wrap gap-1">{c.matieres.map((m, i) => <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
