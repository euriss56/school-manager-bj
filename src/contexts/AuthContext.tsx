import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  school_id: string | null;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  telephone: string | null;
  photo_url: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequestId = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (nextUser: User | null) => {
      const requestId = ++profileRequestId.current;
      if (!mounted) return;

      setUser(nextUser);
      setProfile(null);

      if (!nextUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", nextUser.id)
          .maybeSingle();

        if (error) throw error;
        if (mounted && requestId === profileRequestId.current) {
          setProfile(data as UserProfile | null);
        }
      } catch (error) {
        console.error("Impossible de charger le profil utilisateur :", error);
        if (mounted && requestId === profileRequestId.current) {
          setProfile(null);
        }
      } finally {
        if (mounted && requestId === profileRequestId.current) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Impossible de récupérer la session :", error);
        if (mounted) setLoading(false);
        return;
      }
      void loadProfile(session?.user ?? null);
    });

    return () => {
      mounted = false;
      profileRequestId.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
