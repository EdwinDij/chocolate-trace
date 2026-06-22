import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const PRICE_IDS: Record<string, string> = {
  boutique: Deno.env.get("STRIPE_PRICE_BOUTIQUE")!,
  multi: Deno.env.get("STRIPE_PRICE_MULTI")!,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return new Response("Unauthorized", { status: 401 });

  const { plan, shopId, successUrl, cancelUrl } = await req.json();

  const priceId = PRICE_IDS[plan];
  if (!priceId)
    return new Response(JSON.stringify({ error: "Plan invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: user.email,
    metadata: { user_id: user.id, shop_id: shopId, plan },
    locale: "fr",
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
