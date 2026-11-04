import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const roles = ["admin", "enseignant", "parent", "etudiant", "comptable", "superadmin"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!url || !serviceKey || !anonKey) throw new Error("Configuration serveur incomplète.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Non autorisé" }, 401);

    const supabaseAdmin = createClient(url, serviceKey);
    const supabaseAuth = createClient(url, anonKey);
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(authHeader.slice(7));
    if (authError || !caller) return json({ error: "Session invalide" }, 401);

    const { data: callerProfile, error: callerError } = await supabaseAdmin
      .from("profiles").select("role, school_id, is_active").eq("id", caller.id).maybeSingle();
    if (callerError) throw callerError;
    if (!callerProfile || !callerProfile.is_active ||
      !["admin", "superadmin"].includes(callerProfile.role)) {
      return json({ error: "Accès refusé" }, 403);
    }

    // School administrators may manage users only while their school is approved.
    if (callerProfile.role !== "superadmin") {
      if (!callerProfile.school_id) {
        return json({ error: "Aucun établissement associé à votre compte." }, 403);
      }
      const { data: callerSchool, error: schoolError } = await supabaseAdmin
        .from("schools")
        .select("statut")
        .eq("id", callerProfile.school_id)
        .maybeSingle();
      if (schoolError) throw schoolError;
      if (!callerSchool || callerSchool.statut !== "actif") {
        return json({ error: "Votre établissement n'est pas encore validé ou a été suspendu." }, 403);
      }
    }

    const body = await req.json();
    const { action } = body;
    const isSuperadmin = callerProfile.role === "superadmin";

    if (action === "create") {
      const { email, password, prenom, nom, role, telephone } = body;
      if (!email || !password || password.length < 8 || !prenom || !nom || !roles.includes(role)) {
        return json({ error: "Données invalides. Vérifiez les champs et utilisez un mot de passe d'au moins 8 caractères." }, 400);
      }
      if (role === "superadmin" && !isSuperadmin) return json({ error: "Seul un superadmin peut créer un superadmin." }, 403);
      if (!isSuperadmin && !callerProfile.school_id) return json({ error: "Aucun établissement associé à votre compte." }, 403);

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password,
        email_confirm: true,
      });
      if (createError) throw createError;

      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        id: created.user.id,
        email: String(email).trim().toLowerCase(),
        prenom: String(prenom).trim(),
        nom: String(nom).trim(),
        role,
        telephone: telephone || null,
        school_id: isSuperadmin ? (body.school_id ?? null) : callerProfile.school_id,
        is_active: true,
      });
      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        throw profileError;
      }

      const { error: roleError } = await supabaseAdmin.from("user_roles").upsert(
        { user_id: created.user.id, role },
        { onConflict: "user_id,role" },
      );
      if (roleError) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        throw roleError;
      }
      return json({ success: true, user_id: created.user.id });
    }

    if (action === "update" || action === "delete") {
      const userId = body.user_id;
      if (typeof userId !== "string" || userId === caller.id) return json({ error: "Utilisateur cible invalide." }, 400);
      const { data: target, error: targetError } = await supabaseAdmin
        .from("profiles").select("id, role, school_id").eq("id", userId).maybeSingle();
      if (targetError) throw targetError;
      if (!target) return json({ error: "Utilisateur introuvable." }, 404);
      if (!isSuperadmin && (target.school_id !== callerProfile.school_id || target.role === "superadmin")) {
        return json({ error: "Vous ne pouvez pas gérer cet utilisateur." }, 403);
      }

      if (action === "update") {
        const updates: Record<string, unknown> = {};
        if (body.prenom !== undefined) updates.prenom = String(body.prenom).trim();
        if (body.nom !== undefined) updates.nom = String(body.nom).trim();
        if (body.telephone !== undefined) updates.telephone = body.telephone;
        if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
        if (body.role !== undefined) {
          if (!roles.includes(body.role)) return json({ error: "Rôle invalide." }, 400);
          if (body.role === "superadmin" && !isSuperadmin) return json({ error: "Action réservée au superadmin." }, 403);
          updates.role = body.role;
        }
        const { error } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId);
        if (error) throw error;
        if (body.role !== undefined) {
          const { error: deleteRoleError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
          if (deleteRoleError) throw deleteRoleError;
          const { error: insertRoleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: body.role });
          if (insertRoleError) throw insertRoleError;
        }
        return json({ success: true });
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;
      return json({ success: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne";
    return json({ error: message }, 500);
  }
});
