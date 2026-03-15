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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, UserPlus } from "lucide-react";

const ROLES = [
  { value: "enseignant", label: "Enseignant" },
  { value: "parent", label: "Parent" },
  { value: "comptable", label: "Comptable" },
  { value: "admin", label: "Administrateur" },
];

interface UserForm {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  role: string;
  telephone: string;
}

const emptyForm: UserForm = { email: "", password: "", prenom: "", nom: "", role: "enseignant", telephone: "" };

export default function AdminUtilisateurs() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["school-users", profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("school_id", profile!.school_id!)
        .neq("id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  const callManageUsers = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message || "Erreur serveur");
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const createUser = useMutation({
    mutationFn: () => callManageUsers({ action: "create", ...form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-users"] });
      setOpen(false);
      setForm(emptyForm);
      toast({ title: "Utilisateur créé avec succès" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const updateUser = useMutation({
    mutationFn: () => callManageUsers({ action: "update", user_id: editId, prenom: form.prenom, nom: form.nom, role: form.role, telephone: form.telephone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-users"] });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast({ title: "Utilisateur modifié" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ user_id, is_active }: { user_id: string; is_active: boolean }) =>
      callManageUsers({ action: "update", user_id, is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["school-users"] }),
  });

  const deleteUser = useMutation({
    mutationFn: (user_id: string) => callManageUsers({ action: "delete", user_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-users"] });
      toast({ title: "Utilisateur supprimé" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  const openEdit = (u: any) => {
    setEditId(u.id);
    setForm({ email: u.email, password: "", prenom: u.prenom, nom: u.nom, role: u.role, telephone: u.telephone || "" });
    setOpen(true);
  };

  const filtered = users?.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-primary/20 text-primary",
      enseignant: "bg-secondary/20 text-secondary-foreground",
      parent: "bg-accent/20 text-accent-foreground",
      comptable: "bg-muted text-muted-foreground",
    };
    return <Badge className={colors[role] || ""}>{ROLES.find(r => r.value === role)?.label || role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><UserPlus className="w-4 h-4 mr-2" />Nouvel utilisateur</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editId ? "Modifier l'utilisateur" : "Créer un utilisateur"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {!editId && (
                <>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Prénom *</Label><Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
            </div>
            <Button
              onClick={() => editId ? updateUser.mutate() : createUser.mutate()}
              disabled={!form.prenom || !form.nom || (!editId && (!form.email || !form.password)) || createUser.isPending || updateUser.isPending}
              className="w-full"
            >
              {(createUser.isPending || updateUser.isPending) ? "En cours..." : editId ? "Modifier" : "Créer l'utilisateur"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Chargement...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun utilisateur</TableCell></TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.prenom} {u.nom}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell>{u.telephone || "—"}</TableCell>
                    <TableCell>
                      <Switch checked={u.is_active} onCheckedChange={v => toggleActive.mutate({ user_id: u.id, is_active: v })} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Supprimer cet utilisateur ?")) deleteUser.mutate(u.id); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
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
