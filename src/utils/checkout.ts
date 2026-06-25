import { supabase } from "./supabase";
import type { Plan } from "../hooks/usePlanGate";

export async function startCheckout(
  plan: Exclude<Plan, "gratuit">,
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke(
    "create-checkout-session",
    {
      body: {
        plan,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/tarifs`,
      },
    },
  );

  if (error || !data?.url) return false;
  window.location.href = data.url;
  return true;
}

export async function startPortal(returnUrl?: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke(
    "create-portal-session",
    {
      body: {
        returnUrl: returnUrl ?? `${window.location.origin}/tarifs`,
      },
    },
  );

  if (error || !data?.url) return false;
  window.location.href = data.url;
  return true;
}