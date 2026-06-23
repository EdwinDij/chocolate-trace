import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  // Vérifie le token JWT de l'utilisateur
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  // Service role pour bypasser RLS
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { shopName, work, displayName } = await req.json();

  // Créer la boutique
  const { data: shopData, error: shopError } = await admin
    .from("shops")
    .insert({ name: shopName, work, plan: "gratuit", owner_id: user.id })
    .select()
    .single();

  if (shopError || !shopData) {
    return new Response(
      JSON.stringify({ error: "Erreur création boutique", details: shopError }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // Créer le profil gérant
  const { error: memberError } = await admin.from("shop_member").insert({
    user_id: user.id,
    shop_id: shopData.id,
    role: "gerant",
    display_name: displayName || null,
  });

  if (memberError) {
    return new Response(
      JSON.stringify({ error: "Erreur création gérant", details: memberError }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ shop: shopData }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
