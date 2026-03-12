import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";

export default function AdminInscriptions() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    prenom: "", nom: "", date_naissance: "", lieu_naissance: "", sexe: "M",
    nationalite: "Béninoise", nom_pere: "", telephone_pere: "", nom_mere: "",
    telephone_mere: "", email_parent: "", ancienne_ecole: "", classe_id: "",
  });

  const { data: eleves, isLoading } = useQuery({
    queryKey: ["eleves", profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eleves")
        .select("*, classes(nom)")
        .eq("school_id", profile!.school_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", profile?.school_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", profile!.school_id!);
      return data || [];
    },
    enabled: !!profile?.school_id,
  });

  const createEleve = useMutation({
    mutationFn: async () => {
      const matricule = `MAT-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("eleves").insert({
        school_id: profile!.school_id!,
        matricule,
        prenom: form.prenom,
        nom: form.nom,
        date_naissance: form.date_naissance || null,
        lieu_naissance: form.lieu_naissance || null,
        sexe: form.sexe,
        nationalite: form.nationalite,
        nom_pere: form.nom_pere || null,
        telephone_pere: form.telephone_pere || null,
        nom_mere: form.nom_mere || null,
        telephone_mere: form.telephone_mere || null,
        email_parent: form.email_parent || null,
        ancienne_ecole: form.ancienne_ecole || null,
        classe_id: form.classe_id || null,
        statut_inscription: "en_attente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleves"] });
      setOpen(false);
      toast({ title: "Élève inscrit avec succès" });
      setForm({ prenom: "", nom: "", date_naissance: "", lieu_naissance: "", sexe: "M", nationalite: "Béninoise", nom_pere: "", telephone_pere: "", nom_mere: "", telephone_mere: "", email_parent: "", ancienne_ecole: "", classe_id: "" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from("eleves").update({ statut_inscription: statut as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eleves"] }),
  });

  const filtered = eleves?.filter(e =>
    `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { en_attente: "bg-warning/20 text-warning-foreground", valide: "bg-success/20 text-success", refuse: "bg-destructive/20 text-destructive" };
    return <Badge className={map[s] || ""}>{s === "en_attente" ? "En attente" : s === "valide" ? "Validé" : "Refusé"}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Inscriptions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus className="w-4 h-4 mr-2" />Nouveau élève</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Inscrire un élève</DialogTitle></DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><Label>Prénom *</Label><Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Date de naissance</Label><Input type="date" value={form.date_naissance} onChange={e => setForm(f => ({ ...f, date_naissance: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Lieu de naissance</Label><Input value={form.lieu_naissance} onChange={e => setForm(f => ({ ...f, lieu_naissance: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select value={form.sexe} onValueChange={v => setForm(f => ({ ...f, sexe: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Masculin</SelectItem><SelectItem value="F">Féminin</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classe</Label>
                <Select value={form.classe_id} onValueChange={v => setForm(f => ({ ...f, classe_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nom du père</Label><Input value={form.nom_pere} onChange={e => setForm(f => ({ ...f, nom_pere: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tél. père</Label><Input value={form.telephone_pere} onChange={e => setForm(f => ({ ...f, telephone_pere: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Nom de la mère</Label><Input value={form.nom_mere} onChange={e => setForm(f => ({ ...f, nom_mere: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Tél. mère</Label><Input value={form.telephone_mere} onChange={e => setForm(f => ({ ...f, telephone_mere: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email parent</Label><Input type="email" value={form.email_parent} onChange={e => setForm(f => ({ ...f, email_parent: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Ancienne école</Label><Input value={form.ancienne_ecole} onChange={e => setForm(f => ({ ...f, ancienne_ecole: e.target.value }))} /></div>
            </div>
            <Button onClick={() => createEleve.mutate()} disabled={!form.prenom || !form.nom || createEleve.isPending} className="w-full">
              {createEleve.isPending ? "Inscription..." : "Inscrire l'élève"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher par nom ou matricule..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun élève inscrit</TableCell></TableRow>
                ) : filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">{e.matricule}</TableCell>
                    <TableCell className="font-medium">{e.prenom} {e.nom}</TableCell>
                    <TableCell>{(e as any).classes?.nom || "—"}</TableCell>
                    <TableCell>{e.sexe}</TableCell>
                    <TableCell>{statusBadge(e.statut_inscription)}</TableCell>
                    <TableCell>
                      {e.statut_inscription === "en_attente" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: e.id, statut: "valide" })}>Valider</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus.mutate({ id: e.id, statut: "refuse" })}>Refuser</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
