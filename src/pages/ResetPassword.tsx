import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (isRecovery) {
        if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast({ title: "Mot de passe modifié", description: "Vous pouvez maintenant vous connecter." });
        await supabase.auth.signOut();
        setIsRecovery(false);
        setPassword("");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/mot-de-passe-oublie`,
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Une erreur est survenue", description: error.message });
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
          <h1 className="text-2xl font-bold text-primary-foreground">{isRecovery ? "Nouveau mot de passe" : "Mot de passe oublié"}</h1>
          <p className="text-primary-foreground/70 mt-2">{isRecovery ? "Choisissez un nouveau mot de passe sécurisé." : "Recevez un lien de réinitialisation par email."}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-8 shadow-xl space-y-5">
          {!isRecovery && !sent && <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
          </div>}
          {isRecovery && <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum" />
          </div>}
          {sent && <p className="text-sm text-muted-foreground">Si cette adresse correspond à un compte, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte de réception.</p>}
          {!sent && <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Veuillez patienter..." : isRecovery ? "Enregistrer le nouveau mot de passe" : "Envoyer le lien"}</Button>}
          <p className="text-center text-sm"><Link to="/login" className="text-secondary hover:underline">Retour à la connexion</Link></p>
        </form>
      </div>
    </div>
  );
}
