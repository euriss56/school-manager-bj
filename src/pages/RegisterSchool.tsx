import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const villes = [
  "Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Natitingou", "Autre"
];
const types = [
  "École primaire", "Collège", "Lycée", "Université", "École professionnelle"
];
const plans = [
  { value: "basique", label: "Basique — 50 000 FCFA/an" },
  { value: "pro", label: "Pro — 120 000 FCFA/an" },
  { value: "premium", label: "Premium — 250 000 FCFA/an" },
];

export default function RegisterSchool() {
  const [form, setForm] = useState({
    nom_ecole: "", type_ecole: "", ville: "", adresse: "",
    telephone: "", email: "", nb_eleves: "", plan: "basique", password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) {
        throw new Error("Le compte utilisateur n'a pas pu être créé. Réessayez.");
      }

      // A random suffix avoids collisions caused by the previous 4-digit timestamp code.
      const code = `ECO-BJ-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          nom: form.nom_ecole.trim(),
          type: form.type_ecole,
          ville: form.ville,
          adresse: form.adresse.trim(),
          telephone: form.telephone.trim(),
          email: form.email.trim().toLowerCase(),
          plan: form.plan as "basique" | "pro" | "premium",
          statut: "en_attente" as const,
          code_unique: code,
        } as any)
        .select("id")
        .single();

      if (schoolError) {
        throw new Error(`Compte créé, mais la création de l'établissement a échoué : ${schoolError.message}`);
      }
      if (!school?.id) {
        throw new Error("L'établissement a été créé sans identifiant retourné. Contactez l'assistance avant de recommencer.");
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        school_id: school.id,
        prenom: "Admin",
        nom: form.nom_ecole.trim(),
        email: form.email.trim().toLowerCase(),
        role: "admin",
        telephone: form.telephone.trim(),
        is_active: true,
      });

      if (profileError) {
        throw new Error(`Établissement créé, mais le profil administrateur n'a pas été créé : ${profileError.message}. Contactez l'assistance pour finaliser l'inscription.`);
      }

      toast({
        title: "Inscription réussie !",
        description: "Vérifiez votre email pour confirmer votre compte. Votre école sera activée par notre équipe sous 24h.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="text-2xl font-bold text-foreground font-sans">SchoolManager</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Inscrire mon école</h1>
          <p className="text-muted-foreground mt-2">Remplissez le formulaire pour créer votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-8 shadow-sm border border-border space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'établissement *</Label>
              <Input required value={form.nom_ecole} onChange={e => update("nom_ecole", e.target.value)} placeholder="Ex: Collège Les Étoiles" />
            </div>
            <div className="space-y-2">
              <Label>Type d'établissement *</Label>
              <Select value={form.type_ecole} onValueChange={v => update("type_ecole", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville *</Label>
              <Select value={form.ville} onValueChange={v => update("ville", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {villes.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quartier / Adresse</Label>
              <Input value={form.adresse} onChange={e => update("adresse", e.target.value)} placeholder="Ex: Akpakpa, Lot 123" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone du directeur *</Label>
              <Input required type="tel" value={form.telephone} onChange={e => update("telephone", e.target.value)} placeholder="+229 97 00 00 00" />
            </div>
            <div className="space-y-2">
              <Label>Email du directeur *</Label>
              <Input required type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="directeur@ecole.bj" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre d'élèves estimé</Label>
              <Input type="number" value={form.nb_eleves} onChange={e => update("nb_eleves", e.target.value)} placeholder="Ex: 350" />
            </div>
            <div className="space-y-2">
              <Label>Plan choisi *</Label>
              <Select value={form.plan} onValueChange={v => update("plan", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mot de passe administrateur *</Label>
            <Input required type="password" value={form.password} onChange={e => update("password", e.target.value)} placeholder="Minimum 6 caractères" minLength={6} />
          </div>

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Inscription en cours..." : "Inscrire mon école"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Déjà inscrit ? <Link to="/login" className="text-secondary hover:underline">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
