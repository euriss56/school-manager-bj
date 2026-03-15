import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  lien: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.lu).length;

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ lu: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("notifications").update({ lu: true }).eq("user_id", user.id).eq("lu", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return { notifications, unreadCount, markAsRead, markAllRead };
}
