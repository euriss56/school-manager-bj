import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, School } from "lucide-react";

export default function AdminParametres() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ nom: "", ville: "", adresse: "", telephone: "", email: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: school } = useQuery({
    queryKey: ["school-settings", profile?.school_id],
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
  });

  useEffect(() => {
    if (school) {
      setForm({
        nom: school.nom || "",
        ville: school.ville || "",
        adresse: school.adresse || "",
        telephone: school.telephone || "",
        email: school.email || "",
      });
      if (school.logo_url) setLogoPreview(school.logo_url);
    }
  }, [school]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const saveSettings = useMutation({
    mutationFn: async () => {
      let logo_url = school?.logo_url || null;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${profile!.school_id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("logos-ecoles")
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("logos-ecoles").getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("schools")
        .update({
          nom: form.nom,
          ville: form.ville,
          adresse: form.adresse,
          telephone: form.telephone,
          email: form.email,
          logo_url,
        })
        .eq("id", profile!.school_id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-settings"] });
      toast({ title: "Paramètres enregistrés avec succès" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Erreur", description: err.message }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Paramètres de l'école</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-sans">Informations générales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nom de l'école *</Label><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Ville *</Label><Input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Adresse</Label><Input value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Téléphone</Label><Input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending || !form.nom || !form.ville}>
              <Save className="w-4 h-4 mr-2" />{saveSettings.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-sans">Logo de l'école</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="w-32 h-32 mx-auto rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <School className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 py-2 px-4 border border-input rounded-md hover:bg-accent/50 transition-colors text-sm">
                <Upload className="w-4 h-4" /> Changer le logo
              </div>
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </Label>
            {school && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Code : <span className="font-mono font-medium">{school.code_unique}</span></p>
                <p>Plan : <span className="font-medium capitalize">{school.plan}</span></p>
                <p>Statut : <span className="font-medium capitalize">{school.statut}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
