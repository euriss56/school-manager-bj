import { useEffect, useState } from "react";
import { Home, BookOpen, ClipboardList, Calendar, MessageSquare, Upload, Send } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const sidebarItems = [
  { title: "Tableau de bord", url: "/enseignant", icon: Home },
  { title: "Mes classes", url: "/enseignant/classes", icon: BookOpen },
  { title: "Saisie des notes", url: "/enseignant/notes", icon: ClipboardList },
  { title: "Emploi du temps", url: "/enseignant/emploi-du-temps", icon: Calendar },
  { title: "Messagerie", url: "/enseignant/messagerie", icon: MessageSquare },
  { title: "Ressources", url: "/enseignant/ressources", icon: Upload },
];

export default function EnseignantMessagerie() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    if (!profile?.school_id) return;
    supabase
      .from("profiles")
      .select("id, prenom, nom, role")
      .eq("school_id", profile.school_id)
      .neq("id", profile.id)
      .then(({ data }) => setContacts(data || []));
  }, [profile]);

  useEffect(() => {
    if (!selectedContact || !profile) return;
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(expediteur_id.eq.${profile.id},destinataire_id.eq.${selectedContact}),and(expediteur_id.eq.${selectedContact},destinataire_id.eq.${profile.id})`)
        .order("created_at");
      setMessages(data || []);
      // Mark as read
      await supabase.from("messages").update({ lu: true })
        .eq("destinataire_id", profile.id).eq("expediteur_id", selectedContact);
    };
    load();
  }, [selectedContact, profile]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !profile?.school_id) return;
    await supabase.from("messages").insert({
      expediteur_id: profile.id,
      destinataire_id: selectedContact,
      contenu: newMsg.trim(),
      school_id: profile.school_id,
    });
    setNewMsg("");
    // Reload
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(expediteur_id.eq.${profile.id},destinataire_id.eq.${selectedContact}),and(expediteur_id.eq.${selectedContact},destinataire_id.eq.${profile.id})`)
      .order("created_at");
    setMessages(data || []);
  };

  const contactName = (id: string) => {
    const c = contacts.find(c => c.id === id);
    return c ? `${c.prenom} ${c.nom}` : "Inconnu";
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems} title="Espace Enseignant">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Messagerie</h1>
        <div className="grid md:grid-cols-3 gap-4 h-[500px]">
          <Card className="md:col-span-1">
            <CardHeader><CardTitle className="font-sans text-sm">Contacts</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {contacts.map(c => (
                  <button key={c.id}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selectedContact === c.id ? "bg-secondary/10 text-secondary" : "hover:bg-muted"}`}
                    onClick={() => setSelectedContact(c.id)}>
                    <p className="font-medium text-sm">{c.prenom} {c.nom}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                  </button>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="font-sans text-sm">
                {selectedContact ? contactName(selectedContact) : "Sélectionnez un contact"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-2">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.expediteur_id === profile?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg text-sm ${m.expediteur_id === profile?.id ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
                        {m.contenu}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedContact && (
                <div className="flex gap-2">
                  <Input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    placeholder="Votre message..." onKeyDown={e => e.key === "Enter" && sendMessage()} />
                  <Button onClick={sendMessage} size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
