import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      if (!signInData.user) throw new Error("Utilisateur non trouvé.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Aucun profil n'est associé à ce compte. Contactez l'administrateur.");
      }
      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("Votre compte est désactivé. Contactez l'administrateur de votre établissement.");
      }

      const roleRoutes: Record<string, string> = {
        superadmin: "/superadmin",
        admin: "/admin",
        enseignant: "/enseignant",
        parent: "/parent",
        etudiant: "/etudiant",
        comptable: "/comptable",
      };

      const destination = roleRoutes[profile.role];
      if (!destination) {
        await supabase.auth.signOut();
        throw new Error("Le rôle de ce compte n'est pas reconnu. Contactez l'administrateur.");
      }

      navigate(destination, { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message === "Invalid login credentials" 
          ? "Email ou mot de passe incorrect" 
          : error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-secondary" />
            <span className="text-2xl font-bold text-primary-foreground font-sans">SchoolManager</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary-foreground">Connexion</h1>
          <p className="text-primary-foreground/70 mt-2">Accédez à votre espace</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-xl p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>

          <div className="text-center space-y-2">
            <Link to="/mot-de-passe-oublie" className="text-sm text-secondary hover:underline block">
              Mot de passe oublié ?
            </Link>
            <p className="text-sm text-muted-foreground">
              Pas encore inscrit ?{" "}
              <Link to="/inscription-ecole" className="text-secondary hover:underline">
                Inscrire mon école
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
