import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function AdminClasses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", niveau: "", capacite: "50" });

  const { data: annees } = useQuery({
    queryKey: ["annees", profile?.school_id],
    queryFn: async () => {
      const { data } = await supabase.from("annees_scolaires").select("*").eq("school_id", profile!.school_id!).eq("is_active", true);
      return data || [];
    },
    enabled: !!profile?.school_id,
  });

  const activeAnnee = annees?.[0];

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", profile?.school_id, activeAnnee?.id],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("*").eq("school_id", profile!.school_id!);
      return data || [];
    },
    enabled: !!profile?.school_id,
  });

  const createClass = useMutation({
    mutationFn: async () => {
      if (!activeAnnee) throw new Error("Veuillez d'abord créer une année scolaire active");
      const { error } = await supabase.from("classes").insert({
        school_id: profile!.school_id!,
        annee_id: activeAnnee.id,
        nom: form.nom,
        niveau: form.niveau,
        capacite: parseInt(form.capacite),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setOpen(false);
      toast({ title: "Classe créée avec succès" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-2" />Nouvelle classe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une classe</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Nom de la classe</Label><Input placeholder="Ex: 6ème A" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Niveau</Label><Input placeholder="Ex: 6ème" value={form.niveau} onChange={e => setForm(f => ({ ...f, niveau: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Capacité</Label><Input type="number" value={form.capacite} onChange={e => setForm(f => ({ ...f, capacite: e.target.value }))} /></div>
            </div>
            <Button onClick={() => createClass.mutate()} disabled={!form.nom || !form.niveau || createClass.isPending} className="w-full">
              {createClass.isPending ? "Création..." : "Créer la classe"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-sans">Liste des classes {activeAnnee ? `(${activeAnnee.libelle})` : ""}</CardTitle></CardHeader>
        <CardContent>
          {!activeAnnee ? (
            <p className="text-muted-foreground">Veuillez créer une année scolaire active dans les paramètres.</p>
          ) : isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Niveau</TableHead><TableHead>Capacité</TableHead></TableRow></TableHeader>
              <TableBody>
                {classes?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Aucune classe</TableCell></TableRow>
                ) : classes?.map(c => (
                  <TableRow key={c.id}><TableCell className="font-medium">{c.nom}</TableCell><TableCell>{c.niveau}</TableCell><TableCell>{c.capacite}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
