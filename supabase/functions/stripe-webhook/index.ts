import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("No signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      sig,
      webhookSecret,
    );
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { shop_id, plan } = session.metadata ?? {};
      if (shop_id && plan) {
        await supabase
          .from("shops")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", shop_id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("shops")
        .update({ plan: "gratuit", stripe_subscription_id: null })
        .eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      if (["past_due", "unpaid", "canceled"].includes(sub.status)) {
        await supabase
          .from("shops")
          .update({ plan: "gratuit" })
          .eq("stripe_subscription_id", sub.id);
      }
      break;
    }
  }

  return new Response("ok");
});
