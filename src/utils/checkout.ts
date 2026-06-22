import { supabase } from "./supabase";
import type { Plan } from "../hooks/usePlanGate";

export async function startCheckout(
  plan: Exclude<Plan, "gratuit">,
  shopId: string,
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke(
    "create-checkout-session",
    {
      body: {
        plan,
        shopId,
        successUrl: `${window.location.origin}/boutique/${shopId}?checkout=success`,
        cancelUrl: `${window.location.origin}/tarifs`,
      },
    },
  );

  if (error || !data?.url) return false;

  window.location.href = data.url;
  return true;
}
