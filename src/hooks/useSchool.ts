import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSchool() {
  const { profile } = useAuth();

  const { data: school } = useQuery({
    queryKey: ["school-info", profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile!.school_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
    staleTime: 5 * 60 * 1000,
  });

  return school;
}
