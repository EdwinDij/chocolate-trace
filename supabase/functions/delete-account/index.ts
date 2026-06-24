import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

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

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Récupère les boutiques dont l'utilisateur est propriétaire
  const { data: shops } = await admin
    .from("shops")
    .select("id, stripe_subscription_id")
    .eq("owner_id", user.id);

  if (shops) {
    for (const shop of shops) {
      // Annule l'abonnement Stripe actif
      if (shop.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(shop.stripe_subscription_id);
        } catch (_) {
          // Abonnement déjà annulé ou inexistant, on continue
        }
      }

      const shopId = shop.id;

      // Supprime toutes les données liées à la boutique
      await admin.from("historic").delete().eq("shop_id", shopId);
      await admin.from("invitations").delete().eq("shop_id", shopId);
      await admin.from("batches").delete().eq("shop_id", shopId);
      await admin.from("chocolate_type").delete().eq("shop_id", shopId);
      await admin.from("products").delete().eq("shop_id", shopId);
      await admin.from("shop_member").delete().eq("shop_id", shopId);
      await admin.from("shops").delete().eq("id", shopId);
    }
  }

  // Supprime les entrées shop_member dans des boutiques tierces
  await admin.from("shop_member").delete().eq("user_id", user.id);

  // Supprime le compte auth
  await admin.auth.admin.deleteUser(user.id);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
